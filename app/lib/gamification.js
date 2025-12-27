/**
 * ============================================
 * 2×2 GAMIFICATION SYSTEM
 * ============================================
 * 
 * - Niveaux joueur (Bronze → Légende)
 * - Badges de performance (accomplissements réels)
 * - Séries (win streak, participation streak)
 * - Calcul et attribution automatique
 * 
 * ============================================
 */

// === NIVEAUX JOUEUR ===
// Basés sur le nombre total de parties jouées

export const PLAYER_LEVELS = [
  { 
    id: 'bronze', 
    name: 'Bronze', 
    emoji: '🥉', 
    color: '#CD7F32',
    minGames: 0, 
    maxGames: 10,
    description: 'Premiers pas sur le court'
  },
  { 
    id: 'silver', 
    name: 'Argent', 
    emoji: '🥈', 
    color: '#C0C0C0',
    minGames: 11, 
    maxGames: 30,
    description: 'Joueur régulier'
  },
  { 
    id: 'gold', 
    name: 'Or', 
    emoji: '🥇', 
    color: '#FFD700',
    minGames: 31, 
    maxGames: 60,
    description: 'Padeliste confirmé'
  },
  { 
    id: 'diamond', 
    name: 'Diamant', 
    emoji: '💎', 
    color: '#B9F2FF',
    minGames: 61, 
    maxGames: 100,
    description: 'Expert du padel'
  },
  { 
    id: 'legend', 
    name: 'Légende', 
    emoji: '👑', 
    color: '#9B59B6',
    minGames: 101, 
    maxGames: Infinity,
    description: 'Maître incontesté'
  }
]

export function getPlayerLevel(totalGames) {
  for (const level of PLAYER_LEVELS) {
    if (totalGames >= level.minGames && totalGames <= level.maxGames) {
      return level
    }
  }
  return PLAYER_LEVELS[0]
}

export function getNextLevel(totalGames) {
  const currentLevel = getPlayerLevel(totalGames)
  const currentIndex = PLAYER_LEVELS.findIndex(l => l.id === currentLevel.id)
  if (currentIndex < PLAYER_LEVELS.length - 1) {
    return PLAYER_LEVELS[currentIndex + 1]
  }
  return null
}

export function getLevelProgress(totalGames) {
  const currentLevel = getPlayerLevel(totalGames)
  const nextLevel = getNextLevel(totalGames)
  
  if (!nextLevel) return { current: totalGames, max: totalGames, percent: 100 }
  
  const gamesInLevel = totalGames - currentLevel.minGames
  const gamesNeeded = nextLevel.minGames - currentLevel.minGames
  const percent = Math.round((gamesInLevel / gamesNeeded) * 100)
  
  return {
    current: gamesInLevel,
    max: gamesNeeded,
    percent: Math.min(percent, 100),
    remaining: nextLevel.minGames - totalGames
  }
}


// === BADGES DE PERFORMANCE ===
// Basés sur les accomplissements réels

