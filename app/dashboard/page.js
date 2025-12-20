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

  return (
    <div>
      
      {/* ============================================ */}
      {/* HEADER DE BIENVENUE                         */}
      {/* ============================================ */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Bonjour {profile?.name?.split(' ')[0] || 'Joueur'} 👋
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 15 }}>
          Prêt pour ta prochaine partie ?
        </p>
      </div>

      {/* ============================================ */}
      {/* BOUTON CRÉER UNE PARTIE                     */}
      {/* ============================================ */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          width: '100%',
          padding: 16,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 28,
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(34, 197, 94, 0.4)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.3)'
        }}
      >
        <span style={{ fontSize: 20 }}>+</span>
        Créer une partie
      </button>

      {/* ============================================ */}
      {/* MES PARTIES                                 */}
      {/* ============================================ */}
      {myMatches.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
              🎾 Mes parties
            </h2>
            <Link 
              href="/dashboard/matches" 
              style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
            >
              Tout voir →
            </Link>
          </div>

          {/* Cards horizontales scrollables */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            overflowX: 'auto', 
            paddingBottom: 8,
            margin: '0 -16px',
            padding: '0 16px 8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {myMatches.slice(0, 5).map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const players = getMatchPlayers(match)
              const spots = getSpotsInfo(players)
              const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix
              
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  <div style={{
                    width: 280,
                    background: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
                  }}
                  >
                    {/* Header coloré */}
                    <div style={{
                      background: isOrganizer 
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      padding: '12px 16px',
                      color: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                          {formatDate(match.match_date, match.flexible_day)}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>
                          {formatTime(match.match_time, match.flexible_period) || 'Horaire flexible'}
                        </div>
                      </div>
                      {isOrganizer && (
                        <span style={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          padding: '4px 10px', 
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          👑 Orga
                        </span>
                      )}
                    </div>

                    {/* Contenu */}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1a1a2e' }}>
                        {match.clubs?.name || match.city || 'Lieu à définir'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                        {ambiance.emoji} {ambiance.label} · ⭐ Niv. {match.level_min}-{match.level_max}
                      </div>

                      {/* Joueurs - Avatars */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex' }}>
                          {players.map((player, i) => (
                            <PlayerAvatar key={i} player={player} index={i} size={32} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, color: spots.color, fontWeight: 500 }}>
                          {spots.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* PARTIES DISPONIBLES                         */}
      {/* ============================================ */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            📍 Près de {userCity}
          </h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              background: showFilters ? '#1a1a2e' : '#fff', 
              color: showFilters ? '#fff' : '#475569',
              border: '1px solid #e2e8f0',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
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
            {filteredMatches.map(match => {
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
        {filteredMatches.length > 0 && (
          <Link href="/dashboard/matches" style={{ textDecoration: 'none' }}>
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
              Voir plus de parties
            </button>
          </Link>
        )}
      </section>

      {/* ============================================ */}
      {/* BOÎTE À IDÉES                               */}
      {/* ============================================ */}
      <section>
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
      </section>

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

      {/* Hide scrollbar */}
      <style jsx global>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}