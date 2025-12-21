'use client'

/**
 * ============================================
 * MODAL PARTAGE MATCH - VERSION SIMPLIFIÉE
 * ============================================
 * 
 * Même logique que le partage profil :
 * - 1 bouton principal "Partager" (intelligent)
 * - Actions secondaires : Télécharger, Copier lien
 * - Pas d'édition de texte
 * - Pas de choix WhatsApp/SMS/Email séparés
 * 
 * ============================================
 */

import { useState, useRef } from 'react'
import MatchShareCard from './MatchShareCard'

// Tokens de design
const COLORS = {
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#64748b',
  border: '#e2e8f0',
  accent: '#22c55e',
  bg: '#f8fafc'
}

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
}

export default function ShareMatchModal({ match, players = [], onClose }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef(null)

  // Lien public pour rejoindre
  const matchUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${match?.id}` 
    : ''

  // Formatage date/heure
  function formatDate(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  // Texte de partage (non modifiable - simplifié)
  const shareText = `🎾 Partie de Padel
📍 ${match?.clubs?.name || match?.city || 'Lieu à définir'}
📅 ${formatDate(match?.match_date)}${match?.match_time ? ` à ${formatTime(match?.match_time)}` : ''}

Rejoins-nous ! 👉 ${matchUrl}`

  // ============================================
  // PARTAGE INTELLIGENT
  // ============================================
  async function handleShare() {
    // Sur mobile avec navigator.share
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🎾 Partie de Padel',
          text: shareText,
          url: matchUrl
        })
        return
      } catch (err) {
        // Annulé ou erreur, on continue avec WhatsApp
      }
    }
    
    // Fallback: WhatsApp (le plus utilisé)
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  // ============================================
  // COPIER LE LIEN
  // ============================================
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(matchUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Impossible de copier le lien')
    }
  }

  // ============================================
  // TÉLÉCHARGER L'IMAGE
  // ============================================
  async function downloadImage() {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      const html2canvas = (await import('html2canvas')).default
      
      // Timeout de sécurité (10s)
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const capture = html2canvas(cardRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const canvas = await Promise.race([capture, timeout])
      
      const link = document.createElement('a')
      link.download = `padelmatch-${match?.id || 'partie'}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      // Fallback: copier le lien
      await copyLink()
      alert('Téléchargement impossible. Le lien a été copié !')
    } finally {
      setDownloading(false)
    }
  }

  // ============================================
  // CONSTRUIRE LA LISTE DES JOUEURS
  // ============================================
  // L'organisateur n'est pas dans match_participants
  // On l'ajoute manuellement depuis match.profiles
  
  const organizerAsPlayer = match?.profiles ? {
    id: 'organizer',
    user_id: match.organizer_id,
    team: match.organizer_team || 'A',
    status: 'confirmed',
    profiles: {
      id: match.organizer_id,
      name: match.profiles.name,
      avatar_url: match.profiles.avatar_url,
      level: match.profiles.level,
      position: match.profiles.position
    }
  } : null

  const allPlayers = [
    ...(organizerAsPlayer ? [organizerAsPlayer] : []),
    ...players.filter(p => p.user_id !== match?.organizer_id)
  ]

  // Nombre de places restantes
  const confirmedPlayers = allPlayers.filter(p => p.status === 'confirmed')
  const spotsLeft = 4 - confirmedPlayers.length

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
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: COLORS.card,
          borderRadius: RADIUS.xl,
          padding: 20,
          width: '100%',
          maxWidth: 440,
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
          marginBottom: 16 
        }}>
          <h2 style={{ 
            color: COLORS.text, 
            fontSize: 18, 
            fontWeight: 700, 
            margin: 0 
          }}>
            📤 Partager la partie
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: COLORS.bg,
              color: COLORS.textMuted,
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

        {/* Carte de preview */}
        <div 
          ref={cardRef}
          style={{ 
            marginBottom: 20,
            borderRadius: RADIUS.lg,
            overflow: 'hidden'
          }}
        >
          <MatchShareCard match={match} players={allPlayers} />
        </div>

        {/* Info places restantes */}
        {spotsLeft > 0 && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: RADIUS.md,
            padding: '12px 16px',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <span style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>
              🎾 {spotsLeft} place{spotsLeft > 1 ? 's' : ''} disponible{spotsLeft > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Bouton principal : PARTAGER */}
        <button
          onClick={handleShare}
          style={{
            width: '100%',
            padding: 16,
            background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
            border: 'none',
            borderRadius: RADIUS.md,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          📤 Partager
        </button>

        {/* Actions secondaires */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={downloadImage}
            disabled={downloading}
            style={{
              flex: 1,
              padding: 14,
              background: downloading ? '#e5e5e5' : COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              color: downloading ? '#94a3b8' : '#475569',
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {downloading ? '⏳' : '📥'} Télécharger
          </button>

          <button
            onClick={copyLink}
            style={{
              flex: 1,
              padding: 14,
              background: copied ? '#dcfce7' : COLORS.bg,
              border: `1px solid ${copied ? '#bbf7d0' : COLORS.border}`,
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              color: copied ? '#16a34a' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier lien'}
          </button>
        </div>

        {/* Message d'aide */}
        <div style={{
          background: COLORS.bg,
          borderRadius: RADIUS.sm,
          padding: 12,
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: 12, 
            color: COLORS.textMuted, 
            margin: 0,
            lineHeight: 1.5
          }}>
            💡 Partage sur WhatsApp, Instagram, ou télécharge l'image pour tes stories !
          </p>
        </div>
      </div>
    </div>
  )
}