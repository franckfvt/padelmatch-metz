'use client'

/**
 * ============================================
 * PAGE PARTIES - 2×2 BRAND V2
 * ============================================
 * 
 * Design épuré et vivant :
 * - Cards avec bordure gauche colorée (ambiance)
 * - Avatars carrés arrondis en ligne
 * - Bandeau actions en attente (amber)
 * - Historique en grille compacte
 * - Mobile-first
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e6',
  p3Soft: '#e6f9f7',
  p4Soft: '#f3f0ff',
  
  // Interface
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  card: '#ffffff',
  
  // Borders
  border: '#e5e7eb',
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// Couleur ambiance pour bordure
const AMBIANCE_COLORS = {
  loisir: COLORS.p3,    // Teal - Détente
  mix: COLORS.p2,       // Amber - Équilibré
  compet: COLORS.p1,    // Coral - Compétitif
}

const AMBIANCE_EMOJI = {
  loisir: '😌',
  mix: '⚡',
  compet: '🔥',
}

export default function PartiesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [myUpcomingMatches, setMyUpcomingMatches] = useState([])
  const [pastMatches, setPastMatches] = useState([])
  
  const [pendingActions, setPendingActions] = useState({
    invitesForMe: [],
    requestsToReview: [],
    invitesToFollow: []
  })

  useEffect(() => { loadData() }, [])

  // === LOGIQUE DATA ===
  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id
    const today = new Date().toISOString().split('T')[0]

    // Charger profil et matchs
    const [profileResult, orgMatchesResult, partMatchesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('matches')
        .select(`*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url))`)
        .eq('organizer_id', userId).gte('match_date', today).order('match_date', { ascending: true }),
      supabase.from('match_participants')
        .select(`match_id, status, matches!inner (*, clubs (name, city), profiles!matches_organizer_id_fkey (id, name, avatar_url), match_participants (id, user_id, team, status, profiles!match_participants_user_id_fkey (id, name, avatar_url)))`)
        .eq('user_id', userId).eq('status', 'confirmed').gte('matches.match_date', today)
    ])

    setProfile(profileResult.data)

    // Combiner matchs organisés et participations
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
    
    // Charger actions en attente
    await loadPendingActions(userId)
    
    // Charger historique
    await loadPastMatches(userId, today)
    
    setLoading(false)
  }

  async function loadPendingActions(userId) {
    // Invitations reçues (où je suis invité)
    const { data: myInvites } = await supabase
      .from('match_participants')
      .select(`*, matches!inner (id, match_date, match_time, ambiance, clubs (name)), profiles!matches_organizer_id_fkey:matches!inner(profiles!matches_organizer_id_fkey(id, name))`)
      .eq('user_id', userId)
      .eq('status', 'pending')

    // Demandes à valider (sur mes matchs)
    const { data: myMatches } = await supabase
      .from('matches')
      .select('id')
      .eq('organizer_id', userId)

    const matchIds = (myMatches || []).map(m => m.id)
    
    let requestsToReview = []
    if (matchIds.length > 0) {
      const { data: pendingRequests } = await supabase
        .from('match_participants')
        .select(`*, matches!inner (id, match_date, match_time, clubs (name)), profiles!match_participants_user_id_fkey (id, name, level)`)
        .in('match_id', matchIds)
        .eq('status', 'pending')
        .neq('user_id', userId)
      
      requestsToReview = pendingRequests || []
    }

    setPendingActions({
      invitesForMe: myInvites || [],
      requestsToReview,
      invitesToFollow: []
    })
  }

  async function loadPastMatches(userId, today) {
    const { data } = await supabase
      .from('match_participants')
      .select(`match_id, team, matches!inner (id, match_date, match_time, winner, ambiance, clubs (name), match_participants (user_id, team, profiles!match_participants_user_id_fkey (id, name)))`)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)
      .order('matches(match_date)', { ascending: false })
      .limit(10)

    const matches = (data || []).map(p => ({
      ...p.matches,
      myTeam: p.team
    }))
    
    // Dédupliquer
    const seen = new Set()
    const unique = matches.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    
    setPastMatches(unique)
  }

  // === ACTIONS ===
  async function acceptInvite(invite) {
    await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', invite.id)
    loadData()
  }

  async function declineInvite(invite) {
    await supabase.from('match_participants').delete().eq('id', invite.id)
    loadData()
  }

  async function acceptRequest(req) {
    await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', req.id)
    loadData()
  }

  async function refuseRequest(req) {
    await supabase.from('match_participants').delete().eq('id', req.id)
    loadData()
  }

  // === HELPERS ===
  function formatDateShort(dateStr) {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Auj."
    if (date.toDateString() === tomorrow.toDateString()) return 'Dem.'
    
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
    return days[date.getDay()] + ' ' + date.getDate()
  }

  function formatDateCompact(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  function formatTime(timeStr) { 
    return timeStr ? timeStr.slice(0, 5) : '' 
  }
  
  function getMatchLocation(match) { 
    return match.clubs?.name || match.city || 'Lieu à définir' 
  }

  function getMatchPlayers(match) {
    const players = []
    if (match.profiles) {
      players.push({ id: match.organizer_id, name: match.profiles.name })
    }
    ;(match.match_participants || []).forEach(p => { 
      if (p.user_id !== match.organizer_id && p.profiles && p.status === 'confirmed') {
        players.push({ id: p.user_id, name: p.profiles.name }) 
      }
    })
    return players
  }

  function getWinStatus(match) {
    if (!match.winner || !match.myTeam) return null
    return match.winner === match.myTeam ? 'win' : 'loss'
  }

  function getTotalPending() {
    return pendingActions.invitesForMe.length + pendingActions.requestsToReview.length
  }

  // === COMPOSANTS ===
  
  // Avatar carré arrondi simple
  function Avatar({ name, index = 0, size = 40 }) {
    const bgColor = PLAYER_COLORS[index % 4]
    const radius = Math.round(size * 0.28)
    
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.white,
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0
      }}>
        {name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  // Slot vide
  function EmptySlot({ size = 40 }) {
    const radius = Math.round(size * 0.28)
    
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: COLORS.bg,
        border: `2px dashed ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.muted,
        fontSize: size * 0.35,
        fontWeight: 600,
        flexShrink: 0
      }}>
        ?
      </div>
    )
  }

  // 4 Dots logo
  function FourDots({ size = 10 }) {
    return (
      <div style={{ display: 'flex', gap: size * 0.5 }}>
        {PLAYER_COLORS.map((c, i) => (
          <div key={i} style={{ 
            width: size, 
            height: size, 
            borderRadius: size * 0.3, 
            background: c 
          }} />
        ))}
      </div>
    )
  }

  // Card match principale
  function MatchCard({ match, isOrganizer = false }) {
    const players = getMatchPlayers(match)
    const spotsLeft = 4 - players.length
    const ambiance = match.ambiance || 'mix'
    const borderColor = AMBIANCE_COLORS[ambiance] || COLORS.p2
    
    return (
      <Link href={`/dashboard/match/${match.id}`} className="match-card-link">
        <div className="match-card" style={{ borderLeftColor: borderColor }}>
          {/* Header */}
          <div className="match-header">
            <div className="match-date-block">
              <span className="match-day">{formatDateShort(match.match_date)}</span>
              <span className="match-time">{formatTime(match.match_time)}</span>
            </div>
            <span className="match-ambiance">{AMBIANCE_EMOJI[ambiance]}</span>
          </div>
          
          {/* Location */}
          <div className="match-location">
            📍 {getMatchLocation(match)}
          </div>
          
          {/* Avatars row */}
          <div className="match-players">
            {[0, 1, 2, 3].map(idx => (
              players[idx] 
                ? <Avatar key={idx} name={players[idx].name} index={idx} size={44} />
                : <EmptySlot key={idx} size={44} />
            ))}
          </div>
          
          {/* Footer */}
          <div className="match-footer">
            {isOrganizer && <span className="match-badge badge-orga">👑 Orga</span>}
            <span className={`match-status ${spotsLeft === 0 ? 'complete' : ''}`}>
              {spotsLeft === 0 ? '✓ Complet' : `${4 - spotsLeft}/4 joueurs`}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Card historique compacte
  function HistoryCard({ match }) {
    const players = getMatchPlayers(match)
    const winStatus = getWinStatus(match)
    
    return (
      <Link href={`/dashboard/match/${match.id}`} className="history-card-link">
        <div className="history-card">
          <div className="history-date">{formatDateCompact(match.match_date)}</div>
          <div className="history-dots">
            {[0, 1, 2, 3].map(idx => (
              <div 
                key={idx} 
                className="history-dot" 
                style={{ background: players[idx] ? PLAYER_COLORS[idx] : COLORS.border }}
              />
            ))}
          </div>
          {winStatus && (
            <div className={`history-result ${winStatus}`}>
              {winStatus === 'win' ? 'Victoire' : 'Défaite'}
            </div>
          )}
        </div>
      </Link>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-dots">
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <style jsx>{`
          .loading-page {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-dots {
            display: flex;
            gap: 10px;
          }
          .loading-dot {
            width: 14px;
            height: 14px;
            border-radius: 5px;
            animation: bounce 1.4s ease-in-out infinite;
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    )
  }

  // === RENDER ===
  return (
    <div className="parties-page">
      
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 className="page-title">Parties</h1>
          <FourDots size={10} />
        </div>
        <Link href="/dashboard/matches/create" className="btn-create">
          + Créer
        </Link>
      </header>

      {/* Section: Prochaines parties */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Prochaines</h2>
          {myUpcomingMatches.length > 0 && (
            <span className="section-count">{myUpcomingMatches.length}</span>
          )}
        </div>

        {/* Bandeau actions en attente */}
        {getTotalPending() > 0 && (
          <div className="pending-banner">
            <div className="pending-header">
              <span className="pending-icon">🔔</span>
              <span className="pending-title">{getTotalPending()} en attente</span>
            </div>
            
            {/* Invitations reçues */}
            {pendingActions.invitesForMe.map(invite => (
              <div key={invite.id} className="pending-item">
                <div className="pending-info">
                  <span className="pending-name">
                    {invite.matches?.profiles?.name || 'Quelqu\'un'} t'invite
                  </span>
                  <span className="pending-detail">
                    {formatDateShort(invite.matches?.match_date)} • {invite.matches?.clubs?.name}
                  </span>
                </div>
                <div className="pending-actions">
                  <button onClick={() => declineInvite(invite)} className="btn-decline">✕</button>
                  <button onClick={() => acceptInvite(invite)} className="btn-accept">✓</button>
                </div>
              </div>
            ))}
            
            {/* Demandes à valider */}
            {pendingActions.requestsToReview.map(req => (
              <div key={req.id} className="pending-item">
                <div className="pending-info">
                  <span className="pending-name">
                    {req.profiles?.name} veut rejoindre
                  </span>
                  <span className="pending-detail">
                    {formatDateShort(req.matches?.match_date)} • {req.matches?.clubs?.name}
                  </span>
                </div>
                <div className="pending-actions">
                  <button onClick={() => refuseRequest(req)} className="btn-decline">✕</button>
                  <button onClick={() => acceptRequest(req)} className="btn-accept">✓</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des matchs */}
        {myUpcomingMatches.length === 0 ? (
          <div className="empty-state">
            <FourDots size={16} />
            <p className="empty-text">Aucune partie prévue</p>
            <Link href="/dashboard/matches/create" className="btn-empty">
              Créer une partie
            </Link>
          </div>
        ) : (
          <div className="matches-list">
            {myUpcomingMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isOrganizer={match.organizer_id === user?.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Séparateur */}
      {pastMatches.length > 0 && <div className="separator" />}

      {/* Section: Historique */}
      {pastMatches.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Historique</h2>
            <Link href="/dashboard/history" className="section-link">Voir tout →</Link>
          </div>
          
          <div className="history-grid">
            {pastMatches.slice(0, 6).map(match => (
              <HistoryCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* === STYLES === */}
      <style jsx>{`
        .parties-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
          padding-bottom: 100px;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          color: ${COLORS.ink};
          margin: 0;
          letter-spacing: -0.5px;
        }

        .btn-create {
          padding: 12px 20px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        /* Sections */
        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-count {
          background: ${COLORS.bg};
          color: ${COLORS.gray};
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
        }

        .section-link {
          font-size: 14px;
          color: ${COLORS.gray};
          text-decoration: none;
          font-weight: 500;
        }

        .section-link:hover {
          color: ${COLORS.ink};
        }

        /* Pending banner */
        .pending-banner {
          background: ${COLORS.p2Soft};
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid ${COLORS.p2}30;
        }

        .pending-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .pending-icon {
          font-size: 16px;
        }

        .pending-title {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.ink};
        }

        .pending-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${COLORS.white};
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .pending-item:last-child {
          margin-bottom: 0;
        }

        .pending-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pending-name {
          font-size: 14px;
          font-weight: 600;
          color: ${COLORS.ink};
        }

        .pending-detail {
          font-size: 12px;
          color: ${COLORS.gray};
        }

        .pending-actions {
          display: flex;
          gap: 8px;
        }

        .btn-decline, .btn-accept {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-decline {
          background: ${COLORS.bg};
          color: ${COLORS.gray};
        }

        .btn-accept {
          background: ${COLORS.p3};
          color: ${COLORS.white};
        }

        .btn-decline:hover, .btn-accept:hover {
          transform: scale(1.05);
        }

        /* Match cards */
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        :global(.match-card-link) {
          text-decoration: none;
          display: block;
        }

        :global(.match-card) {
          background: ${COLORS.card};
          border-radius: 16px;
          padding: 16px;
          border-left: 4px solid ${COLORS.p2};
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        :global(.match-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        :global(.match-header) {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        :global(.match-date-block) {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        :global(.match-day) {
          font-size: 15px;
          font-weight: 700;
          color: ${COLORS.ink};
        }

        :global(.match-time) {
          font-size: 15px;
          font-weight: 600;
          color: ${COLORS.gray};
        }

        :global(.match-ambiance) {
          font-size: 18px;
        }

        :global(.match-location) {
          font-size: 14px;
          color: ${COLORS.gray};
          margin-bottom: 14px;
        }

        :global(.match-players) {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }

        :global(.match-footer) {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        :global(.match-badge) {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 100px;
        }

        :global(.badge-orga) {
          background: ${COLORS.p4Soft};
          color: ${COLORS.p4};
        }

        :global(.match-status) {
          font-size: 13px;
          color: ${COLORS.gray};
          font-weight: 500;
        }

        :global(.match-status.complete) {
          color: ${COLORS.p3};
          font-weight: 600;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          background: ${COLORS.card};
          border-radius: 20px;
          border: 1px solid ${COLORS.border};
        }

        .empty-text {
          color: ${COLORS.gray};
          font-size: 15px;
          margin: 16px 0 20px;
        }

        .btn-empty {
          display: inline-block;
          padding: 12px 24px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        /* Separator */
        .separator {
          height: 1px;
          background: ${COLORS.border};
          margin: 32px 0;
        }

        /* History grid */
        .history-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        :global(.history-card-link) {
          text-decoration: none;
        }

        :global(.history-card) {
          background: ${COLORS.card};
          border-radius: 14px;
          padding: 14px;
          text-align: center;
          border: 1px solid ${COLORS.border};
          transition: transform 0.2s, box-shadow 0.2s;
        }

        :global(.history-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        :global(.history-date) {
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.ink};
          margin-bottom: 10px;
        }

        :global(.history-dots) {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-bottom: 10px;
        }

        :global(.history-dot) {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        :global(.history-result) {
          font-size: 12px;
          font-weight: 600;
        }

        :global(.history-result.win) {
          color: ${COLORS.p3};
        }

        :global(.history-result.loss) {
          color: ${COLORS.muted};
        }

        /* Responsive */
        @media (min-width: 768px) {
          .matches-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .history-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .matches-list {
            grid-template-columns: repeat(2, 1fr);
          }

          .history-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  )
}