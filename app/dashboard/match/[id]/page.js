'use client'

/**
 * ============================================
 * PAGE MATCH - VERSION REDESIGN V6
 * ============================================
 * 
 * Nouveau design avec :
 * - Terrain de padel visuel (bleu)
 * - Carte de partage horizontale (ratio 1.91:1)
 * - Section paiements avec toggle
 * - Chat amélioré
 * - Sidebar desktop avec actions
 * - Modal profil joueur
 * - Full responsive
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

// ============================================
// TOKENS DE DESIGN
// ============================================
const DARK = '#1a1a2e'
const DARK_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #334155)'
const GREEN_GRADIENT = 'linear-gradient(135deg, #22c55e, #16a34a)'
const COURT_GRADIENT = 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)'
const PLAYER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#64748b',
  border: '#e5e7eb',
  accent: '#22c55e',
  teamA: '#3b82f6',
  teamB: '#f97316',
  danger: '#ef4444',
  warning: '#f59e0b'
}

// ============================================
// COMPOSANTS RÉUTILISABLES
// ============================================

// Avatar avec couleur basée sur le nom
function Avatar({ name, size = 40, empty = false, avatarUrl = null, onClick, border = false }) {
  if (empty || !name) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, color: 'rgba(255,255,255,0.6)',
        flexShrink: 0
      }}>+</div>
    )
  }
  
  const color = PLAYER_COLORS[name.charCodeAt(0) % PLAYER_COLORS.length]
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onClick={onClick}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          border: border ? '2px solid #fff' : '3px solid rgba(255,255,255,0.3)',
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
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 600, color: '#fff',
        border: border ? '2px solid #fff' : '3px solid rgba(255,255,255,0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0
      }}
    >{name[0].toUpperCase()}</div>
  )
}

// Carte joueur sur le terrain
function PlayerCard({ player, position, onClickPlayer, onClickEmpty }) {
  const isEmpty = !player
  const isPendingInvite = player?.isPendingInvite
  const profile = player?.profiles || player
  
  // Style différent pour les invités en attente
  const getCardStyle = () => {
    if (isEmpty) {
      return {
        background: 'rgba(255,255,255,0.05)',
        border: '2px dashed rgba(255,255,255,0.2)'
      }
    }
    if (isPendingInvite) {
      return {
        background: 'rgba(251,191,36,0.15)', // Jaune/orange pour invité
        border: '2px dashed rgba(251,191,36,0.4)'
      }
    }
    return {
      background: 'rgba(255,255,255,0.1)',
      border: '2px solid rgba(255,255,255,0.15)'
    }
  }

  const cardStyle = getCardStyle()
  
  return (
    <div
      onClick={() => isEmpty ? onClickEmpty?.() : onClickPlayer?.(player)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        background: cardStyle.background,
        borderRadius: 12,
        border: cardStyle.border,
        cursor: 'pointer',
        transition: 'all 0.2s',
        minHeight: 120,
        width: '100%',
        maxWidth: 140
      }}
    >
      {/* Avatar avec style spécial pour invités */}
      {isPendingInvite ? (
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '2px dashed rgba(251,191,36,0.6)',
          background: 'rgba(251,191,36,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: 'rgba(255,255,255,0.8)'
        }}>
          {profile?.name ? profile.name[0].toUpperCase() : '?'}
        </div>
      ) : (
        <Avatar
          name={profile?.name}
          size={52}
          empty={isEmpty}
          avatarUrl={profile?.avatar_url}
        />
      )}
      
      <div style={{ marginTop: 10, textAlign: 'center', width: '100%' }}>
        {isEmpty ? (
          <>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13 }}>Place libre</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>📍 {position}</div>
          </>
        ) : isPendingInvite ? (
          <>
            <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {profile?.name?.split(' ')[0] || 'Invité'}
              <span style={{ fontSize: 10 }}>⏳</span>
            </div>
            <div style={{ 
              background: 'rgba(251,191,36,0.3)', 
              padding: '3px 8px', 
              borderRadius: 4, 
              fontSize: 10, 
              color: '#fbbf24',
              marginTop: 6
            }}>
              Invité · En attente
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {profile?.name?.split(' ')[0] || 'Joueur'}
              {player?.isOrganizer && <span style={{ fontSize: 12 }}>👑</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#fff', whiteSpace: 'nowrap' }}>
                Niv. {profile?.level || '?'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#fff', whiteSpace: 'nowrap' }}>
                📍 {profile?.position || position}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Carte de partage horizontale
function ShareCard({ match, allPlayers, spotsLeft, pendingInvitesCount = 0 }) {
  // Simplifier : juste les 4 slots dans l'ordre
  const slots = []
  const teamAPlayers = allPlayers.filter(p => p.team === 'A')
  const teamBPlayers = allPlayers.filter(p => p.team === 'B')
  
  slots.push({ player: teamAPlayers[0], slot: 'D' })
  slots.push({ player: teamAPlayers[1], slot: 'G' })
  slots.push({ player: teamBPlayers[0], slot: 'D' })
  slots.push({ player: teamBPlayers[1], slot: 'G' })

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--'
    return timeStr.slice(0, 5)
  }

  // Comptage intelligent des places
  const confirmedCount = allPlayers.filter(p => !p.isPendingInvite).length
  const invitedCount = allPlayers.filter(p => p.isPendingInvite).length
  const freeSpots = 4 - confirmedCount - invitedCount

  // Message de places
  const getSpotsMessage = () => {
    if (freeSpots === 0 && invitedCount === 0) return '✅ Complet'
    if (freeSpots === 0 && invitedCount > 0) return `⏳ ${invitedCount} invité${invitedCount > 1 ? 's' : ''} en attente`
    if (freeSpots > 0 && invitedCount > 0) return `🎾 ${freeSpots} place${freeSpots > 1 ? 's' : ''} (+${invitedCount} invité${invitedCount > 1 ? 's' : ''})`
    return `🎾 ${freeSpots} place${freeSpots > 1 ? 's' : ''}`
  }

  return (
    <div style={{
      background: COURT_GRADIENT,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      aspectRatio: '1.91 / 1',
      minHeight: 180
    }}>
      {/* Colonne gauche : Infos */}
      <div style={{ flex: 1, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12, opacity: 0.7 }}>
          <span style={{ fontSize: 12 }}>🎾</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>PADEL MATCH</span>
        </div>

        <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>{formatTime(match?.match_time)}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 10 }}>{formatDate(match?.match_date)}</div>
        <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.9 }}>📍 {match?.clubs?.name || match?.city || 'Lieu à définir'}</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '5px 10px', borderRadius: 6, fontSize: 11 }}>
            ⭐ Niveau {match?.level_min || '?'}-{match?.level_max || '?'}
          </span>
          <span style={{ 
            background: freeSpots > 0 ? 'rgba(34,197,94,0.4)' : invitedCount > 0 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.2)', 
            padding: '5px 10px', 
            borderRadius: 6, 
            fontSize: 11, 
            fontWeight: 600 
          }}>
            {getSpotsMessage()}
          </span>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ width: 1, height: '80%', background: 'rgba(255,255,255,0.2)' }} />

      {/* Colonne droite : Avatars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
        {slots.map((item, i) => {
          const profile = item.player?.profiles || item.player
          const isPendingInvite = item.player?.isPendingInvite
          
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {profile?.name ? (
                isPendingInvite ? (
                  // Avatar invité (pointillé jaune)
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '2px dashed rgba(251,191,36,0.6)',
                    background: 'rgba(251,191,36,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: '#fbbf24'
                  }}>{profile.name[0].toUpperCase()}</div>
                ) : (
                  // Avatar confirmé (plein)
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: PLAYER_COLORS[profile.name.charCodeAt(0) % PLAYER_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: '#fff',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>{profile.name[0].toUpperCase()}</div>
                )
              ) : (
                // Place libre
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'rgba(255,255,255,0.4)'
                }}>?</div>
              )}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{item.slot}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// PAGE PRINCIPALE
// ============================================
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
  const [showPlayerModal, setShowPlayerModal] = useState(null)
  const [modal, setModal] = useState(null)

  // Forms
  const [joinTeam, setJoinTeam] = useState('A')

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

      if (!matchData) { router.push('/dashboard/parties'); return }
      setMatch(matchData)

      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])
      setParticipants(participantsData || [])

      // Charger les invités en attente (visible par tous pour l'affichage)
      const { data: invitesData } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('match_id', matchId)
        .eq('status', 'pending')
      setPendingInvites(invitesData || [])

      // Les demandes en attente ne sont visibles que par l'organisateur
      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase
          .from('match_participants')
          .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url)`)
          .eq('match_id', matchId)
          .eq('status', 'pending')
        setPendingRequests(pendingData || [])
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
      .select(`*, profiles (id, name, avatar_url)`)
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
  const priceTotal = match?.price_total ? Math.round(match.price_total / 100) : 0

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
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return '--:--'
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
    const tempMessage = {
      id: Date.now(),
      match_id: parseInt(matchId),
      user_id: user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      profiles: { id: user.id, name: profile?.name, avatar_url: profile?.avatar_url }
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
    await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', req.id)
    loadData()
  }

  async function refuseRequest(req) {
    await supabase.from('match_participants').delete().eq('id', req.id)
    loadData()
  }

  async function cancelInvite(invite) {
    if (!confirm(`Annuler l'invitation de ${invite.name || 'cet invité'} ?`)) return
    await supabase.from('pending_invites').delete().eq('id', invite.id)
    loadData()
  }

  async function leaveMatch() {
    if (!confirm('Quitter cette partie ?')) return
    await supabase.from('match_participants').delete().eq('match_id', matchId).eq('user_id', user.id)
    loadData()
  }

  async function cancelMatch() {
    if (!confirm('Annuler cette partie ? Cette action est irréversible.')) return
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId)
    router.push('/dashboard/parties')
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

  const handlePlayerClick = (player) => {
    if (player?.profiles || player?.name) {
      setShowPlayerModal(player)
    }
  }

  const handleEmptyClick = () => {
    setShowShareModal(true)
  }

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div style={{ color: COLORS.textMuted, marginBottom: 16 }}>Partie introuvable</div>
          <Link href="/dashboard/parties" style={{ color: COLORS.accent }}>← Retour aux parties</Link>
        </div>
      </div>
    )
  }

  const isMatchPast = match.match_date && match.match_time && new Date(`${match.match_date}T${match.match_time}`) < new Date()
  const canJoin = !isOrganizer() && !isParticipant() && !pendingParticipants.some(p => p.user_id === user?.id) && getSpotsLeft() > 0 && match.status === 'open'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '16px' }}>
      <div className="page-container">
        
        {/* ============================================ */}
        {/* COLONNE PRINCIPALE                          */}
        {/* ============================================ */}
        <div className="main-column">
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Link href="/dashboard/parties" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>← Retour</Link>
            {(() => {
              const invitedCount = pendingInvites.length
              const freeSpots = getSpotsLeft()
              
              if (match.status === 'cancelled') {
                return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>❌ Annulée</span>
              }
              if (match.status === 'completed') {
                return <span style={{ background: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✅ Terminée</span>
              }
              if (freeSpots === 0 && invitedCount === 0) {
                return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✅ Complet</span>
              }
              if (freeSpots === 0 && invitedCount > 0) {
                return <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>⏳ {invitedCount} invité{invitedCount > 1 ? 's' : ''}</span>
              }
              if (freeSpots > 0 && invitedCount > 0) {
                return <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🎾 {freeSpots} place{freeSpots > 1 ? 's' : ''} (+{invitedCount}⏳)</span>
              }
              return <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🎾 {freeSpots} place{freeSpots > 1 ? 's' : ''}</span>
            })()}
          </div>

          {/* Demandes en attente (organisateur) */}
          {isOrganizer() && pendingRequests.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 12 }}>📬 Demandes en attente ({pendingRequests.length})</div>
              {pendingRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={req.profiles?.name} size={36} avatarUrl={req.profiles?.avatar_url} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{req.profiles?.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Niveau {req.profiles?.level} · Équipe {req.team}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => acceptRequest(req)} style={{ padding: '6px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✓ Accepter</button>
                    <button onClick={() => refuseRequest(req)} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invités en attente (organisateur) */}
          {isOrganizer() && pendingInvites.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 12 }}>⏳ Invités en attente ({pendingInvites.length})</div>
              <p style={{ fontSize: 12, color: '#92400e', marginBottom: 12, opacity: 0.8 }}>Ces personnes ont été invitées mais n'ont pas encore confirmé sur l'app.</p>
              {pendingInvites.map(invite => (
                <div key={invite.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: '50%',
                      border: '2px dashed rgba(251,191,36,0.6)',
                      background: 'rgba(251,191,36,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, color: '#f59e0b'
                    }}>{invite.name ? invite.name[0].toUpperCase() : '?'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{invite.name || 'Invité'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Équipe {invite.team} · {invite.phone || 'Pas de téléphone'}</div>
                    </div>
                  </div>
                  <button onClick={() => cancelInvite(invite)} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕ Libérer</button>
                </div>
              ))}
            </div>
          )}

          {/* ============================================ */}
          {/* CARTE TERRAIN                               */}
          {/* ============================================ */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            
            {/* Header date/heure/lieu */}
            <div style={{ background: DARK_GRADIENT, padding: '20px', color: '#fff' }}>
              <div className="match-header">
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>📅</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatDateShort(match.match_date)}</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{formatTime(match.match_time)}</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>📍</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{match.clubs?.name || match.city || 'Lieu TBD'}</div>
                </div>
              </div>
            </div>

            {/* Terrain */}
            <div style={{ background: COURT_GRADIENT, padding: '20px 16px', position: 'relative' }}>
              {/* Branding */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 20px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎾</span>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>PADEL MATCH</span>
                </div>
              </div>

              {/* Container terrain */}
              <div style={{ position: 'relative', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '20px 12px' }}>
                {/* Ligne filet */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: 'rgba(255,255,255,0.4)', transform: 'translateX(-50%)' }} />

                {/* Équipes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'relative', zIndex: 1 }}>
                  
                  {/* Équipe A */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(59,130,246,0.3)', padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.5)' }}>
                      <span style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ÉQUIPE A</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
                      {[0, 1].map(i => (
                        <PlayerCard key={i} player={teamA[i]} position={i === 0 ? 'Droite' : 'Gauche'} onClickPlayer={handlePlayerClick} onClickEmpty={handleEmptyClick} />
                      ))}
                    </div>
                  </div>

                  {/* Équipe B */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(249,115,22,0.3)', padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(249,115,22,0.5)' }}>
                      <span style={{ color: '#fdba74', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ÉQUIPE B</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
                      {[0, 1].map(i => (
                        <PlayerCard key={i} player={teamB[i]} position={i === 0 ? 'Droite' : 'Gauche'} onClickPlayer={handlePlayerClick} onClickEmpty={handleEmptyClick} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>VS</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#fff' }}>⭐ {match.level_min || '?'}-{match.level_max || '?'}</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#fff' }}>{ambiance.emoji} {ambiance.label}</span>
                {pricePerPerson > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#fff' }}>💰 {pricePerPerson}€/pers</span>}
              </div>
            </div>

            {/* Footer CTA */}
            <div style={{ padding: '16px 20px', background: '#fff', display: 'flex', justifyContent: 'center' }}>
              {getSpotsLeft() > 0 && match.status === 'open' && (
                <button onClick={() => setShowShareModal(true)} style={{
                  padding: '14px 28px', background: GREEN_GRADIENT, color: '#fff',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', maxWidth: 320, justifyContent: 'center'
                }}>
                  📤 Partager pour compléter l'équipe
                </button>
              )}
            </div>
          </div>

          {/* Chat */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e7eb', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: DARK }}>💬 Discussion</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
            </div>

            <div ref={chatContainerRef} style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 13 }}>Aucun message. Soyez le premier !</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 10 }}>
                      <Avatar name={m.profiles?.name || 'U'} size={32} avatarUrl={m.profiles?.avatar_url} />
                      <div style={{ flex: 1, background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{m.profiles?.name || 'Utilisateur'} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: 13, color: DARK }}>{m.message}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..."
                style={{ flex: 1, padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' }}
              />
              <button type="submit" style={{ padding: '12px 18px', background: DARK, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>→</button>
            </form>
          </div>

          {/* Paiements */}
          {pricePerPerson > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: DARK }}>💳 Paiements</h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', padding: 14, background: '#f8fafc', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: DARK }}>{priceTotal}€</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>{pricePerPerson}€</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>/ personne</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{allPlayers.length * pricePerPerson}€</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>à collecter</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allPlayers.map((player, idx) => {
                  const p = player.profiles || player
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb'
                    }}>
                      <div onClick={() => handlePlayerClick(player)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <Avatar name={p?.name} size={32} avatarUrl={p?.avatar_url} />
                        <div>
                          <div style={{ fontWeight: 600, color: DARK, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p?.name || 'Invité'}
                            {player.isOrganizer && <span style={{ fontSize: 11 }}>👑</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{pricePerPerson}€</span>
                        <span style={{ background: '#f59e0b', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>En attente</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💡</span>
                <span>Le suivi des paiements sera bientôt disponible</span>
              </div>
            </div>
          )}

          {/* Sidebar Mobile */}
          <div className="sidebar-mobile">
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e5e7eb', marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: DARK }}>⚡ Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={copyLink} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>📋 Copier lien</button>
                <button onClick={addToCalendar} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>📅 Calendrier</button>
                {isOrganizer() && (
                  <>
                    <Link href={`/dashboard/matches/edit/${matchId}`} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>✏️ Modifier</Link>
                    <button onClick={cancelMatch} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>Annuler</button>
                  </>
                )}
                {isParticipant() && !isOrganizer() && (
                  <button onClick={leaveMatch} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#dc2626', gridColumn: 'span 2' }}>Quitter la partie</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SIDEBAR DESKTOP                             */}
        {/* ============================================ */}
        <aside className="sidebar-desktop">
          {getSpotsLeft() > 0 && match.status === 'open' && (
            <div style={{ background: GREEN_GRADIENT, borderRadius: 14, padding: 18, color: '#fff', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📤</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Il manque {getSpotsLeft()} joueur{getSpotsLeft() > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 14 }}>Partage pour compléter</div>
              <button onClick={() => setShowShareModal(true)} style={{ width: '100%', padding: '11px', background: '#fff', color: '#16a34a', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Partager la partie
              </button>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', color: DARK }}>⚡ Actions rapides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={copyLink} style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Copier le lien
              </button>
              <button onClick={addToCalendar} style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📅</span> Ajouter au calendrier
              </button>
              {isOrganizer() && (
                <>
                  <Link href={`/dashboard/matches/edit/${matchId}`} style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                    <span>✏️</span> Modifier la partie
                  </Link>
                  <button onClick={() => setModal('result')} style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🏆</span> Saisir le résultat
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', color: DARK }}>👑 Organisateur</h3>
            <div onClick={() => handlePlayerClick(orgaPlayer)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar name={match.profiles?.name} size={44} avatarUrl={match.profiles?.avatar_url} />
              <div>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{match.profiles?.name || 'Organisateur'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Niveau {match.profiles?.level || '?'}</div>
              </div>
            </div>
          </div>

          {isOrganizer() && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #fecaca' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: '#dc2626' }}>⚠️ Zone danger</h3>
              <button onClick={cancelMatch} style={{ width: '100%', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>
                Annuler cette partie
              </button>
            </div>
          )}

          {isParticipant() && !isOrganizer() && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #fecaca' }}>
              <button onClick={leaveMatch} style={{ width: '100%', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', cursor: 'pointer' }}>
                Quitter cette partie
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ============================================ */}
      {/* CTA FIXE (pour rejoindre)                   */}
      {/* ============================================ */}
      {canJoin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 16, zIndex: 100 }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button onClick={() => setModal('join')} style={{ width: '100%', padding: 16, background: GREEN_GRADIENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              🎾 Rejoindre cette partie
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL PROFIL JOUEUR                         */}
      {/* ============================================ */}
      {showPlayerModal && (
        <div onClick={() => setShowPlayerModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 340, width: '100%', padding: 24, textAlign: 'center' }}>
            {(() => {
              const p = showPlayerModal.profiles || showPlayerModal
              return (
                <>
                  <Avatar name={p?.name} size={72} avatarUrl={p?.avatar_url} />
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 4px', color: DARK }}>
                    {p?.name || 'Joueur'}
                    {showPlayerModal.isOrganizer && <span style={{ marginLeft: 6 }}>👑</span>}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
                    Niveau {p?.level || '?'} · {p?.position || 'Position ?'}
                  </p>
                  <button onClick={() => setShowPlayerModal(null)} style={{ width: '100%', padding: '12px', background: DARK, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Fermer
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL PARTAGE                               */}
      {/* ============================================ */}
      {showShareModal && (
        <div onClick={() => setShowShareModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: DARK }}>📤 Partager</h3>
                <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <ShareCard match={match} allPlayers={allPlayers} spotsLeft={getSpotsLeft()} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins notre partie de padel ! ${window.location.origin}/join/${matchId}`)}`, '_blank') }} style={{ padding: '13px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>WhatsApp</button>
                <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/join/${matchId}`)}`, '_blank') }} style={{ padding: '13px', background: '#1877F2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Facebook</button>
                <button onClick={() => { copyLink(); setShowShareModal(false) }} style={{ padding: '13px', background: '#f1f5f9', color: DARK, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📋 Copier</button>
                <button onClick={() => { window.open(`mailto:?subject=Partie de padel&body=${encodeURIComponent(`Rejoins notre partie ! ${window.location.origin}/join/${matchId}`)}`, '_blank') }} style={{ padding: '13px', background: '#f1f5f9', color: DARK, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📧 Email</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL REJOINDRE                             */}
      {/* ============================================ */}
      {modal === 'join' && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: 400, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: DARK }}>🎾 Rejoindre la partie</h3>

            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Dans quelle équipe souhaites-tu jouer ?</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setJoinTeam('A')} style={{ flex: 1, padding: 16, background: joinTeam === 'A' ? 'rgba(59,130,246,0.1)' : '#f8fafc', border: `2px solid ${joinTeam === 'A' ? '#3b82f6' : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>Équipe A</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{teamA.length}/2 joueurs</div>
              </button>
              <button onClick={() => setJoinTeam('B')} style={{ flex: 1, padding: 16, background: joinTeam === 'B' ? 'rgba(249,115,22,0.1)' : '#f8fafc', border: `2px solid ${joinTeam === 'B' ? '#f97316' : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#f97316', marginBottom: 4 }}>Équipe B</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{teamB.length}/2 joueurs</div>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Annuler</button>
              <button onClick={requestToJoin} style={{ flex: 1, padding: '12px', background: GREEN_GRADIENT, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Envoyer ma demande</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STYLES                                      */}
      {/* ============================================ */}
      <style>{`
        .page-container { max-width: 1100px; margin: 0 auto; display: flex; gap: 24px; }
        .main-column { flex: 1; min-width: 0; padding-bottom: ${canJoin ? '100px' : '24px'}; }
        .sidebar-desktop { width: 280px; flex-shrink: 0; display: none; }
        .sidebar-mobile { display: block; }
        .match-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        @media (min-width: 900px) { .sidebar-desktop { display: block; } .sidebar-mobile { display: none; } }
        @media (max-width: 500px) { .match-header { flex-direction: column; gap: 8px; } .match-header > div { flex: none !important; } }
      `}</style>
    </div>
  )
}