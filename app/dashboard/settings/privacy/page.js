'use client'

/**
 * ============================================
 * PAGE: Confidentialité - 2×2 BRAND
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = {
  p1: '#ff5a5f', p2: '#ffb400', p3: '#00b8a9', p4: '#7c5cff',
  p1Soft: '#fff0f0', p3Soft: '#e5f9f7', p4Soft: '#f0edff',
  ink: '#1a1a1a', gray: '#6b7280', muted: '#9ca3af',
  bg: '#fafafa', bgSoft: '#f5f5f5', card: '#ffffff', border: '#e5e7eb', white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${COLORS.bgSoft}` }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontWeight: 500, fontSize: 15, color: COLORS.ink, marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: 13, color: COLORS.gray }}>{description}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', background: checked ? COLORS.p3 : COLORS.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS.white, position: 'absolute', top: 2, left: checked ? 26 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [settings, setSettings] = useState({
    profile_visible: true,
    show_stats: true,
    show_history: true,
    allow_invites: true
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
    if (data) {
      setSettings({
        profile_visible: data.profile_visible ?? true,
        show_stats: data.show_stats ?? true,
        show_history: data.show_history ?? true,
        allow_invites: data.allow_invites ?? true
      })
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' })
      if (error) throw error
      setMessage({ type: 'success', text: 'Paramètres sauvegardés !' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
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

  return (
    <div style={{ fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ color: COLORS.gray, textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.ink }}>🔒 Confidentialité</h1>
        <p style={{ color: COLORS.gray, margin: '4px 0 0', fontSize: 14 }}>Contrôle ce que les autres peuvent voir</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: 14, borderRadius: 12, marginBottom: 20, background: message.type === 'success' ? COLORS.p3Soft : COLORS.p1Soft, color: message.type === 'success' ? COLORS.p3 : COLORS.p1, fontSize: 14 }}>{message.text}</div>
      )}

      {/* Section: Visibilité */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Visibilité du profil</h2>
        <ToggleSwitch checked={settings.profile_visible} onChange={(v) => setSettings({ ...settings, profile_visible: v })} label="Profil public" description="Ton profil est visible par les autres joueurs" />
        <ToggleSwitch checked={settings.show_stats} onChange={(v) => setSettings({ ...settings, show_stats: v })} label="Afficher mes stats" description="Victoires, défaites et win rate visibles" />
        <ToggleSwitch checked={settings.show_history} onChange={(v) => setSettings({ ...settings, show_history: v })} label="Afficher mon historique" description="Mes parties passées sont visibles" />
      </div>

      {/* Section: Interactions */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Interactions</h2>
        <ToggleSwitch checked={settings.allow_invites} onChange={(v) => setSettings({ ...settings, allow_invites: v })} label="Autoriser les invitations" description="Les autres joueurs peuvent t'inviter à des parties" />
      </div>

      {/* Info RGPD */}
      <div style={{ background: COLORS.p4Soft, borderRadius: 12, padding: 16, marginBottom: 24, border: `1px solid ${COLORS.p4}30` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.p4, marginBottom: 4 }}>Tes données t'appartiennent</div>
            <div style={{ fontSize: 13, color: COLORS.ink }}>Conformément au RGPD, tu peux demander l'export ou la suppression de tes données à tout moment. Contacte-nous à privacy@2x2.app</div>
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <button onClick={saveSettings} disabled={saving} style={{ width: '100%', padding: 16, background: saving ? COLORS.border : COLORS.ink, color: saving ? COLORS.muted : COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 24 }}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>

      {/* Zone danger */}
      <div style={{ background: COLORS.p1Soft, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.p1}30` }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: COLORS.p1, margin: '0 0 12px' }}>⚠️ Zone dangereuse</h2>
        <p style={{ fontSize: 13, color: COLORS.ink, marginBottom: 16, opacity: 0.8 }}>Ces actions sont irréversibles.</p>
        <button onClick={() => {
          if (confirm('Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.')) {
            alert('Contacte-nous à support@2x2.app pour supprimer ton compte.')
          }
        }} style={{ padding: '12px 20px', background: COLORS.white, color: COLORS.p1, border: `1px solid ${COLORS.p1}30`, borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Supprimer mon compte
        </button>
      </div>
    </div>
  )
}