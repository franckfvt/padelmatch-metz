'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClubsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [clubs, setClubs] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' ou 'compatible'
  const [expandedClub, setExpandedClub] = useState(null)

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
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance),
          match_participants (user_id, profiles (name))
        `)
        .eq('status', 'open')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })

      setMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  function isMatchCompatible(match) {
    if (!profile) return true
    
    // Compatible si niveau correspond ou si "tous niveaux"
    const levelOk = !match.level_required || 
                    match.level_required === 'all' || 
                    match.level_required === profile.experience

    // Compatible si ambiance correspond ou si profil est "mix"
    const ambianceOk = !profile.ambiance || 
                       profile.ambiance === 'mix' || 
                       match.ambiance === profile.ambiance || 
                       match.ambiance === 'mix'

    return levelOk && ambianceOk
  }

  async function joinMatch(matchId, spotsAvailable) {
    try {
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

  function getMatchesForClub(clubId) {
    return matches.filter(m => m.club_id === clubId)
  }

  function getFilteredMatches() {
    if (filter === 'compatible') {
      return matches.filter(isMatchCompatible)
    }
    return matches
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  const filteredMatches = getFilteredMatches()
  const compatibleCount = matches.filter(isMatchCompatible).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
          Trouver une partie
        </h1>
        <p style={{ color: '#666', fontSize: 16 }}>
          {matches.length} partie{matches.length > 1 ? 's' : ''} disponible{matches.length > 1 ? 's' : ''} 
          {compatibleCount > 0 && compatibleCount !== matches.length && (
            <span> dont {compatibleCount} pour ton niveau</span>
          )}
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '12px 20px',
            background: filter === 'all' ? '#1a1a1a' : '#fff',
            color: filter === 'all' ? '#fff' : '#1a1a1a',
            border: filter === 'all' ? 'none' : '2px solid #e5e5e5',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Toutes les parties ({matches.length})
        </button>
        <button
          onClick={() => setFilter('compatible')}
          style={{
            padding: '12px 20px',
            background: filter === 'compatible' ? '#2e7d32' : '#fff',
            color: filter === 'compatible' ? '#fff' : '#2e7d32',
            border: filter === 'compatible' ? 'none' : '2px solid #2e7d32',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🎯 Pour ton niveau ({compatibleCount})
        </button>
      </div>

      {/* Mon profil rappel */}
      {profile && (
        <div style={{
          background: '#f5f5f5',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#666' }}>Ton profil :</span>
            <span style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '500'
            }}>
              {experienceEmojis[profile.experience]} {experienceLabels[profile.experience]}
            </span>
            <span style={{
              background: profile.ambiance === 'compet' ? '#fef3c7' : 
                         profile.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
              color: profile.ambiance === 'compet' ? '#92400e' : 
                     profile.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '500'
            }}>
              {ambianceEmojis[profile.ambiance]} {ambianceLabels[profile.ambiance]}
            </span>
          </div>
          <Link href="/dashboard/profile" style={{ fontSize: 13, color: '#666' }}>
            Modifier
          </Link>
        </div>
      )}

      {/* Liste des parties */}
      {filteredMatches.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {filter === 'compatible' 
              ? 'Aucune partie compatible avec ton profil pour le moment'
              : 'Aucune partie disponible pour le moment'
            }
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: '600'
          }}>
            Creer une partie
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredMatches.map(match => {
            const isOrganizer = match.organizer_id === user?.id
            const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
            const isInvolved = isOrganizer || isParticipant
            const isCompatible = isMatchCompatible(match)

            return (
              <div
                key={match.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 24,
                  border: isInvolved ? '2px solid #2e7d32' : '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    {/* Date et heure */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a' }}>
                        {formatDate(match.match_date)}
                      </span>
                      <span style={{ 
                        background: '#2e7d32', 
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: '600'
                      }}>
                        {formatTime(match.match_time)}
                      </span>
                      {isCompatible && !isInvolved && (
                        <span style={{
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: '600'
                        }}>
                          🎯 Pour toi
                        </span>
                      )}
                    </div>

                    {/* Club */}
                    <div style={{ color: '#666', fontSize: 15, marginBottom: 12 }}>
                      📍 {match.clubs?.name}
                    </div>

                    {/* Organisateur */}
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                      Organise par <strong>{match.profiles?.name}</strong>
                      {isOrganizer && <span style={{ color: '#2e7d32' }}> (toi)</span>}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {/* Niveau recherche */}
                      <span style={{
                        fontSize: 13,
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontWeight: '500'
                      }}>
                        {experienceEmojis[match.level_required || 'all']} {experienceLabels[match.level_required || 'all']}
                      </span>
                      {/* Ambiance */}
                      <span style={{
                        fontSize: 13,
                        background: match.ambiance === 'compet' ? '#fef3c7' : 
                                   match.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
                        color: match.ambiance === 'compet' ? '#92400e' : 
                               match.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontWeight: '500'
                      }}>
                        {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
                      </span>
                      {/* Places */}
                      <span style={{
                        fontSize: 13,
                        background: '#f5f5f5',
                        color: '#666',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontWeight: '500'
                      }}>
                        👥 {match.spots_total - match.spots_available}/{match.spots_total} joueurs
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {isInvolved ? (
                      <Link href={`/dashboard/match/${match.id}`}>
                        <button style={{
                          padding: '12px 24px',
                          background: '#2e7d32',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 15,
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}>
                          {isOrganizer ? 'Gerer ma partie' : 'Voir la partie'}
                        </button>
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => joinMatch(match.id, match.spots_available)}
                          style={{
                            padding: '12px 24px',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Rejoindre
                        </button>
                        <Link href={`/dashboard/match/${match.id}`}>
                          <button style={{
                            padding: '10px 24px',
                            background: '#fff',
                            color: '#666',
                            border: '1px solid #e5e5e5',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            width: '100%'
                          }}>
                            Voir details
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Clubs */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 20 }}>
          Clubs a Metz
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {clubs.map(club => {
            const clubMatches = getMatchesForClub(club.id)
            
            return (
              <div
                key={club.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a', marginBottom: 4 }}>
                      {club.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {club.address}
                    </div>
                    {clubMatches.length > 0 && (
                      <div style={{ fontSize: 13, color: '#2e7d32', marginTop: 8 }}>
                        🎾 {clubMatches.length} partie{clubMatches.length > 1 ? 's' : ''} a venir
                      </div>
                    )}
                  </div>
                  {club.booking_url && (
                    <a
                      href={club.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 16px',
                        background: '#f5f5f5',
                        color: '#1a1a1a',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      Reserver
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}