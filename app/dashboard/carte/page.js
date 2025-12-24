'use client'

/**
 * ============================================
 * PAGE MA CARTE - JUNTO BRAND v3
 * ============================================
 * 
 * Nouvelle architecture responsive :
 * - Desktop : 2 colonnes (carte fixe + contenu scrollable)
 * - Mobile : Stack vertical avec tabs
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
  loisir: { emoji: '😌', label: 'Détente', color: JUNTO.teal },
  mix: { emoji: '⚡', label: 'Équilibré', color: JUNTO.amber },
  competition: { emoji: '🔥', label: 'Compétition', color: JUNTO.coral },
  compet: { emoji: '🔥', label: 'Compétition', color: JUNTO.coral }
}

const POSITION_CONFIG = {
  left: { emoji: '⬅️', label: 'Gauche' },
  gauche: { emoji: '⬅️', label: 'Gauche' },
  right: { emoji: '➡️', label: 'Droite' },
  droite: { emoji: '➡️', label: 'Droite' },
  both: { emoji: '↔️', label: 'Polyvalent' }
}

// === COMPOSANT: Les 4 points animés ===
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {AVATAR_COLORS.map((c, i) => (
        <div 
          key={i} 
          className="junto-dot" 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            background: c,
            animationDelay: `${i * 0.15}s`
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Carte Joueur Partageable ===
function PlayerCard({ profile, stats, badges, avatarColor, ambiance, position, forExport = false }) {
  const cardStyle = {
    background: `linear-gradient(145deg, #4a5d6d 0%, ${JUNTO.slate} 50%, #2a3a48 100%)`,
    borderRadius: forExport ? 32 : 28,
    padding: forExport ? 40 : 32,
    position: 'relative',
    boxShadow: forExport ? 'none' : '0 25px 60px rgba(0,0,0,0.4)',
    border: '2px solid rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: forExport ? 400 : 380,
    aspectRatio: forExport ? '1 / 1.2' : 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }

  return (
    <div style={cardStyle}>
      {/* Accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 28,
        bottom: 28,
        width: 6,
        background: `linear-gradient(180deg, ${JUNTO.coral} 0%, ${JUNTO.amber} 100%)`,
        borderRadius: '0 4px 4px 0'
      }} />

      {/* Content */}
      <div style={{ textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{
          width: forExport ? 120 : 100,
          height: forExport ? 120 : 100,
          borderRadius: 28,
          background: profile?.avatar_url ? 'transparent' : avatarColor,
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: forExport ? 52 : 44,
          fontWeight: 700,
          color: JUNTO.white,
          border: '4px solid rgba(255,255,255,0.2)',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
        }}>
          {profile?.avatar_url 
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : profile?.name?.[0]?.toUpperCase()
          }
        </div>

        {/* Name */}
        <h2 style={{ 
          fontSize: forExport ? 32 : 28, 
          fontWeight: 800, 
          color: JUNTO.white, 
          margin: '0 0 8px',
          letterSpacing: -0.5
        }}>
          {profile?.name || 'Joueur'}
        </h2>

        {/* Location */}
        {profile?.city && (
          <div style={{ 
            fontSize: 14, 
            color: 'rgba(255,255,255,0.5)', 
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            📍 {profile.city}
          </div>
        )}

        {/* Level badge - prominent */}
        <div style={{
          background: 'rgba(0, 184, 169, 0.15)',
          border: `2px solid ${JUNTO.teal}`,
          borderRadius: 20,
          padding: '20px 32px',
          display: 'inline-block',
          marginBottom: 20
        }}>
          <div style={{ 
            fontSize: forExport ? 56 : 48, 
            fontWeight: 900, 
            color: '#4eeee0', 
            lineHeight: 1 
          }}>
            {profile?.level || '?'}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: '#4eeee0', 
            marginTop: 6, 
            fontWeight: 600, 
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            Niveau
          </div>
        </div>

        {/* Tags */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 10, 
          flexWrap: 'wrap' 
        }}>
          <span style={{ 
            background: 'rgba(255,255,255,0.1)', 
            color: 'rgba(255,255,255,0.85)', 
            padding: '10px 18px', 
            borderRadius: 100, 
            fontSize: 14, 
            fontWeight: 600 
          }}>
            {position.emoji} {position.label}
          </span>
          <span style={{ 
            background: `${ambiance.color}25`, 
            color: ambiance.color, 
            padding: '10px 18px', 
            borderRadius: 100, 
            fontSize: 14, 
            fontWeight: 600 
          }}>
            {ambiance.emoji} {ambiance.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: JUNTO.white }}>{stats.matchesPlayed}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Parties</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: JUNTO.teal }}>{stats.wins}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Victoires</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: JUNTO.amber }}>{stats.winRate}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Win rate</div>
          </div>
        </div>
      )}

      {/* Badges row */}
      {badges && badges.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 16
        }}>
          {badges.slice(0, 4).map((b, i) => (
            <div key={i} style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              {b.badge_definitions?.emoji || '🏅'}
            </div>
          ))}
        </div>
      )}

      {/* Logo Junto */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          background: 'rgba(0,0,0,0.2)',
          padding: '10px 20px',
          borderRadius: 100
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>junto</span>
          {!forExport && <FourDots size={6} gap={3} />}
          {forExport && (
            <div style={{ display: 'flex', gap: 3 }}>
              {AVATAR_COLORS.map((c, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function MaCartePage() {
  const router = useRouter()
  const cardRef = useRef(null)
  const exportCardRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [activeSection, setActiveSection] = useState('stats')
  
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

    // Stats de jeu
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

    const { count: organized } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    const { count: favoritesCount } = await supabase
      .from('player_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

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
    setDownloading(true)
    
    try {
      // Méthode 1: Utiliser html2canvas si disponible
      const html2canvas = (await import('html2canvas')).default
      
      // Créer un élément temporaire pour l'export
      const exportElement = exportCardRef.current
      if (!exportElement) throw new Error('Element not found')
      
      // Rendre visible temporairement
      exportElement.style.display = 'block'
      exportElement.style.position = 'fixed'
      exportElement.style.left = '-9999px'
      exportElement.style.top = '0'
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(exportElement, {
        backgroundColor: JUNTO.slate,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: 480
      })
      
      exportElement.style.display = 'none'
      
      // Télécharger
      const link = document.createElement('a')
      link.download = `junto-${profile?.name || 'joueur'}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      // Fallback: copier le lien
      await copyLink()
      alert('Le lien de ton profil a été copié ! Tu peux faire une capture d\'écran de ta carte.')
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

  // === SECTIONS CONTENT ===
  const sections = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'badges', label: 'Badges', icon: '🏅', badge: `${userBadges.length}/${allBadgesCount}` },
    { id: 'referral', label: 'Parrainage', icon: '🎁' },
    { id: 'settings', label: 'Réglages', icon: '⚙️' }
  ]

  return (
    <div className="carte-page">
      
      {/* Export card (hidden) */}
      <div ref={exportCardRef} style={{ display: 'none' }}>
        <PlayerCard 
          profile={profile}
          stats={stats}
          badges={userBadges}
          avatarColor={avatarColor}
          ambiance={ambiance}
          position={position}
          forExport={true}
        />
      </div>

      {/* === MODAL PARTAGE === */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            
            <h2 className="modal-title">📤 Partager ma carte</h2>
            <p className="modal-subtitle">Scanne ou partage ton profil</p>

            {/* QR Code */}
            <div className="qr-container">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
              ) : (
                <div className="qr-placeholder">Génération...</div>
              )}
            </div>

            {/* Mini profil */}
            <div className="share-profile">
              <div className="share-avatar" style={{ background: profile?.avatar_url ? 'transparent' : avatarColor }}>
                {profile?.avatar_url 
                  ? <img src={profile.avatar_url} alt="" />
                  : profile?.name?.[0]?.toUpperCase()
                }
              </div>
              <div className="share-info">
                <div className="share-name">{profile?.name}</div>
                <div className="share-level">⭐ Niveau {profile?.level}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="share-actions">
              <button className="btn-share-primary" onClick={handleNativeShare}>
                📤 Partager
              </button>
              <div className="share-actions-row">
                <button className="btn-share-secondary" onClick={copyLink}>
                  {copied ? '✓ Copié !' : '🔗 Copier'}
                </button>
                <button className="btn-share-secondary" onClick={downloadCard} disabled={downloading}>
                  {downloading ? '⏳' : '📷'} Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === LAYOUT PRINCIPAL === */}
      <div className="carte-layout">
        
        {/* COLONNE GAUCHE: Carte */}
        <div className="carte-column">
          <div className="carte-sticky">
            {/* Header */}
            <div className="carte-header">
              <h1 className="carte-title">
                <span>🎴</span> Ma Carte
              </h1>
              <Link href="/dashboard/profile/edit" className="btn-edit">
                ✏️ Modifier
              </Link>
            </div>

            {/* Carte joueur */}
            <div ref={cardRef} className="card-wrapper">
              <PlayerCard 
                profile={profile}
                stats={stats}
                badges={userBadges}
                avatarColor={avatarColor}
                ambiance={ambiance}
                position={position}
              />
            </div>

            {/* Actions de partage */}
            <div className="card-actions">
              <button className="btn-action-primary" onClick={handleShare}>
                📤 Partager ma carte
              </button>
              <div className="card-actions-row">
                <button className="btn-action-secondary" onClick={downloadCard} disabled={downloading}>
                  {downloading ? '⏳ ...' : '📷 Télécharger'}
                </button>
                <button className="btn-action-secondary" onClick={copyLink}>
                  {copied ? '✓ Copié !' : '🔗 Copier lien'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE: Contenu */}
        <div className="content-column">
          
          {/* Navigation */}
          <nav className="content-nav">
            {sections.map(section => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="nav-icon">{section.icon}</span>
                <span className="nav-label">{section.label}</span>
                {section.badge && (
                  <span className="nav-badge">{section.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Contenu des sections */}
          <div className="content-body">
            
            {/* STATS */}
            {activeSection === 'stats' && (
              <div className="section-content">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: JUNTO.slate }}>{stats.matchesPlayed}</div>
                    <div className="stat-label">Parties jouées</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: JUNTO.teal }}>{stats.wins}</div>
                    <div className="stat-label">Victoires</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: JUNTO.coral }}>{stats.losses}</div>
                    <div className="stat-label">Défaites</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: JUNTO.amber }}>{stats.winRate}%</div>
                    <div className="stat-label">Win rate</div>
                  </div>
                </div>

                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon">🎯</div>
                    <div className="info-content">
                      <div className="info-value">{stats.organized}</div>
                      <div className="info-label">Parties organisées</div>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">🤝</div>
                    <div className="info-content">
                      <div className="info-value">{stats.partners}</div>
                      <div className="info-label">Partenaires différents</div>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">⭐</div>
                    <div className="info-content">
                      <div className="info-value">{stats.favorites}</div>
                      <div className="info-label">Joueurs favoris</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BADGES */}
            {activeSection === 'badges' && (
              <div className="section-content">
                <div className="badges-header">
                  <h3>🏅 Ma collection</h3>
                  <span className="badges-count">{userBadges.length}/{allBadgesCount}</span>
                </div>

                {userBadges.length > 0 ? (
                  <div className="badges-grid">
                    {userBadges.map((ub, i) => (
                      <div key={ub.badge_id} className="badge-card">
                        <div className="badge-emoji">{ub.badge_definitions?.emoji || '🏅'}</div>
                        <div className="badge-name">{ub.badge_definitions?.name || 'Badge'}</div>
                        <div className="badge-desc">{ub.badge_definitions?.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🏅</div>
                    <div className="empty-title">Pas encore de badges</div>
                    <div className="empty-text">Joue des parties, invite des amis, et débloque des badges !</div>
                  </div>
                )}
              </div>
            )}

            {/* PARRAINAGE */}
            {activeSection === 'referral' && (
              <div className="section-content">
                <div className="referral-hero">
                  <div className="referral-icon">🎁</div>
                  <h3 className="referral-title">Invite tes potes !</h3>
                  <p className="referral-text">Plus tu invites, plus tu débloques de badges exclusifs</p>
                  
                  <div className="referral-count">
                    <div className="referral-number">{profile?.referral_count || 0}</div>
                    <div className="referral-label">Amis invités</div>
                  </div>

                  <button className="btn-referral" onClick={shareReferral}>
                    📤 Partager mon lien
                  </button>
                </div>

                <div className="referral-badges">
                  <h4>🏅 Badges à débloquer</h4>
                  <div className="referral-badges-list">
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
                        <div key={badge.name} className={`referral-badge ${isEarned ? 'earned' : ''}`}>
                          <div className="rb-emoji">{badge.emoji}</div>
                          <div className="rb-info">
                            <div className="rb-name">
                              {badge.name}
                              {isEarned && <span className="rb-check">✓</span>}
                            </div>
                            <div className="rb-desc">{badge.desc}</div>
                            {!isEarned && (
                              <div className="rb-progress">
                                <div className="rb-bar">
                                  <div className="rb-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="rb-count">{current}/{badge.goal}</span>
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

            {/* SETTINGS */}
            {activeSection === 'settings' && (
              <div className="section-content">
                <div className="settings-list">
                  {[
                    { icon: '✏️', label: 'Modifier mon profil', href: '/dashboard/profile/edit' },
                    { icon: '🔔', label: 'Notifications', href: '/dashboard/settings/notifications' },
                    { icon: '🔐', label: 'Confidentialité', href: '/dashboard/settings/privacy' },
                    { icon: '❓', label: 'Aide & FAQ', href: '/dashboard/settings/help' },
                    { icon: '💡', label: 'Proposer une idée', href: '/dashboard/ideas' },
                    { icon: '📄', label: 'CGU & Mentions légales', href: '/terms' }
                  ].map((item, i) => (
                    <Link key={item.href} href={item.href} className="settings-item">
                      <span className="settings-icon">{item.icon}</span>
                      <span className="settings-label">{item.label}</span>
                      <span className="settings-arrow">›</span>
                    </Link>
                  ))}
                </div>

                <button className="btn-logout" onClick={handleLogout}>
                  🚪 Déconnexion
                </button>

                <div className="app-version">
                  Junto v1.0 · Made with 🎾 in France
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === STYLES === */}
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
        
        @keyframes junto-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .junto-dot { animation: junto-dot 3s ease-in-out infinite; }

        .carte-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
          background: ${JUNTO.bg};
          min-height: 100vh;
          padding-bottom: 100px;
        }

        /* === LAYOUT === */
        .carte-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 40px;
          align-items: start;
        }

        .carte-column {
          position: relative;
        }

        .carte-sticky {
          position: sticky;
          top: 24px;
        }

        .content-column {
          min-height: 600px;
        }

        /* === CARTE HEADER === */
        .carte-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .carte-title {
          font-size: 24px;
          font-weight: 700;
          color: ${JUNTO.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-edit {
          background: ${JUNTO.bgSoft};
          border: 2px solid ${JUNTO.border};
          border-radius: 100px;
          padding: 10px 18px;
          color: ${JUNTO.gray};
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          border-color: ${JUNTO.coral};
          color: ${JUNTO.coral};
        }

        /* === CARD WRAPPER === */
        .card-wrapper {
          display: flex;
          justify-content: center;
        }

        /* === CARD ACTIONS === */
        .card-actions {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-action-primary {
          width: 100%;
          padding: 16px;
          background: ${JUNTO.coral};
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          color: ${JUNTO.white};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 24px ${JUNTO.coralGlow};
          transition: all 0.3s ${SPRING};
        }

        .btn-action-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px ${JUNTO.coralGlow};
        }

        .card-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-action-secondary {
          padding: 14px;
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          color: ${JUNTO.gray};
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action-secondary:hover {
          border-color: ${JUNTO.ink};
          color: ${JUNTO.ink};
        }

        .btn-action-secondary:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* === CONTENT NAV === */
        .content-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid ${JUNTO.border};
          flex-wrap: wrap;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          color: ${JUNTO.gray};
          cursor: pointer;
          transition: all 0.2s ${SPRING};
        }

        .nav-item:hover {
          border-color: ${JUNTO.ink};
          color: ${JUNTO.ink};
        }

        .nav-item.active {
          background: ${JUNTO.ink};
          border-color: ${JUNTO.ink};
          color: ${JUNTO.white};
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-badge {
          font-size: 11px;
          background: rgba(255,255,255,0.2);
          padding: 3px 10px;
          border-radius: 8px;
          font-weight: 700;
        }

        .nav-item:not(.active) .nav-badge {
          background: ${JUNTO.bgSoft};
        }

        /* === SECTION CONTENT === */
        .section-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* === STATS === */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 20px;
          padding: 24px 16px;
          text-align: center;
          transition: all 0.3s ${SPRING};
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: ${JUNTO.muted};
          font-weight: 500;
        }

        .info-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 16px;
          padding: 18px 20px;
        }

        .info-icon {
          font-size: 28px;
        }

        .info-value {
          font-size: 20px;
          font-weight: 700;
          color: ${JUNTO.ink};
        }

        .info-label {
          font-size: 13px;
          color: ${JUNTO.gray};
        }

        /* === BADGES === */
        .badges-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .badges-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: ${JUNTO.ink};
          margin: 0;
        }

        .badges-count {
          background: ${JUNTO.tealSoft};
          color: ${JUNTO.teal};
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }

        .badge-card {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 20px;
          padding: 24px 16px;
          text-align: center;
          transition: all 0.3s ${SPRING};
        }

        .badge-card:hover {
          transform: translateY(-4px);
          border-color: ${JUNTO.amber};
        }

        .badge-emoji {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .badge-name {
          font-size: 14px;
          font-weight: 700;
          color: ${JUNTO.ink};
          margin-bottom: 4px;
        }

        .badge-desc {
          font-size: 11px;
          color: ${JUNTO.muted};
          line-height: 1.4;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 24px;
        }

        .empty-icon {
          font-size: 48px;
          opacity: 0.3;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: ${JUNTO.ink};
          margin-bottom: 8px;
        }

        .empty-text {
          font-size: 14px;
          color: ${JUNTO.gray};
        }

        /* === REFERRAL === */
        .referral-hero {
          background: linear-gradient(135deg, ${JUNTO.tealSoft} 0%, #d1fae5 100%);
          border: 2px solid ${JUNTO.teal};
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          margin-bottom: 24px;
        }

        .referral-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }

        .referral-title {
          font-size: 24px;
          font-weight: 700;
          color: ${JUNTO.teal};
          margin: 0 0 8px;
        }

        .referral-text {
          font-size: 15px;
          color: #047857;
          margin: 0 0 24px;
        }

        .referral-count {
          margin-bottom: 24px;
        }

        .referral-number {
          font-size: 48px;
          font-weight: 800;
          color: ${JUNTO.teal};
        }

        .referral-label {
          font-size: 13px;
          color: #047857;
        }

        .btn-referral {
          width: 100%;
          padding: 16px;
          background: ${JUNTO.teal};
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          color: ${JUNTO.white};
          cursor: pointer;
          box-shadow: 0 8px 24px ${JUNTO.tealGlow};
        }

        .referral-badges {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 24px;
          padding: 24px;
        }

        .referral-badges h4 {
          font-size: 16px;
          font-weight: 600;
          color: ${JUNTO.ink};
          margin: 0 0 20px;
        }

        .referral-badges-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .referral-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: ${JUNTO.bgSoft};
          border-radius: 16px;
        }

        .referral-badge.earned {
          background: ${JUNTO.tealSoft};
        }

        .rb-emoji {
          font-size: 32px;
        }

        .rb-info {
          flex: 1;
        }

        .rb-name {
          font-size: 14px;
          font-weight: 600;
          color: ${JUNTO.ink};
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .referral-badge.earned .rb-name {
          color: ${JUNTO.teal};
        }

        .rb-check {
          font-size: 12px;
        }

        .rb-desc {
          font-size: 12px;
          color: ${JUNTO.gray};
          margin-top: 2px;
        }

        .rb-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .rb-bar {
          flex: 1;
          height: 6px;
          background: ${JUNTO.border};
          border-radius: 3px;
          overflow: hidden;
        }

        .rb-fill {
          height: 100%;
          background: ${JUNTO.teal};
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .rb-count {
          font-size: 11px;
          color: ${JUNTO.muted};
        }

        /* === SETTINGS === */
        .settings-list {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .settings-item {
          display: flex;
          align-items: center;
          padding: 18px 20px;
          text-decoration: none;
          color: ${JUNTO.ink};
          border-top: 1px solid ${JUNTO.border};
          transition: background 0.2s;
        }

        .settings-item:first-child {
          border-top: none;
        }

        .settings-item:hover {
          background: ${JUNTO.bgSoft};
        }

        .settings-icon {
          font-size: 20px;
          margin-right: 14px;
        }

        .settings-label {
          flex: 1;
          font-size: 15px;
        }

        .settings-arrow {
          font-size: 20px;
          color: ${JUNTO.muted};
        }

        .btn-logout {
          width: 100%;
          padding: 16px;
          background: transparent;
          border: 2px solid ${JUNTO.coral};
          border-radius: 16px;
          font-size: 15px;
          font-weight: 600;
          color: ${JUNTO.coral};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: ${JUNTO.coralSoft};
        }

        .app-version {
          text-align: center;
          padding: 32px 0;
          color: ${JUNTO.muted};
          font-size: 13px;
        }

        /* === MODAL === */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
        }

        .modal-content {
          background: ${JUNTO.white};
          border-radius: 28px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${JUNTO.bgSoft};
          border: none;
          font-size: 18px;
          color: ${JUNTO.gray};
          cursor: pointer;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 700;
          color: ${JUNTO.ink};
          margin: 0 0 4px;
          text-align: center;
        }

        .modal-subtitle {
          font-size: 14px;
          color: ${JUNTO.muted};
          margin: 0 0 24px;
          text-align: center;
        }

        .qr-container {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .qr-code {
          width: 180px;
          height: 180px;
        }

        .qr-placeholder {
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${JUNTO.muted};
        }

        .share-profile {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: ${JUNTO.bgSoft};
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .share-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: ${JUNTO.white};
          overflow: hidden;
        }

        .share-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .share-name {
          font-size: 16px;
          font-weight: 600;
          color: ${JUNTO.ink};
        }

        .share-level {
          font-size: 13px;
          color: ${JUNTO.muted};
        }

        .share-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-share-primary {
          width: 100%;
          padding: 16px;
          background: ${JUNTO.coral};
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          color: ${JUNTO.white};
          cursor: pointer;
          box-shadow: 0 4px 16px ${JUNTO.coralGlow};
        }

        .share-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-share-secondary {
          padding: 14px;
          background: ${JUNTO.bgSoft};
          border: 2px solid ${JUNTO.border};
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: ${JUNTO.ink};
          cursor: pointer;
        }

        .btn-share-secondary:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* === RESPONSIVE === */
        @media (max-width: 1024px) {
          .carte-layout {
            grid-template-columns: 1fr;
            gap: 24px;
            max-width: 600px;
          }

          .carte-sticky {
            position: relative;
            top: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .carte-layout {
            padding: 16px;
          }

          .content-nav {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }

          .nav-item {
            padding: 10px 16px;
            font-size: 13px;
          }

          .nav-label {
            display: none;
          }

          .nav-icon {
            font-size: 18px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 20px 12px;
          }

          .stat-value {
            font-size: 26px;
          }

          .badges-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .referral-hero {
            padding: 24px;
          }

          .referral-number {
            font-size: 40px;
          }
        }
      `}</style>
    </div>
  )
}