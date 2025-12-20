'use client'

/**
 * ============================================
 * PAGE: Modifier mon profil - SIMPLIFIÉE V3
 * ============================================
 * 
 * - Avatar = Lettre + couleur automatique
 * - Option photo si souhaité
 * - Toutes les infos modifiables
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Couleurs automatiques basées sur la première lettre du nom
const LETTER_COLORS = {
  A: '#3b82f6', B: '#22c55e', C: '#f59e0b', D: '#a855f7',
  E: '#ef4444', F: '#06b6d4', G: '#ec4899', H: '#14b8a6',
  I: '#3b82f6', J: '#22c55e', K: '#f59e0b', L: '#a855f7',
  M: '#ef4444', N: '#06b6d4', O: '#ec4899', P: '#14b8a6',
  Q: '#3b82f6', R: '#22c55e', S: '#f59e0b', T: '#a855f7',
  U: '#ef4444', V: '#06b6d4', W: '#ec4899', X: '#14b8a6',
  Y: '#3b82f6', Z: '#22c55e'
}

function getColorForName(name) {
  const letter = (name || 'A')[0].toUpperCase()
  return LETTER_COLORS[letter] || '#3b82f6'
}

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)

  // Formulaire
  const [form, setForm] = useState({
    name: '',
    bio: '',
    city: '',
    level: 5,
    position: 'both',
    ambiance: 'mix',
    avatar_url: ''
  })

  const positionOptions = [
    { id: 'left', label: 'Gauche', emoji: '⬅️' },
    { id: 'right', label: 'Droite', emoji: '➡️' },
    { id: 'both', label: 'Les deux', emoji: '↔️' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', color: '#22c55e' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', color: '#3b82f6' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', color: '#f59e0b' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
      }

      if (profileData) {
        setForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          city: profileData.city || '',
          level: profileData.level || 5,
          position: profileData.position || 'both',
          ambiance: profileData.ambiance || 'mix',
          avatar_url: profileData.avatar_url || ''
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Le fichier doit être une image' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image doit faire moins de 2 Mo' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      // Upload directement à la racine du bucket (pas dans un sous-dossier)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setMessage({ type: 'error', text: 'Erreur upload: ' + uploadError.message })
        setUploading(false)
        return
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'Photo uploadée !' })

    } catch (error) {
      console.error('Error uploading:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' })
    } finally {
      setUploading(false)
    }
  }

  function removePhoto() {
    setForm(prev => ({ ...prev, avatar_url: '' }))
    setMessage({ type: 'success', text: 'Photo retirée' })
  }

  async function saveProfile() {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name.trim(),
          bio: form.bio?.trim() || null,
          city: form.city?.trim() || null,
          level: form.level,
          position: form.position,
          ambiance: form.ambiance,
          avatar_url: form.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Save error:', error)
        setMessage({ type: 'error', text: 'Erreur: ' + error.message })
        setSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Profil mis à jour !' })
      
      setTimeout(() => {
        router.push('/dashboard/me')
      }, 1000)

    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  // Couleur automatique basée sur le nom
  const avatarColor = getColorForName(form.name)

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✏️</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Link href="/dashboard/me" style={{ 
            color: '#64748b', 
            textDecoration: 'none', 
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 8
          }}>
            ← Annuler
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            Modifier le profil
          </h1>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            padding: '10px 20px',
            background: saving ? '#e2e8f0' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: saving ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: 14,
          borderRadius: 12,
          marginBottom: 20,
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: message.type === 'success' ? '#166534' : '#dc2626',
          fontSize: 14
        }}>
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {/* Avatar actuel */}
        <div style={{ marginBottom: 16 }}>
          {form.avatar_url ? (
            <img
              src={form.avatar_url}
              alt="Avatar"
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${avatarColor}`
              }}
            />
          ) : (
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
              color: '#fff',
              margin: '0 auto',
              border: '3px solid #e2e8f0'
            }}>
              {form.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Boutons photo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '10px 16px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {uploading ? '⏳ Upload...' : '📷 Ajouter une photo'}
          </button>

          {form.avatar_url && (
            <button
              onClick={removePhoto}
              style={{
                padding: '10px 16px',
                background: '#fef2f2',
                color: '#dc2626',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🗑️ Retirer
            </button>
          )}
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
          Sans photo, ton avatar affiche ta première lettre avec une couleur unique
        </div>
      </div>

      {/* Infos de base */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        {/* Nom */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Nom *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ton prénom ou pseudo"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Bio
          </label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Quelques mots sur toi..."
            rows={3}
            maxLength={200}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
            {(form.bio || '').length}/200
          </div>
        </div>

        {/* Ville */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Ville
          </label>
          <input
            type="text"
            value={form.city || ''}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Ex: Metz"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Niveau */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
          ⭐ Niveau : {form.level}/10
        </label>
        
        <input
          type="range"
          min="1"
          max="10"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            outline: 'none',
            cursor: 'pointer',
            accentColor: '#22c55e'
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Débutant</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Expert</span>
        </div>
      </div>

      {/* Position */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
          🎯 Position préférée
        </label>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {positionOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, position: opt.id })}
              style={{
                flex: 1,
                padding: '14px 12px',
                border: form.position === opt.id ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                borderRadius: 12,
                background: form.position === opt.id ? '#f8fafc' : '#fff',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ambiance */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
          🎮 Ambiance de jeu
        </label>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {ambianceOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, ambiance: opt.id })}
              style={{
                flex: 1,
                padding: '14px 12px',
                border: form.ambiance === opt.id ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                borderRadius: 12,
                background: form.ambiance === opt.id ? opt.color + '15' : '#fff',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}