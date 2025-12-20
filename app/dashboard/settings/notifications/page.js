'use client'

/**
 * ============================================
 * PAGE PARAMÈTRES - NOTIFICATIONS
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    notif_new_match: true,
    notif_match_reminder: true,
    notif_match_update: true,
    notif_new_player: true,
    notif_marketing: false,
    notif_email: true,
    notif_push: true
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    // Charger les paramètres existants
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

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
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings
        }, { onConflict: 'user_id' })

      if (error) throw error

      // Feedback visuel
      alert('Paramètres sauvegardés !')

    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function ToggleSwitch({ checked, onChange, label, description }) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <div style={{ fontWeight: 500, fontSize: 15, color: '#1a1a2e', marginBottom: 2 }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={() => onChange(!checked)}
          style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            border: 'none',
            background: checked ? '#22c55e' : '#e2e8f0',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: checked ? 26 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
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
          🔔 Notifications
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Gère tes préférences de notification
        </p>
      </div>

      {/* Section: Activité */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Activité
        </h2>

        <ToggleSwitch
          checked={settings.notif_new_match}
          onChange={(v) => setSettings({ ...settings, notif_new_match: v })}
          label="Nouvelles parties"
          description="Quand une partie correspond à tes critères"
        />
        <ToggleSwitch
          checked={settings.notif_match_reminder}
          onChange={(v) => setSettings({ ...settings, notif_match_reminder: v })}
          label="Rappels de partie"
          description="24h et 1h avant tes parties"
        />
        <ToggleSwitch
          checked={settings.notif_match_update}
          onChange={(v) => setSettings({ ...settings, notif_match_update: v })}
          label="Mises à jour"
          description="Changements dans tes parties (joueurs, horaire...)"
        />
        <ToggleSwitch
          checked={settings.notif_new_player}
          onChange={(v) => setSettings({ ...settings, notif_new_player: v })}
          label="Nouveaux joueurs"
          description="Quand quelqu'un rejoint une de tes parties"
        />
      </div>

      {/* Section: Canaux */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Canaux
        </h2>

        <ToggleSwitch
          checked={settings.notif_email}
          onChange={(v) => setSettings({ ...settings, notif_email: v })}
          label="Email"
          description="Recevoir les notifications par email"
        />
        <ToggleSwitch
          checked={settings.notif_push}
          onChange={(v) => setSettings({ ...settings, notif_push: v })}
          label="Push"
          description="Notifications sur ton téléphone"
        />
      </div>

      {/* Section: Marketing */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Marketing
        </h2>

        <ToggleSwitch
          checked={settings.notif_marketing}
          onChange={(v) => setSettings({ ...settings, notif_marketing: v })}
          label="Actualités & Offres"
          description="Nouveautés, promotions et événements"
        />
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={saveSettings}
        disabled={saving}
        style={{
          width: '100%',
          padding: 16,
          background: saving ? '#e2e8f0' : '#1a1a2e',
          color: saving ? '#94a3b8' : '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer'
        }}
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}