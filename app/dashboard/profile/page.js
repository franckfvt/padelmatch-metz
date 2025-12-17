'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    matchesOrganized: 0,
    reliability: 100
  })
  const [favorites, setFavorites] = useState([])
  const [recentPlayers, setRecentPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Données éditables
  const [editData, setEditData] = useState({
    name: '',
    experience: '',
    frequency: '',
    ambiance: '',
    bio: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // User
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)
      setEditData({
        name: profileData?.name || '',
        experience: profileData?.experience || '',
        frequency: profileData?.frequency || '',
        ambiance: profileData?.ambiance || '',
        bio: profileData?.bio || ''
      })

      // Stats - Parties jouées
      const { data: participations } = await supabase
        .from('match_participants')
        .select('id')
        .eq('user_id', session.user.id)

      // Stats - Parties organisées
      const { data: organized } = await supabase
        .from('matches')
        .select('id')
        .eq('organizer_id', session.user.id)

      setStats({
        matchesPlayed: (participations?.length || 0) + (organized?.length || 0),
        matchesOrganized: organized?.length || 0,
        reliability: profileData?.reliability_score || 100
      })

      // Favoris
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          id,
          favorite_user_id,
          profiles!favorites_favorite_user_id_fkey (
            id, name, experience, ambiance
          )
        `)
        .eq('user_id', session.user.id)

      setFavorites(favoritesData || [])

      // Joueurs récents (via les parties)
      const { data: recentMatches } = await supabase
        .from('match_participants')
        .select(`
          match_id,
          matches (
            id,
            match_participants (
              user_id,
              profiles (id, name, experience, ambiance)
            )
          )
        `)
        .eq('user_id', session.user.id)
        .limit(10)

      // Extraire les joueurs uniques
      const playersMap = new Map()
      recentMatches?.forEach(mp => {
        mp.matches?.match_participants?.forEach(p => {
          if (p.user_id !== session.user.id && p.profiles) {
            playersMap.set(p.user_id, p.profiles)
          }
        })
      })
      setRecentPlayers(Array.from(playersMap.values()).slice(0, 6))

      setLoading(false)
    } catch (error) {
      console.error('Error loading profile:', error)
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          experience: editData.experience,
          frequency: editData.frequency,
          ambiance: editData.ambiance,
          bio: editData.bio
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...editData })
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function addFavorite(userId) {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          favorite_user_id: userId
        })

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

  async function removeFavorite(favoriteId) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Labels pour l'affichage
  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  const frequencyLabels = {
    'occasional': '1-2x/mois',
    'regular': '1x/semaine',
    'often': '2-3x/semaine',
    'intense': '4x+/semaine'
  }

  const ambianceLabels = {
    'loisir': '😎 Détente',
    'mix': '⚡ Équilibré',
    'compet': '🏆 Compétitif'
  }

  const experienceOptions = [
    { id: 'less6months', label: 'Moins de 6 mois' },
    { id: '6months2years', label: '6 mois - 2 ans' },
    { id: '2to5years', label: '2 - 5 ans' },
    { id: 'more5years', label: 'Plus de 5 ans' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: 'Occasionnel' },
    { id: 'regular', label: 'Régulier' },
    { id: 'often', label: 'Souvent' },
    { id: 'intense', label: 'Intense' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: '😎 Détente' },
    { id: 'mix', label: '⚡ Équilibré' },
    { id: 'compet', label: '🏆 Compétitif' }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>👤</div>
        <div style={{ color: '#666' }}>Chargement du profil...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      
      {/* En-tête profil */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 32,
        marginBottom: 24,
        border: '1px solid #eee',
        textAlign: 'center'
      }}>
        {/* Avatar */}
        <div style={{
          width: 100,
          height: 100,
          background: '#f5f5f5',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          margin: '0 auto 20px'
        }}>
          👤
        </div>

        {/* Nom */}
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: 4
        }}>
          {profile?.name || 'Joueur'}
        </h1>
        
        {/* Email */}
        <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
          {user?.email}
        </p>

        {/* Tags profil */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 24
        }}>
          {profile?.experience && (
            <span style={{
              background: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600',
              color: '#666'
            }}>
              🎾 {experienceLabels[profile.experience] || profile.experience}
            </span>
          )}
          {profile?.ambiance && (
            <span style={{
              background: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600',
              color: '#666'
            }}>
              {ambianceLabels[profile.ambiance] || profile.ambiance}
            </span>
          )}
          {profile?.frequency && (
            <span style={{
              background: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600',
              color: '#666'
            }}>
              📅 {frequencyLabels[profile.frequency] || profile.frequency}
            </span>
          )}
        </div>

        {/* Bouton modifier */}
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '12px 24px',
            background: '#f5f5f5',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ✏️ Modifier mon profil
        </button>
      </div>

      {/* Stats */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #eee'
      }}>
        <h2 style={{ 
          fontSize: 18, 
          fontWeight: '700',
          marginBottom: 20,
          color: '#1a1a1a'
        }}>
          Statistiques
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 32, 
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: 4
            }}>
              {stats.matchesPlayed}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              Parties jouées
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 32, 
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: 4
            }}>
              {stats.matchesOrganized}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              Parties organisées
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 32, 
              fontWeight: '700',
              color: '#2e7d32',
              marginBottom: 4
            }}>
              {stats.reliability}%
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              Fiabilité
            </div>
          </div>
        </div>
      </div>

      {/* Favoris */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #eee'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            ⭐ Joueurs favoris
          </h2>
          <span style={{ fontSize: 14, color: '#999' }}>
            {favorites.length} favori{favorites.length > 1 ? 's' : ''}
          </span>
        </div>

        {favorites.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '24px 0',
            color: '#999'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <p style={{ fontSize: 14 }}>
              Aucun favori pour l'instant
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Ajoute des joueurs après une partie !
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {favorites.map(fav => (
              <div
                key={fav.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    background: '#e5e5e5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                      {fav.profiles?.name || 'Joueur'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {experienceLabels[fav.profiles?.experience] || 'Niveau inconnu'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(fav.id)}
                  style={{
                    padding: '8px 12px',
                    background: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#999',
                    cursor: 'pointer'
                  }}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Joueurs récents */}
      {recentPlayers.length > 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #eee'
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: '700',
            marginBottom: 20,
            color: '#1a1a1a'
          }}>
            🕐 Joué récemment avec
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {recentPlayers.map(player => {
              const isFavorite = favorites.some(f => f.favorite_user_id === player.id)
              
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      background: '#e5e5e5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {experienceLabels[player.experience] || 'Niveau inconnu'}
                      </div>
                    </div>
                  </div>
                  {!isFavorite ? (
                    <button
                      onClick={() => addFavorite(player.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#1a1a1a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      + Favori
                    </button>
                  ) : (
                    <span style={{
                      padding: '8px 12px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      ⭐ Favori
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Déconnexion */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #eee'
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px',
            background: '#fff',
            color: '#dc2626',
            border: '2px solid #fecaca',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Se déconnecter
        </button>
      </div>

      {/* Modal Édition */}
      {editing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>
                Modifier mon profil
              </h2>
              <button
                onClick={() => setEditing(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* Prénom */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
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

            {/* Expérience */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
                Expérience
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {experienceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, experience: opt.id })}
                    style={{
                      padding: '12px 16px',
                      border: editData.experience === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: editData.experience === opt.id ? '600' : '400',
                      textAlign: 'center',
                      background: editData.experience === opt.id ? '#fafafa' : '#fff'
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Fréquence */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
                Fréquence
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {frequencyOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, frequency: opt.id })}
                    style={{
                      padding: '12px 16px',
                      border: editData.frequency === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: editData.frequency === opt.id ? '600' : '400',
                      textAlign: 'center',
                      background: editData.frequency === opt.id ? '#fafafa' : '#fff'
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Ambiance */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
                Ambiance recherchée
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ambianceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setEditData({ ...editData, ambiance: opt.id })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: editData.ambiance === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: editData.ambiance === opt.id ? '600' : '400',
                      textAlign: 'center',
                      background: editData.ambiance === opt.id ? '#fafafa' : '#fff'
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
                Bio (optionnel)
              </label>
              <textarea
                value={editData.bio}
                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Quelques mots sur toi..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#f5f5f5',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: saving ? '#e5e5e5' : '#1a1a1a',
                  color: saving ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}