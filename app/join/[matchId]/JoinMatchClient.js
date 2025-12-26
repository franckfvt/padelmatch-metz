'use client'

/**
 * ============================================
 * PAGE REJOINDRE MATCH - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Page affichée quand quelqu'un clique sur un lien
 * de partage de partie (/join/[matchId])
 * 
 * Fonctionnalités :
 * - Affichage des détails de la partie
 * - Liste des joueurs (orga + participants + places vides)
 * - Bouton rejoindre / Se connecter / Déjà inscrit / Complet
 * - Redirection vers auth/onboarding si nécessaire
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
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
  loisir: { label: 'Détente', emoji: '😌', color: COLORS.p3 },
  chill: { label: 'Détente', emoji: '😌', color: COLORS.p3 },
  mix: { label: 'Équilibré', emoji: '⚡', color: COLORS.p2 },
  compet: { label: 'Compétitif', emoji: '🔥', color: COLORS.p1 },
  competition: { label: 'Compétitif', emoji: '🔥', color: COLORS.p1 }
}

const POSITION_LABELS = {
  droite: 'Droite',
  right: 'Droite',
  gauche: 'Gauche',
  left: 'Gauche',
  les_deux: 'D/G',
  both: 'D/G'
}

const LEVEL_LABELS = {
  'less6months': '1-2',
  '6months2years': '3-4',
  '2to5years': '5-6',
  'more5years': '7+',
  'all': 'Tous'
}

// === COMPOSANT: Les 4 dots animés ===
function FourDots({ size = 10, gap = 5 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div key={i} className="dot-breathe" style={{ 
          width: size, height: size, 
          borderRadius: size > 10 ? 4 : '50%', 
          background: c,
          animationDelay: `${i * 0.15}s`
        }} />
      ))}
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function JoinMatchClient({ matchId }) {
  const router = useRouter()
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)

  // === CHARGEMENT DES DONNÉES ===
  useEffect(() => {
    loadData()
  }, [matchId])

  async function loadData() {
    try {
      // Charger la partie
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address, city),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance, reliability_score, level, position, avatar_url)
        `)
        .eq('id', matchId)
        .single()

      if (matchError || !matchData) {
        setError('Cette partie n\'existe pas ou a été supprimée.')
        setLoading(false)
        return
      }

      setMatch(matchData)

      // Charger les participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, experience, ambiance, reliability_score, level, position, avatar_url)
        `)
        .eq('match_id', matchId)

      setParticipants(participantsData || [])

      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)

        // Vérifier si déjà inscrit
        const isOrganizer = matchData.organizer_id === session.user.id
        const isParticipant = participantsData?.some(p => p.user_id === session.user.id)
        setAlreadyJoined(isOrganizer || isParticipant)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading match:', error)
      setError('Erreur lors du chargement de la partie.')
      setLoading(false)
    }
  }

  // === REJOINDRE LA PARTIE ===
  async function joinMatch() {
    if (!user) {
      // Sauvegarder la redirection et aller vers auth
      sessionStorage.setItem('redirectAfterLogin', `/join/${matchId}`)
      router.push(`/auth?redirect=/join/${matchId}`)
      return
    }

    if (!profile?.experience && !profile?.level) {
      // Profil incomplet, aller vers onboarding
      sessionStorage.setItem('redirectAfterOnboarding', `/join/${matchId}`)
      router.push(`/onboarding?redirect=/join/${matchId}`)
      return
    }

    setJoining(true)
    setError('')

    try {
      // Vérifier encore les places
      if (match.spots_available <= 0) {
        setError('Désolé, la partie est maintenant complète.')
        setJoining(false)
        return
      }

      // Inscrire le joueur
      const { error: joinError } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status: 'confirmed'
        })

      if (joinError) throw joinError

      // Mettre à jour le nombre de places
      const newSpots = match.spots_available - 1
      await supabase
        .from('matches')
        .update({
          spots_available: newSpots,
          status: newSpots === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      // Ajouter un message dans le chat
      await supabase
        .from('match_messages')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: `${profile?.name || 'Un joueur'} a rejoint la partie ! 🎾`
        })

      // Rediriger vers la page de la partie
      router.push(`/dashboard/match/${matchId}`)

    } catch (error) {
      console.error('Error joining match:', error)
      setError('Erreur lors de l\'inscription. Réessaie.')
    } finally {
      setJoining(false)
    }
  }

  // === HELPERS ===
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getReliabilityColor(score) {
    if (score >= 90) return COLORS.p3
    if (score >= 70) return COLORS.p2
    return COLORS.p1
  }

  function getLevel(profile) {
    if (profile?.level) return profile.level
    if (profile?.experience) return LEVEL_LABELS[profile.experience]
    return '?'
  }

  function getAvatarColor(name, index) {
    if (name) return PLAYER_COLORS[name.charCodeAt(0) % 4]
    return PLAYER_COLORS[index % 4]
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
          <div className="loading-text">Chargement de la partie...</div>
        </div>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${COLORS.bg};
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-content { text-align: center; }
          .loading-dots { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
          .loading-dot {
            width: 16px;
            height: 16px;
            border-radius: 6px;
            animation: loadBounce 1.4s ease-in-out infinite;
          }
          .loading-text { color: ${COLORS.gray}; font-size: 14px; }
          @keyframes loadBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-14px); }
          }
        `}</style>
      </div>
    )
  }

  // === ERROR STATE ===
  if (error && !match) {
    return (
      <div className="error-page">
        <div className="error-card">
          <div className="error-emoji">😕</div>
          <h1 className="error-title">Partie introuvable</h1>
          <p className="error-text">{error}</p>
          <Link href="/" className="error-btn">Retour à l'accueil</Link>
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
            background: ${COLORS.card};
            border-radius: 24px;
            padding: 48px 40px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          }
          .error-emoji { font-size: 56px; margin-bottom: 20px; }
          .error-title { font-size: 22px; font-weight: 700; color: ${COLORS.ink}; margin: 0 0 12px; }
          .error-text { color: ${COLORS.gray}; margin: 0 0 24px; font-size: 15px; }
          .error-btn {
            display: inline-block;
            padding: 14px 28px;
            background: ${COLORS.ink};
            color: ${COLORS.white};
            border-radius: 100px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
          }
        `}</style>
      </div>
    )
  }

  const totalPlayers = 1 + participants.length
  const isFull = match.spots_available <= 0
  const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0
  const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix

  // === RENDER ===
  return (
    <div className="join-page">
      <div className="join-container">
        
        {/* Logo 2×2 */}
        <div className="logo-header">
          <Link href="/" className="logo-link">
            <div className="logo-content">
              <span className="logo-text">2×2</span>
              <FourDots size={10} gap={5} />
            </div>
          </Link>
        </div>

        {/* Carte d'invitation */}
        <div className="invite-card">
          
          {/* Header invitation */}
          <div className="invite-header">
            <div className="invite-from">
              {match.profiles?.name} t'invite à jouer
            </div>
            <h1 className="invite-title">Partie de Padel</h1>
          </div>

          {/* Infos principales */}
          <div className="info-section">
            
            {/* Date */}
            <div className="info-row">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <div className="info-main">{formatDate(match.match_date)}</div>
                <div className="info-time">{formatTime(match.match_time)}</div>
              </div>
            </div>

            {/* Lieu */}
            <div className="info-row">
              <div className="info-icon">📍</div>
              <div className="info-content">
                <div className="info-main">{match.clubs?.name || match.city || 'Lieu à définir'}</div>
                {match.clubs?.address && <div className="info-sub">{match.clubs.address}</div>}
              </div>
            </div>

            {/* Badges */}
            <div className="badges-row">
              {match.level_required && match.level_required !== 'all' && (
                <span className="badge level">
                  ⭐ Niveau {LEVEL_LABELS[match.level_required] || match.level_required}+
                </span>
              )}
              <span className="badge ambiance" style={{ 
                background: `${ambiance.color}20`, 
                color: ambiance.color 
              }}>
                {ambiance.emoji} {ambiance.label}
              </span>
              {pricePerPerson > 0 && (
                <span className="badge price">💰 {pricePerPerson}€/pers</span>
              )}
            </div>
          </div>

          {/* Joueurs */}
          <div className="players-section">
            <div className="players-header">
              <span className="players-label">Joueurs</span>
              <span className={`players-count ${isFull ? 'full' : 'open'}`}>
                {totalPlayers}/{match.spots_total}
              </span>
            </div>

            <div className="players-list">
              
              {/* Organisateur */}
              <div className="player-row orga">
                <div className="player-avatar" style={{ background: getAvatarColor(match.profiles?.name, 0) }}>
                  {match.profiles?.avatar_url ? (
                    <img src={match.profiles.avatar_url} alt="" />
                  ) : (
                    match.profiles?.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {match.profiles?.name}
                    <span className="orga-badge">👑</span>
                  </div>
                  <div className="player-details">
                    <span className="detail level">Niveau {getLevel(match.profiles)}</span>
                    {match.profiles?.position && (
                      <span className="detail">• {POSITION_LABELS[match.profiles.position]}</span>
                    )}
                    <span className="detail reliability" style={{ color: getReliabilityColor(match.profiles?.reliability_score || 100) }}>
                      • {match.profiles?.reliability_score || 100}% fiable
                    </span>
                  </div>
                </div>
              </div>

              {/* Participants */}
              {participants.map((p, i) => (
                <div key={p.id} className="player-row">
                  <div className="player-avatar" style={{ background: getAvatarColor(p.profiles?.name, i + 1) }}>
                    {p.profiles?.avatar_url ? (
                      <img src={p.profiles.avatar_url} alt="" />
                    ) : (
                      p.profiles?.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="player-info">
                    <div className="player-name">{p.profiles?.name}</div>
                    <div className="player-details">
                      <span className="detail level">Niveau {getLevel(p.profiles)}</span>
                      {p.profiles?.position && (
                        <span className="detail">• {POSITION_LABELS[p.profiles.position]}</span>
                      )}
                      <span className="detail reliability" style={{ color: getReliabilityColor(p.profiles?.reliability_score || 100) }}>
                        • {p.profiles?.reliability_score || 100}% fiable
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Places vides */}
              {Array.from({ length: match.spots_available }).map((_, i) => (
                <div key={`empty-${i}`} className="player-row empty">
                  <div className="empty-icon">+</div>
                  <span>Place disponible</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && match && (
            <div className="error-message">{error}</div>
          )}

          {/* Bouton d'action */}
          <div className="action-section">
            {alreadyJoined ? (
              <>
                <div className="already-joined">✓ Tu es inscrit à cette partie !</div>
                <Link href={`/dashboard/match/${matchId}`} className="btn-primary">
                  Voir la partie
                </Link>
              </>
            ) : isFull ? (
              <div className="match-full">Cette partie est complète</div>
            ) : (
              <button onClick={joinMatch} disabled={joining} className={`btn-join ${joining ? 'loading' : ''}`}>
                {joining ? 'Inscription...' : user ? '🎾 Rejoindre cette partie' : '🔐 Se connecter pour rejoindre'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="page-footer">
          <Link href="/" className="footer-link">
            En savoir plus sur 2×2
          </Link>
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
        .join-page {
          min-height: 100vh;
          background: ${COLORS.bg};
          padding: 20px;
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .join-container {
          max-width: 500px;
          margin: 0 auto;
          padding-top: 40px;
        }

        /* Logo */
        .logo-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-link {
          text-decoration: none;
          color: inherit;
          display: inline-block;
        }

        .logo-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 900;
          color: ${COLORS.ink};
          letter-spacing: -1px;
        }

        /* Invite Card */
        .invite-card {
          background: ${COLORS.card};
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        .invite-header {
          text-align: center;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid ${COLORS.border};
        }

        .invite-from {
          font-size: 16px;
          color: ${COLORS.gray};
          margin-bottom: 8px;
        }

        .invite-title {
          font-size: 28px;
          font-weight: 800;
          color: ${COLORS.ink};
          margin: 0;
        }

        /* Info Section */
        .info-section {
          margin-bottom: 28px;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .info-icon {
          width: 48px;
          height: 48px;
          background: ${COLORS.bgSoft};
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
        }

        .info-main {
          font-weight: 700;
          color: ${COLORS.ink};
          font-size: 17px;
        }

        .info-time {
          color: ${COLORS.p3};
          font-weight: 700;
          font-size: 20px;
        }

        .info-sub {
          color: ${COLORS.gray};
          font-size: 14px;
          margin-top: 2px;
        }

        /* Badges */
        .badges-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .badge {
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }

        .badge.level {
          background: ${COLORS.p3Soft};
          color: ${COLORS.p3};
        }

        .badge.price {
          background: ${COLORS.p2Soft};
          color: ${COLORS.p2};
        }

        /* Players Section */
        .players-section {
          margin-bottom: 28px;
        }

        .players-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .players-label {
          font-size: 13px;
          font-weight: 700;
          color: ${COLORS.muted};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .players-count {
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
        }

        .players-count.open {
          background: ${COLORS.p3Soft};
          color: ${COLORS.p3};
        }

        .players-count.full {
          background: ${COLORS.p2Soft};
          color: ${COLORS.p2};
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .player-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border-radius: 16px;
        }

        .player-row.orga {
          border: 2px solid ${COLORS.ink};
          background: ${COLORS.card};
        }

        .player-row.empty {
          justify-content: center;
          border: 2px dashed ${COLORS.border};
          background: transparent;
          color: ${COLORS.muted};
          font-size: 14px;
          padding: 20px;
        }

        .empty-icon {
          width: 32px;
          height: 32px;
          border: 2px dashed ${COLORS.border};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: ${COLORS.muted};
          margin-right: 8px;
        }

        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: ${COLORS.white};
          flex-shrink: 0;
          overflow: hidden;
        }

        .player-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .player-info {
          flex: 1;
          min-width: 0;
        }

        .player-name {
          font-weight: 600;
          color: ${COLORS.ink};
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .orga-badge {
          font-size: 14px;
        }

        .player-details {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .detail {
          font-size: 12px;
          color: ${COLORS.gray};
        }

        .detail.level {
          color: ${COLORS.p3};
          font-weight: 600;
        }

        /* Error Message */
        .error-message {
          background: ${COLORS.p1Soft};
          color: ${COLORS.p1};
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: center;
        }

        /* Action Section */
        .action-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .already-joined {
          background: ${COLORS.p3Soft};
          color: ${COLORS.p3};
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          font-weight: 700;
          font-size: 15px;
        }

        .match-full {
          background: ${COLORS.p2Soft};
          color: ${COLORS.p2};
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          font-weight: 700;
          font-size: 15px;
        }

        .btn-primary {
          display: block;
          width: 100%;
          padding: 18px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          cursor: pointer;
        }

        .btn-join {
          width: 100%;
          padding: 18px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-join:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .btn-join.loading {
          background: ${COLORS.border};
          color: ${COLORS.muted};
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Footer */
        .page-footer {
          text-align: center;
          padding: 20px 0;
        }

        .footer-link {
          color: ${COLORS.gray};
          font-size: 13px;
          text-decoration: none;
        }

        .footer-link:hover {
          color: ${COLORS.ink};
        }

        /* Responsive */
        @media (max-width: 480px) {
          .join-container {
            padding-top: 24px;
          }

          .invite-card {
            padding: 24px;
          }

          .invite-title {
            font-size: 24px;
          }

          .badges-row {
            justify-content: center;
          }

          .player-details {
            flex-direction: column;
            gap: 2px;
          }

          .detail:not(:first-child)::before {
            content: '';
          }
        }
      `}</style>
    </div>
  )
}