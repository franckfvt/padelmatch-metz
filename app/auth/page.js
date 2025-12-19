'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showPhoneInfo, setShowPhoneInfo] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience, ambiance')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.experience && profile?.ambiance) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  // Formater le téléphone français
  function formatPhone(value) {
    // Retirer tout ce qui n'est pas un chiffre
    const numbers = value.replace(/\D/g, '')
    
    // Formater en XX XX XX XX XX
    let formatted = ''
    for (let i = 0; i < numbers.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' '
      formatted += numbers[i]
    }
    return formatted
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        // Formater le téléphone pour le stockage (sans espaces, avec +33)
        let formattedPhone = null
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '')
          if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
            formattedPhone = '+33' + cleanPhone.substring(1)
          } else if (cleanPhone.length === 9) {
            formattedPhone = '+33' + cleanPhone
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name,
              last_name: lastName,
              phone: formattedPhone
            }
          }
        })
        
        if (error) throw error

        // Mettre à jour le profil avec le nom et téléphone
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ 
              last_name: lastName,
              phone: formattedPhone 
            })
            .eq('id', data.user.id)
        }

        router.push('/onboarding')
        
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience, ambiance')
          .eq('id', data.user.id)
          .single()
        
        if (profile?.experience && profile?.ambiance) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (error.message.includes('User already registered')) {
        setError('Un compte existe déjà avec cet email')
      } else if (error.message.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
      } else if (error.message.includes('Invalid email')) {
        setError('Adresse email invalide')
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Google login error:', error)
      setError('Erreur lors de la connexion avec Google')
    }
  }

  if (checkingSession) {
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
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

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
        padding: '48px 40px',
        borderRadius: 24,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
            <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
              PadelMatch
            </h1>
          </div>
        </Link>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '16px',
            background: '#fff',
            color: '#1a1a1a',
            border: '2px solid #e5e5e5',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 16
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        {/* Séparateur */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span style={{ color: '#999', fontSize: 13 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>

        {/* Toggle connexion/inscription */}
        <div style={{
          display: 'flex',
          background: '#f5f5f5',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: '600',
              cursor: 'pointer',
              background: mode === 'login' ? '#fff' : 'transparent',
              color: mode === 'login' ? '#1a1a1a' : '#888',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError('') }}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: '600',
              cursor: 'pointer',
              background: mode === 'signup' ? '#fff' : 'transparent',
              color: mode === 'signup' ? '#1a1a1a' : '#888',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            S'inscrire
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          
          {mode === 'signup' && (
            <>
              {/* Prénom */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: 8,
                  color: '#1a1a1a'
                }}>
                  Prénom *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton prénom"
                  required
                  autoComplete="given-name"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Nom de famille */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: 8,
                  color: '#1a1a1a'
                }}>
                  Nom *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ton nom de famille"
                  required
                  autoComplete="family-name"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 16,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Téléphone (optionnel) */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <label style={{ 
                    fontSize: 14, 
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>
                    Téléphone
                  </label>
                  <span style={{ 
                    fontSize: 11, 
                    color: '#999',
                    background: '#f5f5f5',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    optionnel
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPhoneInfo(!showPhoneInfo)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2e7d32',
                      fontSize: 12,
                      cursor: 'pointer',
                      marginLeft: 'auto',
                      textDecoration: 'underline'
                    }}
                  >
                    Pourquoi ?
                  </button>
                </div>
                
                {showPhoneInfo && (
                  <div style={{
                    background: '#e8f5e9',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    fontSize: 13,
                    color: '#2e7d32',
                    lineHeight: 1.5
                  }}>
                    <strong>📱 À quoi ça sert ?</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                      <li>Recevoir un rappel avant tes parties</li>
                      <li>Être notifié si un joueur se désiste</li>
                      <li>Permettre aux organisateurs de te contacter en cas d'urgence</li>
                    </ul>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                      Ton numéro reste privé et n'est jamais affiché publiquement.
                    </div>
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666',
                    fontSize: 16
                  }}>
                    🇫🇷
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                    style={{
                      width: '100%',
                      padding: '16px',
                      paddingLeft: 48,
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      letterSpacing: 1
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              display: 'block', 
              marginBottom: 8,
              color: '#1a1a1a'
            }}>
              Email {mode === 'signup' && '*'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e5e5',
                borderRadius: 12,
                fontSize: 16,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              display: 'block', 
              marginBottom: 8,
              color: '#1a1a1a'
            }}>
              Mot de passe {mode === 'signup' && '*'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e5e5',
                borderRadius: 12,
                fontSize: 16,
                boxSizing: 'border-box'
              }}
            />
            {mode === 'signup' && (
              <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                Minimum 6 caractères
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading ? '#ccc' : '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading 
              ? 'Chargement...' 
              : mode === 'login' 
                ? 'Se connecter' 
                : 'Créer mon compte'
            }
          </button>
        </form>

        {mode === 'signup' && (
          <p style={{ fontSize: 13, color: '#999', textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
            En t'inscrivant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: 28,
          paddingTop: 24,
          borderTop: '1px solid #eee'
        }}>
          <Link href="/" style={{ color: '#666', fontSize: 14, textDecoration: 'none' }}>
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}