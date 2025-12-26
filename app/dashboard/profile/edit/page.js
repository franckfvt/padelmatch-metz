'use client'

/**
 * ============================================
 * PAGE: Modifier mon profil - 2×2 BRAND
 * ============================================
 * 
 * - Avatar carré arrondi avec couleur auto
 * - Option upload photo
 * - Toutes infos modifiables
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e5',
  p3Soft: '#e5f9f7',
  p4Soft: '#f0edff',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  border: '#e5e7eb',
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

function getAvatarColor(name) {
  if (!name) return COLORS.p1
  return PLAYER_COLORS[name.charCodeAt(0) % 4]
}

const POSITION_OPTIONS = [
  { id: 'left', label: 'Gauche', emoji: '⬅️' },
  { id: 'right', label: 'Droite', emoji: '➡️' },
  { id: 'both', label: 'Les deux', emoji: '↔️' }
]

const AMBIANCE_OPTIONS = [
  { id: 'loisir', label: 'Détente', emoji: '😌', color: COLORS.p3 },
  { id: 'mix', label: 'Équilibré', emoji: '⚡', color: COLORS.p2 },
  { id: 'compet', label: 'Compétitif', emoji: '🔥', color: COLORS.p1 }
]

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)

  const [form, setForm] = useState({
    name: '',
    bio: '',
    city: '',
    level: 5,
    position: 'both',
    ambiance: 'mix',
    avatar_url: ''
  })

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

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
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) {
        setMessage({ type: 'error', text: 'Erreur upload: ' + uploadError.message })
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: 'Photo uploadée !' })

    } catch (error) {
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
        setMessage({ type: 'error', text: 'Erreur: ' + error.message })
        setSaving(false)
        return
      }

      setMessage({ type: 'success', text: 'Profil mis à jour !' })
      setTimeout(() => router.push('/dashboard/me'), 1000)

    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const avatarColor = getAvatarColor(form.name)

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-dots">
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className="loading-text">Chargement...</div>
        <style jsx>{`
          .loading-page { padding: 40px; text-align: center; font-family: 'Satoshi', -apple-system, sans-serif; }
          .loading-dots { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
          .loading-dot { width: 14px; height: 14px; border-radius: 5px; animation: loadBounce 1.4s ease-in-out infinite; }
          .loading-text { color: ${COLORS.gray}; font-size: 14px; }
          @keyframes loadBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="edit-page">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <Link href="/dashboard/me" className="back-link">← Annuler</Link>
          <h1 className="title">Modifier le profil</h1>
        </div>
        <button onClick={saveProfile} disabled={saving} className={`save-btn ${saving ? 'loading' : ''}`}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Avatar Section */}
      <div className="card avatar-section">
        <div className="avatar-preview">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar" className="avatar-img" style={{ borderColor: avatarColor }} />
          ) : (
            <div className="avatar-letter" style={{ background: avatarColor }}>
              {form.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />

        <div className="avatar-buttons">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary">
            {uploading ? '⏳ Upload...' : '📷 Ajouter une photo'}
          </button>
          {form.avatar_url && (
            <button onClick={removePhoto} className="btn-danger">🗑️ Retirer</button>
          )}
        </div>
        <div className="avatar-hint">Sans photo, ton avatar affiche ta première lettre</div>
      </div>

      {/* Infos de base */}
      <div className="card">
        <div className="form-group">
          <label>Nom *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ton prénom ou pseudo"
          />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Quelques mots sur toi..."
            rows={3}
            maxLength={200}
          />
          <div className="char-count">{(form.bio || '').length}/200</div>
        </div>

        <div className="form-group">
          <label>Ville</label>
          <input
            type="text"
            value={form.city || ''}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Ex: Metz"
          />
        </div>
      </div>

      {/* Niveau */}
      <div className="card">
        <label className="card-label">⭐ Niveau : {form.level}/10</label>
        <input
          type="range"
          min="1"
          max="10"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })}
          className="level-slider"
        />
        <div className="level-labels">
          <span>Débutant</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Position */}
      <div className="card">
        <label className="card-label">🎯 Position préférée</label>
        <div className="option-btns">
          {POSITION_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, position: opt.id })}
              className={`option-btn ${form.position === opt.id ? 'selected' : ''}`}
            >
              <div className="option-emoji">{opt.emoji}</div>
              <div className="option-label">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ambiance */}
      <div className="card">
        <label className="card-label">🎮 Ambiance de jeu</label>
        <div className="option-btns">
          {AMBIANCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setForm({ ...form, ambiance: opt.id })}
              className={`option-btn ${form.ambiance === opt.id ? 'selected' : ''}`}
              style={{
                borderColor: form.ambiance === opt.id ? opt.color : COLORS.border,
                background: form.ambiance === opt.id ? `${opt.color}15` : COLORS.card
              }}
            >
              <div className="option-emoji">{opt.emoji}</div>
              <div className="option-label">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .edit-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-left {}

        .back-link {
          color: ${COLORS.gray};
          text-decoration: none;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: ${COLORS.ink};
        }

        .save-btn {
          padding: 10px 20px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .save-btn.loading {
          background: ${COLORS.border};
          color: ${COLORS.muted};
          cursor: not-allowed;
        }

        .message {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .message.success {
          background: ${COLORS.p3Soft};
          color: ${COLORS.p3};
        }

        .message.error {
          background: ${COLORS.p1Soft};
          color: ${COLORS.p1};
        }

        .card {
          background: ${COLORS.card};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          border: 1px solid ${COLORS.border};
        }

        .avatar-section {
          text-align: center;
        }

        .avatar-preview {
          margin-bottom: 16px;
        }

        .avatar-img {
          width: 100px;
          height: 100px;
          border-radius: 28px;
          object-fit: cover;
          border: 3px solid;
        }

        .avatar-letter {
          width: 100px;
          height: 100px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 44px;
          font-weight: 700;
          color: ${COLORS.white};
          margin: 0 auto;
        }

        .avatar-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .btn-secondary {
          padding: 10px 16px;
          background: ${COLORS.bgSoft};
          color: ${COLORS.gray};
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .btn-danger {
          padding: 10px 16px;
          background: ${COLORS.p1Soft};
          color: ${COLORS.p1};
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .avatar-hint {
          font-size: 11px;
          color: ${COLORS.muted};
          margin-top: 10px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.gray};
          display: block;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid ${COLORS.border};
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: ${COLORS.ink};
        }

        .form-group textarea {
          resize: vertical;
        }

        .char-count {
          font-size: 12px;
          color: ${COLORS.muted};
          margin-top: 4px;
          text-align: right;
        }

        .card-label {
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.gray};
          display: block;
          margin-bottom: 12px;
        }

        .level-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          accent-color: ${COLORS.ink};
        }

        .level-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: ${COLORS.muted};
        }

        .option-btns {
          display: flex;
          gap: 8px;
        }

        .option-btn {
          flex: 1;
          padding: 14px 12px;
          border: 2px solid ${COLORS.border};
          border-radius: 12px;
          background: ${COLORS.card};
          cursor: pointer;
          text-align: center;
          font-family: inherit;
        }

        .option-btn.selected {
          border-color: ${COLORS.ink};
          background: ${COLORS.bgSoft};
        }

        .option-emoji {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .option-label {
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.ink};
        }
      `}</style>
    </div>
  )
}