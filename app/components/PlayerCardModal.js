'use client'

/**
 * ============================================
 * MODAL CARTE JOUEUR - AVEC ÉDITION INLINE
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PlayerCard from './PlayerCard'
import { PLAYER_BADGES, BADGE_CATEGORIES, getBadgeById } from '@/app/lib/badges'

export default function PlayerCardModal({ 
  profile, 
  onClose,
  onUpdate,
  variant = 'mobile'
}) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showBadgeSelector, setShowBadgeSelector] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentVariant, setCurrentVariant] = useState(variant)
  
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    position: profile?.position || 'both',
    frequency: profile?.frequency || 'often',
    badge: profile?.badge || 'attaquant'
  })

  useEffect(() => {
    setEditData({
      name: profile?.name || '',
      position: profile?.position || 'both',
      frequency: profile?.frequency || 'often',
      badge: profile?.badge || 'attaquant'
    })
  }, [profile])

  async function saveChanges() {
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
        .eq('id', profile.id)

      if (error) throw error

      if (onUpdate) {
        onUpdate({ ...profile, ...editData })
      }
      
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `🎾 Découvre mon profil PadelMatch !\n\nJe suis niveau ${profile?.level || '?'} et je recherche des partenaires.\n\n👉 ${window.location.origin}/player/${profile?.id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareFacebook() {
    const url = `${window.location.origin}/player/${profile?.id}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  function shareTwitter() {
    const text = `🎾 Je joue au padel niveau ${profile?.level || '?'} ! Retrouve-moi sur @PadelMatch`
    const url = `${window.location.origin}/player/${profile?.id}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

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

  // Toujours inclure l'ID dans le profil affiché
  const displayProfile = {
    ...profile,
    ...(isEditing ? editData : {}),
    id: profile?.id // Toujours garder l'ID
  }

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
        padding: 12,
        backdropFilter: 'blur(4px)',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 16,
          width: '100%',
          maxWidth: 340,
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12 
        }}>
          <h2 style={{ color: '#1a1a2e', fontSize: 16, fontWeight: 700, margin: 0 }}>
            🎴 Ma carte joueur
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setCurrentVariant(v => v === 'mobile' ? 'share' : 'mobile')}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              {currentVariant === 'mobile' ? '📱' : '🖼️'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* LA CARTE - centrée et contenue */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: 12,
          overflow: 'hidden'
        }}>
          <PlayerCard 
            player={displayProfile}
            variant={currentVariant}
          />
        </div>

        {/* Bouton éditer */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              padding: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            ✏️ Modifier ma carte
          </button>
        )}

        {/* PANNEAU D'ÉDITION */}
        {isEditing && (
          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: '#64748b', 
              marginBottom: 12,
              marginTop: 0
            }}>
              ✏️ Modifier
            </h3>

            {/* Pseudo */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Pseudo
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Poste */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Poste
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {positionOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, position: opt.id })}
                    style={{
                      flex: 1,
                      padding: 8,
                      border: editData.position === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: editData.position === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Fréquence */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Fréquence
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {frequencyOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, frequency: opt.id })}
                    style={{
                      padding: 8,
                      border: editData.frequency === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: editData.frequency === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Badge
              </label>
              <button
                onClick={() => setShowBadgeSelector(true)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{getBadgeById(editData.badge)?.emoji || '⚔️'}</span>
                  <span style={{ fontWeight: 600 }}>{getBadgeById(editData.badge)?.label || 'Attaquant'}</span>
                </span>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>Changer</span>
              </button>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setEditData({
                    name: profile?.name || '',
                    position: profile?.position || 'both',
                    frequency: profile?.frequency || 'often',
                    badge: profile?.badge || 'attaquant'
                  })
                  setIsEditing(false)
                }}
                style={{
                  flex: 1,
                  padding: 10,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 10,
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? '...' : '✓ Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* BOUTONS DE PARTAGE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <button
            onClick={copyLink}
            style={{
              padding: 12,
              background: copied ? '#dcfce7' : '#f1f5f9',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: copied ? '#16a34a' : '#1a1a2e',
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copié' : '🔗 Copier'}
          </button>
          <button
            onClick={shareWhatsApp}
            style={{
              padding: 12,
              background: '#25D366',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            style={{
              padding: 12,
              background: '#1877F2',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            📘 Facebook
          </button>
          <button
            onClick={shareTwitter}
            style={{
              padding: 12,
              background: '#1DA1F2',
              border: 'none',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            🐦 Twitter
          </button>
        </div>
      </div>

      {/* MODAL SÉLECTEUR DE BADGE */}
      {showBadgeSelector && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12
          }}
          onClick={() => setShowBadgeSelector(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 16,
              width: '100%',
              maxWidth: 340,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16 
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                🏷️ Ton badge
              </h3>
              <button
                onClick={() => setShowBadgeSelector(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </div>

            {BADGE_CATEGORIES.map(category => (
              <div key={category.id} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, marginTop: 0 }}>
                  {category.label}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PLAYER_BADGES.filter(b => b.category === category.id).map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => {
                        setEditData({ ...editData, badge: badge.id })
                        setShowBadgeSelector(false)
                      }}
                      style={{
                        padding: '6px 10px',
                        border: editData.badge === badge.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        background: editData.badge === badge.id ? '#f0fdf4' : '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span>{badge.emoji}</span>
                      <span style={{ fontWeight: 600 }}>{badge.label}</span>
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