'use client'

/**
 * ============================================
 * PAGE MA CARTE - VERSION UNIFIÉE
 * ============================================
 * 
 * Tout en un :
 * - Carte joueur partageable
 * - Infos profil (modifiables inline)
 * - QR Code
 * - Réglages essentiels
 * - Déconnexion
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// === DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  green: '#22c55e',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  cardDark: '#1a1a1a',
  
  border: '#eae8e4',
  white: '#ffffff',
  
  red: '#ef4444',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

const LEVELS = [
  { value: '1', label: '1 - Débutant' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2 - Initié' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3 - Intermédiaire' },
  { value: '3.5', label: '3.5' },
  { value: '4', label: '4 - Avancé' },
  { value: '4.5', label: '4.5' },
  { value: '5', label: '5 - Expert' },
  { value: '5.5', label: '5.5' },
  { value: '6', label: '6 - Pro' },
]

function getAvatarColor(name) {
  if (!name) return PLAYER_COLORS[0]
  return PLAYER_COLORS[name.charCodeAt(0) % 4]
}

export default function MaCartePage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Stats
  const [stats, setStats] = useState({ totalGames: 0, wins: 0, winRate: 0 })
  
  // Edition
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  
  // Partage
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(profileData)
    setEditForm(profileData || {})

    // Stats
    const { data: gameResults } = await supabase
      .from('game_results')
      .select('result')
      .eq('user_id', session.user.id)

    const games = gameResults || []
    const wins = games.filter(g => g.result === 'win').length
    const total = games.length

    setStats({
      totalGames: total,
      wins,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0
    })

    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          level: editForm.level,
          city: editForm.city,
          bio: editForm.bio
        })
        .eq('id', user.id)

      setProfile({ ...profile, ...editForm })
      setEditing(false)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // === PARTAGE ===
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/player/${user?.id}` : ''

  function getShareText() {
    return `🎾 Mon profil Padel sur 2×2
⭐ Niveau ${profile?.level || '?'}
📍 ${profile?.city || 'France'}
🎯 ${stats.totalGames} parties • ${stats.winRate}% winrate

👉 ${profileUrl}`
  }

  async function handleShare() {
    const text = getShareText()
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} - 2×2`, text, url: profileUrl })
        return
      } catch {}
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="dot-pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: c, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 24 }}>Ma Carte</h1>

      {/* === CARTE VISUELLE === */}
      <div style={{
        background: COLORS.cardDark,
        borderRadius: 24,
        padding: 28,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Fond décoratif */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: COLORS.p1,
          opacity: 0.1
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: COLORS.p3,
          opacity: 0.1
        }} />

        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Avatar + Nom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: 20,
              background: profile?.avatar_url ? 'transparent' : getAvatarColor(profile?.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.white,
              overflow: 'hidden'
            }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.white }}>{profile?.name || 'Joueur'}</div>
              {profile?.city && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>📍 {profile.city}</div>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white }}>{profile?.level || '?'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Niveau</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white }}>{stats.totalGames}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Parties</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>{stats.winRate}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Winrate</div>
            </div>
          </div>

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {PLAYER_COLORS.map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Actions partage */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <button onClick={handleShare} style={{
          flex: 1,
          padding: '14px',
          background: '#25D366',
          color: COLORS.white,
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer'
        }}>
          📱 Partager
        </button>
        <button onClick={copyLink} style={{
          flex: 1,
          padding: '14px',
          background: COLORS.card,
          color: COLORS.ink,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer'
        }}>
          {copied ? '✅ Copié !' : '📋 Copier lien'}
        </button>
        <button onClick={() => setShowQR(!showQR)} style={{
          padding: '14px 18px',
          background: COLORS.bgSoft,
          color: COLORS.ink,
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          cursor: 'pointer'
        }}>
          📷
        </button>
      </div>

      {/* QR Code */}
      {showQR && (
        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          padding: 24, 
          textAlign: 'center',
          marginBottom: 32,
          border: `1px solid ${COLORS.border}`
        }}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(profileUrl)}`}
            alt="QR Code"
            style={{ marginBottom: 12 }}
          />
          <div style={{ fontSize: 12, color: COLORS.gray }}>Scanne pour voir mon profil</div>
        </div>
      )}

      {/* === SECTION PROFIL === */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>👤 Mon profil</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              padding: '8px 14px',
              background: COLORS.bgSoft,
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.gray,
              cursor: 'pointer'
            }}>
              Modifier
            </button>
          )}
        </div>

        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden'
        }}>
          {/* Nom */}
          <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Nom</label>
            {editing ? (
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: 8, 
                  fontSize: 15 
                }}
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{profile?.name || '-'}</div>
            )}
          </div>

          {/* Niveau */}
          <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Niveau</label>
            {editing ? (
              <select
                value={editForm.level || ''}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: 8, 
                  fontSize: 15,
                  background: COLORS.white
                }}
              >
                <option value="">Sélectionner</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>
                {profile?.level ? `Niveau ${profile.level}` : '-'}
              </div>
            )}
          </div>

          {/* Ville */}
          <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Ville</label>
            {editing ? (
              <input
                type="text"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="Ex: Paris, Lyon..."
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: 8, 
                  fontSize: 15 
                }}
              />
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{profile?.city || '-'}</div>
            )}
          </div>

          {/* Bio */}
          <div style={{ padding: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>Bio</label>
            {editing ? (
              <textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Quelques mots sur toi..."
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: 8, 
                  fontSize: 15,
                  resize: 'none'
                }}
              />
            ) : (
              <div style={{ fontSize: 15, color: profile?.bio ? COLORS.ink : COLORS.muted }}>
                {profile?.bio || 'Pas encore de bio'}
              </div>
            )}
          </div>

          {/* Boutons édition */}
          {editing && (
            <div style={{ padding: 16, display: 'flex', gap: 10, borderTop: `1px solid ${COLORS.border}` }}>
              <button onClick={() => { setEditing(false); setEditForm(profile) }} style={{
                flex: 1,
                padding: 12,
                background: COLORS.bgSoft,
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.gray,
                cursor: 'pointer'
              }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1,
                padding: 12,
                background: COLORS.ink,
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.white,
                cursor: 'pointer'
              }}>
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* === SECTION RÉGLAGES === */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>⚙️ Réglages</h2>
        
        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden'
        }}>
          {/* Email */}
          <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 14, color: COLORS.gray }}>{user?.email}</div>
          </div>

          {/* Notifications - simplifié */}
          <div style={{ 
            padding: 16, 
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>Notifications</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Invitations et rappels</div>
            </div>
            <div style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              background: COLORS.green,
              position: 'relative',
              cursor: 'pointer'
            }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: COLORS.white,
                position: 'absolute',
                top: 2,
                right: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }} />
            </div>
          </div>

          {/* Aide */}
          <a href="mailto:support@2x2.app" style={{ 
            padding: 16, 
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            borderBottom: `1px solid ${COLORS.border}`
          }}>
            <span style={{ fontSize: 18 }}>❓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>Aide & Contact</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Une question ? Écris-nous</div>
            </div>
            <span style={{ color: COLORS.muted }}>→</span>
          </a>

          {/* Déconnexion */}
          <button onClick={handleLogout} style={{
            width: '100%',
            padding: 16,
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer'
          }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.red }}>Déconnexion</span>
          </button>
        </div>
      </section>

      {/* Version */}
      <div style={{ textAlign: 'center', color: COLORS.muted, fontSize: 12, marginBottom: 24 }}>
        2×2 v1.0 • Fait avec 🎾 pour le padel
      </div>

      <style jsx global>{`
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${COLORS.ink} !important;
        }
        .dot-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}