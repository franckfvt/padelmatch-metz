'use client'

import { useState } from 'react'

/**
 * ============================================
 * MODAL CARTE JOUEUR - AVEC AVATAR
 * ============================================
 * 
 * - Avatar (photo ou lettre colorée)
 * - Niveau en badge
 * - 4 carrés d'infos
 * - Logo PadelMatch
 * - Branding sobre #1a1a2e
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

export default function PlayerCardModal({ profile, onClose }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `🎾 Découvre mon profil PadelMatch !\n\nJe suis niveau ${profile?.level || '?'} et je recherche des partenaires.\n\n👉 ${window.location.origin}/player/${profile?.id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Couleur basée sur le nom
  const avatarColor = getColorForName(profile?.name)

  // Couleur selon niveau
  const getLevelColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }
  const levelColor = getLevelColor(profile?.level)

  // Labels
  const getStyleLabel = () => {
    const map = { compet: 'Compétitif', loisir: 'Détente', mix: 'Équilibré' }
    return map[profile?.ambiance] || 'Équilibré'
  }
  const getStyleEmoji = () => {
    const map = { compet: '🏆', loisir: '😎', mix: '⚡' }
    return map[profile?.ambiance] || '⚡'
  }
  const getPositionLabel = () => {
    const map = { right: 'Droite', left: 'Gauche', both: 'Polyvalent' }
    return map[profile?.position] || 'Polyvalent'
  }
  const getFrequencyLabel = () => {
    const map = { intense: '4+/sem', often: '2-3/sem', regular: '1/sem', occasional: '1-2/mois' }
    return map[profile?.frequency] || '1/sem'
  }
  const getExperienceLabel = () => {
    const map = { more5years: '+5 ans', '2to5years': '2-5 ans', '6months2years': '6m-2a', less6months: '<6 mois' }
    return map[profile?.experience] || '2-5 ans'
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 20,
          width: '100%',
          maxWidth: 360
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <h2 style={{ color: '#1a1a2e', fontSize: 18, fontWeight: 700, margin: 0 }}>
            🎴 Ma carte joueur
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* === LA CARTE === */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #2d3748)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 16,
          boxShadow: '0 8px 32px rgba(26, 26, 46, 0.3)'
        }}>
          
          {/* Section haute: Avatar + Nom + Niveau */}
          <div style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Avatar */}
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 14,
              overflow: 'hidden',
              border: `3px solid ${levelColor}`,
              background: profile?.avatar_url ? '#000' : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0
            }}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Nom et badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#fff', 
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {profile?.name || 'Joueur'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px',
                  background: levelColor,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff'
                }}>
                  ⭐ Niveau {profile?.level || '?'}
                </span>
                <span style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  {getStyleEmoji()} {getStyleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Grille 2x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'rgba(255,255,255,0.1)'
          }}>
            {[
              { label: 'Poste', value: getPositionLabel(), icon: '🎯' },
              { label: 'Fréquence', value: getFrequencyLabel(), icon: '📅' },
              { label: 'Expérience', value: getExperienceLabel(), icon: '⏱️' },
              { label: 'Ville', value: profile?.city || 'France', icon: '📍' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '14px 12px',
                background: '#1a1a2e',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 700, 
                  color: '#fff', 
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.value}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'uppercase', 
                  letterSpacing: 0.5 
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Footer branding */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 14 }}>🎾</span>
            <span style={{ 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.7)', 
              fontWeight: 600, 
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}>
              PadelMatch
            </span>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={copyLink}
            style={{
              flex: 1,
              padding: 14,
              background: copied ? '#dcfce7' : '#f1f5f9',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: copied ? '#16a34a' : '#1a1a2e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier le lien'}
          </button>
          <button
            onClick={shareWhatsApp}
            style={{
              flex: 1,
              padding: 14,
              background: '#22c55e',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            📲 WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}