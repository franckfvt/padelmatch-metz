'use client'

/**
 * ============================================
 * PAGE PUBLIQUE REJOINDRE UN MATCH - JUNTO
 * ============================================
 * 
 * Page d'arrivée via lien partagé.
 * Style Junto avec équipes A/B.
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// === JUNTO DESIGN TOKENS ===
const JUNTO = {
  coral: '#ff5a5f',
  coralSoft: '#fff0f0',
  coralGlow: 'rgba(255, 90, 95, 0.25)',
  slate: '#3d4f5f',
  slateDark: '#2a3a48',
  amber: '#ffb400',
  amberSoft: '#fff8e5',
  teal: '#00b8a9',
  tealSoft: '#e5f9f7',
  tealGlow: '#4eeee0',
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  white: '#ffffff',
  bg: '#fafafa',
  border: '#e5e7eb',
  teamA: '#22c55e',
  teamABg: '#f0fdf4',
  teamB: '#3b82f6',
  teamBBg: '#eff6ff',
}

const AVATAR_COLORS = [JUNTO.coral, JUNTO.slate, JUNTO.amber, JUNTO.teal]

const AMBIANCE_CONFIG = {
  loisir: { label: 'Détente', emoji: '😌' },
  chill: { label: 'Détente', emoji: '😌' },
  mix: { label: 'Équilibré', emoji: '⚡' },
  compet: { label: 'Compétition', emoji: '🔥' },
  competition: { label: 'Compétition', emoji: '🔥' }
}

// === COMPOSANT: Les 4 points ===
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {AVATAR_COLORS.map((c, i) => (
        <div key={i} className="junto-dot" style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: c,
          animationDelay: `${i * 0.15}s`
        }} />
      ))}
    </div>
  )
}

function getAvatarColor(name) {
  if (!name) return JUNTO.coral
  return AVATAR_COLORS[name.charCodeAt(0) % 4]
}

export default function JoinMatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('A')
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [matchId])

  async function loadData() {
    try {
      // Charger le match
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address, city),
          profiles!matches_organizer_id_fkey (id, name, level, position, avatar_url)
        `)
        .eq('id', matchId)
        .single()

      if (!matchData) {
        setLoading(false)
        return
      }

      setMatch(matchData)

      // Charger les participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`*, profiles (id, name, level, position, avatar_url)`)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])

      setParticipants(participantsData || [])

      // Charger les invités en attente
      const { data: invitesData } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('match_id', matchId)
        .eq('status', 'pending')
      
      setPendingInvites(invitesData || [])

      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)

        // Vérifier si déjà inscrit ou en attente
        const existingParticipant = participantsData?.find(p => p.user_id === session.user.id)
        if (existingParticipant) {
          if (existingParticipant.status === 'pending') {
            setIsPending(true)
          } else {
            setAlreadyJoined(true)
          }
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function joinMatch() {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', `/join/${matchId}`)
      router.push('/auth')
      return
    }

    if (!profile?.name || !profile?.level) {
      sessionStorage.setItem('redirectAfterOnboarding', `/join/${matchId}`)
      router.push('/onboarding')
      return
    }

    setJoining(true)

    try {
      const status = match.join_mode === 'approval' ? 'pending' : 'confirmed'

      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status,
          team: selectedTeam
        })

      if (error) throw error

      if (status === 'confirmed') {
        await supabase
          .from('matches')
          .update({ 
            spots_available: match.spots_available - 1,
            status: match.spots_available - 1 <= 0 ? 'full' : 'open'
          })
          .eq('id', matchId)

        await supabase.from('match_messages').insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: `👋 ${profile?.name} a rejoint la partie`
        })

        router.push(`/dashboard/match/${matchId}`)
      } else {
        setIsPending(true)
        setJoining(false)
        setShowJoinModal(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de l\'inscription')
      setJoining(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Date flexible'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  // === DATA ===
  const organizer = match?.profiles
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  
  const allPlayers = [
    ...(organizer ? [{ 
      isOrganizer: true, 
      profiles: organizer, 
      team: match?.organizer_team || 'A' 
    }] : []),
    ...confirmedParticipants,
    ...pendingInvites.map(i => ({ 
      isPendingInvite: true, 
      profiles: { name: i.invitee_name || i.invited_name || 'Invité' }, 
      team: i.team 
    }))
  ]
  
  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const spotsLeft = match?.spots_available || 0
  const ambiance = AMBIANCE_CONFIG[match?.ambiance] || AMBIANCE_CONFIG.mix

  // === LOADING ===
  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingDots}>
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="junto-loading-dot" style={{ 
                ...styles.loadingDot, 
                background: c, 
                animationDelay: `${i * 0.1}s` 
              }} />
            ))}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Chargement...</div>
        </div>
        <style jsx global>{loadingStyles}</style>
      </div>
    )
  }

  // === MATCH NOT FOUND ===
  if (!match) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎾</div>
          <h1 style={styles.errorTitle}>Partie introuvable</h1>
          <p style={styles.errorText}>Cette partie n'existe pas ou a été annulée.</p>
          <Link href="/" style={styles.errorBtn}>Découvrir Junto</Link>
        </div>
      </div>
    )
  }

  // === MAIN RENDER ===
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* Header Junto */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span>junto</span>
            <FourDots size={8} gap={4} />
          </div>
        </div>

        {/* Match Card */}
        <div style={styles.matchCard}>
          <div style={styles.matchCardAccent} />
          
          {/* Date badge */}
          <div style={{ textAlign: 'center' }}>
            <div style={styles.dateBadge}>
              <span>📅 {formatDate(match.match_date)}{match.match_time && ` · ${formatTime(match.match_time)}`}</span>
            </div>
          </div>
          
          {/* Info match */}
          <div style={styles.matchInfo}>
            <h1 style={styles.matchTitle}>Partie de Padel 🎾</h1>
            <div style={styles.matchLocation}>
              📍 {match.clubs?.name || match.city || 'Lieu à définir'}
            </div>
          </div>
          
          {/* Organisateur */}
          {organizer && (
            <div style={styles.organizerRow}>
              <div style={{ 
                ...styles.organizerAvatar, 
                background: organizer.avatar_url ? 'transparent' : getAvatarColor(organizer.name) 
              }}>
                {organizer.avatar_url 
                  ? <img src={organizer.avatar_url} alt="" style={styles.avatarImg} />
                  : organizer.name?.[0]?.toUpperCase()
                }
              </div>
              <div style={styles.organizerInfo}>
                <div style={styles.organizerName}>{organizer.name}</div>
                <div style={styles.organizerMeta}>Niveau {organizer.level} · Organisateur</div>
              </div>
              <div style={styles.organizerBadge}>👑 Orga</div>
            </div>
          )}
          
          {/* Tags */}
          <div style={styles.matchTags}>
            <span style={styles.tag}>📊 Niveau {match.level_min}-{match.level_max}</span>
            <span style={{ ...styles.tag, ...styles.tagAmber }}>{ambiance.emoji} {ambiance.label}</span>
            {match.price_total && (
              <span style={styles.tag}>💰 {Math.round(match.price_total / 100 / 4)}€/pers</span>
            )}
          </div>
        </div>

        {/* Équipes */}
        <div style={styles.teamsSection}>
          <div style={styles.teamsTitle}>🏆 Les équipes ({spotsLeft} place{spotsLeft > 1 ? 's' : ''} dispo)</div>
          
          <div style={styles.teamsGrid}>
            {/* Équipe A */}
            <div style={{ ...styles.teamColumn, ...styles.teamA }}>
              <div style={{ ...styles.teamHeader, color: JUNTO.teamA }}>🅰️ Équipe A</div>
              {teamA.map((player, idx) => (
                <div key={idx} style={styles.teamPlayer}>
                  <div style={{ 
                    ...styles.teamPlayerAvatar, 
                    background: player.profiles?.avatar_url ? 'transparent' : getAvatarColor(player.profiles?.name)
                  }}>
                    {player.profiles?.avatar_url 
                      ? <img src={player.profiles.avatar_url} alt="" style={styles.avatarImg} />
                      : player.profiles?.name?.[0]?.toUpperCase() || '?'
                    }
                  </div>
                  <div>
                    <div style={styles.teamPlayerName}>
                      {player.profiles?.name}
                      {player.isOrganizer && ' 👑'}
                    </div>
                    <div style={styles.teamPlayerLevel}>
                      {player.isPendingInvite ? '⏳ Invité' : `Niveau ${player.profiles?.level || '?'}`}
                    </div>
                  </div>
                </div>
              ))}
              {teamA.length < 2 && (
                <div style={styles.teamEmpty}>+ {2 - teamA.length} place{2 - teamA.length > 1 ? 's' : ''}</div>
              )}
            </div>
            
            {/* Équipe B */}
            <div style={{ ...styles.teamColumn, ...styles.teamB }}>
              <div style={{ ...styles.teamHeader, color: JUNTO.teamB }}>🅱️ Équipe B</div>
              {teamB.map((player, idx) => (
                <div key={idx} style={styles.teamPlayer}>
                  <div style={{ 
                    ...styles.teamPlayerAvatar, 
                    background: player.profiles?.avatar_url ? 'transparent' : getAvatarColor(player.profiles?.name)
                  }}>
                    {player.profiles?.avatar_url 
                      ? <img src={player.profiles.avatar_url} alt="" style={styles.avatarImg} />
                      : player.profiles?.name?.[0]?.toUpperCase() || '?'
                    }
                  </div>
                  <div>
                    <div style={styles.teamPlayerName}>{player.profiles?.name}</div>
                    <div style={styles.teamPlayerLevel}>
                      {player.isPendingInvite ? '⏳ Invité' : `Niveau ${player.profiles?.level || '?'}`}
                    </div>
                  </div>
                </div>
              ))}
              {teamB.length < 2 && (
                <div style={styles.teamEmpty}>+ {2 - teamB.length} place{2 - teamB.length > 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {alreadyJoined ? (
          <div style={styles.alreadyJoinedBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: JUNTO.teal }}>Tu es inscrit !</div>
            <Link href={`/dashboard/match/${matchId}`} style={styles.goToMatchBtn}>
              Voir la partie →
            </Link>
          </div>
        ) : isPending ? (
          <div style={styles.pendingBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: JUNTO.amber }}>Demande en attente</div>
            <p style={{ fontSize: 14, color: JUNTO.gray, marginTop: 8 }}>
              L'organisateur doit valider ta demande
            </p>
          </div>
        ) : match.status === 'full' ? (
          <div style={styles.fullBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😢</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: JUNTO.gray }}>Partie complète</div>
          </div>
        ) : user ? (
          <div style={styles.ctaSection}>
            {/* Choix équipe */}
            <div style={styles.teamChoice}>
              <div style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink, marginBottom: 10 }}>
                Rejoindre quelle équipe ?
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedTeam('A')}
                  style={{
                    ...styles.teamBtn,
                    background: selectedTeam === 'A' ? `linear-gradient(135deg, ${JUNTO.teamA}, #16a34a)` : JUNTO.bg,
                    color: selectedTeam === 'A' ? '#fff' : JUNTO.gray,
                    border: selectedTeam === 'A' ? 'none' : `2px solid ${JUNTO.border}`
                  }}
                >
                  🅰️ Équipe A
                </button>
                <button
                  onClick={() => setSelectedTeam('B')}
                  style={{
                    ...styles.teamBtn,
                    background: selectedTeam === 'B' ? `linear-gradient(135deg, ${JUNTO.teamB}, #2563eb)` : JUNTO.bg,
                    color: selectedTeam === 'B' ? '#fff' : JUNTO.gray,
                    border: selectedTeam === 'B' ? 'none' : `2px solid ${JUNTO.border}`
                  }}
                >
                  🅱️ Équipe B
                </button>
              </div>
            </div>
            
            <button 
              onClick={joinMatch} 
              disabled={joining}
              style={styles.joinBtn}
            >
              {joining ? '⏳ Inscription...' : '🎾 Rejoindre la partie'}
            </button>
          </div>
        ) : (
          <div style={styles.loginPrompt}>
            <h3 style={styles.loginTitle}>Envie de jouer ? 🎾</h3>
            <p style={styles.loginText}>Connecte-toi pour rejoindre cette partie</p>
            <Link href="/auth" style={styles.loginBtn}>Se connecter</Link>
            <Link href="/auth" style={styles.signupBtn}>Créer un compte gratuit</Link>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <FourDots size={6} gap={3} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes junto-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .junto-dot { animation: junto-dot 3s ease-in-out infinite; }
        
        @keyframes junto-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

// === STYLES ===
const loadingStyles = `
  @keyframes junto-loading {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-12px); }
  }
  .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
`

const styles = {
  // Page
  page: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${JUNTO.slate} 0%, ${JUNTO.slateDark} 45%, ${JUNTO.bg} 45%)`,
    padding: '32px 20px 60px',
    fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  container: {
    maxWidth: 440,
    margin: '0 auto'
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 28
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 22,
    fontWeight: 700
  },
  
  // Match Card
  matchCard: {
    background: `linear-gradient(145deg, #4a5d6d 0%, ${JUNTO.slate} 100%)`,
    borderRadius: 28,
    padding: '28px 24px',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.1)',
    marginBottom: 20
  },
  matchCardAccent: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 6,
    background: JUNTO.coral,
    borderRadius: '0 4px 4px 0'
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0, 184, 169, 0.15)',
    border: `2px solid ${JUNTO.teal}`,
    borderRadius: 100,
    padding: '10px 18px',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 700,
    color: JUNTO.tealGlow
  },
  matchInfo: {
    textAlign: 'center',
    marginBottom: 24
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: JUNTO.white,
    margin: '0 0 8px'
  },
  matchLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  
  // Organizer
  organizerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginBottom: 20
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 700,
    color: JUNTO.white,
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  organizerInfo: {
    flex: 1
  },
  organizerName: {
    fontSize: 15,
    fontWeight: 700,
    color: JUNTO.white
  },
  organizerMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)'
  },
  organizerBadge: {
    padding: '6px 12px',
    background: JUNTO.amber,
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    color: '#000'
  },
  
  // Tags
  matchTags: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  tag: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)'
  },
  tagAmber: {
    background: 'rgba(255, 180, 0, 0.2)',
    color: JUNTO.amber
  },
  
  // Teams
  teamsSection: {
    background: JUNTO.white,
    borderRadius: 24,
    padding: 24,
    border: `2px solid ${JUNTO.border}`,
    marginBottom: 20
  },
  teamsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: JUNTO.ink,
    marginBottom: 16,
    textAlign: 'center'
  },
  teamsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16
  },
  teamColumn: {
    padding: 16,
    borderRadius: 16,
    background: JUNTO.bg
  },
  teamA: {
    border: `2px solid ${JUNTO.teamA}`
  },
  teamB: {
    border: `2px solid ${JUNTO.teamB}`
  },
  teamHeader: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  teamPlayer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    background: JUNTO.white,
    borderRadius: 12,
    marginBottom: 8
  },
  teamPlayerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: JUNTO.white,
    overflow: 'hidden'
  },
  teamPlayerName: {
    fontSize: 14,
    fontWeight: 600,
    color: JUNTO.ink
  },
  teamPlayerLevel: {
    fontSize: 12,
    color: JUNTO.muted
  },
  teamEmpty: {
    padding: 16,
    border: `2px dashed ${JUNTO.border}`,
    borderRadius: 12,
    textAlign: 'center',
    color: JUNTO.muted,
    fontSize: 13
  },
  
  // CTA
  ctaSection: {
    background: JUNTO.white,
    borderRadius: 20,
    padding: 24,
    border: `2px solid ${JUNTO.border}`
  },
  teamChoice: {
    marginBottom: 20
  },
  teamBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer'
  },
  joinBtn: {
    width: '100%',
    padding: 18,
    background: JUNTO.coral,
    color: JUNTO.white,
    border: 'none',
    borderRadius: 16,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${JUNTO.coralGlow}`
  },
  
  // Login prompt
  loginPrompt: {
    background: JUNTO.white,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${JUNTO.border}`
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: JUNTO.ink,
    margin: '0 0 8px'
  },
  loginText: {
    fontSize: 14,
    color: JUNTO.gray,
    margin: '0 0 20px'
  },
  loginBtn: {
    display: 'block',
    width: '100%',
    padding: 16,
    background: JUNTO.coral,
    color: JUNTO.white,
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center',
    marginBottom: 12
  },
  signupBtn: {
    display: 'block',
    width: '100%',
    padding: 14,
    background: JUNTO.white,
    color: JUNTO.ink,
    border: `2px solid ${JUNTO.border}`,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center'
  },
  
  // Status boxes
  alreadyJoinedBox: {
    background: JUNTO.tealSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${JUNTO.teal}`
  },
  goToMatchBtn: {
    display: 'inline-block',
    marginTop: 16,
    padding: '14px 28px',
    background: JUNTO.teal,
    color: JUNTO.white,
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15
  },
  pendingBox: {
    background: JUNTO.amberSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${JUNTO.amber}`
  },
  fullBox: {
    background: JUNTO.bg,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${JUNTO.border}`
  },
  
  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 32
  },
  
  // Loading
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(180deg, ${JUNTO.slate} 0%, ${JUNTO.slateDark} 100%)`,
    fontFamily: "'Satoshi', -apple-system, sans-serif"
  },
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  loadingDot: {
    width: 14,
    height: 14,
    borderRadius: '50%'
  },
  
  // Error
  errorPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: JUNTO.bg,
    padding: 20,
    fontFamily: "'Satoshi', -apple-system, sans-serif"
  },
  errorCard: {
    background: JUNTO.white,
    borderRadius: 24,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 360,
    border: `2px solid ${JUNTO.border}`
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: JUNTO.ink,
    margin: '0 0 8px'
  },
  errorText: {
    fontSize: 14,
    color: JUNTO.gray,
    margin: '0 0 28px'
  },
  errorBtn: {
    display: 'inline-block',
    padding: '16px 32px',
    background: JUNTO.coral,
    color: JUNTO.white,
    borderRadius: 100,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15
  }
}