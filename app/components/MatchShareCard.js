'use client'

/**
 * ============================================
 * CARTE MATCH - VERSION FINALE
 * ============================================
 * 
 * - Lieu en titre (pas "Partie de Padel")
 * - Date + heure mis en avant
 * - 4 ronds avatars avec niveau + poste
 * - Équipes A/B (pas 1/2)
 * - Bouton rejoindre en vert
 * - Design sobre dark
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
  // Séparer les équipes - ATTENTION: team est 'A' ou 'B', pas 1 ou 2
  const teamA = players.filter(p => p.team === 'A')
  const teamB = players.filter(p => p.team === 'B')
  const confirmedPlayers = players.filter(p => p.status === 'confirmed')
  const spotsRemaining = 4 - confirmedPlayers.length

  // Formater date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date à définir'
    const date = new Date(dateStr)
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    const formatted = date.toLocaleDateString('fr-FR', options)
    // Première lettre en majuscule
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  // Formater heure
  const formatTime = (timeStr) => {
    if (!timeStr) return '?h'
    return timeStr.slice(0, 5)
  }

  // Label poste court
  const getPositionShort = (position) => {
    const map = { right: 'Droite', left: 'Gauche', both: 'Poly.' }
    return map[position] || ''
  }

  // Composant Avatar Rond avec infos
  const PlayerAvatar = ({ player, size = 64 }) => {
    // Gérer les différentes structures de données possibles
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
        gap: 6,
        width: 85
      }}>
        {/* Avatar rond */}
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.3)',
          overflow: 'hidden',
          background: avatarUrl ? '#000' : `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.45,
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            name[0]?.toUpperCase() || '?'
          )}
        </div>
        
        {/* Nom */}
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: '#fff',
          textAlign: 'center',
          maxWidth: 85,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {name}
        </div>
        
        {/* Niveau + Poste */}
        <div style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {level && (
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 600
            }}>
              ⭐{level}
            </span>
          )}
          {position && getPositionShort(position) && (
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)'
            }}>
              {getPositionShort(position)}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Slot vide rond
  const EmptySlot = ({ size = 64 }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 85
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '3px dashed rgba(255,255,255,0.25)',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        color: 'rgba(255,255,255,0.4)'
      }}>
        +
      </div>
      <div style={{ 
        fontSize: 11, 
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 500
      }}>
        Disponible
      </div>
      <div style={{ height: 18 }} />
    </div>
  )

  // Ambiance config
  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente' },
    mix: { emoji: '⚡', label: 'Équilibré' },
    compet: { emoji: '🏆', label: 'Compétitif' }
  }
  const ambiance = ambianceConfig[match?.ambiance] || ambianceConfig.mix

  // Lieu
  const locationName = match?.clubs?.name || match?.city || 'Lieu à définir'

  // Remplir les équipes avec des slots vides
  const teamADisplay = [...teamA]
  while (teamADisplay.length < 2) teamADisplay.push(null)
  
  const teamBDisplay = [...teamB]
  while (teamBDisplay.length < 2) teamBDisplay.push(null)

  return (
    <div style={{
      width: '100%',
      maxWidth: 460,
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      
      {/* Header - Lieu + Date/Heure en grand */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Lieu en titre */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          marginBottom: 16
        }}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {locationName}
            </div>
            {match?.clubs?.address && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {match.clubs.address}
              </div>
            )}
          </div>
        </div>

        {/* Date + Heure en grand */}
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'stretch'
        }}>
          {/* Date */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.08)',
            padding: '14px 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                {formatDate(match?.match_date)}
              </div>
            </div>
          </div>

          {/* Heure */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '14px 20px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 20 }}>🕐</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {formatTime(match?.match_time)}
            </div>
          </div>
        </div>

        {/* Badges infos */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {/* Ambiance */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '5px 10px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}>
            <span style={{ fontSize: 12 }}>{ambiance.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              {ambiance.label}
            </span>
          </div>

          {/* Niveau */}
          {(match?.level_min || match?.level_max) && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '5px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ fontSize: 12 }}>⭐</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Niveau {match.level_min || '?'}-{match.level_max || '?'}
              </span>
            </div>
          )}

          {/* Prix */}
          {match?.price_total > 0 && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              padding: '5px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>
                {Math.round(match.price_total / 100 / 4)}€/pers
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Zone des équipes - 4 ronds */}
      <div style={{ padding: '28px 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 12
        }}>
          {/* Équipe A */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#60a5fa',
              textTransform: 'uppercase',
              letterSpacing: 1,
              background: 'rgba(96, 165, 250, 0.1)',
              padding: '4px 12px',
              borderRadius: 6
            }}>
              Équipe A
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {teamADisplay.map((player, i) => 
                player ? (
                  <PlayerAvatar key={i} player={player} size={60} />
                ) : (
                  <EmptySlot key={i} size={60} />
                )
              )}
            </div>
          </div>

          {/* VS au centre */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 36
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.6)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              VS
            </div>
          </div>

          {/* Équipe B */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fb923c',
              textTransform: 'uppercase',
              letterSpacing: 1,
              background: 'rgba(251, 146, 60, 0.1)',
              padding: '4px 12px',
              borderRadius: 6
            }}>
              Équipe B
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {teamBDisplay.map((player, i) => 
                player ? (
                  <PlayerAvatar key={i} player={player} size={60} />
                ) : (
                  <EmptySlot key={i} size={60} />
                )
              )}
            </div>
          </div>
        </div>

        {/* Places restantes */}
        {spotsRemaining > 0 && (
          <div style={{
            marginTop: 24,
            textAlign: 'center',
            padding: '10px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 10,
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
              🎾 {spotsRemaining} place{spotsRemaining > 1 ? 's' : ''} disponible{spotsRemaining > 1 ? 's' : ''} !
            </span>
          </div>
        )}
      </div>

      {/* Footer branding + CTA vert */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎾</span>
          <span style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 0.5
          }}>
            PadelMatch
          </span>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
        }}>
          Rejoindre →
        </div>
      </div>
    </div>
  )
}