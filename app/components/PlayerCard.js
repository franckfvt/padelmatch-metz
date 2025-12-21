'use client'

/**
 * ============================================
 * PLAYER CARD - VERSIONS FINALES PADELMATCH
 * ============================================
 * 
 * 2 formats:
 * - variant="share" : Horizontal 1.91:1 pour réseaux sociaux
 * - variant="mobile" : Vertical pour affichage in-app
 * 
 * Proportions FIXES - taille s'adapte mais ratios constants
 * 
 * ============================================
 */

import { QRCodeStyledSVG } from './QRCodeStyled'
import { getBadgeById } from '@/app/lib/badges'

export default function PlayerCard({ 
  player, 
  variant = 'mobile',
  showQR = true,
  size = 'default' // 'small', 'default', 'large'
}) {
  
  // Tailles selon le variant et size
  const sizes = {
    share: {
      small: { width: 320, height: 168 },
      default: { width: 500, height: 262 },
      large: { width: 600, height: 314 }
    },
    mobile: {
      small: { width: 220 },
      default: { width: 280 },
      large: { width: 340 }
    }
  }

  const currentSize = sizes[variant]?.[size] || sizes[variant]?.default

  // Config position
  const positionConfig = {
    right: { emoji: '➡️', label: 'Droite' },
    left: { emoji: '⬅️', label: 'Gauche' },
    both: { emoji: '↔️', label: 'Polyvalent' },
    droite: { emoji: '➡️', label: 'Droite' },
    gauche: { emoji: '⬅️', label: 'Gauche' },
    les_deux: { emoji: '↔️', label: 'Polyvalent' }
  }

  // Config fréquence
  const frequencyConfig = {
    intense: '4+/sem',
    often: '2-3x',
    regular: '1x/sem',
    occasional: '1-2/mois'
  }

  const position = positionConfig[player?.position] || positionConfig.both
  const frequency = frequencyConfig[player?.frequency] || '2-3x'
  const badge = player?.badge ? getBadgeById(player.badge) : null
  const city = player?.city || player?.region || ''

  // ============================================
  // VARIANT: SHARE (Horizontal 1.91:1)
  // ============================================
  if (variant === 'share') {
    const w = currentSize.width
    const h = currentSize.height
    const scale = w / 500 // Base scale

    return (
      <div style={{
        width: w,
        height: h,
        background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
        borderRadius: 16 * scale,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        position: 'relative',
        flexShrink: 0
      }}>
        
        {/* GAUCHE: Niveau + Poste (38%) */}
        <div style={{
          width: '38%',
          padding: 20 * scale,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10 * scale,
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Niveau */}
          <div style={{
            border: '2px solid #22c55e',
            borderRadius: 14 * scale,
            padding: `${14 * scale}px`,
            textAlign: 'center',
            background: 'rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{ 
              fontSize: 40 * scale, 
              fontWeight: 900, 
              color: '#4ade80', 
              lineHeight: 1 
            }}>
              {player?.level || '5'}
            </div>
            <div style={{ 
              fontSize: 10 * scale, 
              color: '#4ade80', 
              marginTop: 4 * scale, 
              fontWeight: 600,
              letterSpacing: 1
            }}>
              NIVEAU
            </div>
          </div>
          
          {/* Poste */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10 * scale,
            padding: `${10 * scale}px`,
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: 16 * scale, 
              fontWeight: 700, 
              color: '#fff' 
            }}>
              {position.emoji} {position.label}
            </div>
            <div style={{ 
              fontSize: 9 * scale, 
              opacity: 0.5, 
              marginTop: 2 * scale,
              color: '#fff'
            }}>
              POSTE
            </div>
          </div>
        </div>

        {/* DROITE: Infos (62%) */}
        <div style={{
          flex: 1,
          padding: `${20 * scale}px ${24 * scale}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          
          {/* Header: Photo + Nom + QR */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 * scale }}>
              {/* Photo */}
              <div style={{
                width: 70 * scale,
                height: 70 * scale,
                borderRadius: 18 * scale,
                background: player?.avatar_url 
                  ? `url(${player.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28 * scale,
                fontWeight: 700,
                color: '#fff',
                border: '3px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {!player?.avatar_url && (player?.name?.[0]?.toUpperCase() || '?')}
              </div>
              
              {/* Nom + Ville */}
              <div>
                <div style={{ 
                  fontSize: 26 * scale, 
                  fontWeight: 800, 
                  color: '#fff',
                  lineHeight: 1.1
                }}>
                  {player?.name || 'Joueur'}
                </div>
                <div style={{ 
                  fontSize: 13 * scale, 
                  opacity: 0.6,
                  color: '#fff',
                  marginTop: 2 * scale
                }}>
                  📍 {city || 'France'}
                </div>
              </div>
            </div>
            
            {/* QR Code */}
            {showQR && (
              <QRCodeStyledSVG size={58 * scale} />
            )}
          </div>

          {/* Stats: Badge + Fréquence */}
          <div style={{ 
            display: 'flex', 
            gap: 12 * scale,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12 * scale,
            padding: 12 * scale,
            alignItems: 'stretch'
          }}>
            {/* Badge */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8 * scale
            }}>
              <span style={{ fontSize: 20 * scale }}>
                {badge?.emoji || '⚔️'}
              </span>
              <div style={{ 
                fontSize: 15 * scale, 
                fontWeight: 700, 
                color: '#fff' 
              }}>
                {badge?.label || 'Attaquant'}
              </div>
            </div>
            
            <div style={{ 
              width: 1, 
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Fréquence */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ 
                fontSize: 18 * scale, 
                fontWeight: 700, 
                color: '#fff' 
              }}>
                {frequency}
              </div>
              <div style={{ 
                fontSize: 9 * scale, 
                opacity: 0.5,
                color: '#fff'
              }}>
                / SEMAINE
              </div>
            </div>
          </div>

          {/* Logo */}
          <div style={{ 
            textAlign: 'right', 
            fontSize: 11 * scale, 
            opacity: 0.4,
            color: '#fff'
          }}>
            🎾 PadelMatch
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // VARIANT: MOBILE (Vertical)
  // ============================================
  const w = currentSize.width
  const scale = w / 280 // Base scale

  return (
    <div style={{
      width: w,
      background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
      borderRadius: 20 * scale,
      padding: 24 * scale,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
      textAlign: 'center',
      flexShrink: 0
    }}>
      
      {/* Photo */}
      <div style={{
        width: 100 * scale,
        height: 100 * scale,
        borderRadius: 24 * scale,
        background: player?.avatar_url 
          ? `url(${player.avatar_url}) center/cover`
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40 * scale,
        fontWeight: 700,
        margin: `0 auto ${16 * scale}px`,
        border: '4px solid rgba(255,255,255,0.2)',
        overflow: 'hidden'
      }}>
        {!player?.avatar_url && (player?.name?.[0]?.toUpperCase() || '?')}
      </div>

      {/* Nom + Ville */}
      <div style={{ 
        fontSize: 26 * scale, 
        fontWeight: 800, 
        marginBottom: 4 * scale 
      }}>
        {player?.name || 'Joueur'}
      </div>
      <div style={{ 
        fontSize: 14 * scale, 
        opacity: 0.6, 
        marginBottom: 20 * scale 
      }}>
        📍 {city || 'France'}
      </div>

      {/* Niveau + QR Code côte à côte */}
      <div style={{ 
        display: 'flex', 
        gap: 12 * scale, 
        marginBottom: 16 * scale,
        alignItems: 'stretch'
      }}>
        {/* Niveau */}
        <div style={{
          flex: 1,
          background: 'rgba(34, 197, 94, 0.2)',
          borderRadius: 16 * scale,
          padding: 16 * scale,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: 38 * scale, 
            fontWeight: 900, 
            color: '#4ade80', 
            lineHeight: 1 
          }}>
            {player?.level || '5'}
          </div>
          <div style={{ 
            fontSize: 11 * scale, 
            opacity: 0.7, 
            marginTop: 4 * scale 
          }}>
            NIVEAU
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <QRCodeStyledSVG 
            size={80 * scale} 
            style={{ flexShrink: 0 }}
          />
        )}
      </div>

      {/* Poste + Fréquence */}
      <div style={{ 
        display: 'flex', 
        gap: 10 * scale, 
        marginBottom: 20 * scale 
      }}>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: `${10 * scale}px ${16 * scale}px`,
          borderRadius: 10 * scale
        }}>
          <div style={{ 
            fontSize: 16 * scale, 
            fontWeight: 700 
          }}>
            {position.label}
          </div>
          <div style={{ 
            fontSize: 10 * scale, 
            opacity: 0.6 
          }}>
            Poste
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: `${10 * scale}px ${16 * scale}px`,
          borderRadius: 10 * scale
        }}>
          <div style={{ 
            fontSize: 16 * scale, 
            fontWeight: 700 
          }}>
            {frequency}
          </div>
          <div style={{ 
            fontSize: 10 * scale, 
            opacity: 0.6 
          }}>
            / semaine
          </div>
        </div>
      </div>

      {/* Logo */}
      <div style={{ 
        fontSize: 12 * scale, 
        opacity: 0.4 
      }}>
        🎾 PadelMatch
      </div>
    </div>
  )
}