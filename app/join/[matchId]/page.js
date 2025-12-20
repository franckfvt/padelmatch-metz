'use client'

/**
 * ============================================
 * PAGE PUBLIQUE REJOINDRE UN MATCH
 * ============================================
 * 
 * Page d'arrivée via lien partagé.
 * Affiche les équipes A/B, permet de choisir
 * son équipe et de s'inscrire seul ou en duo.
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  
  // Mode duo
  const [showDuoModal, setShowDuoModal] = useState(false)
  const [duoEmail, setDuoEmail] = useState('')
  const [duoName, setDuoName] = useState('')
  const [sendingDuoInvite, setSendingDuoInvite] = useState(false)
  
  // Nouveaux états
  const [selectedTeam, setSelectedTeam] = useState('A')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [duoSearch, setDuoSearch] = useState('')
  const [duoResults, setDuoResults] = useState([])
  const [duoSelected, setDuoSelected] = useState(null)
  
  // Labels
  const ambianceLabels = { 'loisir': 'Détente', 'mix': 'Équilibré', 'compet': 'Compétitif' }
  const ambianceEmojis = { 'loisir': '😎', 'mix': '⚡', 'compet': '🏆' }
  const positionShort = { 'left': 'G', 'right': 'D', 'both': 'P' }

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
        .select(`
          *,
          profiles (id, name, level, position, avatar_url)
        `)
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

  async function joinMatch(asDuo = false) {
    if (!user) {
      // Rediriger vers login avec retour
      sessionStorage.setItem('redirectAfterLogin', `/join/${matchId}`)
      router.push('/auth')
      return
    }

    if (!profile?.name || !profile?.level) {
      sessionStorage.setItem('redirectAfterOnboarding', `/join/${matchId}`)
      router.push('/onboarding')
      return
    }

    if (asDuo && !duoSelected) {
      setShowDuoModal(true)
      return
    }

    setJoining(true)

    try {
      // Déterminer le status (auto = confirmed, approval = pending)
      const status = match.join_mode === 'approval' ? 'pending' : 'confirmed'

      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status,
          team: selectedTeam,
          duo_with: duoSelected?.id || null
        })

      if (error) throw error

      // Si duo avec un user de l'app, créer aussi sa participation
      if (asDuo && duoSelected) {
        await supabase.from('match_participants').insert({
          match_id: parseInt(matchId),
          user_id: duoSelected.id,
          status,
          team: selectedTeam,
          duo_with: user.id
        })
      }

      // Mettre à jour les places si confirmation directe
      if (status === 'confirmed') {
        const spotsUsed = duoSelected ? 2 : 1
        await supabase
          .from('matches')
          .update({ 
            spots_available: match.spots_available - spotsUsed,
            status: match.spots_available - spotsUsed <= 0 ? 'full' : 'open'
          })
          .eq('id', matchId)

        // Message dans le chat
        await supabase.from('match_messages').insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: duoSelected 
            ? `👥 ${profile?.name} + ${duoSelected.name} ont rejoint la partie`
            : `👋 ${profile?.name} a rejoint la partie`
        })

        router.push(`/dashboard/match/${matchId}`)
      } else {
        // Mode approval: Envoyer email à l'organisateur
        try {
          // Récupérer l'email de l'organisateur
          const { data: organizerData } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', match.organizer_id)
            .single()

          if (organizerData?.email) {
            await fetch('/api/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'join_request',
                data: {
                  organizerEmail: organizerData.email,
                  organizerName: organizerData.name,
                  playerName: profile?.name,
                  playerLevel: profile?.level,
                  playerPosition: profile?.preferred_position || 'Non spécifiée',
                  matchId: matchId,
                  matchDate: formatFullDate(match.match_date),
                  matchTime: match.match_time?.slice(0, 5) || '?h',
                  clubName: match.clubs?.name || match.city || 'Lieu à définir',
                  team: selectedTeam
                }
              })
            })
          }
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
          // Ne pas bloquer si l'email échoue
        }

        // Message demande
        await supabase.from('match_messages').insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: duoSelected 
            ? `🎾 ${profile?.name} + ${duoSelected.name} demandent à rejoindre`
            : `🎾 ${profile?.name} demande à rejoindre`
        })
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

  // Formater date complète
  function formatFullDate(dateStr) {
    if (!dateStr) return 'Date flexible'
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  // Recherche de partenaire dans l'app
  async function searchDuoPartner(query) {
    setDuoSearch(query)
    if (query.length < 2) { setDuoResults([]); return }
    
    const { data } = await supabase
      .from('profiles')
      .select('id, name, level, avatar_url')
      .neq('id', user?.id)
      .ilike('name', `%${query}%`)
      .limit(5)
    
    setDuoResults(data || [])
  }

  async function joinAsDuo() {
    if (!duoEmail && !duoName) {
      alert('Indique le nom ou l\'email de ton partenaire')
      return
    }

    setSendingDuoInvite(true)

    try {
      const status = match.join_mode === 'approval' ? 'pending' : 'confirmed'

      // Chercher le partenaire par email s'il est déjà inscrit
      let duoUserId = null
      let duoPartnerName = duoName
      
      if (duoEmail) {
        const { data: duoProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('email', duoEmail)
          .single()
        
        duoUserId = duoProfile?.id
        if (duoProfile?.name) duoPartnerName = duoProfile.name
      }

      // Créer ma participation avec référence au duo
      const { error: error1 } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status,
          team: selectedTeam,
          duo_with: duoUserId
        })

      if (error1) throw error1

      // Si le partenaire est inscrit sur l'app, créer aussi sa participation
      if (duoUserId) {
        const { error: error2 } = await supabase
          .from('match_participants')
          .insert({
            match_id: parseInt(matchId),
            user_id: duoUserId,
            status,
            team: selectedTeam,
            duo_with: user.id
          })

        // Ignorer l'erreur si déjà inscrit
        if (error2 && !error2.message.includes('duplicate')) {
          console.error('Duo partner error:', error2)
        }
      } else if (duoEmail) {
        // Le partenaire n'est pas inscrit mais on a son email
        // Envoyer un email d'invitation
        try {
          await fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'duo_invite',
              data: {
                partnerEmail: duoEmail,
                partnerName: duoName || 'Joueur',
                inviterName: profile?.name,
                inviterId: user.id,
                matchId: matchId,
                matchDate: formatFullDate(match.match_date),
                matchTime: match.match_time?.slice(0, 5) || '?h',
                clubName: match.clubs?.name || match.city || 'Lieu à définir',
                team: `Équipe ${selectedTeam}`
              }
            })
          })

          // Créer une pending_invite pour le partenaire
          await supabase.from('pending_invites').insert({
            match_id: parseInt(matchId),
            email: duoEmail,
            name: duoName || 'Partenaire de ' + profile?.name,
            team: selectedTeam,
            invited_by: user.id,
            status: 'pending'
          })
        } catch (emailError) {
          console.error('Erreur envoi email duo:', emailError)
          // Ne pas bloquer si l'email échoue
        }
      }

      // Mettre à jour les places si confirmation directe
      if (status === 'confirmed') {
        const spotsUsed = duoUserId ? 2 : 1
        await supabase
          .from('matches')
          .update({ 
            spots_available: match.spots_available - spotsUsed,
            status: match.spots_available - spotsUsed <= 0 ? 'full' : 'open'
          })
          .eq('id', matchId)

        await supabase.from('match_messages').insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: duoUserId 
            ? `👥 ${profile?.name} + ${duoPartnerName} ont rejoint`
            : `👥 ${profile?.name} a rejoint (partenaire invité: ${duoName || duoEmail})`
        })

        router.push(`/dashboard/match/${matchId}`)
      } else {
        // Mode approval
        if (match.join_mode === 'approval' && duoEmail && !duoUserId) {
          // Notifier aussi l'organisateur de l'invitation duo
          try {
            const { data: organizerData } = await supabase
              .from('profiles')
              .select('email, name')
              .eq('id', match.organizer_id)
              .single()

            if (organizerData?.email) {
              await fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'join_request',
                  data: {
                    organizerEmail: organizerData.email,
                    playerName: `${profile?.name} + ${duoName || 'partenaire invité'}`,
                    playerLevel: profile?.level,
                    playerPosition: profile?.preferred_position || 'Non spécifiée',
                    matchId: matchId,
                    matchDate: formatFullDate(match.match_date),
                    matchTime: match.match_time?.slice(0, 5) || '?h',
                    clubName: match.clubs?.name || match.city || 'Lieu à définir',
                    team: selectedTeam
                  }
                })
              })
            }
          } catch (e) {
            console.error('Erreur email orga:', e)
          }
        }
        
        setIsPending(true)
        setShowDuoModal(false)
        setSendingDuoInvite(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de l\'inscription en duo')
      setSendingDuoInvite(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Date flexible'
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

  function getPlayerCount() {
    const confirmed = participants.filter(p => p.status === 'confirmed').length
    return 1 + confirmed + pendingInvites.length // Orga + participants confirmés + invités
  }

  function getSpotsLeft() {
    return 4 - getPlayerCount()
  }

  function getPositionLabel(position) {
    if (position === 'left') return 'Gauche'
    if (position === 'right') return 'Droite'
    return 'Polyvalent'
  }

  // Préparer les équipes
  const orgaPlayer = match ? {
    isOrganizer: true,
    profiles: match.profiles,
    team: match.organizer_team || 'A',
    status: 'confirmed'
  } : null

  const allPlayers = orgaPlayer ? [
    orgaPlayer,
    ...participants.filter(p => p.status === 'confirmed'),
    ...pendingInvites.map(i => ({ ...i, isPendingInvite: true, status: 'invited' }))
  ] : []

  const teamA = allPlayers.filter(p => p.team === 'A')
  const teamB = allPlayers.filter(p => p.team === 'B')
  const pricePerPerson = match?.price_total ? Math.round(match.price_total / 100 / 4) : 0

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Partie introuvable</h1>
          <Link href="/" style={{ color: '#2e7d32' }}>Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  const isFull = getPlayerCount() >= 4 || match.status === 'full'
  const isCancelled = match.status === 'cancelled'
  const isCompleted = match.status === 'completed'
  const canJoin = !isFull && !isCancelled && !isCompleted && !alreadyJoined && !isPending

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>
          ← Retour
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>🎾</span>
          <span style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>PadelMatch</span>
        </div>
      </div>

      <div style={{ padding: '0 16px 100px', maxWidth: 500, margin: '0 auto' }}>
        
        {/* Carte principale */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Header lieu */}
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            padding: '24px 20px',
            color: '#fff'
          }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>📍 LIEU</div>
            <div style={{ fontSize: 22, fontWeight: '700' }}>
              {match.clubs?.name || match.city || 'Lieu à définir'}
            </div>
            {match.clubs?.address && (
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{match.clubs.address}</div>
            )}
          </div>

          {/* Date & Heure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #eee' }}>
            <div style={{ padding: 16, borderRight: '1px solid #eee', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: 0.5 }}>📅 DATE</div>
              <div style={{ fontSize: 15, fontWeight: '600' }}>
                {match.match_date
                  ? new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                  : match.flexible_day || 'Flexible'
                }
              </div>
            </div>
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: 0.5 }}>🕐 HEURE</div>
              <div style={{ fontSize: 15, fontWeight: '600' }}>
                {formatTime(match.match_time) || match.flexible_period || 'Flexible'}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', borderBottom: '1px solid #eee' }}>
            <span style={badgeStyle}>⭐ Niveau {match.level_min || 1}-{match.level_max || 10}</span>
            <span style={badgeStyle}>{ambianceEmojis[match.ambiance] || '⚡'} {ambianceLabels[match.ambiance] || 'Équilibré'}</span>
            {pricePerPerson > 0 && (
              <span style={{ ...badgeStyle, background: '#fef3c7', color: '#92400e' }}>💰 {pricePerPerson}€/pers</span>
            )}
          </div>

          {/* Organisateur */}
          <div style={{ padding: 14, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar profile={match.profiles} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#888' }}>Organisé par</div>
              <div style={{ fontWeight: '600' }}>👑 {match.profiles?.name}</div>
            </div>
          </div>

          {/* Équipes A vs B */}
          <div style={{ padding: 16 }}>
            <div style={{
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: 12,
              color: getSpotsLeft() > 0 ? '#166534' : '#dc2626'
            }}>
              {getSpotsLeft() > 0 ? `${getSpotsLeft()} place${getSpotsLeft() > 1 ? 's' : ''} disponible${getSpotsLeft() > 1 ? 's' : ''}` : '😕 Complet'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 1fr', gap: 8 }}>
              {/* Équipe A */}
              <div>
                <div style={{ fontSize: 10, fontWeight: '700', color: '#22c55e', marginBottom: 6, textAlign: 'center', letterSpacing: 1 }}>ÉQUIPE A</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[0, 1].map(i => (
                    <PlayerSlotPublic key={`a-${i}`} player={teamA[i]} />
                  ))}
                </div>
              </div>

              {/* VS */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: '700', color: '#ccc' }}>VS</span>
              </div>

              {/* Équipe B */}
              <div>
                <div style={{ fontSize: 10, fontWeight: '700', color: '#3b82f6', marginBottom: 6, textAlign: 'center', letterSpacing: 1 }}>ÉQUIPE B</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[0, 1].map(i => (
                    <PlayerSlotPublic key={`b-${i}`} player={teamB[i]} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status badges */}
          {isCancelled && (
            <div style={{ padding: 16, background: '#fee2e2', color: '#dc2626', textAlign: 'center', fontWeight: '600' }}>
              ❌ Cette partie a été annulée
            </div>
          )}
          {isCompleted && (
            <div style={{ padding: 16, background: '#dcfce7', color: '#166534', textAlign: 'center', fontWeight: '600' }}>
              ✅ Cette partie est terminée
            </div>
          )}
        </div>

        {/* Messages status */}
        {alreadyJoined && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(34,197,94,0.2)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ color: '#22c55e', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              ✅ Tu participes à cette partie !
            </div>
            <Link href={`/dashboard/match/${matchId}`} style={{
              display: 'inline-block', padding: '12px 24px', background: '#fff', color: '#1a1a1a',
              borderRadius: 10, textDecoration: 'none', fontWeight: '600', fontSize: 14
            }}>
              Voir la partie →
            </Link>
          </div>
        )}

        {isPending && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(245,158,11,0.2)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: '600' }}>⏳ Demande envoyée</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>L'organisateur doit valider ta participation</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          L'app pour organiser tes parties de padel
        </div>
      </div>

      {/* CTA Fixe */}
      {canJoin && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', padding: 16, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{
                width: '100%', padding: 16, background: '#22c55e', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 16, fontWeight: '600', cursor: 'pointer'
              }}
            >
              {user ? '🎾 Rejoindre la partie' : 'Se connecter pour rejoindre'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Rejoindre (nouveau) */}
      {showJoinModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0', width: '100%',
            maxWidth: 500, maxHeight: '85vh', overflow: 'auto'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: '600', margin: 0 }}>Rejoindre la partie</h3>
              <button onClick={() => { setShowJoinModal(false); setDuoSelected(null); setDuoSearch('') }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
            </div>

            <div style={{ padding: 20 }}>
              {!user ? (
                <>
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                    Connecte-toi pour demander à rejoindre cette partie
                  </p>
                  <button onClick={() => { sessionStorage.setItem('redirectAfterLogin', `/join/${matchId}`); router.push('/auth') }}
                    style={{ width: '100%', padding: 16, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: '600', cursor: 'pointer' }}>
                    Se connecter
                  </button>
                </>
              ) : (
                <>
                  {/* Choix équipe */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Dans quelle équipe ?</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['A', 'B'].map(team => (
                        <button key={team} onClick={() => setSelectedTeam(team)} style={{
                          flex: 1, padding: 14,
                          border: `2px solid ${selectedTeam === team ? (team === 'A' ? '#22c55e' : '#3b82f6') : '#e5e5e5'}`,
                          borderRadius: 10,
                          background: selectedTeam === team ? (team === 'A' ? '#f0fdf4' : '#eff6ff') : '#fff',
                          fontWeight: '600', cursor: 'pointer'
                        }}>
                          Équipe {team}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option duo */}
                  {getSpotsLeft() >= 2 && (
                    <div style={{ marginBottom: 20, padding: 16, background: '#f9f9f9', borderRadius: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 10 }}>👥 Venir avec un partenaire ?</div>
                      
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
                          <input type="text" value={duoSearch} onChange={(e) => searchDuoPartner(e.target.value)}
                            placeholder="Rechercher un joueur..."
                            style={{ width: '100%', padding: 12, border: '1px solid #e5e5e5', borderRadius: 10, fontSize: 15, marginBottom: 8, boxSizing: 'border-box' }}
                          />
                          {duoResults.length > 0 && (
                            <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' }}>
                              {duoResults.map(p => (
                                <div key={p.id} onClick={() => { setDuoSelected(p); setDuoResults([]); setDuoSearch('') }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
                                  <Avatar profile={p} size={32} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500' }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>Niveau {p.level}/10</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' }}>
                            ou laisse vide pour rejoindre seul(e)
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' }}>
                    {match.join_mode === 'approval' ? "L'organisateur devra accepter ta demande" : "Tu seras directement inscrit(e)"}
                  </p>

                  {/* Bouton */}
                  <button onClick={() => joinMatch(!!duoSelected)} disabled={joining}
                    style={{
                      width: '100%', padding: 16,
                      background: joining ? '#e5e5e5' : '#22c55e',
                      color: joining ? '#999' : '#fff',
                      border: 'none', borderRadius: 12, fontSize: 16, fontWeight: '600',
                      cursor: joining ? 'not-allowed' : 'pointer'
                    }}>
                    {joining ? 'Inscription...' : (duoSelected ? `Rejoindre avec ${duoSelected.name}` : 'Rejoindre la partie')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Duo (ancien, gardé pour compatibilité) */}
      {showDuoModal && (
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
        onClick={(e) => e.target === e.currentTarget && setShowDuoModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 8px' }}>
              👥 Rejoindre en duo
            </h2>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
              Avec qui viens-tu jouer ?
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                Nom de ton partenaire
              </label>
              <input
                type="text"
                value={duoName}
                onChange={(e) => setDuoName(e.target.value)}
                placeholder="Ex: Julie"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #eee',
                  fontSize: 15
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                Son email <span style={{ color: '#999', fontWeight: '400' }}>(s'il est sur PadelMatch)</span>
              </label>
              <input
                type="email"
                value={duoEmail}
                onChange={(e) => setDuoEmail(e.target.value)}
                placeholder="julie@email.com"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #eee',
                  fontSize: 15
                }}
              />
            </div>

            <button
              onClick={joinAsDuo}
              disabled={sendingDuoInvite || (!duoName && !duoEmail)}
              style={{
                width: '100%',
                padding: 14,
                background: sendingDuoInvite ? '#ccc' : '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: sendingDuoInvite ? 'not-allowed' : 'pointer',
                marginBottom: 10
              }}
            >
              {sendingDuoInvite ? 'Inscription...' : 'Rejoindre en duo'}
            </button>

            <button
              onClick={() => setShowDuoModal(false)}
              style={{
                width: '100%',
                padding: 12,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// === COMPOSANTS ===

function Avatar({ profile, size = 40 }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: '600', fontSize: size * 0.4
    }}>
      {profile?.name?.[0] || '?'}
    </div>
  )
}

function PlayerSlotPublic({ player }) {
  const positionShort = { 'left': 'G', 'right': 'D', 'both': 'P' }

  if (!player) {
    return (
      <div style={{
        background: '#f9f9f9', borderRadius: 8, padding: 10, textAlign: 'center',
        border: '2px dashed #e5e5e5', minHeight: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ color: '#ccc', fontSize: 12 }}>Place libre</span>
      </div>
    )
  }

  if (player.isPendingInvite) {
    return (
      <div style={{ background: '#fffbeb', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid #fcd34d' }}>
        <div style={{ fontSize: 14, marginBottom: 2 }}>⏳</div>
        <div style={{ fontSize: 12, fontWeight: '500', color: '#92400e' }}>{player.invitee_name}</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 8, border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar profile={player.profiles} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: '600', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.isOrganizer && <span>👑</span>}
          {player.profiles?.name}
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>
          ⭐{player.profiles?.level} • {positionShort[player.profiles?.position] || 'P'}
        </div>
      </div>
    </div>
  )
}

// === STYLES ===

const badgeStyle = {
  padding: '6px 12px',
  background: '#f5f5f5',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: '600'
}