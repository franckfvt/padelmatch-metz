'use client'

/**
 * ============================================
 * PAGE STATS - STYLE WARM
 * ============================================
 * 
 * Remplace l'ancienne page "Activité"
 * 
 * Fonctionnalités :
 * - Stats rapides (parties, victoires, série)
 * - Bouton "+ Ajouter une partie" (tracking manuel)
 * - 2 onglets : Mes Stats | Communauté
 * - Historique des parties
 * - Feed social (activité des autres)
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  getPlayerLevel, 
  getLevelProgress, 
  getNextLevel,
  getUnlockedBadges, 
  getNextBadges,
  calculateFullStats,
  getStreakMessage,
  PERFORMANCE_BADGES,
  BADGE_CATEGORIES
} from '@/app/lib/gamification'
import { ShareModal, Confetti, ProfileCard, MonthlyRecapCard } from '@/app/components/ShareCards'

// === DESIGN TOKENS WARM ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400', 
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  cardHover: '#faf9f7',
  
  border: '#eae8e4',
  white: '#ffffff',
  
  green: '#22c55e',
  greenSoft: '#dcfce7',
  red: '#ef4444',
  redSoft: '#fee2e2',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

export default function StatsPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('stats')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    currentStreakType: 'none',
    bestWinStreak: 0,
    thisMonth: 0,
    lastMonth: 0,
    organized: 0,
    uniquePartners: 0,
    consecutiveWeeks: 0
  })
  
  // Gamification
  const [playerLevel, setPlayerLevel] = useState(null)
  const [levelProgress, setLevelProgress] = useState(null)
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [nextBadges, setNextBadges] = useState([])
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  
  // Progression mensuelle (8 dernières semaines)
  const [weeklyProgress, setWeeklyProgress] = useState([])
  
  // Partage
  const [shareModal, setShareModal] = useState({ open: false, type: null })
  const [showConfetti, setShowConfetti] = useState(false)
  const [monthlyRecap, setMonthlyRecap] = useState(null)
  
  // Objectifs mensuels
  const [monthlyGoals, setMonthlyGoals] = useState({
    games: { target: 8, current: 0 },
    wins: { target: 5, current: 0 },
    streak: { target: 3, current: 0 },
    partners: { target: 3, current: 0 }
  })
  
  // Historique
  const [recentGames, setRecentGames] = useState([])
  const [favoritePlayers, setFavoritePlayers] = useState([])
  
  // Feed social
  const [activityFeed, setActivityFeed] = useState([])
  
  // Modal ajouter partie
  const [newGame, setNewGame] = useState({
    result: 'win',
    scoreA: '',
    scoreB: '',
    partner: null,
    date: 'today',
    customDate: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [recentPartners, setRecentPartners] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(profileData)

    // Charger les stats complètes avec gamification
    const fullStats = await calculateFullStats(supabase, userId)
    setStats(fullStats)
    
    // Niveau et progression
    const level = getPlayerLevel(fullStats.totalGames)
    setPlayerLevel(level)
    setLevelProgress(getLevelProgress(fullStats.totalGames))
    
    // Badges
    const unlocked = getUnlockedBadges(fullStats)
    setUnlockedBadges(unlocked)
    setNextBadges(getNextBadges(fullStats, 3))
    
    // Progression hebdomadaire
    await loadWeeklyProgress(userId)
    
    // Récap mensuel
    await loadMonthlyRecap(userId, fullStats, profileData)
    
    // Objectifs mensuels
    await loadMonthlyGoals(userId, fullStats)
    
    // Autres données
    await Promise.all([
      loadRecentGames(userId),
      loadActivityFeed(userId, profileData?.city),
      loadRecentPartners(userId)
    ])

    setLoading(false)
  }

  async function loadWeeklyProgress(userId) {
    // Récupérer les parties des 8 dernières semaines
    const weeks = []
    const today = new Date()
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      weeks.push({
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
        label: `S${8-i}`
      })
    }

    // Compter les parties par semaine
    const { data: matches } = await supabase
      .from('matches')
      .select('id, match_date')
      .eq('organizer_id', userId)
      .gte('match_date', weeks[0].start)
      .lte('match_date', weeks[7].end)

    const { data: participations } = await supabase
      .from('match_participants')
      .select('match_id, matches!inner(id, match_date)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('matches.match_date', weeks[0].start)
      .lte('matches.match_date', weeks[7].end)

    // Fusionner et dédupliquer
    const allGames = new Map()
    ;(matches || []).forEach(m => allGames.set(m.id, m.match_date))
    ;(participations || []).forEach(p => {
      if (!allGames.has(p.match_id)) {
        allGames.set(p.match_id, p.matches.match_date)
      }
    })

    // Compter par semaine
    const weekCounts = weeks.map(week => {
      let count = 0
      allGames.forEach((date) => {
        if (date >= week.start && date <= week.end) count++
      })
      return { ...week, count }
    })

    setWeeklyProgress(weekCounts)
  }

  async function loadMonthlyRecap(userId, fullStats, profileData) {
    // Calculer le partenaire préféré du mois
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    
    // Récupérer les parties du mois avec les partenaires
    const { data: monthMatches } = await supabase
      .from('match_participants')
      .select(`
        team,
        matches!inner(id, match_date, organizer_id, 
          match_participants(user_id, team, profiles!match_participants_user_id_fkey(name))
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('matches.match_date', startOfMonth.toISOString().split('T')[0])

    // Compter les partenaires
    const partnerCounts = new Map()
    ;(monthMatches || []).forEach(p => {
      const myTeam = p.team
      p.matches?.match_participants?.forEach(mp => {
        if (mp.user_id !== userId && mp.team === myTeam && mp.profiles?.name) {
          const count = partnerCounts.get(mp.profiles.name) || 0
          partnerCounts.set(mp.profiles.name, count + 1)
        }
      })
    })

    // Trouver le top partenaire
    let topPartner = null
    let maxCount = 0
    partnerCounts.forEach((count, name) => {
      if (count > maxCount) {
        maxCount = count
        topPartner = name
      }
    })

    setMonthlyRecap({
      month: `${monthNames[today.getMonth()]} ${today.getFullYear()}`,
      totalGames: fullStats.thisMonth,
      wins: fullStats.wins,
      losses: fullStats.losses,
      winRate: fullStats.winRate,
      bestStreak: fullStats.bestWinStreak,
      topPartner,
      playerName: profileData?.name,
      playerLevel: getPlayerLevel(fullStats.totalGames)
    })
  }

  async function loadMonthlyGoals(userId, fullStats) {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Calculer les victoires ce mois
    const { data: monthMatches } = await supabase
      .from('matches')
      .select('id, winner, organizer_team')
      .eq('organizer_id', userId)
      .eq('status', 'completed')
      .gte('match_date', startOfMonth.toISOString().split('T')[0])

    const { data: monthParticipations } = await supabase
      .from('match_participants')
      .select('team, matches!inner(id, winner, match_date, status)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('matches.status', 'completed')
      .gte('matches.match_date', startOfMonth.toISOString().split('T')[0])

    // Compter les victoires
    let monthWins = 0
    const seenIds = new Set()
    
    ;(monthMatches || []).forEach(m => {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id)
        if (m.winner === (m.organizer_team || 'A')) monthWins++
      }
    })
    
    ;(monthParticipations || []).forEach(p => {
      if (!seenIds.has(p.matches.id)) {
        seenIds.add(p.matches.id)
        if (p.matches.winner === p.team) monthWins++
      }
    })

    // Compter les nouveaux partenaires ce mois
    const { data: monthPartners } = await supabase
      .from('match_participants')
      .select(`
        matches!inner(id, match_date, match_participants(user_id))
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('matches.match_date', startOfMonth.toISOString().split('T')[0])

    const uniquePartnersThisMonth = new Set()
    ;(monthPartners || []).forEach(p => {
      p.matches?.match_participants?.forEach(mp => {
        if (mp.user_id !== userId) {
          uniquePartnersThisMonth.add(mp.user_id)
        }
      })
    })

    setMonthlyGoals({
      games: { target: 8, current: fullStats.thisMonth },
      wins: { target: 5, current: monthWins },
      streak: { target: 3, current: fullStats.currentStreak },
      partners: { target: 3, current: uniquePartnersThisMonth.size }
    })
  }

  async function loadRecentGames(userId) {
    // Parties organisées
    const { data: orgMatches } = await supabase
      .from('matches')
      .select(`
        id, match_date, match_time, winner, organizer_team, status, score_a, score_b,
        clubs(name),
        match_participants(user_id, team, profiles!match_participants_user_id_fkey(id, name))
      `)
      .eq('organizer_id', userId)
      .eq('status', 'completed')
      .order('match_date', { ascending: false })
      .limit(10)

    // Participations
    const { data: participations } = await supabase
      .from('match_participants')
      .select(`
        team,
        matches!inner(
          id, match_date, match_time, winner, status, score_a, score_b,
          clubs(name),
          profiles!matches_organizer_id_fkey(id, name),
          match_participants(user_id, team, profiles!match_participants_user_id_fkey(id, name))
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .eq('matches.status', 'completed')
      .limit(10)

    // Fusionner
    const games = []
    const seenIds = new Set()

    ;(orgMatches || []).forEach(m => {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id)
        const myTeam = m.organizer_team || 'A'
        const partner = m.match_participants?.find(p => p.team === myTeam && p.user_id !== userId)
        games.push({
          id: m.id,
          date: m.match_date,
          time: m.match_time,
          result: m.winner === myTeam ? 'win' : 'loss',
          score: m.score_a && m.score_b ? `${m.score_a} - ${m.score_b}` : null,
          location: m.clubs?.name || 'Partie manuelle',
          partner: partner?.profiles?.name || null
        })
      }
    })

    ;(participations || []).forEach(p => {
      const m = p.matches
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id)
        const partner = m.match_participants?.find(mp => mp.team === p.team && mp.user_id !== userId)
        games.push({
          id: m.id,
          date: m.match_date,
          time: m.match_time,
          result: m.winner === p.team ? 'win' : 'loss',
          score: m.score_a && m.score_b ? `${m.score_a} - ${m.score_b}` : null,
          location: m.clubs?.name || 'Partie manuelle',
          partner: partner?.profiles?.name || m.profiles?.name || null
        })
      }
    })

    games.sort((a, b) => new Date(b.date) - new Date(a.date))
    setRecentGames(games.slice(0, 10))
  }

  async function loadActivityFeed(userId, userCity) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Résultats récents (autres joueurs)
    const { data: recentResults } = await supabase
      .from('matches')
      .select(`
        id, match_date, winner, score_a, score_b,
        profiles!matches_organizer_id_fkey(id, name),
        match_participants(user_id, team, profiles!match_participants_user_id_fkey(id, name))
      `)
      .eq('status', 'completed')
      .neq('organizer_id', userId)
      .gte('match_date', weekAgo.toISOString().split('T')[0])
      .order('match_date', { ascending: false })
      .limit(10)

    // Nouveaux joueurs
    const { data: newPlayers } = await supabase
      .from('profiles')
      .select('id, name, level, city, created_at')
      .neq('id', userId)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    // Construire le feed
    const feed = []

    ;(recentResults || []).forEach(m => {
      const organizer = m.profiles
      if (organizer) {
        const won = m.winner === 'A'
        feed.push({
          id: `result-${m.id}`,
          type: 'result',
          user: organizer.name,
          userId: organizer.id,
          action: won ? 'a gagné' : 'a perdu',
          detail: m.score_a && m.score_b ? `${m.score_a} - ${m.score_b}` : '',
          date: new Date(m.match_date)
        })
      }
    })

    ;(newPlayers || []).forEach(p => {
      feed.push({
        id: `new-${p.id}`,
        type: 'new',
        user: p.name,
        userId: p.id,
        action: 'a rejoint 2×2',
        detail: `${p.level || 'Débutant'} · ${p.city || ''}`,
        date: new Date(p.created_at)
      })
    })

    // Trier par date
    feed.sort((a, b) => b.date - a.date)
    setActivityFeed(feed.slice(0, 15))
  }

  async function loadRecentPartners(userId) {
    // Joueurs avec qui on a joué récemment
    const { data: participations } = await supabase
      .from('match_participants')
      .select(`
        matches!inner(id, organizer_id, match_participants(user_id, profiles!match_participants_user_id_fkey(id, name, avatar_url)))
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(20)

    const partnersMap = new Map()
    
    ;(participations || []).forEach(p => {
      p.matches.match_participants?.forEach(mp => {
        if (mp.user_id !== userId && mp.profiles && !partnersMap.has(mp.user_id)) {
          partnersMap.set(mp.user_id, mp.profiles)
        }
      })
    })

    // Aussi ajouter les favoris
    const { data: favorites } = await supabase
      .from('player_favorites')
      .select('profiles!player_favorites_favorite_user_id_fkey(id, name, avatar_url)')
      .eq('user_id', userId)
      .limit(10)

    ;(favorites || []).forEach(f => {
      if (f.profiles && !partnersMap.has(f.profiles.id)) {
        partnersMap.set(f.profiles.id, f.profiles)
      }
    })

    setRecentPartners(Array.from(partnersMap.values()).slice(0, 8))
  }

  // === AJOUTER UNE PARTIE ===
  async function handleAddGame() {
    if (submitting) return
    setSubmitting(true)

    try {
      // Déterminer la date
      let matchDate = new Date().toISOString().split('T')[0]
      if (newGame.date === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        matchDate = yesterday.toISOString().split('T')[0]
      } else if (newGame.date === 'other' && newGame.customDate) {
        matchDate = newGame.customDate
      }

      // Créer le match manuel
      const matchData = {
        organizer_id: user.id,
        status: 'completed',
        spots_total: 4,
        spots_available: 0,
        match_date: matchDate,
        winner: newGame.result === 'win' ? 'A' : 'B',
        organizer_team: 'A'
      }

      // Score optionnel
      if (newGame.scoreA && newGame.scoreB) {
        matchData.score_a = newGame.scoreA
        matchData.score_b = newGame.scoreB
      }

      const { data: match, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single()

      if (error) throw error

      // Ajouter le partenaire si sélectionné
      if (newGame.partner) {
        await supabase.from('match_participants').insert({
          match_id: match.id,
          user_id: newGame.partner.id,
          team: 'A',
          status: 'confirmed'
        })
      }

      // Refresh les données incluant la gamification
      const fullStats = await calculateFullStats(supabase, user.id)
      setStats(fullStats)
      
      // Mettre à jour niveau et badges
      const level = getPlayerLevel(fullStats.totalGames)
      setPlayerLevel(level)
      setLevelProgress(getLevelProgress(fullStats.totalGames))
      
      const unlocked = getUnlockedBadges(fullStats)
      setUnlockedBadges(unlocked)
      setNextBadges(getNextBadges(fullStats, 3))
      
      await Promise.all([
        loadRecentGames(user.id),
        loadWeeklyProgress(user.id),
        loadMonthlyGoals(user.id, fullStats)
      ])

      // Confetti si victoire !
      const isWin = newGame.result === 'win'
      
      // Reset et fermer
      setNewGame({
        result: 'win',
        scoreA: '',
        scoreB: '',
        partner: null,
        date: 'today',
        customDate: ''
      })
      setShowAddModal(false)
      
      // Déclencher confetti après fermeture
      if (isWin) {
        setTimeout(() => {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }, 300)
      }

    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'ajout de la partie')
    } finally {
      setSubmitting(false)
    }
  }

  // === HELPERS ===
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  function formatTimeAgo(date) {
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "À l'instant"
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // === COMPOSANTS ===
  function Avatar({ name, index = 0, size = 40 }) {
    const bgColor = PLAYER_COLORS[index % 4]
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  function StatBox({ value, label, color, suffix = '' }) {
    return (
      <div style={{
        background: COLORS.card,
        borderRadius: 20,
        padding: '20px 16px',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        flex: 1
      }}>
        <div style={{ 
          fontSize: 28, 
          fontWeight: 900, 
          color: color || COLORS.ink,
          lineHeight: 1
        }}>
          {value}{suffix}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>{label}</div>
      </div>
    )
  }

  function GoalProgress({ emoji, label, current, target, color }) {
    const percent = Math.min((current / target) * 100, 100)
    const isComplete = current >= target
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: isComplete ? `${color}20` : COLORS.bgSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          {isComplete ? '✓' : emoji}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 6
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
              {label}
            </span>
            <span style={{ 
              fontSize: 13, 
              fontWeight: 700, 
              color: isComplete ? color : COLORS.gray 
            }}>
              {current}/{target}
            </span>
          </div>
          
          <div style={{ 
            height: 6, 
            background: COLORS.bgSoft, 
            borderRadius: 100,
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${percent}%`,
              background: isComplete ? color : `${color}80`,
              borderRadius: 100,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>
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
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        {/* === HEADER === */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: COLORS.ink }}>
                Stats
              </h1>
              {playerLevel && (
                <span style={{
                  background: `${playerLevel.color}20`,
                  color: playerLevel.color,
                  padding: '6px 12px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {playerLevel.emoji} {playerLevel.name}
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: COLORS.ink,
                color: COLORS.white,
                border: 'none',
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: 18 }}>+</span>
              Ajouter
            </button>
          </div>

          {/* Barre de progression niveau */}
          {levelProgress && playerLevel && (
            <div style={{ 
              background: COLORS.card, 
              borderRadius: 16, 
              padding: '12px 16px',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8
              }}>
                <span style={{ fontSize: 13, color: COLORS.gray }}>
                  {stats.totalGames} parties jouées
                </span>
                {getNextLevel(stats.totalGames) && (
                  <span style={{ fontSize: 12, color: COLORS.muted }}>
                    Encore {levelProgress.remaining} pour {getNextLevel(stats.totalGames).emoji} {getNextLevel(stats.totalGames).name}
                  </span>
                )}
              </div>
              <div style={{ 
                height: 8, 
                background: COLORS.bgSoft, 
                borderRadius: 100,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${levelProgress.percent}%`,
                  background: `linear-gradient(90deg, ${playerLevel.color}, ${playerLevel.color}aa)`,
                  borderRadius: 100,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          )}

          {/* Stats rapides */}
          <div style={{ display: 'flex', gap: 12 }}>
            <StatBox value={stats.totalGames} label="Parties" />
            <StatBox value={stats.wins} label="Victoires" color={COLORS.green} />
            <div style={{
              background: COLORS.card,
              borderRadius: 20,
              padding: '20px 16px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              flex: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {stats.currentStreakType === 'win' && stats.currentStreak >= 3 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: `linear-gradient(135deg, ${COLORS.p2}10, ${COLORS.p1}10)`,
                  pointerEvents: 'none'
                }} />
              )}
              <div style={{ 
                fontSize: 28, 
                fontWeight: 900, 
                color: stats.currentStreakType === 'win' ? COLORS.p2 : COLORS.gray,
                lineHeight: 1,
                position: 'relative'
              }}>
                {stats.currentStreak}{stats.currentStreakType === 'win' ? '🔥' : ''}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, position: 'relative' }}>
                {stats.currentStreakType === 'win' ? 'Série victoires' : 'Série'}
              </div>
            </div>
          </div>
          
          {/* Message de série */}
          {getStreakMessage(stats.currentStreak, stats.currentStreakType) && (
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.p2}15, ${COLORS.p1}15)`,
              borderRadius: 12,
              padding: '12px 16px',
              marginTop: 12,
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.ink
            }}>
              {getStreakMessage(stats.currentStreak, stats.currentStreakType)}
            </div>
          )}
        </div>

        {/* === ONGLETS === */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          background: COLORS.bgSoft,
          padding: 6,
          borderRadius: 16
        }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'stats' ? COLORS.card : 'transparent',
              color: activeTab === 'stats' ? COLORS.ink : COLORS.gray,
              boxShadow: activeTab === 'stats' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📊 Mes stats
          </button>
          <button
            onClick={() => setActiveTab('community')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'community' ? COLORS.card : 'transparent',
              color: activeTab === 'community' ? COLORS.ink : COLORS.gray,
              boxShadow: activeTab === 'community' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            👥 Communauté
          </button>
        </div>

        {/* === ONGLET MES STATS === */}
        {activeTab === 'stats' && (
          <div>
            {/* Progression hebdomadaire */}
            {weeklyProgress.length > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: 24,
                padding: 24,
                marginBottom: 16,
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>
                  📈 Progression
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, marginBottom: 12 }}>
                  {weeklyProgress.map((week, i) => {
                    const maxCount = Math.max(...weeklyProgress.map(w => w.count), 1)
                    const height = (week.count / maxCount) * 100
                    const isCurrentWeek = i === weeklyProgress.length - 1
                    
                    return (
                      <div 
                        key={i}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 600, 
                          color: isCurrentWeek ? COLORS.p4 : COLORS.muted 
                        }}>
                          {week.count || ''}
                        </span>
                        <div 
                          style={{
                            width: '100%',
                            height: `${Math.max(height, 8)}%`,
                            background: isCurrentWeek ? COLORS.p4 : COLORS.bgSoft,
                            borderRadius: 6,
                            transition: 'all 0.3s ease',
                            minHeight: 8
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: 11, 
                  color: COLORS.muted 
                }}>
                  <span>8 dernières semaines</span>
                  <span style={{ 
                    color: stats.thisMonth > 0 ? COLORS.green : COLORS.muted, 
                    fontWeight: 600 
                  }}>
                    {stats.thisMonth} ce mois
                  </span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div style={{
              background: COLORS.card,
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16 
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                  🏅 Badges ({unlockedBadges.length}/{PERFORMANCE_BADGES.length})
                </h3>
                <button 
                  onClick={() => setShowBadgesModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: COLORS.p4,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Voir tout
                </button>
              </div>
              
              {unlockedBadges.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  background: COLORS.bgSoft,
                  borderRadius: 16
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                  <p style={{ color: COLORS.gray, margin: 0, fontSize: 13 }}>
                    Joue des parties pour débloquer des badges !
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {unlockedBadges.slice(0, 6).map((badge) => (
                    <div 
                      key={badge.id}
                      title={badge.description}
                      style={{
                        background: COLORS.bgSoft,
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{badge.emoji}</span>
                      {badge.name}
                    </div>
                  ))}
                  {unlockedBadges.length > 6 && (
                    <div style={{
                      background: COLORS.bgSoft,
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.muted
                    }}>
                      +{unlockedBadges.length - 6}
                    </div>
                  )}
                </div>
              )}
              
              {/* Prochains badges */}
              {nextBadges.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                  <p style={{ fontSize: 12, color: COLORS.muted, margin: '0 0 10px' }}>
                    Prochains badges à débloquer :
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {nextBadges.map((badge) => (
                      <div 
                        key={badge.id}
                        title={badge.description}
                        style={{
                          background: COLORS.white,
                          border: `1px dashed ${COLORS.border}`,
                          borderRadius: 12,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: COLORS.muted,
                          opacity: 0.7
                        }}
                      >
                        <span style={{ fontSize: 16, filter: 'grayscale(100%)' }}>{badge.emoji}</span>
                        {badge.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Objectifs mensuels */}
            <div style={{
              background: COLORS.card,
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>
                🎯 Objectifs du mois
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Objectif parties */}
                <GoalProgress 
                  emoji="🎾"
                  label="Parties jouées"
                  current={monthlyGoals.games.current}
                  target={monthlyGoals.games.target}
                  color={COLORS.p3}
                />
                
                {/* Objectif victoires */}
                <GoalProgress 
                  emoji="🏆"
                  label="Victoires"
                  current={monthlyGoals.wins.current}
                  target={monthlyGoals.wins.target}
                  color={COLORS.green}
                />
                
                {/* Objectif série */}
                <GoalProgress 
                  emoji="🔥"
                  label="Série en cours"
                  current={monthlyGoals.streak.current}
                  target={monthlyGoals.streak.target}
                  color={COLORS.p2}
                />
                
                {/* Objectif partenaires */}
                <GoalProgress 
                  emoji="🤝"
                  label="Partenaires différents"
                  current={monthlyGoals.partners.current}
                  target={monthlyGoals.partners.target}
                  color={COLORS.p4}
                />
              </div>
              
              {/* Message de motivation */}
              {Object.values(monthlyGoals).filter(g => g.current >= g.target).length === 4 && (
                <div style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: `linear-gradient(135deg, ${COLORS.green}15, ${COLORS.p3}15)`,
                  borderRadius: 12,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.ink
                }}>
                  🎉 Tous les objectifs atteints ! Champion !
                </div>
              )}
            </div>

            {/* Détails */}
            <div style={{
              background: COLORS.card,
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.ink }}>
                🎯 Détails
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.winRate}%</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Taux victoire</div>
                </div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.bestWinStreak}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Record série 🔥</div>
                </div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.organized}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Organisées</div>
                </div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.uniquePartners}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Partenaires</div>
                </div>
              </div>
            </div>

            {/* Partager */}
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.p4}15, ${COLORS.p3}15)`,
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
              border: `1px solid ${COLORS.p4}30`
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: COLORS.ink }}>
                📤 Partager
              </h3>
              <p style={{ fontSize: 13, color: COLORS.gray, margin: '0 0 16px' }}>
                Montre ta progression à tes amis !
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShareModal({ open: true, type: 'profile' })}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  🪪 Ma carte
                </button>
                <button
                  onClick={() => setShareModal({ open: true, type: 'recap' })}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    background: COLORS.ink,
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  📊 Récap du mois
                </button>
              </div>
            </div>

            {/* Historique */}
            <div style={{
              background: COLORS.card,
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16 
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                  🏆 Dernières parties
                </h3>
              </div>
              
              {recentGames.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
                  <p style={{ color: COLORS.gray, margin: '0 0 8px', fontSize: 14 }}>Aucune partie enregistrée</p>
                  <p style={{ color: COLORS.muted, margin: 0, fontSize: 13 }}>
                    Clique sur "+ Ajouter" pour tracker tes parties
                  </p>
                </div>
              ) : (
                recentGames.map((game, i) => (
                  <div 
                    key={game.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom: i < recentGames.length - 1 ? `1px solid ${COLORS.border}` : 'none'
                    }}
                  >
                    {/* Indicateur */}
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: game.result === 'win' ? COLORS.greenSoft : COLORS.redSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: game.result === 'win' ? COLORS.green : COLORS.red
                    }}>
                      {game.result === 'win' ? '✓' : '✗'}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 2 }}>
                        {game.score || (game.result === 'win' ? 'Victoire' : 'Défaite')}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: COLORS.muted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {game.partner ? `avec ${game.partner} · ` : ''}{game.location}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 12, color: COLORS.muted, flexShrink: 0 }}>
                      {formatDate(game.date)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === ONGLET COMMUNAUTÉ === */}
        {activeTab === 'community' && (
          <div style={{
            background: COLORS.card,
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
          }}>
            <div style={{ padding: '20px 20px 8px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.ink }}>
                Activité récente
              </h3>
            </div>
            
            {activityFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ color: COLORS.gray, margin: 0, fontSize: 14 }}>Pas d'activité récente</p>
              </div>
            ) : (
              activityFeed.map((item, i) => (
                <Link 
                  key={item.id}
                  href={`/player/${item.userId}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '16px 20px',
                      borderBottom: i < activityFeed.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <Avatar name={item.user} index={i} size={44} />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: COLORS.ink, marginBottom: 2 }}>
                        <strong>{item.user}</strong>{' '}
                        <span style={{ color: COLORS.gray }}>{item.action}</span>
                      </div>
                      {item.detail && (
                        <div style={{ 
                          fontSize: 13, 
                          color: COLORS.muted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.detail}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0, marginTop: 2 }}>
                      {formatTimeAgo(item.date)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* === MODAL BADGES === */}
      {showBadgesModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setShowBadgesModal(false)}
        >
          <div 
            style={{
              background: COLORS.card,
              borderRadius: 28,
              width: '100%',
              maxWidth: 500,
              maxHeight: '85vh',
              overflow: 'auto',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: COLORS.ink }}>
                🏅 Tous les badges
              </h2>
              <button 
                onClick={() => setShowBadgesModal(false)}
                style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: COLORS.bgSoft,
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.gray
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                background: COLORS.bgSoft, 
                borderRadius: 12, 
                padding: '12px 16px',
                textAlign: 'center',
                marginBottom: 20
              }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>
                  {unlockedBadges.length}
                </span>
                <span style={{ color: COLORS.muted }}> / {PERFORMANCE_BADGES.length} débloqués</span>
              </div>

              {BADGE_CATEGORIES.map(category => {
                const categoryBadges = PERFORMANCE_BADGES.filter(b => b.category === category.id)
                const unlockedInCategory = categoryBadges.filter(b => 
                  unlockedBadges.some(ub => ub.id === b.id)
                )
                
                return (
                  <div key={category.id} style={{ marginBottom: 20 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: COLORS.ink,
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>{category.name}</span>
                      <span style={{ 
                        fontSize: 12, 
                        color: COLORS.muted,
                        fontWeight: 500
                      }}>
                        {unlockedInCategory.length}/{categoryBadges.length}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {categoryBadges.map(badge => {
                        const isUnlocked = unlockedBadges.some(ub => ub.id === badge.id)
                        
                        return (
                          <div 
                            key={badge.id}
                            style={{
                              background: isUnlocked ? COLORS.bgSoft : COLORS.white,
                              border: isUnlocked ? 'none' : `1px dashed ${COLORS.border}`,
                              borderRadius: 12,
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              opacity: isUnlocked ? 1 : 0.5
                            }}
                          >
                            <span style={{ 
                              fontSize: 18,
                              filter: isUnlocked ? 'none' : 'grayscale(100%)'
                            }}>
                              {badge.emoji}
                            </span>
                            <div>
                              <div style={{ 
                                fontSize: 13, 
                                fontWeight: 600, 
                                color: isUnlocked ? COLORS.ink : COLORS.muted 
                              }}>
                                {badge.name}
                              </div>
                              <div style={{ fontSize: 11, color: COLORS.muted }}>
                                {badge.description}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL AJOUTER PARTIE === */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              background: COLORS.card,
              borderRadius: 28,
              width: '100%',
              maxWidth: 500,
              maxHeight: '85vh',
              overflow: 'auto',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: COLORS.ink }}>
                Ajouter une partie
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: COLORS.bgSoft,
                  fontSize: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.gray
                }}
              >
                ×
              </button>
            </div>

            {/* Résultat */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, display: 'block', marginBottom: 10 }}>
                Résultat
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setNewGame({ ...newGame, result: 'win' })}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    border: newGame.result === 'win' ? `2px solid ${COLORS.green}` : `2px solid ${COLORS.border}`,
                    background: newGame.result === 'win' ? COLORS.greenSoft : COLORS.white,
                    fontSize: 16,
                    fontWeight: 700,
                    color: newGame.result === 'win' ? COLORS.green : COLORS.gray,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Victoire
                </button>
                <button 
                  onClick={() => setNewGame({ ...newGame, result: 'loss' })}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    border: newGame.result === 'loss' ? `2px solid ${COLORS.red}` : `2px solid ${COLORS.border}`,
                    background: newGame.result === 'loss' ? COLORS.redSoft : COLORS.white,
                    fontSize: 16,
                    fontWeight: 700,
                    color: newGame.result === 'loss' ? COLORS.red : COLORS.gray,
                    cursor: 'pointer'
                  }}
                >
                  ✗ Défaite
                </button>
              </div>
            </div>

            {/* Score */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, display: 'block', marginBottom: 10 }}>
                Score <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optionnel)</span>
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="6-4" 
                  value={newGame.scoreA}
                  onChange={e => setNewGame({ ...newGame, scoreA: e.target.value })}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 16,
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <span style={{ color: COLORS.muted, fontSize: 18 }}>/</span>
                <input 
                  type="text" 
                  placeholder="6-3" 
                  value={newGame.scoreB}
                  onChange={e => setNewGame({ ...newGame, scoreB: e.target.value })}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 16,
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Partenaire */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, display: 'block', marginBottom: 10 }}>
                Partenaire <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optionnel)</span>
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recentPartners.map((player, i) => (
                  <button 
                    key={player.id}
                    onClick={() => setNewGame({ 
                      ...newGame, 
                      partner: newGame.partner?.id === player.id ? null : player 
                    })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 100,
                      border: newGame.partner?.id === player.id ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                      background: newGame.partner?.id === player.id ? COLORS.bgSoft : COLORS.white,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: COLORS.ink
                    }}
                  >
                    <div style={{
                      width: 24, height: 24,
                      borderRadius: 6,
                      background: PLAYER_COLORS[i % 4],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: COLORS.white,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {player.name?.[0]}
                    </div>
                    {player.name?.split(' ')[0]}
                  </button>
                ))}
                {recentPartners.length === 0 && (
                  <span style={{ fontSize: 13, color: COLORS.muted }}>
                    Aucun partenaire récent
                  </span>
                )}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, display: 'block', marginBottom: 10 }}>
                Date
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: newGame.date === 'other' ? 12 : 0 }}>
                {[
                  { id: 'today', label: "Aujourd'hui" },
                  { id: 'yesterday', label: 'Hier' },
                  { id: 'other', label: 'Autre' }
                ].map(d => (
                  <button 
                    key={d.id}
                    onClick={() => setNewGame({ ...newGame, date: d.id })}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 12,
                      border: newGame.date === d.id ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                      background: newGame.date === d.id ? COLORS.bgSoft : COLORS.white,
                      fontSize: 14,
                      fontWeight: 600,
                      color: newGame.date === d.id ? COLORS.ink : COLORS.gray,
                      cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {newGame.date === 'other' && (
                <input 
                  type="date"
                  value={newGame.customDate}
                  onChange={e => setNewGame({ ...newGame, customDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 16,
                    outline: 'none'
                  }}
                />
              )}
            </div>

            {/* Bouton enregistrer */}
            <button 
              onClick={handleAddGame}
              disabled={submitting}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 16,
                border: 'none',
                background: submitting ? COLORS.muted : COLORS.ink,
                color: COLORS.white,
                fontSize: 16,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer la partie'}
            </button>
          </div>
        </div>
      )}

      {/* === MODAL PARTAGE === */}
      <ShareModal
        isOpen={shareModal.open}
        onClose={() => setShareModal({ open: false, type: null })}
        type={shareModal.type}
        data={shareModal.type === 'profile' ? {
          name: profile?.name,
          level: profile?.level || 'Intermédiaire',
          city: profile?.city || '',
          totalGames: stats.totalGames,
          wins: stats.wins,
          winRate: stats.winRate,
          currentStreak: stats.currentStreak,
          playerLevel
        } : shareModal.type === 'recap' ? monthlyRecap : {}}
      />

      {/* === CONFETTI === */}
      <Confetti active={showConfetti} />

      <style jsx global>{`
        body {
          background: ${COLORS.bg};
        }
      `}</style>
    </>
  )
}