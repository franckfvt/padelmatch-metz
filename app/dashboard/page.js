'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [myMatches, setMyMatches] = useState([])
  const [availableMatches, setAvailableMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal création rapide
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    level: 'all'
  })

  // Ouvrir modal si ?create=true
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true)
    }
  }, [searchParams])

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

      // Profil
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

      // Mes parties (organisateur ou participant)
      const { data: myMatchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name),
          profiles!matches_organizer_id_fkey (id, name, level, position),
          match_participants (
            user_id,
            profiles (id, name, level, position)
          )
        `)
        .or(`organizer_id.eq.${session.user.id}`)
        .gte('match_date', new Date().toISOString().split('T')[0])
        .in('status', ['open', 'full'])
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })

      // Parties où je suis participant
      const { data: participatingData } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)

      const participatingIds = participatingData?.map(p => p.match_id) || []

      // Combiner et filtrer
      let allMyMatches = myMatchesData || []
      
      if (participatingIds.length > 0) {
        const { data: participatingMatches } = await supabase
          .from('matches')
          .select(`
            *,
            clubs (id, name),
            profiles!matches_organizer_id_fkey (id, name, level, position),
            match_participants (
              user_id,
              profiles (id, name, level, position)
            )
          `)
          .in('id', participatingIds)
          .gte('match_date', new Date().toISOString().split('T')[0])
          .in('status', ['open', 'full'])
          .order('match_date', { ascending: true })

        // Fusionner sans doublons
        const existingIds = allMyMatches.map(m => m.id)
        participatingMatches?.forEach(m => {
          if (!existingIds.includes(m.id)) {
            allMyMatches.push(m)
          }
        })
      }

      // Trier par date
      allMyMatches.sort((a, b) => {
        const dateA = new Date(`${a.match_date}T${a.match_time}`)
        const dateB = new Date(`${b.match_date}T${b.match_time}`)
        return dateA - dateB
      })

      setMyMatches(allMyMatches)

      // Parties disponibles (pas les miennes)
      const { data: availableData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name),
          profiles!matches_organizer_id_fkey (id, name, level, position),
          match_participants (
            user_id,
            profiles (id, name, level, position)
          )
        `)
        .neq('organizer_id', session.user.id)
        .eq('status', 'open')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true })
        .limit(10)

      // Filtrer celles où je suis déjà inscrit
      const available = (availableData || []).filter(m => 
        !participatingIds.includes(m.id)
      )

      setAvailableMatches(available)
      setLoading(false)

    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function createMatch(e) {
    e.preventDefault()
    if (!newMatch.club_id || !newMatch.date || !newMatch.time) {
      alert('Remplis le club, la date et l\'heure')
      return
    }

    setCreating(true)

    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: parseInt(newMatch.club_id),
          match_date: newMatch.date,
          match_time: newMatch.time,
          level_required: newMatch.level,
          spots_total: 4,
          spots_available: 3,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Fermer modal et aller sur la partie
      setShowCreate(false)
      router.push(`/dashboard/match/${data.id}`)

    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain"
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getPlayerCount(match) {
    return 1 + (match.match_participants?.length || 0)
  }

  function getLevelLabel(level) {
    const labels = {
      'all': 'Tous niveaux',
      '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
      '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
    }
    return labels[level] || level
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      
      {/* Header avec bouton créer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            Salut {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: 14 }}>
            Prêt à jouer ?
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 20px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          Créer
        </button>
      </div>

      {/* Mes prochaines parties */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
          📅 Mes prochaines parties
        </h2>

        {myMatches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
            <p style={{ color: '#666', marginBottom: 16 }}>Aucune partie prévue</p>
            <button
              onClick={() => setShowCreate(true)}
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
              Créer ma première partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myMatches.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/match/${match.id}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {match.clubs?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatDate(match.match_date)} à {formatTime(match.match_time)}
                    </div>
                  </div>
                  <div style={{
                    background: match.status === 'full' ? '#dcfce7' : '#fef3c7',
                    color: match.status === 'full' ? '#166534' : '#92400e',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {getPlayerCount(match)}/4
                  </div>
                </div>

                {/* Joueurs */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginTop: 12,
                  flexWrap: 'wrap'
                }}>
                  {/* Organisateur */}
                  <span style={{
                    background: '#f5f5f5',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#1a1a1a'
                  }}>
                    👑 {match.profiles?.name?.split(' ')[0]}
                  </span>
                  
                  {/* Participants */}
                  {match.match_participants?.map(p => (
                    <span key={p.user_id} style={{
                      background: '#f5f5f5',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#666'
                    }}>
                      {p.profiles?.name?.split(' ')[0]}
                    </span>
                  ))}
                  
                  {/* Places restantes */}
                  {Array(4 - getPlayerCount(match)).fill(0).map((_, i) => (
                    <span key={i} style={{
                      background: '#fff',
                      border: '1px dashed #ddd',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#999'
                    }}>
                      ?
                    </span>
                  ))}
                </div>

                {match.organizer_id === user?.id && (
                  <div style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: '#2e7d32',
                    fontWeight: '500'
                  }}>
                    👑 Tu organises
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Parties disponibles */}
      {availableMatches.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
            🔥 Parties à rejoindre
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {availableMatches.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/match/${match.id}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {match.clubs?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatDate(match.match_date)} à {formatTime(match.match_time)}
                    </div>
                    {match.level_required && match.level_required !== 'all' && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#2e7d32',
                        marginTop: 4 
                      }}>
                        Niveau {getLevelLabel(match.level_required)}+
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {getPlayerCount(match)}/4
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 8, 
                  marginTop: 10,
                  fontSize: 13,
                  color: '#666'
                }}>
                  <span>Organisé par {match.profiles?.name?.split(' ')[0]}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Modal création rapide */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>
                🎾 Nouvelle partie
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMatch}>
              {/* Club */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 8,
                  color: '#1a1a1a'
                }}>
                  📍 Où ?
                </label>
                <select
                  value={newMatch.club_id}
                  onChange={(e) => setNewMatch({ ...newMatch, club_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    border: '2px solid #eee',
                    fontSize: 16,
                    background: '#fff'
                  }}
                  required
                >
                  <option value="">Choisis un club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              {/* Date et Heure sur même ligne */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#1a1a1a'
                  }}>
                    📅 Quand ?
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: 14,
                      borderRadius: 12,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#1a1a1a'
                  }}>
                    🕐 Heure
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 14,
                      borderRadius: 12,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                    required
                  />
                </div>
              </div>

              {/* Niveau (optionnel) */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 8,
                  color: '#1a1a1a'
                }}>
                  🎯 Niveau minimum <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setNewMatch({ ...newMatch, level: 'all' })}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '2px solid',
                      borderColor: newMatch.level === 'all' ? '#1a1a1a' : '#eee',
                      background: newMatch.level === 'all' ? '#1a1a1a' : '#fff',
                      color: newMatch.level === 'all' ? '#fff' : '#666',
                      fontSize: 14,
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Tous
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewMatch({ ...newMatch, level: level.toString() })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '2px solid',
                        borderColor: newMatch.level === level.toString() ? '#1a1a1a' : '#eee',
                        background: newMatch.level === level.toString() ? '#1a1a1a' : '#fff',
                        color: newMatch.level === level.toString() ? '#fff' : '#666',
                        fontSize: 14,
                        fontWeight: '500',
                        cursor: 'pointer',
                        minWidth: 44
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bouton créer */}
              <button
                type="submit"
                disabled={creating}
                style={{
                  width: '100%',
                  padding: 16,
                  background: creating ? '#ccc' : '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : '🎾 Créer la partie'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}