export const PERFORMANCE_BADGES = [
  // Séries
  {
    id: 'on_fire',
    emoji: '🔥',
    name: 'En feu',
    description: '5 victoires d\'affilée',
    category: 'streak',
    condition: (stats) => stats.bestWinStreak >= 5,
    tier: 1
  },
  {
    id: 'unstoppable',
    emoji: '💥',
    name: 'Inarrêtable',
    description: '10 victoires d\'affilée',
    category: 'streak',
    condition: (stats) => stats.bestWinStreak >= 10,
    tier: 2
  },
  {
    id: 'legendary_streak',
    emoji: '⚡',
    name: 'Série légendaire',
    description: '15 victoires d\'affilée',
    category: 'streak',
    condition: (stats) => stats.bestWinStreak >= 15,
    tier: 3
  },

  // Victoires
  {
    id: 'first_win',
    emoji: '🎉',
    name: 'Première victoire',
    description: 'Remporter sa première partie',
    category: 'wins',
    condition: (stats) => stats.wins >= 1,
    tier: 1
  },
  {
    id: 'winner_10',
    emoji: '🏅',
    name: 'Vainqueur',
    description: '10 victoires',
    category: 'wins',
    condition: (stats) => stats.wins >= 10,
    tier: 1
  },
  {
    id: 'winner_50',
    emoji: '🏆',
    name: 'Champion',
    description: '50 victoires',
    category: 'wins',
    condition: (stats) => stats.wins >= 50,
    tier: 2
  },
  {
    id: 'winner_100',
    emoji: '👑',
    name: 'Roi du padel',
    description: '100 victoires',
    category: 'wins',
    condition: (stats) => stats.wins >= 100,
    tier: 3
  },

  // Précision
  {
    id: 'sniper',
    emoji: '🎯',
    name: 'Sniper',
    description: '70%+ de victoires (min 20 parties)',
    category: 'precision',
    condition: (stats) => stats.totalCompleted >= 20 && stats.winRate >= 70,
    tier: 2
  },
  {
    id: 'perfectionist',
    emoji: '💯',
    name: 'Perfectionniste',
    description: '80%+ de victoires (min 30 parties)',
    category: 'precision',
    condition: (stats) => stats.totalCompleted >= 30 && stats.winRate >= 80,
    tier: 3
  },

  // Régularité
  {
    id: 'regular',
    emoji: '📅',
    name: 'Régulier',
    description: '4 semaines consécutives avec au moins 1 partie',
    category: 'regularity',
    condition: (stats) => stats.consecutiveWeeks >= 4,
    tier: 1
  },
  {
    id: 'dedicated',
    emoji: '💪',
    name: 'Dévoué',
    description: '8 semaines consécutives',
    category: 'regularity',
    condition: (stats) => stats.consecutiveWeeks >= 8,
    tier: 2
  },
  {
    id: 'addicted',
    emoji: '🤩',
    name: 'Accro',
    description: '12 semaines consécutives',
    category: 'regularity',
    condition: (stats) => stats.consecutiveWeeks >= 12,
    tier: 3
  },

  // Organisation
  {
    id: 'organizer',
    emoji: '📋',
    name: 'Organisateur',
    description: 'Organiser 5 parties',
    category: 'social',
    condition: (stats) => stats.organized >= 5,
    tier: 1
  },
  {
    id: 'leader',
    emoji: '🎖️',
    name: 'Leader',
    description: 'Organiser 20 parties',
    category: 'social',
    condition: (stats) => stats.organized >= 20,
    tier: 2
  },
  {
    id: 'captain',
    emoji: '⭐',
    name: 'Capitaine',
    description: 'Organiser 50 parties',
    category: 'social',
    condition: (stats) => stats.organized >= 50,
    tier: 3
  },

  // Social
  {
    id: 'social_player',
    emoji: '🤝',
    name: 'Social',
    description: 'Jouer avec 10 partenaires différents',
    category: 'social',
    condition: (stats) => stats.uniquePartners >= 10,
    tier: 1
  },
  {
    id: 'networker',
    emoji: '🌐',
    name: 'Networker',
    description: 'Jouer avec 30 partenaires différents',
    category: 'social',
    condition: (stats) => stats.uniquePartners >= 30,
    tier: 2
  },
  {
    id: 'community_star',
    emoji: '🌟',
    name: 'Star de la communauté',
    description: 'Jouer avec 50 partenaires différents',
    category: 'social',
    condition: (stats) => stats.uniquePartners >= 50,
    tier: 3
  },

  // Horaires
  {
    id: 'early_bird',
    emoji: '🌅',
    name: 'Lève-tôt',
    description: '10 parties avant 10h',
    category: 'timing',
    condition: (stats) => stats.earlyGames >= 10,
    tier: 1
  },
  {
    id: 'night_owl',
    emoji: '🦉',
    name: 'Noctambule',
    description: '10 parties après 20h',
    category: 'timing',
    condition: (stats) => stats.lateGames >= 10,
    tier: 1
  },
  {
    id: 'weekend_warrior',
    emoji: '🏖️',
    name: 'Weekend Warrior',
    description: '20 parties le weekend',
    category: 'timing',
    condition: (stats) => stats.weekendGames >= 20,
    tier: 1
  },

  // Milestone
  {
    id: 'first_game',
    emoji: '🎾',
    name: 'Première partie',
    description: 'Jouer sa première partie',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 1,
    tier: 1
  },
  {
    id: 'games_25',
    emoji: '🎯',
    name: '25 parties',
    description: 'Atteindre 25 parties',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 25,
    tier: 1
  },
  {
    id: 'games_50',
    emoji: '🎪',
    name: '50 parties',
    description: 'Atteindre 50 parties',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 50,
    tier: 2
  },
  {
    id: 'games_100',
    emoji: '💯',
    name: 'Centurion',
    description: 'Atteindre 100 parties',
    category: 'milestone',
    condition: (stats) => stats.totalGames >= 100,
    tier: 3
  },
]

