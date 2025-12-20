'use client'

import { useRef, useState } from 'react'

/**
 * ============================================
 * COMPOSANT PLAYER CARD - Style Match Card
 * ============================================
 * 
 * Même branding que la carte match
 * Structure: niveau à gauche, infos à droite
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
    if (lvl >= 8) return '#f59e0b' // Or
    if (lvl >= 6) return '#a855f7' // Violet
    if (lvl >= 4) return '#3b82f6' // Bleu
    return '#22c55e' // Vert
  }

  // Config labels
  const styleConfig = {
    loisir: { text: 'Détente', icon: '😎', color: '#22c55e' },
    mix: { text: 'Équilibré', icon: '⚡', color: '#3b82f6' },
    compet: { text: 'Compétitif', icon: '🏆', color: '#f59e0b' },
    progression: { text: 'Veut progresser', icon: '📈', color: '#3b82f6' }
  }

  const positionConfig = {
    right: { text: 'Droite', short: 'D' },
    left: { text: 'Gauche', short: 'G' },
    both: { text: 'Polyvalent', short: '↔' },
    droite: { text: 'Droite', short: 'D' },
    gauche: { text: 'Gauche', short: 'G' },
    les_deux: { text: 'Polyvalent', short: '↔' }
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
  const accentColor = getAccentColor(player.level)
  const style = styleConfig[player.ambiance || player.style] || styleConfig.mix
  const position = positionConfig[player.position] || { text: 'Polyvalent', short: '↔' }
  const frequency = frequencyConfig[player.frequency] || '1x/sem'
  const experience = experienceConfig[player.experience] || '2 - 5 ans'
  const region = player.region || player.city || 'France'

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
          background: `linear-gradient(135deg, #334155, #1e293b)`,
          filter: 'blur(25px)',
          opacity: hoverStyle.isHovered ? 0.8 : 0.5,
          borderRadius: 20,
          transition: 'opacity 0.3s'
        }} />
      )}

      {/* Carte principale */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Motifs décoratifs */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 100,
          height: 100,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '50%'
        }} />

        {/* === CONTENU PRINCIPAL === */}
        <div style={{ 
          flex: 1, 
          display: 'flex',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* ZONE GAUCHE : Niveau */}
          <div style={{
            width: '28%',
            background: `linear-gradient(180deg, ${accentColor}25 0%, ${accentColor}08 100%)`,
            borderRight: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '16px 0'
          }}>
            {/* Glow du niveau */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              background: `radial-gradient(circle, ${accentColor}50 0%, transparent 70%)`,
              borderRadius: '50%'
            }} />
            
            {/* Niveau */}
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(48px, 12vw, 64px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                textShadow: `0 0 40px ${accentColor}80`
              }}>
                {player.level || '5'}
              </div>
              <div style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                letterSpacing: 2,
                marginTop: 4
              }}>
                NIVEAU
              </div>
            </div>

            {/* Badge position */}
            <div style={{
              marginTop: 12,
              background: 'rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)'
            }}>
              📍 {position.text}
            </div>
          </div>

          {/* ZONE DROITE */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(12px, 3vw, 18px)'
          }}>
            
            {/* Header : Photo + Nom + Style */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12
            }}>
              {/* Photo */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: player.avatar_url 
                  ? `url(${player.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                flexShrink: 0,
                overflow: 'hidden',
                color: '#fff',
                fontWeight: 700
              }}>
                {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
              </div>

              {/* Nom + Style */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  fontSize: 'clamp(18px, 4.5vw, 24px)',
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {player.name || 'Joueur'}
                </h2>
                
                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${style.color}25`,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    color: style.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {style.icon} {style.text}
                  </span>
                  {region && (
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      📍 {region.length > 10 ? region.substring(0, 10) + '.' : region}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Grille stats */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8
            }}>
              {[
                { value: frequency, label: 'Fréquence', icon: '📅' },
                { value: experience, label: 'Expérience', icon: '⏱️' },
                { value: player.matches_played || '0', label: 'Parties', icon: '🎾' },
                { value: player.reliability_score ? `${player.reliability_score}%` : '100%', label: 'Fiabilité', icon: '✓' }
              ].map((item, i) => (
                <div 
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
                  <div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: 13, 
                      fontWeight: 700
                    }}>
                      {item.value}
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.5)', 
                      fontSize: 10,
                      fontWeight: 500
                    }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === FOOTER === */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
                <path d="M12 2C12 2 12 8 12 12C12 16 12 22 12 22" stroke="#fff" strokeWidth="1.5"/>
                <path d="M2 12C2 12 8 12 12 12C16 12 22 12 22 12" stroke="#fff" strokeWidth="1.5"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>PadelMatch</span>
          </div>
          
          {standalone && (
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12,
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