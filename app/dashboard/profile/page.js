'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('card')
  const [copied, setCopied] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [editData, setEditData] = useState({
    name: '',
    level: '',
    position: '',
    lydia_username: '',
    paypal_email: ''
  })

  const positionLabels = {
    'left': 'Gauche',
    'right': 'Droite',
    'both': 'Les deux'
  }

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

      setProfile(profileData)
      setEditData({
        name: profileData?.name || '',
        level: profileData?.level?.toString() || '',
        position: profileData?.position || '',
        lydia_username: profileData?.lydia_username || '',
        paypal_email: profileData?.paypal_email || ''
      })

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          level: editData.level ? parseInt(editData.level) : null,
          position: editData.position || null,
          lydia_username: editData.lydia_username || null,
          paypal_email: editData.paypal_email || null
        })
        .eq('id', user.id)

      if (error) throw error

      await loadData()
      setShowEditModal(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getWinRate() {
    if (!profile?.matches_played || profile.matches_played === 0) return 0
    return Math.round((profile.matches_won / profile.matches_played) * 100)
  }

  function getReliabilityScore() {
    return profile?.reliability_score || 100
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>👤</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>
      
      {/* === BANDEAU PARTAGE (TOUJOURS VISIBLE) === */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        color: '#fff'
      }}>
        <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          💡 Fais-toi remarquer sur Facebook !
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
          Au lieu de commenter "Moi !", colle ton lien. Les orgas verront ton niveau et tes stats !
        </div>
        <button
          onClick={copyProfileLink}
          style={{
            width: '100%',
            padding: 12,
            background: copied ? '#dcfce7' : '#fff',
            color: copied ? '#166534' : '#1e40af',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          {copied ? '✓ Lien copié !' : '📋 Copier mon lien PadelMatch'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20
      }}>
        {[
          { id: 'card', label: '🪪 Ma carte' },
          { id: 'stats', label: '📊 Stats' },
          { id: 'settings', label: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : '#666',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: CARTE === */}
      {activeTab === 'card' && (
        <div>
          {/* La carte */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
            borderRadius: 20,
            padding: 24,
            color: '#fff',
            marginBottom: 16
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎾</span>
                <span style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>PADELMATCH</span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12
              }}>
                ✅ {getReliabilityScore()}% fiable
              </div>
            </div>

            {/* Nom et niveau */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ 
                fontSize: 28, 
                fontWeight: '700', 
                margin: '0 0 8px',
                letterSpacing: '-0.5px'
              }}>
                {profile?.name}
              </h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile?.level && (
                  <span style={{
                    background: '#fbbf24',
                    color: '#1a1a1a',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '700'
                  }}>
                    ⭐ {profile.level}/10
                  </span>
                )}
                {profile?.position && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '500'
                  }}>
                    🎾 {positionLabels[profile.position] || profile.position}
                  </span>
                )}
              </div>
            </div>

            {/* Stats mini */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: '700' }}>{profile?.matches_played || 0}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>parties</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: '700' }}>{getWinRate()}%</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>victoires</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: '700', color: '#fbbf24' }}>
                  🔥{profile?.current_streak || 0}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>série</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <button
              onClick={copyProfileLink}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copié !' : '📋 Copier le lien'}
            </button>
            <Link
              href={`/player/${profile?.id}`}
              target="_blank"
              style={{
                padding: '14px 20px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              👁️ Voir
            </Link>
          </div>
          
          {/* Télécharger la carte */}
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/og/card/${profile?.id}`)
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `padelmatch-${profile?.name?.toLowerCase().replace(/\s+/g, '-')}.png`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Download error:', error)
                alert('Erreur lors du téléchargement')
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#f5f5f5',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            📥 Télécharger ma carte (pour stories)
          </button>

          {/* Exemple d'utilisation */}
          <div style={{
            background: '#f9fafb',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
              📘 Comment l'utiliser sur Facebook ?
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              1. Trouve un post "Cherche joueurs"<br/>
              2. Au lieu de "Moi !", colle ton lien<br/>
              3. L'orga voit ton profil complet 👍
            </div>
          </div>
        </div>
      )}

      {/* === TAB: STATS === */}
      {activeTab === 'stats' && (
        <div>
          {/* Stats principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a' }}>
                {profile?.matches_played || 0}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>Parties jouées</div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 32, fontWeight: '700', color: '#16a34a' }}>
                {profile?.matches_won || 0}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>Victoires</div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a' }}>
                {getWinRate()}%
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>Win rate</div>
            </div>
            <div style={{
              background: profile?.current_streak > 0 ? '#fef3c7' : '#fff',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              border: profile?.current_streak > 0 ? '2px solid #fbbf24' : '1px solid #eee'
            }}>
              <div style={{ fontSize: 32, fontWeight: '700', color: '#f59e0b' }}>
                🔥 {profile?.current_streak || 0}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>Série actuelle</div>
            </div>
          </div>

          {/* Meilleure série */}
          {profile?.best_streak > 0 && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 16,
              border: '1px solid #eee',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666' }}>Meilleure série</span>
              <span style={{ fontWeight: '700', color: '#f59e0b' }}>
                🏆 {profile.best_streak} victoires
              </span>
            </div>
          )}

          {/* Message si pas de parties */}
          {(!profile?.matches_played || profile.matches_played === 0) && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <p style={{ color: '#666', margin: 0 }}>
                Tes stats apparaîtront après ta première partie !
              </p>
            </div>
          )}

          {/* Fiabilité */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #eee',
            marginTop: 12
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12
            }}>
              <span style={{ fontSize: 14, fontWeight: '600' }}>Score de fiabilité</span>
              <span style={{ 
                fontSize: 18, 
                fontWeight: '700',
                color: getReliabilityScore() >= 80 ? '#16a34a' : '#f59e0b'
              }}>
                {getReliabilityScore()}%
              </span>
            </div>
            <div style={{
              background: '#f5f5f5',
              borderRadius: 8,
              height: 8,
              overflow: 'hidden'
            }}>
              <div style={{
                background: getReliabilityScore() >= 80 ? '#16a34a' : '#f59e0b',
                height: '100%',
                width: `${getReliabilityScore()}%`,
                borderRadius: 8
              }} />
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 8, marginBottom: 0 }}>
              Les joueurs fiables sont plus souvent invités
            </p>
          </div>
        </div>
      )}

      {/* === TAB: RÉGLAGES === */}
      {activeTab === 'settings' && (
        <div>
          {/* Infos profil */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #eee',
            marginBottom: 16
          }}>
            <h3 style={{ fontSize: 15, fontWeight: '600', margin: '0 0 16px' }}>
              Mon profil
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Nom</span>
                <span style={{ fontWeight: '500' }}>{profile?.name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Niveau</span>
                <span style={{ fontWeight: '500' }}>{profile?.level ? `${profile.level}/10` : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Position</span>
                <span style={{ fontWeight: '500' }}>
                  {profile?.position ? positionLabels[profile.position] : '-'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '12px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Modifier
            </button>
          </div>

          {/* Moyens de paiement */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #eee',
            marginBottom: 16
          }}>
            <h3 style={{ fontSize: 15, fontWeight: '600', margin: '0 0 8px' }}>
              💰 Mes moyens de paiement
            </h3>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
              Pour recevoir l'argent quand tu organises
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>💜 Lydia</span>
                <span style={{ fontWeight: '500' }}>
                  {profile?.lydia_username ? `@${profile.lydia_username}` : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>💙 PayPal</span>
                <span style={{ fontWeight: '500', fontSize: 13 }}>{profile?.paypal_email || '-'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '12px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✏️ Configurer
            </button>
          </div>

          {/* Liens secondaires */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 16
          }}>
            <Link
              href="/dashboard/groups"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #eee',
                textDecoration: 'none',
                color: '#1a1a1a'
              }}
            >
              <span>👥 Mes groupes</span>
              <span style={{ color: '#999' }}>→</span>
            </Link>
            <Link
              href="/dashboard/polls"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #eee',
                textDecoration: 'none',
                color: '#1a1a1a'
              }}
            >
              <span>📊 Sondages de dispo</span>
              <span style={{ color: '#999' }}>→</span>
            </Link>
          </div>

          {/* Déconnexion */}
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '14px',
              background: '#fff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Se déconnecter
          </button>
        </div>
      )}

      {/* === MODAL ÉDITION === */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 20px' }}>
              ✏️ Modifier mon profil
            </h2>

            <form onSubmit={saveProfile}>
              {/* Nom */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                  required
                />
              </div>

              {/* Niveau */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Niveau (1-10)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEditData({ ...editData, level: level.toString() })}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: '2px solid',
                        borderColor: editData.level === level.toString() ? '#1a1a1a' : '#eee',
                        background: editData.level === level.toString() ? '#1a1a1a' : '#fff',
                        color: editData.level === level.toString() ? '#fff' : '#666',
                        fontSize: 14,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Position préférée
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'left', label: '⬅️ Gauche' },
                    { id: 'right', label: '➡️ Droite' },
                    { id: 'both', label: '↔️ Les deux' }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setEditData({ ...editData, position: pos.id })}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: 8,
                        border: '2px solid',
                        borderColor: editData.position === pos.id ? '#1a1a1a' : '#eee',
                        background: editData.position === pos.id ? '#1a1a1a' : '#fff',
                        color: editData.position === pos.id ? '#fff' : '#666',
                        fontSize: 12,
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lydia */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  💜 Pseudo Lydia <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }}>@</span>
                  <input
                    type="text"
                    value={editData.lydia_username}
                    onChange={(e) => setEditData({ ...editData, lydia_username: e.target.value })}
                    placeholder="ton-pseudo"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 28px',
                      borderRadius: 10,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                  />
                </div>
              </div>

              {/* PayPal */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  💙 Email PayPal <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={editData.paypal_email}
                  onChange={(e) => setEditData({ ...editData, paypal_email: e.target.value })}
                  placeholder="ton@email.com"
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                />
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: saving ? '#ccc' : '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}