export const BADGE_CATEGORIES = [
  { id: 'streak', name: '🔥 Séries', color: '#ff5a5f' },
  { id: 'wins', name: '🏆 Victoires', color: '#ffb400' },
  { id: 'precision', name: '🎯 Précision', color: '#00b8a9' },
  { id: 'regularity', name: '📅 Régularité', color: '#7c5cff' },
  { id: 'social', name: '🤝 Social', color: '#3b82f6' },
  { id: 'timing', name: '⏰ Horaires', color: '#f59e0b' },
  { id: 'milestone', name: '🎯 Jalons', color: '#10b981' },
]

export function getUnlockedBadges(stats) {
  return PERFORMANCE_BADGES.filter(badge => badge.condition(stats))
}

export function getLockedBadges(stats) {
  return PERFORMANCE_BADGES.filter(badge => !badge.condition(stats))
}

export function getNextBadges(stats, limit = 3) {
  // Retourner les badges les plus proches d'être débloqués
  const locked = getLockedBadges(stats)
  
  // Trier par "proximité" (badges tier 1 d'abord, puis par catégorie)
  return locked
    .sort((a, b) => a.tier - b.tier)
    .slice(0, limit)
}

export function getBadgesByCategory(badges) {
  const grouped = {}
  BADGE_CATEGORIES.forEach(cat => {
    grouped[cat.id] = badges.filter(b => b.category === cat.id)
  })
  return grouped
}


// === CALCUL DES STATS COMPLÈTES ===

