'use client'

/**
 * ============================================
 * MODAL CARTE JOUEUR - AVEC ÉDITION INLINE
 * ============================================
 * 
 * Fonctionnalités:
 * - Affichage de la carte (mobile ou share)
 * - Édition inline (nom, poste, fréquence, badge)
 * - Sélecteur de badge avec toutes les catégories
 * - Boutons de partage (lien, WhatsApp, etc.)
 * - Sauvegarde automatique
 * 
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
  variant = 'mobile' // 'mobile' ou 'share'
}) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showBadgeSelector, setShowBadgeSelector] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentVariant, setCurrentVariant] = useState(variant)
  
  // État local pour l'édition
  const [editData, setEditData] = useState({
    name: profile?.name || '',
    position: profile?.position || 'both',
    frequency: profile?.frequency || 'often',
    badge: profile?.badge || 'attaquant'
  })

  // Sync avec le profil
  useEffect(() => {
    setEditData({
      name: profile?.name || '',
      position: profile?.position || 'both',
      frequency: profile?.frequency || 'often',
      badge: profile?.badge || 'attaquant'
    })
  }, [profile])

  // Sauvegarder les modifications
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

      // Callback pour mettre à jour le parent
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

  // Profil avec les données éditées
  const displayProfile = isEditing ? { ...profile, ...editData } : profile

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
        backdropFilter: 'blur(4px)',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 20,
          width: '100%',
          maxWidth: currentVariant === 'share' ? 560 : 380,
          maxHeight: '90vh',
          overflowY: 'auto'
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
          <h2 style={{ color: '#1a1a2e', fontSize: 18, fontWeight: 700, margin: 0 }}>
            🎴 Ma carte joueur
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Toggle variant */}
            <button
              onClick={() => setCurrentVariant(v => v === 'mobile' ? 'share' : 'mobile')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {currentVariant === 'mobile' ? '📱' : '🖼️'} 
              {currentVariant === 'mobile' ? 'Mobile' : 'Share'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: 16,
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

        {/* === LA CARTE === */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <PlayerCard 
            player={displayProfile}
            variant={currentVariant}
            size={currentVariant === 'share' ? 'default' : 'default'}
          />
        </div>

        {/* Bouton éditer */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              padding: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            ✏️ Modifier ma carte
          </button>
        )}

        {/* === PANNEAU D'ÉDITION === */}
        {isEditing && (
          <div style={{
            background: '#f8fafc',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: '#64748b', 
              marginBottom: 16,
              marginTop: 0
            }}>
              ✏️ Modifier les informations
            </h3>

            {/* Pseudo */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#64748b',
                display: 'block',
                marginBottom: 6
              }}>
                Pseudo
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                placeholder="Ton pseudo"
              />
            </div>

            {/* Poste */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#64748b',
                display: 'block',
                marginBottom: 6
              }}>
                Poste préféré
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {positionOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, position: opt.id })}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      border: editData.position === opt.id 
                        ? '2px solid #22c55e' 
                        : '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: editData.position === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: editData.position === opt.id ? '#166534' : '#374151'
                    }}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fréquence */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#64748b',
                display: 'block',
                marginBottom: 6
              }}>
                Fréquence de jeu
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {frequencyOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, frequency: opt.id })}
                    style={{
                      flex: '1 1 45%',
                      padding: '10px 8px',
                      border: editData.frequency === opt.id 
                        ? '2px solid #22c55e' 
                        : '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: editData.frequency === opt.id ? '#f0fdf4' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: editData.frequency === opt.id ? '#166534' : '#374151'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#64748b',
                display: 'block',
                marginBottom: 6
              }}>
                Ton badge
              </label>
              <button
                onClick={() => setShowBadgeSelector(true)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>
                    {getBadgeById(editData.badge)?.emoji || '⚔️'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1a1a2e' }}>
                    {getBadgeById(editData.badge)?.label || 'Attaquant'}
                  </span>
                </span>
                <span style={{ color: '#94a3b8' }}>Changer →</span>
              </button>
            </div>

            {/* Boutons sauvegarder / annuler */}
            <div style={{ display: 'flex', gap: 10 }}>
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
                  padding: 12,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748b',
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
                  padding: 12,
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
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

        {/* === BOUTONS DE PARTAGE === */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10 
        }}>
          <button
            onClick={copyLink}
            style={{
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
              gap: 6
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier'}
          </button>
          <button
            onClick={shareWhatsApp}
            style={{
              padding: 14,
              background: '#25D366',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            style={{
              padding: 14,
              background: '#1877F2',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            📘 Facebook
          </button>
          <button
            onClick={shareTwitter}
            style={{
              padding: 14,
              background: '#1DA1F2',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            🐦 Twitter
          </button>
        </div>
      </div>

      {/* === MODAL SÉLECTEUR DE BADGE === */}
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
            padding: 16
          }}
          onClick={() => setShowBadgeSelector(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20 
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
                🏷️ Choisis ton badge
              </h3>
              <button
                onClick={() => setShowBadgeSelector(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {BADGE_CATEGORIES.map(category => (
              <div key={category.id} style={{ marginBottom: 20 }}>
                <h4 style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: '#64748b', 
                  marginBottom: 10,
                  marginTop: 0
                }}>
                  {category.label}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLAYER_BADGES.filter(b => b.category === category.id).map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => {
                        setEditData({ ...editData, badge: badge.id })
                        setShowBadgeSelector(false)
                      }}
                      style={{
                        padding: '8px 14px',
                        border: editData.badge === badge.id 
                          ? '2px solid #22c55e' 
                          : '1px solid #e2e8f0',
                        borderRadius: 10,
                        background: editData.badge === badge.id ? '#f0fdf4' : '#fff',
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{badge.emoji}</span>
                      <span style={{ 
                        fontWeight: 600,
                        color: editData.badge === badge.id ? '#166534' : '#374151'
                      }}>
                        {badge.label}
                      </span>
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