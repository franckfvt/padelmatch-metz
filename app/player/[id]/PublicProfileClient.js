'use client'

/**
 * ============================================
 * PAGE PROFIL PUBLIC - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Page affichée quand on scanne un QR code
 * ou qu'on partage un lien de profil
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * 
 * Fonctionnalités :
 * - Affichage carte joueur (avatar carré, nom, niveau, position, ambiance)
 * - Badges obtenus
 * - CTA "Rejoindre 2×2" si visiteur non connecté
 * - Boutons Partager/Retour si c'est son propre profil
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p2Soft: '#fff8e5',
  
  // Interface sobre
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#f5f5f5',
  bgSoft: '#fafafa',
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
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          className="dot-breathe"
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size > 10 ? 4 : '50%', 
            background: c,
            animationDelay: `${i * 0.15}s`
          }} 
        />
      ))}
    </div>
  )
}

// === PAGE PRINCIPALE ===
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

  // === CHARGEMENT DES DONNÉES ===
  async function loadData() {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      // Charger le profil du joueur
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (err || !data) {
        setError('Joueur introuvable')
      } else {
        setProfile(data)
        
        // Charger les badges du joueur
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

  // === HELPERS ===
  function getAvatarColor(name) {
    if (!name) return COLORS.p1
    return PLAYER_COLORS[name.charCodeAt(0) % 4]
  }

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="loading-dots">
            {PLAYER_COLORS.map((c, i) => (
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
            background: ${COLORS.cardDark};
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-content { text-align: center; }
          .loading-dots { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }
          .loading-dot {
            width: 16px;
            height: 16px;
            border-radius: 6px;
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

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-emoji">🎾</div>
          <h1 className="error-title">Joueur introuvable</h1>
          <p className="error-text">Ce profil n'existe pas ou a été supprimé.</p>
          <Link href="/" className="error-btn">
            Découvrir 2×2
          </Link>
        </div>
        <style jsx>{`
          .error-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${COLORS.bg};
            padding: 20px;
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .error-card {
            background: ${COLORS.white};
            border-radius: 24px;
            padding: 48px 40px;
            text-align: center;
            max-width: 360px;
            border: 2px solid ${COLORS.border};
          }
          .error-emoji { font-size: 56px; margin-bottom: 20px; }
          .error-title { font-size: 22px; font-weight: 700; color: ${COLORS.ink}; margin: 0 0 8px; }
          .error-text { font-size: 14px; color: ${COLORS.gray}; margin: 0 0 28px; }
          .error-btn {
            display: inline-block;
            padding: 16px 32px;
            background: ${COLORS.ink};
            color: ${COLORS.white};
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

  // === RENDER ===
  return (
    <div className="public-profile">
      <div className="profile-container">
        
        {/* Header - Logo 2×2 */}
        <div className="profile-header">
          <div className="logo-2x2">
            <span>2×2</span>
            <FourDots size={8} gap={4} />
          </div>
        </div>

        {/* Carte joueur */}
        <div className="player-card">
          
          {/* Avatar carré arrondi */}
          <div className="player-avatar" style={{ background: profile?.avatar_url ? 'transparent' : avatarColor }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} alt="" />
              : profile?.name?.[0]?.toUpperCase() || '?'
            }
          </div>

          {/* Nom */}
          <h1 className="player-name">{profile?.name || 'Joueur'}</h1>
          
          {/* Ville & Membre */}
          <p className="player-location">
            {profile?.city ? `📍 ${profile.city}` : '🎾 Joueur 2×2'}
            {profile?.signup_number && ` · Membre #${profile.signup_number}`}
          </p>

          {/* Niveau - Badge principal */}
          <div className="level-badge">
            <div className="level-value">{profile?.level || '?'}</div>
            <div className="level-label">Niveau</div>
          </div>

          {/* Tags position & ambiance */}
          <div className="player-tags">
            <span className="tag">{position.emoji} {position.label}</span>
            <span className="tag colored" style={{ 
              background: `${ambiance.color}30`, 
              color: ambiance.color 
            }}>
              {ambiance.emoji} {ambiance.label}
            </span>
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

        {/* Actions selon le contexte */}
        {isOwnProfile ? (
          // C'est son propre profil
          <div className="actions-own">
            <button 
              className="btn-share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ 
                    title: `${profile.name} - 2×2`, 
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
            <Link href="/dashboard/carte" className="btn-back">
              ← Retour à ma carte
            </Link>
          </div>
        ) : (
          // C'est un visiteur
          <div className="cta-section">
            <Link href="/" className="btn-join">
              🎾 Rejoindre 2×2
            </Link>
            <p className="cta-subtext">Gratuit • Organise des parties de padel facilement</p>
          </div>
        )}

        {/* Footer */}
        <div className="profile-footer">
          <FourDots size={6} gap={3} />
        </div>
      </div>

      {/* === STYLES === */}
      <style jsx global>{`
        @keyframes dot-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }
      `}</style>

      <style jsx>{`
        .public-profile {
          min-height: 100vh;
          background: linear-gradient(180deg, ${COLORS.cardDark} 0%, ${COLORS.cardDark} 55%, ${COLORS.bg} 55%);
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

        .logo-2x2 {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.8);
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        /* Carte joueur */
        .player-card {
          background: ${COLORS.cardDark};
          border-radius: 28px;
          padding: 36px 28px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          margin-bottom: 24px;
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
          color: ${COLORS.white};
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
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
          color: ${COLORS.white};
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
          background: ${COLORS.p3}20;
          border: 2px solid ${COLORS.p3};
          border-radius: 20px;
          padding: 18px 40px;
          margin-bottom: 24px;
        }

        .level-value {
          font-size: 52px;
          font-weight: 900;
          color: ${COLORS.p3};
          line-height: 1;
        }

        .level-label {
          font-size: 11px;
          color: ${COLORS.p3};
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

        /* Badges */
        .badges-section {
          background: ${COLORS.white};
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .badges-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.ink};
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
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: ${COLORS.p2Soft};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }

        /* CTA visiteur */
        .cta-section {
          text-align: center;
        }

        .btn-join {
          display: block;
          width: 100%;
          padding: 18px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 16px;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          margin-bottom: 16px;
        }

        .cta-subtext {
          font-size: 13px;
          color: ${COLORS.gray};
          margin: 0;
        }

        /* Actions profil propre */
        .actions-own {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-share {
          width: 100%;
          padding: 18px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-back {
          display: block;
          width: 100%;
          padding: 16px;
          background: ${COLORS.white};
          color: ${COLORS.gray};
          border: 2px solid ${COLORS.border};
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

        /* Responsive */
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
            font-size: 44px;
          }
        }
      `}</style>
    </div>
  )
}