'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JoinMatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId

  const [match, setMatch] = useState(null)
  const [organizer, setOrganizer] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [error, setError] = useState('')
  
  // Formulaire inscription
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('')
  const [ambiance, setAmbiance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [mode, setMode] = useState('signup')

  useEffect(() => {
    loadMatch()
    checkUser()
  }, [matchId])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      // Charger le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUserProfile(profile)
    }
  }

  async function loadMatch() {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance)
        `)
        .eq('id', matchId)
        .single()

      if (matchError || !matchData) {
        setError('Cette partie n\'existe pas ou a ete annulee.')
        setLoading(false)
        return
      }

      setMatch(matchData)
      setOrganizer(matchData.profiles)

      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, experience, ambiance)
        `)
        .eq('match_id', matchId)

      setParticipants(participantsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading match:', error)
      setError('Erreur lors du chargement de la partie.')
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (mode === 'signup' && (!experience || !ambiance)) {
      setError('Merci de renseigner ton niveau et ton ambiance')
      setSubmitting(false)
      return
    }

    try {
      let userId

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })

        if (error) throw error
        userId = data.user?.id

        // Mettre a jour le profil avec niveau et ambiance
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              experience: experience,
              ambiance: ambiance
            })
            .eq('id', userId)
        }

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
        userId = data.user?.id
      }

      if (!userId) throw new Error('Erreur lors de l\'authentification')

      await joinMatchWithUser(userId)

    } catch (error) {
      console.error('Auth error:', error)
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (error.message.includes('User already registered')) {
        setError('Un compte existe deja avec cet email. Connecte-toi !')
        setMode('login')
      } else if (error.message.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caracteres')
      } else {
        setError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function joinMatchWithUser(userId) {
    try {
      const { data: existing } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        router.push(`/dashboard/match/${matchId}`)
        return
      }

      if (match.organizer_id === userId) {
        router.push(`/dashboard/match/${matchId}`)
        return
      }

      if (match.spots_available <= 0) {
        setError('Desole, cette partie est complete.')
        return
      }

      const { error: joinError } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: userId,
          status: 'confirmed'
        })

      if (joinError) throw joinError

      await supabase
        .from('matches')
        .update({
          spots_available: match.spots_available - 1,
          status: match.spots_available - 1 === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single()

      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: userId,
        message: `${profile?.name || 'Un nouveau joueur'} a rejoint la partie ! 🎾`
      })

      router.push(`/dashboard/match/${matchId}`)

    } catch (error) {
      console.error('Error joining match:', error)
      setError('Erreur lors de l\'inscription a la partie.')
    }
  }

  async function handleJoinAsConnectedUser() {
    if (!user) return
    setSubmitting(true)
    await joinMatchWithUser(user.id)
    setSubmitting(false)
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    return date.toLocaleDateString('fr-FR', options)
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  const experienceOptions = [
    { id: 'less6months', label: 'Debutant', emoji: '🌱', desc: 'Moins de 6 mois' },
    { id: '6months2years', label: 'Intermediaire', emoji: '📈', desc: '6 mois - 2 ans' },
    { id: '2to5years', label: 'Confirme', emoji: '💪', desc: '2 - 5 ans' },
    { id: 'more5years', label: 'Expert', emoji: '🏆', desc: 'Plus de 5 ans' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Detente', emoji: '😎', desc: 'Fun et convivial' },
    { id: 'mix', label: 'Equilibre', emoji: '⚡', desc: 'Fun mais on joue bien' },
    { id: 'compet', label: 'Competitif', emoji: '🏆', desc: 'On est la pour gagner' }
  ]

  const experienceLabels = {
    'less6months': '🌱 Debutant',
    '6months2years': '📈 Intermediaire',
    '2to5years': '💪 Confirme',
    'more5years': '🏆 Expert'
  }

  const ambianceLabels = {
    'loisir': '😎 Detente',
    'mix': '⚡ Equilibre',
    'compet': '🏆 Competitif'
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
          <div style={{ color: '#666' }}>Chargement de l invitation...</div>
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
            Decouvrir PadelMatch
          </Link>
        </div>
      </div>
    )
  }

  if (match && match.spots_available <= 0 && !user) {
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            Partie complete
          </h1>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Cette partie a trouve tous ses joueurs. Mais tu peux en rejoindre d autres !
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Trouver une partie
          </Link>
        </div>
      </div>
    )
  }

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

        {/* Carte invitation */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          
          {/* Message invitation */}
          <div style={{
            textAlign: 'center',
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: '1px solid #eee'
          }}>
            <div style={{
              width: 64,
              height: 64,
              background: '#f5f5f5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              margin: '0 auto 16px'
            }}>
              👤
            </div>
            <h1 style={{ 
              fontSize: 24, 
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: 8
            }}>
              {organizer?.name || 'Quelqu un'} t invite a jouer !
            </h1>
            <p style={{ color: '#666', fontSize: 15 }}>
              Rejoins cette partie de padel
            </p>
          </div>

          {/* Details de la partie */}
          <div style={{
            background: '#fafafa',
            borderRadius: 16,
            padding: 24,
            marginBottom: 28
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 24 }}>📅</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a' }}>
                  {formatDate(match?.match_date)}
                </div>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: '700', 
                  color: '#2e7d32' 
                }}>
                  {formatTime(match?.match_time)}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 24 }}>📍</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {match?.clubs?.name}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  {match?.clubs?.address}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 24 }}>👥</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {match?.spots_total - match?.spots_available}/{match?.spots_total} joueurs
                </div>
                <div style={{ fontSize: 14, color: '#2e7d32' }}>
                  {match?.spots_available} place{match?.spots_available > 1 ? 's' : ''} restante{match?.spots_available > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {match?.ambiance && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ fontSize: 24 }}>🎯</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                    Ambiance recherchee
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    {ambianceLabels[match.ambiance] || match.ambiance}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Joueurs inscrits avec leur profil */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: '#999',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Qui joue ?
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {/* Organisateur */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f5f5f5',
                padding: '12px 16px',
                borderRadius: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: '#1a1a1a',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: 14 }}>
                      {organizer?.name} ⭐
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {experienceLabels[organizer?.experience]} · {ambianceLabels[organizer?.ambiance]}
                    </div>
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
                    justifyContent: 'space-between',
                    background: '#f5f5f5',
                    padding: '12px 16px',
                    borderRadius: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      background: '#e5e5e5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: 14 }}>
                        {p.profiles?.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {experienceLabels[p.profiles?.experience]} · {ambianceLabels[p.profiles?.ambiance]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Place pour toi */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#e8f5e9',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px dashed #2e7d32'
              }}>
                <span style={{ fontWeight: '600', fontSize: 14, color: '#2e7d32' }}>
                  + Toi ?
                </span>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 14,
              marginBottom: 20,
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {/* Formulaire ou bouton selon connexion */}
          {user ? (
            <div>
              <div style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 12,
                marginBottom: 16
              }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                  Connecte en tant que
                </div>
                <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
                  {userProfile?.name || user.email}
                </div>
                {userProfile && (
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {experienceLabels[userProfile.experience]} · {ambianceLabels[userProfile.ambiance]}
                  </div>
                )}
              </div>
              <button
                onClick={handleJoinAsConnectedUser}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: submitting ? '#e5e5e5' : '#2e7d32',
                  color: submitting ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Inscription...' : 'Confirmer ma participation'}
              </button>
            </div>
          ) : (
            <div>
              {/* Toggle inscription/connexion */}
              <div style={{
                display: 'flex',
                background: '#f5f5f5',
                borderRadius: 10,
                padding: 4,
                marginBottom: 24
              }}>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError('') }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: mode === 'signup' ? '#fff' : 'transparent',
                    color: mode === 'signup' ? '#1a1a1a' : '#666',
                    boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Creer un compte
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: mode === 'login' ? '#fff' : 'transparent',
                    color: mode === 'login' ? '#1a1a1a' : '#666',
                    boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  J ai un compte
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        display: 'block', 
                        marginBottom: 6 
                      }}>
                        Prenom
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ton prenom"
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '2px solid #e5e5e5',
                          borderRadius: 12,
                          fontSize: 16,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Niveau */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        display: 'block', 
                        marginBottom: 8 
                      }}>
                        Ton niveau *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {experienceOptions.map(opt => (
                          <div
                            key={opt.id}
                            onClick={() => setExperience(opt.id)}
                            style={{
                              padding: '12px',
                              border: experience === opt.id 
                                ? '2px solid #2e7d32' 
                                : '2px solid #e5e5e5',
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: experience === opt.id ? '#e8f5e9' : '#fff',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                            <div style={{ fontSize: 13, fontWeight: '600', color: '#1a1a1a' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {opt.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ambiance */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        display: 'block', 
                        marginBottom: 8 
                      }}>
                        Ton ambiance *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {ambianceOptions.map(opt => (
                          <div
                            key={opt.id}
                            onClick={() => setAmbiance(opt.id)}
                            style={{
                              padding: '12px 8px',
                              border: ambiance === opt.id 
                                ? '2px solid #2e7d32' 
                                : '2px solid #e5e5e5',
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: ambiance === opt.id ? '#e8f5e9' : '#fff',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                            <div style={{ fontSize: 12, fontWeight: '600', color: '#1a1a1a' }}>
                              {opt.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    display: 'block', 
                    marginBottom: 6 
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    display: 'block', 
                    marginBottom: 6 
                  }}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }}
                  />
                  {mode === 'signup' && (
                    <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                      Minimum 6 caracteres
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || (mode === 'signup' && (!experience || !ambiance))}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: submitting || (mode === 'signup' && (!experience || !ambiance)) ? '#e5e5e5' : '#2e7d32',
                    color: submitting || (mode === 'signup' && (!experience || !ambiance)) ? '#999' : '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: submitting || (mode === 'signup' && (!experience || !ambiance)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting 
                    ? 'Inscription...' 
                    : mode === 'signup'
                      ? 'Rejoindre la partie'
                      : 'Me connecter et rejoindre'
                  }
                </button>
              </form>
            </div>
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