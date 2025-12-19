'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)
  
  // UI
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [copied, setCopied] = useState(false)
  
  // Modals
  const [modal, setModal] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  // Forms
  const [inviteForm, setInviteForm] = useState({ team: 'A', name: '', contact: '' })
  const [cancelReason, setCancelReason] = useState('')
  const [resultForm, setResultForm] = useState({ winner: '', scores: {} })
  const [joinTeam, setJoinTeam] = useState('A')
  const [joinAsDuo, setJoinAsDuo] = useState(false)
  const [duoSearch, setDuoSearch] = useState('')
  const [duoResults, setDuoResults] = useState([])
  const [duoSelected, setDuoSelected] = useState(null)
  
  const messagesEndRef = useRef(null)
  const ambianceLabels = { 'loisir': 'Détente', 'mix': 'Équilibré', 'compet': 'Compétitif' }
  const ambianceEmojis = { 'loisir': '😎', 'mix': '⚡', 'compet': '🏆' }

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
        .select(`*, clubs (id, name, address), profiles!matches_organizer_id_fkey (id, name, level, position, ambiance, avatar_url, reliability_score, lydia_username, paypal_email)`)
        .eq('id', matchId)
        .single()

      if (!matchData) { router.push('/dashboard'); return }
      setMatch(matchData)

      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`*, profiles (id, name, level, position, ambiance, avatar_url, reliability_score), duo_profile:profiles!match_participants_duo_with_fkey (id, name, level)`)
        .eq('match_id', matchId)
        .eq('status', 'confirmed')
      setParticipants(participantsData || [])

      if (matchData.organizer_id === session.user.id) {
        const { data: pendingData } = await supabase
          .from('match_participants')
          .select(`*, profiles (id, name, level, avatar_url, reliability_score), duo_profile:profiles!match_participants_duo_with_fkey (id, name)`)
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
  const isParticipant = () => participants.some(p => p.user_id === user?.id)
  const isFavorite = (id) => favorites.includes(id)
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / (match.spots_total || 4)) : 0

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function getPlayerCount() {
    return participants.length + 1 + pendingInvites.length
  }

  function getSpotsLeft() {
    return (match?.spots_total || 4) - getPlayerCount()
  }

  // Équipes
  const orgaPlayer = match?.organizer_team ? { 
    isOrganizer: true, 
    profiles: match.profiles, 
    team: match.organizer_team,
    has_paid: true,
    user_id: match.organizer_id
  } : null

  const allPlayers = [
    ...(orgaPlayer ? [orgaPlayer] : []),
    ...participants,
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true }))
  ]

  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const unassigned = allPlayers.filter(p => !p.team)

  // === ACTIONS ===
  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: newMessage.trim() })
    setNewMessage('')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${matchId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function acceptRequest(request) {
    try {
      await supabase.from('match_participants').update({ status: 'confirmed' }).eq('id', request.id)
      if (request.duo_with) {
        await supabase.from('match_participants').update({ status: 'confirmed' }).eq('match_id', matchId).eq('user_id', request.duo_with)
      }
      await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `✅ ${request.profiles?.name}${request.duo_with ? ' et son partenaire ont' : ' a'} rejoint` })
      loadData()
    } catch (error) { console.error(error) }
  }

  async function refuseRequest(request) {
    await supabase.from('match_participants').update({ status: 'refused' }).eq('id', request.id)
    if (request.duo_with) {
      await supabase.from('match_participants').update({ status: 'refused' }).eq('match_id', matchId).eq('user_id', request.duo_with)
    }
    loadData()
  }

  async function swapPlayer(participantId, currentTeam) {
    const newTeam = currentTeam === 'A' ? 'B' : 'A'
    await supabase.from('match_participants').update({ team: newTeam }).eq('id', participantId)
    loadData()
  }

  async function assignTeam(participantId, team) {
    await supabase.from('match_participants').update({ team }).eq('id', participantId)
    loadData()
  }

  async function joinMatch() {
    try {
      const insertData = {
        match_id: parseInt(matchId),
        user_id: user.id,
        status: match.is_private ? 'pending' : 'confirmed',
        team: joinTeam,
        duo_with: duoSelected?.id || null
      }
      
      const { error } = await supabase.from('match_participants').insert(insertData)
      if (error) throw error

      if (joinAsDuo && duoSelected) {
        await supabase.from('match_participants').insert({
          match_id: parseInt(matchId),
          user_id: duoSelected.id,
          status: match.is_private ? 'pending' : 'confirmed',
          team: joinTeam,
          duo_with: user.id
        })
      }
      
      await supabase.from('match_messages').insert({ 
        match_id: parseInt(matchId), 
        user_id: user.id, 
        message: `🎾 ${profile?.name}${duoSelected ? ` + ${duoSelected.name}` : ''} ${match.is_private ? 'demande à rejoindre' : 'a rejoint'}` 
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

  async function leaveMatch() {
    if (!confirm('Tu veux vraiment quitter cette partie ?')) return
    try {
      const matchDateTime = new Date(`${match.match_date}T${match.match_time}`)
      const hoursUntilMatch = (matchDateTime - new Date()) / (1000 * 60 * 60)
      
      await supabase.from('match_participants').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('match_id', matchId).eq('user_id', user.id)
      await supabase.rpc('update_reliability_score', { p_user_id: user.id, p_action: hoursUntilMatch < 24 ? 'late_cancel' : 'early_cancel' })
      await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `👋 ${profile?.name} a quitté la partie` })
      router.push('/dashboard')
    } catch (error) { console.error(error) }
  }

  async function cancelMatch() {
    if (!cancelReason.trim()) { alert('Donne un motif'); return }
    await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `❌ PARTIE ANNULÉE : ${cancelReason}` })
    await supabase.from('matches').update({ status: 'cancelled' }).eq('id', matchId)
    router.push('/dashboard')
  }

  async function sendInvite() {
    if (!inviteForm.name.trim() || !inviteForm.contact.trim()) { alert('Remplis tous les champs'); return }
    try {
      await supabase.from('pending_invites').insert({
        match_id: parseInt(matchId),
        invited_by: user.id,
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
    try {
      await supabase.from('matches').update({
        winner: resultForm.winner, 
        status: 'completed',
        score_set1_a: resultForm.scores.s1a || null,
        score_set1_b: resultForm.scores.s1b || null,
        score_set2_a: resultForm.scores.s2a || null,
        score_set2_b: resultForm.scores.s2b || null,
        score_set3_a: resultForm.scores.s3a || null,
        score_set3_b: resultForm.scores.s3b || null,
      }).eq('id', matchId)

      const teamAIds = [...teamA.filter(p => !p.isPendingInvite).map(p => p.user_id || p.profiles?.id)]
      const teamBIds = [...teamB.filter(p => !p.isPendingInvite).map(p => p.user_id || p.profiles?.id)]
      
      const winners = resultForm.winner === 'A' ? teamAIds : teamBIds
      const losers = resultForm.winner === 'A' ? teamBIds : teamAIds

      for (const id of winners.filter(Boolean)) {
        const { data: p } = await supabase.from('profiles').select('matches_played, matches_won, current_streak, best_streak').eq('id', id).single()
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

      for (const id of losers.filter(Boolean)) {
        const { data: p } = await supabase.from('profiles').select('matches_played').eq('id', id).single()
        if (p) {
          await supabase.from('profiles').update({ matches_played: (p.matches_played || 0) + 1, current_streak: 0 }).eq('id', id)
        }
      }

      await supabase.from('match_messages').insert({ match_id: parseInt(matchId), user_id: user.id, message: `🏆 L'équipe ${resultForm.winner} a gagné !` })
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

  // === RENDER ===
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><div style={{ fontSize: 40 }}>🎾</div><div style={{ color: '#666', marginTop: 16 }}>Chargement...</div></div>
  }

  if (!match) {
    return <div style={{ textAlign: 'center', padding: 100 }}><div style={{ fontSize: 40 }}>❌</div><div style={{ color: '#666', marginTop: 16 }}>Partie introuvable</div><Link href="/dashboard" style={{ color: '#2e7d32', marginTop: 16, display: 'inline-block' }}>← Retour</Link></div>
  }

  const isMatchPast = new Date(`${match.match_date}T${match.match_time}`) < new Date()
  const canJoin = !isOrganizer() && !isParticipant() && getSpotsLeft() > 0 && match.status === 'open'

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingBottom: 100 }}>
      
      {/* === HEADER COMPACT === */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: '#2e7d32', fontWeight: '600', marginBottom: 4 }}>
              {formatDate(match.match_date)}
            </div>
            <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a' }}>
              {match.match_time?.slice(0, 5)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
              📍 {match.clubs?.name || 'À définir'}
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              {match.clubs?.address}
            </div>
          </div>
        </div>
        
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={badgeStyle}>⭐ {match.level_min}-{match.level_max}</span>
          <span style={badgeStyle}>{ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}</span>
          {pricePerPerson > 0 && <span style={{ ...badgeStyle, background: '#fef3c7', color: '#92400e' }}>💰 {pricePerPerson}€/pers</span>}
          <span style={{ ...badgeStyle, background: getSpotsLeft() > 0 ? '#dcfce7' : '#fee2e2', color: getSpotsLeft() > 0 ? '#166534' : '#dc2626' }}>
            {getSpotsLeft() > 0 ? `${getSpotsLeft()} place${getSpotsLeft() > 1 ? 's' : ''}` : 'Complet'}
          </span>
        </div>

        {/* Status */}
        {match.status === 'cancelled' && (
          <div style={{ marginTop: 16, padding: '10px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontWeight: '600', textAlign: 'center' }}>
            ❌ Partie annulée
          </div>
        )}
        {match.status === 'completed' && (
          <div style={{ marginTop: 16, padding: '10px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontWeight: '600', textAlign: 'center' }}>
            ✅ Terminée {match.winner && `• Équipe ${match.winner} 🏆`}
          </div>
        )}

        {/* Actions rapides */}
        {match.status === 'open' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={copyLink} style={{ ...btnSmall, flex: 1, background: copied ? '#dcfce7' : '#f5f5f5', color: copied ? '#166534' : '#1a1a1a' }}>
              {copied ? '✓ Copié' : '📋 Partager'}
            </button>
            {isOrganizer() && getSpotsLeft() > 0 && (
              <button onClick={() => setModal('invite')} style={{ ...btnSmall, flex: 1, background: '#f5f5f5' }}>📨 Inviter</button>
            )}
            {isOrganizer() && (
              <button onClick={() => setModal('cancel')} style={{ ...btnSmall, background: '#fee2e2', color: '#dc2626' }}>✕</button>
            )}
          </div>
        )}
      </div>

      {/* === DEMANDES EN ATTENTE === */}
      {isOrganizer() && pendingRequests.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 12 }}>
            📨 {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
          </div>
          {pendingRequests.map(req => (
            <div key={req.id} style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar profile={req.profiles} size={40} />
                <div>
                  <div style={{ fontWeight: '600' }}>{req.duo_with ? '👥 ' : ''}{req.profiles?.name}{req.duo_profile ? ` + ${req.duo_profile.name}` : ''}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>⭐ {req.profiles?.level}/10 · ✓ {req.profiles?.reliability_score || 100}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => acceptRequest(req)} style={{ ...btnSmall, background: '#dcfce7', color: '#166534' }}>✓</button>
                <button onClick={() => refuseRequest(req)} style={{ ...btnSmall, background: '#fee2e2', color: '#dc2626' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === ÉQUIPES (toujours visible) === */}
      <div style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1fr', gap: 12, alignItems: 'start' }}>
          
          {/* Équipe A */}
          <div>
            <div style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 12, textAlign: 'center' }}>ÉQUIPE A</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1].map(i => (
                <PlayerSlot
                  key={i}
                  player={teamA[i]}
                  isOrg={isOrganizer()}
                  onSwap={(id) => swapPlayer(id, 'A')}
                  onSelect={(p) => { setSelectedPlayer(p); setModal('player') }}
                  showPayment={pricePerPerson > 0}
                />
              ))}
            </div>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 40 }}>
            <div style={{ fontSize: 18, fontWeight: '700', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>VS</div>
          </div>

          {/* Équipe B */}
          <div>
            <div style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 12, textAlign: 'center' }}>ÉQUIPE B</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1].map(i => (
                <PlayerSlot
                  key={i}
                  player={teamB[i]}
                  isOrg={isOrganizer()}
                  onSwap={(id) => swapPlayer(id, 'B')}
                  onSelect={(p) => { setSelectedPlayer(p); setModal('player') }}
                  showPayment={pricePerPerson > 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bouton résultat */}
        {isOrganizer() && isMatchPast && match.status !== 'completed' && (
          <button onClick={() => setModal('result')} style={{ width: '100%', marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.95)', color: '#1a1a1a', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: '600', cursor: 'pointer' }}>
            🏆 Enregistrer le résultat
          </button>
        )}
      </div>

      {/* Joueurs non assignés */}
      {unassigned.length > 0 && isOrganizer() && (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 24 }}>
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

      {/* === INFOS & PAIEMENT (dépliable) === */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}>
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
            {pricePerPerson > 0 && (
              <div style={{ padding: 16, borderBottom: '1px solid #eee', background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#92400e' }}>Prix par personne</div>
                    <div style={{ fontSize: 24, fontWeight: '700' }}>{pricePerPerson}€</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13 }}>
                    {match.profiles?.lydia_username && <div style={{ color: '#666' }}>📱 Lydia: <strong>{match.profiles.lydia_username}</strong></div>}
                    {match.profiles?.paypal_email && <div style={{ color: '#666' }}>💳 PayPal: <strong>{match.profiles.paypal_email}</strong></div>}
                  </div>
                </div>
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
            {match.private_notes && (isOrganizer() || isParticipant()) && (
              <div style={{ padding: 16, background: '#eff6ff' }}>
                <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 4 }}>🔒 Infos pratiques (réservé aux inscrits)</div>
                <div style={{ color: '#1e40af', lineHeight: 1.6 }}>{match.private_notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === CHAT (toujours visible) === */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💬 Discussion</span>
          <span style={{ fontSize: 13, color: '#999', fontWeight: '400' }}>{messages.length} message{messages.length > 1 ? 's' : ''}</span>
        </div>
        
        <div style={{ height: 250, overflowY: 'auto', padding: 16 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>💬</div>
              <div style={{ fontSize: 14 }}>Aucun message</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Sois le premier à écrire !</div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 12, textAlign: msg.user_id === user?.id ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block',
                  background: msg.user_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                  color: msg.user_id === user?.id ? '#fff' : '#1a1a1a',
                  padding: '10px 14px', borderRadius: 12, maxWidth: '75%'
                }}>
                  {msg.user_id !== user?.id && (
                    <div style={{ fontSize: 11, fontWeight: '600', marginBottom: 4, opacity: 0.7 }}>{msg.profiles?.name}</div>
                  )}
                  <div style={{ fontSize: 14 }}>{msg.message}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} style={{ borderTop: '1px solid #eee', padding: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #eee', fontSize: 14 }}
          />
          <button type="submit" style={{ padding: '12px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>→</button>
        </form>
      </div>

      {/* === CTA FIXE === */}
      {canJoin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: 16, zIndex: 100 }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <button onClick={() => setModal('join')} style={{ ...btnPrimary, width: '100%' }}>
              Rejoindre la partie
            </button>
          </div>
        </div>
      )}

      {isParticipant() && !isOrganizer() && match.status === 'open' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #eee', padding: 16, zIndex: 100 }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <button onClick={leaveMatch} style={{ ...btnSecondary, width: '100%', color: '#dc2626', borderColor: '#fee2e2' }}>
              Quitter la partie
            </button>
          </div>
        </div>
      )}

      {/* === MODALS === */}

      {/* Modal Rejoindre */}
      {modal === 'join' && (
        <Modal onClose={() => setModal(null)} title="Rejoindre la partie">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Choisis ton équipe</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(t => (
                <button key={t} onClick={() => setJoinTeam(t)} style={{ flex: 1, padding: 16, border: `2px solid ${joinTeam === t ? '#1a1a1a' : '#eee'}`, borderRadius: 10, background: joinTeam === t ? '#fafafa' : '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  Équipe {t}
                  <div style={{ fontSize: 12, color: '#666', fontWeight: '400', marginTop: 4 }}>
                    {(t === 'A' ? teamA : teamB).length}/2 joueurs
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Option duo */}
          <div style={{ marginBottom: 20, padding: 16, background: '#f9fafb', borderRadius: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={joinAsDuo} onChange={e => { setJoinAsDuo(e.target.checked); setDuoSelected(null) }} style={{ width: 18, height: 18 }} />
              <span style={{ fontWeight: '500' }}>👥 Je viens avec un partenaire</span>
            </label>
            
            {joinAsDuo && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  value={duoSearch}
                  onChange={e => searchDuo(e.target.value)}
                  placeholder="Chercher un joueur..."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
                {duoResults.length > 0 && (
                  <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                    {duoResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setDuoSelected(p); setDuoSearch(p.name); setDuoResults([]) }}
                        style={{ padding: 10, cursor: 'pointer', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <Avatar profile={p} size={32} />
                        <span>{p.name}</span>
                        <span style={{ fontSize: 12, color: '#666' }}>⭐ {p.level}/10</span>
                      </div>
                    ))}
                  </div>
                )}
                {duoSelected && (
                  <div style={{ marginTop: 8, padding: 10, background: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar profile={duoSelected} size={32} />
                    <span style={{ fontWeight: '500' }}>{duoSelected.name}</span>
                    <button onClick={() => { setDuoSelected(null); setDuoSearch('') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={joinMatch} disabled={joinAsDuo && !duoSelected} style={{ ...btnPrimary, width: '100%', opacity: joinAsDuo && !duoSelected ? 0.5 : 1 }}>
            {joinAsDuo ? `Rejoindre en duo` : 'Rejoindre seul'}
          </button>
        </Modal>
      )}

      {/* Modal Inviter */}
      {modal === 'invite' && (
        <Modal onClose={() => setModal(null)} title="Inviter un joueur">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Équipe</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['A', 'B'].map(t => (
                <button key={t} onClick={() => setInviteForm({...inviteForm, team: t})} style={{ flex: 1, padding: 12, border: `2px solid ${inviteForm.team === t ? '#1a1a1a' : '#eee'}`, borderRadius: 8, background: inviteForm.team === t ? '#1a1a1a' : '#fff', color: inviteForm.team === t ? '#fff' : '#1a1a1a', fontWeight: '600', cursor: 'pointer' }}>
                  Équipe {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Prénom</div>
            <input type="text" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} placeholder="Ex: Thomas" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Email ou téléphone</div>
            <input type="text" value={inviteForm.contact} onChange={e => setInviteForm({...inviteForm, contact: e.target.value})} placeholder="Ex: 0612345678" style={inputStyle} />
          </div>
          <button onClick={sendInvite} style={{ ...btnPrimary, width: '100%' }}>Envoyer l'invitation</button>
        </Modal>
      )}

      {/* Modal Annuler */}
      {modal === 'cancel' && (
        <Modal onClose={() => setModal(null)} title="Annuler la partie">
          <p style={{ color: '#666', marginBottom: 16 }}>Cette action est irréversible. Tous les participants seront notifiés.</p>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Raison de l'annulation..." rows={3} style={{ ...inputStyle, resize: 'none', marginBottom: 16 }} />
          <button onClick={cancelMatch} style={{ ...btnPrimary, width: '100%', background: '#dc2626' }}>Confirmer l'annulation</button>
        </Modal>
      )}

      {/* Modal Résultat */}
      {modal === 'result' && (
        <Modal onClose={() => setModal(null)} title="Résultat">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Équipe gagnante</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(t => (
                <button key={t} onClick={() => setResultForm({...resultForm, winner: t})} style={{ flex: 1, padding: 16, border: `2px solid ${resultForm.winner === t ? '#22c55e' : '#eee'}`, borderRadius: 10, background: resultForm.winner === t ? '#dcfce7' : '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  🏆 Équipe {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Score (optionnel)</div>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#666', width: 50 }}>Set {s}</span>
                <input type="number" min="0" max="7" value={resultForm.scores[`s${s}a`] || ''} onChange={e => setResultForm({...resultForm, scores: {...resultForm.scores, [`s${s}a`]: e.target.value}})} placeholder="A" style={{ flex: 1, padding: 10, border: '1px solid #eee', borderRadius: 8, textAlign: 'center' }} />
                <span>-</span>
                <input type="number" min="0" max="7" value={resultForm.scores[`s${s}b`] || ''} onChange={e => setResultForm({...resultForm, scores: {...resultForm.scores, [`s${s}b`]: e.target.value}})} placeholder="B" style={{ flex: 1, padding: 10, border: '1px solid #eee', borderRadius: 8, textAlign: 'center' }} />
              </div>
            ))}
          </div>
          <button onClick={saveResult} disabled={!resultForm.winner} style={{ ...btnPrimary, width: '100%', background: '#2e7d32', opacity: resultForm.winner ? 1 : 0.5 }}>Enregistrer</button>
        </Modal>
      )}

      {/* Modal Player */}
      {modal === 'player' && selectedPlayer && (
        <Modal onClose={() => { setModal(null); setSelectedPlayer(null) }} title="">
          <div style={{ textAlign: 'center', paddingTop: 10 }}>
            <Avatar profile={selectedPlayer.profiles} size={80} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{selectedPlayer.profiles?.name}</h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ padding: '4px 12px', background: '#fbbf24', color: '#1a1a1a', borderRadius: 6, fontSize: 13, fontWeight: '700' }}>⭐ {selectedPlayer.profiles?.level}/10</span>
              <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: 6, fontSize: 13, fontWeight: '600' }}>✓ {selectedPlayer.profiles?.reliability_score || 100}%</span>
            </div>
            {selectedPlayer.profiles?.id !== user?.id && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleFavorite(selectedPlayer.profiles?.id)} style={{ ...btnSecondary, flex: 1, background: isFavorite(selectedPlayer.profiles?.id) ? '#fef3c7' : '#f5f5f5' }}>
                  {isFavorite(selectedPlayer.profiles?.id) ? '⭐ Favori' : '☆ Ajouter'}
                </button>
                <Link href={`/player/${selectedPlayer.profiles?.id}`} style={{ ...btnPrimary, flex: 1, textDecoration: 'none', textAlign: 'center' }}>
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
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #4ade80, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: size * 0.4, ...style }}>
      {profile?.name?.[0] || '?'}
    </div>
  )
}

function PlayerSlot({ player, isOrg, onSwap, onSelect, showPayment }) {
  if (!player) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 16, textAlign: 'center', border: '2px dashed rgba(255,255,255,0.3)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Place libre</div>
      </div>
    )
  }

  if (player.isPendingInvite) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, padding: 12, textAlign: 'center', border: '2px dashed #f59e0b' }}>
        <div style={{ fontSize: 20, marginBottom: 4 }}>⏳</div>
        <div style={{ fontWeight: '600', fontSize: 14 }}>{player.invitee_name}</div>
        <div style={{ fontSize: 10, background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>EN ATTENTE</div>
      </div>
    )
  }

  return (
    <div onClick={() => onSelect(player)} style={{ background: '#fff', borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
      <Avatar profile={player.profiles} size={36} style={{ margin: '0 auto 6px' }} />
      <div style={{ fontWeight: '600', fontSize: 14, color: '#1a1a1a' }}>
        {player.isOrganizer && '👑 '}{player.profiles?.name}
      </div>
      <div style={{ fontSize: 11, color: '#666' }}>
        {player.profiles?.level}/10 · {player.profiles?.position === 'left' ? 'Gauche' : player.profiles?.position === 'right' ? 'Droite' : 'Les 2'}
      </div>
      {showPayment && (
        <div style={{ fontSize: 10, color: player.has_paid ? '#22c55e' : '#f59e0b', marginTop: 4 }}>
          {player.has_paid ? '✓ Payé' : '💰 À payer'}
        </div>
      )}
      {isOrg && !player.isOrganizer && (
        <button onClick={e => { e.stopPropagation(); onSwap(player.id) }} style={{ marginTop: 6, padding: '4px 8px', background: '#f5f5f5', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
          ↔ Changer
        </button>
      )}
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: title ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: '600', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999', padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

// === STYLES ===

const badgeStyle = {
  padding: '6px 12px',
  background: '#f5f5f5',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: '500'
}

const btnPrimary = {
  padding: '14px 24px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: '600',
  cursor: 'pointer'
}

const btnSecondary = {
  padding: '14px 24px',
  background: '#fff',
  color: '#1a1a1a',
  border: '1px solid #eee',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: '600',
  cursor: 'pointer'
}

const btnSmall = {
  padding: '8px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: '600',
  cursor: 'pointer'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #eee',
  borderRadius: 10,
  fontSize: 15,
  boxSizing: 'border-box'
}