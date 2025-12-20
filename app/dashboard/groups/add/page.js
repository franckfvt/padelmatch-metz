'use client'

/**
 * ============================================
 * PAGE AJOUTER UN GROUPE
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddGroupPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'whatsapp',
    invite_link: '',
    city: '',
    region: '',
    member_count: ''
  })

  const [errors, setErrors] = useState({})

  const typeOptions = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'facebook', label: 'Facebook', icon: '👥' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
    { id: 'discord', label: 'Discord', icon: '🎮' },
    { id: 'other', label: 'Autre', icon: '🔗' }
  ]

  const regionOptions = [
    'Île-de-France', 'Hauts-de-France', 'Grand Est', 'Normandie', 'Bretagne',
    'Pays de la Loire', 'Centre-Val de Loire', 'Bourgogne-Franche-Comté', 'Nouvelle-Aquitaine',
    'Occitanie', 'Auvergne-Rhône-Alpes', 'PACA', 'Corse'
  ]

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUser(session.user)
    setLoading(false)
  }

  function validateForm() {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.invite_link.trim()) {
      newErrors.invite_link = 'Le lien d\'invitation est requis'
    } else if (!isValidUrl(formData.invite_link)) {
      newErrors.invite_link = 'Le lien doit être une URL valide'
    }

    if (!formData.city.trim() && !formData.region) {
      newErrors.location = 'Indique au moins une ville ou une région'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function isValidUrl(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('community_groups')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          invite_link: formData.invite_link.trim(),
          city: formData.city.trim() || null,
          region: formData.region || null,
          member_count: formData.member_count ? parseInt(formData.member_count) : 0,
          created_by: user.id,
          is_verified: false,
          is_active: true
        })

      if (error) throw error

      // Rediriger vers la liste des groupes
      router.push('/dashboard/groups')

    } catch (error) {
      console.error('Error creating group:', error)
      alert('Erreur lors de la création du groupe')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/groups" style={{ 
          color: '#64748b', 
          textDecoration: 'none', 
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8
        }}>
          ← Retour aux groupes
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Ajouter un groupe
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Partage un groupe WhatsApp, Facebook ou autre
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nom */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1a1a2e' }}>
            Nom du groupe *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ex: Padel Metz"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: errors.name ? '2px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.name && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</div>
          )}
        </div>

        {/* Type */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12, color: '#1a1a2e' }}>
            Type de groupe
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {typeOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: opt.id })}
                style={{
                  padding: '14px 10px',
                  border: formData.type === opt.id ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  background: formData.type === opt.id ? '#f8fafc' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Lien d'invitation */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8, color: '#1a1a2e' }}>
            Lien d'invitation *
          </label>
          <input
            type="url"
            value={formData.invite_link}
            onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
            placeholder="https://chat.whatsapp.com/..."
            style={{
              width: '100%',
              padding: '14px 16px',
              border: errors.invite_link ? '2px solid #ef4444' : '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.invite_link && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.invite_link}</div>
          )}
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            💡 Copie le lien d'invitation depuis les paramètres de ton groupe
          </div>
        </div>

        {/* Localisation */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: errors.location ? '2px solid #ef4444' : '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12, color: '#1a1a2e' }}>
            📍 Localisation
          </label>
          
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ville (ex: Metz)"
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

          <select
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="">Région (optionnel)</option>
            {regionOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {errors.location && (
            <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{errors.location}</div>
          )}
        </div>

        {/* Infos optionnelles */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12, color: '#1a1a2e' }}>
            Informations optionnelles
          </label>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décris ton groupe en quelques mots..."
              rows={3}
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
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Nombre de membres (approximatif)
            </label>
            <input
              type="number"
              value={formData.member_count}
              onChange={(e) => setFormData({ ...formData, member_count: e.target.value })}
              placeholder="ex: 150"
              min="0"
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

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: 18,
            background: saving ? '#e2e8f0' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: saving ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 20px rgba(34, 197, 94, 0.3)'
          }}
        >
          {saving ? 'Création...' : 'Créer le groupe'}
        </button>

        {/* Note */}
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
          Le groupe sera visible après vérification par notre équipe.
        </p>
      </form>
    </div>
  )
}