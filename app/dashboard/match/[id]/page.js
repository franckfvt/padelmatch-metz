'use client'

/**
 * ============================================
 * PAGE GESTION D'UN MATCH - Version COMPLÈTE
 * ============================================
 * 
 * Fonctionnalités complètes :
 * - Header avec infos modifiables
 * - Alerte si infos manquantes
 * - Partage : WhatsApp, SMS, lien, image, QR
 * - Équipes A/B avec swap
 * - Inscription en duo
 * - Demandes en attente
 * - Chat avec @mentions
 * - Paiement visible si confirmé
 * - Résultat + mise à jour stats
 * - Dupliquer une partie
 * - Ajouter au calendrier
 * - Joueurs non assignés
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ShareMatchModal from '@/app/components/ShareMatchModal'

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
  const [favorites, setFavorites] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  // UI
  const [newMessage, setNewMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  // Modals
  const [modal, setModal] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Forms
  const [inviteForm, setInviteForm] = useState({ team: 'A', name: '', contact: '' })
  const [cancelReason, setCancelReason] = useState('')
  const [resultForm, setResultForm] = useState({ winner: '', scores: {} })
  const [joinTeam, setJoinTeam] = useState('A')
  const [editForm, setEditForm] = useState({})
  
  // Duo
  const [joinAsDuo, setJoinAsDuo] = useState(false)
  const [duoSearch, setDuoSearch] = useState('')
  const [duoResults, setDuoResults] = useState([])
  const [duoSelected, setDuoSelected] = useState(null)

  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)

  // Labels
  const ambianceLabels = { 'loisir': 'Détente', 'mix': 'Équilibré', 'compet': 'Compétitif' }
  const ambianceEmojis = { 'loisir': '😎', 'mix': '⚡', 'compet': '🏆' }
  const positionLabels = { 'left': 'Gauche', 'right': 'Droite', 'both': 'Les deux' }
  const paymentLabels = { 'paylib': 'Paylib', 'lydia': 'Lydia', 'cash': 'Espèces' }

  // === CHARGEMENT ===
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

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(profileData)

      const { data: matchData } = await supabase
        .from('matches')
        .select(`*, clubs (id, name, address, phone, website), profiles!matches_organizer_id_fkey (id, name, level, position, ambiance, avatar_url, reliability_score, phone, lydia_username, paypal_email)`)
        .eq('id', matchId)
        .single()

      if (!matchData) { router.push('/dashboard'); return }
      setMatch(matchData)
      setEditForm({
        match_date: matchData.match_date || '',
        match_time: matchData.match_time || ''
      })

      const { data: participantsData, error: partError } = await supabase
        .from('match_participants')
        .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, ambiance, avatar_url, reliability_score, phone)`)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])
      
      // Debug: voir les participants chargés
      if (partError) {
        console.error('Error loading participants:', partError)
      }
      console.log('Participants loaded:', participantsData?.map(p => ({
        id: p.id,
        name: p.profiles?.name,
        team: p.team,
        status: p.status
      })))
      
      setParticipants(participantsData || [])

      // Pour @mentions
      const allPlayersInMatch = [
        matchData.profiles,
        ...(participantsData || []).map(p => p.profiles)
      ].filter(Boolean)
      setAllProfiles(allPlayersInMatch)

      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase
          .from('match_participants')
          .select(`*, profiles!match_participants_user_id_fkey (id, name, level, position, avatar_url, reliability_score)`)
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

      const { data: favoritesData } = await supabase.from('player_favorites').select('favorite_id').eq('user_id', session.user.id)
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
      .select(`*, profiles (id, name)`)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)
    setMessages(data || [])
  }

  // === HELPERS ===
  const isOrganizer = () => match?.organizer_id === user?.id
  const isParticipant = () => participants.some(p => p.user_id === user?.id && p.status === 'confirmed')
  const isConfirmed = () => isOrganizer() || isParticipant()
  const isFavorite = (id) => favorites.includes(id)
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / 4) : 0

  function getMissingInfos() {
    const missing = []
    if (!match?.match_date) missing.push('Date')
    if (!match?.match_time) missing.push('Heure')
    if (!match?.club_id && !match?.city) missing.push('Lieu')
    return missing
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getPlayerCount() {
    const confirmed = participants.filter(p => p.status === 'confirmed').length
    return confirmed + 1 + pendingInvites.length
  }

  function getSpotsLeft() {
    return 4 - getPlayerCount()
  }

  // Équipes
  const orgaPlayer = {
    isOrganizer: true,
    profiles: match?.profiles,
    team: match?.organizer_team || 'A',
    status: 'confirmed',
    user_id: match?.organizer_id
  }

  const confirmedParticipants = participants.filter(p => p.status === 'confirmed')
  const pendingParticipants = participants.filter(p => p.status === 'pending')

  const allPlayers = [
    orgaPlayer,
    ...confirmedParticipants,
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true, status: 'invited' }))
  ]

  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const unassigned = allPlayers.filter(p => !p.team && !p.isOrganizer)

  // Debug: voir les équipes
  console.log('All players:', allPlayers.map(p => ({ 
    name: p.profiles?.name || p.invitee_name, 
    team: p.team, 
    isOrganizer: p.isOrganizer 
  })))
  console.log('Team A:', teamA.length, 'Team B:', teamB.length, 'Unassigned:', unassigned.length)

  // === ACTIONS ===

  // Chat avec @mentions
  function handleMessageChange(e) {
    const value = e.target.value
    setNewMessage(value)

    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1)
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase())
        setShowMentions(true)
        return
      }
    }
    setShowMentions(false)
  }

  function insertMention(playerName) {
    const lastAtIndex = newMessage.lastIndexOf('@')
    const beforeAt = newMessage.slice(0, lastAtIndex)
    setNewMessage(`${beforeAt}@${playerName} `)
    setShowMentions(false)
    messageInputRef.current?.focus()
  }

  function getFilteredMentions() {
    if (!mentionSearch) return allProfiles.slice(0, 5)
    return allProfiles.filter(p =>
      p.name?.toLowerCase().includes(mentionSearch)
    ).slice(0, 5)
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
    setShowMentions(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${matchId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function acceptRequest(request) {
    try {
      await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', request.id)
      
      // Si duo, accepter le partenaire aussi
      if (request.duo_with) {
        await supabase.from('match_participants').update({ status: 'confirmed' }).eq('match_id', matchId).eq('user_id', request.duo_with)
      }
      
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `✅ ${request.profiles?.name}${request.duo_profile ? ` + ${request.duo_profile.name}` : ''} a rejoint la partie`
      })

      // Envoyer email de confirmation au joueur accepté
      try {
        const { data: playerData } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', request.user_id)
          .single()

        if (playerData?.email) {
          await fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'join_accepted',
              data: {
                playerEmail: playerData.email,
                playerName: playerData.name,
                organizerName: profile?.name,
                matchId: matchId,
                matchDate: formatDateEmail(match.match_date),
                matchTime: match.match_time?.slice(0, 5) || '?h',
                clubName: match.clubs?.name || match.city || 'Lieu à définir',
                team: `Équipe ${request.team}`
              }
            })
          })
        }
      } catch (emailError) {
        console.error('Erreur envoi email acceptation:', emailError)
      }

      // Vérifier si la partie est maintenant complète
      const { data: updatedParticipants } = await supabase
        .from('match_participants')
        .select('*, profiles(id, name, email)')
        .eq('match_id', matchId)
        .eq('status', 'confirmed')

      if (updatedParticipants?.length >= 4) {
        // Partie complète ! Notifier tout le monde
        await supabase.from('matches').update({ status: 'full' }).eq('id', matchId)
        
        const teamAPlayers = updatedParticipants.filter(p => p.team === 'A').map(p => p.profiles?.name).filter(Boolean)
        const teamBPlayers = updatedParticipants.filter(p => p.team === 'B').map(p => p.profiles?.name).filter(Boolean)

        // Envoyer email à chaque joueur
        for (const participant of updatedParticipants) {
          if (participant.profiles?.email) {
            try {
              await fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'match_complete',
                  data: {
                    playerEmail: participant.profiles.email,
                    matchId: matchId,
                    matchDate: formatDateEmail(match.match_date),
                    matchTime: match.match_time?.slice(0, 5) || '?h',
                    clubName: match.clubs?.name || match.city || 'Lieu à définir',
                    teamA: teamAPlayers,
                    teamB: teamBPlayers
                  }
                })
              })
            } catch (e) {
              console.error('Erreur email complet:', e)
            }
          }
        }
      }

      loadData()
    } catch (error) { console.error(error) }
  }

  async function refuseRequest(request) {
    try {
      await supabase.from('match_participants').update({ status: 'refused' }).eq('id', request.id)
      if (request.duo_with) {
        await supabase.from('match_participants').update({ status: 'refused' }).eq('match_id', matchId).eq('user_id', request.duo_with)
      }

      // Envoyer email de refus au joueur
      try {
        const { data: playerData } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', request.user_id)
          .single()

        if (playerData?.email) {
          await fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'join_rejected',
              data: {
                playerEmail: playerData.email,
                organizerName: profile?.name,
                matchId: matchId
              }
            })
          })
        }
      } catch (emailError) {
        console.error('Erreur envoi email refus:', emailError)
      }

      loadData()
    } catch (error) { console.error(error) }
  }

  // Helper pour formater date email
  function formatDateEmail(dateStr) {
    if (!dateStr) return 'Date à définir'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  async function assignTeam(participantId, team) {
    await supabase.from('match_participants').update({ team }).eq('id', participantId)
    loadData()
  }

  async function swapPlayer(participantId, toTeam) {
    await supabase.from('match_participants').update({ team: toTeam }).eq('id', participantId)
    loadData()
  }

  // Recherche duo
  async function searchDuo(query) {
    setDuoSearch(query)
    if (query.length < 2) { setDuoResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, name, level, avatar_url')
      .neq('id', user.id)
      .ilike('name', `%${query}%`)
      .limit(5)
    setDuoResults(data || [])
  }

  async function joinMatch() {
    try {
      const insertData = {
        match_id: parseInt(matchId),
        user_id: user.id,
        status: 'pending',
        team: joinTeam,
        duo_with: duoSelected?.id || null
      }

      const { error } = await supabase.from('match_participants').insert(insertData)
      if (error) throw error

      // Si duo, ajouter le partenaire aussi
      if (joinAsDuo && duoSelected) {
        await supabase.from('match_participants').insert({
          match_id: parseInt(matchId),
          user_id: duoSelected.id,
          status: 'pending',
          team: joinTeam,
          duo_with: user.id
        })
      }

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `🎾 ${profile?.name}${duoSelected ? ` + ${duoSelected.name}` : ''} demande à rejoindre`
      })

      setModal(null)
      setJoinAsDuo(false)
      setDuoSelected(null)
      loadData()
    } catch (error) {
      console.error(error)
      alert(error.message?.includes('duplicate') ? 'Tu es déjà inscrit' : 'Erreur')
    }
  }

  async function leaveMatch() {
    if (!confirm('Tu veux vraiment quitter cette partie ?')) return
    try {
      const matchDateTime = new Date(`${match.match_date}T${match.match_time}`)
      const hoursUntilMatch = (matchDateTime - new Date()) / (1000 * 60 * 60)
      
      await supabase.from('match_participants').update({ 
        status: 'cancelled', 
        cancelled_at: new Date().toISOString() 
      }).eq('match_id', matchId).eq('user_id', user.id)
      
      // Mettre à jour le score de fiabilité
      await supabase.rpc('update_reliability_score', { 
        p_user_id: user.id, 
        p_action: hoursUntilMatch < 24 ? 'late_cancel' : 'early_cancel' 
      })
      
      await supabase.from('match_messages').insert({ 
        match_id: parseInt(matchId), 
        user_id: user.id, 
        message: `👋 ${profile?.name} a quitté la partie` 
      })
      router.push('/dashboard/matches')
    } catch (error) { console.error(error) }
  }

  async function cancelMatch() {
    if (!cancelReason.trim()) { alert('Donne un motif'); return }
    await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `❌ PARTIE ANNULÉE : ${cancelReason}` })
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId)
    router.push('/dashboard/matches')
  }

  async function sendInvite() {
    if (!inviteForm.name.trim()) { alert('Indique un nom'); return }
    try {
      await supabase.from('pending_invites').insert({
        match_id: parseInt(matchId),
        inviter_id: user.id,
        invitee_name: inviteForm.name,
        invitee_contact: inviteForm.contact,
        team: inviteForm.team,
        invite_token: crypto.randomUUID()
      })
      await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `📨 ${inviteForm.name} a été invité(e)` })
      setInviteForm({ team: 'A', name: '', contact: '' })
      setModal(null)
      loadData()
    } catch (error) { console.error(error) }
  }

  async function saveResult() {
    if (!resultForm.winner) { alert('Sélectionne le gagnant'); return }
    
    // Feedback: indiquer que la sauvegarde est en cours
    const btn = document.activeElement
    if (btn) {
      btn.disabled = true
      btn.textContent = '⏳ Sauvegarde en cours...'
    }
    
    try {
      const { error: updateError } = await supabase.from('matches').update({
        winner: resultForm.winner,
        status: 'completed',
        score_set1_a: resultForm.scores.s1a || null,
        score_set1_b: resultForm.scores.s1b || null,
        score_set2_a: resultForm.scores.s2a || null,
        score_set2_b: resultForm.scores.s2b || null,
        score_set3_a: resultForm.scores.s3a || null,
        score_set3_b: resultForm.scores.s3b || null,
      }).eq('id', matchId)

      if (updateError) {
        console.error('Erreur update match:', updateError)
        alert('Erreur lors de la sauvegarde du résultat. Vérifie que tu es bien l\'organisateur.')
        return
      }

      // Récupérer les IDs des équipes
      const teamAIds = [...teamA.filter(p => !p.isPendingInvite).map(p => p.user_id || p.profiles?.id)]
      const teamBIds = [...teamB.filter(p => !p.isPendingInvite).map(p => p.user_id || p.profiles?.id)]
      
      const winners = resultForm.winner === 'A' ? teamAIds : teamBIds
      const losers = resultForm.winner === 'A' ? teamBIds : teamAIds

      // Mettre à jour les stats des gagnants
      for (const id of winners.filter(Boolean)) {
        const { data: p } = await supabase
          .from('profiles')
          .select('matches_played, matches_won, current_streak, best_streak')
          .eq('id', id)
          .single()
        if (p) {
          const newStreak = (p.current_streak || 0) + 1
          await supabase.from('profiles').update({
            matches_played: (p.matches_played || 0) + 1,
            matches_won: (p.matches_won || 0) + 1,
            current_streak: newStreak,
            best_streak: Math.max(newStreak, p.best_streak || 0)
          }).eq('id', id)
        }
      }

      // Mettre à jour les stats des perdants
      for (const id of losers.filter(Boolean)) {
        const { data: p } = await supabase
          .from('profiles')
          .select('matches_played')
          .eq('id', id)
          .single()
        if (p) {
          await supabase.from('profiles').update({ 
            matches_played: (p.matches_played || 0) + 1, 
            current_streak: 0 
          }).eq('id', id)
        }
      }

      await supabase.from('match_messages').insert({ 
        match_id: parseInt(matchId), 
        user_id: user.id, 
        message: `🏆 L'équipe ${resultForm.winner} a gagné !` 
      })
      
      // Succès !
      alert('✅ Résultat enregistré ! Les stats ont été mises à jour.')
      setModal(null)
      loadData()
    } catch (error) { 
      console.error('Erreur saveResult:', error) 
      alert('Une erreur est survenue. Réessaie.')
    } finally {
      // Réactiver le bouton
      if (btn) {
        btn.disabled = false
        btn.textContent = '✓ Enregistrer le résultat'
      }
    }
  }

  async function saveMatchInfos() {
    try {
      await supabase.from('matches').update({
        match_date: editForm.match_date || null,
        match_time: editForm.match_time || null
      }).eq('id', matchId)
      setModal(null)
      loadData()
    } catch (error) { console.error(error) }
  }

  async function toggleFavorite(playerId) {
    if (isFavorite(playerId)) {
      await supabase.from('player_favorites').delete().eq('user_id', user.id).eq('favorite_id', playerId)
      setFavorites(prev => prev.filter(id => id !== playerId))
    } else {
      await supabase.from('player_favorites').insert({ user_id: user.id, favorite_id: playerId })
      setFavorites(prev => [...prev, playerId])
    }
  }

  // Dupliquer la partie
  async function duplicateMatch() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          organizer_team: match.organizer_team,
          club_id: match.club_id,
          level_min: match.level_min,
          level_max: match.level_max,
          ambiance: match.ambiance,
          price_total: match.price_total,
          payment_method: match.payment_method,
          spots_total: 4,
          spots_available: 3,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error
      router.push(`/dashboard/match/${data.id}`)
    } catch (error) {
      console.error(error)
      alert('Erreur lors de la duplication')
    }
  }

  // Ajouter au calendrier
  function addToCalendar() {
    if (!match.match_date || !match.match_time) {
      alert('Date et heure requises pour ajouter au calendrier')
      return
    }

    const startDate = new Date(`${match.match_date}T${match.match_time}`)
    const endDate = new Date(startDate.getTime() + 90 * 60000)

    const formatDateCal = (date) => date.toISOString().replace(/-|:|\.\d+/g, '')

    const title = encodeURIComponent(`🎾 Padel - ${match.clubs?.name || 'Partie'}`)
    const details = encodeURIComponent(`Niveau ${match.level_min}-${match.level_max}\n${ambianceLabels[match.ambiance]}\n\nLien: ${window.location.origin}/join/${matchId}`)
    const location = encodeURIComponent(match.clubs?.address || match.city || '')

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateCal(startDate)}/${formatDateCal(endDate)}&details=${details}&location=${location}`
    
    window.open(googleUrl, '_blank')
  }

  // QR Code URL
  function getQRCodeUrl() {
    const joinUrl = `${window.location.origin}/join/${matchId}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`
  }

  // === RENDER ===
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ fontSize: 40 }}>🎾</div>
        <div style={{ color: '#666', marginTop: 16 }}>Chargement...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ fontSize: 40 }}>❌</div>
        <div style={{ color: '#666', marginTop: 16 }}>Partie introuvable</div>
        <Link href="/dashboard/matches" style={{ color: '#22c55e', marginTop: 16, display: 'inline-block' }}>← Retour</Link>
      </div>
    )
  }

  const isMatchPast = match.match_date && match.match_time && new Date(`${match.match_date}T${match.match_time}`) < new Date()
  const canJoin = !isOrganizer() && !isParticipant() && !pendingParticipants.some(p => p.user_id === user?.id) && getSpotsLeft() > 0 && match.status === 'open'
  const missingInfos = getMissingInfos()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>

      {/* === ALERTE INFOS MANQUANTES === */}
      {isOrganizer() && missingInfos.length > 0 && match.status === 'open' && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: '600', color: '#92400e', fontSize: 14 }}>⚠️ Infos manquantes</div>
            <div style={{ fontSize: 13, color: '#a16207' }}>{missingInfos.join(', ')}</div>
          </div>
          <button
            onClick={() => setModal('edit')}
            style={{
              padding: '8px 14px',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Compléter
          </button>
        </div>
      )}

      {/* === HEADER INFOS === */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#22c55e', fontWeight: '600', marginBottom: 2 }}>
              {formatDate(match.match_date)}
            </div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
              {match.match_time?.slice(0, 5) || '??:??'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#1a1a1a', fontWeight: '600' }}>
              📍 {match.clubs?.name || match.city || 'Lieu à définir'}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {match.clubs?.address || (match.radius ? `${match.radius}km autour` : '')}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={badgeStyle}>⭐ Niv. {match.level_min}-{match.level_max}</span>
          <span style={badgeStyle}>{ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}</span>
          {pricePerPerson > 0 && <span style={{ ...badgeStyle, background: '#fef3c7', color: '#92400e' }}>💰 {pricePerPerson}€/pers</span>}
          <span style={{
            ...badgeStyle,
            background: getSpotsLeft() > 0 ? '#dcfce7' : '#fee2e2',
            color: getSpotsLeft() > 0 ? '#166534' : '#dc2626'
          }}>
            {getSpotsLeft() > 0 ? `${getSpotsLeft()} place${getSpotsLeft() > 1 ? 's' : ''}` : 'Complet'}
          </span>
        </div>

        {/* Status */}
        {match.status === 'cancelled' && (
          <div style={{ padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 10, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
            ❌ Partie annulée
          </div>
        )}
        {match.status === 'completed' && (
          <div style={{ padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 10, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
            ✅ Terminée {match.winner && `• Équipe ${match.winner} 🏆`}
          </div>
        )}

        {/* Boutons actions */}
        {match.status === 'open' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setModal('share')}
              style={{
                flex: 1,
                minWidth: 100,
                padding: '12px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📤 Partager
            </button>
            {isOrganizer() && getSpotsLeft() > 0 && (
              <button
                onClick={() => setModal('invite')}
                style={{
                  flex: 1,
                  minWidth: 100,
                  padding: '12px',
                  background: '#f5f5f5',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                👥 Inviter
              </button>
            )}
            {isOrganizer() && (
              <button
                onClick={() => setModal('cancel')}
                style={{
                  padding: '12px 16px',
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
        )}

        {/* Actions secondaires */}
        {match.status === 'open' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setModal('qrcode')} style={btnSmall}>📱 QR Code</button>
            <button onClick={addToCalendar} style={btnSmall}>📅 Calendrier</button>
            {isOrganizer() && <button onClick={duplicateMatch} style={btnSmall}>📋 Dupliquer</button>}
          </div>
        )}
      </div>

      {/* === DEMANDES EN ATTENTE === */}
      {isOrganizer() && pendingRequests.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 12 }}>
            📨 {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
          </div>
          {pendingRequests.map(req => (
            <div key={req.id} style={{
              background: '#fff',
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <Avatar profile={req.profiles} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: 15 }}>
                  {req.duo_with ? '👥 ' : ''}{req.profiles?.name}{req.duo_profile ? ` + ${req.duo_profile.name}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  ⭐ {req.profiles?.level}/10 • {positionLabels[req.profiles?.position] || 'Polyvalent'} • ✓ {req.profiles?.reliability_score || 100}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => acceptRequest(req)} style={{ padding: '8px 14px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: '600', cursor: 'pointer' }}>✓</button>
                <button onClick={() => refuseRequest(req)} style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: '600', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === ÉQUIPES === */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 12 }}>
          {/* Équipe A */}
          <div>
            <div style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 10, textAlign: 'center', letterSpacing: 1 }}>ÉQUIPE A</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1].map(i => (
                <PlayerSlot 
                  key={i} 
                  player={teamA[i]} 
                  onSelect={(p) => { setSelectedPlayer(p); setModal('player') }}
                  isOrg={isOrganizer()}
                  onSwap={(id) => swapPlayer(id, 'B')}
                  showPayment={pricePerPerson > 0}
                />
              ))}
            </div>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.8)' }}>VS</div>
          </div>

          {/* Équipe B */}
          <div>
            <div style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 10, textAlign: 'center', letterSpacing: 1 }}>ÉQUIPE B</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1].map(i => (
                <PlayerSlot 
                  key={i} 
                  player={teamB[i]} 
                  onSelect={(p) => { setSelectedPlayer(p); setModal('player') }}
                  isOrg={isOrganizer()}
                  onSwap={(id) => swapPlayer(id, 'A')}
                  showPayment={pricePerPerson > 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bouton Résultat */}
        {isOrganizer() && isMatchPast && match.status !== 'completed' && (
          <button onClick={() => setModal('result')} style={{ width: '100%', marginTop: 16, padding: 14, background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
            🏆 Enregistrer le résultat
          </button>
        )}
      </div>

      {/* Joueurs non assignés */}
      {unassigned.length > 0 && isOrganizer() && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>À assigner</div>
          {unassigned.map(p => (
            <div key={p.id || p.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar profile={p.profiles} size={36} />
                <span style={{ fontWeight: '500' }}>{p.profiles?.name || p.invitee_name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => assignTeam(p.id, 'A')} style={{ ...btnSmall, background: '#f5f5f5' }}>→ A</button>
                <button onClick={() => assignTeam(p.id, 'B')} style={{ ...btnSmall, background: '#f5f5f5' }}>→ B</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === INFOS & PAIEMENT === */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
        <button 
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          style={{ width: '100%', padding: 16, background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 15 }}
        >
          <span style={{ fontWeight: '600' }}>📋 Infos & paiement</span>
          <span style={{ color: '#999' }}>{showMoreInfo ? '▲' : '▼'}</span>
        </button>
        
        {showMoreInfo && (
          <div style={{ borderTop: '1px solid #eee' }}>
            {/* Organisateur */}
            <div 
              onClick={() => { setSelectedPlayer({ profiles: match.profiles, isOrganizer: true }); setModal('player') }}
              style={{ padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <Avatar profile={match.profiles} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Organisateur</div>
                <div style={{ fontWeight: '600' }}>{match.profiles?.name}</div>
              </div>
              <span style={{ color: '#ccc' }}>›</span>
            </div>

            {/* Prix */}
            {pricePerPerson > 0 && isConfirmed() && (
              <div style={{ padding: 16, borderBottom: '1px solid #eee', background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#92400e' }}>Prix par personne</div>
                    <div style={{ fontSize: 24, fontWeight: '700' }}>{pricePerPerson}€</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13 }}>
                    <div style={{ fontWeight: '600' }}>{paymentLabels[match.payment_method]}</div>
                    {match.profiles?.phone && <div style={{ color: '#666' }}>📱 {match.profiles.phone}</div>}
                    {match.profiles?.lydia_username && <div style={{ color: '#666' }}>Lydia: {match.profiles.lydia_username}</div>}
                    {match.profiles?.paypal_email && <div style={{ color: '#666' }}>PayPal: {match.profiles.paypal_email}</div>}
                  </div>
                </div>
              </div>
            )}
            {pricePerPerson > 0 && !isConfirmed() && (
              <div style={{ padding: 16, borderBottom: '1px solid #eee', textAlign: 'center', color: '#888', fontSize: 13 }}>
                🔒 Infos paiement visibles après confirmation
              </div>
            )}

            {/* Description */}
            {match.description && (
              <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Description</div>
                <div style={{ lineHeight: 1.6 }}>{match.description}</div>
              </div>
            )}

            {/* Notes privées */}
            {match.private_notes && isConfirmed() && (
              <div style={{ padding: 16, background: '#eff6ff' }}>
                <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 4 }}>🔒 Infos pratiques (réservé aux inscrits)</div>
                <div style={{ color: '#1e40af', lineHeight: 1.6 }}>{match.private_notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === CHAT AVEC @MENTIONS === */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: '1px solid #eee', fontWeight: '600', fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💬 Discussion</span>
          <span style={{ fontSize: 13, color: '#999', fontWeight: '400' }}>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
        </div>

        <div style={{ height: 220, overflowY: 'auto', padding: 14 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 30 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13 }}>Aucun message</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Sois le premier à écrire !</div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'block',
                  background: msg.user_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                  color: msg.user_id === user?.id ? '#fff' : '#1a1a1a',
                  padding: '10px 14px',
                  borderRadius: 12,
                  maxWidth: '80%',
                  width: 'fit-content',
                  marginLeft: msg.user_id === user?.id ? 'auto' : 0
                }}>
                  {msg.user_id !== user?.id && (
                    <div style={{ fontSize: 11, fontWeight: '600', marginBottom: 3, opacity: 0.7 }}>{msg.profiles?.name}</div>
                  )}
                  <div style={{ fontSize: 14 }} dangerouslySetInnerHTML={{
                    __html: msg.message.replace(/@(\w+)/g, '<strong style="color:#22c55e">@$1</strong>')
                  }} />
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input avec suggestions @mentions */}
        <div style={{ position: 'relative' }}>
          {showMentions && getFilteredMentions().length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 12,
              right: 12,
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 10,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {getFilteredMentions().map(p => (
                <div
                  key={p.id}
                  onClick={() => insertMention(p.name)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  <Avatar profile={p} size={28} />
                  <span style={{ fontWeight: '500' }}>{p.name}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} style={{ borderTop: '1px solid #eee', padding: 12, display: 'flex', gap: 8 }}>
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder="Écrire... (@ pour mentionner)"
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" style={{ padding: '12px 18px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>→</button>
          </form>
        </div>
      </div>

      {/* === CTA FIXE === */}
      {canJoin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e5e5', padding: 16, zIndex: 100 }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button onClick={() => setModal('join')} style={{ width: '100%', padding: 16, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: '600', cursor: 'pointer' }}>
              Demander à rejoindre
            </button>
          </div>
        </div>
      )}

      {isParticipant() && !isOrganizer() && match.status === 'open' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e5e5', padding: 16, zIndex: 100 }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button onClick={leaveMatch} style={{ width: '100%', padding: 16, background: '#fff', color: '#dc2626', border: '2px solid #fee2e2', borderRadius: 12, fontSize: 16, fontWeight: '600', cursor: 'pointer' }}>
              Quitter la partie
            </button>
          </div>
        </div>
      )}

      {/* === MODALS === */}

      {/* Modal Partager */}
      {modal === 'share' && (
        <ShareMatchModal 
          match={match} 
          players={participants.filter(p => p.status === 'confirmed')} 
          onClose={() => setModal(null)} 
        />
      )}

      {/* Modal QR Code */}
      {modal === 'qrcode' && (
        <Modal onClose={() => setModal(null)} title="QR Code">
          <div style={{ textAlign: 'center' }}>
            <img src={getQRCodeUrl()} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 16px' }} />
            <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>Scanne ce code pour rejoindre la partie</p>
            <button onClick={copyLink} style={{ ...btnPrimary, width: '100%' }}>{copied ? '✓ Lien copié !' : '📋 Copier le lien'}</button>
          </div>
        </Modal>
      )}

      {/* Modal Rejoindre avec option duo */}
      {modal === 'join' && (
        <Modal onClose={() => setModal(null)} title="Rejoindre la partie">
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            Tu demandes à rejoindre. L'organisateur devra accepter.
          </p>

          {/* Option duo */}
          {getSpotsLeft() >= 2 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={joinAsDuo}
                  onChange={(e) => {
                    setJoinAsDuo(e.target.checked)
                    if (!e.target.checked) {
                      setDuoSelected(null)
                      setDuoSearch('')
                    }
                  }}
                  style={{ width: 20, height: 20 }}
                />
                <span style={{ fontWeight: '600' }}>👥 Je viens avec un partenaire</span>
              </label>

              {joinAsDuo && (
                <div style={{ marginTop: 12 }}>
                  {duoSelected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                      <Avatar profile={duoSelected} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>{duoSelected.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>Niveau {duoSelected.level}/10</div>
                      </div>
                      <button onClick={() => { setDuoSelected(null); setDuoSearch('') }} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>×</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={duoSearch}
                        onChange={(e) => searchDuo(e.target.value)}
                        placeholder="Rechercher ton partenaire..."
                        style={inputStyle}
                      />
                      {duoResults.length > 0 && (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                          {duoResults.map(p => (
                            <div
                              key={p.id}
                              onClick={() => { setDuoSelected(p); setDuoResults([]) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                            >
                              <Avatar profile={p} size={32} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500' }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>Niveau {p.level}/10</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Quelle équipe ?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A', 'B'].map(team => (
                <button key={team} onClick={() => setJoinTeam(team)} style={{
                  flex: 1, padding: 14,
                  border: `2px solid ${joinTeam === team ? (team === 'A' ? '#22c55e' : '#3b82f6') : '#e5e5e5'}`,
                  borderRadius: 10,
                  background: joinTeam === team ? (team === 'A' ? '#f0fdf4' : '#eff6ff') : '#fff',
                  fontWeight: '600', cursor: 'pointer'
                }}>
                  Équipe {team}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={joinMatch} 
            disabled={joinAsDuo && !duoSelected}
            style={{ 
              ...btnPrimary, 
              width: '100%', 
              background: (joinAsDuo && !duoSelected) ? '#e5e5e5' : '#22c55e',
              color: (joinAsDuo && !duoSelected) ? '#999' : '#fff',
              cursor: (joinAsDuo && !duoSelected) ? 'not-allowed' : 'pointer'
            }}
          >
            {joinAsDuo && duoSelected ? `Envoyer notre demande` : 'Envoyer ma demande'}
          </button>
        </Modal>
      )}

      {/* Modal Inviter */}
      {modal === 'invite' && (
        <Modal onClose={() => setModal(null)} title="Inviter un joueur">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>Nom</label>
            <input type="text" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Prénom du joueur" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>Contact (optionnel)</label>
            <input type="text" value={inviteForm.contact} onChange={e => setInviteForm({ ...inviteForm, contact: e.target.value })} placeholder="Téléphone ou email" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>Équipe</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A', 'B'].map(team => (
                <button key={team} onClick={() => setInviteForm({ ...inviteForm, team })} style={{
                  flex: 1, padding: 12,
                  border: `2px solid ${inviteForm.team === team ? '#1a1a1a' : '#e5e5e5'}`,
                  borderRadius: 8,
                  background: inviteForm.team === team ? '#f5f5f5' : '#fff',
                  fontWeight: '600', cursor: 'pointer'
                }}>
                  Équipe {team}
                </button>
              ))}
            </div>
          </div>
          <button onClick={sendInvite} style={{ ...btnPrimary, width: '100%' }}>Inviter</button>
        </Modal>
      )}

      {/* Modal Annuler */}
      {modal === 'cancel' && (
        <Modal onClose={() => setModal(null)} title="Annuler la partie">
          <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>Cette action est irréversible. Tous les participants seront notifiés.</p>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Raison de l'annulation..." rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 16 }} />
          <button onClick={cancelMatch} style={{ ...btnPrimary, width: '100%', background: '#dc2626' }}>Confirmer l'annulation</button>
        </Modal>
      )}

      {/* Modal Modifier infos */}
      {modal === 'edit' && (
        <Modal onClose={() => setModal(null)} title="Modifier les infos">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>Date</label>
            <input type="date" value={editForm.match_date} onChange={e => setEditForm({ ...editForm, match_date: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>Heure</label>
            <input type="time" value={editForm.match_time} onChange={e => setEditForm({ ...editForm, match_time: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={saveMatchInfos} style={{ ...btnPrimary, width: '100%' }}>Enregistrer</button>
        </Modal>
      )}

      {/* Modal Résultat */}
      {modal === 'result' && (
        <Modal onClose={() => setModal(null)} title="Résultat du match">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Équipe gagnante</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(t => (
                <button key={t} onClick={() => setResultForm({ ...resultForm, winner: t })} style={{
                  flex: 1, padding: 16,
                  border: `2px solid ${resultForm.winner === t ? '#22c55e' : '#e5e5e5'}`,
                  borderRadius: 10,
                  background: resultForm.winner === t ? '#dcfce7' : '#fff',
                  fontWeight: '600', cursor: 'pointer'
                }}>
                  🏆 Équipe {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Score (optionnel)</div>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#666', width: 50 }}>Set {s}</span>
                <input type="number" min="0" max="7" value={resultForm.scores[`s${s}a`] || ''} onChange={e => setResultForm({ ...resultForm, scores: { ...resultForm.scores, [`s${s}a`]: e.target.value } })} placeholder="A" style={{ flex: 1, padding: 10, border: '1px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                <span>-</span>
                <input type="number" min="0" max="7" value={resultForm.scores[`s${s}b`] || ''} onChange={e => setResultForm({ ...resultForm, scores: { ...resultForm.scores, [`s${s}b`]: e.target.value } })} placeholder="B" style={{ flex: 1, padding: 10, border: '1px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
              </div>
            ))}
          </div>
          <button onClick={saveResult} disabled={!resultForm.winner} style={{ ...btnPrimary, width: '100%', background: '#22c55e', opacity: resultForm.winner ? 1 : 0.5 }}>
            Enregistrer le résultat
          </button>
        </Modal>
      )}

      {/* Modal Joueur */}
      {modal === 'player' && selectedPlayer && (
        <Modal onClose={() => { setModal(null); setSelectedPlayer(null) }} title="">
          <div style={{ textAlign: 'center' }}>
            <Avatar profile={selectedPlayer.profiles} size={80} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
              {selectedPlayer.isOrganizer && '👑 '}{selectedPlayer.profiles?.name}
            </h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 8, fontSize: 13, fontWeight: '600' }}>
                ⭐ Niveau {selectedPlayer.profiles?.level}/10
              </span>
              <span style={{ padding: '6px 12px', background: '#f0fdf4', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: '600' }}>
                🎯 {positionLabels[selectedPlayer.profiles?.position] || 'Polyvalent'}
              </span>
              <span style={{ padding: '6px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, fontWeight: '600' }}>
                ✓ {selectedPlayer.profiles?.reliability_score || 100}%
              </span>
            </div>

            {selectedPlayer.profiles?.id !== user?.id && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleFavorite(selectedPlayer.profiles?.id)} style={{
                  flex: 1, padding: 14,
                  background: isFavorite(selectedPlayer.profiles?.id) ? '#fef3c7' : '#f5f5f5',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: '600', cursor: 'pointer'
                }}>
                  {isFavorite(selectedPlayer.profiles?.id) ? '⭐ Favori' : '☆ Ajouter aux favoris'}
                </button>
                <Link href={`/player/${selectedPlayer.profiles?.id}`} style={{
                  flex: 1, padding: 14, background: '#1a1a1a', color: '#fff',
                  borderRadius: 10, fontSize: 14, fontWeight: '600', textDecoration: 'none', textAlign: 'center'
                }}>
                  Voir profil
                </Link>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// === COMPOSANTS ===

function Avatar({ profile, size = 40, style = {} }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: '600', fontSize: size * 0.4, ...style
    }}>
      {profile?.name?.[0] || '?'}
    </div>
  )
}

function PlayerSlot({ player, onSelect, isOrg, onSwap, showPayment }) {
  const positionLabels = { 'left': 'G', 'right': 'D', 'both': 'P' }

  if (!player) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14,
        textAlign: 'center', border: '2px dashed rgba(255,255,255,0.2)',
        minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Place libre</span>
      </div>
    )
  }

  if (player.isPendingInvite) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, padding: 12, textAlign: 'center', border: '2px dashed #f59e0b' }}>
        <div style={{ fontSize: 18, marginBottom: 4 }}>⏳</div>
        <div style={{ fontWeight: '600', fontSize: 13 }}>{player.invitee_name}</div>
        <div style={{ fontSize: 10, background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>INVITÉ</div>
      </div>
    )
  }

  const isConfirmed = player.status === 'confirmed'

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 10,
      border: isConfirmed ? '2px solid transparent' : '2px solid #f59e0b',
      position: 'relative'
    }}>
      <div onClick={() => onSelect(player)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <Avatar profile={player.profiles} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '600', fontSize: 13, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 4 }}>
            {player.isOrganizer && <span>👑</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.profiles?.name}</span>
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>⭐{player.profiles?.level} • {positionLabels[player.profiles?.position] || 'P'}</div>
        </div>
        {!isConfirmed && (
          <span style={{ fontSize: 9, background: '#fef3c7', color: '#92400e', padding: '3px 6px', borderRadius: 4, fontWeight: '600' }}>EN ATTENTE</span>
        )}
      </div>
      
      {/* Bouton swap (seulement pour l'orga, pas pour l'orga lui-même) */}
      {isOrg && !player.isOrganizer && player.id && (
        <button
          onClick={(e) => { e.stopPropagation(); onSwap(player.id) }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 10,
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ↔
        </button>
      )}
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '14px 20px', borderBottom: title ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 17, fontWeight: '600', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

// === STYLES ===

const badgeStyle = { padding: '6px 10px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, fontWeight: '600' }

const btnSmall = { flex: 1, padding: '10px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }

const btnPrimary = { padding: '14px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: '600', cursor: 'pointer' }

const inputStyle = { width: '100%', padding: '12px 14px', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', outline: 'none' }