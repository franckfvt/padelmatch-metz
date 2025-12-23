'use client'

/**
 * AUTH PAGE - JUNTO BRAND
 * LOGIQUE 100% IDENTIQUE - SEULS LES STYLES CHANGENT
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {FOUR_DOTS.colors.map((color, i) => (
        <div key={i} className="junto-dot" style={{ width: size, height: size, borderRadius: '50%', background: color }} />
      ))}
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {FOUR_DOTS.colors.map((color, i) => (<div key={i} className="junto-loading-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />))}
        </div>
        <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
      </div>
    </div>
  )
}

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
        const { data: profile } = await supabase.from('profiles').select('experience, ambiance').eq('id', session.user.id).single()
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
        if (profile?.experience && profile?.ambiance) {
          if (redirectUrl) { sessionStorage.removeItem('redirectAfterLogin'); router.push(redirectUrl) }
          else { router.push('/dashboard') }
        } else { router.push('/onboarding') }
      } else { setCheckingSession(false) }
    }
    checkSession()
  }, [router])

  function formatPhone(value) {
    const numbers = value.replace(/\D/g, '')
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
        let formattedPhone = null
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '')
          if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) formattedPhone = '+33' + cleanPhone.substring(1)
          else if (cleanPhone.length === 9) formattedPhone = '+33' + cleanPhone
        }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, last_name: lastName, phone: formattedPhone } } })
        if (error) throw error
        if (data.user) await supabase.from('profiles').update({ last_name: lastName, phone: formattedPhone }).eq('id', data.user.id)
        router.push('/onboarding')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data: profile } = await supabase.from('profiles').select('experience, ambiance').eq('id', data.user.id).single()
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
        if (profile?.experience && profile?.ambiance) {
          if (redirectUrl) { sessionStorage.removeItem('redirectAfterLogin'); router.push(redirectUrl) }
          else { router.push('/dashboard') }
        } else { router.push('/onboarding') }
      }
    } catch (error) {
      console.error('Auth error:', error)
      if (error.message.includes('Invalid login credentials')) setError('Email ou mot de passe incorrect')
      else if (error.message.includes('User already registered')) setError('Un compte existe déjà avec cet email')
      else if (error.message.includes('Password should be at least')) setError('Le mot de passe doit contenir au moins 6 caractères')
      else if (error.message.includes('Invalid email')) setError('Adresse email invalide')
      else setError(error.message)
    } finally { setLoading(false) }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
      if (error) throw error
    } catch (error) {
      console.error('Google login error:', error)
      setError('Erreur lors de la connexion avec Google')
    }
  }

  if (checkingSession) return <LoadingDots />

  const inputStyle = { width: '100%', padding: '16px', border: `2px solid ${COLORS.border}`, borderRadius: 14, fontSize: 16, fontFamily: "'Satoshi', sans-serif", boxSizing: 'border-box', outline: 'none' }
  const labelStyle = { fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8, color: COLORS.ink }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, padding: 20, fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ background: COLORS.white, padding: '48px 40px', borderRadius: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: `1px solid ${COLORS.border}` }}>
        
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><FourDots size={14} gap={6} /></div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink, letterSpacing: -1, margin: 0 }}>junto</h1>
            <p style={{ fontSize: 14, color: COLORS.gray, marginTop: 8 }}>Ensemble, on joue mieux</p>
          </div>
        </Link>

        <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '16px', background: COLORS.white, color: COLORS.ink, border: `2px solid ${COLORS.border}`, borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16, fontFamily: "'Satoshi', sans-serif" }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', color: COLORS.muted, fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />ou<div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: COLORS.bgSoft, padding: 4, borderRadius: 100 }}>
          <button onClick={() => { setMode('login'); setError('') }} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 100, background: mode === 'login' ? COLORS.white : 'transparent', color: mode === 'login' ? COLORS.ink : COLORS.gray, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Satoshi', sans-serif", boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>Connexion</button>
          <button onClick={() => { setMode('signup'); setError('') }} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 100, background: mode === 'signup' ? COLORS.white : 'transparent', color: mode === 'signup' ? COLORS.ink : COLORS.gray, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Satoshi', sans-serif", boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>Inscription</button>
        </div>

        {error && (<div style={{ background: COLORS.primarySoft, color: COLORS.primary, padding: '14px 16px', borderRadius: 14, marginBottom: 20, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}><span>⚠️</span> {error}</div>)}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (<>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Prénom *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" required autoComplete="given-name" style={inputStyle} /></div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Nom *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ton nom de famille" required autoComplete="family-name" style={inputStyle} /></div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Téléphone</label>
                <span style={{ fontSize: 11, color: COLORS.muted, background: COLORS.bgSoft, padding: '2px 8px', borderRadius: 4 }}>optionnel</span>
                <button type="button" onClick={() => setShowPhoneInfo(!showPhoneInfo)} style={{ background: 'none', border: 'none', color: COLORS.teal, fontSize: 12, cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline' }}>Pourquoi ?</button>
              </div>
              {showPhoneInfo && (<div style={{ background: COLORS.tealSoft, borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 13, color: COLORS.tealDark, lineHeight: 1.5 }}><strong>📱 À quoi ça sert ?</strong><ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}><li>Recevoir un rappel avant tes parties</li><li>Être notifié si un joueur se désiste</li><li>Permettre aux organisateurs de te contacter</li></ul><div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Ton numéro reste privé.</div></div>)}
              <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: COLORS.gray, fontSize: 16 }}>🇫🇷</span><input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="06 12 34 56 78" autoComplete="tel" style={{ ...inputStyle, paddingLeft: 48, letterSpacing: 1 }} /></div>
            </div>
          </>)}

          <div style={{ marginBottom: 20 }}><label style={labelStyle}>Email {mode === 'signup' && '*'}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" required autoComplete="email" style={inputStyle} /></div>
          <div style={{ marginBottom: 28 }}><label style={labelStyle}>Mot de passe {mode === 'signup' && '*'}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} style={inputStyle} />{mode === 'signup' && (<p style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>Minimum 6 caractères</p>)}</div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? COLORS.border : COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Satoshi', sans-serif", boxShadow: loading ? 'none' : '0 4px 16px rgba(255, 90, 95, 0.3)' }}>{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
        </form>

        {mode === 'signup' && (<p style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>En t'inscrivant, tu acceptes nos conditions d'utilisation.</p>)}
        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${COLORS.border}` }}><Link href="/" style={{ color: COLORS.gray, fontSize: 14, textDecoration: 'none' }}>← Retour à l'accueil</Link></div>
      </div>

      <style jsx global>{`
        @keyframes junto-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }
        .junto-dot { animation: junto-breathe 3s ease-in-out infinite; }
        .junto-dot:nth-child(1) { animation-delay: 0s; }
        .junto-dot:nth-child(2) { animation-delay: 0.15s; }
        .junto-dot:nth-child(3) { animation-delay: 0.3s; }
        .junto-dot:nth-child(4) { animation-delay: 0.45s; }
        @keyframes junto-loading { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
        .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
        .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
        .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
        .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }
        input:focus { border-color: ${COLORS.primary} !important; }
      `}</style>
    </div>
  )
}
