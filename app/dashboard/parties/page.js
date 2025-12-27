'use client'

/**
 * ============================================
 * PAGE PARTIES — REDESIGN COMPLET
 * ============================================
 * 
 * 3 sections seulement :
 * 1. Mes prochaines parties (avec avatars)
 * 2. Actions en attente (si présentes)
 * 3. Parties à rejoindre (scroll horizontal)
 * 
 * Design Warm + Avatars signature 2×2
 * Responsive : Mobile + Tablet + Desktop
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === DESIGN TOKENS ===
const COLORS = {
  // Players - Les 4 couleurs signature
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Interface
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds Warm
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  
  // Borders
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
  
  // Données principales
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [availableMatches, setAvailableMatches] = useState([])
  const [pendingActions, setPendingActions] = useState({
    invitesForMe: [],
    requestsToReview: [],
    invitesToFollow: []
  })
  
  // Filtres & UI
  const [filterDate, setFilterDate] = useState('week')
  const [filterCity, setFilterCity] = useState('all')
  const [cities, setCities] = useState([])
  const [showAllMyMatches, setShowAllMyMatches] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { loadData() }, [])

  // === DATA LOADING ===
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

    // Parties disponibles (filtrer celles où l'user participe déjà)
    const filteredAvailable = (availableResult.data || []).filter(m => 
      !m.match_participants?.some(p => p.user_id === userId)
    )
    setAvailableMatches(filteredAvailable)

    // Villes pour filtre
    const citiesSet = new Set()
    filteredAvailable.forEach(m => { 
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city) 
    })
    setCities(Array.from(citiesSet).sort())
    if (profileData?.city) setFilterCity(profileData.city)

    // Mes prochaines parties (organisées + participations)
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
  }

  async function loadPendingActions(userId, myMatches) {
    const matchIds = myMatches.map(m => m.id)
    if (matchIds.length === 0) {
      setPendingActions({ invitesForMe: [], requestsToReview: [], invitesToFollow: [] })
      return
    }

    const [pendingReq, pendingInv, invitesForMeRes] = await Promise.all([
      supabase
        .from('match_participants')
        .select(`*, matches!inner (id, match_date, match_time, clubs (name)), profiles!match_participants_user_id_fkey (id, name, avatar_url, level)`)
        .in('match_id', matchIds)
        .eq('status', 'pending'),
      supabase
        .from('pending_invites')
        .select(`*, matches!inner (id, match_date, match_time, clubs (name))`)
        .in('match_id', matchIds)
        .eq('status', 'pending'),
      supabase
        .from('match_participants')
        .select(`*, matches!inner (id, match_date, match_time, organizer_id, clubs (name), profiles!matches_organizer_id_fkey (name))`)
        .eq('user_id', userId)
        .eq('status', 'invited')
    ])

    const invitesWithAge = (pendingInv.data || []).map(inv => {
      const created = new Date(inv.created_at)
      const now = new Date()
      const hoursSince = Math.floor((now - created) / (1000 * 60 * 60))
      const daysSince = Math.floor(hoursSince / 24)
      return { ...inv, hoursSince, daysSince }
    })

    setPendingActions({
      invitesForMe: invitesForMeRes.data || [],
      requestsToReview: pendingReq.data || [],
      invitesToFollow: invitesWithAge.filter(i => i.daysSince >= 2)
    })
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

  async function acceptInvite(inv) {
    await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', inv.id)
    loadData()
  }

  async function declineInvite(inv) {
    await supabase.from('match_participants').delete().eq('id', inv.id)
    loadData()
  }

  async function cancelInvite(invite) {
    await supabase.from('pending_invites').delete().eq('id', invite.id)
    loadData()
  }

  // === HELPERS ===
  function getGreeting() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    if (hour < 12) return `Bonjour ${firstName}`
    if (hour < 18) return `Salut ${firstName}`
    return `Bonsoir ${firstName}`
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return { day: '—', num: '—', month: '' }
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return { day: "Auj.", num: date.getDate(), month: '' }
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return { day: 'Dem.', num: date.getDate(), month: '' }
    }
    return { 
      day: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      num: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    }
  }

  function formatTime(timeStr) { return timeStr ? timeStr.slice(0, 5) : 'Flexible' }
  function getMatchLocation(match) { return match.clubs?.name || match.city || 'Lieu à définir' }
  function getFirstName(name) { return name?.split(' ')[0] || '' }

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

  function getTotalPendingActions() {
    return pendingActions.requestsToReview.length + 
           pendingActions.invitesToFollow.length + 
           pendingActions.invitesForMe.length
  }

  // === FILTRES ===
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

  const visibleMyMatches = showAllMyMatches ? myUpcomingMatches : myUpcomingMatches.slice(0, 3)

  // === COMPOSANTS ===
  
  // Logo 4 dots
  function FourDots({ size = 10, gap = 4 }) {
    return (
      <div style={{ display: 'flex', gap }}>
        {PLAYER_COLORS.map((color, i) => (
          <div key={i} style={{ width: size, height: size, borderRadius: '50%', background: color }} />
        ))}
      </div>
    )
  }

  // Avatar avec nom
  function AvatarWithName({ player, index, size = 'normal' }) {
    const bgColor = PLAYER_COLORS[index % 4]
    const sizes = {
      large: { box: 56, radius: 16, font: 24, name: 11 },
      normal: { box: 48, radius: 14, font: 20, name: 10 },
      small: { box: 40, radius: 12, font: 16, name: 9 },
      mini: { box: 32, radius: 10, font: 14, name: 0 }
    }
    const s = sizes[size] || sizes.normal

    if (!player) {
      return (
        <div className="avatar-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: s.box,
            height: s.box,
            borderRadius: s.radius,
            background: COLORS.bgSoft,
            border: `2px dashed ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.muted,
            fontSize: s.font,
            fontWeight: 600
          }}>?</div>
          {s.name > 0 && <span style={{ fontSize: s.name, color: COLORS.muted }}>—</span>}
        </div>
      )
    }

    return (
      <div className="avatar-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div className="avatar-box" style={{
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.white,
          fontSize: s.font,
          fontWeight: 700,
          boxShadow: `0 4px 12px ${bgColor}50`,
          transition: 'transform 0.2s ease'
        }}>
          {player.name?.[0]?.toUpperCase() || '?'}
        </div>
        {s.name > 0 && (
          <span style={{ 
            fontSize: s.name, 
            color: COLORS.gray, 
            fontWeight: 600,
            maxWidth: s.box + 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}>
            {getFirstName(player.name)}
          </span>
        )}
      </div>
    )
  }

  // Card de match (mes parties)
  function MatchCard({ match, isFirst = false }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = 4 - players.length
    const isOrganizer = match.organizer_id === user?.id
    
    // Couleur de la barre
    const barColor = spotsLeft === 0 ? COLORS.p3 : isOrganizer ? COLORS.p2 : COLORS.p1

    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="match-card" style={{
          background: COLORS.card,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {/* Barre de couleur */}
          <div style={{ width: 5, background: barColor, flexShrink: 0 }} />
          
          {/* Contenu */}
          <div style={{ flex: 1, padding: isFirst ? '20px 22px' : '16px 20px' }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 14
            }}>
              <div>
                <div style={{ fontSize: 13, color: COLORS.gray, fontWeight: 600, marginBottom: 4 }}>
                  {formatDate(match.match_date)}
                </div>
                <div style={{ 
                  fontSize: isFirst ? 38 : 32, 
                  fontWeight: 900, 
                  color: COLORS.ink,
                  letterSpacing: -2,
                  lineHeight: 1
                }}>
                  {formatTime(match.match_time)}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {isOrganizer && (
                  <span style={{ 
                    background: COLORS.p2,
                    color: COLORS.white,
                    padding: '5px 10px', 
                    borderRadius: 100, 
                    fontSize: 11, 
                    fontWeight: 700
                  }}>👑 Orga</span>
                )}
                {spotsLeft > 0 ? (
                  <span style={{ 
                    background: COLORS.bgSoft,
                    color: COLORS.gray,
                    padding: '5px 10px', 
                    borderRadius: 100, 
                    fontSize: 11, 
                    fontWeight: 600
                  }}>{spotsLeft} pl.</span>
                ) : (
                  <span style={{ 
                    background: COLORS.p3,
                    color: COLORS.white,
                    padding: '5px 10px', 
                    borderRadius: 100, 
                    fontSize: 11, 
                    fontWeight: 700
                  }}>Complet</span>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div style={{ 
              fontSize: 14, 
              color: COLORS.gray,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getMatchLocation(match)}
              </span>
            </div>
            
            {/* Avatars */}
            <div style={{ display: 'flex', gap: isFirst ? 12 : 10 }}>
              {allSlots.map((player, idx) => (
                <AvatarWithName key={idx} player={player} index={idx} size={isFirst ? 'large' : 'normal'} />
              ))}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Card d'action
  function ActionCard({ type, data }) {
    const isRequest = type === 'request'
    const isInviteForMe = type === 'inviteForMe'
    
    const name = isRequest ? data.profiles?.name : 
                 isInviteForMe ? data.matches?.profiles?.name : 
                 data.invitee_name || data.invited_name
    const avatarLetter = name?.[0]?.toUpperCase() || '?'
    const matchInfo = isRequest || isInviteForMe ? 
      `${formatDate(data.matches?.match_date)} · ${formatTime(data.matches?.match_time)}` :
      `Invité il y a ${data.daysSince}j`
    
    const color = isRequest ? COLORS.p3 : isInviteForMe ? COLORS.p4 : COLORS.p2

    return (
      <div style={{
        background: COLORS.card,
        borderRadius: 20,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        borderLeft: `4px solid ${color}`
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.white,
          flexShrink: 0
        }}>{avatarLetter}</div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>
            {isRequest ? `${getFirstName(name)} veut rejoindre` : 
             isInviteForMe ? `${getFirstName(name)} t'a invité` :
             `${getFirstName(name)} n'a pas répondu`}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            {matchInfo}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {isRequest && (
            <>
              <button onClick={(e) => { e.preventDefault(); acceptRequest(data) }} style={{
                padding: '10px 16px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: COLORS.p3,
                color: COLORS.white
              }}>✓</button>
              <button onClick={(e) => { e.preventDefault(); refuseRequest(data) }} style={{
                padding: '10px 16px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: COLORS.bgSoft,
                color: COLORS.gray
              }}>✗</button>
            </>
          )}
          {isInviteForMe && (
            <>
              <button onClick={(e) => { e.preventDefault(); acceptInvite(data) }} style={{
                padding: '10px 16px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: COLORS.p4,
                color: COLORS.white
              }}>Accepter</button>
              <button onClick={(e) => { e.preventDefault(); declineInvite(data) }} style={{
                padding: '10px 14px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: COLORS.bgSoft,
                color: COLORS.gray
              }}>✗</button>
            </>
          )}
          {type === 'pendingInvite' && (
            <button onClick={(e) => { e.preventDefault(); cancelInvite(data) }} style={{
              padding: '10px 14px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: COLORS.bgSoft,
              color: COLORS.p1
            }}>Annuler</button>
          )}
        </div>
      </div>
    )
  }

  // Card partie à rejoindre (scroll horizontal)
  function AvailableCard({ match }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = 4 - players.length
    const dateInfo = formatDateShort(match.match_date)
    const isUrgent = spotsLeft === 1
    
    // Couleur de la barre basée sur l'index
    const barColors = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]
    const barColor = barColors[match.id % 4] || COLORS.p1

    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div className="available-card" style={{
          width: 170,
          background: COLORS.card,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          flexShrink: 0
        }}>
          {/* Barre de couleur en haut */}
          <div style={{ height: 5, background: barColor }} />
          
          <div style={{ padding: 16 }}>
            {/* Date */}
            <div style={{ fontSize: 12, color: COLORS.gray, fontWeight: 600, marginBottom: 4 }}>
              {dateInfo.day} {dateInfo.num} {dateInfo.month}
            </div>
            
            {/* Heure */}
            <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.ink, letterSpacing: -1, marginBottom: 6 }}>
              {formatTime(match.match_time)}
            </div>
            
            {/* Lieu */}
            <div style={{ 
              fontSize: 12, 
              color: COLORS.muted, 
              marginBottom: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              📍 {getMatchLocation(match)}
            </div>
            
            {/* Avatars mini */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {allSlots.map((player, idx) => (
                <div key={idx} style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: player ? PLAYER_COLORS[idx % 4] : COLORS.bgSoft,
                  border: player ? 'none' : `2px dashed ${COLORS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: player ? COLORS.white : COLORS.muted,
                  fontSize: 14,
                  fontWeight: 700
                }}>
                  {player ? player.name?.[0]?.toUpperCase() : '?'}
                </div>
              ))}
            </div>
            
            {/* Places */}
            <div style={{
              padding: '8px 12px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
              background: isUrgent ? `${COLORS.p1}15` : COLORS.bgSoft,
              color: isUrgent ? COLORS.p1 : COLORS.gray
            }}>
              {isUrgent ? `🔥 ${spotsLeft} place !` : `${spotsLeft} places`}
            </div>
          </div>
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
        <div className="loading-dots">
          <FourDots size={12} gap={6} />
        </div>
        <span style={{ color: COLORS.gray, fontSize: 14 }}>Chargement...</span>
        
        <style jsx>{`
          .loading-dots { animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
        `}</style>
      </div>
    )
  }

  // === RENDER ===
  return (
    <div className="parties-page" style={{ background: COLORS.bg, minHeight: '100vh' }}>
      
      {/* === HEADER === */}
      <header style={{
        padding: '20px 20px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        background: COLORS.bg,
        zIndex: 10,
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <FourDots size={10} gap={4} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: COLORS.gray, fontWeight: 500 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <Link href="/dashboard/match/create" style={{ textDecoration: 'none' }}>
            <button style={{
              background: COLORS.ink,
              color: COLORS.white,
              border: 'none',
              padding: '10px 18px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              ➕ Créer
            </button>
          </Link>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: '0 20px 100px'
      }}>
        
        {/* === GREETING === */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.ink, margin: 0 }}>
            {getGreeting()} 👋
          </h1>
          <p style={{ fontSize: 14, color: COLORS.gray, marginTop: 4 }}>
            {myUpcomingMatches.length > 0 ? (
              <>Tu as <span style={{ color: COLORS.p1, fontWeight: 600 }}>{myUpcomingMatches.length} partie{myUpcomingMatches.length > 1 ? 's' : ''}</span> à venir</>
            ) : (
              "Prêt pour ta prochaine partie ?"
            )}
          </p>
        </div>

        {/* === LAYOUT RESPONSIVE === */}
        <div className="main-grid">
          
          {/* === COLONNE GAUCHE (Mes parties + Actions) === */}
          <div className="left-column">
            
            {/* === SECTION 1: MES PROCHAINES PARTIES === */}
            <section style={{ marginBottom: 32 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <h2 style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: COLORS.ink,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: 0
                }}>
                  📅 Mes prochaines parties
                </h2>
                {myUpcomingMatches.length > 3 && (
                  <button 
                    onClick={() => setShowAllMyMatches(!showAllMyMatches)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 13,
                      color: COLORS.gray,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {showAllMyMatches ? 'Réduire' : `Voir tout (${myUpcomingMatches.length})`} →
                  </button>
                )}
              </div>

              {myUpcomingMatches.length === 0 ? (
                <div style={{
                  background: COLORS.card,
                  borderRadius: 24,
                  padding: 40,
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
                  <p style={{ fontSize: 15, color: COLORS.gray, marginBottom: 20 }}>
                    Pas de partie prévue pour l'instant
                  </p>
                  <Link href="/dashboard/match/create" style={{ textDecoration: 'none' }}>
                    <button style={{
                      background: COLORS.ink,
                      color: COLORS.white,
                      border: 'none',
                      padding: '14px 24px',
                      borderRadius: 100,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>
                      ➕ Créer une partie
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {visibleMyMatches.map((match, idx) => (
                    <MatchCard key={match.id} match={match} isFirst={idx === 0} />
                  ))}
                </div>
              )}
            </section>

            {/* === SECTION 2: ACTIONS EN ATTENTE === */}
            {getTotalPendingActions() > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16
                }}>
                  <h2 style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: COLORS.ink,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    margin: 0
                  }}>
                    ⚡ En attente
                  </h2>
                  <span style={{
                    background: COLORS.p1,
                    color: COLORS.white,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 100
                  }}>{getTotalPendingActions()}</span>
                </div>

                {/* Invitations reçues */}
                {pendingActions.invitesForMe.map(inv => (
                  <ActionCard key={inv.id} type="inviteForMe" data={inv} />
                ))}

                {/* Demandes à traiter */}
                {pendingActions.requestsToReview.map(req => (
                  <ActionCard key={req.id} type="request" data={req} />
                ))}

                {/* Invitations sans réponse */}
                {pendingActions.invitesToFollow.map(inv => (
                  <ActionCard key={inv.id} type="pendingInvite" data={inv} />
                ))}
              </section>
            )}
          </div>

          {/* === COLONNE DROITE (Parties à rejoindre) === */}
          <div className="right-column">
            
            {/* === SECTION 3: PARTIES À REJOINDRE === */}
            <section>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <h2 style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: COLORS.ink,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: 0
                }}>
                  🎾 Parties à rejoindre
                </h2>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    background: showFilters ? COLORS.ink : 'none',
                    color: showFilters ? COLORS.white : COLORS.gray,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 100
                  }}
                >
                  🎚️ Filtres
                </button>
              </div>

              {/* Filtres */}
              {showFilters && (
                <div style={{ 
                  background: COLORS.card, 
                  borderRadius: 16, 
                  padding: 16, 
                  marginBottom: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {['week', 'today', 'tomorrow', 'weekend', 'all'].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterDate(f)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: filterDate === f ? COLORS.ink : COLORS.bgSoft,
                          color: filterDate === f ? COLORS.white : COLORS.gray
                        }}
                      >
                        {f === 'week' ? 'Cette semaine' : 
                         f === 'today' ? "Aujourd'hui" : 
                         f === 'tomorrow' ? 'Demain' : 
                         f === 'weekend' ? 'Weekend' : 'Tout'}
                      </button>
                    ))}
                  </div>
                  
                  {cities.length > 0 && (
                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: `1px solid ${COLORS.border}`,
                        fontSize: 13,
                        color: COLORS.ink,
                        background: COLORS.white
                      }}
                    >
                      <option value="all">Toutes les villes</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {filteredAvailable.length === 0 ? (
                <div style={{
                  background: COLORS.card,
                  borderRadius: 24,
                  padding: 40,
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 15, color: COLORS.gray, marginBottom: 8 }}>
                    Aucune partie disponible
                  </p>
                  <p style={{ fontSize: 13, color: COLORS.muted }}>
                    Essaie de modifier les filtres ou crée ta propre partie
                  </p>
                </div>
              ) : (
                <>
                  {/* Vue scroll horizontal sur mobile */}
                  <div className="available-scroll-mobile">
                    {filteredAvailable.map(match => (
                      <AvailableCard key={match.id} match={match} />
                    ))}
                  </div>
                  
                  {/* Vue grille sur desktop */}
                  <div className="available-grid-desktop">
                    {filteredAvailable.map(match => (
                      <AvailableCard key={match.id} match={match} />
                    ))}
                  </div>
                </>
              )}

              {filteredAvailable.length > 0 && (
                <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%',
                    padding: '14px',
                    background: COLORS.bgSoft,
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.gray,
                    cursor: 'pointer',
                    marginTop: 16
                  }}>
                    Explorer toutes les parties →
                  </button>
                </Link>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* === STYLES === */}
      <style jsx global>{`
        .parties-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
        }
        
        /* === LAYOUT RESPONSIVE === */
        .main-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .left-column, .right-column {
          width: 100%;
        }
        
        /* === SCROLL HORIZONTAL MOBILE === */
        .available-scroll-mobile {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin: 0 -20px;
          padding-left: 20px;
          padding-right: 20px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        
        .available-scroll-mobile::-webkit-scrollbar { display: none; }
        
        .available-scroll-mobile > * {
          scroll-snap-align: start;
        }
        
        .available-grid-desktop {
          display: none;
        }
        
        /* === HOVER EFFECTS === */
        .match-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        
        .match-card:hover .avatar-box {
          transform: translateY(-3px);
        }
        
        .available-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        /* === TABLET (640px+) === */
        @media (min-width: 640px) {
          .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            align-items: start;
          }
          
          .available-scroll-mobile {
            display: none;
          }
          
          .available-grid-desktop {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        
        /* === DESKTOP (1024px+) === */
        @media (min-width: 1024px) {
          .main-grid {
            grid-template-columns: 1.4fr 1fr;
            gap: 48px;
          }
          
          .available-grid-desktop {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* === LARGE DESKTOP (1280px+) === */
        @media (min-width: 1280px) {
          .available-grid-desktop {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}