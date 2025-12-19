'use client'

import { useRef, useState } from 'react'

/**
 * ============================================
 * COMPOSANT MATCH CARD - Style FIFA/Hexagone
 * ============================================
 * 
 * Carte de match premium avec effet 3D
 * Inspirée de la PlayerCard v9
 * 
 * ============================================
 */

export default function MatchCard({ match, standalone = false, size = 'normal', onClick }) {
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

  // Couleurs selon l'ambiance
  const getAmbianceColor = (ambiance) => {
    if (ambiance === 'compet') return '#f59e0b'
    if (ambiance === 'loisir') return '#22c55e'
    return '#3b82f6'
  }

  const getAmbianceGradient = (ambiance) => {
    if (ambiance === 'compet') return ['#f59e0b', '#dc2626']
    if (ambiance === 'loisir') return ['#22c55e', '#10b981']
    return ['#3b82f6', '#06b6d4']
  }

  // Config labels
  const ambianceConfig = {
    loisir: { text: 'Détente', icon: '😎' },
    mix: { text: 'Équilibré', icon: '⚡' },
    compet: { text: 'Compétitif', icon: '🏆' }
  }

  const periodConfig = {
    matin: 'Matin',
    aprem: 'Après-midi',
    soir: 'Soir'
  }

  // Valeurs du match
  const ambianceColor = getAmbianceColor(match.ambiance)
  const [color1, color2] = getAmbianceGradient(match.ambiance)
  const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix
  
  const spotsLeft = match.spots_available ?? (match.spots_total - (match.match_participants?.length || 0) - 1)
  const isFull = spotsLeft <= 0

  // Formater la date
  const formatDate = () => {
    if (!match.match_date) {
      return match.flexible_day || 'Flexible'
    }
    const date = new Date(match.match_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return "Demain"
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = () => {
    if (match.match_time) return match.match_time.slice(0, 5)
    if (match.flexible_period) return periodConfig[match.flexible_period] || match.flexible_period
    return 'Flexible'
  }

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
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        position: 'relative',
        ...sizeStyle,
        cursor: onClick ? 'pointer' : (standalone ? 'default' : 'pointer'),
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
          : `linear-gradient(135deg, ${color1}40, ${color2}40)`,
        borderRadius: 12,
        padding: standalone ? 2 : 1
      }}>
        
        {/* Carte principale */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1.91 / 1',
          background: 'linear-gradient(135deg, #0c0c14 0%, #0a0a10 100%)',
          overflow: 'hidden',
          borderRadius: 10
        }}>
          
          {/* Pattern hexagonal */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23${ambianceColor.slice(1)}' stroke-width='1'/%3E%3C/svg%3E")`,
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
            background: `linear-gradient(90deg, ${ambianceColor}80, ${ambianceColor}20, transparent)`,
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
            
            {/* ZONE GAUCHE : Places restantes */}
            <div style={{
              width: '25%',
              background: `linear-gradient(180deg, ${ambianceColor}20 0%, ${ambianceColor}05 100%)`,
              borderRight: `3px solid ${ambianceColor}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: 'clamp(12px, 3vw, 20px) 0'
            }}>
              {/* Glow interne */}
              <div style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 80,
                height: 80,
                background: `radial-gradient(circle, ${ambianceColor} 0%, transparent 70%)`,
                opacity: 0.4,
                borderRadius: '50%'
              }} />
              
              {/* Places */}
              <div style={{ position: 'relative', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontSize: 'clamp(36px, 9vw, 56px)',
                  fontWeight: 900,
                  background: isFull 
                    ? 'linear-gradient(180deg, #fff 0%, #22c55e 100%)'
                    : `linear-gradient(180deg, #fff 0%, ${ambianceColor} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 20px ${ambianceColor}60)`
                }}>
                  {isFull ? '✓' : spotsLeft}
                </div>
                <div style={{
                  fontSize: 'clamp(7px, 1.4vw, 9px)',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  letterSpacing: 2,
                  marginTop: 6
                }}>
                  {isFull ? 'COMPLET' : (spotsLeft > 1 ? 'PLACES' : 'PLACE')}
                </div>
              </div>

              {/* Badge ambiance */}
              <div style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                paddingBottom: 8
              }}>
                <span style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{ambiance.icon}</span>
                <span style={{ 
                  fontSize: 'clamp(6px, 1.2vw, 8px)', 
                  color: ambianceColor, 
                  fontWeight: 700,
                  letterSpacing: 0.5
                }}>
                  {ambiance.text.toUpperCase()}
                </span>
              </div>
            </div>

            {/* ZONE DROITE : Infos match */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 'clamp(12px, 3vw, 20px)'
            }}>
              
              {/* Header : Date & Heure */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'clamp(8px, 2vw, 12px)'
              }}>
                <div>
                  <div style={{
                    fontSize: 'clamp(14px, 3.5vw, 22px)',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: -0.5,
                    marginBottom: 2
                  }}>
                    {formatDate()}
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 2.5vw, 14px)',
                    color: ambianceColor,
                    fontWeight: 600
                  }}>
                    {formatTime()}
                  </div>
                </div>
                
                {/* Badge niveau */}
                <div style={{
                  background: `linear-gradient(135deg, ${color1}30, ${color2}30)`,
                  border: `1px solid ${ambianceColor}50`,
                  borderRadius: 8,
                  padding: 'clamp(6px, 1.5vw, 10px)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: 'clamp(10px, 2vw, 12px)',
                    fontWeight: 800,
                    color: '#fff'
                  }}>
                    ⭐ {match.level_min || 1}-{match.level_max || 10}
                  </div>
                </div>
              </div>

              {/* Lieu */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(8px, 1.6vw, 10px)',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  letterSpacing: 2,
                  marginBottom: 4
                }}>
                  📍 LIEU
                </div>
                <div style={{
                  fontSize: 'clamp(16px, 4vw, 24px)',
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {match.clubs?.name || match.city || 'Lieu à définir'}
                </div>
                {match.clubs?.address && (
                  <div style={{
                    fontSize: 'clamp(9px, 2vw, 11px)',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {match.clubs.address}
                  </div>
                )}
              </div>

              {/* Footer : Organisateur & Prix */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 'auto',
                paddingTop: 8,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 'clamp(24px, 6vw, 32px)',
                    height: 'clamp(24px, 6vw, 32px)',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color1}, ${color2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(10px, 2.5vw, 14px)',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {match.profiles?.name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'clamp(9px, 2vw, 11px)',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      Organisé par
                    </div>
                    <div style={{
                      fontSize: 'clamp(11px, 2.5vw, 13px)',
                      color: '#fff',
                      fontWeight: 600
                    }}>
                      👑 {match.profiles?.name || 'Inconnu'}
                    </div>
                  </div>
                </div>
                
                {match.price_total && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 6,
                    padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)'
                  }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3vw, 16px)',
                      fontWeight: 800,
                      color: '#22c55e'
                    }}>
                      {Math.round(match.price_total / 100 / 4)}€
                    </div>
                    <div style={{
                      fontSize: 'clamp(7px, 1.4vw, 8px)',
                      color: 'rgba(34, 197, 94, 0.7)',
                      textAlign: 'center'
                    }}>
                      /pers
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status overlay si complet */}
          {isFull && (
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              padding: 'clamp(4px, 1vw, 6px) clamp(10px, 2.5vw, 14px)',
              borderRadius: 20,
              fontSize: 'clamp(9px, 2vw, 11px)',
              fontWeight: 700,
              letterSpacing: 0.5,
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
            }}>
              ✓ COMPLET
            </div>
          )}

          {/* Branding discret */}
          <div style={{
            position: 'absolute',
            bottom: 6,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: 0.3
          }}>
            <span style={{ fontSize: 10 }}>🎾</span>
            <span style={{ 
              fontSize: 8, 
              color: '#fff', 
              fontWeight: 600,
              letterSpacing: 0.5
            }}>
              PADELMATCH
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}