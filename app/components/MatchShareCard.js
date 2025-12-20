'use client'

/**
 * ============================================
 * CARTE MATCH POUR PARTAGE SOCIAL - V3
 * ============================================
 * 
 * Design optimisé pour WhatsApp/Facebook
 * - Avatars des joueurs bien visibles
 * - Équipes clairement séparées
 * - Infos essentielles (date, heure, lieu)
 * - Branding PadelMatch
 * - Call to action clair
 * 
 * ============================================
 */

// Couleurs avatars
const AVATAR_COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
  purple: '#a855f7',
  red: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
  teal: '#14b8a6'
}

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

export default function MatchShareCard({ match, players = [] }) {
  // Séparer les équipes
  const team1 = players.filter(p => p.team === 1)
  const team2 = players.filter(p => p.team === 2)
  const unassigned = players.filter(p => !p.team)
  const spotsRemaining = 4 - players.length

  // Formater date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  // Formater heure
  const formatTime = (timeStr) => {
    if (!timeStr) return '?h'
    return timeStr.slice(0, 5)
  }

  // Obtenir couleur avatar
  const getAvatarColor = (player, index) => {
    if (player?.profiles?.avatar_color && AVATAR_COLORS[player.profiles.avatar_color]) {
      return AVATAR_COLORS[player.profiles.avatar_color]
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }

  // Composant Avatar
  const PlayerAvatar = ({ player, index, size = 56 }) => {
    const color = getAvatarColor(player, index)
    const name = player?.profiles?.name || player?.name || 'Joueur'
    const avatarUrl = player?.profiles?.avatar_url
    const level = player?.profiles?.level

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
      }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: 14,
          border: '3px solid #fff',
          overflow: 'hidden',
          background: avatarUrl ? '#000' : `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.45,
          fontWeight: 700,
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#fff',
            maxWidth: size + 20,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {name}
          </div>
          {level && (
            <div style={{ 
              fontSize: 10, 
              color: 'rgba(255,255,255,0.7)',
              marginTop: 2
            }}>
              ⭐ {level}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Slot vide
  const EmptySlot = ({ size = 56 }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: 14,
        border: '3px dashed rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        color: 'rgba(255,255,255,0.5)'
      }}>
        +
      </div>
      <div style={{ 
        fontSize: 12, 
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 500
      }}>
        Place dispo
      </div>
    </div>
  )

  // Ambiance config
  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente', color: '#22c55e' },
    mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6' },
    compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b' }
  }
  const ambiance = ambianceConfig[match?.ambiance] || ambianceConfig.mix

  return (
    <div style={{
      width: '100%',
      maxWidth: 500,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header avec infos match */}
      <div style={{
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 800, 
            color: '#fff',
            marginBottom: 4
          }}>
            🎾 Partie de Padel
          </div>
          <div style={{ 
            fontSize: 14, 
            color: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}>
              {ambiance.emoji} {ambiance.label}
            </span>
            {match?.level_min && match?.level_max && (
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600
              }}>
                Niv. {match.level_min}-{match.level_max}
              </span>
            )}
          </div>
        </div>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '12px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            {formatDate(match?.match_date)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>
            {formatTime(match?.match_time)}
          </div>
        </div>
      </div>

      {/* Lieu */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {match?.clubs?.name || match?.city || 'Lieu à définir'}
          </div>
          {match?.clubs?.city && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {match.clubs.city}
            </div>
          )}
        </div>
      </div>

      {/* Zone des équipes */}
      <div style={{ padding: '24px 20px' }}>
        {players.length > 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20
          }}>
            {/* Équipe 1 */}
            <div style={{
              flex: 1,
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: 16,
              padding: 16,
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ 
                fontSize: 11, 
                color: '#3b82f6', 
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Équipe A
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 16,
                flexWrap: 'wrap'
              }}>
                {team1.length > 0 ? (
                  team1.map((player, i) => (
                    <PlayerAvatar key={i} player={player} index={i} size={52} />
                  ))
                ) : (
                  <>
                    <EmptySlot size={52} />
                    <EmptySlot size={52} />
                  </>
                )}
                {team1.length === 1 && <EmptySlot size={52} />}
              </div>
            </div>

            {/* VS */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#1a1a2e',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              flexShrink: 0
            }}>
              VS
            </div>

            {/* Équipe 2 */}
            <div style={{
              flex: 1,
              background: 'rgba(249, 115, 22, 0.15)',
              borderRadius: 16,
              padding: 16,
              border: '2px solid rgba(249, 115, 22, 0.3)'
            }}>
              <div style={{ 
                fontSize: 11, 
                color: '#f97316', 
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Équipe B
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 16,
                flexWrap: 'wrap'
              }}>
                {team2.length > 0 ? (
                  team2.map((player, i) => (
                    <PlayerAvatar key={i} player={player} index={i + 2} size={52} />
                  ))
                ) : (
                  <>
                    <EmptySlot size={52} />
                    <EmptySlot size={52} />
                  </>
                )}
                {team2.length === 1 && <EmptySlot size={52} />}
              </div>
            </div>
          </div>
        ) : (
          /* Si pas encore de joueurs assignés aux équipes */
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            {[0, 1, 2, 3].map(i => {
              const player = unassigned[i]
              return player ? (
                <PlayerAvatar key={i} player={player} index={i} size={60} />
              ) : (
                <EmptySlot key={i} size={60} />
              )
            })}
          </div>
        )}

        {/* Places restantes */}
        {spotsRemaining > 0 && (
          <div style={{
            marginTop: 20,
            textAlign: 'center',
            padding: '12px 20px',
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: 12,
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>
              🎾 {spotsRemaining} place{spotsRemaining > 1 ? 's' : ''} disponible{spotsRemaining > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Footer branding + CTA */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎾</span>
          <div>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 700, 
              color: '#fff',
              letterSpacing: 0.5
            }}>
              PadelMatch
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              Organise tes parties facilement
            </div>
          </div>
        </div>
        <div style={{
          background: '#22c55e',
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          color: '#fff'
        }}>
          Rejoindre →
        </div>
      </div>
    </div>
  )
}