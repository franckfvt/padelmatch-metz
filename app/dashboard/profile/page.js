'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)

    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
    setEditData({
      name: data?.name || '',
      level: data?.level || 5,
      position: data?.position || 'both',
      lydia_username: data?.lydia_username || '',
      paypal_email: data?.paypal_email || ''
    })
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({
      name: editData.name,
      level: editData.level,
      position: editData.position,
      lydia_username: editData.lydia_username || null,
      paypal_email: editData.paypal_email || null
    }).eq('id', user.id)
    await loadData()
    setEditing(false)
    setSaving(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/player/${profile?.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 40 }}>👤</div><div style={{ color: '#666', marginTop: 16 }}>Chargement...</div></div>
  }

  const winRate = profile?.matches_played > 0 ? Math.round((profile.matches_won / profile.matches_played) * 100) : 0
  const positionLabels = { left: '⬅️ Gauche', right: '➡️ Droite', both: '↔️ Les deux' }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>

      {/* === CARTE PROFIL === */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)', borderRadius: 20, padding: 28, color: '#fff', marginBottom: 32 }}>
        
        {/* Header carte */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎾</span>
            <span style={{ fontSize: 13, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 6, fontSize: 12 }}>
            ✓ {profile?.reliability_score || 100}% fiable
          </div>
        </div>

        {/* Avatar + Nom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4ade80, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: '700' }}>
              {profile?.name?.[0]}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>{profile?.name}</h1>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>

        {/* Badges infos */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ background: '#fbbf24', color: '#1a1a1a', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: '700' }}>
            ⭐ {profile?.level || '?'}/10
          </span>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 8, fontSize: 14 }}>
            {positionLabels[profile?.position] || '↔️ Les deux'}
          </span>
          {profile?.current_streak > 0 && (
            <span style={{ background: '#ef4444', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: '600' }}>
              🔥 {profile.current_streak} victoires
            </span>
          )}
        </div>
      </div>

      {/* === STATS RAPIDES === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>{profile?.matches_played || 0}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Parties</div>
        </div>
        <div style={{ background: '#dcfce7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#166534' }}>{profile?.matches_won || 0}</div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Victoires</div>
        </div>
        <div style={{ background: '#fef3c7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#92400e' }}>{winRate}%</div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>Win rate</div>
        </div>
      </div>

      {/* === PARTAGE === */}
      <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 32 }}>
        <div style={{ fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 8 }}>💡 Partage ton profil</div>
        <div style={{ fontSize: 13, color: '#1e40af', opacity: 0.8, marginBottom: 12 }}>
          Colle ton lien dans les groupes Facebook au lieu de commenter "Moi !"
        </div>
        <button onClick={copyLink} style={{ width: '100%', padding: 12, background: copied ? '#dcfce7' : '#fff', color: copied ? '#166534' : '#1e40af', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: '600', cursor: 'pointer' }}>
          {copied ? '✓ Lien copié !' : '📋 Copier mon lien'}
        </button>
      </div>

      {/* === PAIEMENT === */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>💰 Paiement</div>
        
        {(profile?.lydia_username || profile?.paypal_email) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profile?.lydia_username && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#faf5ff', borderRadius: 8 }}>
                <span>📱</span>
                <span style={{ fontSize: 14 }}>Lydia: <strong>@{profile.lydia_username}</strong></span>
              </div>
            )}
            {profile?.paypal_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#eff6ff', borderRadius: 8 }}>
                <span>💳</span>
                <span style={{ fontSize: 14 }}>PayPal: <strong>{profile.paypal_email}</strong></span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
            <div style={{ fontSize: 13 }}>Configure tes infos de paiement pour faciliter les remboursements</div>
          </div>
        )}
      </div>

      {/* === ACTIONS === */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => setEditing(true)} style={{ padding: 14, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
          ✏️ Modifier mon profil
        </button>
        <button onClick={logout} style={{ padding: 14, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
          Se déconnecter
        </button>
      </div>

      {/* === MODAL ÉDITION === */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>Modifier mon profil</h2>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            {/* Prénom */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Prénom</label>
              <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={inputStyle} />
            </div>

            {/* Niveau */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Niveau</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => setEditData({...editData, level: n})} style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${editData.level === n ? '#1a1a1a' : '#eee'}`, background: editData.level === n ? '#1a1a1a' : '#fff', color: editData.level === n ? '#fff' : '#666', fontSize: 14, fontWeight: '600', cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Position</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{id: 'left', label: '⬅️ Gauche'}, {id: 'right', label: '➡️ Droite'}, {id: 'both', label: '↔️ Les 2'}].map(p => (
                  <button key={p.id} type="button" onClick={() => setEditData({...editData, position: p.id})} style={{ flex: 1, padding: 12, borderRadius: 8, border: `2px solid ${editData.position === p.id ? '#1a1a1a' : '#eee'}`, background: editData.position === p.id ? '#1a1a1a' : '#fff', color: editData.position === p.id ? '#fff' : '#666', fontSize: 13, fontWeight: '500', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lydia */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>📱 Pseudo Lydia <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>@</span>
                <input type="text" value={editData.lydia_username} onChange={e => setEditData({...editData, lydia_username: e.target.value})} placeholder="ton-pseudo" style={{...inputStyle, paddingLeft: 28}} />
              </div>
            </div>

            {/* PayPal */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>💳 Email PayPal <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span></label>
              <input type="email" value={editData.paypal_email} onChange={e => setEditData({...editData, paypal_email: e.target.value})} placeholder="ton@email.com" style={inputStyle} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 14, background: '#f5f5f5', color: '#666', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: 14, background: saving ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: '600', cursor: 'pointer' }}>
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: '2px solid #eee',
  fontSize: 15,
  boxSizing: 'border-box'
}