/**
 * ============================================
 * 2×2 SHARE CARDS SYSTEM
 * ============================================
 * 
 * Composants de partage pour les réseaux sociaux :
 * - VictoryCard : Carte après une victoire
 * - ProfileCard : Ma carte 2×2 (2 formats)
 * - MonthlyRecapCard : Récap du mois
 * - Confetti : Animation de célébration
 * 
 * ============================================
 */

'use client'

import { useState, useRef, useEffect } from 'react'

// === DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  white: '#ffffff',
  green: '#22c55e',
  border: '#eae8e4',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// === CONFETTI ANIMATION ===
export function Confetti({ active, duration = 3000 }) {
  const [particles, setParticles] = useState([])
  
  useEffect(() => {
    if (!active) return
    
    const colors = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4, COLORS.green]
    const newParticles = []
    
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360
      })
    }
    
    setParticles(newParticles)
    
    const timer = setTimeout(() => setParticles([]), duration)
    return () => clearTimeout(timer)
  }, [active, duration])
  
  if (particles.length === 0) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${2 + Math.random()}s ease-out ${p.delay}s forwards`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}


// === VICTORY CARD ===
// Carte partageable après une victoire

export function VictoryCard({ 
  score,
  player1,
  player2,
  opponent1,
  opponent2,
  location,
  date,
  format = 'story' // 'story' (9:16) ou 'feed' (1:1)
}) {
  const isStory = format === 'story'
  const width = isStory ? 360 : 400
  const height = isStory ? 640 : 400
  
  return (
    <div 
      className="victory-card"
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${COLORS.ink} 0%, #2d2d2d 100%)`,
        borderRadius: 24,
        padding: isStory ? 32 : 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        background: `radial-gradient(circle, ${COLORS.p2}30 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 200,
        height: 200,
        background: `radial-gradient(circle, ${COLORS.p1}20 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Victory text */}
      <div style={{
        fontSize: isStory ? 18 : 14,
        fontWeight: 700,
        color: COLORS.p2,
        letterSpacing: 3,
        marginBottom: isStory ? 24 : 16,
        textTransform: 'uppercase'
      }}>
        Victoire 🏆
      </div>
      
      {/* Score */}
      <div style={{
        fontSize: isStory ? 72 : 56,
        fontWeight: 900,
        color: COLORS.white,
        letterSpacing: -2,
        marginBottom: isStory ? 32 : 24,
        textShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {score}
      </div>
      
      {/* Teams */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isStory ? 24 : 16,
        marginBottom: isStory ? 32 : 24
      }}>
        {/* Winners */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <PlayerAvatar name={player1} index={0} size={isStory ? 56 : 44} />
            <PlayerAvatar name={player2} index={1} size={isStory ? 56 : 44} />
          </div>
          <div style={{ 
            fontSize: isStory ? 14 : 12, 
            color: COLORS.white,
            fontWeight: 600
          }}>
            {getFirstName(player1)} & {getFirstName(player2)}
          </div>
        </div>
        
        {/* VS */}
        <div style={{
          fontSize: isStory ? 16 : 14,
          fontWeight: 700,
          color: COLORS.muted
        }}>
          vs
        </div>
        
        {/* Losers */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, opacity: 0.6 }}>
            <PlayerAvatar name={opponent1} index={2} size={isStory ? 56 : 44} />
            <PlayerAvatar name={opponent2} index={3} size={isStory ? 56 : 44} />
          </div>
          <div style={{ 
            fontSize: isStory ? 14 : 12, 
            color: COLORS.muted,
            fontWeight: 600
          }}>
            {getFirstName(opponent1)} & {getFirstName(opponent2)}
          </div>
        </div>
      </div>
      
      {/* Location & Date */}
      <div style={{
        fontSize: isStory ? 14 : 12,
        color: COLORS.muted,
        textAlign: 'center',
        marginBottom: isStory ? 40 : 24
      }}>
        <div>{location}</div>
        <div style={{ marginTop: 4 }}>{date}</div>
      </div>
      
      {/* Logo */}
      <div style={{
        fontSize: isStory ? 28 : 24,
        fontWeight: 900,
        color: COLORS.white,
        letterSpacing: -2,
        opacity: 0.8
      }}>
        2×2
      </div>
    </div>
  )
}


// === PROFILE CARD ===
// Ma carte 2×2 en 2 formats

