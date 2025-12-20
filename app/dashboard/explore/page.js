'use client'

/**
 * ============================================
 * PAGE EXPLORER - VERSION 3
 * ============================================
 * 
 * Améliorations:
 * - Parties en scroll horizontal (5-6 visibles)
 * - Bouton "Voir toutes les parties"
 * - Meilleure visibilité des clubs et groupes
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
  const [showAllMatches, setShowAllMatches] = useState(false)
  
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

  // === AVATAR COMPONENT ===

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

  // === MATCH CARD COMPACT (pour scroll horizontal) ===

  function MatchCardCompact({ match }) {
    const players = getMatchPlayers(match)
    const emptySpots = players.filter(p => !p).length
    const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix

    return (
      <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 280,
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          border: '1px solid #e2e8f0'
        }}>
          {/* Header: Date + Heure */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              background: '#1a1a2e',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#fff'
            }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {formatDate(match.match_date)} · {formatTime(match.match_time) || '?'}
              </span>
            </div>
            <span style={{
              background: ambiance.color + '15',
              color: ambiance.color,
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600
            }}>
              {ambiance.emoji}
            </span>
          </div>

          {/* Club */}
          <div style={{
            fontWeight: 600,
            fontSize: 15,
            color: '#1a1a2e',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {match.clubs?.name || match.city || 'Lieu flexible'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            Par {match.profiles?.name || 'Inconnu'} · ⭐ {match.level_min}-{match.level_max}
          </div>

          {/* Joueurs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
              {players.map((player, i) => (
                <PlayerAvatar key={i} player={player} index={i} size={32} />
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
  const displayedMatches = showAllMatches ? filteredMatches : filteredMatches.slice(0, 6)

  return (
    <div>
      {/* ============================================ */}
      {/* HEADER                                      */}
      {/* ============================================ */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Explorer
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Trouve des parties, clubs et joueurs
        </p>
      </div>

      {/* ============================================ */}
      {/* BARRE DE RECHERCHE                          */}
      {/* ============================================ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Rechercher un club, une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 15,
                outline: 'none',
                background: '#fff'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '14px 18px',
              background: showFilters ? '#1a1a2e' : '#fff',
              color: showFilters ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTRES                                     */}
      {/* ============================================ */}
      {showFilters && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          border: '1px solid #e2e8f0'
        }}>
          {/* Ville */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
              📍 Ville
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="all">Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
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
                    padding: '10px',
                    border: filterLevel === n.id ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: filterLevel === n.id ? '#f8fafc' : '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#1a1a2e'
                  }}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ambiance */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
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
                    padding: '10px',
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

      {/* ============================================ */}
      {/* FILTRE VILLE RAPIDE (pills)                 */}
      {/* ============================================ */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        <button
          onClick={() => setFilterCity('all')}
          style={{
            padding: '8px 16px',
            background: filterCity === 'all' ? '#1a1a2e' : '#fff',
            color: filterCity === 'all' ? '#fff' : '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          📍 Toutes
        </button>
        {cities.slice(0, 5).map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            style={{
              padding: '8px 16px',
              background: filterCity === city ? '#1a1a2e' : '#fff',
              color: filterCity === city ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {city}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* FILTRES DATES RAPIDES                       */}
      {/* ============================================ */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
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
              padding: '8px 16px',
              background: filterDate === f.id ? '#1a1a2e' : '#fff',
              color: filterDate === f.id ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
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

      {/* ============================================ */}
      {/* PARTIES DISPONIBLES (SCROLL HORIZONTAL)     */}
      {/* ============================================ */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            🎾 Parties disponibles
            <span style={{
              marginLeft: 8,
              background: '#f1f5f9',
              padding: '2px 10px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b'
            }}>
              {filteredMatches.length}
            </span>
          </h2>
          {filteredMatches.length > 6 && (
            <button
              onClick={() => setShowAllMatches(!showAllMatches)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {showAllMatches ? 'Réduire' : 'Voir tout →'}
            </button>
          )}
        </div>

        {filteredMatches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🔍</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
              Aucune partie trouvée
            </h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Essaie d'élargir tes filtres ou crée ta propre partie
            </p>
          </div>
        ) : showAllMatches ? (
          // Mode liste verticale quand "Voir tout"
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredMatches.map(match => (
              <MatchCardCompact key={match.id} match={match} />
            ))}
          </div>
        ) : (
          // Mode scroll horizontal par défaut
          <div style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
            marginRight: -16,
            paddingRight: 16
          }}>
            {displayedMatches.map(match => (
              <MatchCardCompact key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* CLUBS À PROXIMITÉ                           */}
      {/* ============================================ */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            🏟️ Clubs {filterCity !== 'all' ? `à ${filterCity}` : 'près de toi'}
          </h2>
          <Link href="/dashboard/clubs" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Tous les clubs →
          </Link>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8
        }}>
          {getFilteredClubs().length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              width: '100%'
            }}>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Aucun club trouvé {filterCity !== 'all' && `à ${filterCity}`}
              </p>
            </div>
          ) : (
            getFilteredClubs().slice(0, 5).map(club => (
              <Link
                href={`/dashboard/clubs?id=${club.id}`}
                key={club.id}
                style={{ textDecoration: 'none', flexShrink: 0 }}
              >
                <div style={{
                  width: 200,
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 12
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
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* GROUPES & COMMUNAUTÉS                       */}
      {/* ============================================ */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            👥 Groupes {filterCity !== 'all' ? `à ${filterCity}` : '& Communautés'}
          </h2>
          <Link href="/dashboard/groups" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Tous les groupes →
          </Link>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {getFilteredGroups().length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Aucun groupe trouvé {filterCity !== 'all' && `à ${filterCity}`}
              </p>
            </div>
          ) : (
            getFilteredGroups().slice(0, 4).map((group, i, arr) => {
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
                    padding: '14px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer'
                  }}>
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
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {group.city && `${group.city} · `}{group.member_count} membres
                      </div>
                    </div>
                    <span style={{ color: '#cbd5e1', fontSize: 16 }}>›</span>
                  </div>
                </a>
              )
            })
          )}

          <Link href="/dashboard/groups/add" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              background: '#f8fafc'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#fff',
                border: '2px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#94a3b8'
              }}>
                +
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#64748b' }}>
                Ajouter un groupe
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}