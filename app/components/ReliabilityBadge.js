'use client'

/**
 * Badge de fiabilité avec couleurs selon le score
 * 
 * Usage:
 * <ReliabilityBadge score={95} />
 * <ReliabilityBadge score={75} size="small" />
 * <ReliabilityBadge score={60} showLabel />
 */
export default function ReliabilityBadge({ 
  score = 100, 
  size = 'medium', // 'small', 'medium', 'large'
  showLabel = false,
  showIcon = true,
  style = {}
}) {
  // Déterminer le niveau de fiabilité
  const getReliabilityLevel = (score) => {
    if (score >= 90) return {
      level: 'excellent',
      label: 'Très fiable',
      color: '#166534', // vert foncé
      bgColor: '#dcfce7',
      borderColor: '#22c55e',
      icon: '✓'
    }
    if (score >= 75) return {
      level: 'good',
      label: 'Fiable',
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      borderColor: '#4ade80',
      icon: '✓'
    }
    if (score >= 50) return {
      level: 'variable',
      label: 'Variable',
      color: '#92400e',
      bgColor: '#fef3c7',
      borderColor: '#f59e0b',
      icon: '⚠'
    }
    return {
      level: 'low',
      label: 'Peu fiable',
      color: '#991b1b',
      bgColor: '#fef2f2',
      borderColor: '#ef4444',
      icon: '⚠'
    }
  }

  const reliability = getReliabilityLevel(score)

  // Styles selon la taille
  const sizes = {
    small: {
      padding: '3px 6px',
      fontSize: 11,
      borderRadius: 6,
      gap: 3
    },
    medium: {
      padding: '5px 10px',
      fontSize: 13,
      borderRadius: 8,
      gap: 4
    },
    large: {
      padding: '8px 14px',
      fontSize: 15,
      borderRadius: 10,
      gap: 6
    }
  }

  const sizeStyle = sizes[size] || sizes.medium

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeStyle.gap,
      padding: sizeStyle.padding,
      background: reliability.bgColor,
      color: reliability.color,
      fontSize: sizeStyle.fontSize,
      fontWeight: '600',
      borderRadius: sizeStyle.borderRadius,
      border: `1px solid ${reliability.borderColor}`,
      whiteSpace: 'nowrap',
      ...style
    }}>
      {showIcon && <span>{reliability.icon}</span>}
      <span>{score}%</span>
      {showLabel && <span style={{ fontWeight: '400', opacity: 0.9 }}>· {reliability.label}</span>}
    </span>
  )
}

/**
 * Version compacte pour les listes
 */
export function ReliabilityDot({ score = 100, size = 8 }) {
  const getColor = (score) => {
    if (score >= 90) return '#22c55e'
    if (score >= 75) return '#4ade80'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <span
      title={`Fiabilité: ${score}%`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: getColor(score)
      }}
    />
  )
}

/**
 * Version détaillée avec barre de progression
 */
export function ReliabilityMeter({ score = 100, showDetails = false }) {
  const getReliabilityLevel = (score) => {
    if (score >= 90) return { label: 'Très fiable', color: '#22c55e' }
    if (score >= 75) return { label: 'Fiable', color: '#4ade80' }
    if (score >= 50) return { label: 'Variable', color: '#f59e0b' }
    return { label: 'Peu fiable', color: '#ef4444' }
  }

  const reliability = getReliabilityLevel(score)

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 6 
      }}>
        <span style={{ fontSize: 13, color: '#666' }}>Score de fiabilité</span>
        <span style={{ 
          fontSize: 15, 
          fontWeight: '700',
          color: reliability.color 
        }}>
          {score}%
        </span>
      </div>
      
      {/* Barre de progression */}
      <div style={{
        height: 8,
        background: '#e5e5e5',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: reliability.color,
          borderRadius: 4,
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Label */}
      <div style={{ 
        marginTop: 6, 
        fontSize: 12, 
        color: reliability.color,
        fontWeight: '500'
      }}>
        {reliability.label}
      </div>

      {/* Détails optionnels */}
      {showDetails && (
        <div style={{
          marginTop: 12,
          padding: 12,
          background: '#f9fafb',
          borderRadius: 8,
          fontSize: 12,
          color: '#666'
        }}>
          <div style={{ marginBottom: 8, fontWeight: '600', color: '#1a1a1a' }}>
            Comment ça marche ?
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>Absence non signalée : <span style={{ color: '#ef4444' }}>-20 pts</span></li>
            <li>Annulation &lt; 2h : <span style={{ color: '#f59e0b' }}>-15 pts</span></li>
            <li>Annulation &lt; 24h : <span style={{ color: '#f59e0b' }}>-10 pts</span></li>
            <li>Présence confirmée : <span style={{ color: '#22c55e' }}>+2 pts</span></li>
          </ul>
        </div>
      )}
    </div>
  )
}