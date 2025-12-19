'use client'

import { useState } from 'react'

/**
 * ============================================
 * MODAL CARTE JOUEUR
 * ============================================
 */

export default function PlayerCardModal({ profile, onClose }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    const map = { compet: '🏆 Compétitif', loisir: '😎 Détente', mix: '⚡ Équilibré', progression: '📈 Progression' }
    return map[profile?.ambiance] || '⚡ Équilibré'
  }

  const getPositionLabel = () => {
    const map = { right: 'Droite', left: 'Gauche', both: 'Polyvalent' }
    return map[profile?.position] || 'Polyvalent'
  }

  const getFrequencyLabel = () => {
    const map = { intense: '4x+/sem', often: '2-3x/sem', regular: '1x/sem', occasional: '1-2x/mois' }
    return map[profile?.frequency] || '1x/sem'
  }

  const getExperienceLabel = () => {
    const map = { more5years: '+5 ans', '2to5years': '2-5 ans', '6months2years': '6m-2ans', less6months: '<6 mois' }
    return map[profile?.experience] || '2-5 ans'
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#0f0f0f',
          borderRadius: 20,
          padding: 20,
          width: '100%',
          maxWidth: 360
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: '700', margin: 0 }}>
            🎴 Ta carte joueur
          </h2>
        </div>

        {/* Carte */}
        <div style={{
          background: '#080810',
          borderRadius: 12,
          overflow: 'hidden',
          border: `2px solid ${levelColor}`,
          marginBottom: 16
        }}>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${levelColor}20, transparent)`,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Niveau */}
            <div style={{
              width: 54,
              height: 54,
              background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${levelColor}`,
              flexShrink: 0
            }}>
              <span style={{ fontSize: 24, fontWeight: '900', color: levelColor, lineHeight: 1 }}>
                {profile?.level || '?'}
              </span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginTop: 2 }}>
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {profile?.name || 'Joueur'}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 8px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)'
              }}>
                {getStyleLabel()}
              </div>
            </div>
          </div>

          {/* Infos 2x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'rgba(255,255,255,0.05)'
          }}>
            {[
              { label: 'Poste', value: getPositionLabel() },
              { label: 'Fréquence', value: getFrequencyLabel() },
              { label: 'Expérience', value: getExperienceLabel() },
              { label: 'Région', value: profile?.region || 'France' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: '10px 8px',
                background: '#080810',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: '700', 
                  color: '#fff', 
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Footer branding */}
          <div style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}>
            <span style={{ fontSize: 11 }}>🎾</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.5 }}>
              PADELMATCH
            </span>
          </div>
        </div>

        {/* Boutons */}
        <button
          onClick={copyLink}
          style={{
            width: '100%',
            padding: '14px',
            background: copied ? '#22c55e' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: 8
          }}
        >
          {copied ? '✓ Lien copié !' : '📋 Copier le lien pour partager'}
        </button>
        
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}