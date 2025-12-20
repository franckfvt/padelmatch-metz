'use client'

import { useRef, useState } from 'react'

/**
 * ============================================
 * PLAYER CARD - Deux variantes
 * ============================================
 * 
 * variant="share" : Horizontal 1.91:1, compact, pour réseaux sociaux
 * variant="profile" : Vertical, mobile-first, pour page QR code
 * 
 * ============================================
 */

export default function PlayerCard({ player, standalone = false, variant = 'share' }) {
  const cardRef = useRef(null)
  const [hoverStyle, setHoverStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    isHovered: false
  })

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

  // Couleur selon niveau
  const getAccentColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  // Configs
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

  const accentColor = getAccentColor(player.level)
  const style = styleConfig[player.ambiance || player.style] || styleConfig.mix
  const position = positionConfig[player.position] || 'Polyvalent'
  const frequency = frequencyConfig[player.frequency] || '1x/sem'
  const experience = experienceConfig[player.experience] || '2-5 ans'
  const region = player.region || player.city || ''

  // ============================================
  // VARIANT: PROFILE (Vertical, Mobile-first)
  // ============================================
  if (variant === 'profile') {
    return (
      <div style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        borderRadius: 24,
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header avec photo et niveau */}
        <div style={{
          padding: '32px 24px 24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Cercle décoratif */}
          <div style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
            borderRadius: '50%'
          }} />

          {/* Photo */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: player.avatar_url 
              ? `url(${player.avatar_url}) center/cover`
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            border: '4px solid rgba(255,255,255,0.2)',
            boxShadow: `0 8px 24px ${accentColor}40`,
            margin: '0 auto 16px',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            fontWeight: 700
          }}>
            {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
          </div>

          {/* Nom */}
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 8px',
            lineHeight: 1.1
          }}>
            {player.name || 'Joueur'}
          </h1>

          {/* Badge style */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: `${style.color}25`,
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            color: style.color
          }}>
            {style.icon} {style.text}
          </div>
        </div>

        {/* Niveau - Grand */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          padding: '20px 24px',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              textShadow: `0 0 40px ${accentColor}60`
            }}>
              {player.level || '5'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1 }}>
              NIVEAU
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>
              {position === 'Droite' ? '👉' : position === 'Gauche' ? '👈' : '↔️'}
            </div>
            <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{position}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Position</div>
          </div>
        </div>

        {/* Infos */}
        <div style={{ padding: 24 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
          }}>
            {[
              { icon: '📍', label: 'Région', value: region || 'Non renseigné' },
              { icon: '📅', label: 'Fréquence', value: frequency },
              { icon: '⏱️', label: 'Expérience', value: experience },
              { icon: '🎾', label: 'Parties jouées', value: player.matches_played ?? '0' }
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 14,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Fiabilité */}
          <div style={{
            marginTop: 16,
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>
                {player.reliability_score ?? 100}%
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>
                de fiabilité
              </span>
            </div>
          </div>
        </div>

        {/* Footer minimaliste */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
              <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>PadelMatch</span>
        </div>
      </div>
    )
  }

  // ============================================
  // VARIANT: SHARE (Horizontal 1.91:1, compact)
  // ============================================
  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: 500,
        cursor: standalone ? 'pointer' : 'default',
        transform: standalone ? hoverStyle.transform : 'none',
        transition: hoverStyle.isHovered ? 'none' : 'transform 0.4s ease-out',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Glow */}
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
        border: '1px solid rgba(255,255,255,0.12)'
      }}>
        
        {/* Déco */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

        {/* Contenu */}
        <div style={{ height: '100%', display: 'flex', position: 'relative', zIndex: 1 }}>
          
          {/* Gauche : Niveau */}
          <div style={{
            width: '26%',
            background: `linear-gradient(180deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
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

            <div style={{
              marginTop: 8,
              background: 'rgba(255,255,255,0.1)',
              padding: '3px 8px',
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)'
            }}>
              {position}
            </div>
          </div>

          {/* Droite */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: player.avatar_url 
                  ? `url(${player.avatar_url}) center/cover`
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                border: '2px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
                overflow: 'hidden',
                color: '#fff',
                fontWeight: 700
              }}>
                {!player.avatar_url && (player.name?.[0]?.toUpperCase() || '?')}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 17,
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
                    padding: '2px 7px',
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 600,
                    color: style.color
                  }}>
                    {style.icon} {style.text}
                  </span>
                  {region && (
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '2px 7px',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      📍 {region.length > 10 ? region.substring(0, 9) + '.' : region}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats 2x2 */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {[
                { value: frequency, label: 'Fréquence', icon: '📅' },
                { value: experience, label: 'Expérience', icon: '⏱️' },
                { value: player.matches_played ?? '0', label: 'Parties', icon: '🎾' },
                { value: `${player.reliability_score ?? 100}%`, label: 'Fiabilité', icon: '✓' }
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  padding: '5px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ fontSize: 10 }}>{item.icon}</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, fontWeight: 500 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Logo en bas à droite */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              gap: 5,
              marginTop: 6
            }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
                  <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" strokeWidth="1.5"/>
                </svg>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>PadelMatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}