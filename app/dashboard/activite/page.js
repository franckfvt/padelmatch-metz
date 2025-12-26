'use client'

/**
 * ============================================
 * PAGE ACTIVITÉ - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Feed social : résultats, parties à venir, nouveaux joueurs, streaks
 * Design : Interface sobre + avatars carrés arrondis colorés
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
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#f5f5f5',
  card: '#ffffff',
  cardHover: '#eeeeee',
  
  // Card type backgrounds (subtle)
  resultBg: '#e8f5e9',
  upcomingBg: '#fff3e0',
  newPlayerBg: '#e3f2fd',
  streakBg: '#fff8e1',
  
  // Borders
  border: '#e5e7eb',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

export default function ActivitePage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [feedItems, setFeedItems] = useState([])
  const [weekStats, setWeekStats] = useState({ played: 0, wins: 0, upcoming: 0, activePlayers: 0 })
  const [activePlayers, setActivePlayers] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Charger le profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(profileData)
    const userCity = profileData?.city

    // Charger les résultats récents (matchs terminés)
    const { data: recentResults } = await supabase
      .from('matches')
      .select(`
        *,
        clubs (name, city),
        profiles!matches_organizer_id_fkey (id, name, avatar_url),
        match_participants (
          user_id, team, status,
          profiles!match_participants_user_id_fkey (id, name, avatar_url)
        )
      `)
      .eq('status', 'completed')
      .gte('match_date', weekAgo.toISOString().split('T')[0])
      .order('match_date', { ascending: false })
      .limit(10)

    // Charger les parties à venir avec places dispo
    const { data: upcomingMatches } = await supabase
      .from('matches')
      .select(`
        *,
        clubs (name, city),
        profiles!matches_organizer_id_fkey (id, name, avatar_url),
        match_participants (
          user_id, team, status,
          profiles!match_participants_user_id_fkey (id, name, avatar_url)
        )
      `)
      .eq('status', 'open')
      .gt('spots_available', 0)
      .gte('match_date', today.toISOString().split('T')[0])
      .order('match_date', { ascending: true })
      .limit(10)

    // Charger les nouveaux joueurs de la ville
    const { data: newPlayers } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    // Construire le feed
    const feed = []

    // Ajouter les résultats
    ;(recentResults || []).forEach(match => {
      feed.push({
        type: 'result',
        data: match,
        date: new Date(match.match_date),
        id: `result-${match.id}`
      })
    })

    // Ajouter les parties à venir (filtrer celles où l'user est déjà inscrit)
    ;(upcomingMatches || []).filter(m => {
      const isParticipant = m.match_participants?.some(p => p.user_id === userId)
      const isOrganizer = m.organizer_id === userId
      return !isParticipant && !isOrganizer
    }).slice(0, 5).forEach(match => {
      feed.push({
        type: 'upcoming',
        data: match,
        date: new Date(match.match_date),
        id: `upcoming-${match.id}`
      })
    })

    // Ajouter les nouveaux joueurs
    ;(newPlayers || []).forEach(player => {
      feed.push({
        type: 'newPlayer',
        data: player,
        date: new Date(player.created_at),
        id: `newplayer-${player.id}`
      })
    })

    // Trier par date
    feed.sort((a, b) => b.date - a.date)
    setFeedItems(feed.slice(0, 15))

    // Stats de la semaine
    const myResultsThisWeek = (recentResults || []).filter(m => {
      return m.match_participants?.some(p => p.user_id === userId && p.status === 'confirmed')
    })

    const myUpcoming = (upcomingMatches || []).filter(m => {
      return m.organizer_id === userId || m.match_participants?.some(p => p.user_id === userId)
    })

    setWeekStats({
      played: myResultsThisWeek.length,
      wins: myResultsThisWeek.filter(m => m.winner).length, // Simplification
      upcoming: myUpcoming.length,
      activePlayers: (newPlayers || []).length + 10 // Placeholder
    })

    // Joueurs actifs (top joueurs de la semaine)
    const playerActivity = {}
    ;(recentResults || []).forEach(m => {
      m.match_participants?.forEach(p => {
        if (p.profiles && p.user_id !== userId) {
          if (!playerActivity[p.user_id]) {
            playerActivity[p.user_id] = { ...p.profiles, count: 0 }
          }
          playerActivity[p.user_id].count++
        }
      })
    })
    
    const sortedActive = Object.values(playerActivity).sort((a, b) => b.count - a.count).slice(0, 5)
    setActivePlayers(sortedActive)

    setLoading(false)
  }

  // === HELPERS ===
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) { 
    return timeStr ? timeStr.slice(0, 5) : '' 
  }

  function formatTimeAgo(date) {
    const now = new Date()
    const diff = now - new Date(date)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return "À l'instant"
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return 'Hier'
    return `Il y a ${days}j`
  }

  function getFirstName(name) {
    if (!name) return ''
    return name.split(' ')[0]
  }

  function getMatchLocation(match) {
    return match.clubs?.name || match.city || 'Lieu à définir'
  }

  function getMatchPlayers(match) {
    const players = []
    if (match.profiles) {
      players.push({ 
        id: match.organizer_id, 
        name: match.profiles.name, 
        avatar_url: match.profiles.avatar_url,
        team: 1
      })
    }
    ;(match.match_participants || []).forEach(p => { 
      if (p.user_id !== match.organizer_id && p.profiles && p.status === 'confirmed') {
        players.push({ 
          id: p.user_id, 
          name: p.profiles.name, 
          avatar_url: p.profiles.avatar_url,
          team: p.team || 1
        }) 
      }
    })
    return players
  }

  // === COMPOSANTS ===

  // Avatar carré arrondi
  function AvatarSlot({ player, index = 0, size = 'normal', showName = true }) {
    const bgColor = PLAYER_COLORS[index % 4]
    const isLarge = size === 'large'
    const isMini = size === 'mini'
    const isSmall = size === 'small'
    
    const dimensions = isMini ? 28 : isSmall ? 44 : isLarge ? undefined : 56
    const borderRadius = isMini ? 8 : isSmall ? 12 : isLarge ? 16 : 14
    const fontSize = isMini ? 12 : isSmall ? 16 : isLarge ? 22 : 20
    const nameSize = isLarge ? 12 : isSmall ? 10 : 11
    
    if (!player) {
      return (
        <div style={{
          width: isMini || isSmall ? dimensions : '100%',
          height: isMini || isSmall ? dimensions : undefined,
          aspectRatio: (isMini || isSmall) ? undefined : '1',
          borderRadius,
          background: COLORS.bg,
          border: `2px dashed ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.muted,
          fontSize: isMini ? 10 : 16,
          fontWeight: 600,
          flexShrink: 0
        }}>
          <span>?</span>
          {showName && !isMini && !isSmall && (
            <span style={{ fontSize: nameSize, marginTop: 3 }}>1 place</span>
          )}
        </div>
      )
    }
    
    return (
      <div style={{
        width: isMini || isSmall ? dimensions : '100%',
        height: isMini || isSmall ? dimensions : undefined,
        aspectRatio: (isMini || isSmall) ? undefined : '1',
        borderRadius,
        background: player.avatar_url ? COLORS.bg : bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontSize,
        fontWeight: 700,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0
      }}>
        {player.avatar_url ? (
          <img src={player.avatar_url} alt="" style={{ 
            width: '100%', height: '100%', objectFit: 'cover',
            position: 'absolute', top: 0, left: 0
          }} />
        ) : (
          <>
            <span>{player.name?.[0]?.toUpperCase()}</span>
            {showName && !isMini && (
              <span style={{ 
                fontSize: nameSize, 
                marginTop: 3, 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getFirstName(player.name)}
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  // Card Résultat de match
  function ResultCard({ match }) {
    const players = getMatchPlayers(match)
    const team1 = players.filter(p => p.team === 1 || players.indexOf(p) < 2).slice(0, 2)
    const team2 = players.filter(p => p.team === 2 || players.indexOf(p) >= 2).slice(0, 2)
    
    // Remplir les équipes si nécessaire
    while (team1.length < 2) team1.push(null)
    while (team2.length < 2) team2.push(null)
    
    const score = match.score || '6-4' // Placeholder
    const isWinner = true // Simplification
    
    return (
      <div className="feed-card" style={{ 
        background: COLORS.card, 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: COLORS.resultBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22
          }}>🏆</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>Résultat de match</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>
              {formatTimeAgo(match.match_date)} · {getMatchLocation(match)}
            </div>
          </div>
        </div>
        
        {/* Teams VS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 1, display: 'flex', gap: 10, justifyContent: 'center' }}>
            {team1.map((p, i) => (
              <AvatarSlot key={i} player={p} index={i} size="small" showName={true} />
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.muted }}>VS</div>
          <div style={{ flex: 1, display: 'flex', gap: 10, justifyContent: 'center' }}>
            {team2.map((p, i) => (
              <AvatarSlot key={i} player={p} index={i + 2} size="small" showName={true} />
            ))}
          </div>
        </div>
        
        {/* Score */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 24, 
          padding: 16, 
          background: COLORS.bg, 
          borderRadius: 14 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 900, 
              color: isWinner ? COLORS.p3 : COLORS.ink 
            }}>6-4</div>
            {isWinner && <div style={{ fontSize: 12, color: COLORS.p3, fontWeight: 600 }}>Victoire 🎉</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.ink }}>4-6</div>
          </div>
        </div>
      </div>
    )
  }

  // Card Partie à rejoindre
  function UpcomingCard({ match }) {
    const players = getMatchPlayers(match)
    const allSlots = [...players]
    while (allSlots.length < 4) allSlots.push(null)
    const spotsLeft = match.spots_available || (4 - players.length)
    
    return (
      <div className="feed-card" style={{ 
        background: COLORS.card, 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: COLORS.upcomingBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22
          }}>📅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>Partie à rejoindre</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>
              {spotsLeft} place{spotsLeft > 1 ? 's' : ''} dispo · par {getFirstName(match.profiles?.name)}
            </div>
          </div>
        </div>
        
        {/* Info match */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 14, color: COLORS.gray, marginBottom: 2 }}>{formatDate(match.match_date)}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.ink, lineHeight: 1 }}>
              {formatTime(match.match_time)}
            </div>
          </div>
          <div style={{ fontSize: 14, color: COLORS.gray, textAlign: 'right' }}>
            📍 {getMatchLocation(match)}
          </div>
        </div>
        
        {/* Grille 4 joueurs */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 10,
          marginBottom: 18
        }}>
          {allSlots.map((player, idx) => (
            <AvatarSlot key={idx} player={player} index={idx} size="large" showName={true} />
          ))}
        </div>
        
        {/* CTA */}
        <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: 16,
            background: COLORS.ink,
            color: COLORS.white,
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Rejoindre cette partie
          </button>
        </Link>
      </div>
    )
  }

  // Card Nouveau joueur
  function NewPlayerCard({ player }) {
    return (
      <div className="feed-card" style={{ 
        background: COLORS.card, 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: COLORS.newPlayerBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22
          }}>👋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>Nouveau joueur</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>
              Rejoint {formatTimeAgo(player.created_at)}
            </div>
          </div>
        </div>
        
        {/* Player info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: player.avatar_url ? COLORS.bg : COLORS.p4,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: COLORS.white, fontSize: 28, fontWeight: 700,
            overflow: 'hidden'
          }}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>
                {player.name?.[0]?.toUpperCase()}
                <span style={{ fontSize: 13, marginTop: 2 }}>{getFirstName(player.name)}</span>
              </>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{player.name}</div>
            <div style={{ fontSize: 14, color: COLORS.gray }}>
              Niveau {player.level || '?'} · {player.city || 'Non renseigné'}
            </div>
          </div>
          <button style={{
            padding: '12px 20px',
            background: COLORS.bg,
            color: COLORS.ink,
            border: 'none',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Inviter
          </button>
        </div>
      </div>
    )
  }

  // Card Streak
  function StreakCard({ player, streak }) {
    return (
      <div className="feed-card" style={{ 
        background: COLORS.card, 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 16 
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: COLORS.streakBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22
          }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>Série en cours</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>Inarrêtable !</div>
          </div>
        </div>
        
        {/* Player */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarSlot player={player} index={0} size="small" showName={false} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink }}>{player.name}</div>
            <div style={{ fontSize: 14, color: COLORS.gray }}>{streak} victoires d'affilée</div>
          </div>
          <div style={{
            padding: '10px 18px',
            background: COLORS.p2,
            color: COLORS.white,
            borderRadius: 100,
            fontSize: 16,
            fontWeight: 700
          }}>
            🔥 {streak}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  function EmptyState() {
    return (
      <div style={{ 
        background: COLORS.card, 
        borderRadius: 24, 
        padding: '60px 24px', 
        textAlign: 'center' 
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
          Pas encore d'activité
        </h3>
        <p style={{ fontSize: 15, color: COLORS.gray, marginBottom: 24 }}>
          Joue des parties pour voir l'activité de ta communauté
        </p>
        <Link href="/dashboard/parties" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '16px 32px',
            background: COLORS.ink,
            color: COLORS.white,
            border: 'none',
            borderRadius: 100,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Voir les parties
          </button>
        </Link>
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((color, i) => (
            <div key={i} className="dot-loading" style={{ width: 16, height: 16, borderRadius: 6, background: color }} />
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
          
          {/* Page title */}
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: COLORS.ink }}>
            Activité ⚡
          </h1>
          <p style={{ fontSize: 15, color: COLORS.gray, margin: '0 0 24px' }}>
            Ce qui se passe autour de toi
          </p>

          {/* Feed */}
          {feedItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="feed">
              {feedItems.map(item => {
                switch (item.type) {
                  case 'result':
                    return <ResultCard key={item.id} match={item.data} />
                  case 'upcoming':
                    return <UpcomingCard key={item.id} match={item.data} />
                  case 'newPlayer':
                    return <NewPlayerCard key={item.id} player={item.data} />
                  default:
                    return null
                }
              })}
            </div>
          )}
        </div>

        {/* ======================== */}
        {/* SIDEBAR */}
        {/* ======================== */}
        <aside className="sidebar">
          
          {/* Stats de la semaine */}
          <div style={{ 
            background: COLORS.card,
            borderRadius: 20, 
            padding: 24,
            marginBottom: 16
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>
              📊 Cette semaine
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { n: weekStats.played, l: 'Matchs joués' },
                { n: weekStats.wins, l: 'Victoires' },
                { n: weekStats.upcoming, l: 'À venir' },
                { n: weekStats.activePlayers, l: 'Joueurs actifs' }
              ].map((s) => (
                <div key={s.l} style={{ 
                  background: COLORS.bg, 
                  borderRadius: 14, 
                  padding: 16, 
                  textAlign: 'center' 
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.ink }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Joueurs actifs */}
          {activePlayers.length > 0 && (
            <div style={{ 
              background: COLORS.card,
              borderRadius: 20, 
              padding: 20,
              marginBottom: 16
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>
                🔥 Joueurs actifs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePlayers.map((player, i) => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div className="active-player-row" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      padding: 10,
                      marginLeft: -10,
                      marginRight: -10,
                      borderRadius: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: player.avatar_url ? COLORS.bg : PLAYER_COLORS[i % 4],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: COLORS.white, fontSize: 18, fontWeight: 700,
                        overflow: 'hidden', flexShrink: 0
                      }}>
                        {player.avatar_url 
                          ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : player.name?.[0]?.toUpperCase()
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>{player.count} matchs cette semaine</div>
                      </div>
                      {player.count >= 3 && (
                        <span style={{
                          padding: '6px 12px',
                          background: COLORS.p2,
                          color: COLORS.white,
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 700
                        }}>🔥 {player.count}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA Créer une partie */}
          <div style={{ 
            background: COLORS.ink,
            borderRadius: 20, 
            padding: 24,
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
              Organise une partie
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 18 }}>
              Invite tes potes et complète ton carré
            </p>
            <Link href="/dashboard/matches/create" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '14px 28px',
                background: COLORS.white,
                color: COLORS.ink,
                border: 'none',
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                + Créer une partie
              </button>
            </Link>
          </div>
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
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .main-column { 
          flex: 1; 
          min-width: 0; 
          max-width: 680px;
        }
        
        .sidebar { 
          width: 340px; 
          flex-shrink: 0; 
          display: none; 
        }
        
        .feed-card {
          transition: all 0.2s ease;
        }
        
        .feed-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        
        .active-player-row:hover {
          background: ${COLORS.bg};
        }
        
        /* Desktop */
        @media (min-width: 1024px) {
          .sidebar { display: block; }
          .main-column { max-width: none; }
        }
      `}</style>
    </>
  )
}