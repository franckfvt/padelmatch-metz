'use client'

/**
 * ============================================
 * PAGE PARTIES - Design Final Desktop/Mobile
 * ============================================
 * 
 * Structure :
 * - Greeting "Bonjour X"
 * - Hero dark "Organise une partie" 
 * - Tes prochaines parties (3 cartes + voir plus)
 * - Parties à rejoindre (filtres + liste)
 * - Sidebar (profil, favoris, boîte à idées)
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Couleurs
const DARK = '#1a1a2e'
const DARK_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #334155)'
const GREEN_GRADIENT = 'linear-gradient(135deg, #22c55e, #16a34a)'
const PLAYER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

const AMBIANCE_CONFIG = {
  loisir: { emoji: '😎', label: 'Détente', color: '#22c55e' },
  mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6' },
  compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b' }
}

function getAvatarColor(name) {
  if (!name) return PLAYER_COLORS[0]
  const index = name.charCodeAt(0) % PLAYER_COLORS.length
  return PLAYER_COLORS[index]
}

export default function PartiesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [filterDate, setFilterDate] = useState('week')
  const [filterCity, setFilterCity] = useState('all')
  const [cities, setCities] = useState([])
  
  // Données
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  
  // Actions en attente
  const [pendingActions, setPendingActions] = useState({
    invitesForMe: [],      // Invitations que je dois confirmer
    requestsToReview: [],  // Demandes à valider (pour mes matchs)
    invitesToFollow: []    // Invités à relancer (pour mes matchs)
  })
  
  // Sidebar
  const [stats, setStats] = useState({ total: 0, organized: 0, wins: 0 })
  const [favoritePlayers, setFavoritePlayers] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    const [profileResult, availableResult, orgMatchesResult, partMatchesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('matches')
        .select(`*, clubs (id, name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))`)
        .eq('status', 'open').gt('spots_available', 0).gte('match_date', today).neq('organizer_id', userId)
        .order('match_date', { ascending: true }).limit(20),
      supabase.from('matches')
        .select(`*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))`)
        .eq('organizer_id', userId).gte('match_date', today).order('match_date', { ascending: true }),
      supabase.from('match_participants')
        .select(`match_id, status, matches!inner (*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url)))`)
        .eq('user_id', userId).eq('status', 'confirmed').gte('matches.match_date', today)
    ])

    const profileData = profileResult.data
    setProfile(profileData)

    // Filtrer les parties où je participe déjà
    const filteredAvailable = (availableResult.data || []).filter(m => 
      !m.match_participants?.some(p => p.user_id === userId)
    )
    setAvailableMatches(filteredAvailable)

    // Extraire les villes
    const citiesSet = new Set()
    filteredAvailable.forEach(m => { 
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city) 
    })
    setCities(Array.from(citiesSet).sort())
    if (profileData?.city) setFilterCity(profileData.city)

    // Combiner mes parties (organisées + participations)
    const allUpcoming = [...(orgMatchesResult.data || [])]
    const orgIds = new Set(allUpcoming.map(m => m.id))
    ;(partMatchesResult.data || []).forEach(p => { 
      if (p.matches && !orgIds.has(p.matches.id)) {
        allUpcoming.push({ ...p.matches, _isParticipant: true }) 
      }
    })
    allUpcoming.sort((a, b) => {
      const dateA = new Date(`${a.match_date}T${a.match_time || '00:00'}`)
      const dateB = new Date(`${b.match_date}T${b.match_time || '00:00'}`)
      return dateA - dateB
    })
    setMyUpcomingMatches(allUpcoming)
    
    // Charger les actions en attente pour l'organisateur
    await loadPendingActions(userId, orgMatchesResult.data || [])
    
    setLoading(false)
    loadSidebarData(userId, today)
  }

  async function loadPendingActions(userId, myMatches) {
    const matchIds = myMatches.map(m => m.id)
    
    if (matchIds.length === 0) {
      setPendingActions({ invitesForMe: [], requestsToReview: [], invitesToFollow: [] })
      return
    }

    // Charger les demandes en attente sur mes matchs
    const { data: pendingRequests } = await supabase
      .from('match_participants')
      .select(`*, matches!inner (id, match_date, match_time, clubs (name)), profiles!match_participants_user_id_fkey (id, name, avatar_url, level)`)
      .in('match_id', matchIds)
      .eq('status', 'pending')

    // Charger les invités en attente sur mes matchs
    const { data: pendingInvites } = await supabase
      .from('pending_invites')
      .select(`*, matches!inner (id, match_date, match_time, clubs (name))`)
      .in('match_id', matchIds)
      .eq('status', 'pending')

    // Calculer le temps depuis l'invitation
    const invitesWithAge = (pendingInvites || []).map(inv => {
      const created = new Date(inv.created_at)
      const now = new Date()
      const hoursSince = Math.floor((now - created) / (1000 * 60 * 60))
      const daysSince = Math.floor(hoursSince / 24)
      return { ...inv, hoursSince, daysSince }
    })

    setPendingActions({
      invitesForMe: [], // TODO: matcher par téléphone
      requestsToReview: pendingRequests || [],
      invitesToFollow: invitesWithAge
    })
  }

  async function loadSidebarData(userId, today) {
    const [pastResult, organizedCount, favoritesResult] = await Promise.all([
      supabase.from('match_participants')
        .select(`match_id, matches!inner (id, match_date, winner)`)
        .eq('user_id', userId).lt('matches.match_date', today).limit(100),
      supabase.from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId),
      supabase.from('player_favorites')
        .select(`profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city)`)
        .eq('user_id', userId).limit(5)
    ])
    
    const uniquePast = new Set((pastResult.data || []).map(p => p.match_id))
    // Compter les victoires (simplifié)
    const wins = (pastResult.data || []).filter(p => p.matches?.winner).length
    setStats({ total: uniquePast.size, organized: organizedCount.count || 0, wins })
    setFavoritePlayers((favoritesResult.data || []).map(f => f.profiles).filter(Boolean))
  }

  // === HELPERS ===
  function getGreeting() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    if (hour < 12) return `Bonjour ${firstName} 👋`
    if (hour < 18) return `Salut ${firstName} 👋`
    return `Bonsoir ${firstName} 👋`
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) { 
    return timeStr ? timeStr.slice(0, 5) : 'Flexible' 
  }

  function getMatchLocation(match) { 
    return match.clubs?.name || match.city || 'Lieu à définir' 
  }

  function getMatchPlayers(match) {
    const players = []
    if (match.profiles) {
      players.push({ id: match.organizer_id, name: match.profiles.name, avatar_url: match.profiles.avatar_url })
    }
    ;(match.match_participants || []).forEach(p => { 
      if (p.user_id !== match.organizer_id && p.profiles && p.status === 'confirmed') {
        players.push({ id: p.user_id, name: p.profiles.name, avatar_url: p.profiles.avatar_url }) 
      }
    })
    return players
  }

  // === ACTIONS ===
  async function acceptRequest(req) {
    await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', req.id)
    loadData()
  }

  async function refuseRequest(req) {
    await supabase.from('match_participants').delete().eq('id', req.id)
    loadData()
  }

  async function cancelInvite(invite) {
    await supabase.from('pending_invites').delete().eq('id', invite.id)
    loadData()
  }

  function getTotalPendingActions() {
    return pendingActions.requestsToReview.length + pendingActions.invitesToFollow.filter(i => i.daysSince >= 2).length
  }

  // Filtres
  const filteredAvailable = availableMatches.filter(match => {
    // Filtre ville
    if (filterCity !== 'all') {
      const matchCity = (match.clubs?.city || match.city || '').toLowerCase()
      if (matchCity !== filterCity.toLowerCase()) return false
    }
    // Filtre date
    if (match.match_date) {
      const matchDate = new Date(match.match_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const endOfWeek = new Date(today)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      
      if (filterDate === 'today' && matchDate.toDateString() !== today.toDateString()) return false
      if (filterDate === 'tomorrow' && matchDate.toDateString() !== tomorrow.toDateString()) return false
      if (filterDate === 'week' && matchDate > endOfWeek) return false
      if (filterDate === 'weekend') {
        const day = matchDate.getDay()
        if (day !== 0 && day !== 6) return false
      }
    }
    return true
  })

  const visibleMatches = myUpcomingMatches.slice(0, 3)
  const hiddenMatches = myUpcomingMatches.slice(3)

  // === COMPOSANTS ===
  function Avatar({ player, size = 32, overlap = false, index = 0 }) {
    if (!player) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: '#f9fafb', border: '2px dashed #d1d5db',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, color: '#9ca3af',
          marginLeft: overlap && index > 0 ? -8 : 0,
          position: 'relative', zIndex: 4 - index,
          flexShrink: 0
        }}>?</div>
      )
    }
    
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: player.avatar_url ? '#f1f5f9' : getAvatarColor(player.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 600, color: '#fff',
        overflow: 'hidden',
        border: '2px solid #fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginLeft: overlap && index > 0 ? -8 : 0,
        position: 'relative', zIndex: 4 - index,
        flexShrink: 0
      }}>
        {player.avatar_url 
          ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : player.name?.[0]?.toUpperCase()
        }
      </div>
    )
  }

  // === RENDER ===
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🎾</div>
        <div style={{ color: '#64748b', fontSize: 15 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <div className="page-container">
        
        {/* ============================================ */}
        {/* COLONNE PRINCIPALE                          */}
        {/* ============================================ */}
        <div className="main-column">
          
          {/* Greeting */}
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            margin: '0 0 20px', 
            color: DARK 
          }}>
            {getGreeting()}
          </h1>

          
          {/* ------------------------------------------ */}
          {/* HERO - Organise une partie                */}
          {/* ------------------------------------------ */}
          <div className="hero-card" style={{ 
            background: DARK_GRADIENT, 
            borderRadius: 16, 
            padding: '24px',
            marginBottom: 20
          }}>
            <div className="hero-content">
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                  Organise une partie
                </h2>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
                  Invite tes amis à jouer au padel
                </p>
              </div>
              <Link href="/dashboard/matches/create" className="create-btn" style={{ 
                padding: '12px 24px', 
                background: GREEN_GRADIENT, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 10, 
                fontSize: 14, 
                fontWeight: 700, 
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                whiteSpace: 'nowrap'
              }}>
                + Créer une partie
              </Link>
            </div>
          </div>

          {/* ------------------------------------------ */}
          {/* MES PROCHAINES PARTIES                    */}
          {/* ------------------------------------------ */}
          {myUpcomingMatches.length > 0 && (
            <div style={{ 
              background: '#fff', 
              borderRadius: 14, 
              padding: 20,
              border: '1px solid #e5e7eb',
              marginBottom: 20
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: DARK }}>
                  🗓️ Tes prochaines parties
                </h2>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {myUpcomingMatches.length} partie{myUpcomingMatches.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Grille des 3 premières parties */}
              <div className="matches-grid">
                {visibleMatches.map((match) => {
                  const isOrganizer = match.organizer_id === user?.id
                  const players = getMatchPlayers(match)
                  const allSlots = [...players]
                  while (allSlots.length < 4) allSlots.push(null)
                  
                  return (
                    <Link href={`/dashboard/match/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                      <div className="match-card" style={{ 
                        background: '#f8fafc', 
                        borderRadius: 12, 
                        padding: 16,
                        border: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        height: '100%'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(match.match_date)}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: DARK }}>{formatTime(match.match_time)}</div>
                          </div>
                          {isOrganizer && (
                            <span style={{ 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              padding: '3px 8px', 
                              borderRadius: 6, 
                              fontSize: 10, 
                              fontWeight: 600,
                              height: 'fit-content'
                            }}>👑</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                          📍 {getMatchLocation(match)}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {allSlots.map((player, idx) => (
                            <Avatar key={idx} player={player} size={28} index={idx} />
                          ))}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Parties supplémentaires (compactes) */}
              {showAllMatches && hiddenMatches.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8,
                  paddingTop: 12,
                  marginTop: 12,
                  borderTop: '1px solid #f1f5f9'
                }}>
                  {hiddenMatches.map((match) => {
                    const isOrganizer = match.organizer_id === user?.id
                    const players = getMatchPlayers(match)
                    const allSlots = [...players]
                    while (allSlots.length < 4) allSlots.push(null)
                    
                    return (
                      <Link href={`/dashboard/match/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 14,
                          padding: '10px 14px',
                          background: '#fafafa',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}>
                          <div style={{ minWidth: 70 }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{formatDate(match.match_date)}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{formatTime(match.match_time)}</div>
                          </div>
                          <div style={{ flex: 1, fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {getMatchLocation(match)}
                          </div>
                          {isOrganizer && (
                            <span style={{ 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 9, 
                              fontWeight: 600 
                            }}>👑</span>
                          )}
                          <div style={{ display: 'flex' }}>
                            {allSlots.map((player, idx) => (
                              <Avatar key={idx} player={player} size={24} overlap index={idx} />
                            ))}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Bouton Voir plus */}
              {myUpcomingMatches.length > 3 && (
                <button 
                  onClick={() => setShowAllMatches(!showAllMatches)}
                  style={{ 
                    width: '100%',
                    marginTop: 12,
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {showAllMatches 
                    ? '← Voir moins' 
                    : `Voir ${hiddenMatches.length} autre${hiddenMatches.length > 1 ? 's' : ''} partie${hiddenMatches.length > 1 ? 's' : ''} →`
                  }
                </button>
              )}
            </div>
          )}

{/* ------------------------------------------ */}
          {/* CENTRE D'ACTIONS                          */}
          {/* ------------------------------------------ */}
          {(pendingActions.requestsToReview.length > 0 || pendingActions.invitesToFollow.length > 0) && (
            <div style={{ 
              background: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: 14, 
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12 
              }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#92400e' }}>
                  Actions en attente
                </h2>
                <span style={{ 
                  background: '#f59e0b', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: 10, 
                  fontSize: 11, 
                  fontWeight: 600 
                }}>
                  {pendingActions.requestsToReview.length + pendingActions.invitesToFollow.length}
                </span>
              </div>

              {/* Demandes à valider */}
              {pendingActions.requestsToReview.length > 0 && (
                <div style={{ marginBottom: pendingActions.invitesToFollow.length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                    📬 Demandes à valider
                  </div>
                  {pendingActions.requestsToReview.map(req => (
                    <div key={req.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: 10, 
                      background: '#fff', 
                      borderRadius: 8, 
                      marginBottom: 6,
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', 
                          background: getAvatarColor(req.profiles?.name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0
                        }}>
                          {req.profiles?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.profiles?.name || 'Joueur'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {formatDate(req.matches?.match_date)} · {req.matches?.clubs?.name || 'Match'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => acceptRequest(req)} style={{ 
                          padding: '6px 10px', background: '#22c55e', color: '#fff', 
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' 
                        }}>✓</button>
                        <button onClick={() => refuseRequest(req)} style={{ 
                          padding: '6px 10px', background: '#f1f5f9', color: '#64748b', 
                          border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' 
                        }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Invités à relancer */}
              {pendingActions.invitesToFollow.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                    ⏳ Invités en attente
                  </div>
                  {pendingActions.invitesToFollow.map(inv => (
                    <div key={inv.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: 10, 
                      background: '#fff', 
                      borderRadius: 8, 
                      marginBottom: 6,
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', 
                          border: '2px dashed #f59e0b',
                          background: 'rgba(245,158,11,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 600, color: '#f59e0b', flexShrink: 0
                        }}>
                          {inv.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: DARK, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {inv.name || 'Invité'}
                            {inv.daysSince >= 2 && (
                              <span style={{ 
                                background: '#fef2f2', 
                                color: '#dc2626', 
                                padding: '1px 6px', 
                                borderRadius: 4, 
                                fontSize: 9, 
                                fontWeight: 600 
                              }}>
                                {inv.daysSince}j
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {formatDate(inv.matches?.match_date)} · {inv.matches?.clubs?.name || 'Match'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Link href={`/dashboard/match/${inv.match_id}`} style={{ 
                          padding: '6px 10px', background: '#f59e0b', color: '#fff', 
                          border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, 
                          cursor: 'pointer', textDecoration: 'none' 
                        }}>Voir</Link>
                        <button onClick={() => cancelInvite(inv)} style={{ 
                          padding: '6px 10px', background: '#f1f5f9', color: '#64748b', 
                          border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' 
                        }}>Libérer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ------------------------------------------ */}
          {/* PARTIES À REJOINDRE                       */}
          {/* ------------------------------------------ */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 14, 
            padding: 20,
            border: '1px solid #e5e7eb',
            marginBottom: 20
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 14 
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: DARK }}>
                🔥 Parties à rejoindre
              </h2>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                {filteredAvailable.length} disponible{filteredAvailable.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Filtres */}
            <div className="filters-row" style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 16,
              overflowX: 'auto',
              paddingBottom: 4
            }}>
              {/* Filtre Ville */}
              {cities.length > 0 && (
                <select 
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    border: `1px solid ${filterCity !== 'all' ? DARK : '#e5e7eb'}`,
                    borderRadius: 8,
                    background: filterCity !== 'all' ? DARK : '#fff',
                    color: filterCity !== 'all' ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <option value="all">📍 Toutes villes</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Filtres Date */}
              {[
                { id: 'week', label: 'Cette semaine' },
                { id: 'today', label: "Aujourd'hui" },
                { id: 'tomorrow', label: 'Demain' },
                { id: 'weekend', label: 'Week-end' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFilterDate(f.id)}
                  style={{
                    padding: '8px 14px',
                    background: filterDate === f.id ? DARK : '#fff',
                    color: filterDate === f.id ? '#fff' : '#64748b',
                    border: `1px solid ${filterDate === f.id ? DARK : '#e5e7eb'}`,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste des parties */}
            {filteredAvailable.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f8fafc',
                borderRadius: 12
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎾</div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  Aucune partie trouvée
                </h4>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Essaie d'élargir tes filtres
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredAvailable.map(match => {
                  const players = getMatchPlayers(match)
                  const allSlots = [...players]
                  while (allSlots.length < 4) allSlots.push(null)
                  const spotsLeft = 4 - players.length
                  const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                  
                  return (
                    <Link href={`/join/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                      <div className="available-card" style={{ 
                        background: '#fff', 
                        borderRadius: 12, 
                        padding: 14,
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s'
                      }}>
                        {/* Badge Date/Heure */}
                        <div style={{ 
                          background: DARK_GRADIENT, 
                          borderRadius: 10, 
                          padding: '12px 14px',
                          color: '#fff',
                          textAlign: 'center',
                          minWidth: 70,
                          flexShrink: 0
                        }}>
                          <div style={{ fontSize: 10, opacity: 0.8 }}>{formatDate(match.match_date)}</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{formatTime(match.match_time)}</div>
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 14, 
                            color: DARK, 
                            marginBottom: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {getMatchLocation(match)}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ 
                              background: '#f1f5f9', 
                              padding: '3px 8px', 
                              borderRadius: 5, 
                              fontSize: 11,
                              color: '#475569'
                            }}>
                              ⭐ {match.level_min}-{match.level_max}
                            </span>
                            <span style={{ fontSize: 12 }}>{ambiance.emoji} {ambiance.label}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                            Par {match.profiles?.name?.split(' ')[0] || 'Anonyme'}
                          </div>
                        </div>

                        {/* Avatars + places */}
                        <div className="card-right" style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'flex-end', 
                          gap: 6,
                          flexShrink: 0
                        }}>
                          <div style={{ display: 'flex' }}>
                            {allSlots.map((player, idx) => (
                              <Avatar key={idx} player={player} size={32} overlap index={idx} />
                            ))}
                          </div>
                          <span style={{ 
                            fontSize: 11, 
                            color: '#22c55e',
                            fontWeight: 600
                          }}>
                            {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Boîte à idées - Mobile */}
          <div className="ideas-mobile">
            <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff',
                borderRadius: 14,
                padding: 16,
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>Boîte à idées</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Propose des améliorations</div>
                </div>
                <span style={{ color: '#94a3b8', fontSize: 18 }}>›</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ============================================ */}
        {/* SIDEBAR                                     */}
        {/* ============================================ */}
        <aside className="sidebar">
          
          {/* Profil */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 14, 
            padding: 18,
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            marginBottom: 16
          }}>
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              background: profile?.avatar_url ? '#f1f5f9' : getAvatarColor(profile?.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 22,
              margin: '0 auto 10px',
              overflow: 'hidden'
            }}>
              {profile?.avatar_url 
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile?.name?.[0]?.toUpperCase()
              }
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{profile?.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              Niveau {profile?.level || '?'} · {profile?.city || 'Non renseigné'}
            </div>
            
            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { n: stats.total, l: 'Jouées' },
                { n: stats.organized, l: 'Orga.' },
                { n: stats.wins, l: 'Wins' }
              ].map(s => (
                <div key={s.l} style={{ 
                  background: '#f8fafc', 
                  borderRadius: 8, 
                  padding: '10px 6px'
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{s.n}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Joueurs favoris */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 14, 
            padding: 18,
            border: '1px solid #e5e7eb',
            marginBottom: 16
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: DARK }}>
                ⭐ Joueurs favoris
              </h3>
              <Link href="/dashboard/joueurs" style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                Voir
              </Link>
            </div>
            
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Aucun favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {favoritePlayers.map((player, i) => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10,
                      cursor: 'pointer'
                    }}>
                      <Avatar player={player} size={36} index={i} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{player.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Niv. {player.level}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Boîte à idées */}
          <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#fff', 
              borderRadius: 14, 
              padding: 16,
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: 24 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Boîte à idées</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Propose des améliorations</div>
              </div>
              <span style={{ color: '#94a3b8' }}>›</span>
            </div>
          </Link>
        </aside>
      </div>

      <style jsx global>{`
        .page-container {
          display: flex;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .main-column {
          flex: 1;
          min-width: 0;
        }
        
        .sidebar {
          width: 280px;
          flex-shrink: 0;
          display: none;
        }
        
        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .create-btn {
          align-self: flex-start;
        }
        
        .matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .match-card:hover {
          border-color: #d1d5db !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .available-card:hover {
          border-color: #d1d5db !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .ideas-mobile {
          display: block;
        }
        
        .filters-row {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .filters-row::-webkit-scrollbar {
          display: none;
        }
        
        /* Tablet */
        @media (min-width: 640px) {
          .matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .hero-content {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        
        /* Desktop */
        @media (min-width: 1024px) {
          .sidebar {
            display: block;
          }
          
          .matches-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .ideas-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  )
}