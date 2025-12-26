'use client'

/**
 * ============================================
 * PAGE MATCH DETAIL - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Structure:
 * 1. Carte Match (header + terrain + logo 2×2 + bouton inviter)
 * 2. Bouton Rejoindre (visiteur)
 * 3. Actions en attente (organisateur)
 * 4. Chat
 * 5. Sidebar (partager, actions, orga, danger)
 * 6. Modals (rejoindre, partager, annuler, quitter, profil, invite)
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e5',
  p3Soft: '#e5f9f7',
  p4Soft: '#f0edff',
  
  // Glows
  p1Glow: 'rgba(255, 90, 95, 0.25)',
  p3Glow: 'rgba(0, 184, 169, 0.25)',
  
  // Interface sobre
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  cardDark: '#1a1a1a',
  
  // Borders
  border: '#e5e7eb',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

const AMBIANCE_CONFIG = {
  chill: { label: 'Détente', emoji: '😌', color: COLORS.p3 },
  loisir: { label: 'Détente', emoji: '😌', color: COLORS.p3 },
  mix: { label: 'Équilibré', emoji: '⚡', color: COLORS.p2 },
  competition: { label: 'Compétition', emoji: '🔥', color: COLORS.p1 },
  compet: { label: 'Compétition', emoji: '🔥', color: COLORS.p1 }
}

const POSITION_LABELS = {
  left: { label: 'Gauche', icon: '⬅️' },
  gauche: { label: 'Gauche', icon: '⬅️' },
  right: { label: 'Droite', icon: '➡️' },
  droite: { label: 'Droite', icon: '➡️' },
  both: { label: 'Les deux', icon: '↔️' }
}

// === COMPOSANT: Les 4 dots animés ===
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div key={i} className="dot-breathe" style={{ 
          width: size, height: size, borderRadius: size > 10 ? 3 : '50%', background: c,
          animationDelay: `${i * 0.15}s`
        }} />
      ))}
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function MatchDetailPage() {
  const router = useRouter()
  const { id: matchId } = useParams()
  const messagesEndRef = useRef(null)

  // États
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [joinTeam, setJoinTeam] = useState('A')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // États invitation par email
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteTeam, setInviteTeam] = useState('A')
  const [inviteSending, setInviteSending] = useState(false)

  // === DATA LOADING ===
  useEffect(() => { loadData() }, [matchId])
  
  useEffect(() => {
    const channel = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_messages', filter: `match_id=eq.${matchId}` }, () => loadMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_participants', filter: `match_id=eq.${matchId}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_invites', filter: `match_id=eq.${matchId}` }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId])
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(profileData)

      const { data: matchData } = await supabase.from('matches').select(`*, clubs (id, name, address, city), profiles!matches_organizer_id_fkey (id, name, level, position, avatar_url, phone)`).eq('id', matchId).single()
      if (!matchData) { router.push('/dashboard/parties'); return }
      setMatch(matchData)

      const { data: participantsData } = await supabase.from('match_participants').select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`).eq('match_id', matchId).in('status', ['confirmed', 'pending'])
      setParticipants(participantsData || [])

      const { data: invitesData } = await supabase.from('pending_invites').select('*').eq('match_id', matchId).eq('status', 'pending')
      const invitesWithAge = (invitesData || []).map(inv => {
        const created = new Date(inv.created_at)
        const now = new Date()
        const daysSince = Math.floor((now - created) / (1000 * 60 * 60 * 24))
        return { ...inv, daysSince }
      })
      setPendingInvites(invitesWithAge)

      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase.from('match_participants').select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`).eq('match_id', matchId).eq('status', 'pending')
        setPendingRequests(pendingData || [])
      }

      await loadMessages()
      setLoading(false)
    } catch (error) { console.error('Error:', error); setLoading(false) }
  }

  async function loadMessages() {
    const { data } = await supabase.from('match_messages').select(`*, profiles (id, name, avatar_url)`).eq('match_id', matchId).order('created_at', { ascending: true }).limit(100)
    setMessages(data || [])
  }

  // === HELPERS ===
  const isOrganizer = () => match?.organizer_id === user?.id
  const isParticipant = () => participants.some(p => p.user_id === user?.id && p.status === 'confirmed')
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / 4) : 0
  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  
  function getPlayerCount() { return confirmedParticipants.length + 1 + pendingInvites.length }
  function getSpotsLeft() { return Math.max(0, 4 - getPlayerCount()) }

  function formatDateFull(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatDateParts(dateStr) {
    if (!dateStr) return { day: '—', num: '?', month: '' }
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      num: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' })
    }
  }

  function formatTime(timeStr) { return timeStr ? timeStr.slice(0, 5) : '--:--' }

  function getShareUrl() {
    if (typeof window !== 'undefined') return `${window.location.origin}/join/${matchId}`
    return ''
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) { console.error('Failed to copy:', err) }
  }

  function shareVia(platform) {
    const url = getShareUrl()
    const text = `Rejoins ma partie de padel ! ${formatDateFull(match?.match_date)} à ${formatTime(match?.match_time)}`
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      sms: `sms:?body=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent('Partie de padel')}&body=${encodeURIComponent(text + '\n\n' + url)}`
    }
    if (links[platform]) window.open(links[platform], '_blank')
  }

  // === ACTIONS ===
  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    const messageText = newMessage.trim()
    setMessages(prev => [...prev, { 
      id: Date.now(), match_id: parseInt(matchId), user_id: user.id, message: messageText, 
      created_at: new Date().toISOString(), profiles: { id: user.id, name: profile?.name, avatar_url: profile?.avatar_url } 
    }])
    setNewMessage('')
    await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: messageText })
  }

  async function requestToJoin() {
    await supabase.from('match_participants').insert({ match_id: parseInt(matchId), user_id: user.id, team: joinTeam, status: 'pending' })
    setModal(null)
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

  async function cancelInvite(invite) {
    await supabase.from('pending_invites').delete().eq('id', invite.id)
    loadData()
  }

  async function resendInvite(invite) {
    alert(`Invitation renvoyée à ${invite.invitee_name || invite.invited_name || invite.invitee_email || 'cet invité'}`)
  }

  async function sendEmailInvite() {
    if (!inviteName.trim()) { alert('Indique au moins un prénom'); return }
    setInviteSending(true)
    try {
      const inviteToken = crypto.randomUUID()
      const { error: inviteError } = await supabase.from('pending_invites').insert({
        match_id: parseInt(matchId), inviter_id: user.id, invitee_name: inviteName.trim(),
        invitee_email: inviteEmail.trim() || null, team: inviteTeam, status: 'pending', invite_token: inviteToken
      })
      if (inviteError) throw inviteError
      
      if (inviteEmail.trim()) {
        const response = await fetch('/api/send-invite', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteToken, inviteeName: inviteName.trim(), inviteeContact: inviteEmail.trim(),
            inviterName: profile?.name || 'Un joueur', matchDate: match?.match_date || null,
            matchTime: match?.match_time || null, clubName: match?.clubs?.name || match?.city || 'À définir'
          })
        })
        const result = await response.json()
        if (result.success) console.log(`✅ Email envoyé à ${inviteEmail}`)
      }
      setInviteName(''); setInviteEmail(''); setInviteTeam('A'); setModal(null); loadData()
    } catch (err) { console.error('Erreur invitation:', err); alert('Erreur lors de l\'envoi') }
    finally { setInviteSending(false) }
  }

  async function leaveMatch() {
    await supabase.from('match_participants').delete().eq('match_id', parseInt(matchId)).eq('user_id', user.id)
    setModal(null); loadData()
  }

  async function cancelMatch() {
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', parseInt(matchId))
    setModal(null); router.push('/dashboard/parties')
  }

  // === PLAYERS DATA ===
  const orgaPlayer = { 
    isOrganizer: true, profiles: match?.profiles, team: match?.organizer_team || 'A', 
    status: 'confirmed', user_id: match?.organizer_id 
  }
  const allPlayers = [
    orgaPlayer, ...confirmedParticipants, 
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true, profiles: { name: i.invitee_name || i.invited_name || 'Invité' } }))
  ]
  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const ambiance = AMBIANCE_CONFIG[match?.ambiance] || AMBIANCE_CONFIG.mix

  const canJoin = !isOrganizer() && !isParticipant() && !participants.some(p => p.user_id === user?.id && p.status === 'pending') && getSpotsLeft() > 0 && match?.status === 'open'
  const hasPendingActions = pendingRequests.length > 0 || pendingInvites.filter(i => i.daysSince >= 2).length > 0

  // === COMPOSANTS INTERNES ===
  function Avatar({ player, size = 40, index = 0, onClick }) {
    const bgColor = PLAYER_COLORS[index % 4]
    const profile = player?.profiles || player
    const radius = Math.round(size * 0.28) // Carré arrondi
    
    if (!profile?.name) {
      return (
        <div style={{
          width: size, height: size, borderRadius: radius,
          background: 'transparent', border: '2px dashed rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, color: 'rgba(255,255,255,0.4)', flexShrink: 0
        }}>+</div>
      )
    }
    
    if (profile.avatar_url) {
      return (
        <img src={profile.avatar_url} alt={profile.name} onClick={onClick} style={{
          width: size, height: size, borderRadius: radius, objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: onClick ? 'pointer' : 'default', flexShrink: 0
        }} />
      )
    }
    
    return (
      <div onClick={onClick} style={{
        width: size, height: size, borderRadius: radius, background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 700, color: COLORS.white,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: onClick ? 'pointer' : 'default', flexShrink: 0
      }}>
        {profile.name[0].toUpperCase()}
      </div>
    )
  }

  function PlayerCard({ player, index = 0, onClickPlayer, onClickEmpty }) {
    const isEmpty = !player
    const isPendingInvite = player?.isPendingInvite
    const profile = player?.profiles || player
    const bgColor = PLAYER_COLORS[index % 4]
    const position = POSITION_LABELS[profile?.position] || null

    if (isEmpty) {
      return (
        <div onClick={onClickEmpty} className="player-card-empty" style={{
          background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.2)',
          borderRadius: 16, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          cursor: onClickEmpty ? 'pointer' : 'default', transition: `all 0.3s ${SPRING}`
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, border: '2px dashed rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(255,255,255,0.4)'
          }}>+</div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Place libre</span>
        </div>
      )
    }

    if (isPendingInvite) {
      return (
        <div style={{
          background: 'rgba(255, 180, 0, 0.1)', border: '2px dashed rgba(255, 180, 0, 0.5)',
          borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'rgba(255, 180, 0, 0.2)',
            border: `2px dashed ${COLORS.p2}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: COLORS.p2
          }}>
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.white }}>{profile?.name?.split(' ')[0] || 'Invité'}</div>
            <div style={{ fontSize: 12, color: COLORS.p2, marginTop: 4, fontWeight: 600 }}>⏳ Invitation envoyée</div>
          </div>
        </div>
      )
    }

    return (
      <div onClick={() => onClickPlayer?.(profile)} className="player-card" style={{
        background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)',
        borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14,
        cursor: onClickPlayer ? 'pointer' : 'default', transition: `all 0.3s ${SPRING}`
      }}>
        <Avatar player={player} size={52} index={index} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.white, display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile?.name?.split(' ')[0]}
            {player.isOrganizer && (
              <span style={{ background: COLORS.p2, color: COLORS.ink, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>👑 ORGA</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'flex', gap: 10 }}>
            <span>⭐ Niv. {profile?.level || '?'}</span>
            {position && <span>{position.icon} {position.label}</span>}
          </div>
        </div>
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {PLAYER_COLORS.map((c, i) => <div key={i} className="dot-loading" style={{ width: 14, height: 14, borderRadius: 5, background: c }} />)}
          </div>
          <div style={{ color: COLORS.gray }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.4 }}>
            {PLAYER_COLORS.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />)}
          </div>
          <div style={{ color: COLORS.gray, marginBottom: 16 }}>Partie introuvable</div>
          <Link href="/dashboard/parties" style={{ color: COLORS.p1, fontWeight: 600 }}>← Retour aux parties</Link>
        </div>
      </div>
    )
  }

  const dateParts = formatDateParts(match.match_date)

  // === RENDER ===
  return (
    <div className="match-page">
      <div className="page-container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/dashboard/parties" style={{ fontSize: 14, color: COLORS.gray, textDecoration: 'none', fontWeight: 500 }}>
            ← Retour aux parties
          </Link>
          {(() => {
            const spots = getSpotsLeft()
            if (match.status === 'cancelled') return <span className="status-badge cancelled">❌ Annulée</span>
            if (match.status === 'completed') return <span className="status-badge completed">✅ Terminée</span>
            if (spots === 0) return <span className="status-badge full">✅ Complet</span>
            return <span className="status-badge open">🎾 {spots} place{spots > 1 ? 's' : ''}</span>
          })()}
        </div>

        <div className="page-layout">
          
          {/* === COLONNE PRINCIPALE === */}
          <main className="main-column">
            
            {/* CARTE MATCH 2×2 */}
            <div className="match-card">
              
              {/* Header: Date + Heure + Lieu */}
              <div className="match-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>{dateParts.day}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{dateParts.num}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{dateParts.month}</div>
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2 }}>{formatTime(match.match_time)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>📍</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{match.clubs?.name || match.city || 'Lieu à définir'}</div>
                  {match.clubs?.address && <div style={{ fontSize: 12, opacity: 0.6 }}>{match.clubs.address}</div>}
                </div>
              </div>

              {/* Zone Terrain */}
              <div className="terrain-zone">
                <div className="terrain">
                  {/* Filet central */}
                  <div className="net" />
                  
                  <div className="teams-grid">
                    {/* Équipe A */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="team-label team-a">ÉQUIPE A</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0, 1].map(i => (
                          <PlayerCard key={`a-${i}`} player={teamA[i]} index={i}
                            onClickPlayer={p => setSelectedPlayer(p)}
                            onClickEmpty={isOrganizer() ? () => setModal('invite') : null}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Équipe B */}
                    <div style={{ textAlign: 'center' }}>
                      <div className="team-label team-b">ÉQUIPE B</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0, 1].map(i => (
                          <PlayerCard key={`b-${i}`} player={teamB[i]} index={i + 2}
                            onClickPlayer={p => setSelectedPlayer(p)}
                            onClickEmpty={isOrganizer() ? () => setModal('invite') : null}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges infos */}
                <div className="info-badges">
                  <span className="info-badge">⭐ Niveau {match.level_min || '?'}-{match.level_max || '?'}</span>
                  <span className="info-badge colored" style={{ background: `${ambiance.color}30`, color: ambiance.color }}>
                    {ambiance.emoji} {ambiance.label}
                  </span>
                  {pricePerPerson > 0 && <span className="info-badge">💰 {pricePerPerson}€/pers</span>}
                </div>

                {/* Logo 2×2 */}
                <div className="logo-container">
                  <div className="logo-pill">
                    <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.white, letterSpacing: -0.5 }}>2×2</span>
                    <FourDots size={8} gap={5} />
                  </div>
                </div>
              </div>

              {/* Bouton Inviter */}
              <div className="invite-bar">
                <button onClick={() => setModal('share')} className="btn-invite">
                  <span>📤</span> Inviter des joueurs
                </button>
              </div>
            </div>

            {/* Bouton Rejoindre (si visiteur) */}
            {canJoin && (
              <button onClick={() => setModal('join')} className="btn-join-main">
                🎾 Rejoindre cette partie
              </button>
            )}

            {/* ACTIONS EN ATTENTE */}
            {isOrganizer() && hasPendingActions && (
              <div className="pending-section">
                <div className="pending-header">
                  <h3>🔔 Actions en attente</h3>
                  <span className="pending-count">{pendingRequests.length + pendingInvites.filter(i => i.daysSince >= 2).length}</span>
                </div>

                {/* Demandes de joueurs */}
                {pendingRequests.map((req, i) => (
                  <div key={req.id} className="pending-item">
                    <Avatar player={req} size={46} index={i} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: 15, color: COLORS.ink }}>{req.profiles?.name} veut rejoindre</strong>
                      <span style={{ fontSize: 13, color: COLORS.gray }}>Niveau {req.profiles?.level || '?'} · Équipe {req.team}</span>
                    </div>
                    <div className="pending-actions">
                      <button onClick={() => acceptRequest(req)} className="btn-accept">Accepter</button>
                      <button onClick={() => refuseRequest(req)} className="btn-refuse">Refuser</button>
                    </div>
                  </div>
                ))}

                {/* Invitations sans réponse */}
                {pendingInvites.filter(i => i.daysSince >= 2).map((inv) => (
                  <div key={inv.id} className="pending-item warning">
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, background: COLORS.p2, color: COLORS.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700
                    }}>
                      {(inv.invitee_name || inv.invited_name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: 15, color: COLORS.ink }}>{inv.invitee_name || inv.invited_name || 'Invité'} n'a pas répondu</strong>
                      {inv.invitee_email && <span style={{ fontSize: 12, color: COLORS.p3, display: 'block', marginBottom: 2 }}>✉️ {inv.invitee_email}</span>}
                      <span style={{ fontSize: 13, color: COLORS.p2, fontWeight: 500 }}>⏳ Invité il y a {inv.daysSince} jours</span>
                    </div>
                    <div className="pending-actions">
                      <button onClick={() => resendInvite(inv)} className="btn-refuse">Relancer</button>
                      <button onClick={() => cancelInvite(inv)} className="btn-refuse">Annuler</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHAT */}
            {(isOrganizer() || isParticipant()) && (
              <div className="chat-section">
                <div className="section-bar" style={{ background: COLORS.ink }} />
                <div className="section-content">
                  <h3 className="section-title">💬 Discussion</h3>
                  
                  <div className="messages-container">
                    {messages.length === 0 ? (
                      <div className="empty-messages">Aucun message. Lancez la conversation !</div>
                    ) : messages.map((msg, i) => (
                      <div key={msg.id} className="message-item">
                        <Avatar player={msg} size={38} index={i % 4} />
                        <div style={{ flex: 1 }}>
                          <div className="message-header">
                            {msg.profiles?.name}
                            <span className="message-time">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="message-text">{msg.message}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={sendMessage} className="message-form">
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Écrire un message..." className="message-input" />
                    <button type="submit" className="btn-send">Envoyer</button>
                  </form>
                </div>
              </div>
            )}
          </main>

          {/* === SIDEBAR === */}
          <aside className="sidebar">
            
            {/* Partager la partie */}
            <div className="sidebar-card">
              <div className="section-bar" style={{ background: COLORS.p3 }} />
              <div className="section-content">
                <div className="sidebar-title">📤 Partager la partie</div>
                <button onClick={copyShareLink} className="btn-copy-link">
                  {copied ? '✓ Copié !' : '🔗 Copier le lien'}
                </button>
                <div className="share-grid">
                  {[
                    { icon: '💬', label: 'WhatsApp', action: () => shareVia('whatsapp') },
                    { icon: '✉️', label: 'SMS', action: () => shareVia('sms') },
                    { icon: '📧', label: 'Email', action: () => shareVia('email') },
                    { icon: '📱', label: 'QR', action: () => setModal('qr') }
                  ].map((opt, i) => (
                    <div key={i} onClick={opt.action} className="share-option">
                      <div style={{ fontSize: 20 }}>{opt.icon}</div>
                      <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 4 }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            {(isOrganizer() || isParticipant()) && (
              <div className="sidebar-card">
                <div className="section-bar" style={{ background: COLORS.p1 }} />
                <div className="section-content">
                  <div className="sidebar-title">⚡ Actions rapides</div>
                  <div className="quick-actions">
                    {isOrganizer() && (
                      <Link href={`/dashboard/matches/create?edit=${matchId}`} className="quick-action">
                        <div className="quick-icon" style={{ background: COLORS.p1Soft }}>✏️</div>
                        <div><strong>Modifier la partie</strong><span>Date, lieu, niveau...</span></div>
                      </Link>
                    )}
                    {isOrganizer() && (
                      <Link href={`/dashboard/joueurs?match=${matchId}`} className="quick-action">
                        <div className="quick-icon" style={{ background: COLORS.p3Soft }}>👥</div>
                        <div><strong>Inviter depuis mes contacts</strong><span>Joueurs favoris, récents</span></div>
                      </Link>
                    )}
                    {match.clubs?.id && (
                      <Link href={`/clubs/${match.clubs.id}`} className="quick-action">
                        <div className="quick-icon" style={{ background: COLORS.p2Soft }}>🗺️</div>
                        <div><strong>Voir le club</strong><span>Itinéraire, infos</span></div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Organisateur */}
            <div className="sidebar-card">
              <div className="section-bar" style={{ background: COLORS.p2 }} />
              <div className="section-content">
                <div className="sidebar-title">👑 Organisateur</div>
                <div className="orga-info">
                  <Avatar player={{ profiles: match.profiles }} size={56} index={0} />
                  <div>
                    <strong>{match.profiles?.name}</strong>
                    <span>Niveau {match.profiles?.level || '?'}</span>
                  </div>
                </div>
                {!isOrganizer() && match.profiles?.phone && (
                  <div className="orga-actions">
                    <a href={`tel:${match.profiles.phone}`} className="orga-btn">📱 Appeler</a>
                    <a href={`sms:${match.profiles.phone}`} className="orga-btn">💬 Message</a>
                  </div>
                )}
              </div>
            </div>

            {/* Zone Danger */}
            {(isOrganizer() || isParticipant()) && (
              <div className="sidebar-card danger">
                <div className="section-bar" style={{ background: COLORS.p1 }} />
                <div className="section-content">
                  <div className="sidebar-title danger">⚠️ Zone danger</div>
                  <div className="danger-actions">
                    {isOrganizer() && <button onClick={() => setModal('cancel')} className="btn-danger">❌ Annuler la partie</button>}
                    {isParticipant() && !isOrganizer() && <button onClick={() => setModal('leave')} className="btn-leave">🚪 Quitter la partie</button>}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* === MODALS === */}
      
      {/* Modal Rejoindre */}
      {modal === 'join' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🎾 Rejoindre la partie</h3>
            <p className="modal-subtitle">Choisis ton équipe préférée</p>
            <div className="team-buttons">
              {['A', 'B'].map(team => (
                <button key={team} onClick={() => setJoinTeam(team)} className={`team-btn ${joinTeam === team ? 'active' : ''} ${team.toLowerCase()}`}>
                  Équipe {team}
                </button>
              ))}
            </div>
            <button onClick={requestToJoin} className="btn-modal-primary">Envoyer ma demande</button>
            <button onClick={() => setModal(null)} className="btn-modal-cancel">Annuler</button>
          </div>
        </div>
      )}

      {/* Modal Partager */}
      {modal === 'share' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">📤 Partager la partie</h3>
            <p className="modal-subtitle">{formatDateFull(match.match_date)} à {formatTime(match.match_time)}</p>
            
            <div className="share-url-box">
              <div className="share-url">{getShareUrl()}</div>
              <button onClick={copyShareLink} className="btn-copy">{copied ? '✓' : 'Copier'}</button>
            </div>
            
            <div className="share-modal-grid">
              {[
                { icon: '💬', label: 'WhatsApp', color: '#25D366', action: () => shareVia('whatsapp') },
                { icon: '✉️', label: 'SMS', color: COLORS.p3, action: () => shareVia('sms') },
                { icon: '📧', label: 'Email', color: COLORS.ink, action: () => shareVia('email') }
              ].map((opt, i) => (
                <button key={i} onClick={opt.action} className="share-modal-btn">
                  <span style={{ fontSize: 28 }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            
            {isOrganizer() && (
              <Link href={`/dashboard/joueurs?match=${matchId}`} className="btn-contacts">
                👥 Inviter depuis mes contacts
              </Link>
            )}
            
            <button onClick={() => setModal(null)} className="btn-modal-close">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Annuler */}
      {modal === 'cancel' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box center" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 className="modal-title">Annuler cette partie ?</h3>
            <p className="modal-subtitle">Les participants seront notifiés de l'annulation.</p>
            <button onClick={cancelMatch} className="btn-modal-danger">Oui, annuler</button>
            <button onClick={() => setModal(null)} className="btn-modal-close">Non, garder</button>
          </div>
        </div>
      )}

      {/* Modal Quitter */}
      {modal === 'leave' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box center" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h3 className="modal-title">Quitter cette partie ?</h3>
            <p className="modal-subtitle">Ta place sera libérée pour un autre joueur.</p>
            <button onClick={leaveMatch} className="btn-modal-danger">Oui, quitter</button>
            <button onClick={() => setModal(null)} className="btn-modal-close">Non, rester</button>
          </div>
        </div>
      )}

      {/* Modal Profil Joueur */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-box center small" onClick={e => e.stopPropagation()}>
            <Avatar player={{ profiles: selectedPlayer }} size={80} index={0} />
            <h3 className="modal-title" style={{ marginTop: 16 }}>{selectedPlayer.name}</h3>
            <div style={{ fontSize: 14, color: COLORS.gray, marginBottom: 8 }}>⭐ Niveau {selectedPlayer.level || '?'}</div>
            {selectedPlayer.position && (
              <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>
                {POSITION_LABELS[selectedPlayer.position]?.icon} {POSITION_LABELS[selectedPlayer.position]?.label}
              </div>
            )}
            <Link href={`/player/${selectedPlayer.id}`} className="btn-modal-primary">Voir le profil</Link>
            <button onClick={() => setSelectedPlayer(null)} className="btn-modal-close">Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Invite (pour organisateur) */}
      {modal === 'invite' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box large" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">👥 Ajouter un joueur</h3>
            
            <div className="invite-form">
              <div className="invite-form-title">✉️ Inviter quelqu'un</div>
              
              <div className="invite-inputs">
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Prénom *" className="invite-input" />
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email (optionnel)" className="invite-input" />
              </div>
              
              <div className="invite-team-select">
                <button onClick={() => setInviteTeam('A')} className={`invite-team-btn a ${inviteTeam === 'A' ? 'active' : ''}`}>🅰️ Équipe A</button>
                <button onClick={() => setInviteTeam('B')} className={`invite-team-btn b ${inviteTeam === 'B' ? 'active' : ''}`}>🅱️ Équipe B</button>
              </div>
              
              <button onClick={sendEmailInvite} disabled={!inviteName.trim() || inviteSending} className="btn-invite-send" style={{
                background: inviteName.trim() ? (inviteEmail.trim() ? COLORS.p3 : COLORS.ink) : '#e5e5e5',
                color: inviteName.trim() ? '#fff' : '#999', cursor: inviteName.trim() ? 'pointer' : 'not-allowed'
              }}>
                {inviteSending ? '⏳ Envoi...' : inviteEmail.trim() ? '📤 Ajouter et envoyer l\'invitation' : '+ Ajouter à la partie'}
              </button>
              
              <p className="invite-hint">💡 {inviteEmail.trim() ? "Cette personne recevra un email pour rejoindre" : "Ajoute un email pour envoyer une invitation automatique"}</p>
            </div>
            
            <div className="invite-separator"><span>ou</span></div>
            
            <Link href={`/dashboard/joueurs?match=${matchId}`} className="invite-option">
              <div className="invite-option-icon" style={{ background: COLORS.p3Soft }}>⭐</div>
              <div><strong>Mes joueurs favoris</strong><span>Invite tes partenaires habituels</span></div>
            </Link>
            
            <button onClick={() => { setModal('share') }} className="invite-option">
              <div className="invite-option-icon" style={{ background: COLORS.p1Soft }}>📤</div>
              <div><strong>Partager un lien</strong><span>WhatsApp, SMS, copier le lien...</span></div>
            </button>
            
            <button onClick={() => setModal(null)} className="btn-modal-cancel">Annuler</button>
          </div>
        </div>
      )}

      {/* === STYLES === */}
      <style jsx global>{`
        @keyframes dot-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }
        
        @keyframes dot-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .dot-loading { animation: dot-loading 1.4s ease-in-out infinite; }
        .dot-loading:nth-child(1) { animation-delay: 0s; }
        .dot-loading:nth-child(2) { animation-delay: 0.1s; }
        .dot-loading:nth-child(3) { animation-delay: 0.2s; }
        .dot-loading:nth-child(4) { animation-delay: 0.3s; }
        
        .match-page {
          font-family: 'Satoshi', -apple-system, sans-serif;
          background: ${COLORS.bg};
          min-height: 100vh;
          padding: 16px;
        }
        
        .page-container { max-width: 1100px; margin: 0 auto; }
        .page-layout { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }
        .main-column { min-width: 0; }
        .sidebar { display: flex; flex-direction: column; gap: 20px; }
        
        /* Status badges */
        .status-badge { padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; }
        .status-badge.cancelled { background: ${COLORS.p1Soft}; color: ${COLORS.p1}; }
        .status-badge.completed { background: ${COLORS.p3Soft}; color: ${COLORS.p3}; }
        .status-badge.full { background: ${COLORS.bgSoft}; color: ${COLORS.gray}; }
        .status-badge.open { background: ${COLORS.p3Soft}; color: ${COLORS.p3}; }
        
        /* Match Card */
        .match-card { background: ${COLORS.card}; border-radius: 24px; overflow: hidden; margin-bottom: 24px; }
        .match-header { background: ${COLORS.ink}; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; color: ${COLORS.white}; flex-wrap: wrap; gap: 16px; }
        .terrain-zone { background: ${COLORS.cardDark}; padding: 28px 20px; }
        .terrain { border: 2px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 28px 16px; position: relative; background: rgba(0,0,0,0.15); }
        .net { position: absolute; left: 50%; top: 24px; bottom: 24px; width: 2px; background: rgba(255,255,255,0.25); transform: translateX(-50%); }
        .teams-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .team-label { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 5px 16px; border-radius: 100px; margin-bottom: 18px; }
        .team-label.team-a { background: rgba(255, 90, 95, 0.25); color: ${COLORS.p1}; }
        .team-label.team-b { background: rgba(255, 180, 0, 0.25); color: ${COLORS.p2}; }
        
        .info-badges { display: flex; justify-content: center; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
        .info-badge { background: rgba(255,255,255,0.1); padding: 10px 18px; border-radius: 100px; font-size: 13px; color: rgba(255,255,255,0.9); }
        
        .logo-container { display: flex; justify-content: center; margin-top: 24px; }
        .logo-pill { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 10px 22px; border-radius: 100px; }
        
        .invite-bar { background: ${COLORS.ink}; padding: 16px 24px; display: flex; justify-content: center; }
        .btn-invite { display: flex; align-items: center; gap: 10px; background: ${COLORS.p3}; color: ${COLORS.white}; padding: 14px 28px; border-radius: 100px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 16px ${COLORS.p3Glow}; }
        
        .btn-join-main { width: 100%; padding: 18px; background: ${COLORS.ink}; color: ${COLORS.white}; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 24px; }
        
        /* Pending section */
        .pending-section { background: ${COLORS.p1Soft}; border: 2px solid ${COLORS.p1}; border-radius: 20px; padding: 22px; margin-bottom: 24px; }
        .pending-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .pending-header h3 { font-size: 16px; font-weight: 700; margin: 0; color: ${COLORS.ink}; }
        .pending-count { background: ${COLORS.p1}; color: ${COLORS.white}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .pending-item { display: flex; align-items: center; gap: 14px; background: ${COLORS.white}; padding: 14px 16px; border-radius: 14px; margin-bottom: 12px; }
        .pending-item.warning { border-left: 4px solid ${COLORS.p2}; }
        .pending-actions { display: flex; gap: 8px; }
        .btn-accept { padding: 10px 18px; background: ${COLORS.p3}; color: ${COLORS.white}; border: none; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-refuse { padding: 10px 16px; background: ${COLORS.bgSoft}; color: ${COLORS.gray}; border: none; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; }
        
        /* Chat */
        .chat-section { display: flex; background: ${COLORS.card}; border-radius: 20px; overflow: hidden; margin-bottom: 24px; }
        .section-bar { width: 5px; flex-shrink: 0; }
        .section-content { flex: 1; padding: 22px; }
        .section-title { font-size: 16px; font-weight: 700; margin: 0 0 18px; color: ${COLORS.ink}; display: flex; align-items: center; gap: 10px; }
        .messages-container { max-height: 280px; overflow-y: auto; margin-bottom: 18px; }
        .empty-messages { text-align: center; padding: 40px 20px; color: ${COLORS.muted}; font-size: 14px; background: ${COLORS.bgSoft}; border-radius: 12px; }
        .message-item { display: flex; gap: 12px; margin-bottom: 16px; }
        .message-header { font-size: 14px; font-weight: 600; color: ${COLORS.ink}; }
        .message-time { font-weight: 400; color: ${COLORS.muted}; font-size: 12px; margin-left: 8px; }
        .message-text { font-size: 14px; color: ${COLORS.dark}; margin-top: 4px; line-height: 1.5; }
        .message-form { display: flex; gap: 12px; }
        .message-input { flex: 1; padding: 14px 20px; border: 2px solid ${COLORS.border}; border-radius: 100px; font-size: 14px; font-family: inherit; }
        .message-input:focus { outline: none; border-color: ${COLORS.ink}; }
        .btn-send { padding: 14px 26px; background: ${COLORS.ink}; color: ${COLORS.white}; border: none; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; }
        
        /* Sidebar */
        .sidebar-card { display: flex; background: ${COLORS.card}; border-radius: 20px; overflow: hidden; }
        .sidebar-card.danger { border: 2px solid ${COLORS.p1}; }
        .sidebar-title { font-size: 14px; font-weight: 700; color: ${COLORS.ink}; margin-bottom: 16px; }
        .sidebar-title.danger { color: ${COLORS.p1}; }
        
        .btn-copy-link { width: 100%; padding: 16px; background: ${COLORS.p3}; color: ${COLORS.white}; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px; }
        .share-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .share-option { padding: 12px 8px; background: ${COLORS.bgSoft}; border: 1px solid ${COLORS.border}; border-radius: 12px; text-align: center; cursor: pointer; }
        
        .quick-actions { display: flex; flex-direction: column; gap: 10px; }
        .quick-action { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: ${COLORS.bgSoft}; border-radius: 12px; cursor: pointer; text-decoration: none; border: none; width: 100%; text-align: left; }
        .quick-action:hover { background: ${COLORS.border}; }
        .quick-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .quick-action strong { display: block; font-size: 14px; color: ${COLORS.ink}; }
        .quick-action span { font-size: 12px; color: ${COLORS.gray}; }
        
        .orga-info { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .orga-info strong { display: block; font-size: 16px; color: ${COLORS.ink}; }
        .orga-info span { font-size: 13px; color: ${COLORS.gray}; }
        .orga-actions { display: flex; gap: 10px; }
        .orga-btn { flex: 1; padding: 12px; background: ${COLORS.bgSoft}; border: 1px solid ${COLORS.border}; border-radius: 12px; font-size: 13px; font-weight: 600; color: ${COLORS.gray}; text-align: center; text-decoration: none; }
        
        .danger-actions { display: flex; flex-direction: column; gap: 10px; }
        .btn-danger { padding: 14px; background: ${COLORS.p1Soft}; color: ${COLORS.p1}; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .btn-leave { padding: 14px; background: ${COLORS.bgSoft}; color: ${COLORS.gray}; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        
        /* Modals */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: ${COLORS.card}; border-radius: 28px; padding: 28px; width: 100%; max-width: 380px; }
        .modal-box.center { text-align: center; }
        .modal-box.small { max-width: 340px; }
        .modal-box.large { max-width: 420px; max-height: 90vh; overflow-y: auto; }
        .modal-title { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: ${COLORS.ink}; text-align: center; }
        .modal-subtitle { font-size: 14px; color: ${COLORS.gray}; margin: 0 0 20px; text-align: center; }
        
        .team-buttons { display: flex; gap: 12px; margin-bottom: 24px; }
        .team-btn { flex: 1; padding: 18px; background: ${COLORS.bgSoft}; color: ${COLORS.gray}; border: 2px solid ${COLORS.border}; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; }
        .team-btn.active.a { background: ${COLORS.p1}; color: ${COLORS.white}; border-color: ${COLORS.p1}; }
        .team-btn.active.b { background: ${COLORS.p2}; color: ${COLORS.white}; border-color: ${COLORS.p2}; }
        
        .btn-modal-primary { width: 100%; padding: 18px; background: ${COLORS.ink}; color: ${COLORS.white}; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 12px; text-decoration: none; display: block; text-align: center; }
        .btn-modal-danger { width: 100%; padding: 16px; background: ${COLORS.p1}; color: ${COLORS.white}; border: none; border-radius: 100px; font-size: 15px; font-weight: 700; cursor: pointer; margin-bottom: 12px; }
        .btn-modal-cancel { width: 100%; margin-top: 8px; background: none; border: none; color: ${COLORS.muted}; font-size: 14px; cursor: pointer; padding: 8px; }
        .btn-modal-close { width: 100%; padding: 14px; background: ${COLORS.bgSoft}; color: ${COLORS.gray}; border: none; border-radius: 100px; font-size: 14px; cursor: pointer; margin-top: 12px; }
        
        .share-url-box { display: flex; gap: 10px; padding: 12px; background: ${COLORS.bgSoft}; border-radius: 14px; margin-bottom: 20px; }
        .share-url { flex: 1; padding: 12px 14px; background: ${COLORS.card}; border-radius: 10px; font-size: 13px; color: ${COLORS.gray}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-copy { padding: 14px 20px; background: ${COLORS.ink}; color: ${COLORS.white}; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
        
        .share-modal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .share-modal-btn { padding: 16px; background: ${COLORS.bgSoft}; border: 1px solid ${COLORS.border}; border-radius: 14px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: ${COLORS.gray}; }
        
        .btn-contacts { display: block; padding: 16px; background: ${COLORS.p3}; color: ${COLORS.white}; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; text-align: center; margin-bottom: 12px; }
        
        /* Invite modal */
        .invite-form { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 2px solid #e2e8f0; }
        .invite-form-title { font-size: 14px; font-weight: 700; color: ${COLORS.ink}; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .invite-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .invite-input { padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; }
        .invite-input:focus { border-color: ${COLORS.ink}; }
        .invite-team-select { display: flex; gap: 8px; margin-bottom: 14px; }
        .invite-team-btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; background: #f1f5f9; color: #64748b; }
        .invite-team-btn.active.a { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
        .invite-team-btn.active.b { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
        .btn-invite-send { width: 100%; padding: 14px; border: none; border-radius: 12px; font-weight: 700; font-size: 14px; }
        .invite-hint { font-size: 12px; color: ${COLORS.gray}; margin-top: 10px; text-align: center; }
        .invite-separator { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
        .invite-separator::before, .invite-separator::after { content: ''; flex: 1; height: 1px; background: ${COLORS.border}; }
        .invite-separator span { font-size: 12px; color: ${COLORS.muted}; }
        .invite-option { display: flex; align-items: center; gap: 14px; padding: 16px; background: ${COLORS.bgSoft}; border-radius: 14px; text-decoration: none; margin-bottom: 12px; border: none; width: 100%; text-align: left; cursor: pointer; }
        .invite-option-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .invite-option strong { display: block; font-size: 15px; color: ${COLORS.ink}; }
        .invite-option span { font-size: 13px; color: ${COLORS.gray}; }
        
        .player-card:hover { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.25) !important; }
        .player-card-empty:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.3) !important; }
        
        /* Responsive */
        @media (max-width: 900px) {
          .page-layout { grid-template-columns: 1fr; }
          .sidebar { order: 1; }
        }
        
        @media (max-width: 600px) {
          .teams-grid { grid-template-columns: 1fr; gap: 24px; }
          .pending-item { flex-direction: column; align-items: flex-start !important; gap: 12px !important; }
          .pending-actions { width: 100%; display: flex; gap: 8px; }
          .pending-actions button { flex: 1; }
          .invite-inputs { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}