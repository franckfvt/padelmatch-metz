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
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Résultat
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [winner, setWinner] = useState('')
  const [scores, setScores] = useState({ s1a: '', s1b: '', s2a: '', s2b: '', s3a: '', s3b: '' })
  const [savingResult, setSavingResult] = useState(false)
  
  const messagesEndRef = useRef(null)

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  const experienceEmojis = {
    'less6months': '🌱',
    '6months2years': '📈',
    '2to5years': '💪',
    'more5years': '🏆'
  }

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  useEffect(() => {
    loadData()
    
    const channel = supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_messages',
        filter: `match_id=eq.${matchId}`
      }, () => loadMessages())
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

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address, booking_url),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance, reliability_score, lydia_username, paypal_email, rib)
        `)
        .eq('id', matchId)
        .single()

      if (matchError || !matchData) {
        alert('Partie introuvable')
        router.push('/dashboard')
        return
      }

      setMatch(matchData)

      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, experience, ambiance, reliability_score)
        `)
        .eq('match_id', matchId)

      setParticipants(participantsData || [])
      
      // Charger les équipes si existantes
      if (matchData.team_a) setTeamA(matchData.team_a)
      if (matchData.team_b) setTeamB(matchData.team_b)
      if (matchData.winner) setWinner(matchData.winner)
      if (matchData.score_set1_a !== null) {
        setScores({
          s1a: matchData.score_set1_a?.toString() || '',
          s1b: matchData.score_set1_b?.toString() || '',
          s2a: matchData.score_set2_a?.toString() || '',
          s2b: matchData.score_set2_b?.toString() || '',
          s3a: matchData.score_set3_a?.toString() || '',
          s3b: matchData.score_set3_b?.toString() || ''
        })
      }

      await loadMessages()
      setLoading(false)
    } catch (error) {
      console.error('Error loading match:', error)
      setLoading(false)
    }
  }

  async function loadMessages() {
    const { data: messagesData } = await supabase
      .from('match_messages')
      .select(`*, profiles (id, name)`)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    setMessages(messagesData || [])
  }

  async function joinMatch() {
    try {
      const isParticipant = participants.some(p => p.user_id === user.id)
      if (isParticipant || match.organizer_id === user.id) {
        alert('Tu es déjà inscrit à cette partie !')
        return
      }

      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) throw error

      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available - 1,
          status: match.spots_available - 1 === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      loadData()
      
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `${profile?.name || 'Un joueur'} a rejoint la partie ! 🎾`
      })
      
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Erreur lors de l\'inscription')
    }
  }

  async function leaveMatch() {
    if (!confirm('Tu veux vraiment quitter cette partie ?')) return

    try {
      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

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
        message: `${profile?.name || 'Un joueur'} a quitté la partie`
      })

      loadData()
    } catch (error) {
      console.error('Error leaving match:', error)
      alert('Erreur lors du départ')
    }
  }

  async function deleteMatch() {
    if (!deleteReason.trim()) {
      alert('Merci de donner un motif')
      return
    }

    setDeleting(true)

    try {
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `PARTIE ANNULÉE par ${profile?.name || 'organisateur'} - Motif : ${deleteReason}`
      })

      await supabase.from('match_participants').delete().eq('match_id', matchId)
      await supabase.from('match_messages').delete().eq('match_id', matchId)
      
      const { error } = await supabase.from('matches').delete().eq('id', matchId)

      if (error) throw error

      alert('Partie annulée. Les participants ont été notifiés.')
      router.push('/dashboard')

    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
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
        message: `💰 ${profile?.name} a marqué son paiement comme effectué`
      })
      
      loadData()
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  async function confirmPayment(participantId, participantName) {
    try {
      await supabase
        .from('match_participants')
        .update({ paid_confirmed_by: user.id })
        .eq('id', participantId)
      
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `✅ ${profile?.name} a confirmé le paiement de ${participantName}`
      })
      
      loadData()
    } catch (error) {
      console.error('Error confirming payment:', error)
    }
  }

  async function saveResult() {
    if (teamA.length !== 2 || teamB.length !== 2) {
      alert('Chaque équipe doit avoir 2 joueurs')
      return
    }
    if (!winner) {
      alert('Sélectionne l\'équipe gagnante')
      return
    }

    setSavingResult(true)

    try {
      await supabase
        .from('matches')
        .update({
          team_a: teamA,
          team_b: teamB,
          winner: winner,
          score_set1_a: scores.s1a ? parseInt(scores.s1a) : null,
          score_set1_b: scores.s1b ? parseInt(scores.s1b) : null,
          score_set2_a: scores.s2a ? parseInt(scores.s2a) : null,
          score_set2_b: scores.s2b ? parseInt(scores.s2b) : null,
          score_set3_a: scores.s3a ? parseInt(scores.s3a) : null,
          score_set3_b: scores.s3b ? parseInt(scores.s3b) : null,
          result_submitted_by: user.id,
          result_submitted_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', matchId)

      // Mettre à jour les stats des joueurs
      const winningTeam = winner === 'team_a' ? teamA : teamB
      const losingTeam = winner === 'team_a' ? teamB : teamA

      for (const playerId of winningTeam) {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('matches_played, matches_won, current_streak, best_streak')
          .eq('id', playerId)
          .single()

        if (playerProfile) {
          const newStreak = (playerProfile.current_streak || 0) + 1
          await supabase
            .from('profiles')
            .update({
              matches_played: (playerProfile.matches_played || 0) + 1,
              matches_won: (playerProfile.matches_won || 0) + 1,
              current_streak: newStreak,
              best_streak: Math.max(newStreak, playerProfile.best_streak || 0)
            })
            .eq('id', playerId)
        }
      }

      for (const playerId of losingTeam) {
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('matches_played')
          .eq('id', playerId)
          .single()

        if (playerProfile) {
          await supabase
            .from('profiles')
            .update({
              matches_played: (playerProfile.matches_played || 0) + 1,
              current_streak: 0
            })
            .eq('id', playerId)
        }
      }

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `🏆 Résultat enregistré ! ${winner === 'team_a' ? 'Équipe A' : 'Équipe B'} remporte la partie !`
      })

      setShowResultModal(false)
      loadData()
    } catch (error) {
      console.error('Error saving result:', error)
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setSavingResult(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('match_messages')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${matchId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const link = `${window.location.origin}/join/${matchId}`
    const priceText = match.price_total ? `\n💰 ${Math.round(match.price_total / 100 / match.spots_total)}€/pers` : ''
    const text = `🎾 Je cherche ${match.spots_available} joueur${match.spots_available > 1 ? 's' : ''} !\n\n📅 ${formatDate(match.match_date)} à ${formatTime(match.match_time)}\n📍 ${match.clubs?.name}\n🎯 ${ambianceEmojis[match.ambiance]} ${ambianceLabels[match.ambiance]}${priceText}\n\nRejoins : ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function formatMessageTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function getReliabilityColor(score) {
    if (score >= 90) return '#2e7d32'
    if (score >= 70) return '#f59e0b'
    return '#dc2626'
  }

  function toggleTeam(playerId, team) {
    if (team === 'A') {
      if (teamA.includes(playerId)) {
        setTeamA(teamA.filter(id => id !== playerId))
      } else if (teamA.length < 2) {
        setTeamA([...teamA, playerId])
        setTeamB(teamB.filter(id => id !== playerId))
      }
    } else {
      if (teamB.includes(playerId)) {
        setTeamB(teamB.filter(id => id !== playerId))
      } else if (teamB.length < 2) {
        setTeamB([...teamB, playerId])
        setTeamA(teamA.filter(id => id !== playerId))
      }
    }
  }

  function getAllPlayers() {
    const players = [{ id: match.organizer_id, ...match.profiles }]
    participants.forEach(p => {
      players.push({ id: p.user_id, ...p.profiles })
    })
    return players
  }

  function getPlayerName(playerId) {
    if (playerId === match?.organizer_id) return match.profiles?.name
    const p = participants.find(p => p.user_id === playerId)
    return p?.profiles?.name || 'Joueur'
  }

  function isMatchPast() {
    const matchDate = new Date(`${match.match_date}T${match.match_time}`)
    return matchDate < new Date()
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement de la partie...</div>
      </div>
    )
  }

  if (!match) return null

  const isOrganizer = match.organizer_id === user?.id
  const isParticipant = participants.some(p => p.user_id === user?.id)
  const canJoin = !isOrganizer && !isParticipant && match.spots_available > 0
  const canChat = isOrganizer || isParticipant
  const totalPlayers = 1 + participants.length
  const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0
  const myParticipation = participants.find(p => p.user_id === user?.id)
  const isPast = isMatchPast()
  const hasResult = match.winner !== null

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: 24,
      alignItems: 'start'
    }}>
      
      <div>
        <Link href="/dashboard" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#666',
          textDecoration: 'none',
          fontSize: 14,
          marginBottom: 20
        }}>
          ← Retour
        </Link>

        {/* Infos principales */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          marginBottom: 20,
          border: '1px solid #eee'
        }}>
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: match.status === 'completed' ? '#f3f4f6' : match.status === 'open' ? '#e8f5e9' : '#fef3c7',
              color: match.status === 'completed' ? '#666' : match.status === 'open' ? '#2e7d32' : '#92400e',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600'
            }}>
              {match.status === 'completed' ? '✓ Terminée' : match.status === 'open' ? `${match.spots_available} place${match.spots_available > 1 ? 's' : ''}` : 'Complet'}
            </span>
            {hasResult && (
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: '600'
              }}>
                🏆 Résultat enregistré
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
            {formatDate(match.match_date)}
          </h1>
          <div style={{ fontSize: 36, fontWeight: '700', color: '#2e7d32', marginBottom: 20 }}>
            {formatTime(match.match_time)}
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a', marginBottom: 4 }}>
              📍 {match.clubs?.name}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>
              {match.clubs?.address}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <span style={{
              background: match.ambiance === 'compet' ? '#fef3c7' : match.ambiance === 'loisir' ? '#dbeafe' : '#f5f5f5',
              color: match.ambiance === 'compet' ? '#92400e' : match.ambiance === 'loisir' ? '#1e40af' : '#666',
              padding: '10px 20px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: '600'
            }}>
              {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
            </span>
            {match.level_required && match.level_required !== 'all' && (
              <span style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '10px 20px',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: '600'
              }}>
                {experienceEmojis[match.level_required]} {experienceLabels[match.level_required]}
              </span>
            )}
          </div>

          {/* Notes privées */}
          {canChat && match.private_notes && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#92400e', marginBottom: 8 }}>
                📝 Notes privées
              </div>
              <div style={{ fontSize: 14, color: '#78350f', whiteSpace: 'pre-line' }}>
                {match.private_notes}
              </div>
            </div>
          )}

          {/* Actions */}
          {canJoin && (
            <button onClick={joinMatch} style={{
              width: '100%', padding: '18px', background: '#1a1a1a', color: '#fff',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer', marginBottom: 12
            }}>
              Rejoindre cette partie
            </button>
          )}

          {(isOrganizer || isParticipant) && !isPast && (
            <button onClick={() => setShowInviteModal(true)} style={{
              width: '100%', padding: '18px', background: '#f5f5f5', color: '#1a1a1a',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer', marginBottom: 12
            }}>
              📤 Inviter des joueurs
            </button>
          )}

          {isPast && !hasResult && (isOrganizer || isParticipant) && (
            <button onClick={() => setShowResultModal(true)} style={{
              width: '100%', padding: '18px', background: '#2e7d32', color: '#fff',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer', marginBottom: 12
            }}>
              🏆 Enregistrer le résultat
            </button>
          )}

          {isParticipant && !isOrganizer && !isPast && (
            <button onClick={leaveMatch} style={{
              width: '100%', padding: '14px', background: '#fff', color: '#dc2626',
              border: '1px solid #fecaca', borderRadius: 14, fontSize: 14, fontWeight: '600', cursor: 'pointer'
            }}>
              Quitter la partie
            </button>
          )}

          {isOrganizer && !isPast && (
            <button onClick={() => setShowDeleteModal(true)} style={{
              width: '100%', padding: '14px', background: '#fff', color: '#dc2626',
              border: '1px solid #fecaca', borderRadius: 14, fontSize: 14, fontWeight: '600', cursor: 'pointer', marginTop: 12
            }}>
              Annuler cette partie
            </button>
          )}
        </div>

        {/* Paiement */}
        {pricePerPerson > 0 && canChat && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' }}>
              💰 Paiement ({pricePerPerson}€/pers)
            </h2>

            {/* Info organisateur */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                À payer à {match.profiles?.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {match.profiles?.lydia_username && (
                  <a href={`https://lydia-app.com/collect/${match.profiles.lydia_username}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '10px 16px', background: '#0095f6', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: '600', textDecoration: 'none' }}>
                    Lydia @{match.profiles.lydia_username}
                  </a>
                )}
                {match.profiles?.paypal_email && (
                  <a href={`https://paypal.me/${match.profiles.paypal_email}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '10px 16px', background: '#003087', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: '600', textDecoration: 'none' }}>
                    PayPal
                  </a>
                )}
              </div>
            </div>

            {/* Statut paiement des joueurs */}
            <div style={{ display: 'grid', gap: 8 }}>
              {participants.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 12, background: '#f5f5f5', borderRadius: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{p.profiles?.name}</span>
                    {p.has_paid && <span style={{ color: '#2e7d32' }}>✓</span>}
                  </div>
                  {isOrganizer && p.has_paid && !p.paid_confirmed_by && (
                    <button onClick={() => confirmPayment(p.id, p.profiles?.name)} style={{
                      padding: '6px 12px', background: '#2e7d32', color: '#fff', border: 'none',
                      borderRadius: 6, fontSize: 12, fontWeight: '600', cursor: 'pointer'
                    }}>
                      Confirmer
                    </button>
                  )}
                  {p.paid_confirmed_by && (
                    <span style={{ fontSize: 12, color: '#2e7d32' }}>✅ Confirmé</span>
                  )}
                </div>
              ))}
            </div>

            {/* Mon paiement */}
            {isParticipant && !myParticipation?.has_paid && (
              <button onClick={markAsPaid} style={{
                width: '100%', padding: '14px', marginTop: 16,
                background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: '600', cursor: 'pointer'
              }}>
                ✓ J'ai payé
              </button>
            )}
          </div>
        )}

        {/* Résultat si existe */}
        {hasResult && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            border: '2px solid #fef3c7'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' }}>
              🏆 Résultat
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{
                textAlign: 'center',
                padding: 16,
                background: match.winner === 'team_a' ? '#e8f5e9' : '#f5f5f5',
                borderRadius: 12,
                border: match.winner === 'team_a' ? '2px solid #2e7d32' : 'none'
              }}>
                {match.winner === 'team_a' && <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>}
                {match.team_a?.map(id => (
                  <div key={id} style={{ fontWeight: '600' }}>{getPlayerName(id)}</div>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: '#666' }}>VS</div>
              <div style={{
                textAlign: 'center',
                padding: 16,
                background: match.winner === 'team_b' ? '#e8f5e9' : '#f5f5f5',
                borderRadius: 12,
                border: match.winner === 'team_b' ? '2px solid #2e7d32' : 'none'
              }}>
                {match.winner === 'team_b' && <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>}
                {match.team_b?.map(id => (
                  <div key={id} style={{ fontWeight: '600' }}>{getPlayerName(id)}</div>
                ))}
              </div>
            </div>
            {match.score_set1_a !== null && (
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 18, fontWeight: '600', color: '#666' }}>
                {match.score_set1_a}-{match.score_set1_b}
                {match.score_set2_a !== null && ` / ${match.score_set2_a}-${match.score_set2_b}`}
                {match.score_set3_a !== null && ` / ${match.score_set3_a}-${match.score_set3_b}`}
              </div>
            )}
          </div>
        )}

        {/* Joueurs */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #eee' }}>
          <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 20, color: '#1a1a1a' }}>
            Joueurs ({totalPlayers}/{match.spots_total})
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Organisateur */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 16,
              background: '#fafafa', borderRadius: 12, border: '2px solid #1a1a1a'
            }}>
              <div style={{
                width: 48, height: 48, background: '#1a1a1a', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                  {match.profiles?.name} ⭐
                  {match.organizer_id === user?.id && <span style={{ fontSize: 12, color: '#666' }}> (toi)</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {match.profiles?.experience && (
                    <span style={{ fontSize: 12, background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 6 }}>
                      {experienceEmojis[match.profiles.experience]} {experienceLabels[match.profiles.experience]}
                    </span>
                  )}
                  <span style={{
                    fontSize: 12,
                    color: getReliabilityColor(match.profiles?.reliability_score || 100)
                  }}>
                    {match.profiles?.reliability_score || 100}% fiable
                  </span>
                </div>
              </div>
            </div>

            {/* Participants */}
            {participants.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                background: '#fafafa', borderRadius: 12
              }}>
                <div style={{
                  width: 48, height: 48, background: '#e5e5e5',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                    {p.profiles?.name}
                    {p.user_id === user?.id && <span style={{ fontSize: 12, color: '#666' }}> (toi)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.profiles?.experience && (
                      <span style={{ fontSize: 12, background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 6 }}>
                        {experienceEmojis[p.profiles.experience]} {experienceLabels[p.profiles.experience]}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: getReliabilityColor(p.profiles?.reliability_score || 100) }}>
                      {p.profiles?.reliability_score || 100}% fiable
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Places vides */}
            {Array.from({ length: match.spots_available }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, border: '2px dashed #e5e5e5', borderRadius: 12, color: '#999', fontSize: 14
              }}>
                En attente d'un joueur...
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{
        background: '#fff', borderRadius: 24, border: '1px solid #eee',
        display: 'flex', flexDirection: 'column', height: 600, position: 'sticky', top: 100
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }}>
            💬 Chat de la partie
          </h2>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {!canChat ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 14 }}>Rejoins la partie pour accéder au chat</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14 }}>Aucun message</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {messages.map(msg => {
                const isMe = msg.user_id === user?.id
                const isSystem = msg.message.includes('a rejoint') || msg.message.includes('a quitté') || msg.message.includes('ANNULÉE') || msg.message.includes('💰') || msg.message.includes('✅') || msg.message.includes('🏆')
                
                if (isSystem) {
                  return (
                    <div key={msg.id} style={{
                      textAlign: 'center', fontSize: 13,
                      color: msg.message.includes('ANNULÉE') ? '#dc2626' : '#999',
                      padding: '12px',
                      background: msg.message.includes('ANNULÉE') ? '#fef2f2' : 'transparent',
                      borderRadius: 12
                    }}>
                      {msg.message}
                    </div>
                  )
                }

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                    {!isMe && (
                      <div style={{
                        width: 32, height: 32, background: '#e5e5e5', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                      }}>👤</div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {!isMe && <div style={{ fontSize: 12, color: '#666', marginBottom: 4, marginLeft: 12 }}>{msg.profiles?.name}</div>}
                      <div style={{
                        background: isMe ? '#1a1a1a' : '#f5f5f5',
                        color: isMe ? '#fff' : '#1a1a1a',
                        padding: '12px 16px',
                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        fontSize: 15
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4, textAlign: isMe ? 'right' : 'left', marginLeft: isMe ? 0 : 12 }}>
                        {formatMessageTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {canChat && (
          <form onSubmit={sendMessage} style={{ padding: 16, borderTop: '1px solid #eee', display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Ton message..."
              style={{ flex: 1, padding: '14px 18px', border: '2px solid #e5e5e5', borderRadius: 30, fontSize: 15, outline: 'none' }}
            />
            <button type="submit" disabled={!newMessage.trim() || sending} style={{
              padding: '14px 24px',
              background: !newMessage.trim() || sending ? '#e5e5e5' : '#1a1a1a',
              color: !newMessage.trim() || sending ? '#999' : '#fff',
              border: 'none', borderRadius: 30, fontSize: 15, fontWeight: '600', cursor: 'pointer'
            }}>
              Envoyer
            </button>
          </form>
        )}
      </div>

      {/* Modal Inviter */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>Inviter des joueurs</h2>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 12, marginBottom: 20, wordBreak: 'break-all', fontSize: 14, color: '#666' }}>
              {typeof window !== 'undefined' && `${window.location.origin}/join/${matchId}`}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <button onClick={copyInviteLink} style={{ width: '100%', padding: '16px', background: copied ? '#e8f5e9' : '#1a1a1a', color: copied ? '#2e7d32' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
              <button onClick={shareWhatsApp} style={{ width: '100%', padding: '16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
                Partager sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700', color: '#dc2626' }}>Annuler la partie</h2>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <p style={{ color: '#666', marginBottom: 24 }}>Les {participants.length} participant{participants.length > 1 ? 's' : ''} seront notifiés.</p>
            <select value={deleteReason} onChange={e => setDeleteReason(e.target.value)} style={{ width: '100%', padding: '16px', border: '2px solid #e5e5e5', borderRadius: 12, fontSize: 15, marginBottom: 20 }}>
              <option value="">Sélectionne un motif</option>
              <option value="Terrain indisponible">Terrain indisponible</option>
              <option value="Problème personnel">Problème personnel</option>
              <option value="Blessure">Blessure</option>
              <option value="Météo">Météo</option>
              <option value="Pas assez de joueurs">Pas assez de joueurs</option>
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '16px', background: '#f5f5f5', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>Retour</button>
              <button onClick={deleteMatch} disabled={!deleteReason || deleting} style={{ flex: 1, padding: '16px', background: !deleteReason || deleting ? '#e5e5e5' : '#dc2626', color: !deleteReason || deleting ? '#999' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: '600', cursor: 'pointer' }}>
                {deleting ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résultat */}
      {showResultModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>🏆 Enregistrer le résultat</h2>
              <button onClick={() => setShowResultModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>

            {/* Sélection des équipes */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Clique sur les joueurs pour former les équipes :</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ textAlign: 'center', fontWeight: '700', marginBottom: 8, color: teamA.length === 2 ? '#2e7d32' : '#999' }}>
                    Équipe A ({teamA.length}/2)
                  </div>
                  <div style={{ minHeight: 100, background: '#e8f5e9', borderRadius: 12, padding: 12 }}>
                    {teamA.map(id => (
                      <div key={id} onClick={() => toggleTeam(id, 'A')} style={{ padding: 8, background: '#fff', borderRadius: 8, marginBottom: 4, cursor: 'pointer', textAlign: 'center' }}>
                        {getPlayerName(id)} ✕
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ textAlign: 'center', fontWeight: '700', marginBottom: 8, color: teamB.length === 2 ? '#2e7d32' : '#999' }}>
                    Équipe B ({teamB.length}/2)
                  </div>
                  <div style={{ minHeight: 100, background: '#dbeafe', borderRadius: 12, padding: 12 }}>
                    {teamB.map(id => (
                      <div key={id} onClick={() => toggleTeam(id, 'B')} style={{ padding: 8, background: '#fff', borderRadius: 8, marginBottom: 4, cursor: 'pointer', textAlign: 'center' }}>
                        {getPlayerName(id)} ✕
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Joueurs disponibles :</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {getAllPlayers().filter(p => !teamA.includes(p.id) && !teamB.includes(p.id)).map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => toggleTeam(p.id, 'A')} style={{ padding: '8px 12px', background: '#e8f5e9', border: 'none', borderRadius: '8px 0 0 8px', cursor: 'pointer', fontSize: 13 }}>
                        A ← {p.name}
                      </button>
                      <button onClick={() => toggleTeam(p.id, 'B')} style={{ padding: '8px 12px', background: '#dbeafe', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: 13 }}>
                        → B
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gagnant */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Qui a gagné ?</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setWinner('team_a')} style={{
                  flex: 1, padding: 16, background: winner === 'team_a' ? '#2e7d32' : '#f5f5f5',
                  color: winner === 'team_a' ? '#fff' : '#1a1a1a',
                  border: 'none', borderRadius: 12, fontWeight: '600', cursor: 'pointer'
                }}>
                  🏆 Équipe A
                </button>
                <button onClick={() => setWinner('team_b')} style={{
                  flex: 1, padding: 16, background: winner === 'team_b' ? '#2e7d32' : '#f5f5f5',
                  color: winner === 'team_b' ? '#fff' : '#1a1a1a',
                  border: 'none', borderRadius: 12, fontWeight: '600', cursor: 'pointer'
                }}>
                  🏆 Équipe B
                </button>
              </div>
            </div>

            {/* Score optionnel */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Score (optionnel)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                <input type="number" placeholder="6" value={scores.s1a} onChange={e => setScores({...scores, s1a: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                <span>Set 1</span>
                <input type="number" placeholder="4" value={scores.s1b} onChange={e => setScores({...scores, s1b: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                
                <input type="number" placeholder="6" value={scores.s2a} onChange={e => setScores({...scores, s2a: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                <span>Set 2</span>
                <input type="number" placeholder="3" value={scores.s2b} onChange={e => setScores({...scores, s2b: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                
                <input type="number" placeholder="" value={scores.s3a} onChange={e => setScores({...scores, s3a: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
                <span style={{ color: '#999' }}>Set 3</span>
                <input type="number" placeholder="" value={scores.s3b} onChange={e => setScores({...scores, s3b: e.target.value})} style={{ padding: 12, border: '2px solid #e5e5e5', borderRadius: 8, textAlign: 'center' }} />
              </div>
            </div>

            <button onClick={saveResult} disabled={savingResult || teamA.length !== 2 || teamB.length !== 2 || !winner} style={{
              width: '100%', padding: 18,
              background: savingResult || teamA.length !== 2 || teamB.length !== 2 || !winner ? '#e5e5e5' : '#2e7d32',
              color: savingResult || teamA.length !== 2 || teamB.length !== 2 || !winner ? '#999' : '#fff',
              border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
            }}>
              {savingResult ? 'Enregistrement...' : 'Enregistrer le résultat'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}