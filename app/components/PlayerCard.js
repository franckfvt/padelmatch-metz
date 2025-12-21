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
 * ============================================
 */

import QRCodeStyled from './QRCodeStyled'
import { getBadgeById } from '@/app/lib/badges'

export default function PlayerCard({ 
  player, 
  variant = 'mobile',
  showQR = true,
  size = 'default' // 'small', 'default', 'large'
}) {
  
  // URL du profil pour le QR code - fallback sur l'URL actuelle si pas d'ID
  const getProfileUrl = () => {
    if (typeof window === 'undefined') {
      return player?.id ? `https://padelmatch.fr/player/${player.id}` : 'https://padelmatch.fr'
    }
    if (player?.id) {
      return `${window.location.origin}/player/${player.id}`
    }
    // Fallback: si on est déjà sur /player/xxx, utiliser cette URL
    if (window.location.pathname.startsWith('/player/')) {
      return window.location.href
    }
    return window.location.origin
  }
  const profileUrl = getProfileUrl()

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
    return (
      <div style={{
        width: '100%',
        maxWidth: 460,
        aspectRatio: '1.91 / 1',
        background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        position: 'relative',
        flexShrink: 0
      }}>
        
        {/* GAUCHE: Niveau + Poste (38%) */}
        <div style={{
          width: '38%',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Niveau */}
          <div style={{
            border: '2px solid #22c55e',
            borderRadius: 12,
            padding: 12,
            textAlign: 'center',
            background: 'rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 900, 
              color: '#4ade80', 
              lineHeight: 1 
            }}>
              {player?.level || '5'}
            </div>
            <div style={{ 
              fontSize: 9, 
              color: '#4ade80', 
              marginTop: 4, 
              fontWeight: 600,
              letterSpacing: 1
            }}>
              NIVEAU
            </div>
          </div>
          
          {/* Poste */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: 8,
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#fff' 
            }}>
              {position.emoji} {position.label}
            </div>
            <div style={{ 
              fontSize: 8, 
              opacity: 0.5, 
              marginTop: 2,
              color: '#fff'
            }}>
              POSTE
            </div>
          </div>
        </div>

        {/* DROITE: Infos (62%) */}
        <div style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          
          {/* Header: Photo + Nom + QR */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              {/* Photo */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: player?.avatar_url 
                  ? `url(${player.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {!player?.avatar_url && (player?.name?.[0]?.toUpperCase() || '?')}
              </div>
              
              {/* Nom + Ville */}
              <div style={{ minWidth: 0 }}>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: '#fff',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {player?.name || 'Joueur'}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  opacity: 0.6,
                  color: '#fff',
                  marginTop: 2
                }}>
                  📍 {city || 'France'}
                </div>
              </div>
            </div>
            
            {/* QR Code */}
            {showQR && (
              <QRCodeStyled url={profileUrl} size={48} />
            )}
          </div>

          {/* Stats: Badge + Fréquence */}
          <div style={{ 
            display: 'flex', 
            gap: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: 10,
            alignItems: 'center'
          }}>
            {/* Badge */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <span style={{ fontSize: 16 }}>
                {badge?.emoji || '⚔️'}
              </span>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 700, 
                color: '#fff' 
              }}>
                {badge?.label || 'Attaquant'}
              </div>
            </div>
            
            <div style={{ 
              width: 1, 
              height: 24,
              background: 'rgba(255,255,255,0.15)'
            }} />
            
            {/* Fréquence */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ 
                fontSize: 15, 
                fontWeight: 700, 
                color: '#fff' 
              }}>
                {frequency}
              </div>
              <div style={{ 
                fontSize: 8, 
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
            fontSize: 10, 
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
  return (
    <div style={{
      width: '100%',
      maxWidth: 260,
      background: 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
      borderRadius: 20,
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
      textAlign: 'center',
      flexShrink: 0
    }}>
      
      {/* Photo */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: player?.avatar_url 
          ? `url(${player.avatar_url}) center/cover`
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        fontWeight: 700,
        margin: '0 auto 14px',
        border: '3px solid rgba(255,255,255,0.2)',
        overflow: 'hidden'
      }}>
        {!player?.avatar_url && (player?.name?.[0]?.toUpperCase() || '?')}
      </div>

      {/* Nom + Ville */}
      <div style={{ 
        fontSize: 22, 
        fontWeight: 800, 
        marginBottom: 4 
      }}>
        {player?.name || 'Joueur'}
      </div>
      <div style={{ 
        fontSize: 12, 
        opacity: 0.6, 
        marginBottom: 16 
      }}>
        📍 {city || 'France'}
      </div>

      {/* Niveau + QR Code côte à côte */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 14,
        alignItems: 'stretch'
      }}>
        {/* Niveau */}
        <div style={{
          flex: 1,
          background: 'rgba(34, 197, 94, 0.2)',
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 900, 
            color: '#4ade80', 
            lineHeight: 1 
          }}>
            {player?.level || '5'}
          </div>
          <div style={{ 
            fontSize: 10, 
            opacity: 0.7, 
            marginTop: 4 
          }}>
            NIVEAU
          </div>
        </div>

        {/* QR Code */}
        {showQR && (
          <QRCodeStyled url={profileUrl} size={70} />
        )}
      </div>

      {/* Poste + Fréquence */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 16 
      }}>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: '8px 12px',
          borderRadius: 10
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700 
          }}>
            {position.label}
          </div>
          <div style={{ 
            fontSize: 9, 
            opacity: 0.6 
          }}>
            Poste
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: '8px 12px',
          borderRadius: 10
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700 
          }}>
            {frequency}
          </div>
          <div style={{ 
            fontSize: 9, 
            opacity: 0.6 
          }}>
            / semaine
          </div>
        </div>
      </div>

      {/* Logo */}
      <div style={{ 
        fontSize: 11, 
        opacity: 0.4 
      }}>
        🎾 PadelMatch
      </div>
    </div>
  )
}