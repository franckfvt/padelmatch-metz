'use client'

/**
 * ============================================
 * PAGE EXPLORER - VERSION 4 (RESTRUCTURÉE)
 * ============================================
 * 
 * Structure en cards comme le dashboard:
 * 1. Card recherche (header + recherche + ville)
 * 2. Card parties (filtres intégrés + grid)
 * 3. Card clubs + Card groupes (côte à côte)
 * 
 * Objectif: "Trouve une partie à rejoindre"
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExplorePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Recherche et filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterAmbiance, setFilterAmbiance] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  
  // Suggestions de recherche
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedClub, setSelectedClub] = useState(null)
  
  // Données
  const [matches, setMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [groups, setGroups] = useState([])
  const [cities, setCities] = useState([])

  const playerColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente', color: '#22c55e' },
    mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6' },
    compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b' }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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

    // Charger les parties disponibles
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *, 
        clubs (id, name, address, city), 
        profiles!matches_organizer_id_fkey (id, name, avatar_url),
        match_participants (
          id, user_id, status,
          profiles!match_participants_user_id_fkey (id, name, avatar_url)
        )
      `)
      .eq('status', 'open')
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })
      .limit(50)

    setMatches(matchesData || [])

    // Extraire les villes uniques
    const citiesSet = new Set()
    ;(matchesData || []).forEach(m => {
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city)
    })

    // Charger les clubs
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('*')
      .limit(20)

    setClubs(clubsData || [])
    
    ;(clubsData || []).forEach(c => {
      if (c.city) citiesSet.add(c.city)
    })

    // Charger les groupes
    const { data: groupsData } = await supabase
      .from('community_groups')
      .select('*')
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(10)

    setGroups(groupsData || [])

    ;(groupsData || []).forEach(g => {
      if (g.city) citiesSet.add(g.city)
    })

    // Charger les villes depuis les profils utilisateurs
    const { data: profileCities } = await supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .limit(100)
    
    ;(profileCities || []).forEach(p => {
      if (p.city) citiesSet.add(p.city)
    })

    setCities(Array.from(citiesSet).sort())

    if (profileData?.city) {
      setFilterCity(profileData.city)
    }

    setLoading(false)
  }

  // === HELPERS ===

  function formatDate(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Auj."
    if (date.toDateString() === tomorrow.toDateString()) return 'Dem.'
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  function getMatchPlayers(match) {
    const players = []
    
    if (match.profiles) {
      players.push({
        id: match.organizer_id,
        name: match.profiles.name,
        avatar_url: match.profiles.avatar_url
      })
    }
    
    const confirmed = (match.match_participants || [])
      .filter(p => p.status === 'confirmed' && p.profiles)
      .map(p => ({
        id: p.user_id,
        name: p.profiles.name,
        avatar_url: p.profiles.avatar_url
      }))
    
    players.push(...confirmed)
    
    while (players.length < 4) {
      players.push(null)
    }
    
    return players.slice(0, 4)
  }

  function getFilteredMatches() {
    let filtered = matches

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        (m.clubs?.name?.toLowerCase().includes(query)) ||
        (m.clubs?.city?.toLowerCase().includes(query)) ||
        (m.city?.toLowerCase().includes(query))
      )
    }

    if (filterCity !== 'all') {
      filtered = filtered.filter(m => 
        m.clubs?.city?.toLowerCase() === filterCity.toLowerCase() ||
        m.city?.toLowerCase() === filterCity.toLowerCase()
      )
    }

    if (filterLevel !== 'all') {
      const [min, max] = filterLevel.split('-').map(Number)
      filtered = filtered.filter(m => {
        const matchMin = m.level_min || 1
        const matchMax = m.level_max || 10
        return matchMin <= max && matchMax >= min
      })
    }

    if (filterAmbiance !== 'all') {
      filtered = filtered.filter(m => m.ambiance === filterAmbiance)
    }

    if (filterDate !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)

      filtered = filtered.filter(m => {
        if (!m.match_date) return false
        const matchDate = new Date(m.match_date)
        matchDate.setHours(0, 0, 0, 0)

        switch (filterDate) {
          case 'today': return matchDate.getTime() === today.getTime()
          case 'tomorrow': return matchDate.getTime() === tomorrow.getTime()
          case 'week': return matchDate <= weekEnd
          case 'weekend':
            const day = matchDate.getDay()
            return day === 0 || day === 6
          default: return true
        }
      })
    }

    return filtered
  }

  function getFilteredClubs() {
    if (filterCity === 'all') return clubs
    return clubs.filter(c => c.city?.toLowerCase() === filterCity.toLowerCase())
  }

  function getFilteredGroups() {
    if (filterCity === 'all') return groups
    return groups.filter(g => 
      g.city?.toLowerCase() === filterCity.toLowerCase() ||
      g.region?.toLowerCase().includes(filterCity.toLowerCase())
    )
  }

  // Suggestions de recherche (clubs + villes)
  function getSearchSuggestions() {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    const query = searchQuery.toLowerCase()
    
    const suggestions = []
    
    // Clubs correspondants
    clubs.forEach(club => {
      if (club.name?.toLowerCase().includes(query) || club.city?.toLowerCase().includes(query)) {
        suggestions.push({ type: 'club', data: club, label: club.name, sublabel: club.city })
      }
    })
    
    // Villes correspondantes
    cities.forEach(city => {
      if (city.toLowerCase().includes(query)) {
        suggestions.push({ type: 'city', data: city, label: city, sublabel: 'Ville' })
      }
    })
    
    return suggestions.slice(0, 8)
  }

  function handleSuggestionClick(suggestion) {
    if (suggestion.type === 'city') {
      setFilterCity(suggestion.data)
    } else if (suggestion.type === 'club') {
      setSelectedClub(suggestion.data)
    }
    setSearchQuery('')
    setShowSuggestions(false)
  }

  function resetFilters() {
    setFilterDate('all')
    setFilterLevel('all')
    setFilterAmbiance('all')
    setFilterCity(profile?.city || 'all')
    setSearchQuery('')
  }

  const hasActiveFilters = filterDate !== 'all' || filterLevel !== 'all' || filterAmbiance !== 'all' || searchQuery.trim()

  // === COMPOSANTS ===

  function PlayerAvatar({ player, index, size = 28 }) {
    if (!player) {
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#f1f5f9',
          border: '2px dashed #cbd5e1',
          marginLeft: index > 0 ? -6 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
          color: '#94a3b8'
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
            marginLeft: index > 0 ? -6 : 0,
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
        background: playerColors[index % playerColors.length],
        border: '2px solid #fff',
        marginLeft: index > 0 ? -6 : 0,
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

  // Carte de match (pour la grille)
  function MatchCard({ match }) {
    const players = getMatchPlayers(match)
    const emptySpots = players.filter(p => !p).length
    const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix

    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
        <div 
          className="match-card-item"
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #f1f5f9',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s',
            height: '100%'
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = '#22c55e'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = '#f1f5f9'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {/* Header: Date/Heure + Ambiance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                {formatDate(match.match_date)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                {formatTime(match.match_time) || 'Flexible'}
              </div>
            </div>
            <span style={{
              background: ambiance.color + '15',
              color: ambiance.color,
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 14
            }}>
              {ambiance.emoji}
            </span>
          </div>

          {/* Club + Niveau */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#1a1a2e',
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              📍 {match.clubs?.name || match.city || 'Lieu flexible'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Par {match.profiles?.name || 'Inconnu'} · ⭐ {match.level_min}-{match.level_max}
            </div>
          </div>

          {/* Joueurs + Places */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
              {players.map((player, i) => (
                <PlayerAvatar key={i} player={player} index={i} size={30} />
              ))}
            </div>
            <span style={{
              fontSize: 12,
              color: emptySpots === 0 ? '#22c55e' : '#64748b',
              fontWeight: 600
            }}>
              {emptySpots === 0 ? '✓ Complet' : `${emptySpots} place${emptySpots > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // === LOADING ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const filteredMatches = getFilteredMatches()
  const filteredClubs = getFilteredClubs()
  const filteredGroups = getFilteredGroups()

  return (
    <div>
      {/* ============================================ */}
      {/* CARD 1: HEADER RECHERCHE                    */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #f1f5f9'
      }}>
        <div className="search-header-layout">
          {/* Titre + description */}
          <div className="search-header-text">
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: '#1a1a2e' }}>
              🔍 Trouve ta prochaine partie
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
              Explore les parties disponibles près de chez toi
            </p>
          </div>

          {/* Recherche + Ville */}
          <div className="search-header-controls">
            {/* Sélecteur ville */}
            <div style={{ position: 'relative', minWidth: 160 }}>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingLeft: 36,
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  background: '#fff',
                  cursor: 'pointer',
                  appearance: 'none',
                  color: '#1a1a2e'
                }}
              >
                <option value="all">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                pointerEvents: 'none'
              }}>📍</span>
            </div>

            {/* Barre de recherche */}
            <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
              <span style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                opacity: 0.5,
                zIndex: 1
              }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Rechercher un club, une ville..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(e.target.value.length >= 2)
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff'
                }}
              />
              
              {/* Suggestions dropdown */}
              {showSuggestions && getSearchSuggestions().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  zIndex: 100,
                  overflow: 'hidden'
                }}>
                  {getSearchSuggestions().map((suggestion, i) => (
                    <div
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: i < getSearchSuggestions().length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontSize: 18 }}>
                        {suggestion.type === 'club' ? '🏟️' : '📍'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
                          {suggestion.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {suggestion.sublabel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CARD 2: PARTIES DISPONIBLES                 */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #f1f5f9'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              🎾 Parties disponibles
            </h2>
            <span style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '4px 12px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600
            }}>
              {filteredMatches.length}
            </span>
          </div>
          <Link 
            href="/dashboard/explore/matches" 
            style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
          >
            Voir toutes →
          </Link>
        </div>

        {/* Filtres intégrés */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 20,
          flexWrap: 'wrap'
        }}>
          {/* Filtres date */}
          <div className="filters-date" style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'today', label: "Auj." },
              { id: 'tomorrow', label: 'Dem.' },
              { id: 'week', label: 'Semaine' },
              { id: 'weekend', label: 'Week-end' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterDate(f.id)}
                style={{
                  padding: '8px 14px',
                  background: filterDate === f.id ? '#1a1a2e' : '#f8fafc',
                  color: filterDate === f.id ? '#fff' : '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Séparateur */}
          <div className="filters-separator" style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

          {/* Filtres ambiance */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', emoji: '', label: 'Toutes' },
              { id: 'loisir', emoji: '😎', label: '' },
              { id: 'mix', emoji: '⚡', label: '' },
              { id: 'compet', emoji: '🏆', label: '' }
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setFilterAmbiance(a.id)}
                style={{
                  padding: '8px 12px',
                  background: filterAmbiance === a.id ? (a.id === 'all' ? '#1a1a2e' : ambianceConfig[a.id]?.color + '15') : '#f8fafc',
                  color: filterAmbiance === a.id ? (a.id === 'all' ? '#fff' : ambianceConfig[a.id]?.color) : '#64748b',
                  border: filterAmbiance === a.id && a.id !== 'all' ? `2px solid ${ambianceConfig[a.id]?.color}` : '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: a.emoji ? 16 : 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {a.emoji || a.label}
              </button>
            ))}
          </div>

          {/* Bouton filtres avancés */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 14px',
              background: showFilters ? '#f0fdf4' : '#f8fafc',
              color: showFilters ? '#166534' : '#64748b',
              border: showFilters ? '2px solid #22c55e' : '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ⚙️ Filtres
          </button>

          {/* Reset si filtres actifs */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              🔄 Reset
            </button>
          )}
        </div>

        {/* Filtres avancés (niveau) */}
        {showFilters && (
          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                ⭐ Niveau
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'Tous', desc: '' },
                  { id: '1-3', label: '1-3', desc: 'Débutant' },
                  { id: '4-6', label: '4-6', desc: 'Inter.' },
                  { id: '7-10', label: '7+', desc: 'Avancé' }
                ].map(n => (
                  <button
                    key={n.id}
                    onClick={() => setFilterLevel(n.id)}
                    style={{
                      flex: '1 1 70px',
                      minWidth: 70,
                      padding: '10px 8px',
                      border: filterLevel === n.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: filterLevel === n.id ? '#f0fdf4' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: filterLevel === n.id ? '#166534' : '#374151',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <span>{n.label}</span>
                    {n.desc && <span style={{ fontSize: 10, fontWeight: 400, color: '#64748b' }}>{n.desc}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grille de parties */}
        {filteredMatches.length === 0 ? (
          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🔍</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
              Aucune partie trouvée
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Essaie d'élargir tes filtres ou crée ta propre partie
            </p>
          </div>
        ) : (
          <div className="explore-matches-grid">
            {filteredMatches.slice(0, 8).map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Voir plus */}
        {filteredMatches.length > 8 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link
              href="/dashboard/explore/matches"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#f8fafc',
                color: '#1a1a2e',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Voir les {filteredMatches.length - 8} autres parties →
            </Link>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* CARDS 3 & 4: CLUBS + GROUPES (côte à côte)  */}
      {/* ============================================ */}
      <div className="clubs-groups-layout">
        {/* CARD 3: CLUBS */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              🏟️ Clubs {filterCity !== 'all' ? `à ${filterCity}` : 'à proximité'}
            </h2>
            <Link 
              href="/dashboard/clubs" 
              style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
            >
              Tous →
            </Link>
          </div>

          {filteredClubs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              Aucun club trouvé {filterCity !== 'all' && `à ${filterCity}`}
            </div>
          ) : (
            <div className="clubs-grid">
              {filteredClubs.slice(0, 4).map(club => (
                <div
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 14,
                    cursor: 'pointer',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.borderColor = '#22c55e'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor = '#f1f5f9'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    marginBottom: 10,
                    border: '1px solid #e2e8f0'
                  }}>
                    🏟️
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>
                    {club.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    📍 {club.city || club.address || 'Adresse inconnue'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 4: GROUPES */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              👥 Communautés {filterCity !== 'all' ? `à ${filterCity}` : ''}
            </h2>
            <Link 
              href="/dashboard/groups" 
              style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
            >
              Tous →
            </Link>
          </div>

          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #f1f5f9'
          }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                Aucun groupe trouvé {filterCity !== 'all' && `à ${filterCity}`}
              </div>
            ) : (
              filteredGroups.slice(0, 4).map((group, i, arr) => {
                const typeConfig = {
                  whatsapp: { icon: '💬', color: '#dcfce7' },
                  facebook: { icon: '👥', color: '#dbeafe' },
                  telegram: { icon: '✈️', color: '#e0e7ff' },
                  discord: { icon: '🎮', color: '#fae8ff' },
                  other: { icon: '🔗', color: '#f1f5f9' }
                }
                const config = typeConfig[group.type] || typeConfig.other

                return (
                  <a
                    key={group.id}
                    href={group.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      background: '#fff'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18
                      }}>
                        {config.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
                            {group.name}
                          </span>
                          {group.is_verified && (
                            <span style={{ fontSize: 12, color: '#3b82f6' }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {group.city && `${group.city} · `}{group.member_count} membres
                        </div>
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: 16 }}>›</span>
                    </div>
                  </a>
                )
              })
            )}

            {/* Ajouter un groupe */}
            <Link href="/dashboard/groups/add" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                background: '#fff'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#94a3b8'
                }}>
                  +
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#3b82f6' }}>
                  Ajouter un groupe
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL CLUB                                  */}
      {/* ============================================ */}
      {selectedClub && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }} onClick={() => setSelectedClub(null)}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32
                }}>
                  🏟️
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>{selectedClub.name}</h3>
                  {selectedClub.city && <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>📍 {selectedClub.city}</p>}
                </div>
              </div>
              <button onClick={() => setSelectedClub(null)} style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 18
              }}>×</button>
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {selectedClub.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>{selectedClub.address}</span>
                </div>
              )}
              {selectedClub.phone && (
                <a href={`tel:${selectedClub.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10, textDecoration: 'none' }}>
                  <span style={{ fontSize: 18 }}>📞</span>
                  <span style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>{selectedClub.phone}</span>
                </a>
              )}
              {selectedClub.website && (
                <a href={selectedClub.website.startsWith('http') ? selectedClub.website : `https://${selectedClub.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10, textDecoration: 'none' }}>
                  <span style={{ fontSize: 18 }}>🌐</span>
                  <span style={{ fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>Voir le site web</span>
                </a>
              )}
              {selectedClub.courts_count && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>🎾</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>{selectedClub.courts_count} terrains</span>
                </div>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setFilterCity(selectedClub.city || 'all')
                  setSelectedClub(null)
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Parties dans cette ville
              </button>
              <Link
                href="/dashboard/clubs"
                onClick={() => setSelectedClub(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#22c55e',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                Tous les clubs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        /* Layout recherche */
        .search-header-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .search-header-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        /* Grille parties */
        .explore-matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        /* Grille clubs */
        .clubs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        /* Layout clubs + groupes */
        .clubs-groups-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        /* Mobile: masquer séparateur et adapter filtres */
        .filters-separator {
          display: none;
        }
        
        .filters-date {
          flex-wrap: wrap;
        }
        
        /* Tablet - 640px */
        @media (min-width: 640px) {
          .search-header-controls {
            flex-direction: row;
          }
          
          .explore-matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .filters-separator {
            display: block;
          }
        }
        
        /* Tablet - 768px */
        @media (min-width: 768px) {
          .search-header-layout {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          
          .search-header-text {
            flex-shrink: 0;
          }
          
          .search-header-controls {
            flex: 1;
            max-width: 500px;
            justify-content: flex-end;
          }
          
          .clubs-groups-layout {
            flex-direction: row;
          }
          
          .clubs-groups-layout > div {
            flex: 1;
          }
        }
        
        /* Desktop - 1024px */
        @media (min-width: 1024px) {
          .explore-matches-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Large desktop - 1280px */
        @media (min-width: 1280px) {
          .explore-matches-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  )
}