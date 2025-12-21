'use client'

/**
 * ============================================
 * PAGE MATCH - VERSION REDESIGN
 * ============================================
 * 
 * Principes :
 * 1. Une seule ambiance visuelle (fond clair)
 * 2. 3 sections principales (Header, Match, Chat)
 * 3. Informations clés visibles immédiatement
 * 4. Actions regroupées logiquement
 * 5. Chat agrandi et mis en valeur
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ShareMatchModal from '@/app/components/ShareMatchModal'

// ============================================
// TOKENS DE DESIGN (cohérence)
// ============================================
const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#64748b',
  border: '#e2e8f0',
  accent: '#22c55e',
  teamA: '#3b82f6',
  teamB: '#f97316',
  danger: '#ef4444',
  warning: '#f59e0b'
}

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20
}

export default function MatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id

  // États principaux
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // UI
  const [newMessage, setNewMessage] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOrganizerMenu, setShowOrganizerMenu] = useState(false)
  const [modal, setModal] = useState(null)

  // Forms
  const [joinTeam, setJoinTeam] = useState('A')
  const [cancelReason, setCancelReason] = useState('')
  const [resultForm, setResultForm] = useState({ winner: '', scores: {} })

  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    loadData()
    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_messages', filter: `match_id=eq.${matchId}` }, loadMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_participants', filter: `match_id=eq.${matchId}` }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [matchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      const { data: matchData } = await supabase
        .from('matches')
        .select(`*, clubs (id, name, address), profiles!matches_organizer_id_fkey (id, name, level, position, avatar_url, phone)`)
        .eq('id', matchId)
        .single()

      if (!matchData) { router.push('/dashboard'); return }
      setMatch(matchData)

      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])
      setParticipants(participantsData || [])

      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase
          .from('match_participants')
          .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`)
          .eq('match_id', matchId)
          .eq('status', 'pending')
        setPendingRequests(pendingData || [])

        const { data: invitesData } = await supabase
          .from('pending_invites')
          .select('*')
          .eq('match_id', matchId)
          .eq('status', 'pending')
        setPendingInvites(invitesData || [])
      }

      await loadMessages()
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('match_messages')
      .select(`*, profiles (id, name)`)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  // ============================================
  // HELPERS
  // ============================================
  const isOrganizer = () => match?.organizer_id === user?.id
  const isParticipant = () => participants.some(p => p.user_id === user?.id && p.status === 'confirmed')
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / 4) : 0

  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  const pendingParticipants = participants.filter(p => p.status === 'pending')

  function getPlayerCount() {
    return confirmedParticipants.length + 1 + pendingInvites.length
  }

  function getSpotsLeft() {
    return Math.max(0, 4 - getPlayerCount())
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return 'Heure à définir'
    return timeStr.slice(0, 5)
  }

  // Équipes
  const orgaPlayer = {
    isOrganizer: true,
    profiles: match?.profiles,
    team: match?.organizer_team || 'A',
    status: 'confirmed',
    user_id: match?.organizer_id
  }

  const allPlayers = [
    orgaPlayer,
    ...confirmedParticipants,
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true }))
  ]

  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente' },
    mix: { emoji: '⚡', label: 'Équilibré' },
    compet: { emoji: '🏆', label: 'Compétitif' }
  }
  const ambiance = ambianceConfig[match?.ambiance] || ambianceConfig.mix

  // ============================================
  // ACTIONS
  // ============================================
  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    const messageText = newMessage.trim()
    
    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      match_id: parseInt(matchId),
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      profiles: { id: user.id, name: profile?.name }
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')
    
    await supabase.from('match_messages').insert({
      match_id: parseInt(matchId),
      user_id: user.id,
      message: messageText
    })
  }

  async function requestToJoin() {
    await supabase.from('match_participants').insert({
      match_id: parseInt(matchId),
      user_id: user.id,
      team: joinTeam,
      status: 'pending'
    })
    setModal(null)
    loadData()
  }

  async function acceptRequest(req) {
    await supabase
      .from('match_participants')
      .update({ status: 'confirmed' })
      .eq('id', req.id)
    loadData()
  }

  async function refuseRequest(req) {
    await supabase
      .from('match_participants')
      .delete()
      .eq('id', req.id)
    loadData()
  }

  async function leaveMatch() {
    if (!confirm('Quitter cette partie ?')) return
    await supabase
      .from('match_participants')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', user.id)
    loadData()
  }

  async function cancelMatch() {
    if (!confirm('Annuler cette partie ? Cette action est irréversible.')) return
    await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .eq('id', matchId)
    router.push('/dashboard/matches')
  }

  async function saveResult() {
    if (!resultForm.winner) return
    await supabase
      .from('matches')
      .update({ 
        status: 'completed',
        winner: resultForm.winner === 'A' ? 'team_a' : 'team_b'
      })
      .eq('id', matchId)
    setModal(null)
    loadData()
  }

  function copyLink() {
    const url = `${window.location.origin}/join/${matchId}`
    navigator.clipboard.writeText(url)
    alert('Lien copié !')
  }

  function addToCalendar() {
    if (!match?.match_date || !match?.match_time) return
    const start = new Date(`${match.match_date}T${match.match_time}`)
    const end = new Date(start.getTime() + 90 * 60000)
    const title = `🎾 Padel - ${match.clubs?.name || match.city || 'Match'}`
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
    window.open(url, '_blank')
  }

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center', color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div style={{ color: COLORS.textMuted, marginBottom: 16 }}>Partie introuvable</div>
          <Link href="/dashboard/matches" style={{ color: COLORS.accent }}>← Retour aux parties</Link>
        </div>
      </div>
    )
  }

  const isMatchPast = match.match_date && match.match_time && new Date(`${match.match_date}T${match.match_time}`) < new Date()
  const canJoin = !isOrganizer() && !isParticipant() && !pendingParticipants.some(p => p.user_id === user?.id) && getSpotsLeft() > 0 && match.status === 'open'

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      paddingBottom: canJoin || isParticipant() ? 100 : 24 
    }}>

      {/* ============================================ */}
      {/* HEADER COMPACT                              */}
      {/* ============================================ */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        padding: '0 4px'
      }}>
        <Link href="/dashboard/matches" style={{ 
          color: COLORS.textMuted, 
          textDecoration: 'none',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          ← Retour
        </Link>

        {/* Status badge */}
        <span style={{
          padding: '6px 12px',
          background: match.status === 'cancelled' ? '#fee2e2' : 
                      match.status === 'completed' ? '#dcfce7' : '#f0fdf4',
          color: match.status === 'cancelled' ? COLORS.danger : 
                 match.status === 'completed' ? '#166534' : '#166534',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600
        }}>
          {match.status === 'cancelled' ? '❌ Annulée' : 
           match.status === 'completed' ? '✅ Terminée' : '🎾 Ouverte'}
        </span>

        {/* Menu organisateur */}
        {isOrganizer() && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOrganizerMenu(!showOrganizerMenu)}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              ⚙️
            </button>
            
            {showOrganizerMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: 180
              }}>
                <button
                  onClick={() => { addToCalendar(); setShowOrganizerMenu(false) }}
                  style={menuItemStyle}
                >
                  📅 Ajouter au calendrier
                </button>
                <button
                  onClick={() => { copyLink(); setShowOrganizerMenu(false) }}
                  style={menuItemStyle}
                >
                  🔗 Copier le lien
                </button>
                {match.status === 'open' && (
                  <button
                    onClick={() => { setModal('cancel'); setShowOrganizerMenu(false) }}
                    style={{ ...menuItemStyle, color: COLORS.danger }}
                  >
                    ❌ Annuler la partie
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* DEMANDES EN ATTENTE (si organisateur)       */}
      {/* ============================================ */}
      {isOrganizer() && pendingRequests.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: `1px solid ${COLORS.warning}`,
          borderRadius: RADIUS.lg,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#92400e', 
            marginBottom: 12 
          }}>
            📨 {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
          </div>
          {pendingRequests.map(req => (
            <div key={req.id} style={{
              background: COLORS.card,
              borderRadius: RADIUS.md,
              padding: 12,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Avatar profile={req.profiles} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{req.profiles?.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  ⭐ Niveau {req.profiles?.level || '?'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => acceptRequest(req)} 
                  style={btnAccept}
                >
                  ✓
                </button>
                <button 
                  onClick={() => refuseRequest(req)} 
                  style={btnRefuse}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* CARTE MATCH PRINCIPALE                      */}
      {/* ============================================ */}
      <div style={{
        background: COLORS.card,
        borderRadius: RADIUS.xl,
        border: `1px solid ${COLORS.border}`,
        overflow: 'hidden',
        marginBottom: 16
      }}>
        
        {/* Date & Heure */}
        <div style={{
          padding: 20,
          textAlign: 'center',
          borderBottom: `1px solid ${COLORS.border}`
        }}>
          <div style={{ 
            fontSize: 14, 
            color: COLORS.textMuted, 
            marginBottom: 4 
          }}>
            📅 {formatDate(match.match_date)}
          </div>
          <div style={{ 
            fontSize: 36, 
            fontWeight: 800, 
            color: COLORS.text 
          }}>
            {formatTime(match.match_time)}
          </div>
          <div style={{ 
            fontSize: 15, 
            color: COLORS.text,
            marginTop: 8 
          }}>
            📍 {match.clubs?.name || match.city || 'Lieu à définir'}
          </div>
          {match.clubs?.address && (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              {match.clubs.address}
            </div>
          )}
        </div>

        {/* Équipes */}
        <div style={{ padding: 20 }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 40px 1fr', 
            gap: 12,
            marginBottom: 20
          }}>
            {/* Équipe A */}
            <div>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: COLORS.teamA, 
                marginBottom: 8, 
                textAlign: 'center',
                letterSpacing: 1
              }}>
                ÉQUIPE A
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1].map(i => (
                  <PlayerSlot key={i} player={teamA[i]} teamColor={COLORS.teamA} />
                ))}
              </div>
            </div>

            {/* VS */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <div style={{ 
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: COLORS.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12, 
                fontWeight: 800, 
                color: COLORS.textMuted 
              }}>
                VS
              </div>
            </div>

            {/* Équipe B */}
            <div>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: COLORS.teamB, 
                marginBottom: 8, 
                textAlign: 'center',
                letterSpacing: 1
              }}>
                ÉQUIPE B
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1].map(i => (
                  <PlayerSlot key={i} player={teamB[i]} teamColor={COLORS.teamB} />
                ))}
              </div>
            </div>
          </div>

          {/* Badges info */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.border}`
          }}>
            <InfoBadge icon="⭐" text={`Niv. ${match.level_min}-${match.level_max}`} />
            <InfoBadge icon={ambiance.emoji} text={ambiance.label} />
            {pricePerPerson > 0 && (
              <InfoBadge icon="💰" text={`${pricePerPerson}€/pers`} />
            )}
            <InfoBadge 
              icon={getSpotsLeft() > 0 ? '🎾' : '🔒'} 
              text={getSpotsLeft() > 0 ? `${getSpotsLeft()} place${getSpotsLeft() > 1 ? 's' : ''}` : 'Complet'}
              highlight={getSpotsLeft() > 0}
            />
          </div>

          {/* Organisateur */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
            padding: '12px 16px',
            background: COLORS.bg,
            borderRadius: RADIUS.md
          }}>
            <span style={{ fontSize: 14 }}>👑</span>
            <Avatar profile={match.profiles} size={28} />
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>
              Organisé par <strong style={{ color: COLORS.text }}>{match.profiles?.name}</strong>
            </span>
          </div>
        </div>

        {/* Bouton Partager */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={() => setShowShareModal(true)}
            style={{
              width: '100%',
              padding: 14,
              background: COLORS.accent,
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.md,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            📤 Partager la partie
          </button>
        </div>

        {/* Bouton Résultat (si match passé) */}
        {isOrganizer() && isMatchPast && match.status === 'open' && (
          <div style={{ padding: '0 20px 20px' }}>
            <button
              onClick={() => setModal('result')}
              style={{
                width: '100%',
                padding: 14,
                background: COLORS.bg,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: RADIUS.md,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🏆 Enregistrer le résultat
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* CHAT                                         */}
      {/* ============================================ */}
      <div style={{
        background: COLORS.card,
        borderRadius: RADIUS.xl,
        border: `1px solid ${COLORS.border}`,
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 16,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>
            💬 Discussion
          </span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>
            {messages.length} message{messages.length > 1 ? 's' : ''}
          </span>
        </div>

        <div 
          ref={chatContainerRef}
          style={{ 
            height: 280, 
            overflowY: 'auto', 
            padding: 16 
          }}
        >
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: COLORS.textMuted, 
              padding: 40 
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 14 }}>Aucun message</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Sois le premier à écrire !</div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 12 }}>
                <div style={{
                  background: msg.user_id === user?.id ? COLORS.text : COLORS.bg,
                  color: msg.user_id === user?.id ? '#fff' : COLORS.text,
                  padding: '10px 14px',
                  borderRadius: RADIUS.md,
                  maxWidth: '80%',
                  width: 'fit-content',
                  marginLeft: msg.user_id === user?.id ? 'auto' : 0
                }}>
                  {msg.user_id !== user?.id && (
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      marginBottom: 4, 
                      opacity: 0.7 
                    }}>
                      {msg.profiles?.name}
                    </div>
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} style={{ 
          borderTop: `1px solid ${COLORS.border}`, 
          padding: 12,
          display: 'flex',
          gap: 8
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: RADIUS.md,
              border: `1px solid ${COLORS.border}`,
              fontSize: 14,
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            style={{
              padding: '12px 18px',
              background: COLORS.accent,
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.md,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600
            }}
          >
            →
          </button>
        </form>
      </div>

      {/* ============================================ */}
      {/* CTA FIXE EN BAS                              */}
      {/* ============================================ */}
      {canJoin && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: COLORS.card,
          borderTop: `1px solid ${COLORS.border}`,
          padding: 16,
          zIndex: 100
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button 
              onClick={() => setModal('join')}
              style={{
                width: '100%',
                padding: 16,
                background: COLORS.accent,
                color: '#fff',
                border: 'none',
                borderRadius: RADIUS.md,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Demander à rejoindre
            </button>
          </div>
        </div>
      )}

      {isParticipant() && !isOrganizer() && match.status === 'open' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: COLORS.card,
          borderTop: `1px solid ${COLORS.border}`,
          padding: 16,
          zIndex: 100
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button 
              onClick={leaveMatch}
              style={{
                width: '100%',
                padding: 16,
                background: COLORS.card,
                color: COLORS.danger,
                border: `2px solid #fee2e2`,
                borderRadius: RADIUS.md,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Quitter la partie
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODALS                                       */}
      {/* ============================================ */}
      
      {/* Modal Rejoindre */}
      {modal === 'join' && (
        <Modal onClose={() => setModal(null)} title="Rejoindre la partie">
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 20 }}>
            L'organisateur devra accepter ta demande.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Équipe préférée
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A', 'B'].map(team => (
                <button
                  key={team}
                  onClick={() => setJoinTeam(team)}
                  style={{
                    flex: 1,
                    padding: 14,
                    border: `2px solid ${joinTeam === team ? COLORS.accent : COLORS.border}`,
                    borderRadius: RADIUS.md,
                    background: joinTeam === team ? '#f0fdf4' : COLORS.card,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Équipe {team}
                </button>
              ))}
            </div>
          </div>
          <button onClick={requestToJoin} style={btnPrimary}>
            Envoyer ma demande
          </button>
        </Modal>
      )}

      {/* Modal Annuler */}
      {modal === 'cancel' && (
        <Modal onClose={() => setModal(null)} title="Annuler la partie">
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 16 }}>
            Cette action est irréversible. Tous les participants seront prévenus.
          </p>
          <button onClick={cancelMatch} style={{ ...btnPrimary, background: COLORS.danger }}>
            Confirmer l'annulation
          </button>
        </Modal>
      )}

      {/* Modal Résultat */}
      {modal === 'result' && (
        <Modal onClose={() => setModal(null)} title="Résultat du match">
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 10 }}>
              Équipe gagnante
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(team => (
                <button
                  key={team}
                  onClick={() => setResultForm({ ...resultForm, winner: team })}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: `2px solid ${resultForm.winner === team ? COLORS.accent : COLORS.border}`,
                    borderRadius: RADIUS.md,
                    background: resultForm.winner === team ? '#dcfce7' : COLORS.card,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🏆 Équipe {team}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={saveResult}
            disabled={!resultForm.winner}
            style={{ 
              ...btnPrimary, 
              background: resultForm.winner ? COLORS.accent : COLORS.border,
              cursor: resultForm.winner ? 'pointer' : 'not-allowed'
            }}
          >
            Enregistrer
          </button>
        </Modal>
      )}

      {/* Modal Partage */}
      {showShareModal && (
        <ShareMatchModal
          match={match}
          players={participants}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}

// ============================================
// COMPOSANTS EXTRAITS
// ============================================

function Avatar({ profile, size = 40 }) {
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']
  const color = colors[(profile?.name?.[0]?.charCodeAt(0) || 0) % colors.length]
  
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    )
  }
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 600,
      fontSize: size * 0.4
    }}>
      {profile?.name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function PlayerSlot({ player, teamColor }) {
  if (!player) {
    return (
      <div style={{
        background: COLORS.bg,
        borderRadius: RADIUS.md,
        padding: 12,
        textAlign: 'center',
        border: `2px dashed ${COLORS.border}`,
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
          🎾 Place libre
        </span>
      </div>
    )
  }

  if (player.isPendingInvite) {
    return (
      <div style={{
        background: '#fffbeb',
        borderRadius: RADIUS.md,
        padding: 12,
        border: `2px solid ${COLORS.warning}`,
        textAlign: 'center',
        minHeight: 60
      }}>
        <div style={{ fontSize: 16, marginBottom: 4 }}>⏳</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>
          {player.invitee_name}
        </div>
        <div style={{ fontSize: 10, color: '#b45309' }}>Invité</div>
      </div>
    )
  }

  return (
    <div style={{
      background: COLORS.card,
      borderRadius: RADIUS.md,
      padding: 10,
      border: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 60
    }}>
      <Avatar profile={player.profiles} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: 13, 
          color: COLORS.text,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          {player.isOrganizer && <span>👑</span>}
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {player.profiles?.name}
          </span>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>
          ⭐ Niv. {player.profiles?.level || '?'}
        </div>
      </div>
    </div>
  )
}

function InfoBadge({ icon, text, highlight }) {
  return (
    <span style={{
      padding: '6px 12px',
      background: highlight ? '#dcfce7' : COLORS.bg,
      color: highlight ? '#166534' : COLORS.textMuted,
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }}>
      {icon} {text}
    </span>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 1000
    }}>
      <div style={{
        background: COLORS.card,
        borderRadius: RADIUS.lg,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: COLORS.textMuted,
              padding: 0
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

// ============================================
// STYLES
// ============================================

const menuItemStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${COLORS.border}`,
  textAlign: 'left',
  fontSize: 14,
  cursor: 'pointer',
  color: COLORS.text
}

const btnPrimary = {
  width: '100%',
  padding: 14,
  background: COLORS.accent,
  color: '#fff',
  border: 'none',
  borderRadius: RADIUS.md,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer'
}

const btnAccept = {
  padding: '8px 14px',
  background: COLORS.accent,
  color: '#fff',
  border: 'none',
  borderRadius: RADIUS.sm,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}

const btnRefuse = {
  padding: '8px 14px',
  background: '#fee2e2',
  color: COLORS.danger,
  border: 'none',
  borderRadius: RADIUS.sm,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}