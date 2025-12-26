'use client'

/**
 * ============================================
 * PAGE PARTIES - 2×2 BRAND
 * ============================================
 * 
 * Design sobre : interface noir/blanc/gris
 * Les SEULES couleurs = avatars des joueurs
 * 
 * Couleurs joueurs: Coral, Amber, Teal, Violet
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Interface sobre
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  light: '#d1d5db',
  
  // Backgrounds
  bg: '#f5f5f5',
  card: '#ffffff',
  cardHover: '#fafafa',
  subtle: '#f9fafb',
  
  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

export default function PartiesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [filterDate, setFilterDate] = useState('week')
  const [filterCity, setFilterCity] = useState('all')
  const [cities, setCities] = useState([])
  
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  
  const [pendingActions, setPendingActions] = useState({
    invitesForMe: [],
    requestsToReview: [],
    invitesToFollow: []
  })
  
  const [stats, setStats] = useState({ total: 0, organized: 0, wins: 0 })
  const [favoritePlayers, setFavoritePlayers] = useState([])

  useEffect(() => { loadData() }, [])

  // === LOGIQUE DATA (inchangée) ===
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

    const filteredAvailable = (availableResult.data || []).filter(m => 
      !m.match_participants?.some(p => p.user_id === userId)
    )
    setAvailableMatches(filteredAvailable)

    const citiesSet = new Set()
    filteredAvailable.forEach(m => { 
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city) 
    })
    setCities(Array.from(citiesSet).sort())
    if (profileData?.city) setFilterCity(profileData.city)

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

    const { data: pendingRequests } = await supabase
      .from('match_participants')
      .select(`*, matches!inner (id, match_date, match_time, clubs (name)), profiles!match_participants_user_id_fkey (id, name, avatar_url, level)`)
      .in('match_id', matchIds)
      .eq('status', 'pending')

    const { data: pendingInvites } = await supabase
      .from('pending_invites')
      .select(`*, matches!inner (id, match_date, match_time, clubs (name))`)
      .in('match_id', matchIds)
      .eq('status', 'pending')

    const invitesWithAge = (pendingInvites || []).map(inv => {
      const created = new Date(inv.created_at)
      const now = new Date()
      const hoursSince = Math.floor((now - created) / (1000 * 60 * 60))
      const daysSince = Math.floor(hoursSince / 24)
      return { ...inv, hoursSince, daysSince }
    })

    setPendingActions({
      invitesForMe: [],
      requestsToReview: pendingRequests || [],
      invitesToFollow: invitesWithAge.filter(i => i.daysSince >= 2)
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
    const wins = (pastResult.data || []).filter(p => p.matches?.winner).length
    setStats({ total: uniquePast.size, organized: organizedCount.count || 0, wins })
    setFavoritePlayers((favoritesResult.data || []).map(f => f.profiles).filter(Boolean))
  }

  // === HELPERS (inchangés) ===
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

  function formatTime(timeStr) { return timeStr ? timeStr.slice(0, 5) : 'Flexible' }
  function getMatchLocation(match) { return match.clubs?.name || match.city || 'Lieu à définir' }

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
    return pendingActions.requestsToReview.length + pendingActions.invitesToFollow.length
  }

  // Filtres
  const filteredAvailable = availableMatches.filter(match => {
    if (filterCity !== 'all') {
      const matchCity = (match.clubs?.city || match.city || '').toLowerCase()
      if (matchCity !== filterCity.toLowerCase()) return false
    }
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
  
  // Avatar - LA SEULE COULEUR
  function Avatar({ player, size = 40, overlap = false, index = 0 }) {
    const bgColor = PLAYER_COLORS[index % 4]
    
    if (!player) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: COLORS.bg, border: `2px dashed ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, color: COLORS.muted, fontWeight: 600,
          marginLeft: overlap && index > 0 ? -10 : 0,
          position: 'relative', zIndex: 4 - index, flexShrink: 0
        }}>?</div>
      )
    }
    
    return (
      <div className="avatar-hover" style={{
        width: size, height: size, borderRadius: '50%',
        background: player.avatar_url ? COLORS.bg : bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: COLORS.white,
        overflow: 'hidden', border: `3px solid ${COLORS.white}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginLeft: overlap && index > 0 ? -10 : 0,
        position: 'relative', zIndex: 4 - index, flexShrink: 0
      }}>
        {player.avatar_url 
          ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : player.name?.[0]?.toUpperCase()
        }
      </div>
    )
  }

  // Match Card - sobre
  function MatchCard({ match, isOrganizer = false }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = 4 - players.length
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="match-card" style={{ 
          background: COLORS.bg,
          borderRadius: 16, 
          padding: 20,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          height: '100%'
        }}>
          {/* Header: Date/Heure + Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 500, marginBottom: 2 }}>
                {formatDate(match.match_date)}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink, letterSpacing: -1 }}>
                {formatTime(match.match_time)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {isOrganizer && (
                <span style={{ 
                  background: COLORS.white, 
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.gray, 
                  padding: '5px 10px', borderRadius: 100, 
                  fontSize: 11, fontWeight: 600
                }}>👑 Orga</span>
              )}
              {spotsLeft > 0 && (
                <span style={{ 
                  background: COLORS.white, 
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.gray, 
                  padding: '5px 10px', borderRadius: 100, 
                  fontSize: 11, fontWeight: 600
                }}>{spotsLeft} place{spotsLeft > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div style={{ fontSize: 14, color: COLORS.gray, marginBottom: 16 }}>
            📍 {getMatchLocation(match)}
          </div>
          
          {/* 4 Avatars - seules couleurs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {allSlots.map((player, idx) => (
              <Avatar key={idx} player={player} size={44} index={idx} />
            ))}
          </div>
        </div>
      </Link>
    )
  }

  // Liste item - sobre
  function MatchListItem({ match, isOrganizer = false }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="match-list-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 16px',
          background: COLORS.bg,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          {/* Date/Heure */}
          <div style={{ textAlign: 'center', minWidth: 55 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>{formatDate(match.match_date)}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>{formatTime(match.match_time)}</div>
          </div>
          
          {/* Location */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getMatchLocation(match)}
            </div>
          </div>
          
          {/* Mini avatars */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {allSlots.map((player, idx) => (
              <Avatar key={idx} player={player} size={28} overlap={true} index={idx} />
            ))}
          </div>
          
          {/* Badge Orga */}
          {isOrganizer && (
            <span style={{ 
              background: COLORS.white, 
              border: `1px solid ${COLORS.border}`,
              color: COLORS.gray, 
              padding: '4px 8px', borderRadius: 100, 
              fontSize: 10, fontWeight: 600, flexShrink: 0
            }}>👑</span>
          )}
        </div>
      </Link>
    )
  }

  // Card parties disponibles
  function AvailableMatchCard({ match }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = match.spots_available || (4 - players.length)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="available-card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 16,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          {/* Date/Heure */}
          <div style={{ textAlign: 'center', minWidth: 50 }}>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 500 }}>{formatDate(match.match_date)}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>{formatTime(match.match_time)}</div>
          </div>
          
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 2 }}>
              {getMatchLocation(match)}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>
              par {match.profiles?.name?.split(' ')[0] || 'Anonyme'}
            </div>
          </div>
          
          {/* Mini avatars */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {allSlots.map((player, idx) => (
              <Avatar key={idx} player={player} size={24} overlap={true} index={idx} />
            ))}
          </div>
          
          {/* Places */}
          <span style={{ 
            fontSize: 12, fontWeight: 600, color: COLORS.gray,
            whiteSpace: 'nowrap'
          }}>
            {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
          </span>
        </div>
      </Link>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((color, i) => (
            <div key={i} className="dot-loading" style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
          ))}
        </div>
        <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
      </div>
    )
  }

  // === RENDER ===
  return (
    <>
      <div className="page-container">
        
        <div className="main-column">
          
          {/* Greeting */}
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px', color: COLORS.ink }}>
            {getGreeting()}
          </h1>

          {/* ======================== */}
          {/* HERO - SOBRE */}
          {/* ======================== */}
          <div style={{ 
            background: COLORS.card,
            borderRadius: 20, 
            border: `1px solid ${COLORS.border}`,
            padding: 24,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap'
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' }}>
                Organise une partie
              </h2>
              <p style={{ fontSize: 14, color: COLORS.gray, margin: 0 }}>
                Invite tes potes à jouer
              </p>
            </div>
            
            <Link href="/dashboard/matches/create" style={{ 
              padding: '14px 28px', 
              background: COLORS.ink, 
              color: COLORS.white, 
              borderRadius: 100, 
              fontSize: 15, 
              fontWeight: 700, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}>
              + Créer une partie
            </Link>
          </div>

          {/* ======================== */}
          {/* TES PROCHAINES PARTIES */}
          {/* ======================== */}
          {myUpcomingMatches.length > 0 && (
            <div style={{ 
              background: COLORS.card,
              borderRadius: 20, 
              border: `1px solid ${COLORS.border}`,
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                  🗓️ Tes prochaines parties
                </h2>
                <span style={{ 
                  background: COLORS.bg, 
                  color: COLORS.ink,
                  padding: '4px 12px', borderRadius: 100,
                  fontSize: 13, fontWeight: 600
                }}>
                  {myUpcomingMatches.length}
                </span>
              </div>

              {/* Cards pour les 3 premières */}
              <div className="matches-grid">
                {visibleMatches.map((match) => (
                  <MatchCard key={match.id} match={match} isOrganizer={match.organizer_id === user?.id} />
                ))}
              </div>

              {/* Liste simplifiée pour les suivantes */}
              {showAllMatches && hiddenMatches.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 8, 
                  paddingTop: 16, 
                  marginTop: 16, 
                  borderTop: `1px solid ${COLORS.border}` 
                }}>
                  {hiddenMatches.map((match) => (
                    <MatchListItem key={match.id} match={match} isOrganizer={match.organizer_id === user?.id} />
                  ))}
                </div>
              )}

              {/* Bouton voir plus/moins */}
              {hiddenMatches.length > 0 && (
                <button
                  onClick={() => setShowAllMatches(!showAllMatches)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: COLORS.bg,
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.gray,
                    cursor: 'pointer',
                    marginTop: 16,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showAllMatches ? 'Voir moins ↑' : `Voir les ${hiddenMatches.length} autres parties ↓`}
                </button>
              )}
            </div>
          )}

          {/* ======================== */}
          {/* ACTIONS EN ATTENTE */}
          {/* ======================== */}
          {getTotalPendingActions() > 0 && (
            <div style={{ 
              background: COLORS.card,
              border: `2px solid ${COLORS.ink}`,
              borderRadius: 20, 
              padding: 20,
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 10 }}>
                  🔔 Actions en attente
                  <span style={{
                    background: COLORS.ink, color: COLORS.white,
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700
                  }}>
                    {getTotalPendingActions()}
                  </span>
                </h3>
              </div>
              
              {/* Demandes de joueurs */}
              {pendingActions.requestsToReview.map((req) => (
                <div key={req.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: COLORS.bg,
                  padding: '14px 16px',
                  borderRadius: 14,
                  marginBottom: 10
                }}>
                  <Avatar player={req.profiles} size={40} index={0} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: COLORS.ink }}>
                      {req.profiles?.name} veut rejoindre
                    </strong>
                    <span style={{ fontSize: 12, color: COLORS.gray }}>
                      {formatDate(req.matches?.match_date)} · {req.matches?.clubs?.name || 'Lieu à définir'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => acceptRequest(req)} style={{
                      background: COLORS.ink, color: COLORS.white,
                      padding: '8px 16px', borderRadius: 100,
                      fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer'
                    }}>Accepter</button>
                    <button onClick={() => refuseRequest(req)} style={{
                      background: COLORS.white, color: COLORS.gray,
                      padding: '8px 16px', borderRadius: 100,
                      fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.border}`, cursor: 'pointer'
                    }}>Refuser</button>
                  </div>
                </div>
              ))}
              
              {/* Invitations sans réponse */}
              {pendingActions.invitesToFollow.map((inv) => (
                <div key={inv.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: COLORS.bg,
                  padding: '14px 16px',
                  borderRadius: 14,
                  marginBottom: 10
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: COLORS.p2, color: COLORS.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700
                  }}>
                    {(inv.invitee_name || inv.invited_name)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: COLORS.ink }}>
                      {inv.invitee_name || inv.invited_name || 'Invité'} n'a pas répondu
                    </strong>
                    {inv.invitee_email && (
                      <span style={{ fontSize: 11, color: COLORS.gray, display: 'block' }}>
                        ✉️ {inv.invitee_email}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: COLORS.muted }}>
                      Invité il y a {inv.daysSince} jours · {formatDate(inv.matches?.match_date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{
                      background: COLORS.white, color: COLORS.gray,
                      padding: '8px 14px', borderRadius: 100,
                      fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.border}`, cursor: 'pointer'
                    }}>Relancer</button>
                    <button onClick={() => cancelInvite(inv)} style={{
                      background: COLORS.white, color: COLORS.gray,
                      padding: '8px 14px', borderRadius: 100,
                      fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.border}`, cursor: 'pointer'
                    }}>Annuler</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================== */}
          {/* PARTIES À REJOINDRE */}
          {/* ======================== */}
          <div style={{ 
            background: COLORS.card,
            borderRadius: 20, 
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
            marginBottom: 24
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                🎾 Parties à rejoindre
              </h2>
              <Link href="/dashboard/explore" style={{ fontSize: 13, color: COLORS.ink, textDecoration: 'none', fontWeight: 600 }}>
                Voir tout →
              </Link>
            </div>

            {/* Filtres */}
            <div className="filters-row" style={{ display: 'flex', gap: 8, padding: '16px 24px', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
              {[
                { id: 'today', label: "Aujourd'hui" },
                { id: 'tomorrow', label: 'Demain' },
                { id: 'week', label: 'Cette semaine' },
                { id: 'weekend', label: 'Weekend' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterDate(f.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 100,
                    border: 'none',
                    background: filterDate === f.id ? COLORS.ink : COLORS.bg,
                    color: filterDate === f.id ? COLORS.white : COLORS.gray,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste */}
            {filteredAvailable.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: COLORS.gray, margin: 0, fontSize: 15 }}>Aucune partie disponible pour le moment</p>
              </div>
            ) : (
              <div>
                {filteredAvailable.slice(0, 5).map(match => (
                  <AvailableMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>

          {/* BOÎTE À IDÉES - Mobile */}
          <Link href="/dashboard/ideas" className="ideas-mobile" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: COLORS.card,
              borderRadius: 16, 
              border: `1px solid ${COLORS.border}`,
              padding: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <span style={{ fontSize: 28 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>Boîte à idées</div>
                <div style={{ fontSize: 13, color: COLORS.gray }}>Propose des améliorations</div>
              </div>
              <span style={{ color: COLORS.muted, fontSize: 20 }}>›</span>
            </div>
          </Link>
        </div>

        {/* ======================== */}
        {/* SIDEBAR */}
        {/* ======================== */}
        <aside className="sidebar">
          
          {/* Profil Card */}
          <div style={{ 
            background: COLORS.card,
            borderRadius: 20, 
            border: `1px solid ${COLORS.border}`,
            padding: 24,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            {/* Avatar - seule couleur */}
            <div style={{ 
              width: 72, height: 72, borderRadius: '50%', 
              background: profile?.avatar_url ? COLORS.bg : COLORS.p1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.white, fontWeight: 700, fontSize: 28,
              margin: '0 auto 14px', overflow: 'hidden'
            }}>
              {profile?.avatar_url 
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile?.name?.[0]?.toUpperCase()
              }
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{profile?.name}</div>
            <div style={{ fontSize: 14, color: COLORS.gray, marginBottom: 18 }}>
              Niveau {profile?.level || '?'} · {profile?.city || 'Non renseigné'}
            </div>
            
            {/* Stats sobres - noir/blanc */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { n: stats.total, l: 'Matchs' },
                { n: stats.organized, l: 'Orga.' },
                { n: stats.wins, l: 'Wins' }
              ].map((s) => (
                <div key={s.l} style={{ background: COLORS.bg, borderRadius: 12, padding: '14px 8px' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Joueurs favoris */}
          <div style={{ 
            background: COLORS.card,
            borderRadius: 20, 
            border: `1px solid ${COLORS.border}`,
            padding: 20,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                ⭐ Joueurs favoris
              </h3>
              <Link href="/dashboard/activite" style={{ fontSize: 12, color: COLORS.ink, textDecoration: 'none', fontWeight: 600 }}>
                Voir
              </Link>
            </div>
            
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 14, color: COLORS.muted, margin: 0 }}>Aucun favori pour l'instant</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favoritePlayers.map((player, i) => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div className="player-row" style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      cursor: 'pointer', padding: 8, marginLeft: -8, marginRight: -8,
                      borderRadius: 12, transition: 'all 0.2s ease'
                    }}>
                      <Avatar player={player} size={42} index={i} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>Niv. {player.level} · {player.city || ''}</div>
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
              background: COLORS.card,
              borderRadius: 16, 
              border: `1px solid ${COLORS.border}`,
              padding: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <span style={{ fontSize: 24 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Boîte à idées</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>Propose des améliorations</div>
              </div>
              <span style={{ color: COLORS.muted }}>›</span>
            </div>
          </Link>
        </aside>
      </div>

      <style jsx global>{`
        @keyframes dot-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .dot-loading { animation: dot-loading 1.4s ease-in-out infinite; }
        .dot-loading:nth-child(1) { animation-delay: 0s; }
        .dot-loading:nth-child(2) { animation-delay: 0.1s; }
        .dot-loading:nth-child(3) { animation-delay: 0.2s; }
        .dot-loading:nth-child(4) { animation-delay: 0.3s; }

        .page-container {
          display: flex;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .main-column { flex: 1; min-width: 0; }
        .sidebar { width: 300px; flex-shrink: 0; display: none; }
        
        .matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .match-card:hover {
          background: #eee;
        }
        
        .match-list-item:hover {
          background: #eee;
        }
        
        .available-card:hover {
          background: ${COLORS.bg};
        }
        
        .avatar-hover { transition: transform 0.2s ease; }
        .avatar-hover:hover { transform: translateY(-3px); z-index: 10 !important; }
        
        .player-row:hover { background: ${COLORS.bg}; }
        
        .ideas-mobile { display: block; }
        
        .filters-row {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .filters-row::-webkit-scrollbar { display: none; }
        
        @media (min-width: 640px) {
          .matches-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (min-width: 1024px) {
          .sidebar { display: block; }
          .ideas-mobile { display: none; }
        }
        
        @media (min-width: 1200px) {
          .matches-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </>
  )
}