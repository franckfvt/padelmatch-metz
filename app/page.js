'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PadelMatchApp() {
  // États de l'application
  const [screen, setScreen] = useState('loading')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [clubs, setClubs] = useState([])
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('play')
  
  // États des formulaires
  const [authMode, setAuthMode] = useState('login') // 'login' ou 'signup'
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  // État création de partie
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    spots: 3,
    ambiance: 'mix'
  })
  
  // État profil onboarding
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [profileData, setProfileData] = useState({
    name: '',
    experience: '',
    frequency: '',
    ambiance: '',
    bio: ''
  })

  const [selectedMatch, setSelectedMatch] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [currentCity] = useState('Metz')

  // ============ STYLES ============
  const styles = {
    app: {
      maxWidth: 430,
      margin: '0 auto',
      background: '#fff',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      color: '#1a1a1a'
    },
    header: {
      padding: '16px 20px',
      fontWeight: '700',
      fontSize: 17,
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    content: {
      padding: 20,
      paddingBottom: 100
    },
    btn: {
      width: '100%',
      padding: 16,
      background: '#1a1a1a',
      color: '#fff',
      border: 'none',
      borderRadius: 12,
      fontSize: 15,
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: 12
    },
    btnOutline: {
      width: '100%',
      padding: 16,
      background: '#fff',
      color: '#1a1a1a',
      border: '2px solid #1a1a1a',
      borderRadius: 12,
      fontSize: 15,
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: 12
    },
    btnSecondary: {
      width: '100%',
      padding: 16,
      background: '#f5f5f5',
      color: '#1a1a1a',
      border: 'none',
      borderRadius: 12,
      fontSize: 15,
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: 12
    },
    btnDisabled: {
      width: '100%',
      padding: 16,
      background: '#e5e5e5',
      color: '#999',
      border: 'none',
      borderRadius: 12,
      fontSize: 15,
      fontWeight: '600',
      cursor: 'not-allowed',
      marginBottom: 12
    },
    input: {
      width: '100%',
      padding: 14,
      border: '1.5px solid #e5e5e5',
      borderRadius: 10,
      fontSize: 15,
      marginBottom: 12,
      boxSizing: 'border-box',
      outline: 'none'
    },
    card: {
      border: '1.5px solid #e5e5e5',
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      background: '#fff'
    },
    actionCard: {
      border: '1.5px solid #e5e5e5',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    },
    actionCardIcon: {
      width: 50,
      height: 50,
      background: '#f5f5f5',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24
    },
    badge: {
      display: 'inline-block',
      background: '#e8f5e9',
      color: '#2e7d32',
      padding: '5px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: '600'
    },
    badgeGray: {
      display: 'inline-block',
      background: '#f5f5f5',
      color: '#666',
      padding: '5px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: '500'
    },
    nav: {
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: '#fff',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0 25px',
      zIndex: 50
    },
    navItem: {
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '500',
      cursor: 'pointer',
      opacity: 0.4
    },
    navItemActive: {
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '600',
      cursor: 'pointer',
      opacity: 1
    },
    avatar: {
      width: 44,
      height: 44,
      background: '#f0f0f0',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20
    },
    avatarSmall: {
      width: 36,
      height: 36,
      background: '#f0f0f0',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#999',
      marginTop: 24,
      marginBottom: 12,
      letterSpacing: 0.5,
      textTransform: 'uppercase'
    },
    flex: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    },
    greeting: {
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 6
    },
    chip: {
      padding: '10px 16px',
      border: '1.5px solid #e5e5e5',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: '500',
      cursor: 'pointer',
      background: '#fff'
    },
    chipSelected: {
      padding: '10px 16px',
      border: '1.5px solid #1a1a1a',
      borderRadius: 20,
      fontSize: 13,
      fontWeight: '600',
      cursor: 'pointer',
      background: '#1a1a1a',
      color: '#fff'
    },
    optionCard: {
      border: '1.5px solid #e5e5e5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      cursor: 'pointer'
    },
    optionCardSelected: {
      border: '2px solid #1a1a1a',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      cursor: 'pointer',
      background: '#fafafa'
    },
    error: {
      background: '#fee',
      color: '#c00',
      padding: 12,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 12
    },
    chatBubble: {
      background: '#f0f0f0',
      padding: '10px 14px',
      borderRadius: 16,
      fontSize: 14,
      marginBottom: 8,
      maxWidth: '75%'
    },
    chatBubbleMine: {
      background: '#1a1a1a',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: 16,
      fontSize: 14,
      marginBottom: 8,
      maxWidth: '75%',
      marginLeft: 'auto'
    }
  }

  // ============ EFFETS ============
  
  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setScreen('auth')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  // Charger les clubs et parties quand l'utilisateur est connecté
  useEffect(() => {
    if (user && profile) {
      loadClubs()
      loadMatches()
    }
  }, [user, profile])

  // ============ FONCTIONS ============

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id)
      } else {
        setScreen('auth')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setScreen('auth')
    }
  }

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        // Si le profil n'est pas complet, aller à l'onboarding
        if (!data.experience || !data.ambiance) {
          setScreen('onboarding')
        } else {
          setScreen('home')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setScreen('onboarding')
    }
  }

  async function loadClubs() {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      if (error) throw error
      setClubs(data || [])
    } catch (error) {
      console.error('Error loading clubs:', error)
    }
  }

  async function loadMatches() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (
            user_id,
            profiles (name)
          )
        `)
        .eq('status', 'open')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  async function handleSignUp() {
    setAuthLoading(true)
    setAuthError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: { name: authName }
        }
      })

      if (error) throw error

      if (data.user) {
        setProfileData({ ...profileData, name: authName })
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin() {
    setAuthLoading(true)
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      })

      if (error) throw error
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setScreen('auth')
  }

  async function updateProfile(updates) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }

  async function createMatch() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: parseInt(newMatch.club_id),
          match_date: newMatch.date,
          match_time: newMatch.time,
          spots_total: 4,
          spots_available: newMatch.spots,
          ambiance: newMatch.ambiance,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter l'organisateur comme participant
      await supabase.from('match_participants').insert({
        match_id: data.id,
        user_id: user.id,
        status: 'confirmed'
      })

      await loadMatches()
      setScreen('matchCreated')
      setNewMatch({ club_id: '', date: '', time: '', spots: 3, ambiance: 'mix' })
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création de la partie')
    }
  }

  async function joinMatch(matchId) {
    try {
      // Ajouter le participant
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) throw error

      // Mettre à jour le nombre de places
      const match = matches.find(m => m.id === matchId)
      if (match) {
        await supabase
          .from('matches')
          .update({ 
            spots_available: match.spots_available - 1,
            status: match.spots_available - 1 === 0 ? 'full' : 'open'
          })
          .eq('id', matchId)
      }

      await loadMatches()
      setScreen('home')
      alert('Tu as rejoint la partie !')
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Erreur lors de l\'inscription')
    }
  }

  async function loadChatMessages(matchId) {
    try {
      const { data, error } = await supabase
        .from('match_messages')
        .select(`
          *,
          profiles (name)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setChatMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedMatch) return

    try {
      const { error } = await supabase
        .from('match_messages')
        .insert({
          match_id: selectedMatch.id,
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      await loadChatMessages(selectedMatch.id)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // ============ ÉCRANS ============

  // Loading
  const LoadingScreen = () => (
    <div style={{ ...styles.content, textAlign: 'center', paddingTop: 100 }}>
      <div style={{ fontSize: 40, marginBottom: 20 }}>🎾</div>
      <div style={{ fontSize: 18, fontWeight: '600' }}>PadelMatch</div>
      <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Chargement...</div>
    </div>
  )

  // Auth (Login / Signup)
  const AuthScreen = () => (
    <div style={styles.content}>
      <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 40 }}>
        <div style={{ fontSize: 50, marginBottom: 16 }}>🎾</div>
        <h1 style={{ fontSize: 28, fontWeight: '700', marginBottom: 8 }}>PadelMatch</h1>
        <p style={{ color: '#666', fontSize: 15 }}>Trouve des joueurs à Metz</p>
      </div>

      {authError && <div style={styles.error}>{authError}</div>}

      {authMode === 'signup' && (
        <>
          <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Prénom</label>
          <input
            style={styles.input}
            placeholder="Ton prénom"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
          />
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Email</label>
      <input
        style={styles.input}
        type="email"
        placeholder="ton@email.com"
        value={authEmail}
        onChange={(e) => setAuthEmail(e.target.value)}
      />

      <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Mot de passe</label>
      <input
        style={styles.input}
        type="password"
        placeholder="••••••••"
        value={authPassword}
        onChange={(e) => setAuthPassword(e.target.value)}
      />

      <button
        style={authLoading ? styles.btnDisabled : styles.btn}
        onClick={authMode === 'login' ? handleLogin : handleSignUp}
        disabled={authLoading}
      >
        {authLoading ? 'Chargement...' : authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
      </button>

      <button
        style={styles.btnSecondary}
        onClick={() => {
          setAuthMode(authMode === 'login' ? 'signup' : 'login')
          setAuthError('')
        }}
      >
        {authMode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  )

  // Onboarding
  const OnboardingScreen = () => (
    <div style={styles.content}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {[1, 2, 3].map(step => (
            <div
              key={step}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: onboardingStep >= step ? '#1a1a1a' : '#e5e5e5'
              }}
            />
          ))}
        </div>

        {onboardingStep === 1 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Tu joues depuis combien de temps ?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Ça nous aide à trouver des joueurs de ton niveau</p>

            {[
              { id: 'less6months', label: 'Moins de 6 mois', desc: 'Je découvre' },
              { id: '6months2years', label: '6 mois - 2 ans', desc: 'Je progresse' },
              { id: '2to5years', label: '2 - 5 ans', desc: 'Je maîtrise' },
              { id: 'more5years', label: 'Plus de 5 ans', desc: 'Expert' }
            ].map(opt => (
              <div
                key={opt.id}
                style={profileData.experience === opt.id ? styles.optionCardSelected : styles.optionCard}
                onClick={() => setProfileData({ ...profileData, experience: opt.id })}
              >
                <div style={{ fontWeight: '600' }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{opt.desc}</div>
              </div>
            ))}

            <button
              style={profileData.experience ? styles.btn : styles.btnDisabled}
              onClick={() => profileData.experience && setOnboardingStep(2)}
              disabled={!profileData.experience}
            >
              Continuer
            </button>
          </>
        )}

        {onboardingStep === 2 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Tu joues à quelle fréquence ?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Pour te proposer le bon nombre de parties</p>

            {[
              { id: 'occasional', label: 'Occasionnellement', desc: '1-2 fois par mois' },
              { id: 'regular', label: 'Régulièrement', desc: '1 fois par semaine' },
              { id: 'often', label: 'Souvent', desc: '2-3 fois par semaine' },
              { id: 'intense', label: 'Intensément', desc: '4+ fois par semaine' }
            ].map(opt => (
              <div
                key={opt.id}
                style={profileData.frequency === opt.id ? styles.optionCardSelected : styles.optionCard}
                onClick={() => setProfileData({ ...profileData, frequency: opt.id })}
              >
                <div style={{ fontWeight: '600' }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{opt.desc}</div>
              </div>
            ))}

            <button
              style={profileData.frequency ? styles.btn : styles.btnDisabled}
              onClick={() => profileData.frequency && setOnboardingStep(3)}
              disabled={!profileData.frequency}
            >
              Continuer
            </button>
          </>
        )}

        {onboardingStep === 3 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Qu'est-ce que tu recherches ?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>On te matche avec des joueurs qui veulent la même chose</p>

            {[
              { id: 'loisir', label: '😎 Détente', desc: 'Fun, sans prise de tête' },
              { id: 'mix', label: '⚡ Équilibré', desc: 'Fun mais on joue bien' },
              { id: 'compet', label: '🏆 Compétitif', desc: 'On est là pour gagner' }
            ].map(opt => (
              <div
                key={opt.id}
                style={profileData.ambiance === opt.id ? styles.optionCardSelected : styles.optionCard}
                onClick={() => setProfileData({ ...profileData, ambiance: opt.id })}
              >
                <div style={{ fontWeight: '600' }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{opt.desc}</div>
              </div>
            ))}

            <button
              style={profileData.ambiance ? styles.btn : styles.btnDisabled}
              onClick={async () => {
                if (profileData.ambiance) {
                  const success = await updateProfile({
                    name: profileData.name || profile?.name,
                    experience: profileData.experience,
                    frequency: profileData.frequency,
                    ambiance: profileData.ambiance
                  })
                  if (success) {
                    setScreen('home')
                  }
                }
              }}
              disabled={!profileData.ambiance}
            >
              C'est parti ! 🎾
            </button>
          </>
        )}
      </div>
    </div>
  )

  // Home
  const HomeScreen = () => (
    <>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📍</span>
          <span style={{ fontWeight: '600' }}>{currentCity}</span>
        </div>
        <div
          style={{ ...styles.avatarSmall, width: 36, height: 36, cursor: 'pointer' }}
          onClick={() => { setTab('profile'); setScreen('profile') }}
        >
          👤
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.greeting}>Salut {profile?.name?.split(' ')[0] || 'toi'} 👋</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Prêt à jouer ?</div>

        <div
          style={styles.actionCard}
          onClick={() => setScreen('createMatch')}
        >
          <div style={styles.actionCardIcon}>🎾</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: 15, marginBottom: 2 }}>J'ai un terrain</div>
            <div style={{ fontSize: 13, color: '#666' }}>Je cherche des joueurs</div>
          </div>
        </div>

        <div
          style={styles.actionCard}
          onClick={() => setScreen('searchMatch')}
        >
          <div style={styles.actionCardIcon}>🔍</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: 15, marginBottom: 2 }}>Je cherche une partie</div>
            <div style={{ fontSize: 13, color: '#666' }}>Trouvez-moi des joueurs</div>
          </div>
        </div>

        {matches.length > 0 && (
          <>
            <div style={styles.sectionTitle}>Parties à venir ({matches.length})</div>
            {matches.map(match => (
              <div
                key={match.id}
                style={{ ...styles.card, cursor: 'pointer' }}
                onClick={() => { setSelectedMatch(match); setScreen('matchDetail') }}
              >
                <div style={styles.flex}>
                  <div style={styles.avatarSmall}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 14 }}>
                      {match.profiles?.name || 'Joueur'} cherche {match.spots_available} joueur{match.spots_available > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} à {match.match_time?.slice(0, 5)} · {match.clubs?.name}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <span style={styles.badge}>✓ Ouvert</span>
                  <span style={styles.badgeGray}>
                    {match.ambiance === 'compet' ? '🏆 Compétitif' : match.ambiance === 'loisir' ? '😎 Détente' : '⚡ Équilibré'}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {matches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😴</div>
            <div style={{ fontWeight: '600', marginBottom: 4 }}>Pas de parties pour l'instant</div>
            <div style={{ fontSize: 13 }}>Crée la première !</div>
          </div>
        )}
      </div>

      <NavBar />
    </>
  )

  // Create Match
  const CreateMatchScreen = () => (
    <>
      <div style={styles.header}>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setScreen('home')}>←</button>
        <span>Nouvelle partie</span>
      </div>
      <div style={styles.content}>
        <h2 style={{ fontSize: 20, fontWeight: '700', marginBottom: 4 }}>Crée ta partie</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Les joueurs de Metz seront notifiés</p>

        <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Club</label>
        <select
          style={styles.input}
          value={newMatch.club_id}
          onChange={(e) => setNewMatch({ ...newMatch, club_id: e.target.value })}
        >
          <option value="">Sélectionner un club</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>{club.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={newMatch.date}
              onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 }}>Heure</label>
            <input
              style={styles.input}
              type="time"
              value={newMatch.time}
              onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
            />
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 10 }}>Joueurs recherchés</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[1, 2, 3].map(n => (
            <div
              key={n}
              onClick={() => setNewMatch({ ...newMatch, spots: n })}
              style={{
                flex: 1,
                padding: 16,
                textAlign: 'center',
                borderRadius: 12,
                cursor: 'pointer',
                border: newMatch.spots === n ? '2px solid #1a1a1a' : '1.5px solid #e5e5e5',
                fontWeight: newMatch.spots === n ? '700' : '500',
                background: newMatch.spots === n ? '#fafafa' : '#fff'
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{n}</div>
              <div style={{ fontSize: 11, color: '#666' }}>joueur{n > 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>

        <label style={{ fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 10 }}>Ambiance</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { id: 'loisir', label: '😎 Détente' },
            { id: 'mix', label: '⚡ Équilibré' },
            { id: 'compet', label: '🏆 Compétitif' }
          ].map(amb => (
            <div
              key={amb.id}
              style={newMatch.ambiance === amb.id ? styles.chipSelected : styles.chip}
              onClick={() => setNewMatch({ ...newMatch, ambiance: amb.id })}
            >
              {amb.label}
            </div>
          ))}
        </div>

        <button
          style={newMatch.club_id && newMatch.date && newMatch.time ? styles.btn : styles.btnDisabled}
          onClick={createMatch}
          disabled={!newMatch.club_id || !newMatch.date || !newMatch.time}
        >
          Publier la partie
        </button>
      </div>
    </>
  )

  // Match Created
  const MatchCreatedScreen = () => (
    <div style={{ ...styles.content, textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Partie créée !</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>
        Les joueurs de Metz vont pouvoir la voir et te rejoindre.
      </p>
      <button style={styles.btn} onClick={() => setScreen('home')}>
        Retour à l'accueil
      </button>
    </div>
  )

  // Search Match
  const SearchMatchScreen = () => (
    <>
      <div style={styles.header}>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setScreen('home')}>←</button>
        <span>Parties disponibles</span>
      </div>
      <div style={styles.content}>
        {matches.length > 0 ? (
          <>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              {matches.length} partie{matches.length > 1 ? 's' : ''} ouverte{matches.length > 1 ? 's' : ''} à Metz
            </p>
            {matches.map(match => (
              <div
                key={match.id}
                style={{ ...styles.card, cursor: 'pointer' }}
                onClick={() => { setSelectedMatch(match); setScreen('matchDetail') }}
              >
                <div style={styles.flex}>
                  <div style={styles.avatarSmall}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 14 }}>
                      {match.profiles?.name || 'Joueur'} cherche {match.spots_available} joueur{match.spots_available > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {new Date(match.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} à {match.match_time?.slice(0, 5)}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>{match.clubs?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <span style={styles.badge}>{match.spots_available} place{match.spots_available > 1 ? 's' : ''}</span>
                  <span style={styles.badgeGray}>
                    {match.ambiance === 'compet' ? '🏆 Compétitif' : match.ambiance === 'loisir' ? '😎 Détente' : '⚡ Équilibré'}
                  </span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: '600', marginBottom: 8 }}>Aucune partie pour l'instant</div>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
              Sois le premier à créer une partie à Metz !
            </p>
            <button style={styles.btn} onClick={() => setScreen('createMatch')}>
              Créer une partie
            </button>
          </div>
        )}
      </div>
      <NavBar />
    </>
  )

  // Match Detail
  const MatchDetailScreen = () => {
    const isOrganizer = selectedMatch?.organizer_id === user?.id
    const isParticipant = selectedMatch?.match_participants?.some(p => p.user_id === user?.id)

    return (
      <>
        <div style={styles.header}>
          <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setScreen('home')}>←</button>
          <span>Détail partie</span>
        </div>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: '700' }}>
              {new Date(selectedMatch?.match_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 20, fontWeight: '700', margin: '8px 0' }}>
              {selectedMatch?.match_time?.slice(0, 5)}
            </div>
            <div style={{ fontSize: 14, color: '#666' }}>{selectedMatch?.clubs?.name}</div>
          </div>

          <div style={styles.sectionTitle}>
            Joueurs ({(selectedMatch?.match_participants?.length || 0) + 1}/{selectedMatch?.spots_total || 4})
          </div>

          {/* Organisateur */}
          <div style={{ ...styles.card, ...styles.flex }}>
            <div style={styles.avatarSmall}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: 14 }}>{selectedMatch?.profiles?.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Organisateur</div>
            </div>
          </div>

          {/* Participants */}
          {selectedMatch?.match_participants?.map((p, i) => (
            <div key={i} style={{ ...styles.card, ...styles.flex }}>
              <div style={styles.avatarSmall}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: 14 }}>{p.profiles?.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>Confirmé</div>
              </div>
            </div>
          ))}

          {/* Places disponibles */}
          {selectedMatch?.spots_available > 0 && (
            <div style={{ ...styles.card, border: '1.5px dashed #ccc', textAlign: 'center', color: '#999' }}>
              {selectedMatch.spots_available} place{selectedMatch.spots_available > 1 ? 's' : ''} disponible{selectedMatch.spots_available > 1 ? 's' : ''}
            </div>
          )}

          {!isOrganizer && !isParticipant && selectedMatch?.spots_available > 0 && (
            <button style={{ ...styles.btn, marginTop: 20 }} onClick={() => joinMatch(selectedMatch.id)}>
              Rejoindre cette partie
            </button>
          )}

          {(isOrganizer || isParticipant) && (
            <button
              style={{ ...styles.btnOutline, marginTop: 20 }}
              onClick={() => {
                loadChatMessages(selectedMatch.id)
                setScreen('chat')
              }}
            >
              💬 Ouvrir le chat
            </button>
          )}
        </div>
      </>
    )
  }

  // Chat
  const ChatScreen = () => (
    <>
      <div style={styles.header}>
        <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setScreen('matchDetail')}>←</button>
        <span>Chat de la partie</span>
      </div>
      <div style={{ padding: 20, paddingBottom: 140 }}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <div style={{ fontSize: 13 }}>Aucun message pour l'instant</div>
            <div style={{ fontSize: 13 }}>Dis bonjour ! 👋</div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          msg.user_id === user?.id ? (
            <div key={i} style={styles.chatBubbleMine}>{msg.message}</div>
          ) : (
            <div key={i} style={styles.flex}>
              <div style={styles.avatarSmall}>👤</div>
              <div style={styles.chatBubble}>
                <div style={{ fontSize: 11, fontWeight: '600', marginBottom: 2 }}>{msg.profiles?.name}</div>
                {msg.message}
              </div>
            </div>
          )
        ))}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        padding: 16,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            style={{ ...styles.input, flex: 1, marginBottom: 0 }}
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onClick={sendMessage}
          >
            →
          </button>
        </div>
      </div>
    </>
  )

  // Clubs
  const ClubsScreen = () => (
    <>
      <div style={styles.header}>Clubs à Metz</div>
      <div style={styles.content}>
        {clubs.map(club => {
          const clubMatches = matches.filter(m => m.club_id === club.id)
          return (
            <div key={club.id} style={styles.card}>
              <div style={{ fontWeight: '700', fontSize: 15 }}>{club.name}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{club.address}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{club.courts} terrains</div>

              {clubMatches.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: '600' }}>
                    🎾 {clubMatches.length} partie{clubMatches.length > 1 ? 's' : ''} prévue{clubMatches.length > 1 ? 's' : ''}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={styles.badgeGray}>{club.active_players} joueurs actifs</span>
                {club.booking_url && (
                  <a href={club.booking_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: '600' }}>
                    Réserver →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <NavBar />
    </>
  )

  // Profile
  const ProfileScreen = () => (
    <>
      <div style={styles.content}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ ...styles.avatar, width: 80, height: 80, margin: '0 auto 12px', fontSize: 32 }}>👤</div>
          <div style={{ fontWeight: '700', fontSize: 20 }}>{profile?.name}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{currentCity}</div>
        </div>

        <div style={{ ...styles.card, background: '#f9f9f9' }}>
          <div style={{ fontWeight: '600', marginBottom: 8 }}>Mon profil</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
            📧 {user?.email}<br />
            🎾 {profile?.experience === 'less6months' ? 'Débutant' : profile?.experience === '6months2years' ? 'Intermédiaire' : profile?.experience === '2to5years' ? 'Confirmé' : 'Expert'}<br />
            🎯 {profile?.ambiance === 'loisir' ? 'Détente' : profile?.ambiance === 'compet' ? 'Compétitif' : 'Équilibré'}
          </div>
        </div>

        <button style={{ ...styles.btnOutline, marginTop: 24 }} onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
      <NavBar />
    </>
  )

  // NavBar
  const NavBar = () => (
    <div style={styles.nav}>
      {[
        { id: 'play', icon: '🎾', label: 'Jouer', screen: 'home' },
        { id: 'clubs', icon: '📍', label: 'Clubs', screen: 'clubs' },
        { id: 'profile', icon: '👤', label: 'Profil', screen: 'profile' }
      ].map(item => (
        <div
          key={item.id}
          style={tab === item.id ? styles.navItemActive : styles.navItem}
          onClick={() => { setTab(item.id); setScreen(item.screen) }}
        >
          <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
          {item.label}
        </div>
      ))}
    </div>
  )

  // Router
  const renderScreen = () => {
    switch (screen) {
      case 'loading': return <LoadingScreen />
      case 'auth': return <AuthScreen />
      case 'onboarding': return <OnboardingScreen />
      case 'home': return <HomeScreen />
      case 'createMatch': return <CreateMatchScreen />
      case 'matchCreated': return <MatchCreatedScreen />
      case 'searchMatch': return <SearchMatchScreen />
      case 'matchDetail': return <MatchDetailScreen />
      case 'chat': return <ChatScreen />
      case 'clubs': return <ClubsScreen />
      case 'profile': return <ProfileScreen />
      default: return <HomeScreen />
    }
  }

  return (
    <div style={styles.app}>
      {renderScreen()}
    </div>
  )
}