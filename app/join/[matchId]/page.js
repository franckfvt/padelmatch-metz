'use client'

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
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  // Mode duo
  const [showDuoModal, setShowDuoModal] = useState(false)
  const [duoEmail, setDuoEmail] = useState('')
  const [duoName, setDuoName] = useState('')
  const [sendingDuoInvite, setSendingDuoInvite] = useState(false)

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
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (id, name, level, position)
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
          profiles (id, name, level, position)
        `)
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'pending'])

      setParticipants(participantsData || [])

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

    if (asDuo) {
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
          status
        })

      if (error) throw error

      // Mettre à jour les places si confirmation directe
      if (status === 'confirmed') {
        await supabase
          .from('matches')
          .update({ 
            spots_available: match.spots_available - 1,
            status: match.spots_available - 1 <= 0 ? 'full' : 'open'
          })
          .eq('id', matchId)

        // Message dans le chat
        await supabase.from('match_messages').insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: `👋 ${profile?.name} a rejoint la partie`
        })

        router.push(`/dashboard/match/${matchId}`)
      } else {
        setIsPending(true)
        setJoining(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de l\'inscription')
      setJoining(false)
    }
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
      if (duoEmail) {
        const { data: duoProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', duoEmail)
          .single()
        
        duoUserId = duoProfile?.id
      }

      // Créer ma participation avec référence au duo
      const { error: error1 } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status,
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
            duo_with: user.id
          })

        // Ignorer l'erreur si déjà inscrit
        if (error2 && !error2.message.includes('duplicate')) {
          console.error('Duo partner error:', error2)
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
          message: `👥 ${profile?.name} a rejoint avec ${duoName || 'son partenaire'}`
        })

        router.push(`/dashboard/match/${matchId}`)
      } else {
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

  function getPlayerCount() {
    const confirmed = participants.filter(p => p.status === 'confirmed').length
    return 1 + confirmed // Orga + participants confirmés
  }

  function getPositionLabel(position) {
    if (position === 'left') return 'Gauche'
    if (position === 'right') return 'Droite'
    return 'Les deux'
  }

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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎾</span>
          <span style={{ fontSize: 18, fontWeight: '700' }}>PadelMatch</span>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>
        
        {/* Invitation card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {match.profiles?.name} t'invite à jouer
          </div>
          
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: '700', 
            color: '#1a1a1a',
            margin: '0 0 4px'
          }}>
            {match.clubs?.name}
          </h1>
          
          <div style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
            📅 {formatDate(match.match_date)} à {formatTime(match.match_time)}
          </div>

          {match.level_required && match.level_required !== 'all' && (
            <div style={{
              display: 'inline-block',
              background: '#dcfce7',
              color: '#166534',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 16
            }}>
              🎯 Niveau {match.level_required}+ recherché
            </div>
          )}

          {/* Status badges */}
          {isCancelled && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '12px 20px',
              borderRadius: 10,
              fontWeight: '600'
            }}>
              ❌ Partie annulée
            </div>
          )}

          {isCompleted && (
            <div style={{
              background: '#f5f5f5',
              color: '#666',
              padding: '12px 20px',
              borderRadius: 10,
              fontWeight: '600'
            }}>
              ✅ Partie terminée
            </div>
          )}
        </div>

        {/* Joueurs */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          border: '1px solid #eee'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16 
          }}>
            <h2 style={{ fontSize: 16, fontWeight: '600', margin: 0 }}>
              Joueurs
            </h2>
            <span style={{
              background: isFull ? '#dcfce7' : '#fef3c7',
              color: isFull ? '#166534' : '#92400e',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '600'
            }}>
              {getPlayerCount()}/4
            </span>
          </div>

          {/* Organisateur */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid #f5f5f5'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              👑
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                {match.profiles?.name}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                ⭐ {match.profiles?.level}/10 • 🎾 {getPositionLabel(match.profiles?.position)}
              </div>
            </div>
            <div style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: '600'
            }}>
              Orga
            </div>
          </div>

          {/* Participants confirmés */}
          {participants.filter(p => p.status === 'confirmed').map(p => (
            <div 
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid #f5f5f5'
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {p.profiles?.name}
                  {p.duo_with && ' 👥'}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  ⭐ {p.profiles?.level}/10 • 🎾 {getPositionLabel(p.profiles?.position)}
                </div>
              </div>
            </div>
          ))}

          {/* Places libres */}
          {Array(Math.max(0, 4 - getPlayerCount())).fill(0).map((_, i) => (
            <div 
              key={`empty-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: i < 3 - getPlayerCount() ? '1px solid #f5f5f5' : 'none'
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#fff',
                border: '2px dashed #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ccc'
              }}>
                ?
              </div>
              <div style={{ color: '#999' }}>
                Place libre
              </div>
            </div>
          ))}
        </div>

        {/* Boutons d'action */}
        {!isCancelled && !isCompleted && (
          <div>
            {alreadyJoined ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '16px 20px',
                  borderRadius: 12,
                  fontWeight: '600',
                  marginBottom: 12
                }}>
                  ✅ Tu participes à cette partie !
                </div>
                <Link
                  href={`/dashboard/match/${matchId}`}
                  style={{
                    display: 'inline-block',
                    padding: '14px 24px',
                    background: '#1a1a1a',
                    color: '#fff',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Voir la partie →
                </Link>
              </div>
            ) : isPending ? (
              <div style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '16px 20px',
                borderRadius: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '600', marginBottom: 4 }}>
                  ⏳ Demande envoyée
                </div>
                <div style={{ fontSize: 14 }}>
                  L'organisateur doit valider ta participation
                </div>
              </div>
            ) : isFull ? (
              <div style={{
                background: '#f5f5f5',
                color: '#666',
                padding: '16px 20px',
                borderRadius: 12,
                textAlign: 'center',
                fontWeight: '600'
              }}>
                😕 Cette partie est complète
              </div>
            ) : (
              <>
                {/* Rejoindre seul */}
                <button
                  onClick={() => joinMatch(false)}
                  disabled={joining}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: joining ? '#ccc' : '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: joining ? 'not-allowed' : 'pointer',
                    marginBottom: 10
                  }}
                >
                  {joining ? 'Inscription...' : '🎾 Rejoindre la partie'}
                </button>

                {/* Rejoindre en duo (si 2+ places dispo) */}
                {4 - getPlayerCount() >= 2 && (
                  <button
                    onClick={() => joinMatch(true)}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: '#fff',
                      color: '#1a1a1a',
                      border: '2px solid #1a1a1a',
                      borderRadius: 12,
                      fontSize: 15,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    👥 Rejoindre en duo
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Pas de compte */}
        {!user && !isFull && !isCancelled && !isCompleted && (
          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: 14,
            marginTop: 16 
          }}>
            Tu n'as pas encore de compte ?<br />
            <Link href="/auth" style={{ color: '#2e7d32', fontWeight: '600' }}>
              Crée ton profil en 30 sec
            </Link>
          </p>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <span>🎾</span>
            <span style={{ fontWeight: '600', color: '#666' }}>PadelMatch</span>
          </div>
          <div style={{ fontSize: 13, color: '#999' }}>
            L'app pour organiser tes parties de padel
          </div>
        </div>
      </div>

      {/* Modal Duo */}
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