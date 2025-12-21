'use client'

import { useState, useRef } from 'react'
import MatchShareCard from './MatchShareCard'

/**
 * ============================================
 * MODAL PARTAGE MATCH
 * ============================================
 * 
 * Affiche la carte match + options:
 * - Copier le lien
 * - Partager WhatsApp
 * - Partager SMS
 * - Télécharger l'image
 * 
 * ============================================
 */

export default function ShareMatchModal({ match, players = [], onClose }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showTextEdit, setShowTextEdit] = useState(false)
  const cardRef = useRef(null)

  // IMPORTANT: Utiliser /join/ pour le lien PUBLIC (pas /dashboard/match/)
  const matchUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${match?.id}` 
    : ''

  function formatDate(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return '?h'
    return timeStr.slice(0, 5)
  }

  // Texte par défaut
  const defaultShareText = `🎾 Partie de Padel\n📍 ${match?.clubs?.name || match?.city || 'Lieu à définir'}\n📅 ${formatDate(match?.match_date)} à ${formatTime(match?.match_time)}\n\nRejoins-nous ! 👉 ${matchUrl}`
  
  const [shareText, setShareText] = useState(defaultShareText)

  function resetText() {
    setShareText(defaultShareText)
  }

  function copyLink() {
    navigator.clipboard.writeText(matchUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareSMS() {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareEmail() {
    const subject = `🎾 Partie de Padel - ${match?.clubs?.name || match?.city || ''}`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`, '_blank')
  }

  async function downloadImage() {
    if (!cardRef.current) return
    
    setDownloading(true)
    
    try {
      // Utiliser html2canvas si disponible, sinon fallback
      if (typeof window !== 'undefined') {
        const html2canvas = (await import('html2canvas')).default
        
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#1a1a2e',
          scale: 2, // 2x pour haute résolution (1200x630 approx)
          useCORS: true,
          allowTaint: true,
          width: cardRef.current.offsetWidth,
          height: cardRef.current.offsetHeight
        })
        
        const link = document.createElement('a')
        link.download = `padelmatch-${match?.id || 'partie'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback: copier le lien
      copyLink()
      alert('Téléchargement non disponible. Le lien a été copié à la place.')
    } finally {
      setDownloading(false)
    }
  }

  // Partage natif (mobile)
  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🎾 Partie de Padel',
          text: shareText,
          url: matchUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      copyLink()
    }
  }

  // ============================================
  // TRANSFORMER LES DONNÉES POUR MatchShareCard
  // ============================================
  
  // L'organisateur vient de match.profiles (jointure)
  const organizer = match?.profiles ? {
    name: match.profiles.name,
    avatar_url: match.profiles.avatar_url,
    level: match.profiles.level
  } : null

  // Les partenaires sont les autres joueurs confirmés (pas l'organisateur)
  const partners = players
    .filter(p => p.user_id !== match?.organizer_id)
    .map(p => ({
      name: p.profiles?.name || p.name,
      avatar_url: p.profiles?.avatar_url || p.avatar_url,
      team: p.team,
      isManual: false
    }))

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflow: 'auto',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 20,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20 
        }}>
          <h2 style={{ color: '#1a1a2e', fontSize: 20, fontWeight: 700, margin: 0 }}>
            📤 Partager la partie
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Carte de preview - AVEC LES BONNES PROPS */}
        <div 
          ref={cardRef}
          style={{ 
            marginBottom: 20,
            borderRadius: 16,
            overflow: 'hidden'
          }}
        >
          <MatchShareCard 
            match={match} 
            organizer={organizer}
            partners={partners}
          />
        </div>

        {/* Texte de partage modifiable */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 8 
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
              Message de partage
            </div>
            <button
              onClick={() => setShowTextEdit(!showTextEdit)}
              style={{
                background: showTextEdit ? '#e2e8f0' : '#f0fdf4',
                border: '1px solid ' + (showTextEdit ? '#cbd5e1' : '#bbf7d0'),
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                color: showTextEdit ? '#64748b' : '#166534',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {showTextEdit ? '✕ Fermer' : '✏️ Modifier le texte'}
            </button>
          </div>
          
          {showTextEdit && (
            <div style={{ marginBottom: 12 }}>
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
              <button
                onClick={resetText}
                style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ↺ Réinitialiser le texte
              </button>
            </div>
          )}
        </div>

        {/* Options de partage */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>
            Partager via
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {/* WhatsApp */}
            <button
              onClick={shareWhatsApp}
              style={{
                padding: '14px 8px',
                background: '#25D366',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 24 }}>📲</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>WhatsApp</span>
            </button>

            {/* SMS */}
            <button
              onClick={shareSMS}
              style={{
                padding: '14px 8px',
                background: '#34C759',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 24 }}>💬</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>SMS</span>
            </button>

            {/* Email */}
            <button
              onClick={shareEmail}
              style={{
                padding: '14px 8px',
                background: '#64748b',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 24 }}>✉️</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Email</span>
            </button>

            {/* Partage natif (mobile) */}
            <button
              onClick={shareNative}
              style={{
                padding: '14px 8px',
                background: '#475569',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: 24 }}>📤</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Plus</span>
            </button>
          </div>
          
          {/* Info technique */}
          <p style={{ 
            fontSize: 11, 
            color: '#94a3b8', 
            textAlign: 'center', 
            marginTop: 12,
            marginBottom: 0
          }}>
            💡 L'image n'est pas incluse par Email/SMS. Utilisez "Télécharger" pour la joindre manuellement.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Copier le lien */}
          <button
            onClick={copyLink}
            style={{
              flex: 1,
              padding: 14,
              background: copied ? '#dcfce7' : '#f1f5f9',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: copied ? '#16a34a' : '#1a1a2e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {copied ? '✓ Lien copié !' : '🔗 Copier le lien'}
          </button>

          {/* Télécharger */}
          <button
            onClick={downloadImage}
            disabled={downloading}
            style={{
              flex: 1,
              padding: 14,
              background: downloading ? '#e2e8f0' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: downloading ? '#94a3b8' : '#fff',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {downloading ? '⏳ Création...' : '📥 Télécharger'}
          </button>
        </div>

        {/* Info */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#f8fafc',
          borderRadius: 10,
          fontSize: 12,
          color: '#64748b',
          textAlign: 'center'
        }}>
          💡 Partage cette carte sur tes réseaux pour inviter des joueurs !
        </div>
      </div>
    </div>
  )
}