export function ProfileCard({
  name,
  level,
  city,
  totalGames,
  wins,
  winRate,
  currentStreak,
  playerLevel, // { emoji, name, color }
  format = 'story'
}) {
  const isStory = format === 'story'
  const width = isStory ? 360 : 400
  const height = isStory ? 640 : 400
  
  return (
    <div
      className="profile-card"
      style={{
        width,
        height,
        background: COLORS.white,
        borderRadius: 24,
        padding: isStory ? 32 : 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}
    >
      {/* Gradient border effect */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 6,
        background: `linear-gradient(90deg, ${COLORS.p1}, ${COLORS.p2}, ${COLORS.p3}, ${COLORS.p4})`
      }} />
      
      {/* Avatar */}
      <div style={{
        width: isStory ? 100 : 80,
        height: isStory ? 100 : 80,
        borderRadius: isStory ? 28 : 22,
        background: COLORS.p1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontSize: isStory ? 44 : 36,
        fontWeight: 800,
        marginBottom: isStory ? 20 : 16,
        boxShadow: '0 8px 24px rgba(255, 90, 95, 0.3)'
      }}>
        {name?.[0]?.toUpperCase()}
      </div>
      
      {/* Name */}
      <div style={{
        fontSize: isStory ? 28 : 24,
        fontWeight: 800,
        color: COLORS.ink,
        marginBottom: 4
      }}>
        {name}
      </div>
      
      {/* Level badge */}
      {playerLevel && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: `${playerLevel.color}20`,
          color: playerLevel.color,
          padding: '6px 14px',
          borderRadius: 100,
          fontSize: isStory ? 14 : 12,
          fontWeight: 700,
          marginBottom: isStory ? 8 : 6
        }}>
          {playerLevel.emoji} {playerLevel.name}
        </div>
      )}
      
      {/* Info */}
      <div style={{
        fontSize: isStory ? 15 : 13,
        color: COLORS.gray,
        marginBottom: isStory ? 32 : 24
      }}>
        {level} · {city}
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: isStory ? 24 : 16,
        marginBottom: isStory ? 32 : 24
      }}>
        <StatItem value={totalGames} label="Parties" isStory={isStory} />
        <div style={{ width: 1, background: COLORS.bgSoft }} />
        <StatItem value={`${winRate}%`} label="Victoires" isStory={isStory} color={COLORS.green} />
        <div style={{ width: 1, background: COLORS.bgSoft }} />
        <StatItem 
          value={currentStreak > 0 ? `${currentStreak}🔥` : '0'} 
          label="Série" 
          isStory={isStory}
          color={currentStreak > 0 ? COLORS.p2 : COLORS.gray}
        />
      </div>
      
      {/* Divider */}
      <div style={{
        width: '60%',
        height: 1,
        background: COLORS.bgSoft,
        marginBottom: isStory ? 24 : 16
      }} />
      
      {/* Logo */}
      <div style={{
        fontSize: isStory ? 32 : 28,
        fontWeight: 900,
        color: COLORS.ink,
        letterSpacing: -2
      }}>
        2×2
      </div>
    </div>
  )
}


// === MONTHLY RECAP CARD ===
// Récap du mois partageable

export function MonthlyRecapCard({
  month, // "Janvier 2025"
  totalGames,
  wins,
  losses,
  winRate,
  bestStreak,
  topPartner,
  playerName,
  playerLevel,
  format = 'story'
}) {
  const isStory = format === 'story'
  const width = isStory ? 360 : 400
  const height = isStory ? 640 : 400
  
  return (
    <div
      className="recap-card"
      style={{
        width,
        height,
        background: `linear-gradient(135deg, ${COLORS.p4} 0%, ${COLORS.p3} 100%)`,
        borderRadius: 24,
        padding: isStory ? 32 : 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isStory ? 'space-between' : 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{
          fontSize: isStory ? 14 : 12,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8
        }}>
          Récap
        </div>
        <div style={{
          fontSize: isStory ? 32 : 26,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: isStory ? 0 : 24
        }}>
          {month}
        </div>
      </div>
      
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: isStory ? 16 : 12,
        width: '100%',
        position: 'relative'
      }}>
        <RecapStatBox 
          value={totalGames} 
          label="Parties" 
          emoji="🎾" 
          isStory={isStory}
        />
        <RecapStatBox 
          value={wins} 
          label="Victoires" 
          emoji="🏆" 
          isStory={isStory}
        />
        <RecapStatBox 
          value={`${winRate}%`} 
          label="Win rate" 
          emoji="📊" 
          isStory={isStory}
        />
        <RecapStatBox 
          value={bestStreak || 0} 
          label="Meilleure série" 
          emoji="🔥" 
          isStory={isStory}
        />
      </div>
      
      {/* Top partner */}
      {topPartner && (
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 16,
          padding: isStory ? '16px 24px' : '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          marginTop: isStory ? 0 : 16
        }}>
          <div style={{
            width: isStory ? 44 : 36,
            height: isStory ? 44 : 36,
            borderRadius: 12,
            background: COLORS.p2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.white,
            fontSize: isStory ? 18 : 14,
            fontWeight: 700
          }}>
            {topPartner[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ 
              fontSize: isStory ? 11 : 10, 
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 2
            }}>
              Partenaire préféré
            </div>
            <div style={{ 
              fontSize: isStory ? 16 : 14, 
              fontWeight: 700, 
              color: COLORS.white 
            }}>
              {topPartner}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        position: 'relative',
        marginTop: isStory ? 0 : 16
      }}>
        <div style={{
          fontSize: isStory ? 15 : 13,
          color: 'rgba(255,255,255,0.8)',
          marginBottom: 8
        }}>
          {playerName} {playerLevel?.emoji}
        </div>
        <div style={{
          fontSize: isStory ? 28 : 24,
          fontWeight: 900,
          color: COLORS.white,
          letterSpacing: -2
        }}>
          2×2
        </div>
      </div>
    </div>
  )
}


