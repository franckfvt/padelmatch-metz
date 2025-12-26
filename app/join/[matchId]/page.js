'use client'

/**
 * ============================================
 * PAGE PUBLIQUE REJOINDRE UN MATCH - 2×2
 * ============================================
 * 
 * Page d'arrivée via lien partagé.
 * Dark mode pour conversion maximale.
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS (DARK MODE) ===
const COLORS = {
  // Players
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  // Core
  coral: '#ff5a5f',
  coralSoft: 'rgba(255, 90, 95, 0.15)',
  coralGlow: 'rgba(255, 90, 95, 0.4)',
  amber: '#ffb400',
  amberSoft: 'rgba(255, 180, 0, 0.15)',
  teal: '#00b8a9',
  tealSoft: 'rgba(0, 184, 169, 0.15)',
  tealGlow: '#4eeee0',
  violet: '#7c5cff',
  violetSoft: 'rgba(124, 92, 255, 0.15)',
  
  // Dark mode backgrounds
  ink: '#1a1a1a',
  inkSoft: '#2a2a2a',
  inkSofter: '#333333',
  
  // Text
  white: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  // Teams
  teamA: '#22c55e',
  teamABg: 'rgba(34, 197, 94, 0.1)',
  teamB: '#3b82f6',
  teamBBg: 'rgba(59, 130, 246, 0.1)',
}

const AVATAR_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

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
        <div key={i} className="dot-pulse" style={{ 
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
  if (!name) return COLORS.p1
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
      const { data: participantsData, error: participantsError } = await supabase
        .from('match_participants')
        .select(`*`)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])
      
      console.log('🔍 Participants bruts:', participantsData, participantsError) // DEBUG
      
      // Charger les profils des participants
      if (participantsData && participantsData.length > 0) {
        const userIds = participantsData.map(p => p.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, level, position, avatar_url')
          .in('id', userIds)
        
        // Associer les profils aux participants
        const participantsWithProfiles = participantsData.map(p => ({
          ...p,
          profiles: profilesData?.find(pr => pr.id === p.user_id) || null
        }))
        
        console.log('🔍 Participants avec profils:', participantsWithProfiles) // DEBUG
        setParticipants(participantsWithProfiles)
      } else {
        setParticipants([])
      }

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
  
  console.log('🔍 confirmedParticipants:', confirmedParticipants) // DEBUG
  
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
  
  console.log('🔍 allPlayers:', allPlayers) // DEBUG
  
  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  
  console.log('🔍 teamA:', teamA, 'teamB:', teamB) // DEBUG
  const spotsLeft = match?.spots_available || 0
  const ambiance = AMBIANCE_CONFIG[match?.ambiance] || AMBIANCE_CONFIG.mix

  // === LOADING ===
  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingDots}>
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="loading-dot" style={{ 
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
          <Link href="/" style={styles.errorBtn}>Découvrir 2×2</Link>
        </div>
      </div>
    )
  }

  // === MAIN RENDER ===
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* Header 2×2 */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={{ fontWeight: 900, letterSpacing: -2 }}>2×2</span>
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
              <div style={{ ...styles.teamHeader, color: COLORS.teamA }}>🅰️ Équipe A</div>
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
              <div style={{ ...styles.teamHeader, color: COLORS.teamB }}>🅱️ Équipe B</div>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.teal }}>Tu es inscrit !</div>
            <Link href={`/dashboard/match/${matchId}`} style={styles.goToMatchBtn}>
              Voir la partie →
            </Link>
          </div>
        ) : isPending ? (
          <div style={styles.pendingBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.amber }}>Demande en attente</div>
            <p style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 8 }}>
              L'organisateur doit valider ta demande
            </p>
          </div>
        ) : match.status === 'full' ? (
          <div style={styles.fullBox}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😢</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textSecondary }}>Partie complète</div>
          </div>
        ) : user ? (
          <div style={styles.ctaSection}>
            {/* Choix équipe */}
            <div style={styles.teamChoice}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.white, marginBottom: 10 }}>
                Rejoindre quelle équipe ?
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedTeam('A')}
                  style={{
                    ...styles.teamBtn,
                    background: selectedTeam === 'A' ? `linear-gradient(135deg, ${COLORS.teamA}, #16a34a)` : COLORS.inkSoft,
                    color: selectedTeam === 'A' ? '#fff' : COLORS.textSecondary,
                    border: selectedTeam === 'A' ? 'none' : `2px solid ${COLORS.border}`
                  }}
                >
                  🅰️ Équipe A
                </button>
                <button
                  onClick={() => setSelectedTeam('B')}
                  style={{
                    ...styles.teamBtn,
                    background: selectedTeam === 'B' ? `linear-gradient(135deg, ${COLORS.teamB}, #2563eb)` : COLORS.inkSoft,
                    color: selectedTeam === 'B' ? '#fff' : COLORS.textSecondary,
                    border: selectedTeam === 'B' ? 'none' : `2px solid ${COLORS.border}`
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
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .dot-pulse { animation: dot-pulse 3s ease-in-out infinite; }
        
        @keyframes loading-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .loading-dot { animation: loading-bounce 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

// === STYLES ===
const loadingStyles = `
  @keyframes loading-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-12px); }
  }
  .loading-dot { animation: loading-bounce 1.4s ease-in-out infinite; }
`

const styles = {
  // Page - DARK MODE
  page: {
    minHeight: '100vh',
    background: COLORS.ink,
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
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: -2
  },
  
  // Match Card - DARK
  matchCard: {
    background: COLORS.inkSoft,
    borderRadius: 28,
    padding: '28px 24px',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    border: `1px solid ${COLORS.border}`,
    marginBottom: 20
  },
  matchCardAccent: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 6,
    background: COLORS.coral,
    borderRadius: '0 4px 4px 0'
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: COLORS.tealSoft,
    border: `2px solid ${COLORS.teal}`,
    borderRadius: 100,
    padding: '10px 18px',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.tealGlow
  },
  matchInfo: {
    textAlign: 'center',
    marginBottom: 24
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: COLORS.white,
    margin: '0 0 8px'
  },
  matchLocation: {
    fontSize: 14,
    color: COLORS.textMuted,
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
    background: 'rgba(255,255,255,0.05)',
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
    color: COLORS.white,
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
    color: COLORS.white
  },
  organizerMeta: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  organizerBadge: {
    padding: '6px 12px',
    background: COLORS.amber,
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
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textSecondary
  },
  tagAmber: {
    background: COLORS.amberSoft,
    color: COLORS.amber
  },
  
  // Teams - DARK VERSION
  teamsSection: {
    background: COLORS.inkSoft,
    borderRadius: 24,
    padding: 24,
    border: `1px solid ${COLORS.border}`,
    marginBottom: 20
  },
  teamsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.white,
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
    background: COLORS.inkSofter
  },
  teamA: {
    border: `2px solid ${COLORS.teamA}`
  },
  teamB: {
    border: `2px solid ${COLORS.teamB}`
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
    background: 'rgba(255,255,255,0.05)',
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
    color: COLORS.white,
    overflow: 'hidden'
  },
  teamPlayerName: {
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.white
  },
  teamPlayerLevel: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  teamEmpty: {
    padding: 16,
    border: `2px dashed ${COLORS.border}`,
    borderRadius: 12,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13
  },
  
  // CTA - DARK
  ctaSection: {
    background: COLORS.inkSoft,
    borderRadius: 20,
    padding: 24,
    border: `1px solid ${COLORS.border}`
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
    background: COLORS.white,
    color: COLORS.ink,
    border: 'none',
    borderRadius: 16,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(255, 255, 255, 0.15)'
  },
  
  // Login prompt - DARK
  loginPrompt: {
    background: COLORS.inkSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `1px solid ${COLORS.border}`
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.white,
    margin: '0 0 8px'
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    margin: '0 0 20px'
  },
  loginBtn: {
    display: 'block',
    width: '100%',
    padding: 16,
    background: COLORS.white,
    color: COLORS.ink,
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
    background: 'transparent',
    color: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center'
  },
  
  // Status boxes - DARK
  alreadyJoinedBox: {
    background: COLORS.tealSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${COLORS.teal}`
  },
  goToMatchBtn: {
    display: 'inline-block',
    marginTop: 16,
    padding: '14px 28px',
    background: COLORS.teal,
    color: COLORS.white,
    borderRadius: 12,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15
  },
  pendingBox: {
    background: COLORS.amberSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `2px solid ${COLORS.amber}`
  },
  fullBox: {
    background: COLORS.inkSoft,
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    border: `1px solid ${COLORS.border}`
  },
  
  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 32
  },
  
  // Loading - DARK
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.ink,
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
  
  // Error - DARK
  errorPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.ink,
    padding: 20,
    fontFamily: "'Satoshi', -apple-system, sans-serif"
  },
  errorCard: {
    background: COLORS.inkSoft,
    borderRadius: 24,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 360,
    border: `1px solid ${COLORS.border}`
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.white,
    margin: '0 0 8px'
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    margin: '0 0 28px'
  },
  errorBtn: {
    display: 'inline-block',
    padding: '16px 32px',
    background: COLORS.white,
    color: COLORS.ink,
    borderRadius: 100,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15
  }
}