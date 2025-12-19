'use client'

import { useState } from 'react'

/**
 * Modal pour afficher sa carte de joueur et la partager
 */
export default function PlayerCardModal({
  isOpen,
  onClose,
  profile,
  userId
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !profile) return null

  const ambianceLabels = {
    'loisir': { label: 'Détente', emoji: '😎' },
    'mix': { label: 'Équilibré', emoji: '⚡' },
    'compet': { label: 'Compétitif', emoji: '🏆' }
  }

  const positionLabels = {
    'left': 'Gauche',
    'right': 'Droite',
    'both': 'Les deux'
  }

  const amb = ambianceLabels[profile.ambiance] || ambianceLabels.mix
  const reliability = profile.reliability_score || 100

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/player/${userId}`
  const ogImageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/og/player/${userId}`

  function copyLink() {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareOnWhatsApp() {
    const text = `🎾 Mon profil PadelMatch\n\n` +
      `⭐ Niveau ${profile.level}/10\n` +
      `${amb.emoji} ${amb.label}\n` +
      `✅ ${reliability}% fiable\n\n` +
      `👉 ${profileUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareOnFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank')
  }

  async function downloadCard() {
    // Ouvrir l'image OG dans un nouvel onglet (le user pourra faire clic droit > enregistrer)
    window.open(ogImageUrl, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: '600', margin: 0 }}>
            🎴 Ma carte PadelMatch
          </h2>
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
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #333 100%)',
            borderRadius: 16,
            padding: 24,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Cercle décoratif */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(46,125,50,0.3) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />

            {/* Header carte */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎾</span>
                <span style={{ fontSize: 12, fontWeight: '600', opacity: 0.7, letterSpacing: 1 }}>
                  PADELMATCH
                </span>
              </div>
              <div style={{
                background: reliability >= 90 ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                color: reliability >= 90 ? '#4ade80' : '#fbbf24',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: '600'
              }}>
                ✓ {reliability}% fiable
              </div>
            </div>

            {/* Avatar + Nom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid rgba(255,255,255,0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: '700',
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  {profile.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h3 style={{
                  fontSize: 26,
                  fontWeight: '700',
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>
                  {profile.name}
                </h3>
                {profile.position && positionLabels[profile.position] && (
                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    📍 Côté {positionLabels[profile.position].toLowerCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                background: '#fbbf24',
                color: '#1a1a1a',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '700'
              }}>
                ⭐ {profile.level}/10
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '500'
              }}>
                {amb.emoji} {amb.label}
              </span>
              {profile.matches_played > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  🎾 {profile.matches_played} parties
                </span>
              )}
            </div>
          </div>

          {/* Astuce */}
          <div style={{
            background: '#dbeafe',
            borderRadius: 12,
            padding: 14,
            marginTop: 16
          }}>
            <div style={{ fontSize: 13, color: '#1e40af' }}>
              💡 <strong>Astuce :</strong> Partage ta carte quand tu réponds sur les groupes Facebook. L'orga verra ton niveau direct !
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 20px 20px' }}>
          {/* Bouton copier */}
          <button
            onClick={copyLink}
            style={{
              width: '100%',
              padding: 14,
              background: copied ? '#dcfce7' : '#f5f5f5',
              color: copied ? '#166534' : '#1a1a1a',
              border: copied ? '2px solid #22c55e' : '2px solid #e5e5e5',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 12,
              transition: 'all 0.2s'
            }}
          >
            {copied ? '✓ Lien copié !' : '📋 Copier le lien de ma carte'}
          </button>

          {/* Partage */}
          <div style={{ display: 'flex', gap: 10 }}>
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
            >
              📘 Facebook
            </button>
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
              🖼️ Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}