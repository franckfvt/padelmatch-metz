'use client'

/**
 * ============================================
 * PAGE PROFIL PUBLIC - JUNTO STYLE
 * ============================================
 * 
 * Page affichée quand on scanne un QR code
 * ou qu'on partage un lien de profil
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  white: '#ffffff',
  bg: '#fafafa',
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

// === COMPOSANT: Les 4 points ===
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

export default function PublicProfileClient() {
  const params = useParams()
  const playerId = params?.id
  
  const [profile, setProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userBadges, setUserBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (playerId) loadData()
  }, [playerId])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (err || !data) {
        setError('Joueur introuvable')
      } else {
        setProfile(data)
        
        // Charger les badges
        const { data: badges } = await supabase
          .from('user_badges')
          .select(`badge_id, badge_definitions (id, name, emoji)`)
          .eq('user_id', playerId)
          .limit(6)
        
        setUserBadges(badges || [])
      }
    } catch (e) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  function getAvatarColor(name) {
    if (!name) return JUNTO.coral
    return AVATAR_COLORS[name.charCodeAt(0) % 4]
  }

  // Loading
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="loading-dots">
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="loading-text">Chargement...</div>
        </div>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, ${JUNTO.slate} 0%, #2a3a48 100%);
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-content { text-align: center; }
          .loading-dots { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }
          .loading-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            animation: loadBounce 1.4s ease-in-out infinite;
          }
          .loading-text { color: rgba(255,255,255,0.6); font-size: 14px; }
          @keyframes loadBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-emoji">🎾</div>
          <h1 className="error-title">Joueur introuvable</h1>
          <p className="error-text">Ce profil n'existe pas ou a été supprimé.</p>
          <Link href="/" className="error-btn">
            Découvrir Junto
          </Link>
        </div>
        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${JUNTO.bg};
            padding: 20px;
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .error-card {
            background: ${JUNTO.white};
            border-radius: 24px;
            padding: 48px 40px;
            text-align: center;
            max-width: 360px;
            border: 2px solid ${JUNTO.border};
          }
          .error-emoji { font-size: 56px; margin-bottom: 20px; }
          .error-title { font-size: 22px; font-weight: 700; color: ${JUNTO.ink}; margin: 0 0 8px; }
          .error-text { font-size: 14px; color: ${JUNTO.gray}; margin: 0 0 28px; }
          .error-btn {
            display: inline-block;
            padding: 16px 32px;
            background: ${JUNTO.coral};
            color: ${JUNTO.white};
            border-radius: 100px;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
          }
        `}</style>
      </div>
    )
  }

  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both
  const isOwnProfile = currentUser?.id === playerId

  return (
    <div className="public-profile">
      <div className="profile-container">
        
        {/* Logo Junto */}
        <div className="profile-header">
          <div className="junto-logo">
            <span>junto</span>
            <FourDots size={8} gap={4} />
          </div>
        </div>

        {/* Carte joueur */}
        <div className="player-card">
          <div className="card-accent" />
          
          {/* Avatar */}
          <div className="player-avatar" style={{ background: profile?.avatar_url ? 'transparent' : avatarColor }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} alt="" />
              : profile?.name?.[0]?.toUpperCase() || '?'
            }
          </div>

          {/* Nom */}
          <h1 className="player-name">{profile?.name || 'Joueur'}</h1>
          
          {/* Ville */}
          <p className="player-location">
            {profile?.city ? `📍 ${profile.city}` : '🎾 Joueur Junto'}
            {profile?.signup_number && ` · Membre #${profile.signup_number}`}
          </p>

          {/* Niveau */}
          <div className="level-badge">
            <div className="level-value">{profile?.level || '?'}</div>
            <div className="level-label">Niveau</div>
          </div>

          {/* Tags */}
          <div className="player-tags">
            <span className="tag">{position.emoji} {position.label}</span>
            <span className="tag amber">{ambiance.emoji} {ambiance.label}</span>
          </div>
        </div>

        {/* Badges */}
        {userBadges.length > 0 && (
          <div className="badges-section">
            <div className="badges-title">🏅 Badges obtenus</div>
            <div className="badges-grid">
              {userBadges.map((ub) => (
                <div key={ub.badge_id} className="badge-item" title={ub.badge_definitions?.name}>
                  {ub.badge_definitions?.emoji || '🏅'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isOwnProfile ? (
          <div className="actions-own">
            <button 
              className="btn-share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ 
                    title: `${profile.name} - Junto`, 
                    url: window.location.href 
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Lien copié !')
                }
              }}
            >
              📤 Partager ma carte
            </button>
            <Link href="/dashboard/carte" className="btn-edit">
              ← Retour à ma carte
            </Link>
          </div>
        ) : (
          <div className="cta-section">
            <Link href="/" className="btn-join">
              🎾 Rejoindre Junto
            </Link>
            <p className="cta-subtext">Gratuit • Organise des parties de padel facilement</p>
          </div>
        )}

        {/* Footer */}
        <div className="profile-footer">
          <FourDots size={6} gap={3} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes junto-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .junto-dot { animation: junto-dot 3s ease-in-out infinite; }
      `}</style>

      <style jsx>{`
        .public-profile {
          min-height: 100vh;
          background: linear-gradient(180deg, ${JUNTO.slate} 0%, #2a3a48 60%, ${JUNTO.bg} 60%);
          padding: 40px 20px 60px;
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .profile-container {
          max-width: 420px;
          margin: 0 auto;
        }

        /* Header */
        .profile-header {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .junto-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.8);
          font-size: 22px;
          font-weight: 700;
        }

        /* Carte joueur */
        .player-card {
          background: linear-gradient(145deg, #4a5d6d 0%, ${JUNTO.slate} 100%);
          border-radius: 28px;
          padding: 36px 28px;
          text-align: center;
          position: relative;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          margin-bottom: 24px;
        }

        .card-accent {
          position: absolute;
          left: 0;
          top: 28px;
          bottom: 28px;
          width: 6px;
          background: ${JUNTO.coral};
          border-radius: 0 4px 4px 0;
        }

        .player-avatar {
          width: 100px;
          height: 100px;
          border-radius: 24px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 44px;
          font-weight: 700;
          color: ${JUNTO.white};
          border: 4px solid rgba(255,255,255,0.2);
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          overflow: hidden;
        }

        .player-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .player-name {
          font-size: 28px;
          font-weight: 800;
          color: ${JUNTO.white};
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .player-location {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin: 0 0 24px;
        }

        .level-badge {
          display: inline-block;
          background: rgba(0, 184, 169, 0.15);
          border: 2px solid ${JUNTO.teal};
          border-radius: 20px;
          padding: 18px 36px;
          margin-bottom: 24px;
        }

        .level-value {
          font-size: 48px;
          font-weight: 900;
          color: #4eeee0;
          line-height: 1;
        }

        .level-label {
          font-size: 11px;
          color: #4eeee0;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 8px;
        }

        .player-tags {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tag {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.85);
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }

        .tag.amber {
          background: rgba(255, 180, 0, 0.2);
          color: ${JUNTO.amber};
        }

        /* Badges */
        .badges-section {
          background: ${JUNTO.white};
          border-radius: 20px;
          padding: 20px;
          border: 2px solid ${JUNTO.border};
          margin-bottom: 24px;
        }

        .badges-title {
          font-size: 14px;
          font-weight: 700;
          color: ${JUNTO.ink};
          margin-bottom: 14px;
          text-align: center;
        }

        .badges-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .badge-item {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: ${JUNTO.amberSoft};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        /* CTA */
        .cta-section {
          text-align: center;
        }

        .btn-join {
          display: block;
          width: 100%;
          padding: 18px;
          background: ${JUNTO.coral};
          color: ${JUNTO.white};
          border: none;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 8px 24px ${JUNTO.coralGlow};
          margin-bottom: 16px;
        }

        .cta-subtext {
          font-size: 13px;
          color: ${JUNTO.gray};
          margin: 0;
        }

        /* Own profile actions */
        .actions-own {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-share {
          width: 100%;
          padding: 18px;
          background: ${JUNTO.coral};
          color: ${JUNTO.white};
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px ${JUNTO.coralGlow};
        }

        .btn-edit {
          display: block;
          width: 100%;
          padding: 16px;
          background: ${JUNTO.white};
          color: ${JUNTO.gray};
          border: 2px solid ${JUNTO.border};
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
        }

        /* Footer */
        .profile-footer {
          display: flex;
          justify-content: center;
          padding-top: 32px;
        }

        @media (max-width: 480px) {
          .public-profile {
            padding: 32px 16px 48px;
          }

          .player-card {
            padding: 28px 20px;
          }

          .player-name {
            font-size: 24px;
          }

          .level-value {
            font-size: 40px;
          }
        }
      `}</style>
    </div>
  )
}