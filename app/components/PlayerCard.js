'use client'

import { useRef, useState } from 'react'

// ============================================
// COMPOSANT PLAYER CARD - Style FIFA/Hexagone
// ============================================

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

  // Couleurs selon le niveau
  const getLevelColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  const getLevelGradient = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return ['#f59e0b', '#dc2626']
    if (lvl >= 6) return ['#a855f7', '#6366f1']
    if (lvl >= 4) return ['#3b82f6', '#06b6d4']
    return ['#22c55e', '#10b981']
  }

  // Config labels
  const styleConfig = {
    loisir: { text: 'Détente', icon: '😎', color: '#22c55e' },
    mix: { text: 'Équilibré', icon: '⚡', color: '#3b82f6' },
    compet: { text: 'Compétitif', icon: '🏆', color: '#f59e0b' },
    progression: { text: 'Veut progresser', icon: '📈', color: '#3b82f6' }
  }

  const positionConfig = {
    right: { text: 'Droite' },
    left: { text: 'Gauche' },
    both: { text: 'Polyvalent' },
    droite: { text: 'Droite' },
    gauche: { text: 'Gauche' },
    les_deux: { text: 'Polyvalent' }
  }

  const frequencyConfig = {
    'occasional': '1-2x/mois',
    'regular': '1x/sem',
    'often': '2-3x/sem',
    'intense': '4x+/sem',
    '1x/mois': '1-2x/mois',
    '1x/sem': '1x/sem',
    '2-3x': '2-3x/sem',
    '4x+': '4x+/sem'
  }

  const experienceConfig = {
    'less6months': '< 6 mois',
    '6months2years': '6m - 2ans',
    '2to5years': '2 - 5 ans',
    'more5years': '+ 5 ans',
    '<6mois': '< 6 mois',
    '6mois-2ans': '6m - 2ans',
    '2-5ans': '2 - 5 ans',
    '5ans+': '+ 5 ans'
  }

  // Valeurs du joueur
  const levelColor = getLevelColor(player.level)
  const [color1, color2] = getLevelGradient(player.level)
  const style = styleConfig[player.ambiance || player.style] || styleConfig.mix
  const position = positionConfig[player.position] || { text: 'Polyvalent' }
  const frequency = frequencyConfig[player.frequency] || '1x/sem'
  const experience = experienceConfig[player.experience] || '2 - 5 ans'
  const region = player.region || player.city || 'France'
  const regionShort = region.length > 12 ? region.substring(0, 12) + '.' : region

  const isNew = !player.matches_played || player.matches_played === 0

  // Tailles selon le prop size
  const sizeConfig = {
    small: { width: '100%', maxWidth: 280 },
    normal: { width: '100%', maxWidth: 400 },
    large: { width: '100%', maxWidth: 540 }
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
      {/* Glow externe (standalone only) */}
      {standalone && (
        <div style={{
          position: 'absolute',
          inset: -8,
          background: `linear-gradient(135deg, ${color1}, ${color2})`,
          filter: 'blur(25px)',
          opacity: hoverStyle.isHovered ? 0.6 : 0.4,
          borderRadius: 16,
          transition: 'opacity 0.3s'
        }} />
      )}

      {/* Bordure gradient */}
      <div style={{
        position: 'relative',
        background: standalone 
          ? `linear-gradient(135deg, ${color1}, ${color2})` 
          : 'transparent',
        borderRadius: standalone ? 12 : 0,
        padding: standalone ? 2 : 0
      }}>
        
        {/* Carte principale */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1.91 / 1',
          background: 'linear-gradient(135deg, #0c0c14 0%, #0a0a10 100%)',
          overflow: 'hidden',
          borderRadius: standalone ? 10 : 0
        }}>
          
          {/* Pattern hexagonal */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23${levelColor.slice(1)}' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 26px'
          }} />

          {/* Gradient overlay du haut */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: `linear-gradient(180deg, ${color1}15 0%, transparent 100%)`,
            pointerEvents: 'none'
          }} />

          {/* Ligne brillante en haut */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '25%',
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, ${levelColor}80, ${levelColor}20, transparent)`,
            opacity: 0.6
          }} />

          {/* Contenu */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            zIndex: 1
          }}>
            
            {/* ZONE GAUCHE : Niveau + Branding */}
            <div style={{
              width: '25%',
              background: `linear-gradient(180deg, ${levelColor}20 0%, ${levelColor}05 100%)`,
              borderRight: `3px solid ${levelColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: 'clamp(16px, 4vw, 24px) 0'
            }}>
              {/* Glow interne */}
              <div style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${levelColor} 0%, transparent 70%)`,
                opacity: 0.4,
                borderRadius: '50%'
              }} />
              
              {/* Niveau */}
              <div style={{ position: 'relative', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: 'clamp(44px, 11vw, 72px)',
                  fontWeight: 900,
                  background: `linear-gradient(180deg, #fff 0%, ${levelColor} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 20px ${levelColor}60)`
                }}>
                  {player.level || '5'}
                </div>
                <div style={{
                  fontSize: 'clamp(8px, 1.6vw, 10px)',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  letterSpacing: 3,
                  marginTop: 6
                }}>
                  NIVEAU
                </div>
              </div>

              {/* Branding en bas */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'clamp(4px, 1vw, 6px)',
                marginTop: 'auto',
                background: 'rgba(255,255,255,0.08)',
                padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
                borderRadius: 20
              }}>
                <span style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>🎾</span>
                <span style={{ 
                  color: 'rgba(255,255,255,0.85)', 
                  fontSize: 'clamp(7px, 1.4vw, 9px)', 
                  fontWeight: 700,
                  letterSpacing: 1
                }}>
                  PADELMATCH
                </span>
              </div>
            </div>

            {/* ZONE DROITE */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 'clamp(14px, 3.5vw, 20px)',
              position: 'relative'
            }}>
              
              {/* TOP : Photo + Nom + Style */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 2.5vw, 14px)'
              }}>
                {/* Photo */}
                <div style={{
                  width: 'clamp(40px, 8vw, 52px)',
                  height: 'clamp(40px, 8vw, 52px)',
                  borderRadius: 12,
                  background: player.avatar_url 
                    ? `url(${player.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(20px, 4vw, 26px)',
                  border: `2px solid ${levelColor}40`,
                  boxShadow: `0 4px 20px ${levelColor}30`,
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {!player.avatar_url && '👤'}
                </div>

                {/* Nom + Style */}
                <div style={{ minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 'clamp(16px, 4vw, 22px)',
                    fontWeight: 800,
                    color: '#fff',
                    margin: 0,
                    lineHeight: 1.1
                  }}>
                    {player.name || 'Joueur'}
                  </h2>
                  
                  {/* Style badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 4,
                    background: `${style.color}20`,
                    border: `1px solid ${style.color}50`,
                    padding: 'clamp(3px, 0.7vw, 4px) clamp(6px, 1.5vw, 10px)',
                    borderRadius: 12,
                    fontSize: 'clamp(8px, 1.8vw, 10px)',
                    color: style.color,
                    fontWeight: 600
                  }}>
                    <span>{style.icon}</span>
                    <span>{style.text}</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM : Grille 2x2 */}
              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: 'clamp(6px, 1.5vw, 10px)',
                marginTop: 'clamp(10px, 2.5vw, 14px)'
              }}>
                {[
                  { value: position.text, label: 'POSTE' },
                  { value: frequency, label: 'FRÉQUENCE' },
                  { value: experience, label: 'EXPÉRIENCE' },
                  { value: regionShort, label: 'RÉGION' }
                ].map((item, i) => (
                  <div 
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 'clamp(8px, 2vw, 12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <span style={{ 
                      color: '#fff', 
                      fontSize: item.label === 'RÉGION' 
                        ? 'clamp(10px, 2.4vw, 14px)' 
                        : 'clamp(12px, 2.8vw, 16px)', 
                      fontWeight: 800,
                      textAlign: 'center'
                    }}>
                      {item.value}
                    </span>
                    <span style={{ 
                      color: 'rgba(255,255,255,0.35)', 
                      fontSize: 'clamp(7px, 1.5vw, 9px)',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      marginTop: 2
                    }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}