export async function calculateFullStats(supabase, userId) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  
  // Récupérer toutes les parties
  const [orgResult, partResult] = await Promise.all([
    supabase
      .from('matches')
      .select('id, match_date, match_time, winner, organizer_team, status')
      .eq('organizer_id', userId)
      .in('status', ['completed', 'open', 'full']),
    supabase
      .from('match_participants')
      .select('match_id, team, user_id, matches!inner(id, match_date, match_time, winner, status, organizer_id)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
  ])

  // Fusionner et dédupliquer
  const allGames = []
  const seenIds = new Set()
  const partnersSet = new Set()

  ;(orgResult.data || []).forEach(m => {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id)
      allGames.push({ ...m, myTeam: m.organizer_team || 'A', isOrganizer: true })
    }
  })

  ;(partResult.data || []).forEach(p => {
    if (!seenIds.has(p.match_id)) {
      seenIds.add(p.match_id)
      allGames.push({
        id: p.match_id,
        match_date: p.matches.match_date,
        match_time: p.matches.match_time,
        winner: p.matches.winner,
        status: p.matches.status,
        myTeam: p.team,
        isOrganizer: p.matches.organizer_id === userId
      })
    }
  })

  // Trier par date
  allGames.sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  // Stats de base
  const completedGames = allGames.filter(g => g.status === 'completed' && g.winner)
  const wins = completedGames.filter(g => g.winner === g.myTeam).length
  const losses = completedGames.length - wins
  const totalGames = allGames.length
  const organized = allGames.filter(g => g.isOrganizer).length

  // Win rate
  const winRate = completedGames.length > 0 
    ? Math.round((wins / completedGames.length) * 100) 
    : 0

  // Calculer les séries
  let currentStreak = 0
  let currentStreakType = 'none'
  let bestWinStreak = 0
  let tempWinStreak = 0

  const sortedCompleted = [...completedGames].sort(
    (a, b) => new Date(b.match_date) - new Date(a.match_date)
  )

  // Série actuelle
  if (sortedCompleted.length > 0) {
    const firstResult = sortedCompleted[0].winner === sortedCompleted[0].myTeam
    currentStreakType = firstResult ? 'win' : 'loss'
    
    for (const game of sortedCompleted) {
      const isWin = game.winner === game.myTeam
      if ((currentStreakType === 'win' && isWin) || (currentStreakType === 'loss' && !isWin)) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Meilleure série de victoires
  const chronologicalCompleted = [...completedGames].sort(
    (a, b) => new Date(a.match_date) - new Date(b.match_date)
  )
  
  for (const game of chronologicalCompleted) {
    if (game.winner === game.myTeam) {
      tempWinStreak++
      bestWinStreak = Math.max(bestWinStreak, tempWinStreak)
    } else {
      tempWinStreak = 0
    }
  }

  // Semaines consécutives
  let consecutiveWeeks = 0
  if (allGames.length > 0) {
    const gamesByWeek = new Map()
    allGames.forEach(g => {
      const date = new Date(g.match_date)
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      gamesByWeek.set(weekKey, true)
    })

    // Compter les semaines consécutives depuis aujourd'hui
    let checkDate = new Date()
    checkDate.setDate(checkDate.getDate() - checkDate.getDay())
    
    while (true) {
      const weekKey = checkDate.toISOString().split('T')[0]
      if (gamesByWeek.has(weekKey)) {
        consecutiveWeeks++
        checkDate.setDate(checkDate.getDate() - 7)
      } else {
        break
      }
    }
  }

  // Comptage partenaires uniques
  const { data: partnerData } = await supabase
    .from('match_participants')
    .select('matches!inner(id, match_participants(user_id))')
    .eq('user_id', userId)
    .eq('status', 'confirmed')

  ;(partnerData || []).forEach(p => {
    p.matches?.match_participants?.forEach(mp => {
      if (mp.user_id !== userId) partnersSet.add(mp.user_id)
    })
  })
  const uniquePartners = partnersSet.size

  // Parties par horaire
  let earlyGames = 0  // avant 10h
  let lateGames = 0   // après 20h
  let weekendGames = 0

  allGames.forEach(g => {
    if (g.match_time) {
      const hour = parseInt(g.match_time.split(':')[0])
      if (hour < 10) earlyGames++
      if (hour >= 20) lateGames++
    }
    if (g.match_date) {
      const day = new Date(g.match_date).getDay()
      if (day === 0 || day === 6) weekendGames++
    }
  })

  // Ce mois-ci et mois dernier
  const thisMonth = allGames.filter(g => new Date(g.match_date) >= startOfMonth).length
  const lastMonth = allGames.filter(g => {
    const d = new Date(g.match_date)
    return d >= startOfLastMonth && d <= endOfLastMonth
  }).length

  return {
    totalGames,
    totalCompleted: completedGames.length,
    wins,
    losses,
    winRate,
    organized,
    currentStreak,
    currentStreakType,
    bestWinStreak,
    consecutiveWeeks,
    uniquePartners,
    earlyGames,
    lateGames,
    weekendGames,
    thisMonth,
    lastMonth
  }
}


// === MESSAGES DE FÉLICITATIONS ===

export function getStreakMessage(streak, type) {
  if (type !== 'win' || streak === 0) return null
  
  if (streak >= 10) return "🔥 INCROYABLE ! Tu es en feu !"
  if (streak >= 7) return "⚡ Impressionnant ! Continue comme ça !"
  if (streak >= 5) return "🎯 Belle série ! Tu gères !"
  if (streak >= 3) return "💪 Bien joué ! La forme !"
  return null
}

export function getLevelUpMessage(oldLevel, newLevel) {
  return `🎉 Félicitations ! Tu passes ${newLevel.emoji} ${newLevel.name} !`
}

export function getBadgeUnlockMessage(badge) {
  return `🏅 Nouveau badge débloqué : ${badge.emoji} ${badge.name}`
}