'use client'

/**
 * ============================================
 * PLAYER CARD - Branding PadelMatch
 * ============================================
 * 
 * variant="share" : Format 1.91:1 pour réseaux sociaux - SIMPLIFIÉ
 * variant="profile" : Format vertical pour QR code - AÉRÉ
 * 
 * ============================================
 */

export default function PlayerCard({ player, variant = 'share' }) {
  
  // Couleur selon niveau
  const getAccentColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  const styleConfig = {
    loisir: { text: 'Détente', icon: '😎' },
    mix: { text: 'Équilibré', icon: '⚡' },
    compet: { text: 'Compétitif', icon: '🏆' },
    progression: { text: 'Progresser', icon: '📈' }
  }

  const positionConfig = {
    right: 'Droite', left: 'Gauche', both: 'Polyvalent',
    droite: 'Droite', gauche: 'Gauche', les_deux: 'Polyvalent'
  }

  const accentColor = getAccentColor(player.level)
  const style = styleConfig[player.ambiance || player.style] || styleConfig.mix
  const position = positionConfig[player.position] || 'Polyvalent'
  const region = player.region || player.city || ''

  // Logo PadelMatch SVG
  const Logo = ({ size = 20 }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.25,
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
        <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
      </svg>
    </div>
  )

  // ============================================
  // VARIANT: PROFILE (Vertical, pour QR code)
  // ============================================
  if (variant === 'profile') {
    return (
      <div style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 20,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        
        {/* Header - Photo + Infos principales */}
        <div style={{
          padding: '28px 24px 20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Cercle décoratif */}
          <div style={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 180,
            background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          {/* Photo */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: 20,
            background: player.avatar_url 
              ? `url(${player.avatar_url}) center/cover`
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: `0 8px 24px ${accentColor}30`,
            margin: '0 auto 16px',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            fontWeight: 700
          }}>
            {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
          </div>

          {/* Nom */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 10px',
            lineHeight: 1.2
          }}>
            {player.name || 'Joueur'}
          </h1>

          {/* Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: `${accentColor}25`,
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              color: accentColor
            }}>
              {style.icon} {style.text}
            </span>
            {region && (
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)'
              }}>
                📍 {region.length > 15 ? region.substring(0, 14) + '.' : region}
              </span>
            )}
          </div>
        </div>

        {/* Stats principales - Niveau + Position */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.25)',
          padding: '20px'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              textShadow: `0 0 30px ${accentColor}50`
            }}>
              {player.level || '5'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>
              Niveau
            </div>
          </div>
          
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>
              {position === 'Droite' ? '👉' : position === 'Gauche' ? '👈' : '↔️'}
            </div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>{position}</div>
          </div>
        </div>

        {/* Infos secondaires */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {player.matches_played ?? 0}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Parties</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
              {player.reliability_score ?? 100}%
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Fiabilité</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Logo size={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>PadelMatch</span>
        </div>
      </div>
    )
  }

  // ============================================
  // VARIANT: SHARE (Horizontal 1.91:1 - SIMPLIFIÉ)
  // ============================================
  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      aspectRatio: '1.91 / 1',
      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      position: 'relative'
    }}>
      
      {/* Cercle décoratif */}
      <div style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* GAUCHE - Niveau (c'est l'info clé au padel) */}
      <div style={{
        width: '35%',
        background: `linear-gradient(180deg, ${accentColor}20 0%, ${accentColor}08 100%)`,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20px 0'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${accentColor}35 0%, transparent 70%)`,
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            textShadow: `0 0 40px ${accentColor}60`
          }}>
            {player.level || '5'}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: 'rgba(255,255,255,0.5)', 
            fontWeight: 700, 
            letterSpacing: 2,
            marginTop: 4
          }}>
            NIVEAU
          </div>
        </div>
      </div>

      {/* DROITE - Infos joueur */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        justifyContent: 'space-between'
      }}>
        
        {/* Photo + Nom + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Photo */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: player.avatar_url 
              ? `url(${player.avatar_url}) center/cover`
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            border: '2px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
            overflow: 'hidden',
            color: '#fff',
            fontWeight: 700
          }}>
            {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {player.name || 'Joueur'}
            </div>
            
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                background: `${accentColor}20`,
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: accentColor
              }}>
                {style.icon} {style.text}
              </span>
              {region && (
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  📍 {region.length > 10 ? region.substring(0, 9) + '.' : region}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Position + Parties (infos simples) */}
        <div style={{ 
          display: 'flex', 
          gap: 16,
          alignItems: 'center'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '8px 14px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 16 }}>
              {position === 'Droite' ? '👉' : position === 'Gauche' ? '👈' : '↔️'}
            </span>
            <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{position}</span>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '8px 14px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 16 }}>🎾</span>
            <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{player.matches_played ?? 0} parties</span>
          </div>
        </div>

        {/* Logo en bas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={20} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>PadelMatch</span>
        </div>
      </div>
    </div>
  )
}