'use client'

/**
 * ============================================
 * PLAYER CARD - VERSION SIMPLE ET FIABLE
 * ============================================
 * 
 * 2 formats:
 * - variant="share" : Horizontal pour réseaux sociaux
 * - variant="mobile" : Vertical pour affichage in-app
 * 
 * PAS de QR code = PAS de bugs
 * 
 * ============================================
 */

import { getBadgeById } from '@/app/lib/badges'

export default function PlayerCard({ 
  player, 
  variant = 'mobile'
}) {
  
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
    often: '2-3x/sem',
    regular: '1x/sem',
    occasional: '1-2/mois'
  }

  const position = positionConfig[player?.position] || positionConfig.both
  const frequency = frequencyConfig[player?.frequency] || '2-3x/sem'
  const badge = player?.badge ? getBadgeById(player.badge) : null
  const city = player?.city || player?.region || 'France'
  const initial = player?.name?.[0]?.toUpperCase() || '?'

  // ============================================
  // VARIANT: SHARE (Horizontal)
  // ============================================
  if (variant === 'share') {
    return (
      <div style={{
        width: 400,
        height: 210,
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        position: 'relative'
      }}>
        
        {/* GAUCHE: Niveau + Poste */}
        <div style={{
          width: 140,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Niveau */}
          <div style={{
            border: '2px solid #22c55e',
            borderRadius: 12,
            padding: '14px 10px',
            textAlign: 'center',
            background: 'rgba(34, 197, 94, 0.1)'
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
              {player?.level || '5'}
            </div>
            <div style={{ fontSize: 9, color: '#4ade80', marginTop: 4, fontWeight: 600, letterSpacing: 1 }}>
              NIVEAU
            </div>
          </div>
          
          {/* Poste */}
          <div style={{
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {position.emoji} {position.label}
            </div>
          </div>
        </div>

        {/* DROITE: Infos */}
        <div style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          
          {/* Photo + Nom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: player?.avatar_url 
                ? `url(${player.avatar_url}) center/cover`
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.2)',
              flexShrink: 0
            }}>
              {!player?.avatar_url && initial}
            </div>
            
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {player?.name || 'Joueur'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, color: '#fff', marginTop: 4 }}>
                📍 {city}
              </div>
            </div>
          </div>

          {/* Badge + Fréquence */}
          <div style={{ 
            display: 'flex', 
            gap: 10,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 10
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{badge?.emoji || '⚔️'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{badge?.label || 'Attaquant'}</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{frequency}</div>
              <div style={{ fontSize: 8, opacity: 0.5, color: '#fff' }}>FRÉQUENCE</div>
            </div>
          </div>

          {/* Logo */}
          <div style={{ textAlign: 'right', fontSize: 10, opacity: 0.4, color: '#fff' }}>
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
      width: 280,
      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      borderRadius: 20,
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
      textAlign: 'center'
    }}>
      
      {/* Photo */}
      <div style={{
        width: 90,
        height: 90,
        borderRadius: 22,
        background: player?.avatar_url 
          ? `url(${player.avatar_url}) center/cover`
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        fontWeight: 700,
        margin: '0 auto 16px',
        border: '3px solid rgba(255,255,255,0.2)'
      }}>
        {!player?.avatar_url && initial}
      </div>

      {/* Nom + Ville */}
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
        {player?.name || 'Joueur'}
      </div>
      <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        📍 {city}
      </div>

      {/* Niveau */}
      <div style={{
        background: 'rgba(34, 197, 94, 0.15)',
        border: '2px solid #22c55e',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 14
      }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
          {player?.level || '5'}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>NIVEAU</div>
      </div>

      {/* Poste + Fréquence */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: '10px 12px',
          borderRadius: 10
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{position.label}</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>Poste</div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.1)',
          padding: '10px 12px',
          borderRadius: 10
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{frequency}</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>Fréquence</div>
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          padding: '8px 16px',
          borderRadius: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16
        }}>
          <span style={{ fontSize: 16 }}>{badge.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{badge.label}</span>
        </div>
      )}

      {/* Logo */}
      <div style={{ fontSize: 11, opacity: 0.4 }}>
        🎾 PadelMatch
      </div>
    </div>
  )
}