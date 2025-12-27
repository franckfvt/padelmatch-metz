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
    streakType: 'none',
    thisMonth: 0,
    lastMonth: 0
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

    // Charger les stats et l'historique
    await Promise.all([
      loadStats(userId),
      loadRecentGames(userId),
      loadActivityFeed(userId, profileData?.city),
      loadRecentPartners(userId)
    ])

    setLoading(false)
  }

  async function loadStats(userId) {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // Parties organisées
    const { data: orgMatches } = await supabase
      .from('matches')
      .select('id, match_date, winner, organizer_team, status')
      .eq('organizer_id', userId)
      .in('status', ['completed', 'open', 'full'])

    // Participations
    const { data: participations } = await supabase
      .from('match_participants')
      .select('match_id, team, matches!inner(id, match_date, winner, status)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .in('matches.status', ['completed', 'open', 'full'])

    // Fusionner et dédupliquer
    const allGames = []
    const seenIds = new Set()

    ;(orgMatches || []).forEach(m => {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id)
        allGames.push({ ...m, myTeam: m.organizer_team || 'A' })
      }
    })

    ;(participations || []).forEach(p => {
      if (!seenIds.has(p.match_id)) {
        seenIds.add(p.match_id)
        allGames.push({ 
          id: p.match_id, 
          match_date: p.matches.match_date,
          winner: p.matches.winner,
          status: p.matches.status,
          myTeam: p.team 
        })
      }
    })

    // Calculer les stats
    const completedGames = allGames.filter(g => g.status === 'completed' && g.winner)
    const wins = completedGames.filter(g => g.winner === g.myTeam).length
    const losses = completedGames.length - wins

    // Ce mois / mois dernier
    const thisMonthGames = allGames.filter(g => {
      const d = new Date(g.match_date)
      return d >= startOfMonth
    }).length

    const lastMonthGames = allGames.filter(g => {
      const d = new Date(g.match_date)
      return d >= startOfLastMonth && d <= endOfLastMonth
    }).length

    // Calculer la série actuelle
    const sortedCompleted = completedGames
      .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    
    let streak = 0
    let streakType = 'none'
    
    if (sortedCompleted.length > 0) {
      const firstResult = sortedCompleted[0].winner === sortedCompleted[0].myTeam ? 'win' : 'loss'
      streakType = firstResult
      
      for (const game of sortedCompleted) {
        const isWin = game.winner === game.myTeam
        if ((streakType === 'win' && isWin) || (streakType === 'loss' && !isWin)) {
          streak++
        } else {
          break
        }
      }
    }

    setStats({
      totalGames: allGames.length,
      wins,
      losses,
      winRate: completedGames.length > 0 ? Math.round((wins / completedGames.length) * 100) : 0,
      currentStreak: streak,
      streakType,
      thisMonth: thisMonthGames,
      lastMonth: lastMonthGames
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

      // Refresh les données
      await Promise.all([
        loadStats(user.id),
        loadRecentGames(user.id)
      ])

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
            marginBottom: 20
          }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: COLORS.ink }}>
              Stats
            </h1>
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

          {/* Stats rapides */}
          <div style={{ display: 'flex', gap: 12 }}>
            <StatBox value={stats.totalGames} label="Parties" />
            <StatBox value={stats.wins} label="Victoires" color={COLORS.green} />
            <StatBox 
              value={stats.currentStreak} 
              suffix={stats.streakType === 'win' ? '🔥' : ''}
              label="Série" 
              color={stats.streakType === 'win' ? COLORS.p2 : COLORS.gray}
            />
          </div>
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
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.thisMonth}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Ce mois-ci</div>
                </div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.losses}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>Défaites</div>
                </div>
                <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: stats.thisMonth > stats.lastMonth ? COLORS.green : COLORS.gray }}>
                    {stats.thisMonth > stats.lastMonth ? '+' : ''}{stats.thisMonth - stats.lastMonth}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>vs mois dernier</div>
                </div>
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

      <style jsx global>{`
        body {
          background: ${COLORS.bg};
        }
      `}</style>
    </>
  )
}