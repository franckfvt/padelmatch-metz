'use client'

/**
 * ============================================
 * QR CODE STYLÉ - PADELMATCH
 * ============================================
 * 
 * Génère de vrais QR codes scannables
 * Avec fallback si qrcode.react n'est pas installé
 * 
 * Installation: npm install qrcode.react
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Import dynamique de qrcode.react avec fallback
const QRCodeSVGDynamic = dynamic(
  () => import('qrcode.react').then(mod => mod.QRCodeSVG).catch(() => null),
  { 
    ssr: false,
    loading: () => <QRCodeFallback />
  }
)

// Fallback si qrcode.react n'est pas disponible
function QRCodeFallback({ size = 60 }) {
  return (
    <div style={{
      width: size * 0.78,
      height: size * 0.78,
      background: '#f0f0f0',
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.3
    }}>
      📱
    </div>
  )
}

export default function QRCodeStyled({ 
  url, 
  size = 80
}) {
  const [QRComponent, setQRComponent] = useState(null)
  const [isClient, setIsClient] = useState(false)

  // S'assurer qu'on est côté client
  useEffect(() => {
    setIsClient(true)
    
    // Charger dynamiquement qrcode.react
    import('qrcode.react')
      .then(mod => {
        setQRComponent(() => mod.QRCodeSVG)
      })
      .catch(err => {
        console.log('qrcode.react not installed, using fallback')
        setQRComponent(null)
      })
  }, [])

  // URL du QR code
  const qrUrl = url || 'https://padelmatch.fr'

  // Pas encore côté client
  if (!isClient) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: size * 0.15,
        background: 'rgba(34, 197, 94, 0.1)',
        flexShrink: 0
      }} />
    )
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.15,
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
      padding: size * 0.06,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: size * 0.12,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {QRComponent ? (
          <QRComponent
            value={qrUrl}
            size={size * 0.78}
            level="M"
            bgColor="#ffffff"
            fgColor="#1a1a2e"
          />
        ) : (
          <QRCodeFallback size={size} />
        )}
      </div>
    </div>
  )
}