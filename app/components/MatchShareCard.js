'use client'

/**
 * ============================================
 * COMPOSANT CARTE DE MATCH PARTAGEABLE
 * ============================================
 * 
 * Génère une carte visuelle du match qui peut être :
 * - Téléchargée en image PNG
 * - Partagée sur WhatsApp/SMS
 * - Copiée en lien
 * 
 * ============================================
 */

import { useRef, useState } from 'react'

export default function MatchShareCard({ match, onClose }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Labels
  const ambianceLabels = { 'loisir': 'Détente', 'mix': 'Équilibré', 'compet': 'Compétitif' }
  const ambianceEmojis = { 'loisir': '😎', 'mix': '⚡', 'compet': '🏆' }

  // Formatage date
  function formatDate(dateStr) {
    if (!dateStr) return 'Date flexible'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  // Calcul places
  const spotsLeft = match?.spots_available || 0
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / 4) : 0

  // Télécharger en image
  async function downloadImage() {
    if (!cardRef.current) return
    setDownloading(true)

    try {
      // Utiliser html2canvas si disponible, sinon fallback
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Haute résolution
        useCORS: true,
        logging: false
      })

      // Convertir en PNG et télécharger
      const link = document.createElement('a')
      link.download = `padelmatch-${match.id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      alert('Installe html2canvas: npm install html2canvas')
    }

    setDownloading(false)
  }

  // Partage WhatsApp
  function shareWhatsApp() {
    const text = generateShareText()
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Partage SMS
  function shareSMS() {
    const text = generateShareText()
    const url = `sms:?body=${encodeURIComponent(text)}`
    window.location.href = url
  }

  // Copier le lien
  async function copyLink() {
    const url = `${window.location.origin}/join/${match.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Générer le texte de partage
  function generateShareText() {
    const clubName = match.clubs?.name || match.city || 'Padel'
    const dateStr = match.match_date ? formatDate(match.match_date) : (match.flexible_day || 'Date flexible')
    const timeStr = match.match_time ? formatTime(match.match_time) : ''
    const url = `${window.location.origin}/join/${match.id}`

    let text = `🎾 Partie de Padel !\n\n`
    text += `📍 ${clubName}\n`
    text += `📅 ${dateStr}${timeStr ? ` à ${timeStr}` : ''}\n`
    text += `⭐ Niveau ${match.level_min}-${match.level_max}\n`
    
    if (spotsLeft > 0) {
      text += `\n🔥 ${spotsLeft} place${spotsLeft > 1 ? 's' : ''} disponible${spotsLeft > 1 ? 's' : ''} !\n`
    }
    
    if (pricePerPerson > 0) {
      text += `💰 ${pricePerPerson}€/personne\n`
    }
    
    text += `\n👉 Rejoins-nous : ${url}`
    
    return text
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 1100
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 17, fontWeight: '600', margin: 0 }}>Partager la partie</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Carte visuelle */}
          <div
            ref={cardRef}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              borderRadius: 16,
              padding: 24,
              color: '#fff',
              marginBottom: 20
            }}
          >
            {/* Logo */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
                🎾 PADELMATCH
              </div>
              <div style={{
                background: spotsLeft > 0 ? '#f59e0b' : '#22c55e',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.5
              }}>
                {spotsLeft > 0 ? `${spotsLeft} PLACE${spotsLeft > 1 ? 'S' : ''}` : 'COMPLET'}
              </div>
            </div>

            {/* Lieu */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                {match.clubs?.name || match.city || 'Partie de Padel'}
              </div>
              {match.clubs?.address && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  📍 {match.clubs.address}
                </div>
              )}
            </div>

            {/* Date & Heure */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 14,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, letterSpacing: 1 }}>
                  📅 DATE
                </div>
                <div style={{ fontSize: 15, fontWeight: '600' }}>
                  {match.match_date
                    ? new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                    : match.flexible_day || '?'
                  }
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 14,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, letterSpacing: 1 }}>
                  🕐 HEURE
                </div>
                <div style={{ fontSize: 15, fontWeight: '600' }}>
                  {match.match_time ? formatTime(match.match_time) : match.flexible_period || '?'}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: '500'
              }}>
                ⭐ Niveau {match.level_min}-{match.level_max}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: '500'
              }}>
                {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance] || 'Équilibré'}
              </span>
              {pricePerPerson > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: '500'
                }}>
                  💰 {pricePerPerson}€/pers
                </span>
              )}
            </div>
          </div>

          {/* Boutons de partage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* WhatsApp */}
            <button
              onClick={shareWhatsApp}
              style={{
                width: '100%',
                padding: 14,
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <span style={{ fontSize: 20 }}>📱</span>
              Partager sur WhatsApp
            </button>

            {/* SMS */}
            <button
              onClick={shareSMS}
              style={{
                width: '100%',
                padding: 14,
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <span style={{ fontSize: 20 }}>💬</span>
              Envoyer par SMS
            </button>

            {/* Copier lien */}
            <button
              onClick={copyLink}
              style={{
                width: '100%',
                padding: 14,
                background: copied ? '#22c55e' : '#f5f5f5',
                color: copied ? '#fff' : '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <span style={{ fontSize: 20 }}>{copied ? '✓' : '🔗'}</span>
              {copied ? 'Lien copié !' : 'Copier le lien'}
            </button>

            {/* Télécharger image */}
            <button
              onClick={downloadImage}
              disabled={downloading}
              style={{
                width: '100%',
                padding: 14,
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: downloading ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: 20 }}>📷</span>
              {downloading ? 'Génération...' : 'Télécharger l\'image'}
            </button>
          </div>

          {/* Info */}
          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#888',
            marginTop: 16
          }}>
            Partage cette carte sur tes réseaux pour trouver des joueurs !
          </p>
        </div>
      </div>
    </div>
  )
}