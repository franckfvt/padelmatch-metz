'use client'

/**
 * ============================================
 * PAGE: Mon compte - 2×2 BRAND
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = {
  p1: '#ff5a5f', p2: '#ffb400', p3: '#00b8a9', p4: '#7c5cff',
  p1Soft: '#fff0f0', p3Soft: '#e5f9f7',
  ink: '#1a1a1a', gray: '#6b7280', muted: '#9ca3af',
  bg: '#fafafa', bgSoft: '#f5f5f5', card: '#ffffff', border: '#e5e7eb', white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

export default function AccountSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)
    setPhone(profileData?.phone || '')
    setCity(profileData?.city || '')
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase.from('profiles').update({
        phone: phone.trim() || null,
        city: city.trim() || null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (error) { setMessage({ type: 'error', text: 'Erreur: ' + error.message }); return }
      setMessage({ type: 'success', text: 'Informations mises à jour !' })
      setProfile(prev => ({ ...prev, phone: phone.trim(), city: city.trim() }))
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally { setSaving(false) }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' }); return }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères' }); return }
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { setMessage({ type: 'error', text: error.message }); return }
      setMessage({ type: 'success', text: 'Mot de passe modifié !' })
      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement' })
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: "'Satoshi', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          {PLAYER_COLORS.map((c, i) => (<div key={i} style={{ width: 14, height: 14, borderRadius: 5, background: c, animation: `loadBounce 1.4s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />))}
        </div>
        <div style={{ color: COLORS.gray }}>Chargement...</div>
        <style jsx>{`@keyframes loadBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }`}</style>
      </div>
    )
  }

  const inputStyle = { width: '100%', padding: '14px 16px', border: `1px solid ${COLORS.border}`, borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: COLORS.gray, display: 'block', marginBottom: 8 }

  return (
    <div style={{ fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ color: COLORS.gray, textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.ink }}>👤 Mon compte</h1>
        <p style={{ color: COLORS.gray, margin: '4px 0 0', fontSize: 14 }}>Gère tes informations de connexion</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: 14, borderRadius: 12, marginBottom: 20, background: message.type === 'success' ? COLORS.p3Soft : COLORS.p1Soft, color: message.type === 'success' ? COLORS.p3 : COLORS.p1, fontSize: 14 }}>{message.text}</div>
      )}

      {/* Email */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>📧 Email</h2>
        <div style={{ background: COLORS.bgSoft, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.ink }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>Email de connexion (non modifiable)</div>
          </div>
          <span style={{ background: COLORS.p3Soft, color: COLORS.p3, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>✓ Vérifié</span>
        </div>
      </div>

      {/* Téléphone et Ville */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>📱 Coordonnées</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Numéro de téléphone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" style={inputStyle} />
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Visible uniquement par les joueurs de tes parties</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Ville</label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Metz" style={inputStyle} />
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Pour trouver des parties et joueurs près de chez toi</div>
        </div>
        <button onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: 14, background: saving ? COLORS.border : COLORS.ink, color: saving ? COLORS.muted : COLORS.white, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Mot de passe */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>🔒 Mot de passe</h2>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} style={{ width: '100%', padding: 14, background: COLORS.bgSoft, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
            <span>Modifier mon mot de passe</span>
            <span style={{ color: COLORS.muted }}>→</span>
          </button>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword('') }} style={{ flex: 1, padding: 14, background: COLORS.bgSoft, color: COLORS.gray, border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={changePassword} disabled={saving || !newPassword || !confirmPassword} style={{ flex: 1, padding: 14, background: (saving || !newPassword || !confirmPassword) ? COLORS.border : COLORS.ink, color: (saving || !newPassword || !confirmPassword) ? COLORS.muted : COLORS.white, border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: (saving || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Infos compte */}
      <div style={{ background: COLORS.bgSoft, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, color: COLORS.gray }}>
          <div style={{ marginBottom: 8 }}><strong>Membre depuis :</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Inconnu'}</div>
          <div><strong>Numéro de membre :</strong> #{profile?.signup_number || '?'}</div>
        </div>
      </div>
    </div>
  )
}