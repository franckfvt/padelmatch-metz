'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinMatchClient({ matchId }) {
  const router = useRouter()
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)

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

  const levelLabels = {
    'less6months': '1-2',
    '6months2years': '3-4',
    '2to5years': '5-6',
    'more5years': '7+',
    'all': 'Tous'
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

  const positionLabels = {
    'droite': 'Droite',
    'gauche': 'Gauche',
    'les_deux': 'D/G'
  }

  useEffect(() => {
    loadData()
  }, [matchId])

  async function loadData() {
    try {
      // Charger la partie
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance, reliability_score, level, position)
        `)
        .eq('id', matchId)
        .single()

      if (matchError || !matchData) {
        setError('Cette partie n\'existe pas ou a été supprimée.')
        setLoading(false)
        return
      }

      setMatch(matchData)

      // Charger les participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, experience, ambiance, reliability_score, level, position)
        `)
        .eq('match_id', matchId)

      setParticipants(participantsData || [])

      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData)

        // Vérifier si déjà inscrit
        const isOrganizer = matchData.organizer_id === session.user.id
        const isParticipant = participantsData?.some(p => p.user_id === session.user.id)
        setAlreadyJoined(isOrganizer || isParticipant)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading match:', error)
      setError('Erreur lors du chargement de la partie.')
      setLoading(false)
    }
  }

  async function joinMatch() {
    if (!user) {
      // Rediriger vers la connexion avec retour ici
      router.push(`/auth?redirect=/join/${matchId}`)
      return
    }

    if (!profile?.experience) {
      router.push(`/onboarding?redirect=/join/${matchId}`)
      return
    }

    setJoining(true)
    setError('')

    try {
      // Vérifier encore les places
      if (match.spots_available <= 0) {
        setError('Désolé, la partie est maintenant complète.')
        setJoining(false)
        return
      }

      // Inscrire le joueur
      const { error: joinError } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status: 'confirmed'
        })

      if (joinError) throw joinError

      // Mettre à jour le nombre de places
      const newSpots = match.spots_available - 1
      await supabase
        .from('matches')
        .update({
          spots_available: newSpots,
          status: newSpots === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      // Ajouter un message dans le chat
      await supabase
        .from('match_messages')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: `${profile?.name || 'Un joueur'} a rejoint la partie ! 🎾`
        })

      // Rediriger vers la page de la partie
      router.push(`/dashboard/match/${matchId}`)

    } catch (error) {
      console.error('Error joining match:', error)
      setError('Erreur lors de l\'inscription. Réessaie.')
    } finally {
      setJoining(false)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getReliabilityColor(score) {
    if (score >= 90) return '#2e7d32'
    if (score >= 70) return '#f59e0b'
    return '#dc2626'
  }

  function getLevel(profile) {
    if (profile?.level) return profile.level
    if (profile?.experience) return levelLabels[profile.experience]
    return '?'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement de la partie...</div>
        </div>
      </div>
    )
  }

  if (error && !match) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            Partie introuvable
          </h1>
          <p style={{ color: '#666', marginBottom: 24 }}>
            {error}
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const totalPlayers = 1 + participants.length
  const isFull = match.spots_available <= 0
  const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        paddingTop: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎾</div>
            <div style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
              PadelMatch
            </div>
          </Link>
        </div>

        {/* Carte d'invitation */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          {/* Header invitation */}
          <div style={{
            textAlign: 'center',
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: '1px solid #eee'
          }}>
            <div style={{ fontSize: 18, color: '#666', marginBottom: 8 }}>
              {match.profiles?.name} t'invite à jouer
            </div>
            <h1 style={{
              fontSize: 28,
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0
            }}>
              Partie de Padel
            </h1>
          </div>

          {/* Infos principales */}
          <div style={{ marginBottom: 28 }}>
            {/* Date */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: '#f5f5f5',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                📅
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#1a1a1a', fontSize: 17 }}>
                  {formatDate(match.match_date)}
                </div>
                <div style={{ color: '#2e7d32', fontWeight: '600', fontSize: 20 }}>
                  {formatTime(match.match_time)}
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: '#f5f5f5',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                📍
              </div>
              <div>
                <div style={{ fontWeight: '700', color: '#1a1a1a', fontSize: 17 }}>
                  {match.clubs?.name}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  {match.clubs?.address}
                </div>
              </div>
            </div>

            {/* Niveau et ambiance */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {match.level_required && match.level_required !== 'all' && (
                <span style={{
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '10px 18px',
                  borderRadius: 30,
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  ⭐ Niveau {levelLabels[match.level_required] || match.level_required}+
                </span>
              )}
              <span style={{
                background: match.ambiance === 'compet' ? '#fef3c7' :
                           match.ambiance === 'loisir' ? '#dbeafe' : '#f5f5f5',
                color: match.ambiance === 'compet' ? '#92400e' :
                       match.ambiance === 'loisir' ? '#1e40af' : '#666',
                padding: '10px 18px',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: '600'
              }}>
                {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
              </span>
              {pricePerPerson > 0 && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '10px 18px',
                  borderRadius: 30,
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  💰 {pricePerPerson}€/pers
                </span>
              )}
            </div>
          </div>

          {/* Joueurs */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#999',
                textTransform: 'uppercase'
              }}>
                Joueurs
              </span>
              <span style={{
                background: isFull ? '#fef3c7' : '#e8f5e9',
                color: isFull ? '#92400e' : '#2e7d32',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: '700'
              }}>
                {totalPlayers}/{match.spots_total}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {/* Organisateur */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                background: '#fafafa',
                borderRadius: 14,
                border: '2px solid #1a1a1a'
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 2 }}>
                    {match.profiles?.name} ⭐
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#2e7d32' }}>
                      Niveau {getLevel(match.profiles)}
                    </span>
                    {match.profiles?.position && (
                      <span style={{ fontSize: 12, color: '#666' }}>
                        • {positionLabels[match.profiles.position]}
                      </span>
                    )}
                    <span style={{
                      fontSize: 12,
                      color: getReliabilityColor(match.profiles?.reliability_score || 100)
                    }}>
                      • {match.profiles?.reliability_score || 100}% fiable
                    </span>
                  </div>
                </div>
              </div>

              {/* Participants */}
              {participants.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    background: '#fafafa',
                    borderRadius: 14
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    background: '#e5e5e5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18
                  }}>
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 2 }}>
                      {p.profiles?.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#2e7d32' }}>
                        Niveau {getLevel(p.profiles)}
                      </span>
                      {p.profiles?.position && (
                        <span style={{ fontSize: 12, color: '#666' }}>
                          • {positionLabels[p.profiles.position]}
                        </span>
                      )}
                      <span style={{
                        fontSize: 12,
                        color: getReliabilityColor(p.profiles?.reliability_score || 100)
                      }}>
                        • {p.profiles?.reliability_score || 100}% fiable
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Places vides */}
              {Array.from({ length: match.spots_available }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    border: '2px dashed #e5e5e5',
                    borderRadius: 14,
                    color: '#999',
                    fontSize: 14
                  }}
                >
                  Place disponible
                </div>
              ))}
            </div>
          </div>

          {/* Bouton d'action */}
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {alreadyJoined ? (
            <div>
              <div style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: 20,
                borderRadius: 14,
                textAlign: 'center',
                fontWeight: '600',
                marginBottom: 12
              }}>
                ✓ Tu es inscrit à cette partie !
              </div>
              <Link href={`/dashboard/match/${matchId}`}>
                <button style={{
                  width: '100%',
                  padding: '18px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Voir la partie
                </button>
              </Link>
            </div>
          ) : isFull ? (
            <div style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: 20,
              borderRadius: 14,
              textAlign: 'center',
              fontWeight: '600'
            }}>
              Cette partie est complète
            </div>
          ) : (
            <button
              onClick={joinMatch}
              disabled={joining}
              style={{
                width: '100%',
                padding: '18px',
                background: joining ? '#e5e5e5' : '#2e7d32',
                color: joining ? '#999' : '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: joining ? 'not-allowed' : 'pointer'
              }}
            >
              {joining ? 'Inscription...' : user ? 'Rejoindre cette partie' : 'Se connecter pour rejoindre'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
          <Link href="/" style={{ color: '#666' }}>
            En savoir plus sur PadelMatch
          </Link>
        </div>
      </div>
    </div>
  )
}