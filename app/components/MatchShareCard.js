'use client'

/**
 * ============================================
 * CARTE DE MATCH - Pour partage après création
 * ============================================
 * 
 * Affiche:
 * - Infos de la partie (date, lieu, niveau)
 * - Les 4 slots de joueurs (équipe A vs équipe B)
 * - Places restantes
 * 
 * ============================================
 */

export default function MatchShareCard({ match, organizer, partners = [] }) {
  
  const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (time) => {
    if (!time) return null
    return time.substring(0, 5).replace(':', 'h')
  }

  const getAmbianceEmoji = (ambiance) => {
    const map = { loisir: '😎', mix: '⚡', compet: '🏆' }
    return map[ambiance] || '⚡'
  }

  const getAmbianceLabel = (ambiance) => {
    const map = { loisir: 'Détente', mix: 'Équilibré', compet: 'Compétitif' }
    return map[ambiance] || 'Équilibré'
  }

  const dateDisplay = match.match_date 
    ? formatDate(match.match_date) 
    : match.flexible_day || 'Flexible'

  const timeDisplay = match.match_time 
    ? formatTime(match.match_time) 
    : ''

  const clubName = match.clubs?.name || match.club_name || 'Club à définir'

  // Construire les équipes
  // L'organisateur est en équipe A par défaut (ou selon organizer_team)
  const organizerTeam = match.organizer_team || 'A'
  
  // Séparer les partenaires par équipe
  const teamA = []
  const teamB = []
  
  // Ajouter l'organisateur
  if (organizer) {
    const orgPlayer = {
      name: organizer.name,
      avatar_url: organizer.avatar_url,
      isOrganizer: true
    }
    if (organizerTeam === 'A') {
      teamA.push(orgPlayer)
    } else {
      teamB.push(orgPlayer)
    }
  }
  
  // Ajouter les partenaires
  partners.forEach(p => {
    const player = {
      name: p.name,
      avatar_url: p.avatar_url,
      isManual: p.isManual
    }
    if (p.team === 'A') {
      teamA.push(player)
    } else {
      teamB.push(player)
    }
  })
  
  // Compléter avec des slots vides
  while (teamA.length < 2) teamA.push(null)
  while (teamB.length < 2) teamB.push(null)

  const spotsLeft = teamA.filter(p => !p).length + teamB.filter(p => !p).length

  // Composant pour un slot de joueur
  const PlayerSlot = ({ player, size = 44 }) => {
    if (!player) {
      // Slot vide
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.1)',
          border: '2px dashed rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: 'rgba(255,255,255,0.4)'
        }}>
          ?
        </div>
      )
    }

    const initial = player.name?.[0]?.toUpperCase() || '?'

    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: player.avatar_url 
            ? `url(${player.avatar_url}) center/cover`
            : player.isOrganizer 
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : player.isManual
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          border: player.isOrganizer ? '2px solid #4ade80' : 'none',
          position: 'relative'
        }}>
          {!player.avatar_url && initial}
          {player.isOrganizer && (
            <div style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: '#22c55e',
              borderRadius: '50%',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              border: '2px solid #1e293b'
            }}>
              ★
            </div>
          )}
        </div>
        <div style={{ 
          fontSize: 11, 
          color: '#fff', 
          marginTop: 4,
          maxWidth: size + 10,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {player.name?.split(' ')[0] || 'Joueur'}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 360,
      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff'
    }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 2, letterSpacing: 1 }}>PARTIE DE PADEL</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {spotsLeft > 0 ? `🎾 ${spotsLeft} place${spotsLeft > 1 ? 's' : ''} dispo` : '🎾 Complet !'}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '5px 10px',
          borderRadius: 16,
          fontSize: 11,
          fontWeight: 600
        }}>
          {getAmbianceEmoji(match.ambiance)} {getAmbianceLabel(match.ambiance)}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '16px 20px' }}>
        
        {/* Date / Heure / Lieu en ligne */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          fontSize: 13
        }}>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.08)',
            padding: '10px 12px',
            borderRadius: 10,
            textAlign: 'center'
          }}>
            <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>📅</div>
            <div style={{ fontWeight: 700 }}>{dateDisplay}</div>
          </div>
          {timeDisplay && (
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              padding: '10px 12px',
              borderRadius: 10,
              textAlign: 'center'
            }}>
              <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>🕐</div>
              <div style={{ fontWeight: 700 }}>{timeDisplay}</div>
            </div>
          )}
          <div style={{
            flex: 1.5,
            background: 'rgba(255,255,255,0.08)',
            padding: '10px 12px',
            borderRadius: 10,
            textAlign: 'center'
          }}>
            <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>📍</div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{clubName}</div>
          </div>
        </div>

        {/* Équipes */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Équipe A */}
            <div style={{ display: 'flex', gap: 10 }}>
              <PlayerSlot player={teamA[0]} />
              <PlayerSlot player={teamA[1]} />
            </div>

            {/* VS */}
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1
            }}>
              VS
            </div>

            {/* Équipe B */}
            <div style={{ display: 'flex', gap: 10 }}>
              <PlayerSlot player={teamB[0]} />
              <PlayerSlot player={teamB[1]} />
            </div>
          </div>
        </div>

        {/* Niveau */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13
        }}>
          <span style={{ opacity: 0.6 }}>Niveau recherché</span>
          <span style={{
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            padding: '4px 10px',
            borderRadius: 6,
            fontWeight: 700
          }}>
            {match.level_min} - {match.level_max}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: 10,
        opacity: 0.5
      }}>
        🎾 PadelMatch
      </div>
    </div>
  )
}