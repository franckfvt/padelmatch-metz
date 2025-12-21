'use client'

/**
 * ============================================
 * PAGE MA CARTE - Profil et partage
 * ============================================
 * 
 * Sections:
 * - Carte visuelle du joueur (grande)
 * - Boutons de partage
 * - Stats
 * - Badges
 * - Paramètres
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS, RADIUS, SHADOWS, getAvatarColor, AMBIANCE_CONFIG } from '@/app/lib/design-tokens'
import { getBadgeById } from '@/app/lib/badges'

export default function MaCartePage() {
  const router = useRouter()
  const cardRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Actions
  const [showTournamentMode, setShowTournamentMode] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0
  })
  
  // Badges
  const [userBadges, setUserBadges] = useState([])

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

    setStats({
      matchesPlayed,
      wins,
      losses,
      winRate,
      organized: organized || 0
    })

    // === BADGES ===
    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })

    setUserBadges(badges || [])

    setLoading(false)
  }

  // === PARTAGE ===
  
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/player/${user?.id}` 
    : ''

  async function handleShare() {
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

  // === CONFIG ===
  
  const positionConfig = {
    left: { emoji: '⬅️', label: 'Gauche' },
    right: { emoji: '➡️', label: 'Droite' },
    both: { emoji: '↔️', label: 'Polyvalent' }
  }

  const avatarColor = getAvatarColor(profile?.name)
  const badge = profile?.badge ? getBadgeById(profile.badge) : null
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = positionConfig[profile?.position] || positionConfig.both

  // === RENDER ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎴</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
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
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          display: 'flex',
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
          maxWidth: 350,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          {/* Avatar grand */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: profile?.avatar_url ? 'transparent' : avatarColor,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: '#fff',
            border: '4px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile?.name?.[0]?.toUpperCase()
            }
          </div>

          {/* Nom */}
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#fff', 
            margin: '0 0 8px'
          }}>
            {profile?.name}
          </h1>

          {/* Niveau grand */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 50,
            marginBottom: 20
          }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
              {profile?.level || '?'}
            </span>
          </div>

          {/* Infos */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 20,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 16
          }}>
            <span>{position.emoji} {position.label}</span>
            <span>{ambiance.emoji} {ambiance.label}</span>
          </div>

          {/* Badge */}
          {badge && (
            <div style={{
              marginTop: 20,
              padding: 12,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12
            }}>
              <span style={{ fontSize: 28 }}>{badge.icon}</span>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                {badge.name}
              </div>
            </div>
          )}

          {/* Hint */}
          <div style={{ 
            marginTop: 24, 
            fontSize: 13, 
            color: 'rgba(255,255,255,0.4)' 
          }}>
            Touche pour fermer
          </div>
        </div>
      </div>
    )
  }

  // === PAGE NORMALE ===
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '0 16px 100px' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.text }}>
          🎴 Ma carte
        </h1>
      </div>

      {/* ============================================ */}
      {/* CARTE PRINCIPALE                            */}
      {/* ============================================ */}
      <div
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
          borderRadius: RADIUS.xl,
          padding: 24,
          marginBottom: 16,
          boxShadow: SHADOWS.lg
        }}
      >
        {/* Header carte */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: profile?.avatar_url ? 'transparent' : avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            border: '3px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile?.name?.[0]?.toUpperCase()
            }
          </div>

          {/* Infos */}
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              fontSize: 22, 
              fontWeight: 700, 
              color: '#fff', 
              margin: '0 0 6px'
            }}>
              {profile?.name}
            </h2>
            
            {/* Niveau */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              marginBottom: 8
            }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>
                Niveau {profile?.level || '?'}
              </span>
            </div>

            {/* Ville */}
            {profile?.city && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                📍 {profile.city}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginTop: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)'
          }}>
            {position.emoji} {position.label}
          </div>
          <div style={{
            padding: '6px 12px',
            background: `${ambiance.color}30`,
            borderRadius: 20,
            fontSize: 13,
            color: ambiance.color
          }}>
            {ambiance.emoji} {ambiance.label}
          </div>
        </div>

        {/* Badges sur la carte */}
        {userBadges.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {userBadges.slice(0, 4).map(ub => {
              const b = getBadgeById(ub.badge_id)
              if (!b) return null
              return (
                <div
                  key={ub.badge_id}
                  title={b.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18
                  }}
                >
                  {b.icon}
                </div>
              )
            })}
            {userBadges.length > 4 && (
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)'
              }}>
                +{userBadges.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOUTONS DE PARTAGE                          */}
      {/* ============================================ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 10, 
        marginBottom: 24 
      }}>
        <button
          onClick={handleShare}
          style={{
            padding: 14,
            background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
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

        <button
          onClick={() => setShowTournamentMode(true)}
          style={{
            padding: 14,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          🏆 Mode Tournoi
        </button>

        <button
          onClick={copyLink}
          style={{
            padding: 14,
            background: COLORS.card,
            border: `1px solid ${copied ? COLORS.accent : COLORS.border}`,
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            color: copied ? COLORS.accent : COLORS.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {copied ? '✓ Copié !' : '📋 Copier lien'}
        </button>

        <button
          onClick={downloadCard}
          disabled={downloading}
          style={{
            padding: 14,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.text,
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {downloading ? '⏳...' : '📷 Image'}
        </button>
      </div>

      {/* Modifier profil */}
      <Link
        href="/dashboard/profile/edit"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 14,
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          color: COLORS.text,
          textDecoration: 'none',
          marginBottom: 32
        }}
      >
        ✏️ Modifier mon profil
      </Link>

      {/* ============================================ */}
      {/* STATISTIQUES                                */}
      {/* ============================================ */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
          📊 Mes statistiques
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 10 
        }}>
          <div style={{
            background: COLORS.card,
            borderRadius: RADIUS.md,
            padding: 16,
            textAlign: 'center',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>
              {stats.matchesPlayed}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Parties</div>
          </div>
          <div style={{
            background: COLORS.card,
            borderRadius: RADIUS.md,
            padding: 16,
            textAlign: 'center',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>
              {stats.wins}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Victoires</div>
          </div>
          <div style={{
            background: COLORS.card,
            borderRadius: RADIUS.md,
            padding: 16,
            textAlign: 'center',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>
              {stats.winRate}%
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>Win rate</div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* BADGES                                      */}
      {/* ============================================ */}
      {userBadges.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
            🏅 Mes badges
          </h2>
          <div style={{ 
            display: 'flex', 
            gap: 10,
            flexWrap: 'wrap'
          }}>
            {userBadges.map(ub => {
              const b = getBadgeById(ub.badge_id)
              if (!b) return null
              return (
                <div
                  key={ub.badge_id}
                  style={{
                    background: COLORS.card,
                    borderRadius: RADIUS.md,
                    padding: 12,
                    textAlign: 'center',
                    border: `1px solid ${COLORS.border}`,
                    minWidth: 80
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{b.icon}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{b.name}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PARAMÈTRES                                  */}
      {/* ============================================ */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
          ⚙️ Paramètres
        </h2>
        <div style={{
          background: COLORS.card,
          borderRadius: RADIUS.md,
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden'
        }}>
          <Link
            href="/dashboard/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderBottom: `1px solid ${COLORS.border}`,
              textDecoration: 'none',
              color: COLORS.text
            }}
          >
            <span>⚙️ Paramètres du compte</span>
            <span style={{ color: COLORS.textMuted }}>→</span>
          </Link>
          <Link
            href="/dashboard/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderBottom: `1px solid ${COLORS.border}`,
              textDecoration: 'none',
              color: COLORS.text
            }}
          >
            <span>🔔 Notifications</span>
            <span style={{ color: COLORS.textMuted }}>→</span>
          </Link>
          <Link
            href="/help"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              textDecoration: 'none',
              color: COLORS.text
            }}
          >
            <span>❓ Aide</span>
            <span style={{ color: COLORS.textMuted }}>→</span>
          </Link>
        </div>
      </div>

      {/* ============================================ */}
      {/* DÉCONNEXION                                 */}
      {/* ============================================ */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: 14,
          background: 'transparent',
          border: `1px solid #ef4444`,
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          color: '#ef4444',
          cursor: 'pointer'
        }}
      >
        🚪 Déconnexion
      </button>

    </div>
  )
}