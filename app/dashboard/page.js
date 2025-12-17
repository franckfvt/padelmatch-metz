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
  const [myMatches, setMyMatches] = useState([])
  const [groups, setGroups] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    spots: '3',
    ambiance: 'mix',
    level: 'all',
    price_total: '',
    private_notes: '',
    group_id: ''
  })

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
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
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  const levelOptions = [
    { id: 'all', label: 'Tous niveaux', emoji: '🎾', desc: 'Ouvert à tous' },
    { id: 'less6months', label: 'Débutant', emoji: '🌱', desc: 'Moins de 6 mois' },
    { id: '6months2years', label: 'Intermédiaire', emoji: '📈', desc: '6 mois - 2 ans' },
    { id: '2to5years', label: 'Confirmé', emoji: '💪', desc: '2 - 5 ans' },
    { id: 'more5years', label: 'Expert', emoji: '🏆', desc: 'Plus de 5 ans' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', desc: 'Fun et convivial' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', desc: 'Fun mais on joue bien' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', desc: 'On est là pour gagner' }
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

      // Mes groupes
      const { data: groupsData } = await supabase
        .from('group_members')
        .select(`
          group_id,
          player_groups (id, name, description, created_by)
        `)
        .eq('user_id', session.user.id)

      setGroups(groupsData?.map(g => g.player_groups).filter(Boolean) || [])

      // Mes parties (où je suis organisateur ou participant)
      const today = new Date().toISOString().split('T')[0]
      
      const { data: myMatchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (user_id)
        `)
        .or(`organizer_id.eq.${session.user.id},match_participants.user_id.eq.${session.user.id}`)
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(5)

      setMyMatches(myMatchesData || [])

      // Toutes les parties ouvertes
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (user_id, profiles (name))
        `)
        .eq('status', 'open')
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
          price_total: newMatch.price_total ? parseInt(newMatch.price_total) * 100 : 0,
          private_notes: newMatch.private_notes || null,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Si un groupe est sélectionné, inviter les membres
      if (newMatch.group_id) {
        // TODO: Envoyer notifications aux membres du groupe
      }

      setShowCreateModal(false)
      setNewMatch({
        club_id: '',
        date: '',
        time: '',
        spots: '3',
        ambiance: 'mix',
        level: 'all',
        price_total: '',
        private_notes: '',
        group_id: ''
      })
      
      router.push(`/dashboard/match/${data.id}`)

    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création de la partie')
    } finally {
      setCreating(false)
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
      {/* Header avec stats */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          Salut {profile?.name || 'Joueur'} 👋
        </h1>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            🎾 {profile?.matches_played || 0} parties jouées
          </span>
          <span style={{ color: '#666', fontSize: 14 }}>
            🏆 {profile?.matches_won || 0} victoires
          </span>
          {profile?.current_streak > 0 && (
            <span style={{ color: '#2e7d32', fontSize: 14, fontWeight: '600' }}>
              🔥 {profile.current_streak} victoires d'affilée
            </span>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 32
      }}>
        <div
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#1a1a1a',
            borderRadius: 16,
            padding: 20,
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
          <div style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Créer une partie
          </div>
        </div>

        <Link href="/dashboard/clubs" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14 }}>
              Trouver une partie
            </div>
          </div>
        </Link>

        <Link href="/dashboard/groups" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14 }}>
              Mes groupes
            </div>
            {groups.length > 0 && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {groups.length} groupe{groups.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Link>

        <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14 }}>
              Mes stats
            </div>
          </div>
        </Link>
      </div>

      {/* Mes prochaines parties */}
      {myMatches.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 }}>
            🗓️ Mes prochaines parties
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {myMatches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`} 
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    border: '2px solid #2e7d32',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                        {formatDate(match.match_date)} à {formatTime(match.match_time)}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        📍 {match.clubs?.name}
                      </div>
                    </div>
                    <div style={{
                      background: isOrganizer ? '#1a1a1a' : '#e8f5e9',
                      color: isOrganizer ? '#fff' : '#2e7d32',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {isOrganizer ? 'Organisateur' : 'Inscrit'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Parties disponibles */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 }}>
          🎾 Parties disponibles
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
              Aucune partie disponible pour le moment
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
              Créer la première partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {matches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
              const isInvolved = isOrganizer || isParticipant
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0

              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    border: isInvolved ? '2px solid #2e7d32' : '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
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
                          {pricePerPerson > 0 && (
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: '600'
                            }}>
                              💰 {pricePerPerson}€/pers
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                          📍 {match.clubs?.name}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                          <span style={{
                            fontSize: 12,
                            background: '#f5f5f5',
                            color: '#666',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontWeight: '500'
                          }}>
                            {match.spots_available} place{match.spots_available > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        background: isInvolved ? '#2e7d32' : '#1a1a1a',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: '600'
                      }}>
                        {isInvolved ? 'Voir' : 'Rejoindre'}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Création */}
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
                  <option value="">Sélectionne un club</option>
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

              {/* Joueurs recherchés */}
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
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prix du terrain */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  💰 Prix total du terrain (optionnel)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={newMatch.price_total}
                    onChange={e => setNewMatch({ ...newMatch, price_total: e.target.value })}
                    placeholder="Ex: 60"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      paddingRight: 50,
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 15,
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999',
                    fontWeight: '600'
                  }}>
                    €
                  </span>
                </div>
                {newMatch.price_total && (
                  <p style={{ fontSize: 13, color: '#2e7d32', marginTop: 8 }}>
                    → {Math.round(parseInt(newMatch.price_total) / 4)}€ par personne
                  </p>
                )}
              </div>

              {/* Niveau recherché */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Niveau recherché *
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
              <div style={{ marginBottom: 20 }}>
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes privées */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  📝 Notes privées (optionnel)
                </label>
                <textarea
                  value={newMatch.private_notes}
                  onChange={e => setNewMatch({ ...newMatch, private_notes: e.target.value })}
                  placeholder="Ex: Terrain n°3, code portail 1234, RDV au bar 15min avant..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  Visible uniquement par les joueurs inscrits
                </p>
              </div>

              {/* Inviter un groupe */}
              {groups.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    👥 Inviter un groupe (optionnel)
                  </label>
                  <select
                    value={newMatch.group_id}
                    onChange={e => setNewMatch({ ...newMatch, group_id: e.target.value })}
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
                    <option value="">Pas de groupe</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}

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
                {creating ? 'Création...' : 'Créer la partie'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}