'use client'

// ============================================
// COMPOSANT PLAYER CARD - Simplifié & Responsive
// ============================================

export default function PlayerCard({ player, standalone = false }) {
  // Couleurs selon le niveau
  const getLevelColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  const levelColor = getLevelColor(player.level)

  // Config labels
  const getStyleText = (style) => {
    const map = {
      loisir: '😎 Détente',
      progression: '📈 Progression',
      compet: '🏆 Compétitif',
      mix: '⚡ Équilibré'
    }
    return map[style] || '⚡ Équilibré'
  }

  const getPositionText = (pos) => {
    const map = {
      right: 'Droite',
      left: 'Gauche',
      both: 'Polyvalent',
      droite: 'Droite',
      gauche: 'Gauche',
      les_deux: 'Polyvalent'
    }
    return map[pos] || 'Polyvalent'
  }

  const getFrequencyText = (freq) => {
    const map = {
      occasional: '1-2x/mois',
      regular: '1x/sem',
      often: '2-3x/sem',
      intense: '4x+/sem'
    }
    return map[freq] || '1x/sem'
  }

  const getExperienceText = (exp) => {
    const map = {
      'less6months': '< 6 mois',
      '6months2years': '6m - 2ans',
      '2to5years': '2 - 5 ans',
      'more5years': '+ 5 ans'
    }
    return map[exp] || '2 - 5 ans'
  }

  const regionShort = (region) => {
    if (!region) return 'France'
    if (region.length > 15) return region.substring(0, 12) + '...'
    return region
  }

  return (
    <div style={{ 
      width: '100%',
      maxWidth: standalone ? 400 : '100%'
    }}>
      {/* Glow externe (standalone only) */}
      {standalone && (
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            inset: -6,
            background: levelColor,
            filter: 'blur(20px)',
            opacity: 0.3,
            borderRadius: 16
          }} />
        </div>
      )}

      {/* Carte principale */}
      <div style={{
        position: 'relative',
        background: '#0a0a0f',
        borderRadius: standalone ? 14 : 0,
        overflow: 'hidden',
        border: standalone ? `2px solid ${levelColor}` : 'none'
      }}>
        
        {/* Header : Niveau + Nom + Style */}
        <div style={{
          background: `linear-gradient(135deg, ${levelColor}15, transparent)`,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Niveau */}
          <div style={{
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, ${levelColor}25, ${levelColor}10)`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${levelColor}`,
            flexShrink: 0
          }}>
            <span style={{ 
              fontSize: 26, 
              fontWeight: '900', 
              color: levelColor,
              lineHeight: 1
            }}>
              {player.level || '?'}
            </span>
            <span style={{ 
              fontSize: 7, 
              color: 'rgba(255,255,255,0.5)', 
              letterSpacing: 1,
              marginTop: 2
            }}>
              NIVEAU
            </span>
          </div>

          {/* Nom + Style */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: '#fff', 
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {player.name || 'Joueur'}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '3px 8px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)'
            }}>
              {getStyleText(player.ambiance || player.style)}
            </div>
          </div>
        </div>

        {/* Grille 2x2 des infos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          background: 'rgba(255,255,255,0.03)'
        }}>
          {[
            { label: 'POSTE', value: getPositionText(player.position) },
            { label: 'FRÉQUENCE', value: getFrequencyText(player.frequency) },
            { label: 'EXPÉRIENCE', value: getExperienceText(player.experience) },
            { label: 'RÉGION', value: regionShort(player.region) }
          ].map((item, i) => (
            <div 
              key={i}
              style={{
                padding: '12px 8px',
                background: '#0a0a0f',
                textAlign: 'center'
              }}
            >
              <div style={{ 
                fontSize: 13, 
                fontWeight: '700', 
                color: '#fff',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {item.value}
              </div>
              <div style={{ 
                fontSize: 8, 
                color: 'rgba(255,255,255,0.35)', 
                letterSpacing: 0.5
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer branding */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <span style={{ fontSize: 12 }}>🎾</span>
          <span style={{ 
            fontSize: 9, 
            color: 'rgba(255,255,255,0.5)', 
            fontWeight: '700',
            letterSpacing: 1
          }}>
            PADELMATCH
          </span>
        </div>
      </div>
    </div>
  )
}