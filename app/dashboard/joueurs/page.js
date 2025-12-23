'use client'

/**
 * ============================================
 * PAGE JOUEURS - Carnet d'adresses du padeliste
 * ============================================
 * 
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
import { COLORS, RADIUS, getAvatarColor } from '@/app/lib/design-tokens'

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
    const { data: myMatches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id, match_date, match_time, spots_available, city, status,
        clubs (name),
        match_participants (user_id, team, status, profiles (id, name, avatar_url))
      `)
      .eq('organizer_id', session.user.id)
      .in('status', ['open', 'confirmed']) // Accepter aussi 'confirmed' si places dispo
      .gt('spots_available', 0)
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(1)

    console.log('🎾 Hero query:', { today, matches: myMatches, error: matchError })

    if (myMatches && myMatches.length > 0) {
      const match = myMatches[0]
      setIncompleteMatch(match)
      const confirmedPlayers = (match.match_participants || [])
        .filter(p => p.status === 'confirmed' && p.profiles)
        .map(p => ({ ...p.profiles, team: p.team }))
      setMatchPlayers(confirmedPlayers)
    }

    // Favoris
    const { data: favorites } = await supabase
      .from('player_favorites')
      .select(`
        favorite_user_id,
        profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city, position)
      `)
      .eq('user_id', session.user.id)

    const favIds = new Set((favorites || []).map(f => f.favorite_user_id))
    setFavoriteIds(favIds)
    setFavoritePlayers((favorites || []).map(f => f.profiles).filter(Boolean))

    if ((favorites || []).length === 0) setActiveTab('pres')

    // Récents
    const { data: recentMatches } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        matches!inner (
          id, match_date,
          match_participants (user_id, profiles!match_participants_user_id_fkey (id, name, avatar_url, level, city, position))
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .order('matches(match_date)', { ascending: false })
      .limit(20)

    const recentPlayersMap = new Map()
    const recentPlayersWithDate = []
    ;(recentMatches || []).forEach(mp => {
      const match = mp.matches
      if (!match) return
      ;(match.match_participants || []).forEach(p => {
        if (p.user_id !== session.user.id && p.profiles && !recentPlayersMap.has(p.user_id)) {
          recentPlayersMap.set(p.user_id, true)
          recentPlayersWithDate.push({ ...p.profiles, lastMatchDate: match.match_date })
        }
      })
    })
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
      const match = (openMatches || []).find(m => m.id === preselectedMatchId)
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
      setShowInviteModal(false)
      setSelectedPlayer(null)
      loadData()
    } catch (err) {
      console.error('Erreur invitation:', err)
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
      loadData()
    } catch (err) {
      console.error('Erreur invitation rapide:', err)
    } finally {
      setInviting(false)
    }
  }

  function createMatchWithPlayer() {
    if (!selectedPlayer) return
    setShowInviteModal(false)
    router.push(`/dashboard/matches/create?invite=${selectedPlayer.id}`)
  }

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

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  // Détection nouvel utilisateur (aucune donnée)
  const isNewUser = favoritePlayers.length === 0 && recentPlayers.length === 0

  let playersToShow = []
  if (searchQuery.length >= 2) playersToShow = searchResults
  else if (activeTab === 'favoris') playersToShow = favoritePlayers
  else if (activeTab === 'recents') playersToShow = recentPlayers
  else if (activeTab === 'pres') playersToShow = getFilteredNearbyPlayers()

  const spotsRemaining = incompleteMatch?.spots_available || 0

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      
      {/* HERO CONTEXTUEL */}
      {incompleteMatch && (
        <div style={{
          background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)',
          borderRadius: RADIUS.xl,
          padding: 20,
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#fff', transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#fff', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              🎾 Ta prochaine partie
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {incompleteMatch.match_time?.slice(0, 5) || '--:--'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
              {formatMatchDate(incompleteMatch.match_date)} · {incompleteMatch.clubs?.name || incompleteMatch.city || 'Lieu à définir'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {[0, 1, 2, 3].map(i => {
                const player = matchPlayers[i]
                const isMe = player?.id === user?.id
                return (
                  <div key={i} style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: player ? getAvatarColor(player.name) : 'rgba(255,255,255,0.1)',
                    border: player ? '3px solid rgba(255,255,255,0.3)' : '2px dashed rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: player ? 18 : 22, fontWeight: 700,
                    color: player ? '#fff' : 'rgba(255,255,255,0.4)',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    {player ? (player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.name?.[0]?.toUpperCase()) : '+'}
                    {isMe && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', background: COLORS.accent, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>Toi</div>}
                  </div>
                )
              })}
            </div>

            <div style={{
              display: 'inline-block', padding: '8px 16px',
              background: spotsRemaining > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)',
              borderRadius: 20, fontSize: 13, fontWeight: 600,
              color: spotsRemaining > 0 ? '#fbbf24' : '#4ade80'
            }}>
              {spotsRemaining > 0 ? `Il manque ${spotsRemaining} joueur${spotsRemaining > 1 ? 's' : ''} !` : '✓ Partie complète'}
            </div>
            {spotsRemaining > 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 10 }}>Invite des joueurs depuis la liste ci-dessous</div>}
          </div>
        </div>
      )}

      {/* BANDEAU MATCH PRÉ-SÉLECTIONNÉ */}
      {preselectedMatch && !incompleteMatch && (
        <div style={{ background: COLORS.accentLight, borderRadius: RADIUS.md, padding: 14, marginBottom: 16, border: `1px solid ${COLORS.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: COLORS.accent, fontSize: 13, marginBottom: 2 }}>🎯 Invite des joueurs pour ta partie</div>
            <div style={{ fontSize: 12, color: COLORS.accentText }}>{formatMatchDate(preselectedMatch.match_date, preselectedMatch.match_time)} · {preselectedMatch.clubs?.name || preselectedMatch.city}</div>
          </div>
          <button onClick={() => { setPreselectedMatch(null); router.replace('/dashboard/joueurs') }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.accent, padding: 4 }}>✕</button>
        </div>
      )}

      {/* ONBOARDING NOUVEL UTILISATEUR */}
      {isNewUser && !incompleteMatch && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: RADIUS.xl,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #bae6fd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            Ton carnet de joueurs
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 16, maxWidth: 320, margin: '0 auto 16px' }}>
            Cette page se remplira au fil de tes parties ! Tu y retrouveras tes partenaires de jeu et pourras les inviter facilement.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12, 
            maxWidth: 280, 
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: RADIUS.md }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Favoris</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Tes joueurs préférés, à portée de clic</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: RADIUS.md }}>
              <span style={{ fontSize: 20 }}>🕐</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Récents</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Ceux avec qui tu as joué récemment</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: RADIUS.md }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Près de toi</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Découvre des joueurs dans ta ville</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Link href="/dashboard/matches/create" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
              color: '#fff',
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }}>
              🎾 Créer ta première partie
            </Link>
          </div>
        </div>
      )}

      {/* RECHERCHE */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un joueur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px',
            border: incompleteMatch ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md, fontSize: 15, outline: 'none', boxSizing: 'border-box',
            background: incompleteMatch ? COLORS.accentLight : COLORS.card
          }}
        />
      </div>

      {/* SUGGESTIONS RAPIDES */}
      {incompleteMatch && spotsRemaining > 0 && favoritePlayers.length > 0 && searchQuery.length < 2 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10 }}>⚡ Inviter rapidement</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {favoritePlayers.slice(0, 4).map(player => (
              <button key={player.id} onClick={(e) => quickInvite(player, e)} disabled={inviting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 8px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, fontSize: 13, cursor: inviting ? 'wait' : 'pointer', opacity: inviting ? 0.7 : 1 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: getAvatarColor(player.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
                  {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : player.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ color: COLORS.text, fontWeight: 500 }}>{player.name?.split(' ')[0]}</span>
                <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 16 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABS */}
      {searchQuery.length < 2 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { id: 'favoris', label: '⭐ Favoris', count: favoritePlayers.length },
            { id: 'recents', label: '🕐 Récents', count: recentPlayers.length },
            { id: 'pres', label: '📍 Près de moi', count: nearbyPlayers.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 16px', background: activeTab === tab.id ? COLORS.text : COLORS.card, color: activeTab === tab.id ? '#fff' : COLORS.textMuted, border: activeTab === tab.id ? 'none' : `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              {tab.label}
              <span style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : COLORS.borderLight, padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* FILTRES NIVEAU */}
      {activeTab === 'pres' && searchQuery.length < 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: COLORS.textMuted, marginRight: 4 }}>Niveau:</span>
          {[{ id: 'all', label: 'Tous' }, { id: '3-4', label: '3-4' }, { id: '4-5', label: '4-5' }, { id: '5+', label: '5+' }].map(lvl => (
            <button key={lvl.id} onClick={() => setLevelFilter(lvl.id)}
              style={{ padding: '6px 12px', background: levelFilter === lvl.id ? COLORS.accentLight : COLORS.card, color: levelFilter === lvl.id ? COLORS.accentText : COLORS.textMuted, border: levelFilter === lvl.id ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{lvl.label}</button>
          ))}
        </div>
      )}

      {/* LISTE JOUEURS */}
      {isSearching ? (
        <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>Recherche...</div>
      ) : playersToShow.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'favoris' ? '⭐' : activeTab === 'recents' ? '🕐' : '👥'}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
            {activeTab === 'favoris' ? 'Aucun favori' : activeTab === 'recents' ? 'Aucune partie récente' : searchQuery.length >= 2 ? 'Aucun joueur trouvé' : 'Aucun joueur dans ta zone'}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            {activeTab === 'favoris' ? 'Ajoute des joueurs en favori pour les retrouver ici' : activeTab === 'recents' ? 'Joue des parties pour voir apparaître tes partenaires' : 'Essaie d\'élargir ta recherche'}
          </div>
        </div>
      ) : (
        <>
          {(activeTab === 'favoris' || activeTab === 'recents' || searchQuery.length >= 2) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {playersToShow.map(player => (
                <div key={player.id} onClick={() => router.push(`/player/${player.id}`)}
                  style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 16, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: player.avatar_url ? 'transparent' : getAvatarColor(player.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                      {favoriteIds.has(player.id) && <span style={{ fontSize: 12 }}>⭐</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ background: COLORS.accentLight, color: COLORS.accentText, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Niv. {player.level || '?'}</span>
                      {player.city && <span style={{ background: COLORS.borderLight, color: COLORS.textMuted, padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>📍 {player.city}</span>}
                      {activeTab === 'recents' && player.lastMatchDate && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>🎾 {formatRecentDate(player.lastMatchDate)}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {!favoriteIds.has(player.id) && <button onClick={(e) => toggleFavorite(player.id, e)} style={{ width: 36, height: 36, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textLight }}>☆</button>}
                    <button onClick={(e) => incompleteMatch && spotsRemaining > 0 ? quickInvite(player, e) : openInviteModal(player, e)}
                      style={{ padding: '10px 16px', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: incompleteMatch ? '0 4px 12px rgba(34,197,94,0.3)' : 'none' }}>
                      {incompleteMatch && spotsRemaining > 0 ? '+ Inviter' : 'Inviter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pres' && searchQuery.length < 2 && (
            <div className="players-grid">
              {playersToShow.map(player => (
                <div key={player.id} onClick={() => router.push(`/player/${player.id}`)}
                  style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 14, border: `1px solid ${COLORS.border}`, position: 'relative', cursor: 'pointer' }}>
                  <button onClick={(e) => toggleFavorite(player.id, e)} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, background: favoriteIds.has(player.id) ? '#fef3c7' : COLORS.bg, border: 'none', borderRadius: '50%', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {favoriteIds.has(player.id) ? '⭐' : '☆'}
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: player.avatar_url ? 'transparent' : getAvatarColor(player.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10, overflow: 'hidden' }}>
                      {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 6, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 }}>
                      <span style={{ background: COLORS.accentLight, color: COLORS.accentText, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>⭐ {player.level || '?'}</span>
                      {player.city && <span style={{ background: COLORS.borderLight, color: COLORS.textMuted, padding: '2px 8px', borderRadius: 6, fontSize: 10 }}>{player.city}</span>}
                    </div>
                    <button onClick={(e) => incompleteMatch && spotsRemaining > 0 ? quickInvite(player, e) : openInviteModal(player, e)}
                      style={{ width: '100%', padding: 8, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {incompleteMatch && spotsRemaining > 0 ? '+ Inviter' : 'Inviter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL INVITATION */}
      {showInviteModal && selectedPlayer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setShowInviteModal(false)}>
          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 24, width: '100%', maxWidth: 400, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: COLORS.text }}>Inviter {selectedPlayer.name?.split(' ')[0]}</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: COLORS.textMuted }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: COLORS.bg, borderRadius: RADIUS.md, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedPlayer.avatar_url ? 'transparent' : getAvatarColor(selectedPlayer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#fff', overflow: 'hidden' }}>
                {selectedPlayer.avatar_url ? <img src={selectedPlayer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedPlayer.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.text }}>{selectedPlayer.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>⭐ Niveau {selectedPlayer.level || '?'} · {selectedPlayer.city || ''}</div>
              </div>
            </div>

            {myOpenMatches.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10 }}>Tes parties avec des places :</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {myOpenMatches.map(match => (
                    <div key={match.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: COLORS.bg, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{formatMatchDate(match.match_date, match.match_time)}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{match.clubs?.name || match.city || 'Lieu'} · {match.spots_available} place{match.spots_available > 1 ? 's' : ''}</div>
                      </div>
                      <button onClick={() => inviteToMatch(match.id)} disabled={inviting}
                        style={{ padding: '8px 14px', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: '#fff', border: 'none', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.7 : 1 }}>+ Ajouter</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myOpenMatches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>ou</span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>
            )}

            <button onClick={createMatchWithPlayer}
              style={{ width: '100%', padding: 14, background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`, color: '#fff', border: 'none', borderRadius: RADIUS.md, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              🆕 Créer une partie avec {selectedPlayer.name?.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      <div style={{ height: 100 }} />

      <style jsx global>{`
        .players-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .players-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }
        @media (min-width: 1024px) {
          .players-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  )
}