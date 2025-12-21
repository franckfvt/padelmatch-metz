'use client'

/**
 * ============================================
 * MES PARTIES - NOUVEAU DESIGN
 * ============================================
 * 
 * BRANDING: Plateforme sobre + Joueurs colorés
 * - Interface: gris, blanc, bordures légères
 * - Avatars joueurs: couleurs vives
 * - CTA principal: vert
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function MesPartiesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [historyFilter, setHistoryFilter] = useState('all')
  
  // Modal invitation
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [copied, setCopied] = useState(false)
  const [searchPlayer, setSearchPlayer] = useState('')
  const [searchResults, setSearchResults] = useState([])
  
  // Data
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [pastMatches, setPastMatches] = useState([])
  const [frequentPartners, setFrequentPartners] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    streak: 0
  })

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente' },
    mix: { emoji: '⚡', label: 'Équilibré' },
    compet: { emoji: '🏆', label: 'Compétitif' }
  }

  // Couleurs vives pour les avatars joueurs
  const playerColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

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

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]

    // === PARTIES À VENIR ===
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
      .select('match_id, team')
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
      
      partMatches = (partData || []).map(m => ({
        ...m,
        myTeam: participations.find(p => p.match_id === m.id)?.team
      }))
    }

    // Fusionner et dédupliquer
    const allUpcoming = [...(orgMatches || []), ...partMatches]
    const uniqueUpcoming = allUpcoming.reduce((acc, match) => {
      if (!acc.find(m => m.id === match.id)) {
        acc.push({
          ...match,
          isOrganizer: match.organizer_id === session.user.id
        })
      }
      return acc
    }, [])

    uniqueUpcoming.sort((a, b) => {
      if (!a.match_date && !b.match_date) return 0
      if (!a.match_date) return 1
      if (!b.match_date) return -1
      return new Date(a.match_date) - new Date(b.match_date)
    })

    setUpcomingMatches(uniqueUpcoming)

    // === HISTORIQUE ===
    const { data: pastParticipations } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        team,
        matches (
          id, match_date, match_time, status, winner,
          score_set1_a, score_set1_b, score_set2_a, score_set2_b, score_set3_a, score_set3_b,
          clubs (name),
          profiles!matches_organizer_id_fkey (id, name),
          match_participants (
            user_id, team, status,
            profiles!match_participants_user_id_fkey (id, name, avatar_url)
          )
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)
      .order('matches(match_date)', { ascending: false })
      .limit(50)

    const pastWithResults = (pastParticipations || [])
      .filter(p => p.matches)
      .map(p => {
        const match = p.matches
        const myTeam = p.team
        const allParticipants = match.match_participants || []
        
        // Séparer coéquipiers et adversaires
        const teammates = allParticipants
          .filter(mp => mp.team === myTeam && mp.user_id !== session.user.id && mp.profiles)
          .map(mp => mp.profiles)
        
        const opponents = allParticipants
          .filter(mp => mp.team !== myTeam && mp.profiles)
          .map(mp => mp.profiles)

        return {
          ...match,
          myTeam,
          won: match.winner === myTeam,
          lost: match.winner && match.winner !== myTeam,
          teammates,
          opponents
        }
      })

    setPastMatches(pastWithResults)

    // === STATS ===
    const wins = pastWithResults.filter(m => m.won).length
    const losses = pastWithResults.filter(m => m.lost).length
    const total = pastWithResults.length

    // Calculer la série actuelle
    let streak = 0
    for (const match of pastWithResults) {
      if (match.won) streak++
      else break
    }

    setStats({
      total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      streak
    })

    // === PARTENAIRES FRÉQUENTS ===
    const partnerStats = {}
    pastWithResults.forEach(match => {
      match.teammates.forEach(teammate => {
        if (!partnerStats[teammate.id]) {
          partnerStats[teammate.id] = {
            id: teammate.id,
            name: teammate.name,
            avatar_url: teammate.avatar_url,
            matches: 0,
            wins: 0
          }
        }
        partnerStats[teammate.id].matches++
        if (match.won) partnerStats[teammate.id].wins++
      })
    })

    const sortedPartners = Object.values(partnerStats)
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 10)

    setFrequentPartners(sortedPartners)

    setLoading(false)
  }

  // === HELPERS ===

  function formatDate(dateStr, flexibleDay = null) {
    if (!dateStr) {
      return flexibleDay || 'Flexible'
    }
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(timeStr, flexiblePeriod = null) {
    if (timeStr) return timeStr.slice(0, 5)
    if (flexiblePeriod) {
      const periods = { matin: 'Matin', aprem: 'Après-midi', soir: 'Soir' }
      return periods[flexiblePeriod] || flexiblePeriod
    }
    return 'Horaire flexible'
  }

  function formatFullDate(dateStr) {
    if (!dateStr) return 'Date flexible'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  function getMatchPlayers(match) {
    const players = []
    
    // Organisateur
    if (match.profiles) {
      players.push({
        id: match.organizer_id,
        name: match.profiles.name,
        avatar_url: match.profiles.avatar_url,
        isMe: match.organizer_id === user?.id,
        isOrganizer: true
      })
    }
    
    // Participants confirmés
    const confirmed = (match.match_participants || [])
      .filter(p => p.status === 'confirmed' && p.profiles)
      .map(p => ({
        id: p.user_id,
        name: p.profiles.name,
        avatar_url: p.profiles.avatar_url,
        isMe: p.user_id === user?.id
      }))
    
    players.push(...confirmed)
    
    while (players.length < 4) {
      players.push(null)
    }
    
    return players.slice(0, 4)
  }

  function getScore(match) {
    const sets = []
    if (match.score_set1_a !== null) sets.push(`${match.score_set1_a}-${match.score_set1_b}`)
    if (match.score_set2_a !== null) sets.push(`${match.score_set2_a}-${match.score_set2_b}`)
    if (match.score_set3_a !== null) sets.push(`${match.score_set3_a}-${match.score_set3_b}`)
    return sets.join(' / ') || null
  }

  // === INVITE MODAL ===

  function openInviteModal(match) {
    setSelectedMatch(match)
    setShowInviteModal(true)
    setCopied(false)
    setSearchPlayer('')
    setSearchResults([])
  }

  async function copyLink() {
    const url = `${window.location.origin}/join/${selectedMatch.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const url = `${window.location.origin}/join/${selectedMatch.id}`
    const text = `🎾 Partie de padel !\n📍 ${selectedMatch.clubs?.name || 'Lieu à définir'}\n📅 ${formatDate(selectedMatch.match_date)} à ${formatTime(selectedMatch.match_time)}\n\nRejoins-nous : ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareSMS() {
    const url = `${window.location.origin}/join/${selectedMatch.id}`
    const text = `Partie de padel ${formatDate(selectedMatch.match_date)} à ${formatTime(selectedMatch.match_time)} - ${selectedMatch.clubs?.name || 'Lieu à définir'}. Rejoins-nous : ${url}`
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
  }

  function shareEmail() {
    const url = `${window.location.origin}/join/${selectedMatch.id}`
    const subject = `Partie de padel - ${formatDate(selectedMatch.match_date)}`
    const body = `Salut !\n\nJe t'invite à une partie de padel :\n\n📍 ${selectedMatch.clubs?.name || 'Lieu à définir'}\n📅 ${formatFullDate(selectedMatch.match_date)}\n⏰ ${formatTime(selectedMatch.match_time)}\n\nRejoins-nous ici : ${url}\n\nÀ bientôt sur le terrain ! 🎾`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  async function searchPlayers(query) {
    setSearchPlayer(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level')
      .ilike('name', `%${query}%`)
      .neq('id', user?.id)
      .limit(5)

    setSearchResults(data || [])
  }

  // === AVATAR COMPONENT ===

  function PlayerAvatar({ player, index, size = 32 }) {
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

    const bgColor = player.isMe ? '#1a1a2e' : playerColors[index % playerColors.length]
    
    if (player.avatar_url) {
      return (
        <img
          src={player.avatar_url}
          alt={player.name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: player.isMe ? '2px solid #22c55e' : '2px solid #fff',
            marginLeft: index > 0 ? -6 : 0,
            objectFit: 'cover',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      )
    }
    
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bgColor,
        border: player.isMe ? '2px solid #22c55e' : '2px solid #fff',
        marginLeft: index > 0 ? -6 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        color: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {player.name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  // === LOADING ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  const filteredHistory = pastMatches.filter(m => 
    historyFilter === 'all' || 
    (historyFilter === 'win' && m.won) || 
    (historyFilter === 'loss' && m.lost)
  )

  return (
    <div>
      {/* ============================================ */}
      {/* HEADER                                      */}
      {/* ============================================ */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <Link href="/dashboard/explore" style={{ 
            color: '#64748b', 
            textDecoration: 'none', 
            fontSize: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 8
          }}>
            ← Explorer
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            Mes parties
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            {upcomingMatches.length} à venir · {stats.total} jouées
          </p>
        </div>
        <Link
          href="/dashboard/matches/create"
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
            textDecoration: 'none'
          }}
        >
          + Créer une partie
        </Link>
      </div>

      {/* ============================================ */}
      {/* MINI STATS                                  */}
      {/* ============================================ */}
      <div className="stats-mini-grid" style={{
        display: 'grid',
        gap: 12,
        marginBottom: 24
      }}>
        {[
          { value: stats.total, label: 'Jouées' },
          { value: stats.wins, label: 'Victoires' },
          { value: `${stats.winRate}%`, label: 'Win rate' },
          { value: stats.streak > 0 ? `🔥 ${stats.streak}` : '-', label: 'Série' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 12px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#475569' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* TABS                                        */}
      {/* ============================================ */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        borderBottom: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'upcoming', label: 'À venir', count: upcomingMatches.length },
          { id: 'history', label: 'Historique', count: pastMatches.length },
          { id: 'partners', label: 'Partenaires', count: frequentPartners.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a1a2e' : '#94a3b8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a2e' : '2px solid transparent',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.id ? '#1a1a2e' : '#f1f5f9',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* TAB: À VENIR                                */}
      {/* ============================================ */}
      {activeTab === 'upcoming' && (
        <div className="matches-grid">
          {upcomingMatches.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 48,
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
                Aucune partie prévue
              </h3>
              <p style={{ color: '#64748b', marginBottom: 20 }}>
                Crée ou rejoins une partie !
              </p>
              <Link
                href="/dashboard/matches/create"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Créer une partie
              </Link>
            </div>
          ) : (
            upcomingMatches.map(match => {
              const players = getMatchPlayers(match)
              const emptySpots = players.filter(p => !p).length
              const ambiance = ambianceConfig[match.ambiance] || ambianceConfig.mix
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / 4) : null
              
              return (
                <div
                  key={match.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                          {formatDate(match.match_date, match.flexible_day)}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <span style={{ fontSize: 14, color: '#64748b' }}>
                          {formatTime(match.match_time, match.flexible_period)}
                        </span>
                        {match.isOrganizer && (
                          <span style={{ 
                            background: '#fef3c7', 
                            color: '#92400e',
                            padding: '2px 8px', 
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600
                          }}>
                            👑 Organisateur
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                        {match.clubs?.name || match.city || 'Lieu à définir'}
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                        {ambiance.emoji} {ambiance.label} · ⭐ Niv. {match.level_min}-{match.level_max}
                        {pricePerPerson > 0 && <span> · {pricePerPerson}€/pers</span>}
                      </div>
                    </div>
                    
                    <div style={{
                      background: emptySpots > 0 ? '#f8fafc' : '#f0fdf4',
                      padding: '8px 12px',
                      borderRadius: 8,
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{ 
                        fontSize: 18, 
                        fontWeight: 700, 
                        color: emptySpots > 0 ? '#475569' : '#22c55e' 
                      }}>
                        {emptySpots > 0 ? emptySpots : '✓'}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {emptySpots > 0 ? `place${emptySpots > 1 ? 's' : ''}` : 'Complet'}
                      </div>
                    </div>
                  </div>

                  {/* Joueurs */}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>Joueurs</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {players.map((player, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <PlayerAvatar player={player} index={i} size={40} />
                          <div style={{ 
                            fontSize: 11, 
                            color: player?.isMe ? '#1a1a2e' : '#64748b',
                            marginTop: 6,
                            fontWeight: player?.isMe ? 600 : 400,
                            maxWidth: 50,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {player?.isMe ? 'Moi' : player?.name || 'Libre'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ 
                    padding: '12px 20px', 
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    gap: 8
                  }}>
                    <button 
                      onClick={() => openInviteModal(match)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#1a1a2e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      📤 Inviter des joueurs
                    </button>
                    <Link href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '10px 16px',
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        Voir →
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: HISTORIQUE                             */}
      {/* ============================================ */}
      {activeTab === 'history' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'win', label: 'Victoires' },
              { id: 'loss', label: 'Défaites' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: historyFilter === f.id ? '#1a1a2e' : '#fff',
                  color: historyFilter === f.id ? '#fff' : '#64748b',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          {filteredHistory.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 48,
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
                Pas encore d'historique
              </h3>
              <p style={{ color: '#64748b' }}>
                Tes parties passées apparaîtront ici
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredHistory.map(match => {
                const score = getScore(match)
                
                return (
                  <Link 
                    href={`/dashboard/match/${match.id}`}
                    key={match.id}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      cursor: 'pointer'
                    }}>
                      {/* Indicateur résultat */}
                      <div style={{
                        width: 4,
                        height: 48,
                        borderRadius: 2,
                        background: match.won ? '#22c55e' : match.lost ? '#ef4444' : '#94a3b8',
                        flexShrink: 0
                      }} />

                      {/* Infos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
                              {match.clubs?.name || 'Partie'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(match.match_date).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {score && (
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                                {score}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: 11, 
                              color: match.won ? '#22c55e' : match.lost ? '#ef4444' : '#94a3b8',
                              fontWeight: 500
                            }}>
                              {match.won ? 'Victoire' : match.lost ? 'Défaite' : 'En attente'}
                            </div>
                          </div>
                        </div>

                        {/* Équipes */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Mon équipe */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#1a1a2e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#fff'
                            }}>
                              {profile?.name?.[0] || 'M'}
                            </div>
                            {match.teammates.map((p, i) => (
                              <div key={i} style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: playerColors[i % playerColors.length],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#fff',
                                marginLeft: -4,
                                border: '2px solid #fff'
                              }}>
                                {p.name?.[0] || '?'}
                              </div>
                            ))}
                          </div>

                          <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>vs</span>

                          {/* Adversaires */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {match.opponents.map((p, i) => (
                              <div key={i} style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#fff',
                                marginLeft: i > 0 ? -4 : 0,
                                border: '2px solid #fff'
                              }}>
                                {p.name?.[0] || '?'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: PARTENAIRES                            */}
      {/* ============================================ */}
      {activeTab === 'partners' && (
        <div>
          {frequentPartners.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 48,
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
                Pas encore de partenaires
              </h3>
              <p style={{ color: '#64748b' }}>
                Joue des parties pour voir tes partenaires fréquents
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
                Tes partenaires les plus fréquents
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {frequentPartners.map((partner, i) => (
                  <Link 
                    href={`/player/${partner.id}`}
                    key={partner.id}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      cursor: 'pointer'
                    }}>
                      {/* Rang */}
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2f' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff'
                      }}>
                        {i + 1}
                      </div>

                      {/* Avatar */}
                      {partner.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partner.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: playerColors[i % playerColors.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#fff'
                        }}>
                          {partner.name?.[0] || '?'}
                        </div>
                      )}

                      {/* Infos */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
                          {partner.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {partner.matches} partie{partner.matches > 1 ? 's' : ''} ensemble
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                          {Math.round((partner.wins / partner.matches) * 100)}%
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          {partner.wins}V / {partner.matches - partner.wins}D
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL INVITER                               */}
      {/* ============================================ */}
      {showInviteModal && selectedMatch && (
        <div 
          key={`invite-modal-${selectedMatch.id}`}
          style={{
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
        }}
        onClick={() => setShowInviteModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 400,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div style={{
              padding: '20px 20px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Inviter des joueurs
              </h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Carte de match */}
            <div style={{ padding: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #334155 100%)',
                borderRadius: 16,
                padding: 20,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Déco */}
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '50%'
                }} />

                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                    {formatFullDate(selectedMatch.match_date)}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                    {formatTime(selectedMatch.match_time, selectedMatch.flexible_period)}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    {selectedMatch.clubs?.name || selectedMatch.city || 'Lieu à définir'}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13
                    }}>
                      {ambianceConfig[selectedMatch.ambiance]?.emoji} {ambianceConfig[selectedMatch.ambiance]?.label}
                    </span>
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13
                    }}>
                      ⭐ Niv. {selectedMatch.level_min}-{selectedMatch.level_max}
                    </span>
                  </div>

                  {/* Joueurs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getMatchPlayers(selectedMatch).map((player, i) => (
                      <div key={i} style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: player ? playerColors[i % playerColors.length] : 'rgba(255,255,255,0.1)',
                        border: player ? 'none' : '2px dashed rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600
                      }}>
                        {player ? player.name?.[0] : '?'}
                      </div>
                    ))}
                    <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 8 }}>
                      {4 - getMatchPlayers(selectedMatch).filter(p => p).length} place(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lien */}
            <div style={{ padding: '0 20px 20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                Lien de la partie
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  fontSize: 13,
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/join/${selectedMatch.id}` : '...'}
                </div>
                <button 
                  onClick={copyLink}
                  style={{
                    padding: '12px 16px',
                    background: copied ? '#22c55e' : '#1a1a2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s'
                  }}
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Boutons partage */}
            <div style={{ padding: '0 20px 20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
                Partager via
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <button onClick={shareWhatsApp} style={{
                  padding: '16px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 24 }}>💬</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>WhatsApp</span>
                </button>
                <button onClick={shareSMS} style={{
                  padding: '16px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 24 }}>✉️</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>SMS</span>
                </button>
                <button onClick={shareEmail} style={{
                  padding: '16px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 24 }}>📧</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Email</span>
                </button>
                <button style={{
                  padding: '16px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 24 }}>📱</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>QR Code</span>
                </button>
              </div>
            </div>

            {/* Recherche joueur */}
            <div style={{ 
              padding: '16px 20px 20px', 
              borderTop: '1px solid #f1f5f9'
            }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
                Inviter un joueur de l'app
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text"
                  placeholder="Rechercher un joueur..."
                  value={searchPlayer}
                  onChange={(e) => searchPlayers(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Résultats recherche */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map((player, i) => (
                    <div key={player.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 8
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: playerColors[i % playerColors.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff'
                      }}>
                        {player.name?.[0] || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>Niveau {player.level}</div>
                      </div>
                      <button style={{
                        padding: '6px 12px',
                        background: '#1a1a2e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        Inviter
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        .stats-mini-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .matches-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .partners-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        /* Tablet - 768px */
        @media (min-width: 768px) {
          .stats-mini-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .partners-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Desktop - 1024px */
        @media (min-width: 1024px) {
          .matches-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .partners-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  )
}