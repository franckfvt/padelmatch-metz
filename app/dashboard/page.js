'use client'

/**
 * ============================================
 * DASHBOARD - NOUVEAU DESIGN V3
 * ============================================
 * 
 * - Cards horizontales pour "Mes parties"
 * - Avatars des joueurs
 * - Filtres avancés pour parties disponibles
 * - "Près de [ville]" basé sur le profil
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateMatchModal from '@/app/components/CreateMatchModal'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [myMatches, setMyMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Données pour sidebar desktop
  const [stats, setStats] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [favClubs, setFavClubs] = useState([])
  
  // Filtres
  const [showFilters, setShowFilters] = useState(false)
  const [filterAmbiance, setFilterAmbiance] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterDate, setFilterDate] = useState('week')

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente', color: '#22c55e' },
    mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6' },
    compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b' }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      const today = new Date().toISOString().split('T')[0]
      
      // === MES PARTIES ===
      // Parties où je suis organisateur
      const { data: orgMatches } = await supabase
        .from('matches')
        .select(`
          *, 
          clubs (name, address), 
          profiles!matches_organizer_id_fkey (id, name, avatar_url),
          match_participants (
            id, user_id, team, status,
            profiles!match_participants_user_id_fkey (id, name, avatar_url, level)
          )
        `)
        .eq('organizer_id', session.user.id)
        .in('status', ['open', 'full'])
        .or(`match_date.gte.${today},match_date.is.null`)
        .order('match_date', { ascending: true, nullsFirst: false })

      // Parties où je suis participant
      const { data: participations } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      let partMatches = []
      if (participations && participations.length > 0) {
        const matchIds = participations.map(p => p.match_id)
        const { data: partData } = await supabase
          .from('matches')
          .select(`
            *, 
            clubs (name, address), 
            profiles!matches_organizer_id_fkey (id, name, avatar_url),
            match_participants (
              id, user_id, team, status,
              profiles!match_participants_user_id_fkey (id, name, avatar_url, level)
            )
          `)
          .in('id', matchIds)
          .in('status', ['open', 'full'])
          .or(`match_date.gte.${today},match_date.is.null`)
          .order('match_date', { ascending: true, nullsFirst: false })
        
        partMatches = partData || []
      }

      // Fusionner et dédupliquer
      const allMyMatches = [...(orgMatches || []), ...partMatches]
      const uniqueMyMatches = allMyMatches.reduce((acc, match) => {
        if (!acc.find(m => m.id === match.id)) acc.push(match)
        return acc
      }, [])
      
      uniqueMyMatches.sort((a, b) => {
        if (!a.match_date && !b.match_date) return 0
        if (!a.match_date) return 1
        if (!b.match_date) return -1
        const dateA = new Date(a.match_date + 'T' + (a.match_time || '00:00'))
        const dateB = new Date(b.match_date + 'T' + (b.match_time || '00:00'))
        return dateA - dateB
      })

      setMyMatches(uniqueMyMatches)

      // === PARTIES DISPONIBLES ===
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *, 
          clubs (name, address, city), 
          profiles!matches_organizer_id_fkey (id, name, avatar_url),
          match_participants (
            id, user_id, team, status,
            profiles!match_participants_user_id_fkey (id, name, avatar_url)
          )
        `)
        .eq('status', 'open')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(30)

      setMatches(matchesData || [])

      // === STATS & FAVORIS POUR SIDEBAR ===
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      setStats(statsData)

      const { data: favsData } = await supabase
        .from('player_favorites')
        .select('*, profiles!player_favorites_favorite_id_fkey(id, name, avatar_url, level, city)')
        .eq('user_id', session.user.id)
        .limit(5)
      setFavorites(favsData || [])

      const { data: clubsData } = await supabase
        .from('club_favorites')
        .select('*, clubs(id, name, city)')
        .eq('user_id', session.user.id)
        .limit(3)
      setFavClubs(clubsData || [])

      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  // === HELPERS ===
  
  function formatDate(dateStr, flexibleDay = null) {
    if (!dateStr) {
      return flexibleDay ? flexibleDay : 'Flexible'
    }
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return "Demain"
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  function formatTime(timeStr, flexiblePeriod = null) {
    if (timeStr) return timeStr.slice(0, 5)
    if (flexiblePeriod) {
      const periods = { matin: 'Matin', aprem: 'Après-midi', soir: 'Soir' }
      return periods[flexiblePeriod] || flexiblePeriod
    }
    return ''
  }

  function getMatchPlayers(match) {
    const players = []
    
    // Ajouter l'organisateur
    if (match.profiles) {
      players.push({
        id: match.organizer_id,
        name: match.profiles.name,
        avatar_url: match.profiles.avatar_url,
        isOrganizer: true
      })
    }
    
    // Ajouter les participants confirmés
    const confirmedParticipants = (match.match_participants || [])
      .filter(p => p.status === 'confirmed' && p.profiles)
      .map(p => ({
        id: p.user_id,
        name: p.profiles.name,
        avatar_url: p.profiles.avatar_url,
        isOrganizer: false
      }))
    
    players.push(...confirmedParticipants)
    
    // Compléter avec des slots vides jusqu'à 4
    while (players.length < 4) {
      players.push(null)
    }
    
    return players.slice(0, 4)
  }

  function getSpotsInfo(players) {
    const filled = players.filter(p => p !== null).length
    const empty = 4 - filled
    if (empty === 0) return { text: 'Complet ✓', color: '#22c55e', isEmpty: false }
    return { text: `${empty} place${empty > 1 ? 's' : ''}`, color: '#64748b', isEmpty: true }
  }

  function getFilteredMatches() {
    let filtered = matches
    
    // Filtre par niveau
    if (filterLevel !== 'all' && profile?.level) {
      const [min, max] = filterLevel.split('-').map(Number)
      filtered = filtered.filter(m => {
        const matchMin = m.level_min || 1
        const matchMax = m.level_max || 10
        return matchMin <= max && matchMax >= min
      })
    }
    
    // Filtre par ambiance
    if (filterAmbiance !== 'all') {
      filtered = filtered.filter(m => m.ambiance === filterAmbiance)
    }
    
    // Filtre par date
    if (filterDate !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      filtered = filtered.filter(m => {
        if (!m.match_date) return filterDate === 'all'
        const matchDate = new Date(m.match_date)
        matchDate.setHours(0, 0, 0, 0)
        
        switch (filterDate) {
          case 'today':
            return matchDate.getTime() === today.getTime()
          case 'tomorrow':
            return matchDate.getTime() === tomorrow.getTime()
          case 'week':
            return matchDate <= weekEnd
          case 'weekend':
            const matchDay = matchDate.getDay()
            return matchDay === 0 || matchDay === 6
          default:
            return true
        }
      })
    }
    
    return filtered
  }

  // === COMPOSANT AVATAR ===
  function PlayerAvatar({ player, index, size = 32 }) {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']
    
    if (!player) {
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#e2e8f0',
          border: '2px solid #fff',
          marginLeft: index > 0 ? -8 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
          color: '#94a3b8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          ?
        </div>
      )
    }
    
    if (player.avatar_url) {
      return (
        <img 
          src={player.avatar_url} 
          alt={player.name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: '2px solid #fff',
            marginLeft: index > 0 ? -8 : 0,
            objectFit: 'cover',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        />
      )
    }
    
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors[index % colors.length],
        border: '2px solid #fff',
        marginLeft: index > 0 ? -8 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        color: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {player.name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  const filteredMatches = getFilteredMatches()
  const userCity = profile?.city || profile?.region || 'ta ville'

  // Couleurs pour avatars
  const AVATAR_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
  function getColorForName(name) {
    if (!name) return AVATAR_COLORS[0]
    const index = name.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }

  return (
    <>
      <div className="dashboard-desktop-layout">
        {/* ============================================ */}
        {/* COLONNE PRINCIPALE                          */}
        {/* ============================================ */}
        <div className="main-column">

      {/* ============================================ */}
      {/* CARD BIENVENUE + CTA                        */}
      {/* ============================================ */}
      <div className="welcome-card" style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #f1f5f9'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
          👋 Salut {profile?.name?.split(' ')[0] || 'Joueur'} !
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            width: '100%',
            padding: 16,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          + Créer une partie
        </button>
      </div>

      {/* ============================================ */}
      {/* MES PROCHAINES PARTIES                       */}
      {/* ============================================ */}
      {myMatches.length > 0 && (
        <div className="my-matches-card" style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              🗓️ Prochaines parties
            </h3>
            <Link 
              href="/dashboard/matches" 
              style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
            >
              Tout voir →
            </Link>
          </div>

          {/* Grille 2 colonnes sur desktop */}
          <div className="my-matches-grid">
            {myMatches.slice(0, 4).map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const players = getMatchPlayers(match)
              const spots = getSpotsInfo(players)
              const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix
              
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="match-card-item" style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                          {formatDate(match.match_date, match.flexible_day)}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                          {formatTime(match.match_time, match.flexible_period) || 'Flexible'}
                        </div>
                      </div>
                      {isOrganizer && (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          👑 Orga
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                      📍 {match.clubs?.name || match.city || 'Lieu à définir'}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {players.map((player, idx) => (
                        <div key={idx} style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: player ? `linear-gradient(135deg, ${getColorForName(player.name)}, ${getColorForName(player.name)}cc)` : 'transparent',
                          border: player ? '2px solid #fff' : '2px dashed #cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: player ? '#fff' : '#94a3b8',
                          fontWeight: 600, fontSize: 12
                        }}>
                          {player ? player.name?.[0]?.toUpperCase() : '+'}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PARTIES DISPONIBLES                         */}
      {/* ============================================ */}
      <div className="nearby-matches-card" style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            🔥 Parties près de {userCity}
          </h3>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              background: showFilters ? '#1a1a2e' : '#f8fafc', 
              color: showFilters ? '#fff' : '#475569',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚙️ Filtres
          </button>
        </div>

        {/* Filtres avancés (collapsible) */}
        {showFilters && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            {/* Niveau */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                ⭐ Niveau
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: '1-3', label: '1-3' },
                  { id: '4-6', label: '4-6' },
                  { id: '7-10', label: '7-10' }
                ].map(n => (
                  <button 
                    key={n.id}
                    onClick={() => setFilterLevel(n.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: filterLevel === n.id ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: filterLevel === n.id ? '#f8fafc' : '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiance */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>
                🎯 Ambiance
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'loisir', label: '😎' },
                  { id: 'mix', label: '⚡' },
                  { id: 'compet', label: '🏆' }
                ].map(a => (
                  <button 
                    key={a.id}
                    onClick={() => setFilterAmbiance(a.id)}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      border: filterAmbiance === a.id ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      background: filterAmbiance === a.id ? '#f8fafc' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick filters dates */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 16, 
          overflowX: 'auto', 
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'tomorrow', label: 'Demain' },
            { id: 'week', label: 'Cette semaine' },
            { id: 'weekend', label: 'Week-end' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilterDate(f.id)}
              style={{
                padding: '8px 14px',
                background: filterDate === f.id ? '#1a1a2e' : '#fff',
                color: filterDate === f.id ? '#fff' : '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des parties */}
        {filteredMatches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#fff',
            border: '2px dashed #e5e5e5',
            borderRadius: 12
          }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎾</div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>
              Aucune partie trouvée
            </h4>
            <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
              Essaie d'élargir tes filtres ou crée ta propre partie !
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Créer une partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredMatches.slice(0, 4).map(match => {
              const players = getMatchPlayers(match)
              const spots = getSpotsInfo(players)
              const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / 4) : null
              
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                  }}
                  >
                    {/* Badge date/heure */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1a1a2e, #334155)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      color: '#fff',
                      textAlign: 'center',
                      minWidth: 70,
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        {formatDate(match.match_date)}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {formatTime(match.match_time) || '?'}
                      </div>
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 15, 
                            marginBottom: 2, 
                            color: '#1a1a2e',
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {match.clubs?.name || match.city || 'Lieu flexible'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Par {match.profiles?.name || 'Inconnu'}
                          </div>
                        </div>
                        {pricePerPerson > 0 && (
                          <div style={{
                            background: '#f0fdf4',
                            color: '#16a34a',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginLeft: 8
                          }}>
                            {pricePerPerson}€
                          </div>
                        )}
                      </div>

                      {/* Tags + Avatars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#f1f5f9',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#475569'
                        }}>
                          ⭐ {match.level_min}-{match.level_max}
                        </span>
                        <span style={{
                          background: ambiance.color + '15',
                          color: ambiance.color,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {ambiance.emoji}
                        </span>
                        
                        {/* Avatars joueurs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                          <div style={{ display: 'flex' }}>
                            {players.map((player, i) => (
                              <PlayerAvatar key={i} player={player} index={i} size={26} />
                            ))}
                          </div>
                          <span style={{ 
                            fontSize: 11, 
                            color: spots.color, 
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            {spots.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Voir plus */}
        {filteredMatches.length > 4 && (
          <Link href="/dashboard/explore" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              marginTop: 16,
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
            >
              Voir les {filteredMatches.length - 4} autres parties →
            </button>
          </Link>
        )}
      </div>

      {/* ============================================ */}
      {/* BOÎTE À IDÉES                               */}
      {/* ============================================ */}
      <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            💡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0369a1', marginBottom: 4 }}>
              Boîte à idées
            </div>
            <div style={{ fontSize: 13, color: '#0c4a6e' }}>
              Propose des idées et vote pour les meilleures
            </div>
          </div>
          <span style={{ color: '#0ea5e9', fontSize: 20 }}>→</span>
        </div>
      </Link>

        </div>
        {/* Fin de main-column */}

        {/* ============================================ */}
        {/* SIDEBAR (Desktop uniquement)                */}
        {/* ============================================ */}
        <aside className="sidebar-column">
          {/* Stats */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
              📊 Mes stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Parties jouées</span>
                <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{stats?.total_matches || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Niveau</span>
                <span style={{ fontWeight: 700, color: '#1a1a2e' }}>⭐ {profile?.level || '?'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Victoires</span>
                <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{stats?.wins || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Fiabilité</span>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>{profile?.reliability_score || 100}%</span>
              </div>
            </div>
          </div>

          {/* Joueurs favoris */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
              👥 Joueurs favoris
            </h3>
            {favorites.length === 0 ? (
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Aucun favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.slice(0, 5).map((fav, i) => {
                  const p = fav.profiles
                  if (!p) return null
                  return (
                    <Link href={`/player/${p.id}`} key={i} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: p.avatar_url ? 'transparent' : `linear-gradient(135deg, ${getColorForName(p.name)}, ${getColorForName(p.name)}cc)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 16, overflow: 'hidden'
                        }}>
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            p.name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>⭐ {p.level} • {p.city || 'France'}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Clubs favoris */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
              🏟️ Clubs favoris
            </h3>
            {favClubs.length === 0 ? (
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Aucun club favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {favClubs.slice(0, 3).map((fav, i) => {
                  const club = fav.clubs
                  if (!club) return null
                  return (
                    <Link href="/dashboard/clubs" key={i} style={{ textDecoration: 'none' }}>
                      <div style={{ 
                        padding: '12px 0', 
                        borderBottom: i < favClubs.length - 1 ? '1px solid #f8fafc' : 'none',
                        color: '#475569',
                        fontSize: 14
                      }}>
                        📍 {club.name}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
      {/* Fin de dashboard-desktop-layout */}

      {/* ============================================ */}
      {/* MODAL CRÉATION                              */}
      {/* ============================================ */}
      <CreateMatchModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadData()
        }}
        profile={profile}
        userId={user?.id}
      />

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
        
        .dashboard-desktop-layout {
          display: flex;
          gap: 24px;
        }
        
        .main-column {
          flex: 1;
          min-width: 0;
        }
        
        .sidebar-column {
          width: 320px;
          flex-shrink: 0;
          display: none;
        }
        
        .my-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .nearby-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        /* Tablet - 768px */
        @media (min-width: 768px) {
          .my-matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .nearby-matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Desktop - 1024px */
        @media (min-width: 1024px) {
          .sidebar-column {
            display: block;
          }
          .dashboard-desktop-layout {
            gap: 32px;
          }
        }
        
        /* Large desktop - 1280px */
        @media (min-width: 1280px) {
          .sidebar-column {
            width: 340px;
          }
        }
      `}</style>
    </>
  )
}