'use client'

/**
 * ============================================
 * PAGE MA CARTE - JUNTO BRAND v4
 * ============================================
 * 
 * Structure validée :
 * - 2 colonnes desktop (carte sticky + contenu scroll)
 * - Sections empilées visibles sans tabs
 * - Carte simplifiée sans stats
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
}

const AVATAR_COLORS = [JUNTO.coral, JUNTO.slate, JUNTO.amber, JUNTO.teal]

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
function FourDots({ size = 8, gap = 4, animate = true }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {AVATAR_COLORS.map((c, i) => (
        <div 
          key={i} 
          className={animate ? 'junto-dot' : ''}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            background: c,
            animationDelay: animate ? `${i * 0.15}s` : undefined
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Carte Joueur (pour affichage ET export) ===
function PlayerCard({ profile, avatarColor, ambiance, position, forExport = false }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, #4a5d6d 0%, ${JUNTO.slate} 100%)`,
      borderRadius: forExport ? 0 : 24,
      padding: forExport ? '48px 40px' : 32,
      position: 'relative',
      boxShadow: forExport ? 'none' : '0 20px 50px rgba(0,0,0,0.3)',
      border: forExport ? 'none' : '2px solid rgba(255,255,255,0.1)',
      width: forExport ? 400 : '100%',
      maxWidth: forExport ? 400 : 380,
      minHeight: forExport ? 540 : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      {/* Barre latérale unie */}
      {!forExport && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 28,
          bottom: 28,
          width: 6,
          background: JUNTO.coral,
          borderRadius: '0 4px 4px 0'
        }} />
      )}

      {/* Contenu */}
      <div style={{ textAlign: 'center' }}>
        {/* Avatar */}
        <div style={{
          width: forExport ? 100 : 100,
          height: forExport ? 100 : 100,
          borderRadius: 24,
          background: profile?.avatar_url ? 'transparent' : avatarColor,
          margin: forExport ? '0 auto 24px' : '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: forExport ? 44 : 42,
          fontWeight: 700,
          color: JUNTO.white,
          border: '4px solid rgba(255,255,255,0.2)',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}>
          {profile?.avatar_url 
            ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : profile?.name?.[0]?.toUpperCase() || '?'
          }
        </div>

        {/* Nom */}
        <h2 style={{ 
          fontSize: forExport ? 28 : 26, 
          fontWeight: 800, 
          color: JUNTO.white, 
          margin: '0 0 8px',
          letterSpacing: -0.5
        }}>
          {profile?.name || 'Joueur'}
        </h2>

        {/* Ville */}
        <div style={{ 
          fontSize: 14, 
          color: 'rgba(255,255,255,0.5)', 
          marginBottom: forExport ? 28 : 24,
          minHeight: 20
        }}>
          {profile?.city ? (
            <>📍 {profile.city}{profile?.signup_number && ` · Membre #${profile.signup_number}`}</>
          ) : (
            forExport ? '🎾 Joueur Junto' : null
          )}
        </div>

        {/* Niveau - Badge principal */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(0, 184, 169, 0.15)',
          border: `2px solid ${JUNTO.teal}`,
          borderRadius: 20,
          padding: forExport ? '20px 40px' : '18px 36px',
          marginBottom: forExport ? 28 : 24
        }}>
          <div style={{ 
            fontSize: forExport ? 48 : 48, 
            fontWeight: 900, 
            color: '#4eeee0', 
            lineHeight: 1 
          }}>
            {profile?.level || '?'}
          </div>
          <div style={{ 
            fontSize: 11, 
            color: '#4eeee0', 
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
          marginBottom: forExport ? 28 : 24
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

        {/* Logo Junto */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          paddingTop: forExport ? 24 : 20,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            background: 'rgba(0,0,0,0.2)',
            padding: forExport ? '12px 24px' : '10px 20px',
            borderRadius: 100
          }}>
            <span style={{ fontSize: forExport ? 18 : 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>junto</span>
            <FourDots size={forExport ? 7 : 6} gap={forExport ? 4 : 3} animate={!forExport} />
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

    // Stats
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

    const { count: organized } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    setStats({ matchesPlayed, wins, losses, winRate, organized: organized || 0 })

    // Badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select(`badge_id, earned_at, badge_definitions (id, name, emoji, description)`)
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
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/player/${user?.id}` : ''

  function generateQRCode() {
    if (qrCodeUrl || !profileUrl) return qrCodeUrl
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1e293b&margin=10`
    setQrCodeUrl(url)
    return url
  }

  function handleShare() {
    generateQRCode()
    setShowShareModal(true)
  }

  async function handleNativeShare() {
    const shareText = `🎾 Mon profil Junto\n⭐ Niveau ${profile?.level || '?'}\n📍 ${profile?.city || 'France'}\n\n👉 ${profileUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} - Junto`, text: shareText, url: profileUrl })
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
      element.style.background = JUNTO.slate
      element.style.padding = '0'
      element.style.overflow = 'hidden'
      
      // Attendre le rendu
      await new Promise(r => setTimeout(r, 300))
      
      const canvas = await html2canvas(element, {
        backgroundColor: JUNTO.slate,
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
      link.download = `junto-${(profile?.name || 'carte').toLowerCase().replace(/\s+/g, '-')}.png`
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${user?.id?.slice(0, 8)}` : ''

  async function shareReferral() {
    const text = `🎾 Rejoins-moi sur Junto, l'app pour organiser des parties de padel !\n\n👉 ${referralLink}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rejoins Junto !', text, url: referralLink })
        return
      } catch (err) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Helpers
  function getAvatarColor(name) {
    if (!name) return JUNTO.coral
    return AVATAR_COLORS[name.charCodeAt(0) % 4]
  }

  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both

  // Loading
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-dots">
          {AVATAR_COLORS.map((c, i) => (
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
            width: 14px;
            height: 14px;
            border-radius: 50%;
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
              <button className="btn-coral" onClick={handleNativeShare}>📤 Partager</button>
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
              <button className="btn-coral full" onClick={handleShare}>📤 Partager ma carte</button>
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
            <div className="card-bar teal" />
            <div className="card-body">
              <h3 className="section-title">📊 Mes statistiques</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value slate">{stats.matchesPlayed}</div>
                  <div className="stat-label">Parties</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value teal">{stats.wins}</div>
                  <div className="stat-label">Victoires</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value coral">{stats.losses}</div>
                  <div className="stat-label">Défaites</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value amber">{stats.winRate}%</div>
                  <div className="stat-label">Win rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Badges */}
          <div className="content-card">
            <div className="card-bar amber" />
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
            <div className="card-bar teal" />
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
                <button className="btn-teal" onClick={shareReferral}>📤 Inviter</button>
              </div>
            </div>
          </div>

          {/* SECTION: Réglages */}
          <div className="content-card">
            <div className="card-bar slate" />
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
            Junto v1.0 · Made with 🎾 in France
          </div>
        </div>
      </div>

      {/* === STYLES === */}
      <style jsx global>{`
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
          color: ${JUNTO.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-edit {
          background: ${JUNTO.white};
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

        .btn-coral {
          background: ${JUNTO.coral};
          color: ${JUNTO.white};
          border: none;
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px ${JUNTO.coralGlow};
          transition: all 0.2s;
        }

        .btn-coral.full { width: 100%; }

        .btn-coral:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px ${JUNTO.coralGlow};
        }

        .card-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-outline {
          background: ${JUNTO.white};
          color: ${JUNTO.gray};
          border: 2px solid ${JUNTO.border};
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          border-color: ${JUNTO.ink};
          color: ${JUNTO.ink};
        }

        .btn-outline:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* Content cards */
        .content-card {
          background: ${JUNTO.white};
          border-radius: 20px;
          border: 2px solid ${JUNTO.border};
          overflow: hidden;
        }

        .card-bar {
          height: 4px;
        }
        .card-bar.teal { background: ${JUNTO.teal}; }
        .card-bar.amber { background: ${JUNTO.amber}; }
        .card-bar.coral { background: ${JUNTO.coral}; }
        .card-bar.slate { background: ${JUNTO.slate}; }

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
          color: ${JUNTO.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-badge {
          background: ${JUNTO.tealSoft};
          color: ${JUNTO.teal};
          padding: 4px 12px;
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
          background: ${JUNTO.bgSoft};
          border-radius: 14px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
        }
        .stat-value.slate { color: ${JUNTO.slate}; }
        .stat-value.teal { color: ${JUNTO.teal}; }
        .stat-value.coral { color: ${JUNTO.coral}; }
        .stat-value.amber { color: ${JUNTO.amber}; }

        .stat-label {
          font-size: 11px;
          color: ${JUNTO.muted};
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
          background: ${JUNTO.amberSoft};
          border-radius: 14px;
        }

        .badge-item.locked {
          background: ${JUNTO.bgSoft};
          opacity: 0.5;
        }

        .badge-emoji {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .badge-name {
          font-size: 11px;
          color: ${JUNTO.gray};
          font-weight: 500;
        }

        .link-more {
          display: block;
          text-align: center;
          margin-top: 16px;
          color: ${JUNTO.gray};
          font-size: 14px;
          text-decoration: none;
        }

        .link-more:hover {
          color: ${JUNTO.ink};
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
          color: ${JUNTO.gray};
        }

        /* Referral */
        .referral-box {
          display: flex;
          align-items: center;
          gap: 20px;
          background: linear-gradient(135deg, ${JUNTO.tealSoft} 0%, #d1fae5 100%);
          border: 2px solid ${JUNTO.teal};
          border-radius: 16px;
          padding: 20px 24px;
          margin-top: 16px;
        }

        .referral-count {
          text-align: center;
        }

        .referral-number {
          font-size: 36px;
          font-weight: 800;
          color: ${JUNTO.teal};
        }

        .referral-label {
          font-size: 12px;
          color: #047857;
        }

        .referral-info {
          flex: 1;
        }

        .referral-title {
          font-size: 16px;
          font-weight: 700;
          color: ${JUNTO.teal};
          margin-bottom: 4px;
        }

        .referral-text {
          font-size: 13px;
          color: #047857;
        }

        .btn-teal {
          background: ${JUNTO.teal};
          color: ${JUNTO.white};
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 16px ${JUNTO.tealGlow};
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
          border-top: 1px solid ${JUNTO.border};
          text-decoration: none;
          color: ${JUNTO.ink};
          transition: background 0.2s;
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
          color: ${JUNTO.muted};
          font-size: 20px;
        }

        .settings-footer {
          padding: 16px 24px 24px;
        }

        .btn-logout {
          width: 100%;
          background: transparent;
          color: ${JUNTO.coral};
          border: 2px solid ${JUNTO.coral};
          padding: 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: ${JUNTO.coralSoft};
        }

        .page-footer {
          text-align: center;
          padding: 24px 0;
          color: ${JUNTO.muted};
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
          background: ${JUNTO.white};
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
          background: ${JUNTO.bgSoft};
          border: none;
          font-size: 18px;
          color: ${JUNTO.gray};
          cursor: pointer;
        }

        .modal-title {
          font-size: 20px;
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

        .qr-box {
          background: ${JUNTO.white};
          border: 2px solid ${JUNTO.border};
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
          color: ${JUNTO.muted};
        }

        .modal-profile {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          background: ${JUNTO.bgSoft};
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .modal-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: ${JUNTO.white};
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
          color: ${JUNTO.ink};
        }

        .modal-level {
          font-size: 13px;
          color: ${JUNTO.muted};
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
          background: ${JUNTO.bgSoft};
          border: 2px solid ${JUNTO.border};
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: ${JUNTO.ink};
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

          .btn-teal {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}