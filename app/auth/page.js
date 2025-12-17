'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

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

        <div style={{
          display: 'flex',
          background: '#f5f5f5',
          borderRadius: 12,
          padding: 4,
          marginBottom: 32
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

        <p style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 28 }}>
          {mode === 'login' ? 'Content de te revoir !' : 'Rejoins les joueurs de Metz'}
        </p>

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