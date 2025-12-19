'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function MatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('equipes')
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  // États
  const [copied, setCopied] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [favorites, setFavorites] = useState([])
  
  // Résultat
  const [winner, setWinner] = useState('')
  const [scores, setScores] = useState({ s1a: '', s1b: '', s2a: '', s2b: '', s3a: '', s3b: '' })
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadData()
    
    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_messages',
        filter: `match_id=eq.${matchId}`
      }, () => loadMessages())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'match_participants',
        filter: `match_id=eq.${matchId}`
      }, () => loadData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [matchId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      // Charger le match avec l'organisateur et le club
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (
            id, name, level, position, ambiance, bio, avatar_url, reliability_score, matches_played, matches_won, lydia_username, paypal_email
          )
        `)
        .eq('id', matchId)
        .single()

      if (!matchData) {
        alert('Partie introuvable')
        router.push('/dashboard')
        return
      }

      setMatch(matchData)

      // Charger les participants confirmés
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, level, position, ambiance, bio, avatar_url, reliability_score, matches_played, matches_won),
          duo_profile:profiles!match_participants_duo_with_fkey (id, name, level, position)
        `)
        .eq('match_id', matchId)
        .eq('status', 'confirmed')

      setParticipants(participantsData || [])

      // Charger les demandes en attente (pour l'orga)
      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase
          .from('match_participants')
          .select(`
            *,
            profiles (id, name, level, position, ambiance, bio, avatar_url, reliability_score, matches_played, matches_won),
            duo_profile:profiles!match_participants_duo_with_fkey (id, name, level, position)
          `)
          .eq('match_id', matchId)
          .eq('status', 'pending')

        setPendingRequests(pendingData || [])
      }

      // Charger mes favoris
      const { data: favoritesData } = await supabase
        .from('player_favorites')
        .select('favorite_id')
        .eq('user_id', session.user.id)
      
      setFavorites(favoritesData?.map(f => f.favorite_id) || [])

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
      .select(`
        *,
        profiles (id, name)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return

    await supabase.from('match_messages').insert({
      match_id: parseInt(matchId),
      user_id: user.id,
      message: newMessage.trim()
    })

    setNewMessage('')
  }

  // === GESTION DES DEMANDES ===
  
  async function acceptRequest(participantId, userId, duoWith = null) {
    try {
      // Accepter le joueur
      await supabase
        .from('match_participants')
        .update({ status: 'confirmed' })
        .eq('id', participantId)

      // Si c'est un duo, accepter aussi le partenaire
      if (duoWith) {
        await supabase
          .from('match_participants')
          .update({ status: 'confirmed' })
          .eq('match_id', matchId)
          .eq('user_id', duoWith)
      }

      // Mettre à jour les places
      const spotsUsed = duoWith ? 2 : 1
      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available - spotsUsed,
          status: match.spots_available - spotsUsed <= 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      // Message système
      const playerName = pendingRequests.find(p => p.id === participantId)?.profiles?.name
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `✅ ${playerName}${duoWith ? ' et son partenaire ont' : ' a'} rejoint la partie`
      })

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function refuseRequest(participantId, duoWith = null) {
    try {
      await supabase
        .from('match_participants')
        .update({ status: 'refused' })
        .eq('id', participantId)

      if (duoWith) {
        await supabase
          .from('match_participants')
          .update({ status: 'refused' })
          .eq('match_id', matchId)
          .eq('user_id', duoWith)
      }

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // === GESTION DES ÉQUIPES ===

  async function assignTeam(participantId, team) {
    try {
      await supabase
        .from('match_participants')
        .update({ team })
        .eq('id', participantId)

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function swapPlayer(participantId) {
    const participant = participants.find(p => p.id === participantId)
    const newTeam = participant?.team === 'A' ? 'B' : 'A'
    await assignTeam(participantId, newTeam)
  }

  // === AUTRES ACTIONS ===

  async function leaveMatch() {
    if (!confirm('Tu veux vraiment quitter cette partie ?')) return

    try {
      // Calculer si c'est une annulation tardive (< 24h avant le match)
      const matchDateTime = new Date(`${match.match_date}T${match.match_time}`)
      const now = new Date()
      const hoursUntilMatch = (matchDateTime - now) / (1000 * 60 * 60)
      const cancellationType = hoursUntilMatch < 24 ? 'late_cancel' : 'early_cancel'

      // Marquer l'annulation
      await supabase
        .from('match_participants')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('match_id', matchId)
        .eq('user_id', user.id)

      // Mettre à jour le score de fiabilité via RPC
      await supabase.rpc('update_reliability_score', {
        p_user_id: user.id,
        p_action: cancellationType
      })

      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available + 1,
          status: 'open'
        })
        .eq('id', matchId)

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `👋 ${profile?.name} a quitté la partie`
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function markNoShow(participantId, participantUserId, participantName) {
    if (!confirm(`${participantName} n'est pas venu(e) ? Son score de fiabilité sera impacté.`)) return

    try {
      // Marquer comme no-show
      await supabase
        .from('match_participants')
        .update({ showed_up: false })
        .eq('id', participantId)

      // Mettre à jour le score de fiabilité
      await supabase.rpc('update_reliability_score', {
        p_user_id: participantUserId,
        p_action: 'no_show'
      })

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `⚠️ ${participantName} n'est pas venu(e)`
      })

      loadData()
    } catch (error) {
      console.error('Error marking no-show:', error)
      alert('Erreur lors du signalement')
    }
  }

  async function cancelMatch() {
    if (!cancelReason.trim()) {
      alert('Donne un motif d\'annulation')
      return
    }

    try {
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `❌ PARTIE ANNULÉE : ${cancelReason}`
      })

      await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId)

      alert('Partie annulée')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function markAsPaid() {
    try {
      await supabase
        .from('match_participants')
        .update({ has_paid: true, paid_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('user_id', user.id)
      
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `💰 ${profile?.name} a payé`
      })
      
      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function confirmPayment(participantId, participantName) {
    try {
      await supabase
        .from('match_participants')
        .update({ paid_confirmed_by: user.id })
        .eq('id', participantId)
      
      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function saveResult() {
    if (!winner) {
      alert('Sélectionne l\'équipe gagnante')
      return
    }

    try {
      // Sauvegarder le résultat
      await supabase
        .from('matches')
        .update({
          winner,
          score_set1_a: scores.s1a ? parseInt(scores.s1a) : null,
          score_set1_b: scores.s1b ? parseInt(scores.s1b) : null,
          score_set2_a: scores.s2a ? parseInt(scores.s2a) : null,
          score_set2_b: scores.s2b ? parseInt(scores.s2b) : null,
          score_set3_a: scores.s3a ? parseInt(scores.s3a) : null,
          score_set3_b: scores.s3b ? parseInt(scores.s3b) : null,
          status: 'completed'
        })
        .eq('id', matchId)

      // Mettre à jour les stats des joueurs
      const teamAPlayers = participants.filter(p => p.team === 'A').map(p => p.user_id)
      const teamBPlayers = participants.filter(p => p.team === 'B').map(p => p.user_id)
      
      // Ajouter l'organisateur s'il est dans une équipe
      const orgaTeam = match.organizer_team
      if (orgaTeam === 'A') teamAPlayers.push(match.organizer_id)
      if (orgaTeam === 'B') teamBPlayers.push(match.organizer_id)

      const winners = winner === 'A' ? teamAPlayers : teamBPlayers
      const losers = winner === 'A' ? teamBPlayers : teamAPlayers

      // Update winners
      for (const playerId of winners) {
        const { data: p } = await supabase
          .from('profiles')
          .select('matches_played, matches_won, current_streak, best_streak')
          .eq('id', playerId)
          .single()

        if (p) {
          const newStreak = (p.current_streak || 0) + 1
          await supabase
            .from('profiles')
            .update({
              matches_played: (p.matches_played || 0) + 1,
              matches_won: (p.matches_won || 0) + 1,
              current_streak: newStreak,
              best_streak: Math.max(newStreak, p.best_streak || 0)
            })
            .eq('id', playerId)
        }
        
        // Améliorer la fiabilité pour avoir participé
        await supabase.rpc('update_reliability_score', {
          p_user_id: playerId,
          p_action: 'completed'
        })
      }

      // Update losers
      for (const playerId of losers) {
        const { data: p } = await supabase
          .from('profiles')
          .select('matches_played')
          .eq('id', playerId)
          .single()

        if (p) {
          await supabase
            .from('profiles')
            .update({
              matches_played: (p.matches_played || 0) + 1,
              current_streak: 0
            })
            .eq('id', playerId)
        }
        
        // Améliorer la fiabilité pour avoir participé
        await supabase.rpc('update_reliability_score', {
          p_user_id: playerId,
          p_action: 'completed'
        })
      }

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `🏆 Équipe ${winner} gagne ! ${scores.s1a}-${scores.s1b}${scores.s2a ? ` / ${scores.s2a}-${scores.s2b}` : ''}${scores.s3a ? ` / ${scores.s3a}-${scores.s3b}` : ''}`
      })

      setShowResultModal(false)
      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${matchId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copySOSMessage() {
    const spotsNeeded = match?.spots_available || 1
    const level = match?.level_required !== 'all' ? `niveau ${match.level_required}+` : ''
    const message = `🆘 Cherche ${spotsNeeded} joueur${spotsNeeded > 1 ? 's' : ''} ${level} pour ${formatDate(match?.match_date)} à ${formatTime(match?.match_time)} à ${match?.clubs?.name} !\n\n👉 ${window.location.origin}/join/${matchId}`
    navigator.clipboard.writeText(message)
    alert('Message SOS copié ! Colle-le sur WhatsApp ou Facebook.')
    setShowSOSModal(false)
  }

  // === GESTION DES FAVORIS ===
  
  function isFavorite(playerId) {
    return favorites.includes(playerId)
  }

  async function toggleFavorite(playerId, playerName) {
    if (!playerId || playerId === user?.id) return
    
    try {
      if (isFavorite(playerId)) {
        // Retirer des favoris
        await supabase
          .from('player_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('favorite_id', playerId)
        
        setFavorites(favorites.filter(id => id !== playerId))
      } else {
        // Ajouter aux favoris
        await supabase
          .from('player_favorites')
          .insert({
            user_id: user.id,
            favorite_id: playerId
          })
        
        setFavorites([...favorites, playerId])
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return "Demain"
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function generateCalendarLinks() {
    if (!match) return null
    
    const title = `🎾 Padel - ${match.clubs?.name}`
    const startDate = new Date(`${match.match_date}T${match.match_time}`)
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000) // +1h30
    
    const formatDateGoogle = (date) => date.toISOString().replace(/-|:|\.\d+/g, '')
    const formatDateICS = (date) => date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1)
    
    // Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateGoogle(startDate)}/${formatDateGoogle(endDate)}&location=${encodeURIComponent(match.clubs?.address || match.clubs?.name || '')}&details=${encodeURIComponent(`Partie de padel organisée via PadelMatch\n\n${window.location.origin}/dashboard/match/${matchId}`)}`
    
    // ICS pour Apple/Outlook
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDateICS(startDate)}Z
DTEND:${formatDateICS(endDate)}Z
SUMMARY:${title}
LOCATION:${match.clubs?.address || match.clubs?.name || ''}
DESCRIPTION:Partie de padel organisée via PadelMatch
END:VEVENT
END:VCALENDAR`
    
    return { googleUrl, icsContent }
  }

  function downloadICS() {
    const { icsContent } = generateCalendarLinks()
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `padel-${match.match_date}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  function isOrganizer() {
    return user?.id === match?.organizer_id
  }

  function isParticipant() {
    return participants.some(p => p.user_id === user?.id)
  }

  function isMatchPast() {
    if (!match?.match_date || !match?.match_time) return false
    const matchDateTime = new Date(`${match.match_date}T${match.match_time}`)
    return new Date() > matchDateTime
  }

  function getPlayerCount() {
    return 1 + participants.length // Orga + participants
  }

  function getTeamPlayers(team) {
    return participants.filter(p => p.team === team)
  }

  // Préparer les équipes pour l'affichage
  function getTeamA() {
    const players = []
    // L'organisateur est dans l'équipe A par défaut (sauf s'il a choisi B)
    if (!match?.organizer_team || match?.organizer_team === 'A') {
      players.push({
        id: 'orga',
        user_id: match.organizer_id,
        profiles: match.profiles,
        isOrganizer: true,
        has_paid: true // L'orga est considéré comme ayant payé (il paye le terrain)
      })
    }
    // Ajouter les participants de l'équipe A
    participants.filter(p => p.team === 'A').forEach(p => players.push(p))
    return players
  }

  function getTeamB() {
    const players = []
    if (match?.organizer_team === 'B') {
      players.push({
        id: 'orga',
        user_id: match.organizer_id,
        profiles: match.profiles,
        isOrganizer: true,
        has_paid: true
      })
    }
    participants.filter(p => p.team === 'B').forEach(p => players.push(p))
    return players
  }

  function getUnassigned() {
    // L'organisateur n'est plus jamais "non assigné" - il est toujours en équipe A par défaut
    return participants.filter(p => !p.team)
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  const teamA = getTeamA()
  const teamB = getTeamB()
  const unassigned = getUnassigned()
  const pricePerPerson = match?.price_total ? (match.price_total / 4).toFixed(0) : null

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* Badge organisateur */}
      {isOrganizer() && (
        <div style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: '600',
          fontSize: 14
        }}>
          👑 Tu organises cette partie
        </div>
      )}

      {/* === HEADER === */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #eee'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' }}>
              {match?.clubs?.name}
            </h1>
            <div style={{ fontSize: 14, color: '#666' }}>
              📅 {formatDate(match?.match_date)} à {formatTime(match?.match_time)}
            </div>
            {match?.level_required && match.level_required !== 'all' && (
              <div style={{ fontSize: 13, color: '#2e7d32', marginTop: 4 }}>
                🎯 Niveau {match.level_required}+ recherché
              </div>
            )}
          </div>
          <div style={{
            background: getPlayerCount() >= 4 ? '#dcfce7' : '#fef3c7',
            color: getPlayerCount() >= 4 ? '#166534' : '#92400e',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: '600'
          }}>
            {getPlayerCount()}/4
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: 100
            }}
          >
            🔗 Inviter
          </button>
          
          {/* Bouton calendrier */}
          <button
            onClick={() => setShowCalendarModal(true)}
            style={{
              padding: '10px 16px',
              background: '#eff6ff',
              color: '#1e40af',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📅
          </button>
          
          {getPlayerCount() < 4 && (
            <button
              onClick={() => setShowSOSModal(true)}
              style={{
                padding: '10px 16px',
                background: '#fef3c7',
                color: '#92400e',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🆘 SOS
            </button>
          )}

          {isOrganizer() && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '10px 16px',
                background: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* === DEMANDES EN ATTENTE (Orga only) === */}
      {isOrganizer() && pendingRequests.length > 0 && (
        <div style={{
          background: '#fffbeb',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          border: '1px solid #fcd34d'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 12px', color: '#92400e' }}>
            📨 Demandes en attente ({pendingRequests.length})
          </h3>
          
          {pendingRequests.map(request => (
            <div key={request.id} style={{
              background: '#fff',
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div 
                  onClick={() => {
                    setSelectedPlayer(request)
                    setShowPlayerModal(true)
                  }}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {request.profiles?.avatar_url ? (
                      <img 
                        src={request.profiles.avatar_url} 
                        alt="" 
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16
                      }}>👤</div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                        {request.duo_with ? '👥 ' : ''}{request.profiles?.name}
                        {request.duo_with && ` + ${request.duo_profile?.name || 'Partenaire'}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        ⭐ {request.profiles?.level}/10 
                        {request.profiles?.ambiance && ` • ${request.profiles.ambiance === 'loisir' ? '😎' : request.profiles.ambiance === 'compet' ? '🏆' : '⚡'}`}
                        {request.profiles?.reliability_score && ` • ✅ ${request.profiles.reliability_score}%`}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => acceptRequest(request.id, request.user_id, request.duo_with)}
                    style={{
                      padding: '8px 14px',
                      background: '#dcfce7',
                      color: '#166534',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Accepter
                  </button>
                  <button
                    onClick={() => refuseRequest(request.id, request.duo_with)}
                    style={{
                      padding: '8px 14px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TABS === */}
      <div style={{
        display: 'flex',
        background: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16
      }}>
        {[
          { id: 'equipes', label: '👥 Équipes' },
          { id: 'infos', label: '📋 Infos' },
          { id: 'chat', label: '💬 Chat', count: messages.length },
          { id: 'paiement', label: '💰 Paiement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : '#666',
              fontWeight: activeTab === tab.id ? '600' : '400',
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: ÉQUIPES === */}
      {activeTab === 'equipes' && (
        <div>
          {/* Terrain visuel */}
          <div style={{
            background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16
          }}>
            {/* Ligne centrale */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 12,
              alignItems: 'center'
            }}>
              {/* Équipe A */}
              <div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: '600', 
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  ÉQUIPE A
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[0, 1].map(slot => {
                    const player = teamA[slot]
                    return (
                      <div
                        key={slot}
                        onClick={() => {
                          if (player) {
                            setSelectedPlayer(player)
                            setShowPlayerModal(true)
                          }
                        }}
                        style={{
                          background: player ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                          borderRadius: 12,
                          padding: player ? 12 : 16,
                          textAlign: 'center',
                          border: player ? 'none' : '2px dashed rgba(255,255,255,0.4)',
                          cursor: player ? 'pointer' : 'default',
                          transition: 'transform 0.1s',
                        }}
                      >
                        {player ? (
                          <>
                            {/* Photo mini */}
                            {player.profiles?.avatar_url ? (
                              <img 
                                src={player.profiles.avatar_url} 
                                alt="" 
                                style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  objectFit: 'cover',
                                  marginBottom: 4
                                }} 
                              />
                            ) : null}
                            <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }}>
                              {isFavorite(player.profiles?.id) && <span style={{ color: '#fbbf24' }}>⭐ </span>}{player.isOrganizer && '👑 '}{player.profiles?.name}
                            </div>
                            {player.isOrganizer && (
                              <div style={{ 
                                fontSize: 9, 
                                background: '#92400e', 
                                color: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: 4, 
                                display: 'inline-block',
                                marginTop: 2,
                                marginBottom: 2,
                                fontWeight: '600'
                              }}>
                                ORGA
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {player.profiles?.level}/10 • {player.profiles?.position === 'left' ? 'G' : player.profiles?.position === 'right' ? 'D' : '↔'}
                            </div>
                            {/* Indicateur paiement */}
                            {pricePerPerson > 0 && (
                              <div style={{
                                fontSize: 10,
                                color: player.has_paid ? '#22c55e' : '#f59e0b',
                                marginTop: 4
                              }}>
                                {player.has_paid ? '✓ Payé' : '💰 À payer'}
                              </div>
                            )}
                            {isOrganizer() && !player.isOrganizer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  swapPlayer(player.id)
                                }}
                                style={{
                                  marginTop: 6,
                                  padding: '4px 8px',
                                  background: '#f5f5f5',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  cursor: 'pointer'
                                }}
                              >
                                → Équipe B
                              </button>
                            )}
                          </>
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                            Libre
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* VS */}
              <div style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                VS
              </div>

              {/* Équipe B */}
              <div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: '600', 
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  ÉQUIPE B
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[0, 1].map(slot => {
                    const player = teamB[slot]
                    return (
                      <div
                        key={slot}
                        onClick={() => {
                          if (player) {
                            setSelectedPlayer(player)
                            setShowPlayerModal(true)
                          }
                        }}
                        style={{
                          background: player ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
                          borderRadius: 12,
                          padding: player ? 12 : 16,
                          textAlign: 'center',
                          border: player ? 'none' : '2px dashed rgba(255,255,255,0.4)',
                          cursor: player ? 'pointer' : 'default',
                          transition: 'transform 0.1s',
                        }}
                      >
                        {player ? (
                          <>
                            {/* Photo mini */}
                            {player.profiles?.avatar_url ? (
                              <img 
                                src={player.profiles.avatar_url} 
                                alt="" 
                                style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%', 
                                  objectFit: 'cover',
                                  marginBottom: 4
                                }} 
                              />
                            ) : null}
                            <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }}>
                              {isFavorite(player.profiles?.id) && <span style={{ color: '#fbbf24' }}>⭐ </span>}{player.isOrganizer && '👑 '}{player.profiles?.name}
                            </div>
                            {player.isOrganizer && (
                              <div style={{ 
                                fontSize: 9, 
                                background: '#92400e', 
                                color: '#fff', 
                                padding: '2px 6px', 
                                borderRadius: 4, 
                                display: 'inline-block',
                                marginTop: 2,
                                marginBottom: 2,
                                fontWeight: '600'
                              }}>
                                ORGA
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {player.profiles?.level}/10 • {player.profiles?.position === 'left' ? 'G' : player.profiles?.position === 'right' ? 'D' : '↔'}
                            </div>
                            {/* Indicateur paiement */}
                            {pricePerPerson > 0 && (
                              <div style={{
                                fontSize: 10,
                                color: player.has_paid ? '#22c55e' : '#f59e0b',
                                marginTop: 4
                              }}>
                                {player.has_paid ? '✓ Payé' : '💰 À payer'}
                              </div>
                            )}
                            {isOrganizer() && !player.isOrganizer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  swapPlayer(player.id)
                                }}
                                style={{
                                  marginTop: 6,
                                  padding: '4px 8px',
                                  background: '#f5f5f5',
                                  border: 'none',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  cursor: 'pointer'
                                }}
                              >
                                ← Équipe A
                              </button>
                            )}
                          </>
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                            Libre
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Joueurs non assignés */}
          {unassigned.length > 0 && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 16,
              border: '1px solid #eee',
              marginBottom: 16
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 12px', color: '#666' }}>
                🎲 Pas encore dans une équipe
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {unassigned.map(player => (
                  <div
                    key={player.id}
                    style={{
                      background: '#f5f5f5',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {isFavorite(player.profiles?.id) && <span style={{ color: '#fbbf24' }}>⭐ </span>}{player.isOrganizer && '👑 '}{player.profiles?.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {player.profiles?.level}/10
                    </span>
                    {isOrganizer() && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => assignTeam(player.id, 'A')}
                          style={{
                            padding: '4px 8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          →A
                        </button>
                        <button
                          onClick={() => assignTeam(player.id, 'B')}
                          style={{
                            padding: '4px 8px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          →B
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section présences (après l'heure du match) */}
          {isOrganizer() && match?.status !== 'completed' && isMatchPast() && (
            <div style={{
              background: '#fffbeb',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              border: '1px solid #fcd34d'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 12px', color: '#92400e' }}>
                📋 Qui était présent ?
              </h3>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
                Signale les absents pour mettre à jour leur score de fiabilité.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {participants.map(p => (
                  <div 
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#fff',
                      borderRadius: 10,
                      border: '1px solid #eee'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '500' }}>{p.profiles?.name}</span>
                      {p.showed_up === false && (
                        <span style={{ 
                          marginLeft: 8,
                          fontSize: 11,
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Absent signalé
                        </span>
                      )}
                    </div>
                    {p.showed_up !== false && (
                      <button
                        onClick={() => markNoShow(p.id, p.user_id, p.profiles?.name)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Absent
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton résultat (après la partie) */}
          {getPlayerCount() >= 4 && match?.status !== 'completed' && isOrganizer() && (
            <button
              onClick={() => setShowResultModal(true)}
              style={{
                width: '100%',
                padding: 14,
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🏆 Enregistrer le résultat
            </button>
          )}

          {/* Résultat affiché */}
          {match?.status === 'completed' && (
            <div style={{
              background: match.winner === 'A' ? '#dcfce7' : '#fef3c7',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center',
              border: `2px solid ${match.winner === 'A' ? '#16a34a' : '#f59e0b'}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }}>
                Équipe {match.winner} gagne !
              </div>
              {match.score_set1_a && (
                <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                  {match.score_set1_a}-{match.score_set1_b}
                  {match.score_set2_a && ` / ${match.score_set2_a}-${match.score_set2_b}`}
                  {match.score_set3_a && ` / ${match.score_set3_a}-${match.score_set3_b}`}
                </div>
              )}
              
              {/* Bouton télécharger carte victoire */}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/og/victory/${matchId}`)
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `victoire-padelmatch-${matchId}.png`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                  } catch (error) {
                    console.error('Download error:', error)
                    alert('Erreur lors du téléchargement')
                  }
                }}
                style={{
                  marginTop: 16,
                  padding: '12px 24px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 Télécharger la carte victoire
              </button>
            </div>
          )}

          {/* Quitter la partie */}
          {isParticipant() && !isOrganizer() && match?.status !== 'completed' && (
            <button
              onClick={leaveMatch}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 12,
                background: '#fff',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Quitter la partie
            </button>
          )}
        </div>
      )}

      {/* === TAB: INFOS === */}
      {activeTab === 'infos' && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #eee',
          overflow: 'hidden'
        }}>
          {/* Prix */}
          {pricePerPerson > 0 && (
            <div style={{
              padding: 20,
              borderBottom: '1px solid #eee',
              background: '#fef3c7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
                    💰 Prix du terrain
                  </div>
                  <div style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
                    {match?.price_total / 100}€ total
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    → {pricePerPerson}€ par personne
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {match?.profiles?.lydia_username && (
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      📱 Lydia: <strong>{match.profiles.lydia_username}</strong>
                    </div>
                  )}
                  {match?.profiles?.paypal_email && (
                    <div style={{ fontSize: 13, color: '#666' }}>
                      💳 PayPal: <strong>{match.profiles.paypal_email}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Infos de la partie */}
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: '600', margin: '0 0 16px', color: '#1a1a1a' }}>
              📅 Détails de la partie
            </h3>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{match?.clubs?.name}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{match?.clubs?.address}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>🗓️</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                    {new Date(match?.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>à {match?.match_time?.slice(0, 5)}</div>
                </div>
              </div>

              {match?.level_min && match?.level_max && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                      Niveau {match.level_min === match.level_max ? `${match.level_min}/10` : `${match.level_min} à ${match.level_max}/10`}
                    </div>
                  </div>
                </div>
              )}

              {match?.ambiance && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>
                    {match.ambiance === 'loisir' ? '😎' : match.ambiance === 'compet' ? '🏆' : '⚡'}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                      {match.ambiance === 'loisir' ? 'Détente' : match.ambiance === 'compet' ? 'Compétitif' : 'Équilibré'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {match?.description && (
            <div style={{ 
              padding: 20, 
              borderTop: '1px solid #eee',
              background: '#fafafa'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 8px', color: '#666' }}>
                ✏️ Description
              </h3>
              <p style={{ margin: 0, color: '#1a1a1a', lineHeight: 1.5 }}>
                {match.description}
              </p>
            </div>
          )}

          {/* Notes privées (visible uniquement si inscrit) */}
          {match?.private_notes && (isOrganizer() || participants.some(p => p.user_id === user?.id)) && (
            <div style={{ 
              padding: 20, 
              borderTop: '1px solid #eee',
              background: '#eff6ff'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 8px', color: '#1e40af' }}>
                🔒 Infos pratiques (réservé aux inscrits)
              </h3>
              <p style={{ margin: 0, color: '#1e40af', lineHeight: 1.5 }}>
                {match.private_notes}
              </p>
            </div>
          )}

          {/* Organisateur */}
          <div style={{ 
            padding: 20, 
            borderTop: '1px solid #eee'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: '600', margin: '0 0 12px', color: '#666' }}>
              👑 Organisateur
            </h3>
            <div 
              onClick={() => {
                if (match?.profiles) {
                  setSelectedPlayer({ profiles: match.profiles, isOrganizer: true })
                  setShowPlayerModal(true)
                }
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                cursor: 'pointer',
                padding: 12,
                background: '#fef3c7',
                borderRadius: 12,
                border: '2px solid #fbbf24'
              }}
            >
              {match?.profiles?.avatar_url ? (
                <img 
                  src={match.profiles.avatar_url} 
                  alt="" 
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  👑
                </div>
              )}
              <div>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {match?.profiles?.name}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  ⭐ {match?.profiles?.level}/10 • ✓ {match?.profiles?.reliability_score || 100}%
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#666' }}>→</div>
            </div>
          </div>
        </div>
      )}

      {/* === TAB: CHAT === */}
      {activeTab === 'chat' && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #eee',
          overflow: 'hidden'
        }}>
          {/* Messages */}
          <div style={{
            height: 300,
            overflowY: 'auto',
            padding: 16
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                Aucun message
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: 12,
                    textAlign: msg.user_id === user?.id ? 'right' : 'left'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    background: msg.user_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                    color: msg.user_id === user?.id ? '#fff' : '#1a1a1a',
                    padding: '8px 12px',
                    borderRadius: 12,
                    maxWidth: '80%'
                  }}>
                    {msg.user_id !== user?.id && (
                      <div style={{ fontSize: 11, fontWeight: '600', marginBottom: 2, opacity: 0.7 }}>
                        {msg.profiles?.name}
                      </div>
                    )}
                    <div style={{ fontSize: 14 }}>{msg.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            borderTop: '1px solid #eee',
            padding: 12,
            display: 'flex',
            gap: 8
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #eee',
                fontSize: 14
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              →
            </button>
          </form>
        </div>
      )}

      {/* === TAB: PAIEMENT === */}
      {activeTab === 'paiement' && (
        <div>
          {!pricePerPerson ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
              <p style={{ color: '#666' }}>
                L'organisateur n'a pas indiqué de prix
              </p>
            </div>
          ) : (
            <>
              {/* Montant */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                border: '1px solid #eee',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Ta participation
                </div>
                <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a' }}>
                  {pricePerPerson}€
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  ({match.price_total}€ ÷ 4 joueurs)
                </div>
              </div>

              {/* Moyens de paiement de l'orga */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                border: '1px solid #eee'
              }}>
                <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                  Payer {match.profiles?.name} via :
                </div>
                
                {match.profiles?.lydia_username && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(match.profiles.lydia_username)
                      alert('Pseudo Lydia copié !')
                    }}
                    style={{
                      width: '100%',
                      padding: 14,
                      marginBottom: 8,
                      background: '#f3e8ff',
                      color: '#7c3aed',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>💜 Lydia</span>
                    <span>@{match.profiles.lydia_username}</span>
                  </button>
                )}

                {match.profiles?.paypal_email && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(match.profiles.paypal_email)
                      alert('Email PayPal copié !')
                    }}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: '#dbeafe',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>💙 PayPal</span>
                    <span>{match.profiles.paypal_email}</span>
                  </button>
                )}

                {!match.profiles?.lydia_username && !match.profiles?.paypal_email && (
                  <div style={{ color: '#666', fontSize: 14 }}>
                    L'organisateur n'a pas configuré ses moyens de paiement
                  </div>
                )}
              </div>

              {/* Mon statut de paiement */}
              {isParticipant() && (
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #eee'
                }}>
                  {participants.find(p => p.user_id === user?.id)?.has_paid ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#16a34a',
                      fontWeight: '600'
                    }}>
                      ✅ Tu as marqué comme payé
                    </div>
                  ) : (
                    <button
                      onClick={markAsPaid}
                      style={{
                        width: '100%',
                        padding: 14,
                        background: '#dcfce7',
                        color: '#166534',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ J'ai payé
                    </button>
                  )}
                </div>
              )}

              {/* Vue orga : qui a payé */}
              {isOrganizer() && (
                <div style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 16,
                  border: '1px solid #eee'
                }}>
                  <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                    Statut des paiements
                  </div>
                  {participants.map(p => (
                    <div 
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #f5f5f5'
                      }}
                    >
                      <span>{p.profiles?.name}</span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: '600',
                        background: p.has_paid ? '#dcfce7' : '#fef3c7',
                        color: p.has_paid ? '#166534' : '#92400e'
                      }}>
                        {p.has_paid ? '✓ Payé' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === MODALS === */}

      {/* Modal Inviter */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 16px' }}>
              🔗 Inviter des joueurs
            </h2>
            
            <div style={{
              background: '#f5f5f5',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              wordBreak: 'break-all',
              fontSize: 13
            }}>
              {typeof window !== 'undefined' && `${window.location.origin}/join/${matchId}`}
            </div>

            <button
              onClick={copyInviteLink}
              style={{
                width: '100%',
                padding: 14,
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join/${matchId}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(`🎾 Rejoins notre partie de padel !\n${url}`)}`, '_blank')
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#dcfce7',
                  color: '#166534',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  padding: 12,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal SOS */}
      {showSOSModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowSOSModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 8px' }}>
              🆘 SOS Remplaçant
            </h2>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              Copie ce message pour trouver un joueur rapidement
            </p>
            
            <div style={{
              background: '#fef3c7',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              fontSize: 13,
              lineHeight: 1.5
            }}>
              🆘 Cherche {match?.spots_available || 1} joueur{(match?.spots_available || 1) > 1 ? 's' : ''} {match?.level_required !== 'all' ? `niveau ${match.level_required}+` : ''} pour {formatDate(match?.match_date)} à {formatTime(match?.match_time)} à {match?.clubs?.name} !
            </div>

            <button
              onClick={copySOSMessage}
              style={{
                width: '100%',
                padding: 14,
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📋 Copier le message SOS
            </button>
          </div>
        </div>
      )}

      {/* Modal Annuler */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 16px', color: '#dc2626' }}>
              ❌ Annuler la partie
            </h2>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motif de l'annulation..."
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #eee',
                fontSize: 14,
                minHeight: 80,
                resize: 'none',
                marginBottom: 16
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>
              <button
                onClick={cancelMatch}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résultat */}
      {showResultModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowResultModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 16px' }}>
              🏆 Enregistrer le résultat
            </h2>

            {/* Sélection du gagnant */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Qui a gagné ?
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setWinner('A')}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: '2px solid',
                    borderColor: winner === 'A' ? '#16a34a' : '#eee',
                    background: winner === 'A' ? '#dcfce7' : '#fff',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Équipe A
                </button>
                <button
                  onClick={() => setWinner('B')}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: '2px solid',
                    borderColor: winner === 'B' ? '#16a34a' : '#eee',
                    background: winner === 'B' ? '#dcfce7' : '#fff',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Équipe B
                </button>
              </div>
            </div>

            {/* Scores (optionnel) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Score <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
              </label>
              
              {/* Set 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666', width: 40 }}>Set 1</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s1a}
                  onChange={(e) => setScores({ ...scores, s1a: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
                <span>-</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s1b}
                  onChange={(e) => setScores({ ...scores, s1b: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
              </div>
              
              {/* Set 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666', width: 40 }}>Set 2</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s2a}
                  onChange={(e) => setScores({ ...scores, s2a: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
                <span>-</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s2b}
                  onChange={(e) => setScores({ ...scores, s2b: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
              </div>
              
              {/* Set 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#666', width: 40 }}>Set 3</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s3a}
                  onChange={(e) => setScores({ ...scores, s3a: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
                <span>-</span>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.s3b}
                  onChange={(e) => setScores({ ...scores, s3b: e.target.value })}
                  style={{ width: 50, padding: 8, borderRadius: 6, border: '1px solid #eee', textAlign: 'center' }}
                />
              </div>
            </div>

            <button
              onClick={saveResult}
              disabled={!winner}
              style={{
                width: '100%',
                padding: 14,
                background: winner ? '#1a1a1a' : '#e5e5e5',
                color: winner ? '#fff' : '#999',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: winner ? 'pointer' : 'not-allowed'
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Modal Calendrier */}
      {showCalendarModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCalendarModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 8px' }}>
              📅 Ajouter au calendrier
            </h2>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
              Pour recevoir un rappel avant le match
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={generateCalendarLinks()?.googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: 14,
                  background: '#fff',
                  border: '2px solid #eee',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: '600',
                  textDecoration: 'none',
                  color: '#1a1a1a'
                }}
              >
                <span>📆</span> Google Calendar
              </a>
              
              <button
                onClick={downloadICS}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: 14,
                  background: '#fff',
                  border: '2px solid #eee',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <span>🍎</span> Apple / Outlook
              </button>
            </div>

            <button
              onClick={() => setShowCalendarModal(false)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 12,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* === MODAL DÉTAIL JOUEUR === */}
      {showPlayerModal && selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 360,
            overflow: 'hidden'
          }}>
            {/* Header carte */}
            <div style={{
              background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
              padding: 24,
              color: '#fff'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎾</span>
                  <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: selectedPlayer.profiles?.reliability_score >= 90 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : selectedPlayer.profiles?.reliability_score >= 70 
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  color: selectedPlayer.profiles?.reliability_score >= 90 
                    ? '#4ade80' 
                    : selectedPlayer.profiles?.reliability_score >= 70 
                    ? '#fbbf24'
                    : '#ef4444',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  {selectedPlayer.profiles?.reliability_score >= 90 ? '✓' : '⚠'} {selectedPlayer.profiles?.reliability_score || 100}%
                </div>
              </div>

              {/* Photo + Nom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {selectedPlayer.profiles?.avatar_url ? (
                  <img
                    src={selectedPlayer.profiles.avatar_url}
                    alt="Avatar"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid rgba(255,255,255,0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28
                  }}>
                    👤
                  </div>
                )}
                <div>
                  <h3 style={{ 
                    fontSize: 24, 
                    fontWeight: '700', 
                    margin: 0
                  }}>
                    {selectedPlayer.profiles?.name}
                    {selectedPlayer.isOrganizer && ' 👑'}
                  </h3>
                  {selectedPlayer.profiles?.bio && (
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                      "{selectedPlayer.profiles.bio}"
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '700'
                }}>
                  ⭐ {selectedPlayer.profiles?.level}/10
                </span>
                {selectedPlayer.profiles?.ambiance && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 13
                  }}>
                    {selectedPlayer.profiles.ambiance === 'loisir' ? '😎 Détente' : 
                     selectedPlayer.profiles.ambiance === 'compet' ? '🏆 Compétitif' : '⚡ Équilibré'}
                  </span>
                )}
                {selectedPlayer.profiles?.position && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: 13
                  }}>
                    🎾 {selectedPlayer.profiles.position === 'left' ? 'Gauche' : 
                        selectedPlayer.profiles.position === 'right' ? 'Droite' : 'Les deux'}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 1,
              background: '#eee'
            }}>
              <div style={{ background: '#fff', padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a' }}>
                  {selectedPlayer.profiles?.matches_played || 0}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>parties</div>
              </div>
              <div style={{ background: '#fff', padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a' }}>
                  {selectedPlayer.profiles?.matches_played > 0 
                    ? Math.round((selectedPlayer.profiles?.matches_won || 0) / selectedPlayer.profiles.matches_played * 100)
                    : 0}%
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>victoires</div>
              </div>
              <div style={{ background: '#fff', padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: '700', color: selectedPlayer.profiles?.reliability_score >= 90 ? '#22c55e' : '#f59e0b' }}>
                  {selectedPlayer.profiles?.reliability_score || 100}%
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>fiabilité</div>
              </div>
            </div>

            {/* Paiement */}
            {pricePerPerson > 0 && (
              <div style={{
                padding: 16,
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: 14, color: '#666' }}>
                  💰 Paiement ({pricePerPerson}€)
                </div>
                <div style={{
                  background: selectedPlayer.has_paid ? '#dcfce7' : '#fef3c7',
                  color: selectedPlayer.has_paid ? '#166534' : '#92400e',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '600'
                }}>
                  {selectedPlayer.has_paid ? '✓ Payé' : '⏳ En attente'}
                </div>
              </div>
            )}

            {/* Bouton Favoris */}
            {selectedPlayer.profiles?.id && selectedPlayer.profiles.id !== user?.id && (
              <div style={{ padding: '0 16px 16px' }}>
                <button
                  onClick={() => toggleFavorite(selectedPlayer.profiles.id, selectedPlayer.profiles.name)}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: isFavorite(selectedPlayer.profiles.id) ? '#fef3c7' : '#fff',
                    color: isFavorite(selectedPlayer.profiles.id) ? '#92400e' : '#666',
                    border: isFavorite(selectedPlayer.profiles.id) ? '2px solid #fbbf24' : '2px solid #eee',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {isFavorite(selectedPlayer.profiles.id) ? '⭐ Dans mes favoris' : '☆ Ajouter aux favoris'}
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowPlayerModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              {selectedPlayer.profiles?.id && selectedPlayer.profiles.id !== user?.id && (
                <a
                  href={`/player/${selectedPlayer.profiles.id}`}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  Voir profil →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}