'use client'

/**
 * ============================================
 * CARTE MATCH - 4 RONDS AVATARS + ÉQUIPES
 * ============================================
 * 
 * Format apprécié avec :
 * - 4 ronds pour les joueurs
 * - Équipes visibles (2 vs 2)
 * - Niveau + Poste sous chaque avatar
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
  // Séparer les équipes
  const team1 = players.filter(p => p.team === 1)
  const team2 = players.filter(p => p.team === 2)
  const spotsRemaining = 4 - players.length

  // Formater date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date à définir'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  // Formater heure
  const formatTime = (timeStr) => {
    if (!timeStr) return '?h'
    return timeStr.slice(0, 5)
  }

  // Label poste court
  const getPositionShort = (position) => {
    const map = { right: 'Droite', left: 'Gauche', both: 'Poly.' }
    return map[position] || '—'
  }

  // Composant Avatar Rond avec infos
  const PlayerAvatar = ({ player, size = 64 }) => {
    const name = player?.profiles?.name || player?.name || 'Joueur'
    const avatarUrl = player?.profiles?.avatar_url
    const level = player?.profiles?.level
    const position = player?.profiles?.position
    const color = getColorForName(name)

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: 80
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
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {name}
        </div>
        
        {/* Niveau + Poste */}
        <div style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center'
        }}>
          {level && (
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600
            }}>
              ⭐ {level}
            </span>
          )}
          {position && (
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
      width: 80
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
      <div style={{ height: 18 }} /> {/* Spacer pour aligner */}
    </div>
  )

  // Ambiance config
  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente' },
    mix: { emoji: '⚡', label: 'Équilibré' },
    compet: { emoji: '🏆', label: 'Compétitif' }
  }
  const ambiance = ambianceConfig[match?.ambiance] || ambianceConfig.mix

  // Remplir les équipes avec des slots vides si nécessaire
  const team1Display = [...team1]
  while (team1Display.length < 2) team1Display.push(null)
  
  const team2Display = [...team2]
  while (team2Display.length < 2) team2Display.push(null)

  return (
    <div style={{
      width: '100%',
      maxWidth: 440,
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      
      {/* Header avec infos principales */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Titre + Date */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🎾</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                Partie de Padel
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {formatDate(match?.match_date)}
              </div>
            </div>
          </div>
          
          {/* Heure */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '10px 16px',
            borderRadius: 12,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {formatTime(match?.match_time)}
            </div>
          </div>
        </div>

        {/* Infos en pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Lieu */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '6px 12px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 12 }}>📍</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
              {match?.clubs?.name || match?.city || 'Lieu à définir'}
            </span>
          </div>

          {/* Ambiance */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '6px 12px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 12 }}>{ambiance.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
              {ambiance.label}
            </span>
          </div>

          {/* Niveau */}
          {(match?.level_min || match?.level_max) && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ fontSize: 12 }}>⭐</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                Niv. {match.level_min || '?'}-{match.level_max || '?'}
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
          {/* Équipe 1 */}
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
              marginBottom: 4
            }}>
              Équipe A
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {team1Display.map((player, i) => 
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
            paddingTop: 40
          }}>
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
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              VS
            </div>
          </div>

          {/* Équipe 2 */}
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
              marginBottom: 4
            }}>
              Équipe B
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {team2Display.map((player, i) => 
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

      {/* Footer branding */}
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
          background: 'rgba(255,255,255,0.15)',
          padding: '8px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#fff'
        }}>
          Rejoindre →
        </div>
      </div>
    </div>
  )
}