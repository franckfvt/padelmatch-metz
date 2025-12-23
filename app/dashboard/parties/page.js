'use client'

/**
 * ============================================
 * PAGE PARTIES V8 - Inspirée de l'ancien dashboard
 * ============================================
 * 
 * Reprend les éléments qui fonctionnaient :
 * - Badge date/heure en dark premium
 * - Pills de filtres avec style dark actif
 * - Cartes horizontales pour "Explorer"
 * - Boutons secondaires en dark
 * 
 * Améliorations :
 * - Section "Parties à rejoindre" plus visible
 * - Tailles de cartes cohérentes
 * - CTA "Créer" proéminent
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAvatarColor, AMBIANCE_CONFIG } from '@/app/lib/design-tokens'

// Couleurs
const DARK = '#1a1a2e'
const DARK_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #334155)'
const GREEN_GRADIENT = 'linear-gradient(135deg, #22c55e, #16a34a)'

export default function PartiesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [filterDate, setFilterDate] = useState('week')
  const [filterCity, setFilterCity] = useState('all')
  const [cities, setCities] = useState([])
  
  // Données
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [showAllMyMatches, setShowAllMyMatches] = useState(false)
  
  // Sidebar
  const [stats, setStats] = useState({ total: 0, organized: 0 })
  const [favoritePlayers, setFavoritePlayers] = useState([])

  useEffect(() => { loadData() }, [])

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

    const filteredAvailable = (availableResult.data || []).filter(m => 
      !m.match_participants?.some(p => p.user_id === userId)
    )
    setAvailableMatches(filteredAvailable)

    const citiesSet = new Set()
    filteredAvailable.forEach(m => { 
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city) 
    })
    setCities(Array.from(citiesSet).sort())
    if (profileData?.city) setFilterCity(profileData.city)

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
    
    setLoading(false)
    loadSidebarData(userId, today)
  }

  async function loadSidebarData(userId, today) {
    const [pastResult, organizedCount, favoritesResult] = await Promise.all([
      supabase.from('match_participants')
        .select(`match_id, matches!inner (id, match_date)`)
        .eq('user_id', userId).lt('matches.match_date', today).limit(50),
      supabase.from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId),
      supabase.from('player_favorites')
        .select(`profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city)`)
        .eq('user_id', userId).limit(5)
    ])
    
    const uniquePast = new Set((pastResult.data || []).map(p => p.match_id))
    setStats({ total: uniquePast.size, organized: organizedCount.count || 0 })
    setFavoritePlayers((favoritesResult.data || []).map(f => f.profiles).filter(Boolean))
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

  function formatDateLong(dateStr) {
    if (!dateStr) return 'Date flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatTime(timeStr) { 
    return timeStr ? timeStr.slice(0, 5) : 'Flexible' 
  }

  function getMatchLocation(match) { 
    return match.clubs?.name || match.city || 'Lieu à définir' 
  }

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

  function getGreeting() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    if (hour < 12) return `Bonjour ${firstName} !`
    if (hour < 18) return `Salut ${firstName} !`
    return `Bonsoir ${firstName} !`
  }

  // Filtres
  const filteredAvailable = availableMatches.filter(match => {
    // Filtre ville
    if (filterCity !== 'all') {
      const matchCity = (match.clubs?.city || match.city || '').toLowerCase()
      if (matchCity !== filterCity.toLowerCase()) return false
    }
    // Filtre date
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

  // === COMPOSANTS ===
  
  function Avatar({ player, size = 32, overlap = false, index = 0 }) {
    if (!player) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: '#f1f5f9', border: '2px dashed #d1d5db',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, color: '#9ca3af',
          marginLeft: overlap && index > 0 ? -8 : 0,
          position: 'relative', zIndex: 4 - index
        }}>?</div>
      )
    }
    
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: player.avatar_url ? '#f1f5f9' : getAvatarColor(player.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 600, color: '#fff',
        overflow: 'hidden',
        border: '2px solid #fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginLeft: overlap && index > 0 ? -8 : 0,
        position: 'relative', zIndex: 4 - index
      }}>
        {player.avatar_url 
          ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : player.name?.[0]?.toUpperCase()
        }
      </div>
    )
  }

  // === RENDER ===
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🎾</div>
        <div style={{ color: '#64748b', fontSize: 15 }}>Chargement...</div>
      </div>
    )
  }

  const nextMatch = myUpcomingMatches[0]

  return (
    <>
      <div className="page-layout">
        <div className="main-content">

          {/* ============================================ */}
          {/* WELCOME CARD                                */}
          {/* ============================================ */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: DARK }}>
                  👋 {getGreeting()}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                  {myUpcomingMatches.length > 0 
                    ? `${myUpcomingMatches.length} partie${myUpcomingMatches.length > 1 ? 's' : ''} à venir`
                    : 'Prêt pour une partie ?'
                  }
                </p>
              </div>
            </div>
            
            <Link href="/dashboard/matches/create" style={{
              display: 'flex',
              padding: '16px 24px',
              background: GREEN_GRADIENT,
              color: '#fff',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              + Créer une partie
            </Link>
          </div>

          {/* ============================================ */}
          {/* MES PARTIES                                 */}
          {/* ============================================ */}
          {myUpcomingMatches.length > 0 && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: DARK }}>
                  🗓️ Tes prochaines parties
                </h2>
                {myUpcomingMatches.length > 4 && (
                  <button 
                    onClick={() => setShowAllMyMatches(!showAllMyMatches)}
                    style={{ 
                      fontSize: 13, 
                      color: '#3b82f6', 
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500 
                    }}
                  >
                    {showAllMyMatches ? 'Voir moins ←' : `Tout voir (${myUpcomingMatches.length}) →`}
                  </button>
                )}
              </div>

              <div className="my-matches-grid">
                {(showAllMyMatches ? myUpcomingMatches : myUpcomingMatches.slice(0, 4)).map(match => {
                  const isOrganizer = match.organizer_id === user?.id
                  const players = getMatchPlayers(match)
                  const allSlots = [...players]
                  while (allSlots.length < 4) allSlots.push(null)
                  const spotsLeft = 4 - players.length
                  
                  return (
                    <Link href={`/dashboard/match/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, transform 0.2s'
                      }}
                      className="match-card-hover"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>
                              {formatDateLong(match.match_date)}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: DARK }}>
                              {formatTime(match.match_time)}
                            </div>
                          </div>
                          {isOrganizer && (
                            <span style={{ 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              padding: '4px 8px', 
                              borderRadius: 6, 
                              fontSize: 11, 
                              fontWeight: 600 
                            }}>
                              👑 Orga
                            </span>
                          )}
                        </div>
                        
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                          📍 {getMatchLocation(match)}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex' }}>
                            {allSlots.map((player, idx) => (
                              <Avatar key={idx} player={player} size={32} overlap index={idx} />
                            ))}
                          </div>
                          {spotsLeft > 0 && (
                            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                              {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* PARTIES À REJOINDRE                         */}
          {/* ============================================ */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: DARK }}>
                🔥 Parties disponibles
              </h2>
            </div>

            {/* Filtres simplifiés - une seule ligne */}
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 20, 
              overflowX: 'auto',
              paddingBottom: 4
            }}>
              {/* Filtre ville si plusieurs villes */}
              {cities.length > 0 && (
                <select 
                  value={filterCity} 
                  onChange={e => setFilterCity(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    border: `1px solid ${filterCity !== 'all' ? DARK : '#e2e8f0'}`,
                    borderRadius: 20,
                    background: filterCity !== 'all' ? DARK : '#fff',
                    color: filterCity !== 'all' ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    minWidth: 'auto'
                  }}
                >
                  <option value="all">📍 Toutes villes</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              
              {/* Filtres dates */}
              {[
                { id: 'week', label: 'Cette semaine' },
                { id: 'today', label: "Aujourd'hui" },
                { id: 'tomorrow', label: 'Demain' },
                { id: 'weekend', label: 'Week-end' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFilterDate(f.id)}
                  style={{
                    padding: '8px 16px',
                    background: filterDate === f.id ? DARK : '#fff',
                    color: filterDate === f.id ? '#fff' : '#64748b',
                    border: `1px solid ${filterDate === f.id ? DARK : '#e2e8f0'}`,
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

            {/* Liste des parties - Style horizontal avec badge dark */}
            {filteredAvailable.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed #e2e8f0'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎾</div>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  Aucune partie trouvée
                </h4>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                  Essaie d'élargir tes filtres ou crée ta propre partie !
                </p>
                <Link href="/dashboard/matches/create" style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: DARK,
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}>
                  Créer une partie
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredAvailable.map(match => {
                  const players = getMatchPlayers(match)
                  const allSlots = [...players]
                  while (allSlots.length < 4) allSlots.push(null)
                  const spotsLeft = 4 - players.length
                  const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                  
                  return (
                    <Link href={`/join/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                      <div 
                        className="explore-card"
                        style={{
                          background: '#fff',
                          borderRadius: 14,
                          padding: 14,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          border: '1px solid #f1f5f9',
                          display: 'flex',
                          gap: 14,
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {/* Badge date/heure - Dark premium */}
                        <div style={{
                          background: DARK_GRADIENT,
                          borderRadius: 12,
                          padding: '14px 16px',
                          color: '#fff',
                          textAlign: 'center',
                          minWidth: 72,
                          flexShrink: 0
                        }}>
                          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
                            {formatDate(match.match_date)}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>
                            {formatTime(match.match_time)}
                          </div>
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: 15, 
                            color: DARK,
                            marginBottom: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {getMatchLocation(match)}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{
                              background: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#475569'
                            }}>
                              ⭐ {match.level_min}-{match.level_max}
                            </span>
                            <span style={{
                              background: `${ambiance.color}15`,
                              color: ambiance.color,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              {ambiance.emoji} {ambiance.label}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Par {match.profiles?.name?.split(' ')[0] || 'Anonyme'}
                          </div>
                        </div>

                        {/* Avatars + places */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <div style={{ display: 'flex' }}>
                            {allSlots.map((player, idx) => (
                              <Avatar key={idx} player={player} size={28} overlap index={idx} />
                            ))}
                          </div>
                          <span style={{ 
                            fontSize: 11, 
                            color: spotsLeft > 0 ? '#22c55e' : '#94a3b8',
                            fontWeight: 600
                          }}>
                            {spotsLeft > 0 ? `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}` : 'Complet'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Boîte à idées */}
          <div className="ideas-mobile">
            <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 18,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #f1f5f9'
              }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: DARK }}>Boîte à idées</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Propose des améliorations</div>
                </div>
                <span style={{ color: '#94a3b8', fontSize: 20 }}>›</span>
              </div>
            </Link>
          </div>

        </div>

        {/* ============================================ */}
        {/* SIDEBAR                                     */}
        {/* ============================================ */}
        <aside className="sidebar">
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Statistiques
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Jouées', value: stats.total },
                { label: 'Organisées', value: stats.organized },
                { label: 'Niveau', value: profile?.level || '?' }
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: DARK }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Joueurs favoris
              </h3>
              <Link href="/dashboard/joueurs" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}>
                Voir →
              </Link>
            </div>
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Aucun favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favoritePlayers.map(player => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar player={player} size={40} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: DARK }}>{player.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Niveau {player.level}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: DARK }}>Boîte à idées</div>
              </div>
              <span style={{ color: '#94a3b8' }}>›</span>
            </div>
          </Link>
        </aside>
      </div>

      <style jsx global>{`
        .page-layout {
          display: flex;
          gap: 32px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px;
        }
        
        .main-content {
          flex: 1;
          min-width: 0;
          padding-bottom: 100px;
        }
        
        .sidebar {
          width: 280px;
          flex-shrink: 0;
          display: none;
        }
        
        .my-matches-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .ideas-mobile {
          display: block;
        }
        
        .match-card-hover:hover {
          border-color: #3b82f6 !important;
          transform: translateY(-2px);
        }
        
        .explore-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important;
        }
        
        @media (max-width: 640px) {
          .my-matches-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (min-width: 1024px) {
          .sidebar {
            display: block;
          }
          .main-content {
            padding-bottom: 40px;
          }
          .ideas-mobile {
            display: none;
          }
        }
      `}</style>
    </>
  )
}