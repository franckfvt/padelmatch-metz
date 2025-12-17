'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // Formulaire creation
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    spots: '3',
    ambiance: 'mix',
    level: 'all'
  })

  const experienceLabels = {
    'less6months': 'Debutant',
    '6months2years': 'Intermediaire',
    '2to5years': 'Confirme',
    'more5years': 'Expert',
    'all': 'Tous niveaux'
  }

  const experienceEmojis = {
    'less6months': '🌱',
    '6months2years': '📈',
    '2to5years': '💪',
    'more5years': '🏆',
    'all': '🎾'
  }

  const ambianceLabels = {
    'loisir': 'Detente',
    'mix': 'Equilibre',
    'compet': 'Competitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  const levelOptions = [
    { id: 'all', label: 'Tous niveaux', emoji: '🎾', desc: 'Ouvert a tous' },
    { id: 'less6months', label: 'Debutant', emoji: '🌱', desc: 'Moins de 6 mois' },
    { id: '6months2years', label: 'Intermediaire', emoji: '📈', desc: '6 mois - 2 ans' },
    { id: '2to5years', label: 'Confirme', emoji: '💪', desc: '2 - 5 ans' },
    { id: 'more5years', label: 'Expert', emoji: '🏆', desc: 'Plus de 5 ans' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Detente', emoji: '😎', desc: 'Fun et convivial' },
    { id: 'mix', label: 'Equilibre', emoji: '⚡', desc: 'Fun mais on joue bien' },
    { id: 'compet', label: 'Competitif', emoji: '🏆', desc: 'On est la pour gagner' }
  ]

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

      // Clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      setClubs(clubsData || [])

      // Matches a venir
      const today = new Date().toISOString().split('T')[0]
      
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (user_id, profiles (name))
        `)
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(10)

      setMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function createMatch(e) {
    e.preventDefault()
    setCreating(true)

    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: parseInt(newMatch.club_id),
          match_date: newMatch.date,
          match_time: newMatch.time,
          spots_total: 4,
          spots_available: parseInt(newMatch.spots),
          ambiance: newMatch.ambiance,
          level_required: newMatch.level,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      setShowCreateModal(false)
      setNewMatch({
        club_id: '',
        date: '',
        time: '',
        spots: '3',
        ambiance: 'mix',
        level: 'all'
      })
      
      router.push(`/dashboard/match/${data.id}`)

    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la creation de la partie')
    } finally {
      setCreating(false)
    }
  }

  async function joinMatch(matchId, spotsAvailable) {
    try {
      // Verifier si deja inscrit
      const match = matches.find(m => m.id === matchId)
      const isParticipant = match?.match_participants?.some(p => p.user_id === user.id)
      const isOrganizer = match?.organizer_id === user.id

      if (isParticipant || isOrganizer) {
        router.push(`/dashboard/match/${matchId}`)
        return
      }

      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) throw error

      await supabase
        .from('matches')
        .update({
          spots_available: spotsAvailable - 1,
          status: spotsAvailable - 1 === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      await supabase.from('match_messages').insert({
        match_id: matchId,
        user_id: user.id,
        message: `${profile?.name || 'Un joueur'} a rejoint la partie ! 🎾`
      })

      router.push(`/dashboard/match/${matchId}`)

    } catch (error) {
      console.error('Error joining match:', error)
      alert('Erreur lors de inscription')
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    return date.toLocaleDateString('fr-FR', options)
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Message bienvenue */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          Salut {profile?.name || 'Joueur'} 👋
        </h1>
        <p style={{ color: '#666', fontSize: 16 }}>
          Pret pour une partie ?
        </p>
      </div>

      {/* Actions principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 40
      }}>
        {/* Creer une partie */}
        <div
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#1a1a1a',
            borderRadius: 20,
            padding: 28,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
          <h2 style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
            J ai un terrain
          </h2>
          <p style={{ color: '#999', fontSize: 14 }}>
            Cree ta partie et invite des joueurs
          </p>
        </div>

        {/* Trouver une partie */}
        <Link href="/dashboard/clubs" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 28,
            border: '2px solid #e5e5e5',
            cursor: 'pointer',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <h2 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
              Je cherche une partie
            </h2>
            <p style={{ color: '#666', fontSize: 14 }}>
              Trouve une partie qui te correspond
            </p>
          </div>
        </Link>
      </div>

      {/* Parties a venir */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 }}>
          Parties a venir
        </h2>

        {matches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Aucune partie prevue pour le moment
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Creer la premiere partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {matches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
              const isInvolved = isOrganizer || isParticipant

              return (
                <div
                  key={match.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    border: isInvolved ? '2px solid #2e7d32' : '1px solid #eee'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {/* Date et heure */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: '700', color: '#1a1a1a' }}>
                          {formatDate(match.match_date)}
                        </span>
                        <span style={{ 
                          background: '#2e7d32', 
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: '600'
                        }}>
                          {formatTime(match.match_time)}
                        </span>
                      </div>

                      {/* Club */}
                      <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                        📍 {match.clubs?.name}
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {/* Niveau */}
                        {match.level_required && match.level_required !== 'all' && (
                          <span style={{
                            fontSize: 12,
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: '500'
                          }}>
                            {experienceEmojis[match.level_required]} {experienceLabels[match.level_required]}
                          </span>
                        )}
                        {/* Ambiance */}
                        <span style={{
                          fontSize: 12,
                          background: match.ambiance === 'compet' ? '#fef3c7' : 
                                     match.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
                          color: match.ambiance === 'compet' ? '#92400e' : 
                                 match.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontWeight: '500'
                        }}>
                          {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
                        </span>
                        {/* Places */}
                        <span style={{
                          fontSize: 12,
                          background: match.spots_available > 0 ? '#f5f5f5' : '#fef2f2',
                          color: match.spots_available > 0 ? '#666' : '#dc2626',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontWeight: '500'
                        }}>
                          {match.spots_available > 0 
                            ? `${match.spots_available} place${match.spots_available > 1 ? 's' : ''}` 
                            : 'Complet'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {isInvolved ? (
                        <Link href={`/dashboard/match/${match.id}`}>
                          <button style={{
                            padding: '10px 20px',
                            background: '#2e7d32',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}>
                            {isOrganizer ? 'Gerer' : 'Voir'}
                          </button>
                        </Link>
                      ) : match.spots_available > 0 ? (
                        <button
                          onClick={() => joinMatch(match.id, match.spots_available)}
                          style={{
                            padding: '10px 20px',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Rejoindre
                        </button>
                      ) : (
                        <span style={{
                          padding: '10px 20px',
                          background: '#f5f5f5',
                          color: '#999',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: '600'
                        }}>
                          Complet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Creation */}
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
            maxWidth: 500,
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
                Creer une partie
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
                X
              </button>
            </div>

            <form onSubmit={createMatch}>
              {/* Club */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Club *
                </label>
                <select
                  value={newMatch.club_id}
                  onChange={e => setNewMatch({ ...newMatch, club_id: e.target.value })}
                  required
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
                  <option value="">Selectionne un club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              {/* Date et Heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                    min={getMinDate()}
                    required
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
                <div>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    Heure *
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                    required
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
              </div>

              {/* Joueurs recherches */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Combien de joueurs tu cherches ? *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3'].map(num => (
                    <div
                      key={num}
                      onClick={() => setNewMatch({ ...newMatch, spots: num })}
                      style={{
                        flex: 1,
                        padding: '14px',
                        border: newMatch.spots === num ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: newMatch.spots === num ? '#fafafa' : '#fff'
                      }}
                    >
                      {num} joueur{num !== '1' ? 's' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* Niveau recherche */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Niveau recherche *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {levelOptions.slice(0, 3).map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setNewMatch({ ...newMatch, level: opt.id })}
                      style={{
                        padding: '12px 8px',
                        border: newMatch.level === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newMatch.level === opt.id ? '#e8f5e9' : '#fff'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                  {levelOptions.slice(3).map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setNewMatch({ ...newMatch, level: opt.id })}
                      style={{
                        padding: '12px 8px',
                        border: newMatch.level === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newMatch.level === opt.id ? '#e8f5e9' : '#fff'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambiance */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Ambiance *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {ambianceOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setNewMatch({ ...newMatch, ambiance: opt.id })}
                      style={{
                        padding: '12px 8px',
                        border: newMatch.ambiance === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newMatch.ambiance === opt.id ? '#e8f5e9' : '#fff'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={creating || !newMatch.club_id || !newMatch.date || !newMatch.time}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? '#e5e5e5' : '#1a1a1a',
                  color: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Creation...' : 'Creer la partie'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}