'use client'

/**
 * ============================================
 * PAGE MA CARTE - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * Layout : 2 colonnes (carte sticky + contenu scroll)
 * 
 * Fonctionnalités complètes :
 * - Carte joueur avec avatar carré, nom, niveau, position, ambiance
 * - Partage (QR code, lien, image téléchargeable, partage natif)
 * - Stats (parties, victoires, défaites, win rate)
 * - Badges avec progression
 * - Parrainage avec compteur
 * - Réglages complets + Déconnexion
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e5',
  p3Soft: '#e5f9f7',
  p4Soft: '#f0edff',
  
  // Glows
  p1Glow: 'rgba(255, 90, 95, 0.25)',
  p3Glow: 'rgba(0, 184, 169, 0.25)',
  
  // Interface sobre
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  cardDark: '#1a1a1a',
  
  // Borders
  border: '#e5e7eb',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

const AMBIANCE_CONFIG = {
  chill: { emoji: '😌', label: 'Détente', color: COLORS.p3 },
  loisir: { emoji: '😌', label: 'Détente', color: COLORS.p3 },
  mix: { emoji: '⚡', label: 'Équilibré', color: COLORS.p2 },
  competition: { emoji: '🔥', label: 'Compétition', color: COLORS.p1 },
  compet: { emoji: '🔥', label: 'Compétition', color: COLORS.p1 }
}

const POSITION_CONFIG = {
  left: { emoji: '⬅️', label: 'Gauche' },
  gauche: { emoji: '⬅️', label: 'Gauche' },
  right: { emoji: '➡️', label: 'Droite' },
  droite: { emoji: '➡️', label: 'Droite' },
  both: { emoji: '↔️', label: 'Polyvalent' }
}

// === COMPOSANT: Les 4 points animés ===
function FourDots({ size = 8, gap = 4, animate = true }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          className={animate ? 'dot-breathe' : ''}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size > 10 ? 4 : '50%', 
            background: c,
            animationDelay: animate ? `${i * 0.15}s` : undefined
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Carte Joueur 2×2 (pour affichage ET export) ===
function PlayerCard({ profile, avatarColor, ambiance, position, forExport = false }) {
  return (
    <div style={{
      background: COLORS.cardDark,
      borderRadius: forExport ? 0 : 28,
      padding: forExport ? '48px 40px' : 36,
      position: 'relative',
      boxShadow: forExport ? 'none' : '0 24px 60px rgba(0,0,0,0.25)',
      width: forExport ? 400 : '100%',
      maxWidth: forExport ? 400 : 380,
      minHeight: forExport ? 540 : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>

      {/* Contenu */}
      <div style={{ textAlign: 'center' }}>
        
        {/* Avatar carré arrondi */}
        <div style={{
          width: forExport ? 100 : 100,
          height: forExport ? 100 : 100,
          borderRadius: 24,
          background: profile?.avatar_url ? COLORS.bgSoft : avatarColor,
          margin: forExport ? '0 auto 24px' : '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: forExport ? 44 : 44,
          fontWeight: 700,
          color: COLORS.white,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
        }}>
          {profile?.avatar_url 
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : profile?.name?.[0]?.toUpperCase() || '?'
          }
        </div>

        {/* Nom */}
        <h2 style={{ 
          fontSize: forExport ? 28 : 28, 
          fontWeight: 800, 
          color: COLORS.white, 
          margin: '0 0 8px',
          letterSpacing: -0.5
        }}>
          {profile?.name || 'Joueur'}
        </h2>

        {/* Ville & Numéro membre */}
        <div style={{ 
          fontSize: 14, 
          color: 'rgba(255,255,255,0.5)', 
          marginBottom: forExport ? 28 : 28,
          minHeight: 20
        }}>
          {profile?.city ? (
            <>📍 {profile.city}{profile?.signup_number && ` · Membre #${profile.signup_number}`}</>
          ) : (
            forExport ? '🎾 Joueur 2×2' : null
          )}
        </div>

        {/* Niveau - Badge principal */}
        <div style={{
          display: 'inline-block',
          background: `${COLORS.p3}20`,
          border: `2px solid ${COLORS.p3}`,
          borderRadius: 20,
          padding: forExport ? '20px 44px' : '20px 44px',
          marginBottom: forExport ? 28 : 28
        }}>
          <div style={{ 
            fontSize: forExport ? 52 : 52, 
            fontWeight: 900, 
            color: COLORS.p3, 
            lineHeight: 1 
          }}>
            {profile?.level || '?'}
          </div>
          <div style={{ 
            fontSize: 11, 
            color: COLORS.p3, 
            marginTop: 8, 
            fontWeight: 600, 
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            Niveau
          </div>
        </div>

        {/* Tags position & ambiance */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 10, 
          flexWrap: 'wrap',
          marginBottom: forExport ? 28 : 28
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
            background: `${ambiance.color}30`, 
            color: ambiance.color, 
            padding: '10px 18px', 
            borderRadius: 100, 
            fontSize: 14, 
            fontWeight: 600 
          }}>
            {ambiance.emoji} {ambiance.label}
          </span>
        </div>

        {/* Logo 2×2 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          paddingTop: forExport ? 24 : 24,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            background: 'rgba(255,255,255,0.05)',
            padding: forExport ? '12px 24px' : '12px 24px',
            borderRadius: 100
          }}>
            <span style={{ 
              fontSize: forExport ? 18 : 18, 
              fontWeight: 900, 
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: -1
            }}>
              2×2
            </span>
            <FourDots size={forExport ? 7 : 7} gap={forExport ? 4 : 4} animate={!forExport} />
          </div>
        </div>
      </div>
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function MaCartePage() {
  const router = useRouter()
  const exportRef = useRef(null)
  
  // États
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [showShareModal, setShowShareModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0
  })
  
  const [userBadges, setUserBadges] = useState([])
  const [allBadgesCount, setAllBadgesCount] = useState(15)

  // Chargement initial
  useEffect(() => {
    loadData()
  }, [])

  // === CHARGEMENT DES DONNÉES ===
  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]

    // Stats - Participations aux matchs
    const { data: participations } = await supabase
      .from('match_participants')
      .select(`match_id, team, matches!inner (id, match_date, winner)`)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)

    const matchesPlayed = participations?.length || 0
    let wins = 0, losses = 0

    ;(participations || []).forEach(p => {
      if (p.matches?.winner && p.team) {
        if (p.matches.winner === p.team) wins++
        else losses++
      }
    })

    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

    // Matchs organisés
    const { count: organized } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    setStats({ matchesPlayed, wins, losses, winRate, organized: organized || 0 })

    // Badges de l'utilisateur
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`badge_id, earned_at, badge_definitions (id, name, emoji, description)`)
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })

    setUserBadges(badges || [])

    // Total des badges disponibles
    const { count: totalBadges } = await supabase
      .from('badge_definitions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    setAllBadgesCount(totalBadges || 15)
    setLoading(false)
  }

  // === PARTAGE ===
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/player/${user?.id}` : ''

  function generateQRCode() {
    if (qrCodeUrl || !profileUrl) return qrCodeUrl
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1a1a1a&margin=10`
    setQrCodeUrl(url)
    return url
  }

  function handleShare() {
    generateQRCode()
    setShowShareModal(true)
  }

  async function handleNativeShare() {
    const shareText = `🎾 Mon profil 2×2\n⭐ Niveau ${profile?.level || '?'}\n📍 ${profile?.city || 'France'}\n\n👉 ${profileUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} - 2×2`, text: shareText, url: profileUrl })
        return
      } catch (err) {
        // Fallback si annulé
      }
    }
    // Fallback WhatsApp
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
      const html2canvas = (await import('html2canvas')).default
      const element = exportRef.current
      if (!element) throw new Error('Element not found')
      
      // Rendre visible pour capture
      element.style.position = 'fixed'
      element.style.left = '0'
      element.style.top = '0'
      element.style.zIndex = '-9999'
      element.style.opacity = '1'
      element.style.pointerEvents = 'none'
      element.style.display = 'block'
      element.style.width = '400px'
      element.style.height = '540px'
      element.style.background = COLORS.cardDark
      element.style.padding = '0'
      element.style.overflow = 'hidden'
      
      // Attendre le rendu
      await new Promise(r => setTimeout(r, 300))
      
      const canvas = await html2canvas(element, {
        backgroundColor: COLORS.cardDark,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: 540,
        windowWidth: 400,
        windowHeight: 540
      })
      
      // Cacher à nouveau
      element.style.display = 'none'
      
      // Télécharger
      const link = document.createElement('a')
      link.download = `2x2-${(profile?.name || 'carte').toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      await copyLink()
      alert('Le lien a été copié ! Tu peux aussi faire une capture d\'écran de ta carte.')
    } finally {
      setDownloading(false)
    }
  }

  // === DÉCONNEXION ===
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // === PARRAINAGE ===
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${user?.id?.slice(0, 8)}` : ''

  async function shareReferral() {
    const text = `🎾 Rejoins-moi sur 2×2, l'app pour organiser des parties de padel !\n\n👉 ${referralLink}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rejoins 2×2 !', text, url: referralLink })
        return
      } catch (err) {
        // Fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // === HELPERS ===
  function getAvatarColor(name) {
    if (!name) return COLORS.p1
    return PLAYER_COLORS[name.charCodeAt(0) % 4]
  }

  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-dots">
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-dots {
            display: flex;
            gap: 8px;
          }
          .loading-dot {
            width: 16px;
            height: 16px;
            border-radius: 6px;
            animation: loadBounce 1.4s ease-in-out infinite;
          }
          @keyframes loadBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    )
  }

  // === RENDER ===
  return (
    <div className="carte-page">
      
      {/* Élément caché pour export */}
      <div ref={exportRef} style={{ display: 'none' }}>
        <PlayerCard 
          profile={profile}
          avatarColor={avatarColor}
          ambiance={ambiance}
          position={position}
          forExport={true}
        />
      </div>

      {/* Modal partage */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            
            <h2 className="modal-title">📤 Partager ma carte</h2>
            <p className="modal-subtitle">Scanne ou partage ton profil</p>

            <div className="qr-box">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-img" />
              ) : (
                <div className="qr-loading">Génération...</div>
              )}
            </div>

            <div className="modal-profile">
              <div className="modal-avatar" style={{ background: profile?.avatar_url ? 'transparent' : avatarColor }}>
                {profile?.avatar_url 
                  ? <img src={profile.avatar_url} alt="" />
                  : profile?.name?.[0]?.toUpperCase()
                }
              </div>
              <div>
                <div className="modal-name">{profile?.name}</div>
                <div className="modal-level">⭐ Niveau {profile?.level}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleNativeShare}>📤 Partager</button>
              <div className="modal-actions-row">
                <button className="btn-gray" onClick={copyLink}>
                  {copied ? '✓ Copié !' : '🔗 Copier'}
                </button>
                <button className="btn-gray" onClick={downloadCard} disabled={downloading}>
                  {downloading ? '⏳' : '📷'} Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="page-layout">
        
        {/* COLONNE GAUCHE: Carte */}
        <div className="card-column">
          <div className="card-sticky">
            <div className="card-header">
              <h1 className="page-title"><span>🎴</span> Ma Carte</h1>
              <Link href="/dashboard/profile/edit" className="btn-edit">✏️ Modifier</Link>
            </div>

            <div className="card-wrapper">
              <PlayerCard 
                profile={profile}
                avatarColor={avatarColor}
                ambiance={ambiance}
                position={position}
              />
            </div>

            <div className="card-actions">
              <button className="btn-primary full" onClick={handleShare}>📤 Partager ma carte</button>
              <div className="card-actions-row">
                <button className="btn-outline" onClick={downloadCard} disabled={downloading}>
                  {downloading ? '⏳ ...' : '📷 Télécharger'}
                </button>
                <button className="btn-outline" onClick={copyLink}>
                  {copied ? '✓ Copié !' : '🔗 Copier lien'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE: Contenu */}
        <div className="content-column">
          
          {/* SECTION: Stats */}
          <div className="content-card">
            <div className="card-bar p3" />
            <div className="card-body">
              <h3 className="section-title">📊 Mes statistiques</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value ink">{stats.matchesPlayed}</div>
                  <div className="stat-label">Parties</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value p3">{stats.wins}</div>
                  <div className="stat-label">Victoires</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value p1">{stats.losses}</div>
                  <div className="stat-label">Défaites</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value p2">{stats.winRate}%</div>
                  <div className="stat-label">Win rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Badges */}
          <div className="content-card">
            <div className="card-bar p2" />
            <div className="card-body">
              <div className="section-header">
                <h3 className="section-title">🏅 Mes badges</h3>
                <span className="section-badge">{userBadges.length}/{allBadgesCount}</span>
              </div>
              
              {userBadges.length > 0 ? (
                <>
                  <div className="badges-grid">
                    {userBadges.slice(0, 5).map((ub) => (
                      <div key={ub.badge_id} className="badge-item">
                        <div className="badge-emoji">{ub.badge_definitions?.emoji || '🏅'}</div>
                        <div className="badge-name">{ub.badge_definitions?.name || 'Badge'}</div>
                      </div>
                    ))}
                    {userBadges.length < 5 && Array(5 - Math.min(userBadges.length, 5)).fill(0).map((_, i) => (
                      <div key={`locked-${i}`} className="badge-item locked">
                        <div className="badge-emoji">🔒</div>
                        <div className="badge-name">???</div>
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/me/badges" className="link-more">Voir tous les badges →</Link>
                </>
              ) : (
                <div className="empty-badges">
                  <div className="empty-icon">🏅</div>
                  <div className="empty-text">Joue des parties pour débloquer des badges !</div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: Parrainage */}
          <div className="content-card">
            <div className="card-bar p3" />
            <div className="card-body">
              <h3 className="section-title">🎁 Parrainage</h3>
              <div className="referral-box">
                <div className="referral-count">
                  <div className="referral-number">{profile?.referral_count || 0}</div>
                  <div className="referral-label">amis invités</div>
                </div>
                <div className="referral-info">
                  <div className="referral-title">Invite tes potes !</div>
                  <div className="referral-text">Débloque des badges exclusifs en invitant tes amis</div>
                </div>
                <button className="btn-p3" onClick={shareReferral}>📤 Inviter</button>
              </div>
            </div>
          </div>

          {/* SECTION: Réglages */}
          <div className="content-card">
            <div className="card-bar ink" />
            <div className="card-body no-padding">
              <div className="settings-header">
                <h3 className="section-title">⚙️ Réglages</h3>
              </div>
              <div className="settings-list">
                {[
                  { icon: '✏️', label: 'Modifier mon profil', href: '/dashboard/profile/edit' },
                  { icon: '🔔', label: 'Notifications', href: '/dashboard/settings/notifications' },
                  { icon: '🔐', label: 'Confidentialité', href: '/dashboard/settings/privacy' },
                  { icon: '❓', label: 'Aide & FAQ', href: '/dashboard/settings/help' },
                  { icon: '📄', label: 'CGU & Mentions légales', href: '/terms' }
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="settings-item">
                    <span className="settings-icon">{item.icon}</span>
                    <span className="settings-label">{item.label}</span>
                    <span className="settings-arrow">›</span>
                  </Link>
                ))}
              </div>
              <div className="settings-footer">
                <button className="btn-logout" onClick={handleLogout}>🚪 Déconnexion</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="page-footer">
            2×2 v1.0 · Made with 🎾 in France
          </div>
        </div>
      </div>

      {/* === STYLES === */}
      <style jsx global>{`
        @keyframes dot-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }

        .carte-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
          background: ${COLORS.bg};
          min-height: 100vh;
          padding-bottom: 100px;
        }

        /* Layout */
        .page-layout {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px;
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 48px;
          align-items: start;
        }

        .card-column {
          position: relative;
        }

        .card-sticky {
          position: sticky;
          top: 32px;
        }

        .content-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Card header */
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-edit {
          background: ${COLORS.white};
          border: 2px solid ${COLORS.border};
          border-radius: 100px;
          padding: 10px 18px;
          color: ${COLORS.gray};
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          border-color: ${COLORS.ink};
          color: ${COLORS.ink};
        }

        .card-wrapper {
          display: flex;
          justify-content: center;
        }

        /* Card actions */
        .card-actions {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-primary {
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary.full { width: 100%; }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.15);
        }

        .card-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-outline {
          background: ${COLORS.white};
          color: ${COLORS.gray};
          border: 2px solid ${COLORS.border};
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          border-color: ${COLORS.ink};
          color: ${COLORS.ink};
        }

        .btn-outline:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* Content cards */
        .content-card {
          background: ${COLORS.white};
          border-radius: 20px;
          overflow: hidden;
        }

        .card-bar {
          height: 4px;
        }
        .card-bar.p1 { background: ${COLORS.p1}; }
        .card-bar.p2 { background: ${COLORS.p2}; }
        .card-bar.p3 { background: ${COLORS.p3}; }
        .card-bar.p4 { background: ${COLORS.p4}; }
        .card-bar.ink { background: ${COLORS.ink}; }

        .card-body {
          padding: 24px;
        }

        .card-body.no-padding {
          padding: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-badge {
          background: ${COLORS.bgSoft};
          color: ${COLORS.gray};
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 20px 12px;
          background: ${COLORS.bgSoft};
          border-radius: 14px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
        }
        .stat-value.ink { color: ${COLORS.ink}; }
        .stat-value.p1 { color: ${COLORS.p1}; }
        .stat-value.p2 { color: ${COLORS.p2}; }
        .stat-value.p3 { color: ${COLORS.p3}; }
        .stat-value.p4 { color: ${COLORS.p4}; }

        .stat-label {
          font-size: 11px;
          color: ${COLORS.muted};
          margin-top: 4px;
          font-weight: 500;
        }

        /* Badges */
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .badge-item {
          text-align: center;
          padding: 16px 8px;
          background: ${COLORS.p2Soft};
          border-radius: 14px;
        }

        .badge-item.locked {
          background: ${COLORS.bgSoft};
          opacity: 0.5;
        }

        .badge-emoji {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .badge-name {
          font-size: 11px;
          color: ${COLORS.gray};
          font-weight: 500;
        }

        .link-more {
          display: block;
          text-align: center;
          margin-top: 16px;
          color: ${COLORS.ink};
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .link-more:hover {
          text-decoration: underline;
        }

        .empty-badges {
          text-align: center;
          padding: 32px;
        }

        .empty-icon {
          font-size: 40px;
          opacity: 0.3;
          margin-bottom: 12px;
        }

        .empty-text {
          font-size: 14px;
          color: ${COLORS.gray};
        }

        /* Referral */
        .referral-box {
          display: flex;
          align-items: center;
          gap: 20px;
          background: ${COLORS.p3Soft};
          border-radius: 16px;
          padding: 20px 24px;
          margin-top: 16px;
        }

        .referral-count {
          text-align: center;
        }

        .referral-number {
          font-size: 32px;
          font-weight: 800;
          color: ${COLORS.p3};
        }

        .referral-label {
          font-size: 12px;
          color: ${COLORS.p3};
        }

        .referral-info {
          flex: 1;
        }

        .referral-title {
          font-size: 16px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin-bottom: 4px;
        }

        .referral-text {
          font-size: 13px;
          color: ${COLORS.gray};
        }

        .btn-p3 {
          background: ${COLORS.p3};
          color: ${COLORS.white};
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 16px ${COLORS.p3Glow};
        }

        /* Settings */
        .settings-header {
          padding: 20px 24px 12px;
        }

        .settings-list {
          display: flex;
          flex-direction: column;
        }

        .settings-item {
          display: flex;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid ${COLORS.border};
          text-decoration: none;
          color: ${COLORS.ink};
          transition: background 0.2s;
        }

        .settings-item:hover {
          background: ${COLORS.bgSoft};
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
          color: ${COLORS.muted};
          font-size: 20px;
        }

        .settings-footer {
          padding: 16px 24px 24px;
        }

        .btn-logout {
          width: 100%;
          background: transparent;
          color: ${COLORS.p1};
          border: 2px solid ${COLORS.p1};
          padding: 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: ${COLORS.p1Soft};
        }

        .page-footer {
          text-align: center;
          padding: 24px 0;
          color: ${COLORS.muted};
          font-size: 13px;
        }

        /* Modal */
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

        .modal-box {
          background: ${COLORS.white};
          border-radius: 24px;
          padding: 32px;
          width: 100%;
          max-width: 380px;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${COLORS.bgSoft};
          border: none;
          font-size: 18px;
          color: ${COLORS.gray};
          cursor: pointer;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin: 0 0 4px;
          text-align: center;
        }

        .modal-subtitle {
          font-size: 14px;
          color: ${COLORS.muted};
          margin: 0 0 24px;
          text-align: center;
        }

        .qr-box {
          background: ${COLORS.white};
          border: 2px solid ${COLORS.border};
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .qr-img {
          width: 160px;
          height: 160px;
        }

        .qr-loading {
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${COLORS.muted};
        }

        .modal-profile {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .modal-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: ${COLORS.white};
          overflow: hidden;
        }

        .modal-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-name {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.ink};
        }

        .modal-level {
          font-size: 13px;
          color: ${COLORS.muted};
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-gray {
          padding: 14px;
          background: ${COLORS.bgSoft};
          border: 2px solid ${COLORS.border};
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: ${COLORS.ink};
          cursor: pointer;
        }

        .btn-gray:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .page-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .card-sticky {
            position: relative;
            top: 0;
          }

          .card-column {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .card-header {
            width: 100%;
            max-width: 380px;
          }

          .card-actions {
            width: 100%;
            max-width: 380px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .badges-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .referral-box {
            flex-direction: column;
            text-align: center;
          }

          .referral-info {
            order: -1;
          }
        }

        @media (max-width: 480px) {
          .page-layout {
            padding: 20px 16px;
          }

          .badges-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .referral-box {
            padding: 20px 16px;
          }

          .btn-p3 {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}