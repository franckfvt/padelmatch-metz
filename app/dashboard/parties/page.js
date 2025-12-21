'use client'

/**
 * ============================================
 * PAGE PARTIES - Hub central des matchs
 * ============================================
 * 
 * 2 tabs:
 * - "Rejoindre" : Parties disponibles à rejoindre
 * - "Mes parties" : Parties où je suis inscrit/organisateur
 * 
 * Bouton [+ Créer] toujours visible
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
  
  // Navigation - initialiser avec le paramètre URL si présent
  const [activeTab, setActiveTab] = useState(tabParam === 'mes-parties' ? 'mes-parties' : 'rejoindre')
  const [subTab, setSubTab] = useState('upcoming') // Pour "Mes parties"
  
  // Filtres
  const [filterCity, setFilterCity] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [cities, setCities] = useState([])
  
  // Données
  const [availableMatches, setAvailableMatches] = useState([])
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [myPastMatches, setMyPastMatches] = useState([])

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

    // === PARTIES DISPONIBLES (à rejoindre) ===
    const { data: available } = await supabase
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
      .gt('spots_available', 0)
      .gte('match_date', today)
      .neq('organizer_id', session.user.id)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })
      .limit(30)

    // Filtrer celles où je ne suis pas déjà inscrit
    const filteredAvailable = (available || []).filter(match => {
      const isParticipant = match.match_participants?.some(p => p.user_id === session.user.id)
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

    // === MES PARTIES (organisateur ou participant) ===
    
    // Parties où je suis organisateur
    const { data: orgMatches } = await supabase
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
      .eq('organizer_id', session.user.id)
      .gte('match_date', today)
      .order('match_date', { ascending: true })

    // Parties où je suis participant (pas organisateur)
    const { data: partMatches } = await supabase
      .from('match_participants')
      .select(`
        match_id, status, team,
        matches!inner (
          *, 
          clubs (name, address, city),
          profiles!matches_organizer_id_fkey (id, name, avatar_url),
          match_participants (
            id, user_id, team, status,
            profiles!match_participants_user_id_fkey (id, name, avatar_url)
          )
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .gte('matches.match_date', today)

    // Combiner et dédupliquer
    const allUpcoming = [...(orgMatches || [])]
    const orgIds = new Set(allUpcoming.map(m => m.id))
    
    ;(partMatches || []).forEach(p => {
      if (p.matches && !orgIds.has(p.matches.id)) {
        allUpcoming.push({ ...p.matches, _isParticipant: true })
      }
    })

    // Trier par date
    allUpcoming.sort((a, b) => {
      const dateA = new Date(`${a.match_date}T${a.match_time || '00:00'}`)
      const dateB = new Date(`${b.match_date}T${b.match_time || '00:00'}`)
      return dateA - dateB
    })

    setMyUpcomingMatches(allUpcoming)

    // === PARTIES PASSÉES ===
    const { data: pastOrg } = await supabase
      .from('matches')
      .select(`*, clubs (name, city)`)
      .eq('organizer_id', session.user.id)
      .lt('match_date', today)
      .order('match_date', { ascending: false })
      .limit(10)

    const { data: pastPart } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        matches!inner (*, clubs (name, city))
      `)
      .eq('user_id', session.user.id)
      .lt('matches.match_date', today)
      .limit(10)

    const allPast = [...(pastOrg || [])]
    const pastOrgIds = new Set(allPast.map(m => m.id))
    ;(pastPart || []).forEach(p => {
      if (p.matches && !pastOrgIds.has(p.matches.id)) {
        allPast.push(p.matches)
      }
    })
    allPast.sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    setMyPastMatches(allPast.slice(0, 10))

    setLoading(false)
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
    
    // Organisateur
    if (match.profiles) {
      players.push({
        id: match.organizer_id,
        name: match.profiles.name,
        avatar_url: match.profiles.avatar_url,
        isOrganizer: true
      })
    }
    
    // Participants
    ;(match.match_participants || []).forEach(p => {
      if (p.user_id !== match.organizer_id && p.profiles) {
        players.push({
          id: p.user_id,
          name: p.profiles.name,
          avatar_url: p.profiles.avatar_url
        })
      }
    })
    
    return players
  }

  // Filtrer les parties disponibles
  const filteredAvailable = availableMatches.filter(match => {
    if (filterCity !== 'all') {
      const matchCity = match.clubs?.city || match.city
      if (matchCity?.toLowerCase() !== filterCity.toLowerCase()) return false
    }
    if (filterLevel === 'mine' && profile?.level) {
      if (match.level_min > profile.level + 2 || match.level_max < profile.level - 2) return false
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
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 100px' }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        background: COLORS.bg,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.text }}>
          🎾 Parties
        </h1>
        <Link
          href="/dashboard/matches/create"
          style={{
            padding: '12px 20px',
            background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
            color: '#fff',
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: SHADOWS.sm
          }}
        >
          + Créer
        </Link>
      </div>

      {/* Tabs principaux */}
      <div style={{
        display: 'flex',
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: 4,
        marginBottom: 20,
        border: `1px solid ${COLORS.border}`
      }}>
        {[
          { id: 'rejoindre', label: 'Rejoindre', count: filteredAvailable.length },
          { id: 'mes-parties', label: 'Mes parties', count: myUpcomingMatches.length }
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
      {/* TAB: REJOINDRE                              */}
      {/* ============================================ */}
      {activeTab === 'rejoindre' && (
        <>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              style={{
                padding: '10px 14px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.sm,
                fontSize: 14,
                background: COLORS.card,
                color: COLORS.text,
                cursor: 'pointer'
              }}
            >
              <option value="all">📍 Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              style={{
                padding: '10px 14px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.sm,
                fontSize: 14,
                background: COLORS.card,
                color: COLORS.text,
                cursor: 'pointer'
              }}
            >
              <option value="all">⭐ Tous niveaux</option>
              <option value="mine">Mon niveau (±2)</option>
            </select>
          </div>

          {/* Liste des parties disponibles */}
          {filteredAvailable.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: COLORS.card,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
                Aucune partie trouvée
              </h3>
              <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
                {filterCity !== 'all' ? `Pas de partie à ${filterCity} pour le moment` : 'Sois le premier à créer une partie !'}
              </p>
              <Link
                href="/dashboard/matches/create"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
                  color: '#fff',
                  borderRadius: RADIUS.md,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Créer une partie
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredAvailable.map(match => {
                const players = getMatchPlayers(match)
                const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                const spotsLeft = match.spots_available || (4 - players.length)
                
                return (
                  <div
                    key={match.id}
                    style={{
                      background: COLORS.card,
                      borderRadius: RADIUS.lg,
                      border: `1px solid ${COLORS.border}`,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>
                            {formatDate(match.match_date)} • {formatTime(match.match_time)}
                          </div>
                          <div style={{ fontSize: 14, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                            📍 {getMatchLocation(match)}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 10px',
                          background: `${ambiance.color}15`,
                          borderRadius: RADIUS.sm,
                          fontSize: 12,
                          fontWeight: 600,
                          color: ambiance.color
                        }}>
                          {ambiance.emoji} {ambiance.label}
                        </div>
                      </div>

                      {/* Infos */}
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
                        <span>👥 {spotsLeft} place{spotsLeft > 1 ? 's' : ''}</span>
                        <span>⭐ Niveau {match.level_min}-{match.level_max}</span>
                      </div>

                      {/* Joueurs */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        {players.slice(0, 4).map((player, idx) => (
                          <div
                            key={player.id}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#fff',
                              border: player.isOrganizer ? `2px solid ${COLORS.accent}` : '2px solid #fff',
                              overflow: 'hidden'
                            }}
                            title={player.name}
                          >
                            {player.avatar_url 
                              ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : player.name?.[0]?.toUpperCase()
                            }
                          </div>
                        ))}
                        {spotsLeft > 0 && Array(Math.min(spotsLeft, 4 - players.length)).fill(0).map((_, idx) => (
                          <div
                            key={`empty-${idx}`}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              border: `2px dashed ${COLORS.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              color: COLORS.border
                            }}
                          >
                            ?
                          </div>
                        ))}
                      </div>

                      {/* Organisateur */}
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                        Organisé par {match.profiles?.name || 'Anonyme'}
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ 
                      borderTop: `1px solid ${COLORS.border}`,
                      padding: 12,
                      display: 'flex',
                      gap: 10
                    }}>
                      <Link
                        href={`/join/${match.id}`}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
                          color: '#fff',
                          borderRadius: RADIUS.sm,
                          fontWeight: 600,
                          fontSize: 14,
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                      >
                        Rejoindre
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* TAB: MES PARTIES                            */}
      {/* ============================================ */}
      {activeTab === 'mes-parties' && (
        <>
          {/* Sous-tabs */}
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

          {/* Liste */}
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
                  Crée ou rejoins une partie !
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Link
                    href="/dashboard/matches/create"
                    style={{
                      padding: '12px 20px',
                      background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
                      color: '#fff',
                      borderRadius: RADIUS.md,
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Créer
                  </Link>
                  <button
                    onClick={() => setActiveTab('rejoindre')}
                    style={{
                      padding: '12px 20px',
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: RADIUS.md,
                      fontWeight: 600,
                      color: COLORS.text,
                      cursor: 'pointer'
                    }}
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myUpcomingMatches.map(match => {
                  const isOrganizer = match.organizer_id === user?.id
                  const players = getMatchPlayers(match)
                  const spotsLeft = match.spots_available || (4 - players.length)
                  const ambiance = AMBIANCE_CONFIG[match.ambiance] || AMBIANCE_CONFIG.mix
                  
                  return (
                    <div
                      key={match.id}
                      style={{
                        background: COLORS.card,
                        borderRadius: RADIUS.lg,
                        border: `1px solid ${COLORS.border}`,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: 16 }}>
                        {/* Badge organisateur */}
                        {isOrganizer && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            background: COLORS.accentLight,
                            borderRadius: RADIUS.sm,
                            fontSize: 11,
                            fontWeight: 700,
                            color: COLORS.accent,
                            marginBottom: 10
                          }}>
                            👑 Tu organises
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 4 }}>
                              {formatDate(match.match_date)} • {formatTime(match.match_time)}
                            </div>
                            <div style={{ fontSize: 14, color: COLORS.textMuted }}>
                              📍 {getMatchLocation(match)}
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 10px',
                            background: `${ambiance.color}15`,
                            borderRadius: RADIUS.sm,
                            fontSize: 12,
                            fontWeight: 600,
                            color: ambiance.color
                          }}>
                            {ambiance.emoji}
                          </div>
                        </div>

                        {/* Joueurs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {players.slice(0, 4).map(player => (
                            <div
                              key={player.id}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#fff',
                                border: player.id === user?.id ? `2px solid ${COLORS.accent}` : '2px solid #fff',
                                overflow: 'hidden'
                              }}
                              title={player.name}
                            >
                              {player.avatar_url 
                                ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : player.name?.[0]?.toUpperCase()
                              }
                            </div>
                          ))}
                          {spotsLeft > 0 && Array(Math.min(spotsLeft, 4 - players.length)).fill(0).map((_, idx) => (
                            <div
                              key={`empty-${idx}`}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: `2px dashed ${COLORS.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                                color: COLORS.border
                              }}
                            >
                              ?
                            </div>
                          ))}
                          {spotsLeft > 0 && (
                            <span style={{ fontSize: 13, color: COLORS.textMuted, marginLeft: 8 }}>
                              {spotsLeft} place{spotsLeft > 1 ? 's' : ''} dispo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ 
                        borderTop: `1px solid ${COLORS.border}`,
                        padding: 12,
                        display: 'flex',
                        gap: 10
                      }}>
                        <Link
                          href={`/dashboard/match/${match.id}`}
                          style={{
                            flex: 1,
                            padding: 10,
                            background: COLORS.bg,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: RADIUS.sm,
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: 'none',
                            textAlign: 'center',
                            color: COLORS.text
                          }}
                        >
                          Voir
                        </Link>
                        {isOrganizer && spotsLeft > 0 && (
                          <Link
                            href={`/dashboard/joueurs?invite=${match.id}`}
                            style={{
                              flex: 1,
                              padding: 10,
                              background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
                              color: '#fff',
                              borderRadius: RADIUS.sm,
                              fontWeight: 600,
                              fontSize: 13,
                              textDecoration: 'none',
                              textAlign: 'center'
                            }}
                          >
                            Inviter
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* Parties passées */}
          {subTab === 'past' && (
            myPastMatches.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 40,
                background: COLORS.card,
                borderRadius: RADIUS.lg,
                border: `1px solid ${COLORS.border}`
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                <p style={{ color: COLORS.textMuted }}>
                  Aucune partie passée
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myPastMatches.map(match => (
                  <Link
                    key={match.id}
                    href={`/dashboard/match/${match.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      background: COLORS.card,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${COLORS.border}`,
                      textDecoration: 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>
                        {formatDate(match.match_date)}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                        {match.clubs?.name || match.city || 'Lieu inconnu'}
                      </div>
                    </div>
                    <div style={{ fontSize: 20, color: COLORS.textMuted }}>→</div>
                  </Link>
                ))}
              </div>
            )
          )}
        </>
      )}

    </div>
  )
}