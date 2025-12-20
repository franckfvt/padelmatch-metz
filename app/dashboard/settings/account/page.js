'use client'

/**
 * ============================================
 * PAGE: Paramètres du compte
 * ============================================
 * 
 * - Voir email
 * - Modifier téléphone
 * - Modifier ville
 * - Modifier mot de passe
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Formulaire
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  
  // Mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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

    setProfile(profileData)
    setPhone(profileData?.phone || '')
    setCity(profileData?.city || '')

    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: phone.trim() || null,
          city: city.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Informations mises à jour !' })
      
      // Mettre à jour le profil local
      setProfile(prev => ({ ...prev, phone: phone.trim(), city: city.trim() }))

    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Mot de passe modifié !' })
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ 
          color: '#64748b', 
          textDecoration: 'none', 
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8
        }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          👤 Mon compte
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Gère tes informations de connexion
        </p>
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

      {/* Email (lecture seule) */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
          📧 Email
        </h2>

        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a2e' }}>
              {user?.email}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Email de connexion (non modifiable)
            </div>
          </div>
          <span style={{
            background: '#dcfce7',
            color: '#16a34a',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600
          }}>
            ✓ Vérifié
          </span>
        </div>
      </div>

      {/* Téléphone et Ville */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
          📱 Coordonnées
        </h2>

        {/* Téléphone */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Numéro de téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
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
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Visible uniquement par les joueurs de tes parties
          </div>
        </div>

        {/* Ville */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Ville
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
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
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Pour trouver des parties et joueurs près de chez toi
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            width: '100%',
            padding: 14,
            background: saving ? '#e2e8f0' : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: saving ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Mot de passe */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
          🔒 Mot de passe
        </h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            style={{
              width: '100%',
              padding: 14,
              background: '#f8fafc',
              color: '#1a1a2e',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Modifier mon mot de passe</span>
            <span style={{ color: '#94a3b8' }}>→</span>
          </button>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
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

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={changePassword}
                disabled={saving || !newPassword || !confirmPassword}
                style={{
                  flex: 1,
                  padding: 14,
                  background: saving || !newPassword || !confirmPassword ? '#e2e8f0' : '#1a1a2e',
                  color: saving || !newPassword || !confirmPassword ? '#94a3b8' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Infos compte */}
      <div style={{
        background: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Membre depuis :</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Inconnu'}
          </div>
          <div>
            <strong>Numéro de membre :</strong> #{profile?.signup_number || '?'}
          </div>
        </div>
      </div>
    </div>
  )
}