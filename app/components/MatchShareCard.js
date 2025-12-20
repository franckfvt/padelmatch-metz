'use client'

/**
 * ============================================
 * CARTE MATCH - FORMAT PARTAGE SOCIAL
 * ============================================
 * 
 * Dimensions optimisées : ratio 1.91:1 (1200x630)
 * Compatible : Facebook, WhatsApp, Twitter, LinkedIn
 * 
 * - Format paysage/horizontal
 * - Lieu en titre
 * - Date + heure visibles
 * - 4 avatars avec niveau + poste
 * - Bouton vert "Rejoindre"
 * 
 * ============================================
 */

// Couleurs automatiques basées sur la première lettre
const LETTER_COLORS = {
  A: '#3b82f6', B: '#22c55e', C: '#f59e0b', D: '#a855f7',
  E: '#ef4444', F: '#06b6d4', G: '#ec4899', H: '#14b8a6',
  I: '#3b82f6', J: '#22c55e', K: '#f59e0b', L: '#a855f7',
  M: '#ef4444', N: '#06b6d4', O: '#ec4899', P: '#14b8a6',
  Q: '#3b82f6', R: '#22c55e', S: '#f59e0b', T: '#a855f7',
  U: '#ef4444', V: '#06b6d4', W: '#ec4899', X: '#14b8a6',
  Y: '#3b82f6', Z: '#22c55e'
}

function getColorForName(name) {
  const letter = (name || 'A')[0].toUpperCase()
  return LETTER_COLORS[letter] || '#3b82f6'
}

export default function MatchShareCard({ match, players = [] }) {
  // Séparer les équipes
  const teamA = players.filter(p => p.team === 'A')
  const teamB = players.filter(p => p.team === 'B')
  const confirmedPlayers = players.filter(p => p.status === 'confirmed')
  const spotsRemaining = 4 - confirmedPlayers.length

  // Formater date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date à définir'
    const date = new Date(dateStr)
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    const formatted = date.toLocaleDateString('fr-FR', options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  // Formater heure
  const formatTime = (timeStr) => {
    if (!timeStr) return '?h'
    return timeStr.slice(0, 5)
  }

  // Label poste court
  const getPositionShort = (position) => {
    const map = { right: 'D', left: 'G', both: '↔' }
    return map[position] || ''
  }

  // Composant Avatar Rond compact
  const PlayerAvatar = ({ player, size = 50 }) => {
    const playerProfile = player?.profiles || player
    const name = playerProfile?.name || 'Joueur'
    const avatarUrl = playerProfile?.avatar_url
    const level = playerProfile?.level
    const position = playerProfile?.position
    const color = getColorForName(name)

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 70
      }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)',
          overflow: 'hidden',
          background: avatarUrl ? '#000' : `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.45,
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            name[0]?.toUpperCase() || '?'
          )}
        </div>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 600, 
          color: '#fff',
          textAlign: 'center',
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {name}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {level && (
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '1px 5px',
              borderRadius: 3,
              fontSize: 9,
              color: '#fff',
              fontWeight: 600
            }}>
              {level}
            </span>
          )}
          {position && getPositionShort(position) && (
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1px 5px',
              borderRadius: 3,
              fontSize: 9,
              color: 'rgba(255,255,255,0.8)'
            }}>
              {getPositionShort(position)}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Slot vide
  const EmptySlot = ({ size = 50 }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      width: 70
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        color: 'rgba(255,255,255,0.4)'
      }}>
        +
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Dispo</div>
      <div style={{ height: 14 }} />
    </div>
  )

  // Ambiance
  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente' },
    mix: { emoji: '⚡', label: 'Équilibré' },
    compet: { emoji: '🏆', label: 'Compétitif' }
  }
  const ambiance = ambianceConfig[match?.ambiance] || ambianceConfig.mix

  const locationName = match?.clubs?.name || match?.city || 'Lieu à définir'

  // Remplir les équipes
  const teamADisplay = [...teamA]
  while (teamADisplay.length < 2) teamADisplay.push(null)
  const teamBDisplay = [...teamB]
  while (teamBDisplay.length < 2) teamBDisplay.push(null)

  return (
    <div style={{
      width: '100%',
      maxWidth: 600,
      aspectRatio: '1.91 / 1', // Ratio Facebook/WhatsApp
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header - Lieu + Date/Heure (compact) */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: '0 0 auto'
      }}>
        {/* Lieu + badges */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🎾</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {locationName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '3px 8px',
              borderRadius: 5,
              fontSize: 11,
              color: 'rgba(255,255,255,0.9)'
            }}>
              {ambiance.emoji} {ambiance.label}
            </span>
            {(match?.level_min || match?.level_max) && (
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '3px 8px',
                borderRadius: 5,
                fontSize: 11,
                color: 'rgba(255,255,255,0.9)'
              }}>
                ⭐ Niv. {match.level_min || '?'}-{match.level_max || '?'}
              </span>
            )}
            {spotsRemaining > 0 && (
              <span style={{
                background: 'rgba(34, 197, 94, 0.2)',
                padding: '3px 8px',
                borderRadius: 5,
                fontSize: 11,
                color: '#4ade80',
                fontWeight: 600
              }}>
                {spotsRemaining} place{spotsRemaining > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Date + Heure */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '12px 16px',
          borderRadius: 12,
          textAlign: 'center',
          minWidth: 110
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            📅 {formatDate(match?.match_date)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
            {formatTime(match?.match_time)}
          </div>
        </div>
      </div>

      {/* Zone des équipes - format horizontal */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 20px',
        gap: 16
      }}>
        {/* Équipe A */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#60a5fa',
            textTransform: 'uppercase',
            letterSpacing: 1,
            background: 'rgba(96, 165, 250, 0.15)',
            padding: '3px 10px',
            borderRadius: 5
          }}>
            Équipe A
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {teamADisplay.map((player, i) => 
              player ? <PlayerAvatar key={i} player={player} size={48} /> : <EmptySlot key={i} size={48} />
            )}
          </div>
        </div>

        {/* VS */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.6)',
          border: '2px solid rgba(255,255,255,0.2)',
          flexShrink: 0
        }}>
          VS
        </div>

        {/* Équipe B */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#fb923c',
            textTransform: 'uppercase',
            letterSpacing: 1,
            background: 'rgba(251, 146, 60, 0.15)',
            padding: '3px 10px',
            borderRadius: 5
          }}>
            Équipe B
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {teamBDisplay.map((player, i) => 
              player ? <PlayerAvatar key={i} player={player} size={48} /> : <EmptySlot key={i} size={48} />
            )}
          </div>
        </div>
      </div>

      {/* Footer branding + CTA */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: '0 0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo PadelMatch */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
              <path d="M12 2C12 2 12 8 12 12C12 16 12 22 12 22" stroke="#fff" strokeWidth="1.5"/>
              <path d="M2 12C2 12 8 12 12 12C16 12 22 12 22 12" stroke="#fff" strokeWidth="1.5"/>
              <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>
              PadelMatch
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
              Organise tes parties
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
        }}>
          Rejoindre la partie →
        </div>
      </div>
    </div>
  )
}