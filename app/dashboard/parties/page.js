'use client'

/**
 * ============================================
 * PAGE PARTIES V3 - Page d'accueil optimisée
 * ============================================
 * 
 * Corrections appliquées :
 * - Retrait bouton "Ma carte" (doublon navbar)
 * - Ajout bouton "Partager" sur mes parties
 * - Bouton "Inviter" avec match_id
 * - Filtre date ajouté
 * - Message de bienvenue contextuel
 * - Requêtes parallélisées
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { COLORS, RADIUS, SHADOWS, getAvatarColor, AMBIANCE_CONFIG } from '@/app/lib/design-tokens'

export default function PartiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Navigation
  const [activeTab, setActiveTab] = useState(tabParam === 'rejoindre' ? 'rejoindre' : 'mes-parties')
  const [subTab, setSubTab] = useState('upcoming')
  
  // Filtres
  const [filterCity, setFilterCity] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [cities, setCities] = useState([])
  
  // Données principales
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [myPastMatches, setMyPastMatches] = useState([])
  
  // Données sidebar (chargées en différé)
  const [stats, setStats] = useState({ total: 0, organized: 0 })
  const [favoritePlayers, setFavoritePlayers] = useState([])
  
  // Partage
  const [sharing, setSharing] = useState(null)

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
    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // === REQUÊTES PARALLÈLES (optimisation) ===
    const [
      profileResult,
      availableResult,
      orgMatchesResult,
      partMatchesResult
    ] = await Promise.all([
      // 1. Mon profil
      supabase.from('profiles').select('*').eq('id', userId).single(),
      
      // 2. Parties disponibles
      supabase.from('matches')
        .select(`
          *, 
          clubs (id, name, city), 
          profiles!matches_organizer_id_fkey (id, name, avatar_url),
          match_participants (id, user_id, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))
        `)
        .eq('status', 'open')
        .gt('spots_available', 0)
        .gte('match_date', today)
        .neq('organizer_id', userId)
        .order('match_date', { ascending: true })
        .limit(30),
      
      // 3. Mes parties (organisateur)
      supabase.from('matches')
        .select(`
          *, 
          clubs (name, city), 
          profiles!matches_organizer_id_fkey (id, name, avatar_url),
          match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))
        `)
        .eq('organizer_id', userId)
        .gte('match_date', today)
        .order('match_date', { ascending: true }),
      
      // 4. Mes parties (participant)
      supabase.from('match_participants')
        .select(`
          match_id, status,
          matches!inner (
            *, 
            clubs (name, city),
            profiles!matches_organizer_id_fkey (id, name, avatar_url),
            match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('matches.match_date', today)
    ])

    const profileData = profileResult.data
    setProfile(profileData)

    // Traiter les parties disponibles
    const filteredAvailable = (availableResult.data || []).filter(match => {
      const isParticipant = match.match_participants?.some(p => p.user_id === userId)
      return !isParticipant
    })
    setAvailableMatches(filteredAvailable)

    // Extraire les villes
    const citiesSet = new Set()
    filteredAvailable.forEach(m => {
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city)
    })
    setCities(Array.from(citiesSet).sort())

    if (profileData?.city) {
      setFilterCity(profileData.city)
    }

    // Fusionner mes parties (org + participant)
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

    // === CHARGEMENT DIFFÉRÉ (sidebar) ===
    loadSidebarData(userId, today)
  }

  async function loadSidebarData(userId, today) {
    const [pastResult, organizedCount, favoritesResult] = await Promise.all([
      // Parties passées
      supabase.from('match_participants')
        .select(`match_id, matches!inner (id, match_date, clubs (name, city))`)
        .eq('user_id', userId)
        .lt('matches.match_date', today)
        .limit(10),
      
      // Nombre organisées
      supabase.from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId),
      
      // Favoris
      supabase.from('player_favorites')
        .select(`favorite_user_id, profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city)`)
        .eq('user_id', userId)
        .limit(5)
    ])

    // Dédupliquer les parties passées
    const pastMatches = []
    const seenIds = new Set()
    ;(pastResult.data || []).forEach(p => {
      if (p.matches && !seenIds.has(p.matches.id)) {
        seenIds.add(p.matches.id)
        pastMatches.push(p.matches)
      }
    })
    pastMatches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    setMyPastMatches(pastMatches)

    setStats({
      total: pastMatches.length,
      organized: organizedCount.count || 0
    })

    setFavoritePlayers((favoritesResult.data || []).map(f => f.profiles).filter(Boolean))
  }

  // === HELPERS ===

  function formatDate(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
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
        isOrganizer: true
      })
    }
    
    ;(match.match_participants || []).forEach(p => {
      if (p.user_id !== match.organizer_id && p.profiles && p.status === 'confirmed') {
        players.push({
          id: p.user_id,
          name: p.profiles.name,
          avatar_url: p.profiles.avatar_url
        })
      }
    })
    
    return players
  }

  // === MESSAGE DE BIENVENUE CONTEXTUEL ===
  function getWelcomeMessage() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    const availableInCity = availableMatches.filter(m => {
      const city = m.clubs?.city || m.city
      return !profile?.city || city?.toLowerCase() === profile.city?.toLowerCase()
    }).length

    if (myUpcomingMatches.length === 0 && availableInCity > 0) {
      return `🔥 ${availableInCity} partie${availableInCity > 1 ? 's' : ''} disponible${availableInCity > 1 ? 's' : ''} près de chez toi !`
    }
    
    if (hour < 12) {
      return `☀️ Bonjour ${firstName} ! Prêt pour une partie ?`
    } else if (hour < 18) {
      return `👋 Salut ${firstName} !`
    } else {
      return `🌙 Bonsoir ${firstName} !`
    }
  }

  // === PARTAGE ===
  async function shareMatch(match) {
    setSharing(match.id)
    
    const matchUrl = `${window.location.origin}/join/${match.id}`
    const shareText = `🎾 Partie de padel !
📅 ${formatDate(match.match_date)} à ${formatTime(match.match_time)}
📍 ${getMatchLocation(match)}
👥 ${match.spots_available || 1} place(s) dispo

Rejoins-moi 👉 ${matchUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Partie de padel',
          text: shareText,
          url: matchUrl
        })
      } catch (err) {
        // Utilisateur a annulé
      }
    } else {
      // Fallback WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
    }
    
    setSharing(null)
  }

  // === FILTRES ===
  const filteredAvailable = availableMatches.filter(match => {
    // Filtre ville
    if (filterCity !== 'all') {
      const matchCity = match.clubs?.city || match.city
      if (matchCity?.toLowerCase() !== filterCity.toLowerCase()) return false
    }
    
    // Filtre niveau
    if (filterLevel === 'mine' && profile?.level) {
      if (match.level_min > profile.level + 2 || match.level_max < profile.level - 2) return false
    }
    
    // Filtre date
    if (filterDate !== 'all' && match.match_date) {
      const matchDate = new Date(match.match_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(today)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      
      if (filterDate === 'today' && matchDate.toDateString() !== today.toDateString()) return false
      if (filterDate === 'week' && matchDate > endOfWeek) return false
      if (filterDate === 'weekend') {
        const day = matchDate.getDay()
        if (day !== 0 && day !== 6) return false
      }
    }
    
    return true
  })

  // === RENDER ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <div className="parties-layout">
        <div className="parties-main">

          {/* ============================================ */}
          {/* HEADER SIMPLIFIÉ                            */}
          {/* ============================================ */}
          <div style={{
            background: COLORS.card,
            borderRadius: RADIUS.lg,
            padding: 24,
            marginBottom: 24,
            border: `1px solid ${COLORS.border}`
          }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: COLORS.text }}>
              {getWelcomeMessage()}
            </h1>
            
            {/* Indicateur parties disponibles si on est sur "Mes parties" */}
            {activeTab === 'mes-parties' && filteredAvailable.length > 0 && (
              <p style={{ fontSize: 14, color: COLORS.accent, margin: '0 0 16px', fontWeight: 500 }}>
                📍 {filteredAvailable.length} partie{filteredAvailable.length > 1 ? 's' : ''} disponible{filteredAvailable.length > 1 ? 's' : ''} à rejoindre
              </p>
            )}
            
            <Link
              href="/dashboard/matches/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 24px',
                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                color: '#fff',
                borderRadius: RADIUS.md,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              + Créer une partie
            </Link>
          </div>

          {/* ============================================ */}
          {/* TABS                                        */}
          {/* ============================================ */}
          <div style={{
            display: 'flex',
            background: COLORS.card,
            borderRadius: RADIUS.md,
            padding: 4,
            marginBottom: 20,
            border: `1px solid ${COLORS.border}`
          }}>
            {[
              { id: 'mes-parties', label: 'Mes parties', count: myUpcomingMatches.length },
              { id: 'rejoindre', label: 'Rejoindre', count: filteredAvailable.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: RADIUS.sm,
                  background: activeTab === tab.id ? COLORS.accent : 'transparent',
                  color: activeTab === tab.id ? '#fff' : COLORS.textMuted,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>

          {/* ============================================ */}
          {/* TAB: MES PARTIES                            */}
          {/* ============================================ */}
          {activeTab === 'mes-parties' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'upcoming', label: 'À venir', count: myUpcomingMatches.length },
                  { id: 'past', label: 'Passées', count: myPastMatches.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSubTab(tab.id)}
                    style={{
                      padding: '8px 16px',
                      border: `1px solid ${subTab === tab.id ? COLORS.accent : COLORS.border}`,
                      borderRadius: RADIUS.sm,
                      background: subTab === tab.id ? COLORS.accentLight : COLORS.card,
                      color: subTab === tab.id ? COLORS.accent : COLORS.textMuted,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {subTab === 'upcoming' && (
                myUpcomingMatches.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 40,
                    background: COLORS.card,
                    borderRadius: RADIUS.lg,
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                      Aucune partie prévue
                    </h3>
                    <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
                      Crée ta première partie ou rejoins-en une !
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Link href="/dashboard/matches/create" style={{
                        padding: '12px 20px',
                        background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                        color: '#fff', borderRadius: RADIUS.md, fontWeight: 600, textDecoration: 'none'
                      }}>+ Créer une partie</Link>
                      {filteredAvailable.length > 0 && (
                        <button onClick={() => setActiveTab('rejoindre')} style={{
                          padding: '12px 20px', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.md, fontWeight: 600, color: COLORS.text, cursor: 'pointer'
                        }}>
                          Voir les {filteredAvailable.length} parties disponibles
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="matches-grid">
                    {myUpcomingMatches.map(match => {
                      const isOrganizer = match.organizer_id === user?.id
                      const players = getMatchPlayers(match)
                      const spotsLeft = match.spots_available || (4 - players.length)
                      const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                      
                      return (
                        <div key={match.id} style={{
                          background: COLORS.card,
                          borderRadius: RADIUS.lg,
                          border: `1px solid ${COLORS.border}`,
                          overflow: 'hidden'
                        }}>
                          <div style={{ padding: 16 }}>
                            {isOrganizer && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', background: COLORS.accentLight, borderRadius: RADIUS.sm,
                                fontSize: 11, fontWeight: 700, color: COLORS.accent, marginBottom: 10
                              }}>👑 Tu organises</div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>
                                  {formatDate(match.match_date)} • {formatTime(match.match_time)}
                                </div>
                                <div style={{ fontSize: 14, color: COLORS.textMuted }}>📍 {getMatchLocation(match)}</div>
                              </div>
                              <div style={{
                                padding: '4px 10px', background: `${ambiance.color}15`,
                                borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, color: ambiance.color
                              }}>{ambiance.emoji}</div>
                            </div>

                            {/* Joueurs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {players.slice(0, 4).map((player) => (
                                <div key={player.id} style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 14, fontWeight: 600, color: '#fff',
                                  border: player.id === user?.id ? `2px solid ${COLORS.accent}` : '2px solid #fff',
                                  overflow: 'hidden'
                                }} title={player.name}>
                                  {player.avatar_url 
                                    ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    : player.name?.[0]?.toUpperCase()
                                  }
                                </div>
                              ))}
                              {spotsLeft > 0 && Array(Math.min(spotsLeft, 4 - players.length)).fill(0).map((_, idx) => (
                                <div key={`empty-${idx}`} style={{
                                  width: 36, height: 36, borderRadius: '50%', border: `2px dashed ${COLORS.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: COLORS.border
                                }}>?</div>
                              ))}
                              {spotsLeft > 0 && (
                                <span style={{ fontSize: 13, color: COLORS.textMuted, marginLeft: 8 }}>
                                  {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions - CORRIGÉES */}
                          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 12, display: 'flex', gap: 8 }}>
                            <Link href={`/dashboard/match/${match.id}`} style={{
                              flex: 1, padding: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                              borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 13, textDecoration: 'none', textAlign: 'center', color: COLORS.text
                            }}>Voir</Link>
                            
                            {isOrganizer && (
                              <>
                                {spotsLeft > 0 && (
                                  <Link href={`/dashboard/joueurs?match=${match.id}`} style={{
                                    flex: 1, padding: 10, background: COLORS.card, border: `1px solid ${COLORS.accent}`,
                                    borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 13, textDecoration: 'none', textAlign: 'center', color: COLORS.accent
                                  }}>Inviter</Link>
                                )}
                                <button onClick={() => shareMatch(match)} disabled={sharing === match.id} style={{
                                  flex: 1, padding: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                                  color: '#fff', border: 'none', borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 13, cursor: 'pointer'
                                }}>
                                  {sharing === match.id ? '...' : '📤 Partager'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {subTab === 'past' && (
                myPastMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                    <p style={{ color: COLORS.textMuted }}>Aucune partie passée</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myPastMatches.map(match => (
                      <Link key={match.id} href={`/dashboard/match/${match.id}`} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14,
                        background: COLORS.card, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, textDecoration: 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{formatDate(match.match_date)}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{match.clubs?.name || match.city || 'Lieu inconnu'}</div>
                        </div>
                        <div style={{ fontSize: 20, color: COLORS.textMuted }}>→</div>
                      </Link>
                    ))}
                  </div>
                )
              )}
            </>
          )}

          {/* ============================================ */}
          {/* TAB: REJOINDRE                              */}
          {/* ============================================ */}
          {activeTab === 'rejoindre' && (
            <>
              {/* Filtres améliorés */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{
                  padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm,
                  fontSize: 14, background: COLORS.card, color: COLORS.text, cursor: 'pointer'
                }}>
                  <option value="all">📍 Toutes villes</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                
                <select value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{
                  padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm,
                  fontSize: 14, background: COLORS.card, color: COLORS.text, cursor: 'pointer'
                }}>
                  <option value="all">📅 Toutes dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="weekend">Ce week-end</option>
                </select>
                
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{
                  padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm,
                  fontSize: 14, background: COLORS.card, color: COLORS.text, cursor: 'pointer'
                }}>
                  <option value="all">⭐ Tous niveaux</option>
                  <option value="mine">Mon niveau (±2)</option>
                </select>
              </div>

              {filteredAvailable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Aucune partie trouvée</h3>
                  <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
                    {filterCity !== 'all' || filterDate !== 'all' 
                      ? 'Essaie avec d\'autres filtres ou crée ta propre partie !' 
                      : 'Sois le premier à créer une partie !'}
                  </p>
                  <Link href="/dashboard/matches/create" style={{
                    display: 'inline-block', padding: '12px 24px',
                    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                    color: '#fff', borderRadius: RADIUS.md, fontWeight: 600, textDecoration: 'none'
                  }}>Créer une partie</Link>
                </div>
              ) : (
                <div className="matches-grid">
                  {filteredAvailable.map(match => {
                    const players = getMatchPlayers(match)
                    const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                    const spotsLeft = match.spots_available || (4 - players.length)
                    
                    return (
                      <div key={match.id} style={{ background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                        <div style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>
                                {formatDate(match.match_date)} • {formatTime(match.match_time)}
                              </div>
                              <div style={{ fontSize: 14, color: COLORS.textMuted }}>📍 {getMatchLocation(match)}</div>
                            </div>
                            <div style={{ padding: '4px 10px', background: `${ambiance.color}15`, borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, color: ambiance.color }}>
                              {ambiance.emoji} {ambiance.label}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
                            <span>👥 {spotsLeft} place{spotsLeft > 1 ? 's' : ''}</span>
                            <span>⭐ Niveau {match.level_min}-{match.level_max}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            {players.slice(0, 4).map((player) => (
                              <div key={player.id} style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 600, color: '#fff',
                                border: player.isOrganizer ? `2px solid ${COLORS.accent}` : '2px solid #fff',
                                overflow: 'hidden'
                              }} title={player.name}>
                                {player.avatar_url 
                                  ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                  : player.name?.[0]?.toUpperCase()
                                }
                              </div>
                            ))}
                            {spotsLeft > 0 && Array(Math.min(spotsLeft, 4 - players.length)).fill(0).map((_, idx) => (
                              <div key={`empty-${idx}`} style={{
                                width: 36, height: 36, borderRadius: '50%', border: `2px dashed ${COLORS.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: COLORS.border
                              }}>?</div>
                            ))}
                          </div>

                          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Organisé par {match.profiles?.name || 'Anonyme'}</div>
                        </div>

                        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 12 }}>
                          <Link href={`/join/${match.id}`} style={{
                            display: 'block', padding: 12, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                            color: '#fff', borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 14, textDecoration: 'none', textAlign: 'center'
                          }}>Rejoindre</Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Boîte à idées (Mobile) */}
          <div className="ideas-box-mobile" style={{ marginTop: 24 }}>
            <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: RADIUS.lg, padding: 20, border: '1px solid #bae6fd',
                display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>💡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0369a1', marginBottom: 4 }}>Boîte à idées</div>
                  <div style={{ fontSize: 13, color: '#0c4a6e' }}>Propose des idées et vote</div>
                </div>
                <span style={{ color: '#0ea5e9', fontSize: 20 }}>→</span>
              </div>
            </Link>
          </div>

        </div>

        {/* SIDEBAR Desktop */}
        <aside className="parties-sidebar">
          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 24, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: COLORS.text }}>📊 Mes stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted, fontSize: 14 }}>Parties jouées</span>
                <span style={{ fontWeight: 700, color: COLORS.text }}>{stats.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted, fontSize: 14 }}>Niveau</span>
                <span style={{ fontWeight: 700, color: COLORS.text }}>⭐ {profile?.level || '?'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted, fontSize: 14 }}>Parties organisées</span>
                <span style={{ fontWeight: 700, color: COLORS.text }}>{stats.organized}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textMuted, fontSize: 14 }}>Fiabilité</span>
                <span style={{ fontWeight: 700, color: COLORS.accent }}>{profile?.reliability_score || 100}%</span>
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 24, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: COLORS.text }}>👥 Joueurs favoris</h3>
              <Link href="/dashboard/joueurs" style={{ fontSize: 13, color: COLORS.accent, textDecoration: 'none' }}>Voir →</Link>
            </div>
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0 }}>Aucun favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favoritePlayers.map((player) => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 16, overflow: 'hidden'
                      }}>
                        {player.avatar_url 
                          ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : player.name?.[0]?.toUpperCase() || '?'
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>⭐ {player.level} • {player.city || 'France'}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              borderRadius: RADIUS.lg, padding: 20, border: '1px solid #bae6fd',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
            }}>
              <div style={{ fontSize: 28 }}>💡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0369a1' }}>Boîte à idées</div>
                <div style={{ fontSize: 12, color: '#0c4a6e' }}>Propose et vote</div>
              </div>
              <span style={{ color: '#0ea5e9' }}>→</span>
            </div>
          </Link>
        </aside>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        .parties-layout { display: flex; gap: 24px; max-width: 1200px; margin: 0 auto; }
        .parties-main { flex: 1; min-width: 0; padding-bottom: 100px; }
        .parties-sidebar { width: 320px; flex-shrink: 0; display: none; }
        .matches-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .ideas-box-mobile { display: block; }
        @media (min-width: 768px) { .matches-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) {
          .parties-sidebar { display: block; }
          .parties-main { padding-bottom: 24px; }
          .ideas-box-mobile { display: none; }
          .parties-layout { gap: 32px; }
        }
        @media (min-width: 1280px) { .parties-sidebar { width: 340px; } }
      `}</style>
    </>
  )
}