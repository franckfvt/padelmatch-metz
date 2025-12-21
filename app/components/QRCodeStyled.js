'use client'

/**
 * ============================================
 * QR CODE STYLÉ - PADELMATCH
 * ============================================
 * 
 * QR code avec:
 * - Coins arrondis
 * - Couleurs de marque
 * - Logo PadelMatch au centre
 * 
 * Note: En production, utiliser qrcode.react pour
 * générer de vrais QR codes scannables
 * 
 * ============================================
 */

import { useEffect, useRef } from 'react'

export default function QRCodeStyled({ 
  url, 
  size = 80, 
  bgColor = '#fff',
  fgColor = '#1a1a2e',
  logoColor = '#22c55e',
  style = {}
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !url) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const scale = 2 // Pour une meilleure résolution
    canvas.width = size * scale
    canvas.height = size * scale
    ctx.scale(scale, scale)

    // Générer un pattern QR basé sur l'URL (simplifié)
    // En production, utiliser une vraie lib comme qrcode
    const hash = hashCode(url)
    const moduleCount = 7
    const moduleSize = size / (moduleCount + 2)
    const quietZone = moduleSize

    // Fond avec coins arrondis
    ctx.fillStyle = bgColor
    roundRect(ctx, 0, 0, size, size, 12)
    ctx.fill()

    // Pattern QR
    ctx.fillStyle = fgColor
    
    // Carrés de positionnement (coins)
    drawFinderPattern(ctx, quietZone, quietZone, moduleSize)
    drawFinderPattern(ctx, size - quietZone - moduleSize * 3, quietZone, moduleSize)
    drawFinderPattern(ctx, quietZone, size - quietZone - moduleSize * 3, moduleSize)

    // Modules de données (pattern pseudo-aléatoire basé sur le hash)
    const dataArea = moduleCount - 6
    for (let i = 0; i < dataArea; i++) {
      for (let j = 0; j < dataArea; j++) {
        const x = quietZone + moduleSize * 3 + i * moduleSize
        const y = quietZone + moduleSize * 3 + j * moduleSize
        
        // Skip center for logo
        const centerX = size / 2
        const centerY = size / 2
        const logoRadius = moduleSize * 1.5
        const distFromCenter = Math.sqrt(Math.pow(x + moduleSize/2 - centerX, 2) + Math.pow(y + moduleSize/2 - centerY, 2))
        
        if (distFromCenter < logoRadius) continue

        // Pattern basé sur le hash
        if (shouldDraw(hash, i, j)) {
          roundRect(ctx, x, y, moduleSize * 0.85, moduleSize * 0.85, 2)
          ctx.fill()
        }
      }
    }

    // Dessiner aussi quelques modules sur les bords
    for (let i = 0; i < moduleCount; i++) {
      // Ligne horizontale haut
      if (i > 2 && i < moduleCount - 3) {
        if (shouldDraw(hash, i, 0)) {
          roundRect(ctx, quietZone + i * moduleSize, quietZone + moduleSize * 3, moduleSize * 0.85, moduleSize * 0.85, 2)
          ctx.fill()
        }
        // Ligne horizontale bas
        if (shouldDraw(hash, i, 1)) {
          roundRect(ctx, quietZone + i * moduleSize, size - quietZone - moduleSize * 4, moduleSize * 0.85, moduleSize * 0.85, 2)
          ctx.fill()
        }
      }
      // Lignes verticales
      if (i > 2 && i < moduleCount - 3) {
        if (shouldDraw(hash, 0, i)) {
          roundRect(ctx, quietZone + moduleSize * 3, quietZone + i * moduleSize, moduleSize * 0.85, moduleSize * 0.85, 2)
          ctx.fill()
        }
        if (shouldDraw(hash, 1, i)) {
          roundRect(ctx, size - quietZone - moduleSize * 4, quietZone + i * moduleSize, moduleSize * 0.85, moduleSize * 0.85, 2)
          ctx.fill()
        }
      }
    }

    // Logo au centre
    const logoSize = moduleSize * 2.5
    const logoX = (size - logoSize) / 2
    const logoY = (size - logoSize) / 2
    
    // Fond blanc pour le logo
    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, logoSize / 2 + 2, 0, Math.PI * 2)
    ctx.fill()

    // Cercle du logo
    ctx.fillStyle = logoColor
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.fill()

    // Emoji tennis au centre (simplifié - en production utiliser une image)
    ctx.fillStyle = '#fff'
    ctx.font = `${logoSize * 0.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎾', size / 2, size / 2)

  }, [url, size, bgColor, fgColor, logoColor])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        ...style
      }}
    />
  )
}

// Helpers
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function shouldDraw(hash, i, j) {
  return ((hash >> ((i * 7 + j) % 32)) & 1) === 1
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawFinderPattern(ctx, x, y, moduleSize) {
  const size = moduleSize * 3
  
  // Carré extérieur
  roundRect(ctx, x, y, size, size, 4)
  ctx.fill()
  
  // Carré intérieur blanc
  ctx.save()
  ctx.fillStyle = '#fff'
  roundRect(ctx, x + moduleSize * 0.5, y + moduleSize * 0.5, size - moduleSize, size - moduleSize, 3)
  ctx.fill()
  ctx.restore()
  
  // Carré central
  roundRect(ctx, x + moduleSize, y + moduleSize, moduleSize, moduleSize, 2)
  ctx.fill()
}

// Version SVG alternative (plus simple, pas de canvas)
export function QRCodeStyledSVG({ 
  size = 80, 
  className = '',
  style = {} 
}) {
  const moduleSize = size / 9
  const padding = moduleSize

  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
        padding: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: 10,
        background: '#fff',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: 2,
        padding: size * 0.08,
        position: 'relative'
      }}>
        {/* Pattern QR simplifié */}
        {[
          1,1,1,0,1,
          1,0,1,1,1,
          1,1,0,1,1,
          0,1,1,0,1,
          1,1,1,1,1,
        ].map((cell, i) => (
          <div 
            key={i} 
            style={{
              background: cell ? '#1a1a2e' : 'transparent',
              borderRadius: 2
            }} 
          />
        ))}
        
        {/* Logo central */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.25,
          height: size * 0.25,
          background: '#22c55e',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.12,
          boxShadow: '0 0 0 3px #fff'
        }}>
          🎾
        </div>
      </div>
    </div>
  )
}