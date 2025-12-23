'use client'

import { useRef } from 'react'

/**
 * Carte de victoire partageable
 * Peut être téléchargée en image ou partagée sur les réseaux
 */
export default function VictoryCard({ 
  playerName,
  partnerName,
  opponentNames,
  score,
  date,
  location,
  winStreak = 0,
  totalWins = 0,
  onClose,
  onShare
}) {
  const cardRef = useRef(null)

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  async function downloadCard() {
    if (!cardRef.current) return

    try {
      // Utiliser html2canvas (à installer) ou l'API native
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2
      })
      
      const link = document.createElement('a')
      link.download = `victoire-padel-${date}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading card:', error)
      alert('Erreur lors du téléchargement. Fais une capture d\'écran à la place !')
    }
  }

  function shareOnWhatsApp() {
    const text = `🏆 VICTOIRE ! ${score ? `(${score})` : ''}\n\n` +
      `🎾 ${playerName}${partnerName ? ` & ${partnerName}` : ''}\n` +
      `📍 ${location || 'Padel'}\n` +
      `📅 ${formattedDate}\n\n` +
      `${winStreak > 1 ? `🔥 Série de ${winStreak} victoires !` : ''}\n` +
      `\n#Junto #Padel #Victory`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareOnFacebook() {
    // Facebook ne permet pas de pré-remplir le texte, mais on peut partager un lien
    const url = window.location.origin
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  function copyText() {
    const text = `🏆 VICTOIRE ! ${score ? `(${score})` : ''}\n` +
      `🎾 ${playerName}${partnerName ? ` & ${partnerName}` : ''}\n` +
      `📍 ${location || 'Padel'} · ${formattedDate}`
    
    navigator.clipboard.writeText(text)
    alert('Texte copié !')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee'
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: '600' }}>
            Partage ta victoire !
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        {/* Carte */}
        <div style={{ padding: 20 }}>
          <div 
            ref={cardRef}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
              borderRadius: 16,
              padding: 24,
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background pattern */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(46,125,50,0.3) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />

            {/* Logo */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: 20,
              position: 'relative'
            }}>
              <span style={{ fontSize: 24 }}>🎾</span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: '700', 
                letterSpacing: 1,
                opacity: 0.7
              }}>
                PADELMATCH
              </span>
            </div>

            {/* Victory badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1a1a1a',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 16
            }}>
              🏆 VICTOIRE
            </div>

            {/* Score */}
            {score && (
              <div style={{
                fontSize: 32,
                fontWeight: '800',
                marginBottom: 16,
                letterSpacing: '-1px'
              }}>
                {score}
              </div>
            )}

            {/* Joueurs */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontSize: 20, 
                fontWeight: '700',
                marginBottom: 4
              }}>
                {playerName}
                {partnerName && (
                  <span style={{ opacity: 0.8 }}> & {partnerName}</span>
                )}
              </div>
              {opponentNames && (
                <div style={{ fontSize: 14, opacity: 0.6 }}>
                  vs {opponentNames}
                </div>
              )}
            </div>

            {/* Infos */}
            <div style={{ 
              display: 'flex', 
              gap: 16,
              fontSize: 13,
              opacity: 0.7
            }}>
              {location && (
                <span>📍 {location}</span>
              )}
              <span>📅 {new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>

            {/* Win streak */}
            {winStreak > 1 && (
              <div style={{
                marginTop: 16,
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>🔥</span>
                <span style={{ fontSize: 13, fontWeight: '600' }}>
                  Série de {winStreak} victoires !
                </span>
              </div>
            )}

            {/* Stats */}
            {totalWins > 0 && (
              <div style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12,
                opacity: 0.6
              }}>
                🏆 {totalWins} victoires cette saison
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px' }}>
          {/* Boutons de partage */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              onClick={shareOnWhatsApp}
              style={{
                flex: 1,
                padding: 14,
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              💬 WhatsApp
            </button>
            <button
              onClick={shareOnFacebook}
              style={{
                flex: 1,
                padding: 14,
                background: '#1877F2',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📘 Facebook
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={downloadCard}
              style={{
                flex: 1,
                padding: 14,
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ⬇️ Télécharger
            </button>
            <button
              onClick={copyText}
              style={{
                flex: 1,
                padding: 14,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copier texte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Mini carte pour l'historique (non-interactive)
 */
export function VictoryCardMini({ 
  result, // 'win' ou 'loss'
  score,
  partnerName,
  date,
  location 
}) {
  const isWin = result === 'win'
  
  return (
    <div style={{
      background: isWin 
        ? 'linear-gradient(135deg, #166534 0%, #22c55e 100%)'
        : 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
      borderRadius: 12,
      padding: 16,
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          marginBottom: 4
        }}>
          <span style={{ fontSize: 20 }}>{isWin ? '🏆' : '💪'}</span>
          <span style={{ fontWeight: '700' }}>
            {isWin ? 'VICTOIRE' : 'DÉFAITE'}
          </span>
          {score && (
            <span style={{ opacity: 0.8, fontSize: 14 }}>({score})</span>
          )}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {partnerName && `Avec ${partnerName} · `}
          {location || 'Padel'}
        </div>
      </div>
      <div style={{ 
        fontSize: 12, 
        opacity: 0.7,
        textAlign: 'right'
      }}>
        {new Date(date).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        })}
      </div>
    </div>
  )
}