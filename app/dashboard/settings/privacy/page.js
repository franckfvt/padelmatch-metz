'use client'

/**
 * ============================================
 * PAGE PARAMÈTRES - CONFIDENTIALITÉ
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState({
    profile_visible: true,
    show_stats: true,
    show_history: true,
    allow_invites: true
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

    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

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
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings
        }, { onConflict: 'user_id' })

      if (error) throw error

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
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
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
          🔒 Confidentialité
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Contrôle ce que les autres peuvent voir
        </p>
      </div>

      {/* Section: Visibilité */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Visibilité du profil
        </h2>

        <ToggleSwitch
          checked={settings.profile_visible}
          onChange={(v) => setSettings({ ...settings, profile_visible: v })}
          label="Profil public"
          description="Ton profil est visible par les autres joueurs"
        />
        <ToggleSwitch
          checked={settings.show_stats}
          onChange={(v) => setSettings({ ...settings, show_stats: v })}
          label="Afficher mes stats"
          description="Victoires, défaites et win rate visibles"
        />
        <ToggleSwitch
          checked={settings.show_history}
          onChange={(v) => setSettings({ ...settings, show_history: v })}
          label="Afficher mon historique"
          description="Mes parties passées sont visibles"
        />
      </div>

      {/* Section: Interactions */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Interactions
        </h2>

        <ToggleSwitch
          checked={settings.allow_invites}
          onChange={(v) => setSettings({ ...settings, allow_invites: v })}
          label="Autoriser les invitations"
          description="Les autres joueurs peuvent t'inviter à des parties"
        />
      </div>

      {/* Info RGPD */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0369a1', marginBottom: 4 }}>
              Tes données te appartiennent
            </div>
            <div style={{ fontSize: 13, color: '#0c4a6e' }}>
              Conformément au RGPD, tu peux demander l'export ou la suppression de tes données à tout moment. Contacte-nous à privacy@padelmatch.app
            </div>
          </div>
        </div>
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

      {/* Zone danger */}
      <div style={{
        background: '#fef2f2',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        border: '1px solid #fecaca'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', margin: '0 0 12px' }}>
          ⚠️ Zone dangereuse
        </h2>
        <p style={{ fontSize: 13, color: '#7f1d1d', marginBottom: 16 }}>
          Ces actions sont irréversibles.
        </p>
        <button
          onClick={() => {
            if (confirm('Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.')) {
              // TODO: Implémenter la suppression
              alert('Contacte-nous à support@padelmatch.app pour supprimer ton compte.')
            }
          }}
          style={{
            padding: '12px 20px',
            background: '#fff',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  )
}