'use client'

/**
 * ============================================
 * PAGE PARTIES - STYLE WARM + AMÉLIORÉ
 * ============================================
 * 
 * Design Warm :
 * - Fond chaud #f9f8f6 (blanc cassé)
 * - Coins extra arrondis (28px)
 * - Cards avec header date séparé
 * - Ombres douces
 * - Plus de respiration
 * 
 * Mobile-first responsive
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === DESIGN TOKENS WARM ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Interface - tons chauds
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds - CHAUDS
  bg: '#f9f8f6',        // Fond page - blanc cassé chaud
  bgSoft: '#f5f4f2',    // Blocs secondaires
  card: '#ffffff',
  cardHover: '#faf9f7',
  
  // Borders - doux
  border: '#eae8e4',
  borderLight: '#f3f2ef',
  
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

  // === HELPERS ===
  function getGreeting() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    if (hour < 12) return `Bonjour ${firstName} 👋`
    if (hour < 18) return `Salut ${firstName} 👋`
    return `Bonsoir ${firstName} 👋`
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return { day: '?', num: '?', month: '' }
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
    
    let dayLabel = dayNames[date.getDay()]
    if (date.toDateString() === today.toDateString()) dayLabel = "Auj"
    if (date.toDateString() === tomorrow.toDateString()) dayLabel = "Dem"
    
    return {
      day: dayLabel,
      num: date.getDate().toString(),
      month: monthNames[date.getMonth()]
    }
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

  function getFirstName(name) { return name?.split(' ')[0] || '' }

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

  // === COMPOSANTS WARM ===
  
  // Avatar - carré arrondi
  function Avatar({ player, index = 0, size = 'normal' }) {
    const bgColor = PLAYER_COLORS[index % 4]
    const sizes = {
      large: { w: '100%', h: undefined, aspect: '1', radius: 18, font: 22 },
      normal: { w: 48, h: 48, radius: 14, font: 18 },
      small: { w: 40, h: 40, radius: 12, font: 16 },
      mini: { w: 32, h: 32, radius: 10, font: 14 },
    }
    const s = sizes[size] || sizes.normal
    
    if (!player) {
      return (
        <div style={{
          width: s.w,
          height: s.h,
          aspectRatio: s.aspect,
          borderRadius: s.radius,
          background: COLORS.bgSoft,
          border: `2px dashed ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.muted,
          fontSize: s.font,
          fontWeight: 600,
          flexShrink: 0
        }}>?</div>
      )
    }
    
    return (
      <div className="avatar-slot" style={{
        width: s.w,
        height: s.h,
        aspectRatio: s.aspect,
        borderRadius: s.radius,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontSize: s.font,
        fontWeight: 700,
        flexShrink: 0
      }}>
        {player.name?.[0]?.toUpperCase()}
      </div>
    )
  }

  // Match Card WARM - avec header date séparé
  function MatchCard({ match, isOrganizer = false }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = 4 - players.length
    const dateInfo = formatDateShort(match.match_date)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="match-card" style={{ 
          background: COLORS.card,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          height: '100%'
        }}>
          {/* Header avec date */}
          <div style={{
            background: COLORS.bgSoft,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                {dateInfo.day} {dateInfo.num}
              </span>
              <span style={{ fontSize: 12, color: COLORS.muted }}>{dateInfo.month}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: COLORS.ink, letterSpacing: -0.5 }}>
              {formatTime(match.match_time)}
            </span>
          </div>
          
          {/* Body */}
          <div style={{ padding: '16px 18px 18px' }}>
            {/* Location + badges */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 14,
              gap: 8
            }}>
              <div style={{ 
                fontSize: 13, 
                color: COLORS.gray,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1
              }}>
                📍 {getMatchLocation(match)}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {isOrganizer && (
                  <span style={{ 
                    background: COLORS.ink, color: COLORS.white,
                    padding: '4px 10px', borderRadius: 100, 
                    fontSize: 11, fontWeight: 700
                  }}>👑</span>
                )}
                {spotsLeft > 0 && (
                  <span style={{ 
                    background: COLORS.white, color: COLORS.gray,
                    padding: '4px 10px', borderRadius: 100, 
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${COLORS.border}`
                  }}>{spotsLeft} pl.</span>
                )}
              </div>
            </div>
            
            {/* Grille 4 avatars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {allSlots.map((player, idx) => (
                <Avatar key={idx} player={player} index={idx} size="large" />
              ))}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Liste item compact WARM
  function MatchListItem({ match, isOrganizer = false }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const dateInfo = formatDateShort(match.match_date)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="match-list-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          background: COLORS.card,
          borderRadius: 18,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 8px rgba(0,0,0,0.03)'
        }}>
          {/* Bloc date */}
          <div style={{
            background: COLORS.bgSoft,
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
            minWidth: 52,
            flexShrink: 0
          }}>
            <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, textTransform: 'uppercase' }}>
              {dateInfo.day}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.ink }}>{dateInfo.num}</div>
          </div>
          
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.ink }}>
                {formatTime(match.match_time)}
              </span>
              {isOrganizer && (
                <span style={{ fontSize: 12 }}>👑</span>
              )}
            </div>
            <div style={{ 
              fontSize: 13, 
              color: COLORS.muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {getMatchLocation(match)}
            </div>
          </div>
          
          {/* Avatars mini */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {allSlots.map((player, idx) => (
              <Avatar key={idx} player={player} index={idx} size="mini" />
            ))}
          </div>
        </div>
      </Link>
    )
  }

  // Available match item WARM
  function AvailableMatchItem({ match }) {
    const players = getMatchPlayers(match)
    const spotsLeft = 4 - players.length
    const dateInfo = formatDateShort(match.match_date)
    const organizerName = getFirstName(match.profiles?.name)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="available-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 4px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          borderRadius: 14,
          margin: '0 -4px'
        }}>
          {/* Bloc date */}
          <div style={{
            background: COLORS.bgSoft,
            borderRadius: 12,
            padding: '10px 12px',
            textAlign: 'center',
            minWidth: 52,
            flexShrink: 0
          }}>
            <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>{dateInfo.day}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.ink }}>{dateInfo.num}</div>
          </div>
          
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 2 }}>
              {formatTime(match.match_time)}
            </div>
            <div style={{ 
              fontSize: 13, 
              color: COLORS.muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {getMatchLocation(match)}
            </div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>
              par {organizerName}
            </div>
          </div>
          
          {/* Avatars */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {players.slice(0, 3).map((player, idx) => (
              <Avatar key={idx} player={player} index={idx} size="mini" />
            ))}
          </div>
          
          {/* Places */}
          <span style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: COLORS.gray,
            minWidth: 44,
            textAlign: 'right',
            flexShrink: 0
          }}>
            {spotsLeft} pl.
          </span>
        </div>
      </Link>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh', 
        gap: 20,
        background: COLORS.bg
      }}>
        <svg viewBox="0 0 100 100" style={{ width: 56, height: 56 }}>
          <line x1="15" y1="15" x2="45" y2="45" stroke={COLORS.p1} strokeWidth="10" strokeLinecap="round" className="seq-1" />
          <line x1="85" y1="15" x2="55" y2="45" stroke={COLORS.p2} strokeWidth="10" strokeLinecap="round" className="seq-2" />
          <line x1="15" y1="85" x2="45" y2="55" stroke={COLORS.p3} strokeWidth="10" strokeLinecap="round" className="seq-3" />
          <line x1="85" y1="85" x2="55" y2="55" stroke={COLORS.p4} strokeWidth="10" strokeLinecap="round" className="seq-4" />
        </svg>
        <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
        <style jsx>{`
          .seq-1, .seq-2, .seq-3, .seq-4 { animation: seqPulse 1.2s ease-in-out infinite; }
          .seq-1 { animation-delay: 0s; }
          .seq-2 { animation-delay: 0.15s; }
          .seq-3 { animation-delay: 0.3s; }
          .seq-4 { animation-delay: 0.45s; }
          @keyframes seqPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        `}</style>
      </div>
    )
  }

  // === RENDER ===
  return (
    <>
      <div className="page-container">
        
        <div className="main-column">
          
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: COLORS.ink }}>
                {getGreeting()}
              </h1>
              <p style={{ fontSize: 15, color: COLORS.gray, margin: 0 }}>
                {myUpcomingMatches.length} partie{myUpcomingMatches.length > 1 ? 's' : ''} à venir
              </p>
            </div>
            
            <Link href="/dashboard/matches/create" className="create-btn">
              <span className="create-btn-icon">+</span>
              <span className="create-btn-text">Créer une partie</span>
            </Link>
          </div>

          {/* ======================== */}
          {/* TES PROCHAINES PARTIES */}
          {/* ======================== */}
          {myUpcomingMatches.length > 0 && (
            <div className="section-card" style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 20 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🗓️</span>
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                    Tes prochaines parties
                  </h2>
                </div>
                <span style={{ 
                  background: COLORS.ink, 
                  color: COLORS.white,
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700
                }}>
                  {myUpcomingMatches.length}
                </span>
              </div>

              {/* Cards grille */}
              <div className="matches-grid">
                {visibleMatches.map((match) => (
                  <MatchCard key={match.id} match={match} isOrganizer={match.organizer_id === user?.id} />
                ))}
              </div>

              {/* Liste pour les suivantes */}
              {showAllMatches && hiddenMatches.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10, 
                  paddingTop: 20, 
                  marginTop: 20, 
                  borderTop: `1px solid ${COLORS.border}` 
                }}>
                  {hiddenMatches.map((match) => (
                    <MatchListItem key={match.id} match={match} isOrganizer={match.organizer_id === user?.id} />
                  ))}
                </div>
              )}

              {/* Bouton voir plus */}
              {hiddenMatches.length > 0 && (
                <button
                  onClick={() => setShowAllMatches(!showAllMatches)}
                  className="show-more-btn"
                >
                  {showAllMatches ? 'Voir moins ↑' : `Voir les ${hiddenMatches.length} autres ↓`}
                </button>
              )}
            </div>
          )}

          {/* ======================== */}
          {/* ACTIONS EN ATTENTE */}
          {/* ======================== */}
          {getTotalPendingActions() > 0 && (
            <div className="section-card section-actions" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>🔔</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                  Actions en attente
                </h3>
                <span style={{
                  background: COLORS.p1, color: COLORS.white,
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700
                }}>
                  {getTotalPendingActions()}
                </span>
              </div>
              
              {/* Demandes de joueurs */}
              {pendingActions.requestsToReview.map((req, idx) => (
                <div key={req.id} className="action-item">
                  <Avatar player={req.profiles} index={idx} size="small" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: COLORS.ink }}>
                      {getFirstName(req.profiles?.name)} veut rejoindre
                    </strong>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>
                      {formatDateShort(req.matches?.match_date).day} {formatDateShort(req.matches?.match_date).num} · {req.matches?.clubs?.name || 'Lieu à définir'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={(e) => { e.preventDefault(); acceptRequest(req) }} className="action-btn-primary">
                      OK
                    </button>
                    <button onClick={(e) => { e.preventDefault(); refuseRequest(req) }} className="action-btn-secondary">
                      Non
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Invitations sans réponse */}
              {pendingActions.invitesToFollow.map((inv, idx) => (
                <div key={inv.id} className="action-item">
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: COLORS.p2, color: COLORS.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, flexShrink: 0
                  }}>
                    {(inv.invitee_name || inv.invited_name)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: COLORS.ink }}>
                      {getFirstName(inv.invitee_name || inv.invited_name) || 'Invité'} n'a pas répondu
                    </strong>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>
                      Invité il y a {inv.daysSince} jours
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="action-btn-secondary">Relancer</button>
                    <button onClick={(e) => { e.preventDefault(); cancelInvite(inv) }} className="action-btn-secondary">
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======================== */}
          {/* PARTIES À REJOINDRE */}
          {/* ======================== */}
          <div className="section-card section-available">
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎾</span>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                  Parties à rejoindre
                </h2>
              </div>
              <Link href="/dashboard/explore" style={{ fontSize: 14, color: COLORS.ink, textDecoration: 'none', fontWeight: 600 }}>
                Voir tout →
              </Link>
            </div>

            {/* Filtres */}
            <div className="filters-row">
              {[
                { id: 'today', label: "Auj." },
                { id: 'tomorrow', label: 'Demain' },
                { id: 'week', label: 'Semaine' },
                { id: 'weekend', label: 'Weekend' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterDate(f.id)}
                  className={`filter-btn ${filterDate === f.id ? 'active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Liste */}
            {filteredAvailable.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: COLORS.gray, margin: 0, fontSize: 14 }}>Aucune partie disponible</p>
                <p style={{ color: COLORS.muted, margin: '6px 0 0', fontSize: 13 }}>Essaie un autre filtre</p>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                {filteredAvailable.slice(0, 5).map((match, i) => (
                  <div key={match.id} style={{
                    borderBottom: i < Math.min(filteredAvailable.length, 5) - 1 ? `1px solid ${COLORS.border}` : 'none'
                  }}>
                    <AvailableMatchItem match={match} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOÎTE À IDÉES - Mobile */}
          <Link href="/dashboard/ideas" className="ideas-mobile" style={{ textDecoration: 'none' }}>
            <div className="ideas-card-mobile">
              <span style={{ fontSize: 26 }}>💡</span>
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
          <div className="sidebar-card" style={{ textAlign: 'center', marginBottom: 16 }}>
            {/* Avatar profil */}
            <div style={{ 
              width: 72, height: 72, borderRadius: 22, 
              background: COLORS.p1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.white, fontWeight: 700, fontSize: 28,
              margin: '0 auto 14px'
            }}>
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{profile?.name}</div>
            <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 18 }}>
              {profile?.level || 'Niveau ?'} · {profile?.city || 'Ville ?'}
            </div>
            
            {/* Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 10,
              padding: '16px 0',
              borderTop: `1px solid ${COLORS.border}`
            }}>
              {[
                { n: stats.total, l: 'Parties' },
                { n: stats.organized, l: 'Orga' },
                { n: stats.wins, l: 'Victoires' }
              ].map((s) => (
                <div key={s.l}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{s.l}</div>
                </div>
              ))}
            </div>
            
            <Link href="/dashboard/me" style={{ 
              display: 'block',
              fontSize: 14, 
              color: COLORS.ink, 
              textDecoration: 'none', 
              fontWeight: 600,
              paddingTop: 14,
              borderTop: `1px solid ${COLORS.border}`
            }}>
              Voir mon profil →
            </Link>
          </div>

          {/* Joueurs favoris */}
          <div className="sidebar-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                ⭐ Joueurs favoris
              </h3>
              <Link href="/dashboard/joueurs" style={{ fontSize: 13, color: COLORS.ink, textDecoration: 'none', fontWeight: 600 }}>
                Voir
              </Link>
            </div>
            
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>Aucun favori pour l'instant</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {favoritePlayers.map((player, i) => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div className="favorite-row">
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: PLAYER_COLORS[i % 4],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: COLORS.white, fontSize: 16, fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {player.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>{player.level} · {player.city || ''}</div>
                      </div>
                      <span style={{ color: COLORS.muted }}>›</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Boîte à idées */}
          <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
            <div className="ideas-card">
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

      {/* === STYLES === */}
      <style jsx global>{`
        /* === BASE === */
        .page-container {
          display: flex;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
          min-height: calc(100vh - 80px);
        }
        
        .main-column { flex: 1; min-width: 0; }
        .sidebar { width: 300px; flex-shrink: 0; display: none; }
        
        /* === HEADER === */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .create-btn-icon {
          font-size: 18px;
          font-weight: 400;
        }
        
        /* === SECTIONS === */
        .section-card {
          background: ${COLORS.card};
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }
        
        .section-actions {
          border: 2px solid ${COLORS.ink};
        }
        
        /* === MATCHES GRID === */
        .matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        
        .match-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.08);
        }
        
        .match-list-item:hover {
          background: ${COLORS.bgSoft};
        }
        
        .available-item:hover {
          background: ${COLORS.bgSoft};
        }
        
        /* === SHOW MORE BTN === */
        .show-more-btn {
          width: 100%;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          color: ${COLORS.gray};
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.2s ease;
        }
        
        .show-more-btn:hover {
          background: ${COLORS.border};
        }
        
        /* === ACTION ITEMS === */
        .action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: ${COLORS.bgSoft};
          padding: 14px;
          border-radius: 16px;
          margin-bottom: 10px;
        }
        
        .action-item:last-child {
          margin-bottom: 0;
        }
        
        .action-btn-primary {
          background: ${COLORS.ink};
          color: ${COLORS.white};
          padding: 10px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        
        .action-btn-secondary {
          background: ${COLORS.white};
          color: ${COLORS.gray};
          padding: 10px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid ${COLORS.border};
          cursor: pointer;
        }
        
        /* === FILTERS === */
        .filters-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        
        .filters-row::-webkit-scrollbar { display: none; }
        
        .filter-btn {
          padding: 10px 16px;
          border-radius: 100px;
          border: none;
          background: ${COLORS.bgSoft};
          color: ${COLORS.gray};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .filter-btn.active {
          background: ${COLORS.ink};
          color: ${COLORS.white};
        }
        
        /* === SIDEBAR === */
        .sidebar-card {
          background: ${COLORS.card};
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }
        
        .favorite-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          margin: 0 -10px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .favorite-row:hover {
          background: ${COLORS.bgSoft};
        }
        
        .ideas-card {
          background: ${COLORS.card};
          border-radius: 18px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        
        .ideas-card:hover {
          background: ${COLORS.bgSoft};
        }
        
        /* === MOBILE IDEAS === */
        .ideas-mobile { 
          display: block;
          margin-top: 20px;
        }
        
        .ideas-card-mobile {
          background: ${COLORS.card};
          border-radius: 20px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
        }
        
        /* === AVATAR ANIMATIONS === */
        .avatar-slot {
          transition: transform 0.2s ease;
        }
        
        .match-card:hover .avatar-slot {
          transform: translateY(-2px);
        }
        
        /* === RESPONSIVE === */
        
        /* Tablet */
        @media (min-width: 640px) {
          .page-container {
            padding: 20px;
          }
          
          .matches-grid { 
            grid-template-columns: repeat(2, 1fr); 
          }
          
          .section-card {
            padding: 24px;
            border-radius: 28px;
          }
          
          .action-item {
            padding: 16px;
          }
        }
        
        /* Desktop */
        @media (min-width: 1024px) {
          .page-container {
            padding: 24px;
          }
          
          .sidebar { 
            display: block; 
          }
          
          .ideas-mobile { 
            display: none; 
          }
          
          .matches-grid { 
            grid-template-columns: repeat(2, 1fr); 
          }
          
          .create-btn-text {
            display: inline;
          }
        }
        
        /* Large desktop */
        @media (min-width: 1280px) {
          .matches-grid { 
            grid-template-columns: repeat(3, 1fr); 
          }
        }
        
        /* Small mobile */
        @media (max-width: 400px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .create-btn {
            justify-content: center;
          }
          
          .action-item {
            flex-wrap: wrap;
          }
          
          .action-item > div:last-child {
            width: 100%;
            margin-top: 10px;
            justify-content: flex-end;
          }
        }
      `}</style>
    </>
  )
}