// === HELPER COMPONENTS ===

function PlayerAvatar({ name, index, size = 48 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: PLAYER_COLORS[index % 4],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.white,
      fontSize: size * 0.4,
      fontWeight: 700
    }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function StatItem({ value, label, isStory, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: isStory ? 28 : 22,
        fontWeight: 900,
        color: color || COLORS.ink
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isStory ? 12 : 10,
        color: COLORS.muted,
        marginTop: 2
      }}>
        {label}
      </div>
    </div>
  )
}

function RecapStatBox({ value, label, emoji, isStory }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.15)',
      borderRadius: 16,
      padding: isStory ? 20 : 16,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: isStory ? 20 : 16, marginBottom: 4 }}>
        {emoji}
      </div>
      <div style={{
        fontSize: isStory ? 28 : 22,
        fontWeight: 900,
        color: COLORS.white
      }}>
        {value}
      </div>
      <div style={{
        fontSize: isStory ? 12 : 10,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2
      }}>
        {label}
      </div>
    </div>
  )
}

function getFirstName(name) {
  return name?.split(' ')[0] || name || '?'
}


// === SHARE MODAL ===
// Modal de partage avec choix du format

export function ShareModal({ 
  isOpen, 
  onClose, 
  type = 'victory', // 'victory' | 'profile' | 'recap'
  data = {}
}) {
  const [format, setFormat] = useState('story')
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)
  
  if (!isOpen) return null
  
  const handleShare = async () => {
    // Utiliser l'API native de partage si disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: '2×2 Padel',
          text: type === 'victory' 
            ? `J'ai gagné ${data.score} ! 🏆` 
            : type === 'recap'
            ? `Mon mois sur 2×2 : ${data.totalGames} parties, ${data.wins} victoires !`
            : `Retrouve-moi sur 2×2 !`,
          url: window.location.origin
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    }
  }
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const renderCard = () => {
    switch (type) {
      case 'victory':
        return <VictoryCard {...data} format={format} />
      case 'profile':
        return <ProfileCard {...data} format={format} />
      case 'recap':
        return <MonthlyRecapCard {...data} format={format} />
      default:
        return null
    }
  }
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: COLORS.card,
          borderRadius: 28,
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: COLORS.ink }}>
            Partager
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              border: 'none',
              background: COLORS.bgSoft,
              fontSize: 20,
              cursor: 'pointer',
              color: COLORS.gray
            }}
          >
            ×
          </button>
        </div>
        
        {/* Format selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          background: COLORS.bgSoft,
          padding: 6,
          borderRadius: 14
        }}>
          <button
            onClick={() => setFormat('story')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: format === 'story' ? COLORS.card : 'transparent',
              color: format === 'story' ? COLORS.ink : COLORS.gray,
              boxShadow: format === 'story' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            📱 Story (9:16)
          </button>
          <button
            onClick={() => setFormat('feed')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: format === 'feed' ? COLORS.card : 'transparent',
              color: format === 'feed' ? COLORS.ink : COLORS.gray,
              boxShadow: format === 'feed' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            🖼️ Feed (1:1)
          </button>
        </div>
        
        {/* Card preview */}
        <div 
          ref={cardRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
            transform: format === 'story' ? 'scale(0.85)' : 'scale(0.9)',
            transformOrigin: 'top center'
          }}
        >
          {renderCard()}
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleCopyLink}
            style={{
              flex: 1,
              padding: 16,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              background: COLORS.white,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.ink,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier le lien'}
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: 16,
              border: 'none',
              borderRadius: 14,
              background: COLORS.ink,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.white,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            📤 Partager
          </button>
        </div>
        
        {/* Download hint */}
        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: COLORS.muted,
          marginTop: 16,
          marginBottom: 0
        }}>
          💡 Fais une capture d'écran pour sauvegarder l'image
        </p>
      </div>
    </div>
  )
}


// === EXPORT ===
export default {
  VictoryCard,
  ProfileCard,
  MonthlyRecapCard,
  ShareModal,
  Confetti
}