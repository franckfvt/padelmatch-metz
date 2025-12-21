'use client'

/**
 * ============================================
 * MODAL CARTE JOUEUR - SIMPLE ET FIABLE
 * ============================================
 * 
 * - Aperçu de la carte
 * - Télécharger en PNG (html2canvas)
 * - Partage classique
 * - Édition des infos
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import PlayerCard from './PlayerCard'
import { PLAYER_BADGES, BADGE_CATEGORIES, getBadgeById } from '@/app/lib/badges'

export default function PlayerCardModal({ 
  profile, 
  onClose,
  onUpdate
}) {
  const cardRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showBadgeSelector, setShowBadgeSelector] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [userId, setUserId] = useState(null)
  
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    position: profile?.position || 'both',
    frequency: profile?.frequency || 'often',
    badge: profile?.badge || 'attaquant'
  })

  useEffect(() => {
    async function getUserId() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      }
    }
    getUserId()
  }, [])

  useEffect(() => {
    setEditData({
      name: profile?.name || '',
      position: profile?.position || 'both',
      frequency: profile?.frequency || 'often',
      badge: profile?.badge || 'attaquant'
    })
  }, [profile])

  const finalId = profile?.id || userId
  const profileUrl = finalId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/player/${finalId}` : ''

  async function downloadAsPNG() {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2
      })
      
      const link = document.createElement('a')
      link.download = `carte-${profile?.name || 'joueur'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      alert('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  async function saveChanges() {
    if (!finalId) return
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          position: editData.position,
          frequency: editData.frequency,
          badge: editData.badge
        })
        .eq('id', finalId)

      if (error) throw error
      if (onUpdate) onUpdate({ ...profile, ...editData })
      setIsEditing(false)
    } catch (err) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!profileUrl) return
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    if (!profileUrl) return
    const text = `🎾 Découvre mon profil PadelMatch !\nNiveau ${profile?.level || '?'}\n👉 ${profileUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const displayProfile = { ...profile, ...(isEditing ? editData : {}) }

  const positionOptions = [
    { id: 'left', label: 'Gauche', emoji: '⬅️' },
    { id: 'right', label: 'Droite', emoji: '➡️' },
    { id: 'both', label: 'Polyvalent', emoji: '↔️' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: '1-2/mois' },
    { id: 'regular', label: '1x/sem' },
    { id: 'often', label: '2-3x/sem' },
    { id: 'intense', label: '4+/sem' }
  ]

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 20,
          width: '100%',
          maxWidth: 360,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#1a1a2e', fontSize: 18, fontWeight: 700, margin: 0 }}>
            🎴 Ma carte joueur
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f1f5f9', cursor: 'pointer', fontSize: 16
            }}
          >
            ✕
          </button>
        </div>

        {/* Carte */}
        <div ref={cardRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <PlayerCard player={displayProfile} variant="mobile" />
        </div>

        {/* Actions principales */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={downloadAsPNG}
            disabled={downloading}
            style={{
              flex: 1, padding: 14, background: '#22c55e', border: 'none',
              borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.7 : 1
            }}
          >
            {downloading ? '⏳ ...' : '📥 Télécharger PNG'}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: 14, background: '#f1f5f9', border: 'none',
              borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}
          >
            ✏️
          </button>
        </div>

        {/* Édition */}
        {isEditing && (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {/* Pseudo */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Pseudo
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {/* Poste */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Poste
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {positionOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, position: opt.id })}
                    style={{
                      flex: 1, padding: 10,
                      border: editData.position === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: 8, background: editData.position === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Fréquence */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Fréquence
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {frequencyOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, frequency: opt.id })}
                    style={{
                      padding: 10,
                      border: editData.frequency === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: 8, background: editData.frequency === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Badge
              </label>
              <button
                onClick={() => setShowBadgeSelector(true)}
                style={{
                  width: '100%', padding: 10, border: '1px solid #e2e8f0',
                  borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{getBadgeById(editData.badge)?.emoji || '⚔️'}</span>
                  <span style={{ fontWeight: 600 }}>{getBadgeById(editData.badge)?.label || 'Attaquant'}</span>
                </span>
                <span style={{ color: '#94a3b8' }}>→</span>
              </button>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ flex: 1, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                style={{ flex: 1, padding: 12, background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? '...' : '✓ Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* Partage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={copyLink}
            style={{
              padding: 12, background: copied ? '#dcfce7' : '#f1f5f9', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: copied ? '#16a34a' : '#374151'
            }}
          >
            {copied ? '✓ Copié' : '🔗 Copier lien'}
          </button>
          <button
            onClick={shareWhatsApp}
            style={{
              padding: 12, background: '#25D366', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer'
            }}
          >
            💬 WhatsApp
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
          Télécharge ta carte et partage-la sur Instagram, Facebook...
        </p>
      </div>

      {/* Modal Badge */}
      {showBadgeSelector && (
        <div 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
          onClick={() => setShowBadgeSelector(false)}
        >
          <div 
            style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 340, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🏷️ Choisis ton badge</h3>
              <button onClick={() => setShowBadgeSelector(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>✕</button>
            </div>
            
            {BADGE_CATEGORIES.map(cat => (
              <div key={cat.id} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, color: '#64748b', marginBottom: 8, marginTop: 0 }}>{cat.label}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PLAYER_BADGES.filter(b => b.category === cat.id).map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => { setEditData({ ...editData, badge: badge.id }); setShowBadgeSelector(false) }}
                      style={{
                        padding: '6px 10px',
                        border: editData.badge === badge.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        borderRadius: 8, background: editData.badge === badge.id ? '#f0fdf4' : '#fff',
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      {badge.emoji} {badge.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}