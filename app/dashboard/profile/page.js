'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('card')
  const [copied, setCopied] = useState(false)

  const [editData, setEditData] = useState({
    name: '',
    level: '',
    position: '',
    experience: '',
    frequency: '',
    ambiance: '',
    region: '',
    lydia_username: '',
    paypal_email: '',
    rib: ''
  })

  const levelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const positionOptions = [
    { id: 'right', label: 'Droite', emoji: '👉' },
    { id: 'left', label: 'Gauche', emoji: '👈' },
    { id: 'both', label: 'Polyvalent', emoji: '↔️' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: '1-2x/mois', emoji: '🗓️' },
    { id: 'regular', label: '1x/sem', emoji: '📅' },
    { id: 'often', label: '2-3x/sem', emoji: '🔥' },
    { id: 'intense', label: '4x+/sem', emoji: '⚡' }
  ]

  const regionOptions = [
    'Île-de-France', 'Hauts-de-France', 'Grand Est', 'Normandie', 'Bretagne',
    'Pays de la Loire', 'Centre-Val de Loire', 'Bourgogne-F.-Comté', 'Nouvelle-Aquitaine',
    'Occitanie', 'Auvergne-Rhône-Alpes', 'PACA', 'Corse'
  ]

  const experienceOptions = [
    { id: 'less6months', label: 'Débutant', emoji: '🌱' },
    { id: '6months2years', label: 'Intermédiaire', emoji: '📈' },
    { id: '2to5years', label: 'Confirmé', emoji: '💪' },
    { id: 'more5years', label: 'Expert', emoji: '🏆' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆' }
  ]

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  const experienceEmojis = {
    'less6months': '🌱',
    '6months2years': '📈',
    '2to5years': '💪',
    'more5years': '🏆'
  }

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
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
        experience: profileData?.experience || '',
        frequency: profileData?.frequency || '',
        ambiance: profileData?.ambiance || '',
        region: profileData?.region || '',
        lydia_username: profileData?.lydia_username || '',
        paypal_email: profileData?.paypal_email || '',
        rib: profileData?.rib || ''
      })

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*, clubs (name)')
        .or(`organizer_id.eq.${session.user.id},team_a.cs.{${session.user.id}},team_b.cs.{${session.user.id}}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(10)

      setRecentMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
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
          experience: editData.experience || null,
          frequency: editData.frequency || null,
          ambiance: editData.ambiance || null,
          region: editData.region || null,
          lydia_username: editData.lydia_username || null,
          paypal_email: editData.paypal_email || null,
          rib: editData.rib || null
        })
        .eq('id', user.id)

      if (error) throw error

      loadData()
      alert('Profil mis à jour !')

    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getWinRate() {
    if (!profile?.matches_played || profile.matches_played === 0) return 0
    return Math.round((profile.matches_won || 0) / profile.matches_played * 100)
  }

  function didIWin(match) {
    if (!match.winner) return null
    const winningTeam = match.winner === 'team_a' ? match.team_a : match.team_b
    return winningTeam?.includes(user?.id)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>👤</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header Profil */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 32,
        marginBottom: 24,
        border: '1px solid #eee',
        textAlign: 'center'
      }}>
        <div style={{
          width: 100,
          height: 100,
          background: '#f5f5f5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          margin: '0 auto 20px'
        }}>
          👤
        </div>
        <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          {profile?.name}
        </h1>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {profile?.level && (
            <span style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: '500'
            }}>
              ⭐ Niveau {profile.level}
            </span>
          )}
          {profile?.experience && (
            <span style={{
              background: '#f5f5f5',
              color: '#666',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: '500'
            }}>
              {experienceEmojis[profile.experience]} {experienceLabels[profile.experience]}
            </span>
          )}
          {profile?.ambiance && (
            <span style={{
              background: profile.ambiance === 'compet' ? '#fef3c7' : 
                         profile.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
              color: profile.ambiance === 'compet' ? '#92400e' : 
                     profile.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: '500'
            }}>
              {ambianceEmojis[profile.ambiance]} {ambianceLabels[profile.ambiance]}
            </span>
          )}
        </div>
        <div style={{ color: '#2e7d32', fontWeight: '600', fontSize: 15 }}>
          ⭐ {profile?.reliability_score || 100}% fiable
        </div>
      </div>

      {/* Stats principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 24
      }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>{profile?.matches_played || 0}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Parties</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#2e7d32' }}>{profile?.matches_won || 0}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Victoires</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #eee' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>{getWinRate()}%</div>
          <div style={{ fontSize: 12, color: '#666' }}>Win rate</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center', border: profile?.current_streak > 0 ? '2px solid #f59e0b' : '1px solid #eee' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#f59e0b' }}>🔥 {profile?.current_streak || 0}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Série</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24
      }}>
        {[
          { id: 'card', label: '🎴 Carte' },
          { id: 'stats', label: '📊 Stats' },
          { id: 'edit', label: '✏️ Modifier' },
          { id: 'payment', label: '💰 Paiement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : '#666',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Carte */}
      {activeTab === 'card' && (
        <div style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
              Ta carte joueur
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Partage-la sur Facebook pour trouver des partenaires !
            </p>
          </div>

          <PlayerCard 
            player={{
              name: profile?.name,
              level: profile?.level,
              position: profile?.position,
              ambiance: profile?.ambiance,
              frequency: profile?.frequency,
              experience: profile?.experience,
              region: profile?.region,
              avatar_url: profile?.avatar_url
            }} 
            standalone 
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={copyProfileLink}
              style={{
                flex: 1,
                padding: '14px',
                background: copied ? '#22c55e' : '#1877f2',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>
          </div>

          {(!profile?.level || !profile?.position || !profile?.region) && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 12,
              textAlign: 'center'
            }}>
              <p style={{ color: '#f59e0b', fontSize: 14, marginBottom: 8 }}>
                ⚠️ Complète ton profil pour une carte plus complète !
              </p>
              <button
                onClick={() => setActiveTab('edit')}
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Compléter mon profil
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Stats */}
      {activeTab === 'stats' && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 20 }}>
            Historique des parties
          </h2>
          {recentMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
              <p>Aucune partie terminée</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {recentMatches.map(match => {
                const won = didIWin(match)
                return (
                  <Link href={`/dashboard/match/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 12
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                          {match.clubs?.name || 'Club'}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>
                          {new Date(match.match_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        background: won === true ? '#e8f5e9' : won === false ? '#fef2f2' : '#f5f5f5',
                        color: won === true ? '#2e7d32' : won === false ? '#dc2626' : '#666',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: '600'
                      }}>
                        {won === true ? '🏆 Victoire' : won === false ? 'Défaite' : 'En cours'}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Modifier */}
      {activeTab === 'edit' && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Prénom
              </label>
              <input
                type="text"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Niveau (1-10)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {levelOptions.map(lvl => (
                  <div
                    key={lvl}
                    onClick={() => setEditData({ ...editData, level: lvl.toString() })}
                    style={{
                      padding: '12px',
                      border: editData.level === lvl.toString() ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: editData.level === lvl.toString() ? '#e8f5e9' : '#fff',
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: '700'
                    }}
                  >
                    {lvl}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Poste
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {positionOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, position: opt.id })}
                    style={{
                      padding: '12px 8px',
                      border: editData.position === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: editData.position === opt.id ? '#e8f5e9' : '#fff',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Ambiance
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {ambianceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, ambiance: opt.id })}
                    style={{
                      padding: '12px 8px',
                      border: editData.ambiance === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: editData.ambiance === opt.id ? '#e8f5e9' : '#fff',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Fréquence de jeu
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {frequencyOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, frequency: opt.id })}
                    style={{
                      padding: '10px 6px',
                      border: editData.frequency === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: editData.frequency === opt.id ? '#e8f5e9' : '#fff',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: '600' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Expérience
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {experienceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, experience: opt.id })}
                    style={{
                      padding: '12px',
                      border: editData.experience === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: editData.experience === opt.id ? '#e8f5e9' : '#fff',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: '600' }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                Région
              </label>
              <select
                value={editData.region}
                onChange={e => setEditData({ ...editData, region: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  boxSizing: 'border-box',
                  background: '#fff'
                }}
              >
                <option value="">Sélectionne ta région</option>
                {regionOptions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '18px',
                background: saving ? '#e5e5e5' : '#1a1a1a',
                color: saving ? '#999' : '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Paiement */}
      {activeTab === 'payment' && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
            Configure tes moyens de paiement pour que les autres joueurs puissent te payer facilement.
          </p>

          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                🔵 Lydia (username)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>@</span>
                <input
                  type="text"
                  value={editData.lydia_username}
                  onChange={e => setEditData({ ...editData, lydia_username: e.target.value })}
                  placeholder="ton-username"
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 36px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                🔵 PayPal (email)
              </label>
              <input
                type="email"
                value={editData.paypal_email}
                onChange={e => setEditData({ ...editData, paypal_email: e.target.value })}
                placeholder="ton@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                🏦 RIB / IBAN
              </label>
              <input
                type="text"
                value={editData.rib}
                onChange={e => setEditData({ ...editData, rib: e.target.value })}
                placeholder="FR76 3000 4000 ..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '18px',
                background: saving ? '#e5e5e5' : '#1a1a1a',
                color: saving ? '#999' : '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      )}

      {/* Déconnexion */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '16px',
          background: '#fff',
          color: '#dc2626',
          border: '1px solid #fecaca',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: 24
        }}
      >
        Se déconnecter
      </button>
    </div>
  )
}