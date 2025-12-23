'use client'

/**
 * ============================================
 * PAGE MA CARTE - Version 2.0
 * ============================================
 * 
 * Architecture :
 * 1. HERO CARTE (above the fold) - effet wow, viralité
 * 2. TABS: Stats / Badges / Parrainage
 * 3. RÉGLAGES (toujours visibles en bas)
 * 
 * Objectifs :
 * - Maximiser les partages (bouton ultra-visible)
 * - Valoriser le joueur (badges, stats)
 * - Pousser le parrainage (section dédiée)
 * - Accès rapide aux paramètres
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS, RADIUS, SHADOWS, getAvatarColor, AMBIANCE_CONFIG, POSITION_CONFIG } from '@/app/lib/design-tokens'

export default function MaCartePage() {
  const router = useRouter()
  const cardRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Tabs
  const [activeTab, setActiveTab] = useState('stats')
  
  // Actions
  const [showTournamentMode, setShowTournamentMode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  
  // Stats
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0,
    partners: 0,
    favorites: 0
  })
  
  // Badges
  const [userBadges, setUserBadges] = useState([])
  const [allBadgesCount, setAllBadgesCount] = useState(15)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]

    // === STATS ===
    // Parties jouées (en tant que participant)
    const { data: participations } = await supabase
      .from('match_participants')
      .select(`
        match_id, team,
        matches!inner (id, match_date, winner)
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)

    const matchesPlayed = participations?.length || 0
    let wins = 0
    let losses = 0

    ;(participations || []).forEach(p => {
      if (p.matches?.winner && p.team) {
        if (p.matches.winner === p.team) wins++
        else losses++
      }
    })

    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

    // Parties organisées
    const { count: organized } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    // Favoris
    const { count: favoritesCount } = await supabase
      .from('player_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    // Partenaires uniques (joueurs avec qui on a joué)
    let partnersCount = 0
    if (participations?.length > 0) {
      const matchIds = participations.map(p => p.match_id)
      const { data: coPlayers } = await supabase
        .from('match_participants')
        .select('user_id')
        .in('match_id', matchIds)
        .neq('user_id', session.user.id)
        .eq('status', 'confirmed')
      
      const uniquePartners = new Set((coPlayers || []).map(p => p.user_id))
      partnersCount = uniquePartners.size
    }

    setStats({
      matchesPlayed,
      wins,
      losses,
      winRate,
      organized: organized || 0,
      partners: partnersCount,
      favorites: favoritesCount || 0
    })

    // === BADGES ===
    // Charger les badges avec leurs infos (emoji, name) depuis badge_definitions
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`
        badge_id, 
        earned_at,
        badge_definitions (id, name, emoji, description)
      `)
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })

    setUserBadges(badges || [])

    // Total badges disponibles
    const { count: totalBadges } = await supabase
      .from('badge_definitions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    setAllBadgesCount(totalBadges || 15)

    setLoading(false)
  }

  // === PARTAGE ===
  
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/player/${user?.id}` 
    : ''

  // Générer le QR code
  async function generateQRCode() {
    if (qrCodeUrl) return qrCodeUrl // Déjà généré
    
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(url)
      return url
    } catch (err) {
      console.error('Erreur QR code:', err)
      return null
    }
  }

  // Ouvrir la modale de partage
  async function handleShare() {
    await generateQRCode()
    setShowShareModal(true)
  }

  // Partage natif (depuis la modale)
  async function handleNativeShare() {
    const shareText = `🎾 Mon profil PadelMatch
⭐ Niveau ${profile?.level || '?'}
📍 ${profile?.city || 'France'}

👉 ${profileUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - PadelMatch`,
          text: shareText,
          url: profileUrl
        })
        return
      } catch (err) {
        // Cancelled
      }
    }
    
    // Fallback: WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Impossible de copier le lien')
    }
  }

  async function downloadCard() {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const link = document.createElement('a')
      link.download = `carte-${profile?.name || 'joueur'}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      await copyLink()
      alert('Le lien de ton profil a été copié !')
    } finally {
      setDownloading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Lien de parrainage
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join?ref=${user?.id?.slice(0, 8)}` 
    : ''

  async function shareReferral() {
    const text = `🎾 Rejoins-moi sur PadelMatch, l'app pour organiser des parties de padel entre potes !

👉 ${referralLink}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins PadelMatch !',
          text: text,
          url: referralLink
        })
        return
      } catch (err) {}
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // === CONFIG ===
  
  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both

  // === RENDER ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎴</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  // === MODALE PARTAGE avec QR CODE ===
  if (showShareModal) {
    return (
      <div
        onClick={() => setShowShareModal(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: COLORS.card,
            borderRadius: RADIUS.xl,
            padding: 24,
            width: '100%',
            maxWidth: 320,
            textAlign: 'center'
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>
              📤 Partager ma carte
            </h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
              Scanne ou partage ton profil
            </p>
          </div>

          {/* QR Code */}
          <div style={{
            background: '#fff',
            borderRadius: RADIUS.lg,
            padding: 16,
            marginBottom: 20,
            display: 'inline-block'
          }}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ width: 180, height: 180, display: 'block' }}
              />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                Génération...
              </div>
            )}
          </div>

          {/* Mini carte */}
          <div style={{
            background: COLORS.bg,
            borderRadius: RADIUS.md,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: RADIUS.md,
              background: profile?.avatar_url ? 'transparent' : avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden'
            }}>
              {profile?.avatar_url 
                ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : profile?.name?.[0]?.toUpperCase()
              }
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{profile?.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>⭐ Niveau {profile?.level}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleNativeShare}
              style={{
                width: '100%',
                padding: 14,
                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                border: 'none',
                borderRadius: RADIUS.md,
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📤 Partager
            </button>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1,
                  padding: 12,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.md,
                  fontSize: 13,
                  color: copied ? COLORS.accent : COLORS.text,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {copied ? '✓ Copié !' : '🔗 Copier'}
              </button>
              <button
                onClick={downloadCard}
                disabled={downloading}
                style={{
                  flex: 1,
                  padding: 12,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.md,
                  fontSize: 13,
                  color: COLORS.text,
                  cursor: downloading ? 'wait' : 'pointer',
                  fontWeight: 500
                }}
              >
                {downloading ? '⏳' : '📷'} Image
              </button>
            </div>
          </div>

          {/* Fermer */}
          <button
            onClick={() => setShowShareModal(false)}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // === MODE TOURNOI (Plein écran) ===
  if (showTournamentMode) {
    return (
      <div
        onClick={() => setShowTournamentMode(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24,
          cursor: 'pointer'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 320,
          textAlign: 'center'
        }}>
          {/* Avatar grand */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            background: profile?.avatar_url ? 'transparent' : avatarColor,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            fontWeight: 700,
            color: '#fff',
            border: '4px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : profile?.name?.[0]?.toUpperCase()
            }
          </div>

          {/* Nom */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 24px' }}>
            {profile?.name}
          </h1>

          {/* NIVEAU GÉANT */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '3px solid #22c55e',
            borderRadius: 20,
            padding: '24px 40px',
            marginBottom: 24
          }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
              {profile?.level || '?'}
            </div>
            <div style={{ fontSize: 14, color: '#4ade80', marginTop: 8, fontWeight: 600, letterSpacing: 2 }}>
              NIVEAU
            </div>
          </div>

          {/* Position & Ambiance */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 10, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {position.emoji} {position.label}
            </span>
            <span style={{ background: `${ambiance.color}30`, padding: '8px 16px', borderRadius: 10, color: ambiance.color, fontSize: 14 }}>
              {ambiance.emoji} {ambiance.label}
            </span>
          </div>

          {/* Badges */}
          {userBadges.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {userBadges.slice(0, 4).map(ub => (
                <div key={ub.badge_id} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {ub.badge_definitions?.emoji || '🏅'}
                </div>
              ))}
            </div>
          )}

          {/* QR Code */}
          {qrCodeUrl && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: 8,
                display: 'inline-block'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  style={{ width: 80, height: 80, display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                Scanner pour voir mon profil
              </div>
            </div>
          )}
        </div>

        {/* Logo */}
        <div style={{ marginTop: 32, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          🎾 PadelMatch
        </div>

        {/* Instruction */}
        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Tap pour fermer
        </div>
      </div>
    )
  }

  // === PAGE NORMALE ===
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* ============================================ */}
      {/* HERO - CARTE GÉANTE                         */}
      {/* ============================================ */}
      <div style={{
        background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)',
        padding: '20px 16px 28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Pattern terrain subtil */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#fff', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#fff' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎴 Ma Carte
          </h1>
          <Link
            href="/dashboard/profile/edit"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: RADIUS.md,
              padding: '8px 14px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ✏️ Modifier
          </Link>
        </div>

        {/* Carte principale */}
        <div
          ref={cardRef}
          style={{
            background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
            borderRadius: RADIUS.xl,
            padding: 24,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          {/* Avatar centré */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: RADIUS.xl,
              background: profile?.avatar_url ? 'transparent' : avatarColor,
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
              fontWeight: 700,
              color: '#fff',
              border: '4px solid rgba(255,255,255,0.2)',
              overflow: 'hidden'
            }}>
              {profile?.avatar_url 
                ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : profile?.name?.[0]?.toUpperCase()
              }
            </div>
            
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
              {profile?.name}
            </h2>
            
            {profile?.city && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                📍 {profile.city} {profile?.signup_number && `· Membre #${profile.signup_number}`}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '6px 14px', borderRadius: RADIUS.full, fontSize: 14, fontWeight: 700 }}>
                ⭐ {profile?.level || '?'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: RADIUS.full, fontSize: 13 }}>
                {position.emoji} {position.label}
              </span>
              <span style={{ background: `${ambiance.color}30`, color: ambiance.color, padding: '6px 14px', borderRadius: RADIUS.full, fontSize: 13 }}>
                {ambiance.emoji} {ambiance.label}
              </span>
            </div>
          </div>

          {/* Badges mini (sur la carte) */}
          {userBadges.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {userBadges.slice(0, 4).map(ub => (
                <div key={ub.badge_id} style={{ width: 40, height: 40, borderRadius: RADIUS.md, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {ub.badge_definitions?.emoji || '🏅'}
                </div>
              ))}
              {userBadges.length > 4 && (
                <div style={{ width: 40, height: 40, borderRadius: RADIUS.md, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  +{userBadges.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Branding PadelMatch (pour le partage) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: 'rgba(255,255,255,0.05)',
              padding: '10px 20px',
              borderRadius: RADIUS.full
            }}>
              <span style={{ fontSize: 20 }}>🎾</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 }}>PadelMatch</span>
            </div>
          </div>
        </div>

        {/* Boutons partage - TRÈS VISIBLES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          <button
            onClick={handleShare}
            style={{
              padding: 16,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
              border: 'none',
              borderRadius: RADIUS.md,
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(34,197,94,0.4)'
            }}
          >
            📤 Partager
          </button>
          <button
            onClick={async () => {
              await generateQRCode()
              setShowTournamentMode(true)
            }}
            style={{
              padding: 16,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: RADIUS.md,
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            🏆 Mode Tournoi
          </button>
        </div>

        {/* Actions secondaires */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14, position: 'relative', zIndex: 1 }}>
          <button
            onClick={downloadCard}
            disabled={downloading}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {downloading ? '⏳' : '📷'} Télécharger
          </button>
          <button
            onClick={copyLink}
            style={{
              background: 'none',
              border: 'none',
              color: copied ? COLORS.accent : 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier lien'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABS                                        */}
      {/* ============================================ */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px', overflowX: 'auto' }}>
          {[
            { id: 'stats', label: '📊 Stats' },
            { id: 'badges', label: '🏅 Badges', badge: `${userBadges.length}/${allBadgesCount}` },
            { id: 'referral', label: '🎁 Parrainage' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.id ? COLORS.text : COLORS.card,
                color: activeTab === tab.id ? '#fff' : COLORS.textMuted,
                border: `1px solid ${activeTab === tab.id ? 'transparent' : COLORS.border}`,
                borderRadius: RADIUS.md,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {tab.label}
              {tab.badge && (
                <span style={{ 
                  fontSize: 11, 
                  opacity: 0.8,
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : COLORS.bg,
                  padding: '2px 6px',
                  borderRadius: 6
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* TAB: STATS                                  */}
        {/* ============================================ */}
        {activeTab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Historique de jeu */}
            <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 16, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: '0 0 12px' }}>🎾 Historique de jeu</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Parties', value: stats.matchesPlayed, color: COLORS.text },
                  { label: 'Victoires', value: stats.wins, color: COLORS.accent },
                  { label: 'Défaites', value: stats.losses, color: COLORS.danger },
                  { label: 'Organisées', value: stats.organized, color: COLORS.info }
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: 12, background: COLORS.bg, borderRadius: RADIUS.md }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Réseau */}
            <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 16, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: '0 0 12px' }}>👥 Mon réseau padel</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: COLORS.warningLight, borderRadius: RADIUS.md }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{stats.favorites}</div>
                  <div style={{ fontSize: 10, color: '#92400e' }}>⭐ Favoris</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: COLORS.bg, borderRadius: RADIUS.md }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{stats.partners}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>Partenaires</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: COLORS.accentLight, borderRadius: RADIUS.md }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.accentDark }}>{profile?.referral_count || 0}</div>
                  <div style={{ fontSize: 10, color: COLORS.accentDark }}>🎁 Parrainés</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: BADGES                                 */}
        {/* ============================================ */}
        {activeTab === 'badges' && (
          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>🏅 Ma collection</h3>
              <span style={{ background: COLORS.accentLight, color: COLORS.accentDark, padding: '4px 10px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600 }}>
                {userBadges.length}/{allBadgesCount}
              </span>
            </div>

            {userBadges.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {userBadges.slice(0, 8).map(ub => (
                    <div key={ub.badge_id} style={{ textAlign: 'center', padding: 10, background: COLORS.accentLight, borderRadius: RADIUS.md }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{ub.badge_definitions?.emoji || '🏅'}</div>
                      <div style={{ fontSize: 9, color: COLORS.accentDark, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ub.badge_definitions?.name || 'Badge'}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/dashboard/carte/badges"
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 16,
                    padding: 12,
                    background: COLORS.bg,
                    border: 'none',
                    borderRadius: RADIUS.md,
                    fontSize: 13,
                    color: COLORS.text,
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: 500
                  }}
                >
                  Voir tous les badges →
                </Link>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: COLORS.textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🏅</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Pas encore de badges</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>
                  Joue des parties, invite des amis, et débloque des badges !
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: PARRAINAGE                             */}
        {/* ============================================ */}
        {activeTab === 'referral' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Hero parrainage */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.accentLight}, #bbf7d0)`,
              borderRadius: RADIUS.xl,
              padding: 20,
              border: `1px solid ${COLORS.accent}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.accentDark, margin: '0 0 8px' }}>
                Invite tes potes !
              </h3>
              <p style={{ fontSize: 13, color: '#166534', marginBottom: 16, lineHeight: 1.5 }}>
                Plus tu invites, plus tu débloques de badges exclusifs et tu fais grandir la communauté padel 🎾
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.accentDark }}>
                    {profile?.referral_count || 0}
                  </div>
                  <div style={{ fontSize: 11, color: '#166534' }}>Amis invités</div>
                </div>
              </div>

              <button
                onClick={shareReferral}
                style={{
                  width: '100%',
                  padding: 16,
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: RADIUS.md,
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                }}
              >
                📤 Partager mon lien
              </button>
            </div>

            {/* Badges de parrainage */}
            <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 16, border: `1px solid ${COLORS.border}` }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: '0 0 12px' }}>🏅 Badges à débloquer</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Ambassadeur', goal: 1, emoji: '📢', desc: '1 ami invité' },
                  { name: 'Recruteur', goal: 5, emoji: '🎯', desc: '5 amis invités' },
                  { name: 'Influenceur', goal: 10, emoji: '⭐', desc: '10 amis invités' },
                  { name: 'Légende', goal: 25, emoji: '👑', desc: '25 amis invités' }
                ].map(badge => {
                  const current = profile?.referral_count || 0
                  const progress = Math.min(100, Math.round((current / badge.goal) * 100))
                  const isEarned = current >= badge.goal
                  
                  return (
                    <div key={badge.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: isEarned ? COLORS.accentLight : COLORS.bg,
                      borderRadius: RADIUS.md,
                      opacity: isEarned ? 1 : 0.8
                    }}>
                      <div style={{ fontSize: 28, filter: isEarned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isEarned ? COLORS.accentDark : COLORS.text }}>
                          {badge.name}
                          {isEarned && <span style={{ marginLeft: 6, fontSize: 11 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{badge.desc}</div>
                        {!isEarned && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ height: 4, background: COLORS.border, borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${progress}%`, background: COLORS.accent, borderRadius: 2 }} />
                            </div>
                            <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 2 }}>{current}/{badge.goal}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* RÉGLAGES - TOUJOURS VISIBLES               */}
        {/* ============================================ */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Réglages
          </h3>
          
          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <Link href="/dashboard/profile/edit" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>✏️</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>Modifier mon profil</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
            
            <Link href="/dashboard/settings/notifications" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.borderLight}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>🔔</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>Notifications</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
            
            <Link href="/dashboard/settings/privacy" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.borderLight}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>🔐</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>Confidentialité</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
            
            <Link href="/dashboard/settings/help" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.borderLight}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>❓</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>Aide & FAQ</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
            
            <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.borderLight}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>Proposer une idée</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
            
            <Link href="/terms" style={{ textDecoration: 'none' }}>
              <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.borderLight}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <span style={{ fontSize: 14, color: COLORS.text }}>CGU & Mentions légales</span>
                </div>
                <span style={{ color: COLORS.textLight }}>›</span>
              </div>
            </Link>
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: 16,
              padding: 14,
              background: 'transparent',
              border: `1px solid ${COLORS.danger}`,
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.danger,
              cursor: 'pointer'
            }}
          >
            🚪 Déconnexion
          </button>

          {/* Version */}
          <div style={{ textAlign: 'center', padding: '24px 0', color: COLORS.textLight, fontSize: 11 }}>
            PadelMatch v1.0 · Made with 🎾 in France
          </div>
        </div>
      </div>
    </div>
  )
}