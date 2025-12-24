'use client'

/**
 * ============================================
 * PAGE MATCH DETAIL - JUNTO BRAND v2
 * ============================================
 * 
 * Structure:
 * 1. Carte Match (header + terrain + logo + bouton inviter)
 * 2. Actions en attente (organisateur)
 * 3. Chat Junto
 * 4. Sidebar (partager, actions, orga, danger)
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// === JUNTO DESIGN TOKENS ===
const JUNTO = {
  coral: '#ff5a5f',
  slate: '#3d4f5f',
  amber: '#ffb400',
  teal: '#00b8a9',
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  white: '#ffffff',
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  border: '#e5e7eb',
  coralSoft: '#fff0f0',
  tealSoft: '#e5f9f7',
  amberSoft: '#fff8e5',
  slateSoft: '#f0f3f5',
  coralGlow: 'rgba(255, 90, 95, 0.25)',
  tealGlow: 'rgba(0, 184, 169, 0.25)',
}

const AVATAR_COLORS = [JUNTO.coral, JUNTO.slate, JUNTO.amber, JUNTO.teal]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

const AMBIANCE_CONFIG = {
  chill: { label: 'Détente', emoji: '😌', color: JUNTO.teal },
  mix: { label: 'Équilibré', emoji: '⚡', color: JUNTO.amber },
  competition: { label: 'Compétition', emoji: '🔥', color: JUNTO.coral }
}

const POSITION_LABELS = {
  left: { label: 'Gauche', icon: '⬅️' },
  right: { label: 'Droite', icon: '➡️' },
  both: { label: 'Les deux', icon: '↔️' }
}

export default function MatchDetailPage() {
  const router = useRouter()
  const { id: matchId } = useParams()
  const messagesEndRef = useRef(null)

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
  
  // États pour invitation par email
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
  
  function getPlayerCount() { 
    return confirmedParticipants.length + 1 + pendingInvites.length 
  }
  
  function getSpotsLeft() { 
    return Math.max(0, 4 - getPlayerCount()) 
  }

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

  function formatTime(timeStr) { 
    return timeStr ? timeStr.slice(0, 5) : '--:--' 
  }

  function getShareUrl() {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/join/${matchId}`
    }
    return ''
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  function shareVia(platform) {
    const url = getShareUrl()
    const text = `Rejoins ma partie de padel ! ${formatDateFull(match?.match_date)} à ${formatTime(match?.match_time)}`
    
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      sms: `sms:?body=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent('Partie de padel')}&body=${encodeURIComponent(text + '\n\n' + url)}`
    }
    
    if (links[platform]) {
      window.open(links[platform], '_blank')
    }
  }

  // === ACTIONS ===
  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    const messageText = newMessage.trim()
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      match_id: parseInt(matchId), 
      user_id: user.id, 
      message: messageText, 
      created_at: new Date().toISOString(), 
      profiles: { id: user.id, name: profile?.name, avatar_url: profile?.avatar_url } 
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
    // TODO: Implement resend logic (SMS/notification)
    alert(`Invitation renvoyée à ${invite.invitee_name || invite.invited_name || invite.invitee_email || 'cet invité'}`)
  }

  async function sendEmailInvite() {
    if (!inviteName.trim()) {
      alert('Indique au moins un prénom')
      return
    }
    
    setInviteSending(true)
    
    try {
      const inviteToken = crypto.randomUUID()
      
      // Créer l'invitation dans la base
      const { error: inviteError } = await supabase
        .from('pending_invites')
        .insert({
          match_id: parseInt(matchId),
          inviter_id: user.id,
          invitee_name: inviteName.trim(),
          invitee_email: inviteEmail.trim() || null,
          team: inviteTeam,
          status: 'pending',
          invite_token: inviteToken
        })
      
      if (inviteError) throw inviteError
      
      // Envoyer l'email si fourni
      if (inviteEmail.trim()) {
        const response = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteToken: inviteToken,
            inviteeName: inviteName.trim(),
            inviteeContact: inviteEmail.trim(),
            inviterName: profile?.name || 'Un joueur',
            matchDate: match?.match_date || null,
            matchTime: match?.match_time || null,
            clubName: match?.clubs?.name || match?.city || 'À définir'
          })
        })
        
        const result = await response.json()
        if (result.success) {
          console.log(`✅ Email envoyé à ${inviteEmail}`)
        }
      }
      
      // Reset et fermer
      setInviteName('')
      setInviteEmail('')
      setInviteTeam('A')
      setModal(null)
      loadData()
      
    } catch (err) {
      console.error('Erreur invitation:', err)
      alert('Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setInviteSending(false)
    }
  }

  async function leaveMatch() {
    await supabase.from('match_participants').delete().eq('match_id', parseInt(matchId)).eq('user_id', user.id)
    setModal(null)
    loadData()
  }

  async function cancelMatch() {
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', parseInt(matchId))
    setModal(null)
    router.push('/dashboard/parties')
  }

  // === PLAYERS DATA ===
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
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true, profiles: { name: i.invitee_name || i.invited_name || 'Invité' } }))
  ]
  
  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const ambiance = AMBIANCE_CONFIG[match?.ambiance] || AMBIANCE_CONFIG.mix

  const canJoin = !isOrganizer() && !isParticipant() && !participants.some(p => p.user_id === user?.id && p.status === 'pending') && getSpotsLeft() > 0 && match?.status === 'open'
  const hasPendingActions = pendingRequests.length > 0 || pendingInvites.filter(i => i.daysSince >= 2).length > 0

  // === COMPONENTS ===
  function Avatar({ player, size = 40, index = 0, onClick }) {
    const bgColor = AVATAR_COLORS[index % 4]
    const profile = player?.profiles || player
    
    if (!profile?.name) {
      return (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'transparent',
          border: '2px dashed rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, color: 'rgba(255,255,255,0.4)',
          flexShrink: 0
        }}>+</div>
      )
    }
    
    if (profile.avatar_url) {
      return (
        <img 
          src={profile.avatar_url} 
          alt={profile.name}
          onClick={onClick}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${bgColor}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            cursor: onClick ? 'pointer' : 'default',
            flexShrink: 0
          }}
        />
      )
    }
    
    return (
      <div 
        onClick={onClick}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: JUNTO.white,
          border: '3px solid rgba(255,255,255,0.2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0
        }}
      >
        {profile.name[0].toUpperCase()}
      </div>
    )
  }

  function PlayerCard({ player, index = 0, onClickPlayer, onClickEmpty }) {
    const isEmpty = !player
    const isPendingInvite = player?.isPendingInvite
    const profile = player?.profiles || player
    const bgColor = AVATAR_COLORS[index % 4]
    const position = POSITION_LABELS[profile?.position] || null

    if (isEmpty) {
      return (
        <div 
          onClick={onClickEmpty}
          className="player-card-empty"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: 16,
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: onClickEmpty ? 'pointer' : 'default',
            transition: `all 0.3s ${SPRING}`
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'rgba(255,255,255,0.4)'
          }}>+</div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Place libre</span>
        </div>
      )
    }

    if (isPendingInvite) {
      return (
        <div style={{
          background: 'rgba(255, 180, 0, 0.1)',
          border: '2px dashed rgba(255, 180, 0, 0.5)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255, 180, 0, 0.2)',
            border: `2px dashed ${JUNTO.amber}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: JUNTO.amber
          }}>
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: JUNTO.white }}>
              {profile?.name?.split(' ')[0] || 'Invité'}
            </div>
            <div style={{ fontSize: 12, color: JUNTO.amber, marginTop: 4, fontWeight: 600 }}>
              ⏳ Invitation envoyée
            </div>
          </div>
        </div>
      )
    }

    return (
      <div 
        onClick={() => onClickPlayer?.(profile)}
        className="player-card"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: onClickPlayer ? 'pointer' : 'default',
          transition: `all 0.3s ${SPRING}`
        }}
      >
        <Avatar player={player} size={52} index={index} />
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 15, fontWeight: 600, color: JUNTO.white,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {profile?.name?.split(' ')[0]}
            {player.isOrganizer && (
              <span style={{
                background: JUNTO.amber, color: JUNTO.ink,
                fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700
              }}>👑 ORGA</span>
            )}
          </div>
          <div style={{ 
            fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4,
            display: 'flex', gap: 10
          }}>
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
            {AVATAR_COLORS.map((c, i) => (
              <div key={i} className="junto-loading-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ color: JUNTO.gray }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, opacity: 0.4 }}>
            {AVATAR_COLORS.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ color: JUNTO.gray, marginBottom: 16 }}>Partie introuvable</div>
          <Link href="/dashboard/parties" style={{ color: JUNTO.coral, fontWeight: 600 }}>← Retour aux parties</Link>
        </div>
      </div>
    )
  }

  const dateParts = formatDateParts(match.match_date)

  // === RENDER ===
  return (
    <div style={{ fontFamily: "'Satoshi', sans-serif", background: JUNTO.bg, minHeight: '100vh', padding: '16px' }}>
      <div className="page-container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/dashboard/parties" style={{ fontSize: 14, color: JUNTO.gray, textDecoration: 'none', fontWeight: 500 }}>
            ← Retour aux parties
          </Link>
          {(() => {
            const spots = getSpotsLeft()
            if (match.status === 'cancelled') return <span style={{ background: JUNTO.coralSoft, color: JUNTO.coral, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>❌ Annulée</span>
            if (match.status === 'completed') return <span style={{ background: JUNTO.tealSoft, color: JUNTO.teal, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>✅ Terminée</span>
            if (spots === 0) return <span style={{ background: JUNTO.bgSoft, color: JUNTO.gray, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>✅ Complet</span>
            return <span style={{ background: JUNTO.tealSoft, color: JUNTO.teal, padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>🎾 {spots} place{spots > 1 ? 's' : ''}</span>
          })()}
        </div>

        <div className="page-layout">
          
          {/* === COLONNE PRINCIPALE === */}
          <main className="main-column">
            
            {/* ======================== */}
            {/* CARTE MATCH JUNTO */}
            {/* ======================== */}
            <div style={{ 
              background: JUNTO.white, 
              borderRadius: 24, 
              border: `2px solid ${JUNTO.border}`,
              overflow: 'hidden',
              marginBottom: 24
            }}>
              
              {/* Header: Date + Heure + Lieu */}
              <div style={{
                background: JUNTO.ink,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: JUNTO.white,
                flexWrap: 'wrap',
                gap: 16
              }}>
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
              <div style={{
                background: `linear-gradient(180deg, ${JUNTO.slate} 0%, #2a3a48 100%)`,
                padding: '28px 20px'
              }}>
                
                {/* Terrain */}
                <div style={{
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  padding: '28px 16px',
                  position: 'relative',
                  background: 'rgba(0,0,0,0.15)'
                }}>
                  {/* Filet central */}
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 24,
                    bottom: 24,
                    width: 2,
                    background: 'rgba(255,255,255,0.25)',
                    transform: 'translateX(-50%)'
                  }} />
                  
                  <div className="teams-grid">
                    {/* Équipe A */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        padding: '5px 16px', borderRadius: 100,
                        background: 'rgba(255, 90, 95, 0.25)',
                        color: JUNTO.coral,
                        marginBottom: 18
                      }}>ÉQUIPE A</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0, 1].map(i => (
                          <PlayerCard 
                            key={`a-${i}`}
                            player={teamA[i]} 
                            index={i}
                            onClickPlayer={p => setSelectedPlayer(p)}
                            onClickEmpty={isOrganizer() ? () => setModal('invite') : null}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Équipe B */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        padding: '5px 16px', borderRadius: 100,
                        background: 'rgba(255, 180, 0, 0.25)',
                        color: JUNTO.amber,
                        marginBottom: 18
                      }}>ÉQUIPE B</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0, 1].map(i => (
                          <PlayerCard 
                            key={`b-${i}`}
                            player={teamB[i]} 
                            index={i + 2}
                            onClickPlayer={p => setSelectedPlayer(p)}
                            onClickEmpty={isOrganizer() ? () => setModal('invite') : null}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badges infos */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 10, 
                  marginTop: 24,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 100, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                    ⭐ Niveau {match.level_min || '?'}-{match.level_max || '?'}
                  </span>
                  <span style={{ background: `${ambiance.color}30`, padding: '10px 18px', borderRadius: 100, fontSize: 13, color: ambiance.color }}>
                    {ambiance.emoji} {ambiance.label}
                  </span>
                  {pricePerPerson > 0 && (
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 100, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                      💰 {pricePerPerson}€/pers
                    </span>
                  )}
                </div>

                {/* Logo Junto */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px 22px',
                    borderRadius: 100
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: JUNTO.white, letterSpacing: -0.5 }}>junto</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {AVATAR_COLORS.map((c, i) => (
                        <div key={i} className="junto-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton Inviter */}
              <div style={{ background: JUNTO.ink, padding: '16px 24px', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => setModal('share')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: JUNTO.teal,
                    color: JUNTO.white,
                    padding: '14px 28px',
                    borderRadius: 100,
                    fontSize: 15,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${JUNTO.tealGlow}`
                  }}
                >
                  <span>📤</span> Inviter des joueurs
                </button>
              </div>
            </div>

            {/* Bouton Rejoindre (si visiteur) */}
            {canJoin && (
              <button 
                onClick={() => setModal('join')}
                style={{
                  width: '100%',
                  padding: 18,
                  background: JUNTO.coral,
                  color: JUNTO.white,
                  border: 'none',
                  borderRadius: 100,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 24,
                  boxShadow: `0 8px 24px ${JUNTO.coralGlow}`
                }}
              >
                🎾 Rejoindre cette partie
              </button>
            )}

            {/* ======================== */}
            {/* ACTIONS EN ATTENTE */}
            {/* ======================== */}
            {isOrganizer() && hasPendingActions && (
              <div style={{
                background: JUNTO.coralSoft,
                border: `2px solid ${JUNTO.coral}`,
                borderRadius: 20,
                padding: 22,
                marginBottom: 24
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  marginBottom: 18 
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: JUNTO.ink }}>
                    🔔 Actions en attente
                  </h3>
                  <span style={{
                    background: JUNTO.coral, color: JUNTO.white,
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700
                  }}>
                    {pendingRequests.length + pendingInvites.filter(i => i.daysSince >= 2).length}
                  </span>
                </div>

                {/* Demandes de joueurs */}
                {pendingRequests.map((req, i) => (
                  <div key={req.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: JUNTO.white,
                    padding: '14px 16px',
                    borderRadius: 14,
                    marginBottom: 12
                  }}>
                    <Avatar player={req} size={46} index={i} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: 15, color: JUNTO.ink }}>
                        {req.profiles?.name} veut rejoindre
                      </strong>
                      <span style={{ fontSize: 13, color: JUNTO.gray }}>
                        Niveau {req.profiles?.level || '?'} · Équipe {req.team}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => acceptRequest(req)} style={{
                        padding: '10px 18px', background: JUNTO.teal, color: JUNTO.white,
                        border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}>Accepter</button>
                      <button onClick={() => refuseRequest(req)} style={{
                        padding: '10px 16px', background: JUNTO.bgSoft, color: JUNTO.gray,
                        border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}>Refuser</button>
                    </div>
                  </div>
                ))}

                {/* Invitations sans réponse */}
                {pendingInvites.filter(i => i.daysSince >= 2).map((inv) => (
                  <div key={inv.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: JUNTO.white,
                    padding: '14px 16px',
                    borderRadius: 14,
                    marginBottom: 12,
                    borderLeft: `4px solid ${JUNTO.amber}`
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: JUNTO.amber, color: JUNTO.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700
                    }}>
                      {(inv.invitee_name || inv.invited_name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: 15, color: JUNTO.ink }}>
                        {inv.invitee_name || inv.invited_name || 'Invité'} n'a pas répondu
                      </strong>
                      {inv.invitee_email && (
                        <span style={{ fontSize: 12, color: JUNTO.teal, display: 'block', marginBottom: 2 }}>
                          ✉️ {inv.invitee_email}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: JUNTO.amber, fontWeight: 500 }}>
                        ⏳ Invité il y a {inv.daysSince} jours
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => resendInvite(inv)} style={{
                        padding: '10px 16px', background: JUNTO.bgSoft, color: JUNTO.gray,
                        border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}>Relancer</button>
                      <button onClick={() => cancelInvite(inv)} style={{
                        padding: '10px 16px', background: JUNTO.bgSoft, color: JUNTO.gray,
                        border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}>Annuler</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ======================== */}
            {/* CHAT JUNTO */}
            {/* ======================== */}
            {(isOrganizer() || isParticipant()) && (
              <div style={{
                display: 'flex',
                background: JUNTO.white,
                borderRadius: 20,
                border: `2px solid ${JUNTO.border}`,
                overflow: 'hidden',
                marginBottom: 24
              }}>
                <div style={{ width: 5, background: JUNTO.slate, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 22 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 18px', color: JUNTO.ink, display: 'flex', alignItems: 'center', gap: 10 }}>
                    💬 Discussion
                  </h3>
                  
                  <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 18 }}>
                    {messages.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px', 
                        color: JUNTO.muted, 
                        fontSize: 14,
                        background: JUNTO.bgSoft,
                        borderRadius: 12
                      }}>
                        Aucun message. Lancez la conversation !
                      </div>
                    ) : messages.map((msg, i) => (
                      <div key={msg.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <Avatar player={msg} size={38} index={i % 4} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: JUNTO.ink }}>
                            {msg.profiles?.name}
                            <span style={{ fontWeight: 400, color: JUNTO.muted, fontSize: 12, marginLeft: 8 }}>
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, color: JUNTO.dark, marginTop: 4, lineHeight: 1.5 }}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={sendMessage} style={{ display: 'flex', gap: 12 }}>
                    <input 
                      value={newMessage} 
                      onChange={e => setNewMessage(e.target.value)} 
                      placeholder="Écrire un message..."
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        border: `2px solid ${JUNTO.border}`,
                        borderRadius: 100,
                        fontSize: 14,
                        fontFamily: "'Satoshi', sans-serif"
                      }}
                    />
                    <button type="submit" style={{
                      padding: '14px 26px',
                      background: JUNTO.coral,
                      color: JUNTO.white,
                      border: 'none',
                      borderRadius: 100,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}>Envoyer</button>
                  </form>
                </div>
              </div>
            )}
          </main>

          {/* === SIDEBAR === */}
          <aside className="sidebar">
            
            {/* Partager la partie */}
            <div style={{
              display: 'flex',
              background: JUNTO.white,
              borderRadius: 20,
              border: `2px solid ${JUNTO.border}`,
              overflow: 'hidden',
              marginBottom: 20
            }}>
              <div style={{ width: 5, background: JUNTO.teal, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: JUNTO.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📤 Partager la partie
                </div>
                <button 
                  onClick={copyShareLink}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: JUNTO.teal,
                    color: JUNTO.white,
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: 14
                  }}
                >
                  {copied ? '✓ Copié !' : '🔗 Copier le lien'}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { icon: '💬', label: 'WhatsApp', action: () => shareVia('whatsapp') },
                    { icon: '✉️', label: 'SMS', action: () => shareVia('sms') },
                    { icon: '📧', label: 'Email', action: () => shareVia('email') },
                    { icon: '📱', label: 'QR', action: () => setModal('qr') }
                  ].map((opt, i) => (
                    <div 
                      key={i}
                      onClick={opt.action}
                      style={{
                        padding: '12px 8px',
                        background: JUNTO.bgSoft,
                        border: `1px solid ${JUNTO.border}`,
                        borderRadius: 12,
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: 20 }}>{opt.icon}</div>
                      <div style={{ fontSize: 10, color: JUNTO.gray, marginTop: 4 }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            {(isOrganizer() || isParticipant()) && (
              <div style={{
                display: 'flex',
                background: JUNTO.white,
                borderRadius: 20,
                border: `2px solid ${JUNTO.border}`,
                overflow: 'hidden',
                marginBottom: 20
              }}>
                <div style={{ width: 5, background: JUNTO.coral, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: JUNTO.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚡ Actions rapides
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {isOrganizer() && (
                      <Link href={`/dashboard/matches/create?edit=${matchId}`} style={{ textDecoration: 'none' }}>
                        <div className="quick-action" style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', background: JUNTO.bgSoft, borderRadius: 12, cursor: 'pointer'
                        }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: JUNTO.coralSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✏️</div>
                          <div>
                            <strong style={{ display: 'block', fontSize: 14, color: JUNTO.ink }}>Modifier la partie</strong>
                            <span style={{ fontSize: 12, color: JUNTO.gray }}>Date, lieu, niveau...</span>
                          </div>
                        </div>
                      </Link>
                    )}
                    {isOrganizer() && (
                      <Link href={`/dashboard/joueurs?match=${matchId}`} style={{ textDecoration: 'none' }}>
                        <div className="quick-action" style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', background: JUNTO.bgSoft, borderRadius: 12, cursor: 'pointer'
                        }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: JUNTO.tealSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👥</div>
                          <div>
                            <strong style={{ display: 'block', fontSize: 14, color: JUNTO.ink }}>Inviter depuis mes contacts</strong>
                            <span style={{ fontSize: 12, color: JUNTO.gray }}>Joueurs favoris, récents</span>
                          </div>
                        </div>
                      </Link>
                    )}
                    {match.clubs?.id && (
                      <Link href={`/clubs/${match.clubs.id}`} style={{ textDecoration: 'none' }}>
                        <div className="quick-action" style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', background: JUNTO.bgSoft, borderRadius: 12, cursor: 'pointer'
                        }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: JUNTO.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗺️</div>
                          <div>
                            <strong style={{ display: 'block', fontSize: 14, color: JUNTO.ink }}>Voir le club</strong>
                            <span style={{ fontSize: 12, color: JUNTO.gray }}>Itinéraire, infos</span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Organisateur */}
            <div style={{
              display: 'flex',
              background: JUNTO.white,
              borderRadius: 20,
              border: `2px solid ${JUNTO.border}`,
              overflow: 'hidden',
              marginBottom: 20
            }}>
              <div style={{ width: 5, background: JUNTO.amber, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: JUNTO.ink, marginBottom: 16 }}>
                  👑 Organisateur
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <Avatar player={{ profiles: match.profiles }} size={56} index={0} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 16, color: JUNTO.ink }}>{match.profiles?.name}</strong>
                    <span style={{ fontSize: 13, color: JUNTO.gray }}>Niveau {match.profiles?.level || '?'}</span>
                  </div>
                </div>
                {!isOrganizer() && match.profiles?.phone && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={`tel:${match.profiles.phone}`} style={{
                      flex: 1, padding: 12, background: JUNTO.bgSoft, border: `1px solid ${JUNTO.border}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600, color: JUNTO.gray, textAlign: 'center', textDecoration: 'none'
                    }}>📱 Appeler</a>
                    <a href={`sms:${match.profiles.phone}`} style={{
                      flex: 1, padding: 12, background: JUNTO.bgSoft, border: `1px solid ${JUNTO.border}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600, color: JUNTO.gray, textAlign: 'center', textDecoration: 'none'
                    }}>💬 Message</a>
                  </div>
                )}
              </div>
            </div>

            {/* Zone Danger */}
            {(isOrganizer() || isParticipant()) && (
              <div style={{
                display: 'flex',
                background: JUNTO.white,
                borderRadius: 20,
                border: `2px solid ${JUNTO.coral}`,
                overflow: 'hidden'
              }}>
                <div style={{ width: 5, background: JUNTO.coral, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: JUNTO.coral, marginBottom: 16 }}>
                    ⚠️ Zone danger
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {isOrganizer() && (
                      <button onClick={() => setModal('cancel')} style={{
                        padding: 14, background: JUNTO.coralSoft, color: JUNTO.coral,
                        border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center'
                      }}>❌ Annuler la partie</button>
                    )}
                    {isParticipant() && !isOrganizer() && (
                      <button onClick={() => setModal('leave')} style={{
                        padding: 14, background: JUNTO.bgSoft, color: JUNTO.gray,
                        border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center'
                      }}>🚪 Quitter la partie</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ======================== */}
      {/* MODALS */}
      {/* ======================== */}

      {/* Modal Rejoindre */}
      {modal === 'join' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px', color: JUNTO.ink, textAlign: 'center' }}>🎾 Rejoindre la partie</h3>
            <p style={{ fontSize: 14, color: JUNTO.gray, marginBottom: 20, textAlign: 'center' }}>Choisis ton équipe préférée</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {['A', 'B'].map(team => (
                <button key={team} onClick={() => setJoinTeam(team)} style={{
                  flex: 1, padding: 18,
                  background: joinTeam === team ? (team === 'A' ? JUNTO.coral : JUNTO.amber) : JUNTO.bgSoft,
                  color: joinTeam === team ? JUNTO.white : JUNTO.gray,
                  border: `2px solid ${joinTeam === team ? (team === 'A' ? JUNTO.coral : JUNTO.amber) : JUNTO.border}`,
                  borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer'
                }}>Équipe {team}</button>
              ))}
            </div>
            <button onClick={requestToJoin} style={{ width: '100%', padding: 18, background: JUNTO.teal, color: JUNTO.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Envoyer ma demande
            </button>
            <button onClick={() => setModal(null)} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: JUNTO.muted, fontSize: 14, cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal Partager */}
      {modal === 'share' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: JUNTO.ink, textAlign: 'center' }}>📤 Inviter des joueurs</h3>
            <p style={{ fontSize: 14, color: JUNTO.gray, marginBottom: 24, textAlign: 'center' }}>Partage ce lien pour inviter des joueurs</p>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{
                flex: 1, padding: '14px 18px',
                background: JUNTO.bgSoft, border: `1px solid ${JUNTO.border}`,
                borderRadius: 12, fontSize: 13, color: JUNTO.gray,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {getShareUrl()}
              </div>
              <button onClick={copyShareLink} style={{
                padding: '14px 20px', background: JUNTO.ink, color: JUNTO.white,
                border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
                {copied ? '✓' : 'Copier'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '💬', label: 'WhatsApp', color: '#25D366', action: () => shareVia('whatsapp') },
                { icon: '✉️', label: 'SMS', color: JUNTO.teal, action: () => shareVia('sms') },
                { icon: '📧', label: 'Email', color: JUNTO.slate, action: () => shareVia('email') }
              ].map((opt, i) => (
                <button key={i} onClick={opt.action} style={{
                  padding: 16, background: JUNTO.bgSoft, border: `1px solid ${JUNTO.border}`,
                  borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                }}>
                  <span style={{ fontSize: 28 }}>{opt.icon}</span>
                  <span style={{ fontSize: 12, color: JUNTO.gray }}>{opt.label}</span>
                </button>
              ))}
            </div>
            
            {isOrganizer() && (
              <Link href={`/dashboard/joueurs?match=${matchId}`} style={{
                display: 'block', padding: 16, background: JUNTO.teal, color: JUNTO.white,
                borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 12
              }}>
                👥 Inviter depuis mes contacts
              </Link>
            )}
            
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 14, background: JUNTO.bgSoft, color: JUNTO.gray, border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Annuler */}
      {modal === 'cancel' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: JUNTO.ink }}>Annuler cette partie ?</h3>
            <p style={{ fontSize: 14, color: JUNTO.gray, marginBottom: 24 }}>Les participants seront notifiés de l'annulation.</p>
            <button onClick={cancelMatch} style={{ width: '100%', padding: 16, background: JUNTO.coral, color: JUNTO.white, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Oui, annuler</button>
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 14, background: JUNTO.bgSoft, color: JUNTO.gray, border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer' }}>Non, garder</button>
          </div>
        </div>
      )}

      {/* Modal Quitter */}
      {modal === 'leave' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: JUNTO.ink }}>Quitter cette partie ?</h3>
            <p style={{ fontSize: 14, color: JUNTO.gray, marginBottom: 24 }}>Ta place sera libérée pour un autre joueur.</p>
            <button onClick={leaveMatch} style={{ width: '100%', padding: 16, background: JUNTO.coral, color: JUNTO.white, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Oui, quitter</button>
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 14, background: JUNTO.bgSoft, color: JUNTO.gray, border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer' }}>Non, rester</button>
          </div>
        </div>
      )}

      {/* Modal Profil Joueur */}
      {selectedPlayer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setSelectedPlayer(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 340, textAlign: 'center' }}>
            <Avatar player={{ profiles: selectedPlayer }} size={80} index={0} />
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 8px', color: JUNTO.ink }}>{selectedPlayer.name}</h3>
            <div style={{ fontSize: 14, color: JUNTO.gray, marginBottom: 8 }}>⭐ Niveau {selectedPlayer.level || '?'}</div>
            {selectedPlayer.position && (
              <div style={{ fontSize: 13, color: JUNTO.muted, marginBottom: 20 }}>
                {POSITION_LABELS[selectedPlayer.position]?.icon} {POSITION_LABELS[selectedPlayer.position]?.label}
              </div>
            )}
            <Link href={`/player/${selectedPlayer.id}`} style={{ display: 'block', padding: 16, background: JUNTO.coral, color: JUNTO.white, borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 12 }}>Voir le profil</Link>
            <button onClick={() => setSelectedPlayer(null)} style={{ width: '100%', padding: 14, background: JUNTO.bgSoft, color: JUNTO.gray, border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Invite (pour organisateur) */}
      {modal === 'invite' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: JUNTO.white, borderRadius: 28, padding: 28, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px', color: JUNTO.ink, textAlign: 'center' }}>👥 Ajouter un joueur</h3>
            
            {/* Formulaire invitation par email */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              borderRadius: 16, 
              padding: 20, 
              marginBottom: 16,
              border: '2px solid #e2e8f0'
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: JUNTO.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✉️ Inviter quelqu'un
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Prénom *"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Email (optionnel)"
                  style={{
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>
              
              {/* Sélection équipe */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setInviteTeam('A')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: 10,
                    background: inviteTeam === 'A' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#f1f5f9',
                    color: inviteTeam === 'A' ? '#fff' : '#64748b',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  🅰️ Équipe A
                </button>
                <button
                  onClick={() => setInviteTeam('B')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: 10,
                    background: inviteTeam === 'B' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
                    color: inviteTeam === 'B' ? '#fff' : '#64748b',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  🅱️ Équipe B
                </button>
              </div>
              
              <button
                onClick={sendEmailInvite}
                disabled={!inviteName.trim() || inviteSending}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: inviteName.trim() 
                    ? (inviteEmail.trim() ? JUNTO.teal : JUNTO.ink)
                    : '#e5e5e5',
                  color: inviteName.trim() ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: inviteName.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: inviteName.trim() && inviteEmail.trim() 
                    ? '0 4px 12px rgba(0, 184, 169, 0.25)' 
                    : 'none'
                }}
              >
                {inviteSending 
                  ? '⏳ Envoi...' 
                  : inviteEmail.trim() 
                    ? '📤 Ajouter et envoyer l\'invitation' 
                    : '+ Ajouter à la partie'
                }
              </button>
              
              <p style={{ fontSize: 12, color: JUNTO.gray, marginTop: 10, textAlign: 'center' }}>
                💡 {inviteEmail.trim() 
                  ? "Cette personne recevra un email pour rejoindre" 
                  : "Ajoute un email pour envoyer une invitation automatique"}
              </p>
            </div>
            
            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: JUNTO.border }}></div>
              <span style={{ fontSize: 12, color: JUNTO.muted }}>ou</span>
              <div style={{ flex: 1, height: 1, background: JUNTO.border }}></div>
            </div>
            
            <Link href={`/dashboard/joueurs?match=${matchId}`} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: 16, background: JUNTO.bgSoft, borderRadius: 14,
              textDecoration: 'none', marginBottom: 12
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: JUNTO.tealSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⭐</div>
              <div>
                <strong style={{ display: 'block', fontSize: 15, color: JUNTO.ink }}>Mes joueurs favoris</strong>
                <span style={{ fontSize: 13, color: JUNTO.gray }}>Invite tes partenaires habituels</span>
              </div>
            </Link>
            
            <button onClick={() => { setModal('share') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: 16, background: JUNTO.bgSoft, borderRadius: 14,
              border: 'none', cursor: 'pointer', marginBottom: 12, textAlign: 'left'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: JUNTO.coralSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📤</div>
              <div>
                <strong style={{ display: 'block', fontSize: 15, color: JUNTO.ink }}>Partager un lien</strong>
                <span style={{ fontSize: 13, color: JUNTO.gray }}>WhatsApp, SMS, copier le lien...</span>
              </div>
            </button>
            
            <button onClick={() => setModal(null)} style={{ width: '100%', padding: 14, background: 'none', border: 'none', color: JUNTO.muted, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Annuler</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes junto-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .junto-dot { animation: junto-breathe 3s ease-in-out infinite; }
        .junto-dot:nth-child(1) { animation-delay: 0s; }
        .junto-dot:nth-child(2) { animation-delay: 0.15s; }
        .junto-dot:nth-child(3) { animation-delay: 0.3s; }
        .junto-dot:nth-child(4) { animation-delay: 0.45s; }
        
        @keyframes junto-loading {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
        .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
        .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
        .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
        .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }

        .page-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .page-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          align-items: start;
        }
        
        .main-column { min-width: 0; }
        .sidebar { display: flex; flex-direction: column; }
        
        .teams-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        
        .player-card:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.25) !important;
        }
        
        .player-card-empty:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.3) !important;
        }
        
        .quick-action:hover {
          background: ${JUNTO.border} !important;
        }
        
        input:focus {
          border-color: ${JUNTO.coral} !important;
          outline: none;
        }
        
        /* MOBILE RESPONSIVE */
        @media (max-width: 900px) {
          .page-layout {
            grid-template-columns: 1fr;
          }
          .sidebar {
            order: 1;
          }
        }
        
        @media (max-width: 600px) {
          .teams-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .pending-item, .invite-item {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          
          .pending-actions {
            width: 100%;
            display: flex;
            gap: 8px;
          }
          
          .pending-actions button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  )
}