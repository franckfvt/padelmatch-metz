'use client'

/**
 * ============================================
 * PAGE MA CARTE - JUNTO BRAND v2
 * ============================================
 * 
 * Architecture :
 * 1. HERO CARTE (above the fold) - effet wow, viralité
 * 2. TABS: Stats / Badges / Parrainage
 * 3. RÉGLAGES (toujours visibles en bas)
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === JUNTO DESIGN TOKENS ===
const JUNTO = {
  coral: '#ff5a5f',
  coralSoft: '#fff0f0',
  coralGlow: 'rgba(255, 90, 95, 0.25)',
  slate: '#3d4f5f',
  slateSoft: '#f0f3f5',
  amber: '#ffb400',
  amberSoft: '#fff8e5',
  teal: '#00b8a9',
  tealSoft: '#e5f9f7',
  tealGlow: 'rgba(0, 184, 169, 0.25)',
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  white: '#ffffff',
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  border: '#e5e7eb',
  danger: '#ef4444',
}

const AVATAR_COLORS = [JUNTO.coral, JUNTO.slate, JUNTO.amber, JUNTO.teal]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

const AMBIANCE_CONFIG = {
  chill: { emoji: '😌', label: 'Détente', color: JUNTO.teal },
  mix: { emoji: '⚡', label: 'Équilibré', color: JUNTO.amber },
  competition: { emoji: '🔥', label: 'Compétition', color: JUNTO.coral }
}

const POSITION_CONFIG = {
  left: { emoji: '⬅️', label: 'Gauche' },
  gauche: { emoji: '⬅️', label: 'Gauche' },
  right: { emoji: '➡️', label: 'Droite' },
  droite: { emoji: '➡️', label: 'Droite' },
  both: { emoji: '↔️', label: 'Polyvalent' }
}

export default function MaCartePage() {
  const router = useRouter()
  const cardRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('stats')
  
  const [showTournamentMode, setShowTournamentMode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0,
    partners: 0,
    favorites: 0
  })
  
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

    // Parties jouées
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

    // Partenaires uniques
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

    // Badges
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

  function generateQRCode() {
    if (qrCodeUrl || !profileUrl) return qrCodeUrl
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1e293b&margin=10`
    setQrCodeUrl(qrApiUrl)
    return qrApiUrl
  }

  function handleShare() {
    generateQRCode()
    setShowShareModal(true)
  }

  async function handleNativeShare() {
    const shareText = `🎾 Mon profil Junto
⭐ Niveau ${profile?.level || '?'}
📍 ${profile?.city || 'France'}

👉 ${profileUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - Junto`,
          text: shareText,
          url: profileUrl
        })
        return
      } catch (err) {}
    }
    
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
        backgroundColor: JUNTO.slate,
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
    const text = `🎾 Rejoins-moi sur Junto, l'app pour organiser des parties de padel entre potes !

👉 ${referralLink}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins Junto !',
          text: text,
          url: referralLink
        })
        return
      } catch (err) {}
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // === HELPERS ===
  function getAvatarColor(name) {
    if (!name) return JUNTO.coral
    const index = name.charCodeAt(0) % 4
    return AVATAR_COLORS[index]
  }

  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="junto-loading-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ color: JUNTO.gray }}>Chargement...</div>
        </div>
      </div>
    )
  }

  // === MODAL PARTAGE ===
  if (showShareModal) {
    return (
      <div
        onClick={() => setShowShareModal(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: JUNTO.white,
            borderRadius: 28,
            padding: 24,
            width: '100%',
            maxWidth: 360,
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: JUNTO.ink, margin: '0 0 4px' }}>
              📤 Partager ma carte
            </h2>
            <p style={{ fontSize: 13, color: JUNTO.muted, margin: 0 }}>
              Scanne ou partage ton profil
            </p>
          </div>

          <div style={{
            background: JUNTO.white,
            borderRadius: 20,
            border: `2px solid ${JUNTO.border}`,
            padding: 20,
            marginBottom: 20
          }}>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: JUNTO.muted, margin: '0 auto' }}>
                Génération...
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            background: JUNTO.bgSoft,
            borderRadius: 16,
            marginBottom: 20
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: profile?.avatar_url ? 'transparent' : avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: JUNTO.white,
              overflow: 'hidden'
            }}>
              {profile?.avatar_url 
                ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : profile?.name?.[0]?.toUpperCase()
              }
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: JUNTO.ink }}>{profile?.name}</div>
              <div style={{ fontSize: 13, color: JUNTO.muted }}>⭐ Niveau {profile?.level}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleNativeShare}
              style={{
                width: '100%',
                padding: 16,
                background: JUNTO.coral,
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                color: JUNTO.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 4px 16px ${JUNTO.coralGlow}`
              }}
            >
              📤 Partager
            </button>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={copyLink}
                style={{
                  padding: 14,
                  background: JUNTO.bgSoft,
                  border: `2px solid ${JUNTO.border}`,
                  borderRadius: 12,
                  fontSize: 14,
                  color: copied ? JUNTO.teal : JUNTO.ink,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {copied ? '✓ Copié !' : '🔗 Copier'}
              </button>
              <button
                onClick={downloadCard}
                disabled={downloading}
                style={{
                  padding: 14,
                  background: JUNTO.bgSoft,
                  border: `2px solid ${JUNTO.border}`,
                  borderRadius: 12,
                  fontSize: 14,
                  color: JUNTO.ink,
                  cursor: downloading ? 'wait' : 'pointer',
                  fontWeight: 600
                }}
              >
                {downloading ? '⏳' : '📷'} Image
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowShareModal(false)}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              color: JUNTO.muted,
              fontSize: 14,
              cursor: 'pointer',
              padding: 12
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // === MODE TOURNOI ===
  if (showTournamentMode) {
    return (
      <div
        onClick={() => setShowTournamentMode(false)}
        style={{
          position: 'fixed',
          inset: 0,
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
          background: `linear-gradient(135deg, #4a5d6d 0%, ${JUNTO.slate} 100%)`,
          borderRadius: 28,
          padding: 32,
          width: '100%',
          maxWidth: 320,
          textAlign: 'center',
          position: 'relative',
          border: '2px solid rgba(255,255,255,0.1)'
        }}>
          {/* Barre latérale */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 24,
            bottom: 24,
            width: 6,
            background: JUNTO.coral,
            borderRadius: '0 4px 4px 0'
          }} />

          <div style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: profile?.avatar_url ? 'transparent' : avatarColor,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            fontWeight: 700,
            color: JUNTO.white,
            border: '4px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : profile?.name?.[0]?.toUpperCase()
            }
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: JUNTO.white, margin: '0 0 24px' }}>
            {profile?.name}
          </h1>

          <div style={{
            background: 'rgba(0, 184, 169, 0.15)',
            border: `3px solid ${JUNTO.teal}`,
            borderRadius: 20,
            padding: '24px 40px',
            marginBottom: 24
          }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#4eeee0', lineHeight: 1 }}>
              {profile?.level || '?'}
            </div>
            <div style={{ fontSize: 14, color: '#4eeee0', marginTop: 8, fontWeight: 600, letterSpacing: 2 }}>
              NIVEAU
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 100, color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>
              {position.emoji} {position.label}
            </span>
            <span style={{ background: `${ambiance.color}30`, padding: '10px 18px', borderRadius: 100, color: ambiance.color, fontSize: 14, fontWeight: 600 }}>
              {ambiance.emoji} {ambiance.label}
            </span>
          </div>

          {userBadges.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
              {userBadges.slice(0, 4).map(ub => (
                <div key={ub.badge_id} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {ub.badge_definitions?.emoji || '🏅'}
                </div>
              ))}
            </div>
          )}

          {qrCodeUrl && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ background: JUNTO.white, borderRadius: 12, padding: 8, display: 'inline-block' }}>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: 80, height: 80, display: 'block' }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                Scanner pour voir mon profil
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>junto</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Tap pour fermer
        </div>
      </div>
    )
  }

  // === PAGE NORMALE ===
  return (
    <div style={{ fontFamily: "'Satoshi', sans-serif", background: JUNTO.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 100 }}>
        
        {/* ============================================ */}
        {/* HERO - CARTE */}
        {/* ============================================ */}
        <div style={{
          background: `linear-gradient(180deg, ${JUNTO.slate} 0%, #2a3a48 100%)`,
          padding: '24px 20px 32px',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0 0 32px 32px'
        }}>
          {/* Pattern terrain */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: 0.04, 
            pointerEvents: 'none',
            background: `
              linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,0.5) 49.5%, rgba(255,255,255,0.5) 50.5%, transparent 50.5%),
              linear-gradient(0deg, transparent 49.5%, rgba(255,255,255,0.5) 49.5%, rgba(255,255,255,0.5) 50.5%, transparent 50.5%)
            `
          }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: JUNTO.white, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              🎴 Ma Carte
            </h1>
            <Link
              href="/dashboard/profile/edit"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 100,
                padding: '10px 18px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ✏️ Modifier
            </Link>
          </div>

          {/* CARTE JOUEUR */}
          <div
            ref={cardRef}
            style={{
              background: `linear-gradient(135deg, #4a5d6d 0%, ${JUNTO.slate} 100%)`,
              borderRadius: 24,
              padding: '28px 24px',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Barre latérale Junto - couleur unique */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 24,
              bottom: 24,
              width: 6,
              background: JUNTO.coral,
              borderRadius: '0 4px 4px 0'
            }} />

            {/* Avatar & infos */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                background: profile?.avatar_url ? 'transparent' : avatarColor,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
                fontWeight: 700,
                color: JUNTO.white,
                border: '4px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
              }}>
                {profile?.avatar_url 
                  ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : profile?.name?.[0]?.toUpperCase()
                }
              </div>
              
              <h2 style={{ fontSize: 26, fontWeight: 800, color: JUNTO.white, margin: '0 0 6px', letterSpacing: -0.5 }}>
                {profile?.name}
              </h2>
              
              {profile?.city && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                  📍 {profile.city} {profile?.signup_number && `· Membre #${profile.signup_number}`}
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ 
                  background: 'rgba(0, 184, 169, 0.2)', 
                  color: '#4eeee0', 
                  padding: '8px 16px', 
                  borderRadius: 100, 
                  fontSize: 14, 
                  fontWeight: 700,
                  border: '1px solid rgba(0, 184, 169, 0.3)'
                }}>
                  ⭐ {profile?.level || '?'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', padding: '8px 16px', borderRadius: 100, fontSize: 14, fontWeight: 600 }}>
                  {position.emoji} {position.label}
                </span>
                <span style={{ background: `${ambiance.color}30`, color: ambiance.color, padding: '8px 16px', borderRadius: 100, fontSize: 14, fontWeight: 600 }}>
                  {ambiance.emoji} {ambiance.label}
                </span>
              </div>
            </div>

            {/* Mini badges */}
            {userBadges.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {userBadges.slice(0, 4).map(ub => (
                  <div key={ub.badge_id} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {ub.badge_definitions?.emoji || '🏅'}
                  </div>
                ))}
                {userBadges.length > 4 && (
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    +{userBadges.length - 4}
                  </div>
                )}
              </div>
            )}

            {/* Logo Junto */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                background: 'rgba(0,0,0,0.2)',
                padding: '12px 24px',
                borderRadius: 100
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>junto</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {AVATAR_COLORS.map((c, i) => (
                    <div key={i} className="junto-breathe-dot" style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: c,
                      animationDelay: `${i * 0.15}s`
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons partage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, position: 'relative', zIndex: 1 }}>
            <button
              onClick={handleShare}
              style={{
                padding: 16,
                background: JUNTO.coral,
                border: 'none',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 700,
                color: JUNTO.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: `0 8px 24px ${JUNTO.coralGlow}`
              }}
            >
              📤 Partager
            </button>
            <button
              onClick={() => {
                generateQRCode()
                setShowTournamentMode(true)
              }}
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 16,
                fontSize: 15,
                fontWeight: 600,
                color: JUNTO.white,
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16, position: 'relative', zIndex: 1 }}>
            <button
              onClick={downloadCard}
              disabled={downloading}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: downloading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {downloading ? '⏳' : '📷'} Télécharger
            </button>
            <button
              onClick={copyLink}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? JUNTO.teal : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {copied ? '✓ Copié !' : '🔗 Copier lien'}
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* TABS */}
        {/* ============================================ */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 10, margin: '24px 0 20px', overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'stats', label: '📊 Stats' },
              { id: 'badges', label: '🏅 Badges', badge: `${userBadges.length}/${allBadgesCount}` },
              { id: 'referral', label: '🎁 Parrainage' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 18px',
                  background: activeTab === tab.id ? JUNTO.ink : JUNTO.white,
                  color: activeTab === tab.id ? JUNTO.white : JUNTO.gray,
                  border: `2px solid ${activeTab === tab.id ? JUNTO.ink : JUNTO.border}`,
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: `all 0.2s ${SPRING}`
                }}
              >
                {tab.label}
                {tab.badge && (
                  <span style={{ 
                    fontSize: 11, 
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : JUNTO.bgSoft,
                    padding: '3px 10px',
                    borderRadius: 8,
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ============================================ */}
          {/* TAB: STATS */}
          {/* ============================================ */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Historique de jeu */}
              <div style={{ display: 'flex', background: JUNTO.white, borderRadius: 20, border: `2px solid ${JUNTO.border}`, overflow: 'hidden' }}>
                <div style={{ width: 5, background: JUNTO.teal, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 18 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🎾 Historique de jeu
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Parties', value: stats.matchesPlayed, color: JUNTO.slate },
                      { label: 'Victoires', value: stats.wins, color: JUNTO.teal },
                      { label: 'Défaites', value: stats.losses, color: JUNTO.coral },
                      { label: 'Organisées', value: stats.organized, color: JUNTO.amber }
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: 'center', padding: 14, background: JUNTO.bgSoft, borderRadius: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: JUNTO.muted, fontWeight: 500 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: BADGES */}
          {/* ============================================ */}
          {activeTab === 'badges' && (
            <div style={{ display: 'flex', background: JUNTO.white, borderRadius: 20, border: `2px solid ${JUNTO.border}`, overflow: 'hidden' }}>
              <div style={{ width: 5, background: JUNTO.amber, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏅 Ma collection
                  </h3>
                  <span style={{ background: JUNTO.tealSoft, color: JUNTO.teal, padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 700 }}>
                    {userBadges.length}/{allBadgesCount}
                  </span>
                </div>

                {userBadges.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {userBadges.slice(0, 8).map((ub, i) => (
                        <div key={ub.badge_id} style={{ 
                          textAlign: 'center', 
                          padding: 14, 
                          background: JUNTO.tealSoft, 
                          borderRadius: 14 
                        }}>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>{ub.badge_definitions?.emoji || '🏅'}</div>
                          <div style={{ fontSize: 10, color: JUNTO.gray, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        padding: 14,
                        background: JUNTO.bgSoft,
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 14,
                        color: JUNTO.ink,
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 600
                      }}
                    >
                      Voir tous les badges →
                    </Link>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: JUNTO.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🏅</div>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>Pas encore de badges</div>
                    <div style={{ fontSize: 12, color: JUNTO.gray }}>
                      Joue des parties, invite des amis, et débloque des badges !
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: PARRAINAGE */}
          {/* ============================================ */}
          {activeTab === 'referral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Hero parrainage */}
              <div style={{
                background: `linear-gradient(135deg, ${JUNTO.tealSoft} 0%, #d1fae5 100%)`,
                borderRadius: 20,
                padding: 24,
                border: `2px solid ${JUNTO.teal}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: JUNTO.teal, margin: '0 0 8px' }}>
                  Invite tes potes !
                </h3>
                <p style={{ fontSize: 14, color: '#047857', marginBottom: 20, lineHeight: 1.6 }}>
                  Plus tu invites, plus tu débloques de badges exclusifs et tu fais grandir la communauté padel 🎾
                </p>
                
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: JUNTO.teal }}>
                    {profile?.referral_count || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#047857' }}>Amis invités</div>
                </div>

                <button
                  onClick={shareReferral}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: JUNTO.teal,
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 700,
                    color: JUNTO.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: `0 4px 16px ${JUNTO.tealGlow}`
                  }}
                >
                  📤 Partager mon lien
                </button>
              </div>

              {/* Badges de parrainage */}
              <div style={{ display: 'flex', background: JUNTO.white, borderRadius: 20, border: `2px solid ${JUNTO.border}`, overflow: 'hidden' }}>
                <div style={{ width: 5, background: JUNTO.teal, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 18 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏅 Badges à débloquer
                  </h4>
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
                          gap: 14,
                          padding: 14,
                          background: isEarned ? JUNTO.tealSoft : JUNTO.bgSoft,
                          borderRadius: 14,
                          opacity: isEarned ? 1 : 0.8
                        }}>
                          <div style={{ fontSize: 32, filter: isEarned ? 'none' : 'grayscale(0.5)' }}>{badge.emoji}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: isEarned ? JUNTO.teal : JUNTO.ink }}>
                              {badge.name}
                              {isEarned && <span style={{ marginLeft: 6, fontSize: 12 }}>✓</span>}
                            </div>
                            <div style={{ fontSize: 12, color: JUNTO.gray }}>{badge.desc}</div>
                            {!isEarned && (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ height: 6, background: JUNTO.border, borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${progress}%`, background: JUNTO.teal, borderRadius: 3 }} />
                                </div>
                                <div style={{ fontSize: 11, color: JUNTO.muted, marginTop: 4 }}>{current}/{badge.goal}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* RÉGLAGES */}
          {/* ============================================ */}
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: JUNTO.ink, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Réglages
            </h3>
            
            <div style={{ background: JUNTO.white, borderRadius: 20, border: `2px solid ${JUNTO.border}`, overflow: 'hidden' }}>
              {[
                { icon: '✏️', label: 'Modifier mon profil', href: '/dashboard/profile/edit' },
                { icon: '🔔', label: 'Notifications', href: '/dashboard/settings/notifications' },
                { icon: '🔐', label: 'Confidentialité', href: '/dashboard/settings/privacy' },
                { icon: '❓', label: 'Aide & FAQ', href: '/dashboard/settings/help' },
                { icon: '💡', label: 'Proposer une idée', href: '/dashboard/ideas' },
                { icon: '📄', label: 'CGU & Mentions légales', href: '/terms' }
              ].map((item, i) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  style={{ 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    borderTop: i > 0 ? `1px solid ${JUNTO.border}` : 'none',
                    color: JUNTO.ink,
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ fontSize: 14 }}>{item.label}</span>
                  </div>
                  <span style={{ color: JUNTO.muted, fontSize: 18 }}>›</span>
                </Link>
              ))}
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 16,
                background: 'transparent',
                border: `2px solid ${JUNTO.coral}`,
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                color: JUNTO.coral,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              🚪 Déconnexion
            </button>

            <div style={{ textAlign: 'center', padding: '28px 0', color: JUNTO.muted, fontSize: 12 }}>
              Junto v1.0 · Made with 🎾 in France
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes junto-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
        .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
        .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
        .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
        .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }
        
        @keyframes junto-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .junto-breathe-dot { animation: junto-breathe 3s ease-in-out infinite; }
      `}</style>
    </div>
  )
}