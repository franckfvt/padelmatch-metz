'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardHome() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal créer partie
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    spots: 3,
    ambiance: 'mix'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // User
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      setUser(session.user)

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)

      // Clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')
      
      setClubs(clubsData || [])

      // Matches à venir
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (
            user_id,
            profiles (name)
          )
        `)
        .eq('status', 'open')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true })
        .limit(10)

      setMatches(matchesData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function createMatch() {
    if (!newMatch.club_id || !newMatch.date || !newMatch.time) {
      alert('Remplis tous les champs')
      return
    }

    setCreating(true)

    try {
      // Créer la partie
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: parseInt(newMatch.club_id),
          match_date: newMatch.date,
          match_time: newMatch.time,
          spots_total: 4,
          spots_available: 3,
          ambiance: newMatch.ambiance,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Reset et reload
      setShowCreateModal(false)
      setNewMatch({ club_id: '', date: '', time: '', spots: 3, ambiance: 'mix' })
      loadData()
      
      alert('Partie créée ! 🎾')
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function joinMatch(matchId) {
    try {
      const match = matches.find(m => m.id === matchId)
      if (!match) return

      // Vérifier si déjà inscrit
      const isParticipant = match.match_participants?.some(p => p.user_id === user.id)
      if (isParticipant || match.organizer_id === user.id) {
        alert('Tu es déjà inscrit à cette partie !')
        return
      }

      // Ajouter le participant
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) throw error

      // Mettre à jour les places
      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available - 1,
          status: match.spots_available - 1 === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      loadData()
      alert('Tu as rejoint la partie ! 🎾')
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Erreur lors de l\'inscription')
    }
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    return date.toLocaleDateString('fr-FR', options)
  }

  // Format time
  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement des parties...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header de bienvenue */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: '700', 
          marginBottom: 8,
          color: '#1a1a1a'
        }}>
          Salut {profile?.name?.split(' ')[0] || 'toi'} 👋
        </h1>
        <p style={{ fontSize: 18, color: '#666' }}>
          Prêt à jouer ?
        </p>
      </div>

      {/* Actions principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 48
      }}>
        {/* Créer une partie */}
        <div
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#fff',
            border: '2px solid #e5e5e5',
            borderRadius: 20,
            padding: 28,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#1a1a1a'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#e5e5e5'}
        >
          <div style={{
            width: 60,
            height: 60,
            background: '#f5f5f5',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28
          }}>
            🎾
          </div>
          <div>
            <div style={{ 
              fontWeight: '700', 
              fontSize: 18, 
              marginBottom: 4,
              color: '#1a1a1a'
            }}>
              J'ai un terrain
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              Créer une partie et inviter des joueurs
            </div>
          </div>
        </div>

        {/* Trouver une partie */}
        <Link 
          href="/dashboard/clubs"
          style={{
            background: '#fff',
            border: '2px solid #e5e5e5',
            borderRadius: 20,
            padding: 28,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            textDecoration: 'none'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#1a1a1a'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#e5e5e5'}
        >
          <div style={{
            width: 60,
            height: 60,
            background: '#f5f5f5',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28
          }}>
            🔍
          </div>
          <div>
            <div style={{ 
              fontWeight: '700', 
              fontSize: 18, 
              marginBottom: 4,
              color: '#1a1a1a'
            }}>
              Je cherche une partie
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              Voir les parties disponibles
            </div>
          </div>
        </Link>
      </div>

      {/* Parties à venir */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            Parties à venir
          </h2>
          <Link href="/dashboard/clubs" style={{
            fontSize: 14,
            color: '#666',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Voir tout →
          </Link>
        </div>

        {matches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 48,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😴</div>
            <div style={{ 
              fontWeight: '600', 
              fontSize: 18, 
              marginBottom: 8,
              color: '#1a1a1a'
            }}>
              Aucune partie pour l'instant
            </div>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Sois le premier à créer une partie !
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '14px 28px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Créer une partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {matches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
              const canJoin = !isOrganizer && !isParticipant && match.spots_available > 0

              return (
                <div
                  key={match.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: '700', 
                        fontSize: 18,
                        color: '#1a1a1a',
                        marginBottom: 4
                      }}>
                        {formatDate(match.match_date)}
                      </div>
                      <div style={{ 
                        fontSize: 24, 
                        fontWeight: '700',
                        color: '#2e7d32',
                        marginBottom: 8
                      }}>
                        {formatTime(match.match_time)}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        📍 {match.clubs?.name}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-block',
                        background: match.ambiance === 'compet' ? '#fef3c7' : 
                                   match.ambiance === 'loisir' ? '#dbeafe' : '#e5e5e5',
                        color: match.ambiance === 'compet' ? '#92400e' : 
                               match.ambiance === 'loisir' ? '#1e40af' : '#666',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: '600',
                        marginBottom: 8
                      }}>
                        {match.ambiance === 'compet' ? '🏆 Compétitif' : 
                         match.ambiance === 'loisir' ? '😎 Détente' : '⚡ Équilibré'}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {match.spots_available} place{match.spots_available > 1 ? 's' : ''} dispo
                      </div>
                    </div>
                  </div>

                  {/* Joueurs */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      background: '#1a1a1a',
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>
                      👤
                    </div>
                    <span style={{ fontSize: 14, color: '#666' }}>
                      {match.profiles?.name || 'Organisateur'}
                      {match.match_participants?.length > 0 && 
                        ` + ${match.match_participants.length} joueur${match.match_participants.length > 1 ? 's' : ''}`
                      }
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    {canJoin && (
                      <button
                        onClick={() => joinMatch(match.id)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: '#1a1a1a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Rejoindre
                      </button>
                    )}
                    {(isOrganizer || isParticipant) && (
                      <div style={{
                        flex: 1,
                        padding: '14px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        ✓ {isOrganizer ? 'Ta partie' : 'Inscrit'}
                      </div>
                    )}
                    <Link
                      href={`/dashboard/match/${match.id}`}
                      style={{
                        padding: '14px 20px',
                        background: '#f5f5f5',
                        color: '#1a1a1a',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      Voir →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Créer une partie */}
      {showCreateModal && (
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
                Créer une partie
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
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

            {/* Club */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8 
              }}>
                Club
              </label>
              <select
                value={newMatch.club_id}
                onChange={e => setNewMatch({ ...newMatch, club_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Sélectionner un club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date et Heure */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: 8 
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: 8 
                }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={newMatch.time}
                  onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15
                  }}
                />
              </div>
            </div>

            {/* Nombre de joueurs */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 12 
              }}>
                Joueurs recherchés
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    onClick={() => setNewMatch({ ...newMatch, spots: n })}
                    style={{
                      flex: 1,
                      padding: '16px',
                      textAlign: 'center',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: newMatch.spots === n ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                      background: newMatch.spots === n ? '#fafafa' : '#fff'
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: '700' }}>{n}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      joueur{n > 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambiance */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 12 
              }}>
                Ambiance
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'loisir', label: '😎 Détente' },
                  { id: 'mix', label: '⚡ Équilibré' },
                  { id: 'compet', label: '🏆 Compétitif' }
                ].map(amb => (
                  <div
                    key={amb.id}
                    onClick={() => setNewMatch({ ...newMatch, ambiance: amb.id })}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 30,
                      cursor: 'pointer',
                      border: newMatch.ambiance === amb.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                      background: newMatch.ambiance === amb.id ? '#1a1a1a' : '#fff',
                      color: newMatch.ambiance === amb.id ? '#fff' : '#1a1a1a',
                      fontSize: 14,
                      fontWeight: '600'
                    }}
                  >
                    {amb.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCreateModal(false)}
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
                onClick={createMatch}
                disabled={creating || !newMatch.club_id || !newMatch.date || !newMatch.time}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: creating || !newMatch.club_id || !newMatch.date || !newMatch.time 
                    ? '#e5e5e5' 
                    : '#1a1a1a',
                  color: creating || !newMatch.club_id || !newMatch.date || !newMatch.time 
                    ? '#999' 
                    : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: creating || !newMatch.club_id || !newMatch.date || !newMatch.time 
                    ? 'not-allowed' 
                    : 'pointer'
                }}
              >
                {creating ? 'Création...' : 'Créer la partie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}