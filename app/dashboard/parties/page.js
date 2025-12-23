'use client'

/**
 * ============================================
 * PAGE PARTIES V4 - Refonte UX/UI
 * ============================================
 * 
 * Améliorations visuelles :
 * - Header héro avec gradient vert
 * - Tabs minimalistes avec underline
 * - Cartes avec bordure colorée (statut)
 * - Plus d'espace blanc
 * - Date mise en avant
 * - Click to view (plus de bouton "Voir")
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { COLORS, RADIUS, getAvatarColor, AMBIANCE_CONFIG } from '@/app/lib/design-tokens'

export default function PartiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState(tabParam === 'rejoindre' ? 'rejoindre' : 'mes-parties')
  const [subTab, setSubTab] = useState('upcoming')
  
  const [filterCity, setFilterCity] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [cities, setCities] = useState([])
  
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [myPastMatches, setMyPastMatches] = useState([])
  
  const [stats, setStats] = useState({ total: 0, organized: 0 })
  const [favoritePlayers, setFavoritePlayers] = useState([])
  
  const [sharing, setSharing] = useState(null)

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
        .order('match_date', { ascending: true }).limit(30),
      supabase.from('matches')
        .select(`*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))`)
        .eq('organizer_id', userId).gte('match_date', today).order('match_date', { ascending: true }),
      supabase.from('match_participants')
        .select(`match_id, status, matches!inner (*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url)))`)
        .eq('user_id', userId).eq('status', 'confirmed').gte('matches.match_date', today)
    ])

    const profileData = profileResult.data
    setProfile(profileData)

    const filteredAvailable = (availableResult.data || []).filter(m => !m.match_participants?.some(p => p.user_id === userId))
    setAvailableMatches(filteredAvailable)

    const citiesSet = new Set()
    filteredAvailable.forEach(m => { if (m.clubs?.city) citiesSet.add(m.clubs.city); if (m.city) citiesSet.add(m.city) })
    setCities(Array.from(citiesSet).sort())
    if (profileData?.city) setFilterCity(profileData.city)

    const allUpcoming = [...(orgMatchesResult.data || [])]
    const orgIds = new Set(allUpcoming.map(m => m.id))
    ;(partMatchesResult.data || []).forEach(p => { if (p.matches && !orgIds.has(p.matches.id)) allUpcoming.push({ ...p.matches, _isParticipant: true }) })
    allUpcoming.sort((a, b) => new Date(`${a.match_date}T${a.match_time || '00:00'}`) - new Date(`${b.match_date}T${b.match_time || '00:00'}`))
    setMyUpcomingMatches(allUpcoming)
    setLoading(false)

    // Chargement différé sidebar
    loadSidebarData(userId, today)
  }

  async function loadSidebarData(userId, today) {
    const [pastResult, organizedCount, favoritesResult] = await Promise.all([
      supabase.from('match_participants').select(`match_id, matches!inner (id, match_date, clubs (name, city))`).eq('user_id', userId).lt('matches.match_date', today).limit(10),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('organizer_id', userId),
      supabase.from('player_favorites').select(`favorite_user_id, profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city)`).eq('user_id', userId).limit(5)
    ])
    const pastMatches = []
    const seenIds = new Set()
    ;(pastResult.data || []).forEach(p => { if (p.matches && !seenIds.has(p.matches.id)) { seenIds.add(p.matches.id); pastMatches.push(p.matches) } })
    setMyPastMatches(pastMatches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)))
    setStats({ total: pastMatches.length, organized: organizedCount.count || 0 })
    setFavoritePlayers((favoritesResult.data || []).map(f => f.profiles).filter(Boolean))
  }

  // === HELPERS ===
  function formatDate(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === today.toDateString()) return "AUJOURD'HUI"
    if (date.toDateString() === tomorrow.toDateString()) return 'DEMAIN'
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  }

  function formatTime(timeStr) { return timeStr ? timeStr.slice(0, 5) : '' }
  function getMatchLocation(match) { return match.clubs?.name || match.city || 'Lieu à définir' }

  function getMatchPlayers(match) {
    const players = []
    if (match.profiles) players.push({ id: match.organizer_id, name: match.profiles.name, avatar_url: match.profiles.avatar_url, isOrganizer: true })
    ;(match.match_participants || []).forEach(p => { if (p.user_id !== match.organizer_id && p.profiles && p.status === 'confirmed') players.push({ id: p.user_id, name: p.profiles.name, avatar_url: p.profiles.avatar_url }) })
    return players
  }

  function getWelcomeMessage() {
    const hour = new Date().getHours()
    const firstName = profile?.name?.split(' ')[0] || ''
    if (hour < 12) return { greeting: `Bonjour ${firstName} !`, icon: '☀️' }
    if (hour < 18) return { greeting: `Salut ${firstName} !`, icon: '👋' }
    return { greeting: `Bonsoir ${firstName} !`, icon: '🌙' }
  }

  function getSubtitle() {
    const availableInCity = availableMatches.filter(m => {
      const city = m.clubs?.city || m.city
      return !profile?.city || city?.toLowerCase() === profile.city?.toLowerCase()
    }).length
    if (availableInCity > 0) return `${availableInCity} partie${availableInCity > 1 ? 's' : ''} disponible${availableInCity > 1 ? 's' : ''} près de toi`
    if (myUpcomingMatches.length > 0) return `${myUpcomingMatches.length} partie${myUpcomingMatches.length > 1 ? 's' : ''} à venir`
    return 'Prêt pour une partie ?'
  }

  async function shareMatch(match, e) {
    e.stopPropagation()
    setSharing(match.id)
    const matchUrl = `${window.location.origin}/join/${match.id}`
    const shareText = `🎾 Partie de padel !\n📅 ${formatDate(match.match_date)} à ${formatTime(match.match_time)}\n📍 ${getMatchLocation(match)}\n\nRejoins-moi 👉 ${matchUrl}`
    if (navigator.share) { try { await navigator.share({ title: 'Partie de padel', text: shareText, url: matchUrl }) } catch {} }
    else { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank') }
    setSharing(null)
  }

  const filteredAvailable = availableMatches.filter(match => {
    if (filterCity !== 'all' && (match.clubs?.city || match.city)?.toLowerCase() !== filterCity.toLowerCase()) return false
    if (filterLevel === 'mine' && profile?.level && (match.level_min > profile.level + 2 || match.level_max < profile.level - 2)) return false
    if (filterDate !== 'all' && match.match_date) {
      const matchDate = new Date(match.match_date); const today = new Date(); today.setHours(0, 0, 0, 0)
      if (filterDate === 'today' && matchDate.toDateString() !== today.toDateString()) return false
      if (filterDate === 'week') { const end = new Date(today); end.setDate(end.getDate() + 7); if (matchDate > end) return false }
      if (filterDate === 'weekend' && matchDate.getDay() !== 0 && matchDate.getDay() !== 6) return false
    }
    return true
  })

  // === COMPOSANTS ===
  
  function MatchCard({ match, isOrganizer, isParticipant, showActions = true }) {
    const players = getMatchPlayers(match)
    const spotsLeft = match.spots_available || (4 - players.length)
    const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
    const borderColor = isOrganizer ? COLORS.accent : isParticipant ? COLORS.info : 'transparent'
    
    return (
      <div
        onClick={() => router.push(`/dashboard/match/${match.id}`)}
        style={{
          background: COLORS.card,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `4px solid ${borderColor}`,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ padding: 20 }}>
          {/* Header : Date + Ambiance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, letterSpacing: '-0.02em' }}>
                {formatDate(match.match_date)}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>
                {formatTime(match.match_time)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isOrganizer && (
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, background: COLORS.accentLight, padding: '4px 8px', borderRadius: RADIUS.sm }}>
                  👑 Organisateur
                </span>
              )}
              <span style={{ fontSize: 20 }} title={ambiance.label}>{ambiance.emoji}</span>
            </div>
          </div>

          {/* Lieu */}
          <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📍</span> {getMatchLocation(match)}
          </div>

          {/* Joueurs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {players.slice(0, 4).map((player, idx) => (
                <div key={player.id} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 600, color: '#fff',
                  border: `3px solid ${COLORS.card}`,
                  marginLeft: idx > 0 ? -12 : 0,
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 4 - idx
                }}>
                  {player.avatar_url ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : player.name?.[0]?.toUpperCase()}
                </div>
              ))}
              {spotsLeft > 0 && (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: COLORS.bg, border: `2px dashed ${COLORS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: COLORS.textMuted,
                  marginLeft: players.length > 0 ? -12 : 0
                }}>+{spotsLeft}</div>
              )}
            </div>
            
            {spotsLeft > 0 && (
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>
                {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions (organisateur uniquement) */}
        {showActions && isOrganizer && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 12, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
            {spotsLeft > 0 && (
              <Link href={`/dashboard/joueurs?match=${match.id}`} style={{
                flex: 1, padding: '10px 16px', background: COLORS.card, border: `1px solid ${COLORS.accent}`,
                borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 13, textDecoration: 'none', textAlign: 'center', color: COLORS.accent
              }}>+ Inviter</Link>
            )}
            <button onClick={(e) => shareMatch(match, e)} disabled={sharing === match.id} style={{
              flex: 1, padding: '10px 16px', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
              color: '#fff', border: 'none', borderRadius: RADIUS.sm, fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>{sharing === match.id ? '...' : '📤 Partager'}</button>
          </div>
        )}
      </div>
    )
  }

  // === RENDER ===
  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎾</div>
        <div style={{ color: COLORS.textMuted, fontSize: 15 }}>Chargement...</div>
      </div>
    )
  }

  const welcome = getWelcomeMessage()

  return (
    <>
      <div className="parties-layout">
        <div className="parties-main">

          {/* ============================================ */}
          {/* HEADER HÉRO                                 */}
          {/* ============================================ */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
            borderRadius: RADIUS.xl,
            padding: '32px 24px',
            marginBottom: 32,
            color: '#fff'
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{welcome.icon}</span>
              <span>{welcome.greeting}</span>
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, marginBottom: 24 }}>
              {getSubtitle()}
            </div>
            
            <Link href="/dashboard/matches/create" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: '#fff', color: COLORS.accent,
              borderRadius: RADIUS.md, fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              + Créer une partie
            </Link>
          </div>

          {/* ============================================ */}
          {/* TABS MINIMALISTES                           */}
          {/* ============================================ */}
          <div style={{ marginBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { id: 'mes-parties', label: 'Mes parties', count: myUpcomingMatches.length },
                { id: 'rejoindre', label: 'Rejoindre', count: filteredAvailable.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 0',
                    border: 'none',
                    background: 'none',
                    fontSize: 15,
                    fontWeight: 600,
                    color: activeTab === tab.id ? COLORS.text : COLORS.textMuted,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'color 0.2s'
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      background: activeTab === tab.id ? COLORS.accentLight : COLORS.bg,
                      color: activeTab === tab.id ? COLORS.accent : COLORS.textMuted,
                      borderRadius: RADIUS.full,
                      fontSize: 12,
                      fontWeight: 700
                    }}>{tab.count}</span>
                  )}
                  {activeTab === tab.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: COLORS.accent,
                      borderRadius: '3px 3px 0 0'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================ */}
          {/* TAB: MES PARTIES                            */}
          {/* ============================================ */}
          {activeTab === 'mes-parties' && (
            <>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {[
                  { id: 'upcoming', label: 'À venir' },
                  { id: 'past', label: 'Passées' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
                    padding: '8px 16px', border: 'none', borderRadius: RADIUS.full,
                    background: subTab === tab.id ? COLORS.text : COLORS.bg,
                    color: subTab === tab.id ? '#fff' : COLORS.textMuted,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>{tab.label}</button>
                ))}
              </div>

              {subTab === 'upcoming' && (
                myUpcomingMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.8 }}>🎾</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: COLORS.text }}>
                      Aucune partie prévue
                    </h3>
                    <p style={{ color: COLORS.textMuted, marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>
                      Ta prochaine partie de padel t'attend quelque part...
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Link href="/dashboard/matches/create" style={{
                        padding: '14px 24px', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                        color: '#fff', borderRadius: RADIUS.md, fontWeight: 600, textDecoration: 'none'
                      }}>+ Créer une partie</Link>
                      {filteredAvailable.length > 0 && (
                        <button onClick={() => setActiveTab('rejoindre')} style={{
                          padding: '14px 24px', background: COLORS.card, border: `1px solid ${COLORS.border}`,
                          borderRadius: RADIUS.md, fontWeight: 600, color: COLORS.text, cursor: 'pointer'
                        }}>Explorer →</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="matches-grid">
                    {myUpcomingMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        isOrganizer={match.organizer_id === user?.id}
                        isParticipant={match._isParticipant}
                      />
                    ))}
                  </div>
                )
              )}

              {subTab === 'past' && (
                myPastMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📜</div>
                    <p style={{ color: COLORS.textMuted }}>Aucune partie passée</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myPastMatches.map(match => (
                      <Link key={match.id} href={`/dashboard/match/${match.id}`} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16,
                        background: COLORS.card, borderRadius: RADIUS.md, border: `1px solid ${COLORS.border}`, textDecoration: 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{formatDate(match.match_date)}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{match.clubs?.name || match.city || 'Lieu'}</div>
                        </div>
                        <span style={{ color: COLORS.textMuted }}>→</span>
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
              {/* Filtres */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { value: filterCity, onChange: setFilterCity, options: [{ v: 'all', l: '📍 Toutes villes' }, ...cities.map(c => ({ v: c, l: c }))] },
                  { value: filterDate, onChange: setFilterDate, options: [{ v: 'all', l: '📅 Toutes dates' }, { v: 'today', l: "Aujourd'hui" }, { v: 'week', l: 'Cette semaine' }, { v: 'weekend', l: 'Ce week-end' }] },
                  { value: filterLevel, onChange: setFilterLevel, options: [{ v: 'all', l: '⭐ Tous niveaux' }, { v: 'mine', l: 'Mon niveau' }] }
                ].map((filter, i) => (
                  <select key={i} value={filter.value} onChange={e => filter.onChange(e.target.value)} style={{
                    padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.full,
                    fontSize: 13, background: COLORS.card, color: COLORS.text, cursor: 'pointer'
                  }}>
                    {filter.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ))}
              </div>

              {filteredAvailable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.8 }}>🔍</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: COLORS.text }}>Aucune partie</h3>
                  <p style={{ color: COLORS.textMuted, marginBottom: 24 }}>
                    {filterCity !== 'all' || filterDate !== 'all' ? 'Essaie avec d\'autres filtres' : 'Sois le premier à créer !'}
                  </p>
                  <Link href="/dashboard/matches/create" style={{
                    display: 'inline-block', padding: '14px 24px',
                    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                    color: '#fff', borderRadius: RADIUS.md, fontWeight: 600, textDecoration: 'none'
                  }}>Créer une partie</Link>
                </div>
              ) : (
                <div className="matches-grid">
                  {filteredAvailable.map(match => {
                    const players = getMatchPlayers(match)
                    const spotsLeft = match.spots_available || (4 - players.length)
                    const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                    
                    return (
                      <div key={match.id} style={{ background: COLORS.card, borderRadius: RADIUS.lg, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                        <Link href={`/join/${match.id}`} style={{ textDecoration: 'none', display: 'block', padding: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{formatDate(match.match_date)}</div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent }}>{formatTime(match.match_time)}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <span style={{ fontSize: 20 }}>{ambiance.emoji}</span>
                              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Niv. {match.level_min}-{match.level_max}</span>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16 }}>📍 {getMatchLocation(match)}</div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {players.slice(0, 4).map((player, idx) => (
                                <div key={player.id} style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 14, fontWeight: 600, color: '#fff',
                                  border: `3px solid ${COLORS.card}`, marginLeft: idx > 0 ? -10 : 0, overflow: 'hidden'
                                }}>
                                  {player.avatar_url ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : player.name?.[0]?.toUpperCase()}
                                </div>
                              ))}
                              {spotsLeft > 0 && (
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%', background: COLORS.bg,
                                  border: `2px dashed ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginLeft: -10
                                }}>+{spotsLeft}</div>
                              )}
                            </div>
                            <div style={{
                              padding: '8px 16px', background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                              color: '#fff', borderRadius: RADIUS.full, fontSize: 13, fontWeight: 700
                            }}>Rejoindre →</div>
                          </div>
                          
                          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 12 }}>
                            Par {match.profiles?.name || 'Anonyme'}
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Boîte à idées */}
          <div className="ideas-box-mobile" style={{ marginTop: 32 }}>
            <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: RADIUS.lg, padding: 20, border: '1px solid #bae6fd',
                display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0369a1' }}>Boîte à idées</div>
                  <div style={{ fontSize: 13, color: '#0c4a6e' }}>Propose et vote</div>
                </div>
                <span style={{ color: '#0ea5e9', fontSize: 18 }}>→</span>
              </div>
            </Link>
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="parties-sidebar">
          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 24, marginBottom: 20, border: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mes stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Jouées', value: stats.total },
                { label: 'Organisées', value: stats.organized },
                { label: 'Niveau', value: `⭐ ${profile?.level || '?'}` },
                { label: 'Fiabilité', value: `${profile?.reliability_score || 100}%` }
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', padding: 12, background: COLORS.bg, borderRadius: RADIUS.md }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.card, borderRadius: RADIUS.lg, padding: 24, marginBottom: 20, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Favoris</h3>
              <Link href="/dashboard/joueurs" style={{ fontSize: 12, color: COLORS.accent, textDecoration: 'none' }}>Voir →</Link>
            </div>
            {favoritePlayers.length === 0 ? (
              <p style={{ fontSize: 13, color: COLORS.textLight, margin: 0 }}>Aucun favori</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favoritePlayers.map(player => (
                  <Link href={`/player/${player.id}`} key={player.id} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: player.avatar_url ? 'transparent' : getAvatarColor(player.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, overflow: 'hidden' }}>
                      {player.avatar_url ? <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : player.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{player.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>⭐ {player.level}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/dashboard/ideas" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: RADIUS.lg, padding: 16, border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>💡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0369a1' }}>Boîte à idées</div>
              </div>
              <span style={{ color: '#0ea5e9' }}>→</span>
            </div>
          </Link>
        </aside>
      </div>

      <style jsx global>{`
        .parties-layout { display: flex; gap: 32px; max-width: 1200px; margin: 0 auto; }
        .parties-main { flex: 1; min-width: 0; padding-bottom: 100px; }
        .parties-sidebar { width: 300px; flex-shrink: 0; display: none; }
        .matches-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .ideas-box-mobile { display: block; }
        @media (min-width: 768px) { .matches-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) {
          .parties-sidebar { display: block; }
          .parties-main { padding-bottom: 32px; }
          .ideas-box-mobile { display: none; }
        }
        @media (min-width: 1280px) { .parties-sidebar { width: 320px; } }
      `}</style>
    </>
  )
}