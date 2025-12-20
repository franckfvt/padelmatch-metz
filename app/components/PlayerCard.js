'use client'

import { useRef, useState } from 'react'

/**
 * ============================================
 * COMPOSANT PLAYER CARD - Style Match Card
 * ============================================
 * 
 * Ratio 1.91:1 - Tout visible, rien ne déborde
 * 
 * ============================================
 */

export default function PlayerCard({ player, standalone = false, size = 'normal' }) {
  const cardRef = useRef(null)
  const [hoverStyle, setHoverStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    isHovered: false
  })

  // Effet 3D au hover
  const handleMouseMove = (e) => {
    if (!cardRef.current || !standalone) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -6
    const rotateY = ((x - centerX) / centerX) * 6
    setHoverStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      isHovered: true
    })
  }

  const handleMouseLeave = () => {
    setHoverStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      isHovered: false
    })
  }

  // Couleur accent selon le niveau
  const getAccentColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  // Config labels
  const styleConfig = {
    loisir: { text: 'Détente', icon: '😎', color: '#22c55e' },
    mix: { text: 'Équilibré', icon: '⚡', color: '#3b82f6' },
    compet: { text: 'Compétitif', icon: '🏆', color: '#f59e0b' },
    progression: { text: 'Progresser', icon: '📈', color: '#3b82f6' }
  }

  const positionConfig = {
    right: 'Droite', left: 'Gauche', both: 'Polyvalent',
    droite: 'Droite', gauche: 'Gauche', les_deux: 'Polyvalent'
  }

  const frequencyConfig = {
    'occasional': '1-2x/mois', 'regular': '1x/sem', 'often': '2-3x/sem', 'intense': '4x+/sem',
    '1x/mois': '1-2x/mois', '1x/sem': '1x/sem', '2-3x': '2-3x/sem', '4x+': '4x+/sem'
  }

  const experienceConfig = {
    'less6months': '<6 mois', '6months2years': '6m-2ans', '2to5years': '2-5 ans', 'more5years': '+5 ans',
    '<6mois': '<6 mois', '6mois-2ans': '6m-2ans', '2-5ans': '2-5 ans', '5ans+': '+5 ans'
  }

  // Valeurs
  const accentColor = getAccentColor(player.level)
  const style = styleConfig[player.ambiance || player.style] || styleConfig.mix
  const position = positionConfig[player.position] || 'Polyvalent'
  const frequency = frequencyConfig[player.frequency] || '1x/sem'
  const experience = experienceConfig[player.experience] || '2-5 ans'
  const region = player.region || player.city || ''
  const regionShort = region.length > 12 ? region.substring(0, 11) + '.' : region

  // Tailles
  const sizeConfig = {
    small: { width: '100%', maxWidth: 300 },
    normal: { width: '100%', maxWidth: 420 },
    large: { width: '100%', maxWidth: 600 }
  }
  const sizeStyle = sizeConfig[size] || sizeConfig.normal

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        position: 'relative',
        ...sizeStyle,
        cursor: standalone ? 'pointer' : 'default',
        transform: standalone ? hoverStyle.transform : 'none',
        transition: hoverStyle.isHovered ? 'none' : 'transform 0.4s ease-out',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Glow externe */}
      {standalone && (
        <div style={{
          position: 'absolute',
          inset: -8,
          background: 'linear-gradient(135deg, #334155, #1e293b)',
          filter: 'blur(20px)',
          opacity: hoverStyle.isHovered ? 0.7 : 0.4,
          borderRadius: 20,
          transition: 'opacity 0.3s'
        }} />
      )}

      {/* Carte */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Déco */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 60, height: 60, background: 'rgba(255,255,255,0.02)', borderRadius: '50%' }} />

        {/* CONTENU */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1 }}>
          
          {/* GAUCHE : Niveau */}
          <div style={{
            width: '26%',
            background: `linear-gradient(180deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0'
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '13%',
              width: 60,
              height: 60,
              background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
              borderRadius: '50%'
            }} />
            
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{
                fontSize: 48,
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                textShadow: `0 0 30px ${accentColor}60`
              }}>
                {player.level || '5'}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, marginTop: 2 }}>
                NIVEAU
              </div>
            </div>

            {/* Position */}
            <div style={{
              marginTop: 10,
              background: 'rgba(255,255,255,0.1)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)'
            }}>
              {position}
            </div>
          </div>

          {/* DROITE */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {/* Photo */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: player.avatar_url 
                  ? `url(${player.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                border: '2px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
                overflow: 'hidden',
                color: '#fff',
                fontWeight: 700
              }}>
                {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
              </div>

              {/* Nom + Badges */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {player.name || 'Joueur'}
                </div>
                
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${style.color}20`,
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    color: style.color
                  }}>
                    {style.icon} {style.text}
                  </span>
                  {regionShort && (
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      📍 {regionShort}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats 2x2 */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { value: frequency, label: 'Fréquence', icon: '📅' },
                { value: experience, label: 'Expérience', icon: '⏱️' },
                { value: player.matches_played ?? '0', label: 'Parties', icon: '🎾' },
                { value: `${player.reliability_score ?? 100}%`, label: 'Fiabilité', icon: '✓' }
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 500 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
                <path d="M12 2C12 2 12 8 12 12C12 16 12 22 12 22" stroke="#fff" strokeWidth="1.5"/>
                <path d="M2 12C2 12 8 12 12 12C16 12 22 12 22 12" stroke="#fff" strokeWidth="1.5"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>PadelMatch</span>
          </div>
          
          {standalone && (
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              color: '#fff'
            }}>
              Voir profil →
            </div>
          )}
        </div>
      </div>
    </div>
  )
}