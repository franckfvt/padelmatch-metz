'use client'

/**
 * ============================================
 * PAGE: Modifier mon profil - CORRIGÉE
 * ============================================
 * 
 * - Avatars prédéfinis (8 couleurs)
 * - Upload photo optionnel
 * - Toutes les infos modifiables
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 8 avatars colorés prédéfinis
const AVATAR_COLORS = [
  { id: 'blue', color: '#3b82f6', emoji: '🎾' },
  { id: 'green', color: '#22c55e', emoji: '🏆' },
  { id: 'orange', color: '#f59e0b', emoji: '⚡' },
  { id: 'purple', color: '#a855f7', emoji: '🎯' },
  { id: 'red', color: '#ef4444', emoji: '🔥' },
  { id: 'cyan', color: '#06b6d4', emoji: '💎' },
  { id: 'pink', color: '#ec4899', emoji: '⭐' },
  { id: 'teal', color: '#14b8a6', emoji: '🌟' }
]

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Formulaire
  const [form, setForm] = useState({
    name: '',
    bio: '',
    city: '',
    level: 5,
    position: 'both',
    ambiance: 'mix',
    avatar_url: '',
    avatar_color: 'blue' // Couleur avatar par défaut
  })

  const [usePhoto, setUsePhoto] = useState(false) // false = avatar coloré, true = photo

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
        setMessage({ type: 'error', text: 'Erreur lors du chargement' })
        setLoading(false)
        return
      }

      if (profileData) {
        setForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          city: profileData.city || '',
          level: profileData.level || 5,
          position: profileData.position || 'both',
          ambiance: profileData.ambiance || 'mix',
          avatar_url: profileData.avatar_url || '',
          avatar_color: profileData.avatar_color || 'blue'
        })
        
        // Si l'utilisateur a une photo, activer le mode photo
        setUsePhoto(!!profileData.avatar_url && profileData.avatar_url.startsWith('http'))
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setMessage({ type: 'error', text: 'Erreur inattendue' })
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

    setSaving(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setMessage({ type: 'error', text: 'Erreur upload: ' + uploadError.message })
        setSaving(false)
        return
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
      setUsePhoto(true)
      setMessage({ type: 'success', text: 'Photo uploadée !' })

    } catch (error) {
      console.error('Error uploading:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' })
    } finally {
      setSaving(false)
    }
  }

  async function saveProfile() {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const updateData = {
        name: form.name.trim(),
        bio: form.bio.trim() || null,
        city: form.city.trim() || null,
        level: form.level,
        position: form.position,
        ambiance: form.ambiance,
        avatar_color: form.avatar_color,
        updated_at: new Date().toISOString()
      }

      // Si on utilise une photo, garder l'URL, sinon la vider
      if (usePhoto && form.avatar_url) {
        updateData.avatar_url = form.avatar_url
      } else {
        updateData.avatar_url = null
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

  // Obtenir l'avatar actuel (couleur ou photo)
  function getCurrentAvatar() {
    if (usePhoto && form.avatar_url) {
      return (
        <img
          src={form.avatar_url}
          alt="Avatar"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid #22c55e'
          }}
        />
      )
    }

    const avatarConfig = AVATAR_COLORS.find(a => a.id === form.avatar_color) || AVATAR_COLORS[0]
    return (
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${avatarConfig.color}, ${avatarConfig.color}99)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 44,
        border: '3px solid #e2e8f0'
      }}>
        {form.name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

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
        <div style={{ marginBottom: 16 }}>
          {getCurrentAvatar()}
        </div>

        {/* Toggle Photo / Avatar */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          justifyContent: 'center',
          marginBottom: 16 
        }}>
          <button
            onClick={() => setUsePhoto(false)}
            style={{
              padding: '8px 16px',
              background: !usePhoto ? '#1a1a2e' : '#f1f5f9',
              color: !usePhoto ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎨 Avatar
          </button>
          <button
            onClick={() => setUsePhoto(true)}
            style={{
              padding: '8px 16px',
              background: usePhoto ? '#1a1a2e' : '#f1f5f9',
              color: usePhoto ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📷 Photo
          </button>
        </div>

        {/* Sélection avatar coloré */}
        {!usePhoto && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Choisis ta couleur d'avatar
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setForm(prev => ({ ...prev, avatar_color: avatar.id }))}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${avatar.color}, ${avatar.color}99)`,
                    border: form.avatar_color === avatar.id ? '3px solid #1a1a2e' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload photo */}
        {usePhoto && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📷 {form.avatar_url ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
              JPG, PNG • Max 2 Mo
            </div>
          </div>
        )}
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
            value={form.bio}
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
            {form.bio?.length || 0}/200
          </div>
        </div>

        {/* Ville */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Ville
          </label>
          <input
            type="text"
            value={form.city}
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