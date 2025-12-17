'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ClubsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [clubs, setClubs] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' ou 'forme'
  const [expandedClub, setExpandedClub] = useState(null)

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

      setMatches(matchesData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
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

  // Vérifier si une partie est compatible avec le profil
  function isMatchCompatible(match) {
    if (!profile?.ambiance) return true
    
    // Si l'utilisateur veut "mix", tout est compatible
    if (profile.ambiance === 'mix') return true
    
    // Sinon, vérifier la correspondance
    return match.ambiance === profile.ambiance || match.ambiance === 'mix'
  }

  // Obtenir les parties d'un club
  function getClubMatches(clubId) {
    let clubMatches = matches.filter(m => m.club_id === clubId)
    
    if (filter === 'forme') {
      clubMatches = clubMatches.filter(isMatchCompatible)
    }
    
    return clubMatches
  }

  // Format date court
  function formatDateShort(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    return date.toLocaleDateString('fr-FR', options)
  }

  // Format time
  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📍</div>
        <div style={{ color: '#666' }}>Chargement des clubs...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: '700', 
          marginBottom: 8,
          color: '#1a1a1a'
        }}>
          Clubs à Metz
        </h1>
        <p style={{ fontSize: 16, color: '#666' }}>
          {clubs.length} clubs · {matches.length} parties à venir
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 32,
        background: '#f5f5f5',
        padding: 4,
        borderRadius: 12,
        width: 'fit-content'
      }}>
        <button
          onClick={() => setFilter('forme')}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer',
            background: filter === 'forme' ? '#fff' : 'transparent',
            color: filter === 'forme' ? '#1a1a1a' : '#666',
            boxShadow: filter === 'forme' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          ✓ Pour toi
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer',
            background: filter === 'all' ? '#fff' : 'transparent',
            color: filter === 'all' ? '#1a1a1a' : '#666',
            boxShadow: filter === 'all' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Toutes les parties
        </button>
      </div>

      {/* Liste des clubs */}
      <div style={{ display: 'grid', gap: 20 }}>
        {clubs.map(club => {
          const clubMatches = getClubMatches(club.id)
          const isExpanded = expandedClub === club.id

          return (
            <div
              key={club.id}
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #eee',
                overflow: 'hidden'
              }}
            >
              {/* En-tête du club */}
              <div style={{ padding: 24 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: 20, 
                      fontWeight: '700',
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {club.name}
                    </h3>
                    <p style={{ fontSize: 14, color: '#666' }}>
                      📍 {club.address || club.city}
                    </p>
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
                      Réserver →
                    </a>
                  )}
                </div>

                {/* Infos club */}
                <div style={{ 
                  display: 'flex', 
                  gap: 16,
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: 13,
                    color: '#666',
                    background: '#f5f5f5',
                    padding: '6px 12px',
                    borderRadius: 20
                  }}>
                    🎾 {club.courts} terrains
                  </span>
                  {club.active_players > 0 && (
                    <span style={{
                      fontSize: 13,
                      color: '#666',
                      background: '#f5f5f5',
                      padding: '6px 12px',
                      borderRadius: 20
                    }}>
                      👥 {club.active_players} joueurs actifs
                    </span>
                  )}
                </div>
              </div>

              {/* Section parties */}
              {clubMatches.length > 0 ? (
                <div>
                  {/* Bouton pour voir les parties */}
                  <div
                    onClick={() => setExpandedClub(isExpanded ? null : club.id)}
                    style={{
                      padding: '16px 24px',
                      background: '#f0fdf4',
                      borderTop: '1px solid #e5e5e5',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{ fontSize: 16 }}>🎾</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#166534',
                        fontSize: 15
                      }}>
                        {clubMatches.length} partie{clubMatches.length > 1 ? 's' : ''} à venir
                      </span>
                    </div>
                    <span style={{ 
                      color: '#166534',
                      fontSize: 18,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s'
                    }}>
                      ▼
                    </span>
                  </div>

                  {/* Liste des parties (expandable) */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid #e5e5e5',
                      padding: 16,
                      background: '#fafafa'
                    }}>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {clubMatches.map(match => {
                          const isOrganizer = match.organizer_id === user?.id
                          const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
                          const canJoin = !isOrganizer && !isParticipant && match.spots_available > 0
                          const compatible = isMatchCompatible(match)

                          return (
                            <div
                              key={match.id}
                              style={{
                                background: '#fff',
                                borderRadius: 14,
                                padding: 16,
                                border: compatible ? '1px solid #e5e5e5' : '1px solid #fecaca'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                                flexWrap: 'wrap',
                                gap: 8
                              }}>
                                <div>
                                  <div style={{ 
                                    fontWeight: '700', 
                                    fontSize: 16,
                                    color: '#1a1a1a'
                                  }}>
                                    {formatDateShort(match.match_date)} · {formatTime(match.match_time)}
                                  </div>
                                  <div style={{ 
                                    fontSize: 13, 
                                    color: '#666',
                                    marginTop: 2
                                  }}>
                                    Organisé par {match.profiles?.name || 'Joueur'}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {compatible && (
                                    <span style={{
                                      background: '#e8f5e9',
                                      color: '#2e7d32',
                                      padding: '4px 10px',
                                      borderRadius: 20,
                                      fontSize: 11,
                                      fontWeight: '600'
                                    }}>
                                      ✓ Pour toi
                                    </span>
                                  )}
                                  <span style={{
                                    background: match.ambiance === 'compet' ? '#fef3c7' : 
                                               match.ambiance === 'loisir' ? '#dbeafe' : '#f5f5f5',
                                    color: match.ambiance === 'compet' ? '#92400e' : 
                                           match.ambiance === 'loisir' ? '#1e40af' : '#666',
                                    padding: '4px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: '600'
                                  }}>
                                    {match.ambiance === 'compet' ? '🏆 Compét' : 
                                     match.ambiance === 'loisir' ? '😎 Détente' : '⚡ Mix'}
                                  </span>
                                  <span style={{
                                    background: '#f5f5f5',
                                    color: '#666',
                                    padding: '4px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: '600'
                                  }}>
                                    {match.spots_available} place{match.spots_available > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: 8 }}>
                                {canJoin && (
                                  <button
                                    onClick={() => joinMatch(match.id)}
                                    style={{
                                      flex: 1,
                                      padding: '12px',
                                      background: '#1a1a1a',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 10,
                                      fontSize: 13,
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
                                    padding: '12px',
                                    background: '#e8f5e9',
                                    color: '#2e7d32',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: '600',
                                    textAlign: 'center'
                                  }}>
                                    ✓ {isOrganizer ? 'Ta partie' : 'Inscrit'}
                                  </div>
                                )}
                                <Link
                                  href={`/dashboard/match/${match.id}`}
                                  style={{
                                    padding: '12px 16px',
                                    background: '#f5f5f5',
                                    color: '#1a1a1a',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                  }}
                                >
                                  Détails
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Bouton créer une partie */}
                      <Link
                        href="/dashboard"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '14px',
                          marginTop: 12,
                          border: '2px dashed #d1d5db',
                          borderRadius: 12,
                          color: '#666',
                          fontSize: 14,
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        + Créer une partie ici
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* Aucune partie */
                <div style={{
                  padding: '16px 24px',
                  background: '#fafafa',
                  borderTop: '1px solid #eee',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: 14, 
                    color: '#999',
                    marginBottom: 12
                  }}>
                    Aucune partie prévue
                  </p>
                  <Link
                    href="/dashboard"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      background: '#1a1a1a',
                      color: '#fff',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: '600',
                      textDecoration: 'none'
                    }}
                  >
                    Créer la première !
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Message si aucun club */}
      {clubs.length === 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
          <div style={{ 
            fontWeight: '600', 
            fontSize: 18, 
            marginBottom: 8,
            color: '#1a1a1a'
          }}>
            Aucun club pour l'instant
          </div>
          <p style={{ color: '#666' }}>
            Les clubs de Metz seront bientôt disponibles !
          </p>
        </div>
      )}
    </div>
  )
}