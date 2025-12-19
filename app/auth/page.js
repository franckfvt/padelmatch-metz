'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Sauvegarder l'URL de redirection
    if (redirectUrl) {
      sessionStorage.setItem('redirectAfterLogin', redirectUrl)
    }
    checkSession()
  }, [redirectUrl])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, level')
        .eq('id', session.user.id)
        .single()
      
      // Récupérer la redirection
      const redirect = sessionStorage.getItem('redirectAfterLogin')
      
      if (profile?.name && profile?.level) {
        // Profil complet
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      } else {
        // Profil incomplet → onboarding
        // Transférer la redirection vers après l'onboarding
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          sessionStorage.setItem('redirectAfterOnboarding', redirect)
        }
        router.push('/onboarding')
      }
    } else {
      setCheckingSession(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })
        
        if (error) throw error
        
        // Transférer la redirection vers onboarding
        const redirect = sessionStorage.getItem('redirectAfterLogin')
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          sessionStorage.setItem('redirectAfterOnboarding', redirect)
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
          .select('name, level')
          .eq('id', data.user.id)
          .single()
        
        // Récupérer la redirection
        const redirect = sessionStorage.getItem('redirectAfterLogin')
        
        if (profile?.name && profile?.level) {
          if (redirect) {
            sessionStorage.removeItem('redirectAfterLogin')
            router.push(redirect)
          } else {
            router.push('/dashboard')
          }
        } else {
          // Transférer vers onboarding
          if (redirect) {
            sessionStorage.removeItem('redirectAfterLogin')
            sessionStorage.setItem('redirectAfterOnboarding', redirect)
          }
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
        
        {/* Message de redirection */}
        {redirectUrl && (
          <div style={{
            background: '#eff6ff',
            color: '#1e40af',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Connecte-toi pour rejoindre la partie
          </div>
        )}
        
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
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                display: 'block', 
                marginBottom: 8,
                color: '#1a1a1a'
              }}>
                Prénom
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
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              display: 'block', 
              marginBottom: 8,
              color: '#1a1a1a'
            }}>
              Email
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
              Mot de passe
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

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48 }}>🎾</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}