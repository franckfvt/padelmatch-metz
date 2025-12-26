'use client'

/**
 * ============================================
 * PAGE: Notifications - 2×2 BRAND
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COLORS = {
  p1: '#ff5a5f', p2: '#ffb400', p3: '#00b8a9', p4: '#7c5cff',
  p3Soft: '#e5f9f7',
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

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [settings, setSettings] = useState({
    notif_new_match: true,
    notif_match_reminder: true,
    notif_match_update: true,
    notif_new_player: true,
    notif_marketing: false,
    notif_email: true,
    notif_push: true
  })

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
    if (data) {
      setSettings({
        notif_new_match: data.notif_new_match ?? true,
        notif_match_reminder: data.notif_match_reminder ?? true,
        notif_match_update: data.notif_match_update ?? true,
        notif_new_player: data.notif_new_player ?? true,
        notif_marketing: data.notif_marketing ?? false,
        notif_email: data.notif_email ?? true,
        notif_push: data.notif_push ?? true
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
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.ink }}>🔔 Notifications</h1>
        <p style={{ color: COLORS.gray, margin: '4px 0 0', fontSize: 14 }}>Gère tes préférences de notification</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: 14, borderRadius: 12, marginBottom: 20, background: message.type === 'success' ? COLORS.p3Soft : '#fff0f0', color: message.type === 'success' ? COLORS.p3 : COLORS.p1, fontSize: 14 }}>{message.text}</div>
      )}

      {/* Section: Activité */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Activité</h2>
        <ToggleSwitch checked={settings.notif_new_match} onChange={(v) => setSettings({ ...settings, notif_new_match: v })} label="Nouvelles parties" description="Quand une partie correspond à tes critères" />
        <ToggleSwitch checked={settings.notif_match_reminder} onChange={(v) => setSettings({ ...settings, notif_match_reminder: v })} label="Rappels de partie" description="24h et 1h avant tes parties" />
        <ToggleSwitch checked={settings.notif_match_update} onChange={(v) => setSettings({ ...settings, notif_match_update: v })} label="Mises à jour" description="Changements dans tes parties (joueurs, horaire...)" />
        <ToggleSwitch checked={settings.notif_new_player} onChange={(v) => setSettings({ ...settings, notif_new_player: v })} label="Nouveaux joueurs" description="Quand quelqu'un rejoint une de tes parties" />
      </div>

      {/* Section: Canaux */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Canaux</h2>
        <ToggleSwitch checked={settings.notif_email} onChange={(v) => setSettings({ ...settings, notif_email: v })} label="Email" description="Recevoir les notifications par email" />
        <ToggleSwitch checked={settings.notif_push} onChange={(v) => setSettings({ ...settings, notif_push: v })} label="Push" description="Notifications sur ton téléphone" />
      </div>

      {/* Section: Marketing */}
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Marketing</h2>
        <ToggleSwitch checked={settings.notif_marketing} onChange={(v) => setSettings({ ...settings, notif_marketing: v })} label="Actualités & Offres" description="Nouveautés, promotions et événements" />
      </div>

      {/* Bouton sauvegarder */}
      <button onClick={saveSettings} disabled={saving} style={{ width: '100%', padding: 16, background: saving ? COLORS.border : COLORS.ink, color: saving ? COLORS.muted : COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}