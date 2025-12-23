'use client'

/**
 * ============================================
 * PAGE JOUEURS - JUNTO BRAND v2
 * ============================================
 * 
 * Carnet d'adresses du padeliste
 * Design: Combinaison A (Carnet) + C (Contextuel)
 * 
 * Logique:
 * - Si partie incomplète → Hero contextuel avec slots visuels
 * - Sinon → Mode carnet d'adresses classique
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// === JUNTO DESIGN TOKENS ===
const JUNTO = {
  coral: '#ff5a5f',
  coralSoft: '#fff0f0',
  coralGlow: 'rgba(255, 90, 95, 0.25)',
  slate: '#3d4f5f',
  slateSoft: '#f0f3f5',
  amber: '#ffb400',
  amberSoft: '#fff8e5',
  teal: '#00b8a9',
  tealSoft: '#e5f9f7',
  tealGlow: 'rgba(0, 184, 169, 0.25)',
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  white: '#ffffff',
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  border: '#e5e7eb',
}

const AVATAR_COLORS = [JUNTO.coral, JUNTO.slate, JUNTO.amber, JUNTO.teal]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

const POSITION_LABELS = {
  left: { label: 'Gauche', icon: '⬅️' },
  gauche: { label: 'Gauche', icon: '⬅️' },
  right: { label: 'Droite', icon: '➡️' },
  droite: { label: 'Droite', icon: '➡️' },
  both: { label: 'Polyvalent', icon: '↔️' },
}

export default function JoueursPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedMatchId = searchParams.get('match')
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('favoris')
  const [levelFilter, setLevelFilter] = useState('all')
  
  const [favoritePlayers, setFavoritePlayers] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [recentPlayers, setRecentPlayers] = useState([])
  const [nearbyPlayers, setNearbyPlayers] = useState([])
  
  const [incompleteMatch, setIncompleteMatch] = useState(null)
  const [matchPlayers, setMatchPlayers] = useState([])
  
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [myOpenMatches, setMyOpenMatches] = useState([])
  const [preselectedMatch, setPreselectedMatch] = useState(null)
  const [inviting, setInviting] = useState(false)
  
  const [toast, setToast] = useState(null)
  const [matchesTogether, setMatchesTogether] = useState({})

  // === DATA LOADING ===
  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPlayers()
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]
    
    // Partie incomplète où JE SUIS ORGANISATEUR
    const { data: myMatches } = await supabase
      .from('matches')
      .select(`
        id, match_date, match_time, spots_available, city, status,
        clubs (name),
        match_participants (user_id, team, status, profiles:user_id (id, name, avatar_url))
      `)
      .eq('organizer_id', session.user.id)
      .in('status', ['open', 'confirmed'])
      .gt('spots_available', 0)
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(1)

    if (myMatches && myMatches.length > 0) {
      const match = myMatches[0]
      setIncompleteMatch(match)
      const confirmedPlayers = (match.match_participants || [])
        .filter(p => p.status === 'confirmed' && p.profiles)
        .map(p => ({ ...p.profiles, team: p.team }))
      setMatchPlayers(confirmedPlayers)
    }

    // Favoris
    const { data: favoriteLinks } = await supabase
      .from('player_favorites')
      .select('favorite_user_id')
      .eq('user_id', session.user.id)

    let favoritesData = []
    const favIds = new Set((favoriteLinks || []).map(f => f.favorite_user_id))
    
    if (favIds.size > 0) {
      const { data: favProfiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, level, city, position')
        .in('id', Array.from(favIds))
      favoritesData = favProfiles || []
    }
    
    setFavoriteIds(favIds)
    setFavoritePlayers(favoritesData)

    // Compteur parties ensemble
    if (favIds.size > 0) {
      const matchesCount = {}
      for (const favId of favIds) {
        const { data: commonMatches } = await supabase
          .from('match_participants')
          .select('match_id')
          .eq('user_id', favId)
          .eq('status', 'confirmed')
        
        if (commonMatches && commonMatches.length > 0) {
          const favMatchIds = commonMatches.map(m => m.match_id)
          const { count } = await supabase
            .from('match_participants')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'confirmed')
            .in('match_id', favMatchIds)
          matchesCount[favId] = count || 0
        } else {
          matchesCount[favId] = 0
        }
      }
      setMatchesTogether(matchesCount)
    }

    if (favoritesData.length === 0) setActiveTab('pres')

    // Récents
    const { data: myParticipations } = await supabase
      .from('match_participants')
      .select('match_id, matches!inner(id, match_date)')
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .order('matches(match_date)', { ascending: false })
      .limit(20)

    const recentPlayersMap = new Map()
    const recentPlayersWithDate = []

    if (myParticipations && myParticipations.length > 0) {
      const matchIds = myParticipations.map(p => p.match_id)
      
      const { data: allParticipants } = await supabase
        .from('match_participants')
        .select('user_id, match_id')
        .in('match_id', matchIds)
        .eq('status', 'confirmed')
        .neq('user_id', session.user.id)

      const otherUserIds = [...new Set((allParticipants || []).map(p => p.user_id))]
      
      if (otherUserIds.length > 0) {
        const { data: recentProfiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, level, city, position')
          .in('id', otherUserIds)

        const profileMap = new Map((recentProfiles || []).map(p => [p.id, p]))
        const matchDateMap = new Map(myParticipations.map(p => [p.match_id, p.matches?.match_date]))

        ;(allParticipants || []).forEach(p => {
          if (!recentPlayersMap.has(p.user_id) && profileMap.has(p.user_id)) {
            recentPlayersMap.set(p.user_id, true)
            recentPlayersWithDate.push({
              ...profileMap.get(p.user_id),
              lastMatchDate: matchDateMap.get(p.match_id)
            })
          }
        })
      }
    }
    setRecentPlayers(recentPlayersWithDate.slice(0, 10))

    // Près de moi
    let nearbyQuery = supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, position')
      .neq('id', session.user.id)
      .limit(50)

    if (profileData?.city) {
      nearbyQuery = nearbyQuery.ilike('city', `%${profileData.city}%`)
    }

    const { data: nearby } = await nearbyQuery
    let sortedNearby = nearby || []
    if (profileData?.city) {
      sortedNearby.sort((a, b) => {
        const aMatch = a.city?.toLowerCase() === profileData.city?.toLowerCase()
        const bMatch = b.city?.toLowerCase() === profileData.city?.toLowerCase()
        return aMatch === bMatch ? 0 : aMatch ? -1 : 1
      })
    }
    setNearbyPlayers(sortedNearby)

    // Parties ouvertes
    const { data: openMatches } = await supabase
      .from('matches')
      .select('id, match_date, match_time, spots_available, clubs(name), city')
      .eq('organizer_id', session.user.id)
      .eq('status', 'open')
      .gt('spots_available', 0)
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(5)

    setMyOpenMatches(openMatches || [])

    if (preselectedMatchId) {
      const match = (openMatches || []).find(m => m.id.toString() === preselectedMatchId)
      if (match) setPreselectedMatch(match)
    }

    setLoading(false)
  }

  async function searchPlayers() {
    setIsSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, position')
      .neq('id', user?.id)
      .ilike('name', `%${searchQuery}%`)
      .limit(10)
    setSearchResults(data || [])
    setIsSearching(false)
  }

  // === ACTIONS ===
  async function toggleFavorite(playerId, e) {
    e?.stopPropagation()
    if (favoriteIds.has(playerId)) {
      await supabase.from('player_favorites').delete().eq('user_id', user.id).eq('favorite_user_id', playerId)
      setFavoriteIds(prev => { const next = new Set(prev); next.delete(playerId); return next })
      setFavoritePlayers(prev => prev.filter(p => p.id !== playerId))
    } else {
      await supabase.from('player_favorites').insert({ user_id: user.id, favorite_user_id: playerId })
      setFavoriteIds(prev => new Set([...prev, playerId]))
      const player = nearbyPlayers.find(p => p.id === playerId) || recentPlayers.find(p => p.id === playerId) || searchResults.find(p => p.id === playerId)
      if (player) setFavoritePlayers(prev => [...prev, player])
    }
  }

  function openInviteModal(player, e) {
    e?.stopPropagation()
    setSelectedPlayer(player)
    setShowInviteModal(true)
  }

  async function inviteToMatch(matchId) {
    if (!selectedPlayer) return
    setInviting(true)
    try {
      await supabase.from('match_participants').insert({ match_id: matchId, user_id: selectedPlayer.id, status: 'invited', invited_by: user.id })
      const match = myOpenMatches.find(m => m.id === matchId) || incompleteMatch
      if (match?.spots_available > 0) {
        await supabase.from('matches').update({ spots_available: match.spots_available - 1 }).eq('id', matchId)
      }
      const playerName = selectedPlayer.name?.split(' ')[0] || 'Le joueur'
      const matchDate = match ? formatMatchDate(match.match_date, match.match_time) : 'ta partie'
      showToast('success', `✅ ${playerName} a été invité(e) pour ${matchDate} !`)
      
      setShowInviteModal(false)
      setSelectedPlayer(null)
      loadData()
    } catch (err) {
      console.error('Erreur invitation:', err)
      showToast('error', '❌ Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  async function quickInvite(player, e) {
    e?.stopPropagation()
    if (!incompleteMatch) return
    setInviting(true)
    try {
      await supabase.from('match_participants').insert({ match_id: incompleteMatch.id, user_id: player.id, status: 'invited', invited_by: user.id })
      if (incompleteMatch.spots_available > 0) {
        await supabase.from('matches').update({ spots_available: incompleteMatch.spots_available - 1 }).eq('id', incompleteMatch.id)
      }
      const playerName = player.name?.split(' ')[0] || 'Le joueur'
      showToast('success', `✅ ${playerName} a été invité(e) !`)
      loadData()
    } catch (err) {
      console.error('Erreur invitation rapide:', err)
      showToast('error', '❌ Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  function createMatchWithPlayer() {
    if (!selectedPlayer) return
    setShowInviteModal(false)
    router.push(`/dashboard/matches/create?invite=${selectedPlayer.id}`)
  }

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // === HELPERS ===
  function formatMatchDate(dateStr, timeStr) {
    if (!dateStr) return 'Date flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    let dateText = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    if (date.toDateString() === today.toDateString()) dateText = "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) dateText = 'Demain'
    return `${dateText}${timeStr ? ' · ' + timeStr.slice(0,5) : ''}`
  }

  function formatRecentDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  function getFilteredNearbyPlayers() {
    if (levelFilter === 'all') return nearbyPlayers
    return nearbyPlayers.filter(p => {
      const level = p.level || 0
      switch (levelFilter) {
        case '3-4': return level >= 3 && level < 4.5
        case '4-5': return level >= 4 && level < 5.5
        case '5+': return level >= 5
        default: return true
      }
    })
  }

  function getAvatarColor(index) {
    return AVATAR_COLORS[index % 4]
  }

  // === COMPONENTS ===
  function Avatar({ player, size = 52, index = 0, onClick }) {
    const bgColor = getAvatarColor(index)
    
    if (!player?.name) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: JUNTO.bgSoft,
          border: `2px dashed ${JUNTO.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, color: JUNTO.muted,
          flexShrink: 0
        }}>+</div>
      )
    }
    
    if (player.avatar_url) {
      return (
        <img 
          src={player.avatar_url} 
          alt={player.name}
          onClick={onClick}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${bgColor}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: onClick ? 'pointer' : 'default',
            flexShrink: 0
          }}
        />
      )
    }
    
    return (
      <div 
        onClick={onClick}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.38, fontWeight: 700, 
          color: bgColor === JUNTO.amber ? JUNTO.ink : JUNTO.white,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0
        }}
      >
        {player.name[0].toUpperCase()}
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="junto-loading-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ color: JUNTO.gray }}>Chargement...</div>
        </div>
      </div>
    )
  }

  // === DERIVED DATA ===
  const isNewUser = favoritePlayers.length === 0 && recentPlayers.length === 0
  const spotsRemaining = incompleteMatch?.spots_available || 0

  let playersToShow = []
  if (searchQuery.length >= 2) playersToShow = searchResults
  else if (activeTab === 'favoris') playersToShow = favoritePlayers
  else if (activeTab === 'recents') playersToShow = recentPlayers
  else if (activeTab === 'pres') playersToShow = getFilteredNearbyPlayers()

  // === RENDER ===
  return (
    <div style={{ fontFamily: "'Satoshi', sans-serif", background: JUNTO.bg, minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* ======================== */}
        {/* HERO CONTEXTUEL */}
        {/* ======================== */}
        {incompleteMatch && (
          <div style={{
            display: 'flex',
            background: JUNTO.white,
            borderRadius: 24,
            border: `2px solid ${JUNTO.border}`,
            overflow: 'hidden',
            marginBottom: 24
          }}>
            <div style={{ width: 6, background: JUNTO.coral, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: JUNTO.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    🎾 Ta prochaine partie
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: JUNTO.ink, letterSpacing: -2, lineHeight: 1 }}>
                    {incompleteMatch.match_time?.slice(0, 5) || '--:--'}
                  </div>
                  <div style={{ fontSize: 14, color: JUNTO.gray, marginTop: 6 }}>
                    {formatMatchDate(incompleteMatch.match_date)} · {incompleteMatch.clubs?.name || incompleteMatch.city || 'Lieu à définir'}
                  </div>
                </div>
                <span style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  background: spotsRemaining > 0 ? JUNTO.amberSoft : JUNTO.tealSoft,
                  color: spotsRemaining > 0 ? '#92400e' : JUNTO.teal
                }}>
                  {spotsRemaining > 0 ? `Il manque ${spotsRemaining} joueur${spotsRemaining > 1 ? 's' : ''} !` : '✓ Partie complète'}
                </span>
              </div>
              
              {/* Slots joueurs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                {[0, 1, 2, 3].map(i => {
                  const player = i === 0 ? profile : matchPlayers[i - 1]
                  const isMe = i === 0
                  return (
                    <div key={i} style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: player ? getAvatarColor(i) : JUNTO.bgSoft,
                      border: player ? `3px solid ${JUNTO.white}` : `2px dashed ${JUNTO.border}`,
                      boxShadow: player ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: player ? 22 : 24, fontWeight: 700,
                      color: player ? (getAvatarColor(i) === JUNTO.amber ? JUNTO.ink : JUNTO.white) : JUNTO.muted,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {player ? (
                        player.avatar_url ? (
                          <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : player.name?.[0]?.toUpperCase()
                      ) : '+'}
                      {isMe && (
                        <div style={{
                          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                          background: JUNTO.coral, color: JUNTO.white,
                          fontSize: 9, padding: '2px 8px', borderRadius: 6, fontWeight: 700
                        }}>Toi</div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {spotsRemaining > 0 && (
                <div style={{ textAlign: 'center', fontSize: 13, color: JUNTO.gray }}>
                  Invite des joueurs depuis la liste ci-dessous
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* BANDEAU PRÉ-SÉLECTIONNÉ */}
        {/* ======================== */}
        {preselectedMatch && !incompleteMatch && (
          <div style={{
            display: 'flex',
            background: JUNTO.white,
            borderRadius: 16,
            border: `2px solid ${JUNTO.teal}`,
            overflow: 'hidden',
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <div style={{ width: 5, background: JUNTO.teal, alignSelf: 'stretch' }} />
            <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: JUNTO.teal, fontWeight: 700 }}>
                  🎯 Invite des joueurs pour ta partie
                </strong>
                <span style={{ fontSize: 13, color: JUNTO.gray }}>
                  {formatMatchDate(preselectedMatch.match_date, preselectedMatch.match_time)} · {preselectedMatch.clubs?.name || preselectedMatch.city}
                </span>
              </div>
              <button 
                onClick={() => { setPreselectedMatch(null); router.replace('/dashboard/joueurs') }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: JUNTO.tealSoft, border: 'none',
                  fontSize: 18, color: JUNTO.teal, cursor: 'pointer'
                }}
              >✕</button>
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* ONBOARDING NOUVEL UTILISATEUR */}
        {/* ======================== */}
        {isNewUser && !incompleteMatch && (
          <div style={{
            display: 'flex',
            background: JUNTO.white,
            borderRadius: 24,
            border: `2px solid ${JUNTO.border}`,
            overflow: 'hidden',
            marginBottom: 24
          }}>
            <div style={{ width: 6, background: `linear-gradient(180deg, ${JUNTO.coral} 0%, ${JUNTO.teal} 100%)`, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📒</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: JUNTO.ink, marginBottom: 10 }}>
                Ton carnet de joueurs
              </h2>
              <p style={{ fontSize: 14, color: JUNTO.gray, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
                Plus tu joues, plus cette page devient <strong style={{ color: JUNTO.ink }}>ton allié</strong> pour organiser des parties !
                Chaque match te fait découvrir des joueurs que tu pourras <strong style={{ color: JUNTO.ink }}>ajouter en favoris</strong> et <strong style={{ color: JUNTO.ink }}>réinviter en 1 clic</strong>.
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                padding: '16px 24px',
                background: JUNTO.bgSoft,
                borderRadius: 16,
                marginBottom: 24,
                maxWidth: 340,
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {[
                  { value: '0', label: 'Favoris' },
                  { value: '0', label: 'Récents' },
                  { value: '0', label: 'Parties' }
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: JUNTO.muted }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: JUNTO.muted }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <Link href="/dashboard/matches/create" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 32px',
                background: JUNTO.coral,
                color: JUNTO.white,
                borderRadius: 100,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: `0 8px 24px ${JUNTO.coralGlow}`
              }}>
                🎾 Créer ta première partie
              </Link>
              <Link href="/dashboard/parties" style={{
                display: 'block',
                marginTop: 14,
                fontSize: 14,
                color: JUNTO.coral,
                textDecoration: 'none'
              }}>
                ou rejoins une partie existante →
              </Link>
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* RECHERCHE */}
        {/* ======================== */}
        <div style={{
          display: 'flex',
          background: JUNTO.white,
          borderRadius: 16,
          border: `2px solid ${incompleteMatch ? JUNTO.coral : JUNTO.border}`,
          overflow: 'hidden',
          marginBottom: 20
        }}>
          <div style={{ width: 5, background: incompleteMatch ? JUNTO.coral : JUNTO.slate, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="🔍 Rechercher un joueur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '16px 20px',
              border: 'none',
              fontSize: 15,
              fontFamily: "'Satoshi', sans-serif",
              background: 'transparent',
              outline: 'none'
            }}
          />
        </div>

        {/* ======================== */}
        {/* SUGGESTIONS RAPIDES */}
        {/* ======================== */}
        {incompleteMatch && spotsRemaining > 0 && favoritePlayers.length > 0 && searchQuery.length < 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: JUNTO.gray, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚡ Inviter rapidement
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {favoritePlayers.slice(0, 4).map((player, i) => (
                <button 
                  key={player.id} 
                  onClick={(e) => quickInvite(player, e)} 
                  disabled={inviting}
                  className="quick-chip"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px 8px 8px',
                    background: JUNTO.white,
                    border: `2px solid ${JUNTO.border}`,
                    borderRadius: 100,
                    cursor: inviting ? 'wait' : 'pointer',
                    opacity: inviting ? 0.7 : 1
                  }}
                >
                  <Avatar player={player} size={30} index={i} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink }}>{player.name?.split(' ')[0]}</span>
                  <span style={{ fontSize: 18, color: JUNTO.coral, fontWeight: 700 }}>+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* TABS */}
        {/* ======================== */}
        {searchQuery.length < 2 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'favoris', label: '⭐ Favoris', count: favoritePlayers.length },
              { id: 'recents', label: '🕐 Récents', count: recentPlayers.length },
              { id: 'pres', label: '📍 Près de moi', count: nearbyPlayers.length },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  background: activeTab === tab.id ? JUNTO.ink : JUNTO.white,
                  border: `2px solid ${activeTab === tab.id ? JUNTO.ink : JUNTO.border}`,
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  color: activeTab === tab.id ? JUNTO.white : JUNTO.gray,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: `all 0.2s ${SPRING}`
                }}
              >
                {tab.label}
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : JUNTO.bgSoft
                }}>{tab.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ======================== */}
        {/* FILTRES NIVEAU */}
        {/* ======================== */}
        {activeTab === 'pres' && searchQuery.length < 2 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: JUNTO.gray, marginRight: 6 }}>Niveau:</span>
            {[
              { id: 'all', label: 'Tous' },
              { id: '3-4', label: '3-4' },
              { id: '4-5', label: '4-5' },
              { id: '5+', label: '5+' }
            ].map(lvl => (
              <button 
                key={lvl.id} 
                onClick={() => setLevelFilter(lvl.id)}
                style={{
                  padding: '8px 14px',
                  background: levelFilter === lvl.id ? JUNTO.tealSoft : JUNTO.white,
                  border: `2px solid ${levelFilter === lvl.id ? JUNTO.teal : JUNTO.border}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: levelFilter === lvl.id ? JUNTO.teal : JUNTO.gray,
                  cursor: 'pointer'
                }}
              >{lvl.label}</button>
            ))}
          </div>
        )}

        {/* ======================== */}
        {/* LISTE JOUEURS */}
        {/* ======================== */}
        {isSearching ? (
          <div style={{ textAlign: 'center', padding: 40, color: JUNTO.gray }}>Recherche...</div>
        ) : playersToShow.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: JUNTO.white,
            borderRadius: 20,
            border: `2px solid ${JUNTO.border}`
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {activeTab === 'favoris' ? '⭐' : activeTab === 'recents' ? '🕐' : '👥'}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: JUNTO.ink, marginBottom: 8 }}>
              {activeTab === 'favoris' ? 'Aucun favori' : activeTab === 'recents' ? 'Aucune partie récente' : searchQuery.length >= 2 ? 'Aucun joueur trouvé' : 'Aucun joueur dans ta zone'}
            </div>
            <div style={{ fontSize: 14, color: JUNTO.gray }}>
              {activeTab === 'favoris' ? 'Ajoute des joueurs en favori pour les retrouver ici' : activeTab === 'recents' ? 'Joue des parties pour voir apparaître tes partenaires' : 'Essaie d\'élargir ta recherche'}
            </div>
          </div>
        ) : (
          <>
            {/* Format Liste (Favoris / Récents / Recherche) */}
            {(activeTab === 'favoris' || activeTab === 'recents' || searchQuery.length >= 2) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {playersToShow.map((player, index) => {
                  const partiesTogether = matchesTogether[player.id] || 0
                  const position = POSITION_LABELS[player.position]
                  return (
                    <div 
                      key={player.id} 
                      onClick={() => router.push(`/player/${player.id}`)}
                      className="player-row"
                      style={{
                        display: 'flex',
                        background: JUNTO.white,
                        borderRadius: 16,
                        border: `2px solid ${JUNTO.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: `all 0.3s ${SPRING}`
                      }}
                    >
                      <div style={{ width: 4, background: getAvatarColor(index), flexShrink: 0 }} />
                      <div className="player-row-body" style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Avatar player={player} size={52} index={index} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: JUNTO.ink, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                            {favoriteIds.has(player.id) && <span style={{ fontSize: 14 }}>⭐</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ background: JUNTO.tealSoft, color: JUNTO.teal, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                              ⭐ Niv. {player.level || '?'}
                            </span>
                            {position && (
                              <span style={{ background: JUNTO.slateSoft, color: JUNTO.slate, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                                {position.icon} {position.label}
                              </span>
                            )}
                            {player.city && (
                              <span style={{ background: JUNTO.bgSoft, color: JUNTO.gray, padding: '3px 10px', borderRadius: 8, fontSize: 11 }}>
                                📍 {player.city}
                              </span>
                            )}
                            {activeTab === 'favoris' && partiesTogether > 0 && (
                              <span style={{ background: JUNTO.amberSoft, color: '#92400e', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500 }}>
                                🎾 {partiesTogether} partie{partiesTogether > 1 ? 's' : ''} ensemble
                              </span>
                            )}
                            {activeTab === 'recents' && player.lastMatchDate && (
                              <span style={{ background: JUNTO.coralSoft, color: JUNTO.coral, padding: '3px 10px', borderRadius: 8, fontSize: 11 }}>
                                🕐 {formatRecentDate(player.lastMatchDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="player-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {!favoriteIds.has(player.id) && (
                            <button 
                              onClick={(e) => toggleFavorite(player.id, e)}
                              style={{
                                width: 40, height: 40,
                                background: JUNTO.bgSoft,
                                border: `1px solid ${JUNTO.border}`,
                                borderRadius: 10,
                                fontSize: 18,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >☆</button>
                          )}
                          <button 
                            onClick={(e) => incompleteMatch && spotsRemaining > 0 ? quickInvite(player, e) : openInviteModal(player, e)}
                            style={{
                              padding: '12px 18px',
                              background: incompleteMatch && spotsRemaining > 0 ? JUNTO.teal : JUNTO.coral,
                              color: JUNTO.white,
                              border: 'none',
                              borderRadius: 12,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: incompleteMatch && spotsRemaining > 0 ? `0 4px 12px ${JUNTO.tealGlow}` : `0 4px 12px ${JUNTO.coralGlow}`
                            }}
                          >
                            {incompleteMatch && spotsRemaining > 0 ? '+ Inviter' : 'Inviter'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Format Grille (Près de moi) */}
            {activeTab === 'pres' && searchQuery.length < 2 && (
              <div className="players-grid">
                {playersToShow.map((player, index) => {
                  const position = POSITION_LABELS[player.position]
                  return (
                    <div 
                      key={player.id}
                      onClick={() => router.push(`/player/${player.id}`)}
                      className="player-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: JUNTO.white,
                        borderRadius: 20,
                        border: `2px solid ${JUNTO.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: `all 0.3s ${SPRING}`
                      }}
                    >
                      <div style={{ height: 4, background: getAvatarColor(index) }} />
                      <div style={{ padding: 18, textAlign: 'center', position: 'relative' }}>
                        <button 
                          onClick={(e) => toggleFavorite(player.id, e)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 28,
                            height: 28,
                            background: favoriteIds.has(player.id) ? JUNTO.amberSoft : JUNTO.bgSoft,
                            border: 'none',
                            borderRadius: '50%',
                            fontSize: 14,
                            cursor: 'pointer'
                          }}
                        >
                          {favoriteIds.has(player.id) ? '⭐' : '☆'}
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                          <Avatar player={player} size={56} index={index} />
                        </div>
                        <div style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: JUNTO.ink,
                          marginBottom: 10,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{player.name}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 }}>
                          <span style={{ background: JUNTO.tealSoft, color: JUNTO.teal, padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600 }}>
                            ⭐ {player.level || '?'}
                          </span>
                          {position && (
                            <span style={{ background: JUNTO.slateSoft, color: JUNTO.slate, padding: '3px 8px', borderRadius: 8, fontSize: 10 }}>
                              {position.icon}
                            </span>
                          )}
                          {player.city && (
                            <span style={{ background: JUNTO.bgSoft, color: JUNTO.gray, padding: '3px 8px', borderRadius: 8, fontSize: 10 }}>
                              {player.city}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => incompleteMatch && spotsRemaining > 0 ? quickInvite(player, e) : openInviteModal(player, e)}
                          style={{
                            width: '100%',
                            padding: 12,
                            background: incompleteMatch && spotsRemaining > 0 ? JUNTO.teal : JUNTO.coral,
                            color: JUNTO.white,
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {incompleteMatch && spotsRemaining > 0 ? '+ Inviter' : 'Inviter'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* ======================== */}
      {/* MODAL INVITATION */}
      {/* ======================== */}
      {showInviteModal && selectedPlayer && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }} 
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            style={{
              background: JUNTO.white,
              borderRadius: 28,
              width: '100%',
              maxWidth: 420,
              maxHeight: '80vh',
              overflow: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: JUNTO.ink, margin: 0 }}>
                Inviter {selectedPlayer.name?.split(' ')[0]}
              </h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  background: JUNTO.bgSoft,
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 20,
                  color: JUNTO.gray,
                  cursor: 'pointer'
                }}
              >×</button>
            </div>
            
            <div style={{ padding: 24 }}>
              {/* Profil joueur */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                background: JUNTO.bgSoft,
                borderRadius: 16,
                marginBottom: 24
              }}>
                <Avatar player={selectedPlayer} size={52} index={0} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: JUNTO.ink }}>{selectedPlayer.name}</div>
                  <div style={{ fontSize: 13, color: JUNTO.gray }}>⭐ Niveau {selectedPlayer.level || '?'} · {selectedPlayer.city || ''}</div>
                </div>
              </div>
              
              {/* Parties ouvertes */}
              {myOpenMatches.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: JUNTO.gray, marginBottom: 12 }}>
                    Tes parties avec des places :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myOpenMatches.map((match, i) => (
                      <div key={match.id} style={{
                        display: 'flex',
                        background: JUNTO.white,
                        borderRadius: 14,
                        border: `2px solid ${JUNTO.border}`,
                        overflow: 'hidden'
                      }}>
                        <div style={{ width: 4, background: getAvatarColor(i) }} />
                        <div style={{ flex: 1, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: 14, color: JUNTO.ink }}>
                              {formatMatchDate(match.match_date, match.match_time)}
                            </strong>
                            <span style={{ fontSize: 12, color: JUNTO.gray }}>
                              {match.clubs?.name || match.city || 'Lieu'} · {match.spots_available} place{match.spots_available > 1 ? 's' : ''}
                            </span>
                          </div>
                          <button 
                            onClick={() => inviteToMatch(match.id)}
                            disabled={inviting}
                            style={{
                              padding: '10px 16px',
                              background: JUNTO.teal,
                              color: JUNTO.white,
                              border: 'none',
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: inviting ? 'not-allowed' : 'pointer',
                              opacity: inviting ? 0.7 : 1
                            }}
                          >+ Ajouter</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Divider */}
              {myOpenMatches.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 1, background: JUNTO.border }} />
                  <span style={{ fontSize: 12, color: JUNTO.muted }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: JUNTO.border }} />
                </div>
              )}
              
              {/* Créer partie */}
              <button 
                onClick={createMatchWithPlayer}
                style={{
                  width: '100%',
                  padding: 16,
                  background: JUNTO.coral,
                  color: JUNTO.white,
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: `0 4px 16px ${JUNTO.coralGlow}`
                }}
              >
                🆕 Créer une partie avec {selectedPlayer.name?.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* TOAST NOTIFICATION */}
      {/* ======================== */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 28px',
          borderRadius: 100,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 2000,
          animation: 'slideUp 0.3s ease-out',
          maxWidth: '90%',
          textAlign: 'center',
          background: toast.type === 'success' ? JUNTO.teal : JUNTO.coral,
          color: JUNTO.white
        }}>
          {toast.message}
        </div>
      )}

      <style jsx global>{`
        @keyframes junto-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
        .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
        .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
        .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
        .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        .players-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        
        @media (min-width: 640px) {
          .players-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
        }
        
        @media (min-width: 900px) {
          .players-grid { grid-template-columns: repeat(4, 1fr); }
        }
        
        .player-row:hover {
          border-color: ${JUNTO.coral} !important;
          transform: translateX(4px);
        }
        
        .player-card:hover {
          border-color: ${JUNTO.coral} !important;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        
        .quick-chip:hover {
          border-color: ${JUNTO.coral} !important;
          background: ${JUNTO.coralSoft} !important;
        }
        
        input::placeholder {
          color: ${JUNTO.muted};
        }
        
        /* Mobile responsive */
        @media (max-width: 600px) {
          .player-row-body {
            flex-wrap: wrap;
          }
          .player-actions {
            width: 100%;
            margin-top: 12px;
          }
          .player-actions button:last-child {
            flex: 1;
          }
        }
      `}</style>
    </div>
  )
}