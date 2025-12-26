'use client'

/**
 * ============================================
 * AUTH PAGE - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Login / Signup avec :
 * - Google OAuth
 * - Email/Password
 * - Téléphone optionnel (inscription)
 * - Redirection après login
 * - Vérification profil complet
 * 
 * Design : Interface sobre + 4 dots colorés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p3Soft: '#e5f9f7',
  
  // Interface sobre
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  white: '#ffffff',
  
  // Borders
  border: '#e5e7eb',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// === COMPOSANT: Les 4 dots animés ===
function FourDots({ size = 12, gap = 6 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          className="dot-breathe" 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size > 10 ? 4 : '50%', 
            background: c,
            animationDelay: `${i * 0.15}s`
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Loading avec dots ===
function LoadingDots() {
  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="loading-dots">
          {PLAYER_COLORS.map((c, i) => (
            <div 
              key={i} 
              className="loading-dot" 
              style={{ background: c, animationDelay: `${i * 0.1}s` }} 
            />
          ))}
        </div>
        <div className="loading-text">Chargement...</div>
      </div>
      <style jsx>{`
        .loading-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${COLORS.bg};
          font-family: 'Satoshi', -apple-system, sans-serif;
        }
        .loading-content { text-align: center; }
        .loading-dots { 
          display: flex; 
          justify-content: center; 
          gap: 10px; 
          margin-bottom: 24px; 
        }
        .loading-dot {
          width: 14px;
          height: 14px;
          border-radius: 5px;
          animation: loadBounce 1.4s ease-in-out infinite;
        }
        .loading-text { 
          color: ${COLORS.gray}; 
          font-size: 15px; 
        }
        @keyframes loadBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}

// === PAGE PRINCIPALE ===
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

  // === VÉRIFICATION SESSION ===
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience, ambiance')
          .eq('id', session.user.id)
          .single()
        
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
        
        if (profile?.experience && profile?.ambiance) {
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin')
            router.push(redirectUrl)
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/onboarding')
        }
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  // === FORMATAGE TÉLÉPHONE ===
  function formatPhone(value) {
    const numbers = value.replace(/\D/g, '')
    let formatted = ''
    for (let i = 0; i < numbers.length && i < 10; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' '
      formatted += numbers[i]
    }
    return formatted
  }

  // === SOUMISSION FORMULAIRE ===
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (mode === 'signup') {
        // Formatage téléphone
        let formattedPhone = null
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '')
          if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
            formattedPhone = '+33' + cleanPhone.substring(1)
          } else if (cleanPhone.length === 9) {
            formattedPhone = '+33' + cleanPhone
          }
        }
        
        // Inscription
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
        
        // Mise à jour profil
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ last_name: lastName, phone: formattedPhone })
            .eq('id', data.user.id)
        }
        
        router.push('/onboarding')
        
      } else {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        // Vérifier profil complet
        const { data: profile } = await supabase
          .from('profiles')
          .select('experience, ambiance')
          .eq('id', data.user.id)
          .single()
        
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
        
        if (profile?.experience && profile?.ambiance) {
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin')
            router.push(redirectUrl)
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/onboarding')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      // Messages d'erreur traduits
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

  // === GOOGLE LOGIN ===
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

  // === LOADING STATE ===
  if (checkingSession) return <LoadingDots />

  // === RENDER ===
  return (
    <div className="auth-page">
      <div className="auth-card">
        
        {/* Logo 2×2 */}
        <Link href="/" className="logo-link">
          <div className="logo-section">
            <div className="logo-dots">
              <FourDots size={14} gap={6} />
            </div>
            <h1 className="logo-text">2×2</h1>
            <p className="logo-tagline">Le padel entre amis</p>
          </div>
        </Link>

        {/* Bouton Google */}
        <button onClick={handleGoogleLogin} className="google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        {/* Séparateur */}
        <div className="separator">
          <div className="separator-line" />
          <span>ou</span>
          <div className="separator-line" />
        </div>

        {/* Toggle Login/Signup */}
        <div className="mode-toggle">
          <button 
            onClick={() => { setMode('login'); setError('') }}
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
          >
            Connexion
          </button>
          <button 
            onClick={() => { setMode('signup'); setError('') }}
            className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
          >
            Inscription
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="auth-form">
          
          {/* Champs inscription */}
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton prénom"
                  required
                  autoComplete="given-name"
                />
              </div>
              
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ton nom de famille"
                  required
                  autoComplete="family-name"
                />
              </div>
              
              <div className="form-group">
                <div className="label-row">
                  <label>Téléphone</label>
                  <span className="optional-tag">optionnel</span>
                  <button 
                    type="button" 
                    onClick={() => setShowPhoneInfo(!showPhoneInfo)}
                    className="why-btn"
                  >
                    Pourquoi ?
                  </button>
                </div>
                
                {showPhoneInfo && (
                  <div className="phone-info">
                    <strong>📱 À quoi ça sert ?</strong>
                    <ul>
                      <li>Recevoir un rappel avant tes parties</li>
                      <li>Être notifié si un joueur se désiste</li>
                      <li>Permettre aux organisateurs de te contacter</li>
                    </ul>
                    <div className="phone-privacy">Ton numéro reste privé.</div>
                  </div>
                )}
                
                <div className="phone-input-wrapper">
                  <span className="phone-flag">🇫🇷</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                    className="phone-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label>Email {mode === 'signup' && '*'}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Mot de passe {mode === 'signup' && '*'}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            {mode === 'signup' && (
              <p className="password-hint">Minimum 6 caractères</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className={`submit-btn ${loading ? 'loading' : ''}`}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        {/* Conditions */}
        {mode === 'signup' && (
          <p className="terms">
            En t'inscrivant, tu acceptes nos conditions d'utilisation.
          </p>
        )}

        {/* Retour accueil */}
        <div className="back-section">
          <Link href="/" className="back-link">← Retour à l'accueil</Link>
        </div>
      </div>

      {/* === STYLES === */}
      <style jsx global>{`
        @keyframes dot-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }
      `}</style>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${COLORS.bg};
          padding: 20px;
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .auth-card {
          background: ${COLORS.white};
          padding: 48px 40px;
          border-radius: 28px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          border: 1px solid ${COLORS.border};
        }

        /* Logo */
        .logo-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .logo-section {
          text-align: center;
          margin-bottom: 36px;
        }

        .logo-dots {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .logo-text {
          font-size: 36px;
          font-weight: 900;
          color: ${COLORS.ink};
          letter-spacing: -1px;
          margin: 0;
        }

        .logo-tagline {
          font-size: 14px;
          color: ${COLORS.gray};
          margin-top: 8px;
        }

        /* Google Button */
        .google-btn {
          width: 100%;
          padding: 16px;
          background: ${COLORS.white};
          color: ${COLORS.ink};
          border: 2px solid ${COLORS.border};
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .google-btn:hover {
          border-color: ${COLORS.gray};
        }

        /* Separator */
        .separator {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
          color: ${COLORS.muted};
          font-size: 13px;
        }

        .separator-line {
          flex: 1;
          height: 1px;
          background: ${COLORS.border};
        }

        /* Mode Toggle */
        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          background: ${COLORS.bgSoft};
          padding: 4px;
          border-radius: 100px;
        }

        .mode-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 100px;
          background: transparent;
          color: ${COLORS.gray};
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: ${COLORS.white};
          color: ${COLORS.ink};
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        /* Error */
        .error-message {
          background: ${COLORS.p1Soft};
          color: ${COLORS.p1};
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
          color: ${COLORS.ink};
        }

        .form-group input {
          width: 100%;
          padding: 16px;
          border: 2px solid ${COLORS.border};
          border-radius: 14px;
          font-size: 16px;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: ${COLORS.ink};
        }

        /* Phone field */
        .label-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .label-row label {
          margin-bottom: 0;
        }

        .optional-tag {
          font-size: 11px;
          color: ${COLORS.muted};
          background: ${COLORS.bgSoft};
          padding: 2px 8px;
          border-radius: 4px;
        }

        .why-btn {
          background: none;
          border: none;
          color: ${COLORS.p3};
          font-size: 12px;
          cursor: pointer;
          margin-left: auto;
          text-decoration: underline;
          font-family: inherit;
        }

        .phone-info {
          background: ${COLORS.p3Soft};
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 12px;
          font-size: 13px;
          color: ${COLORS.ink};
          line-height: 1.5;
        }

        .phone-info strong {
          display: block;
          margin-bottom: 8px;
        }

        .phone-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .phone-info li {
          margin-bottom: 4px;
        }

        .phone-privacy {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .phone-input-wrapper {
          position: relative;
        }

        .phone-flag {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
        }

        .phone-input {
          padding-left: 48px !important;
          letter-spacing: 1px;
        }

        /* Password hint */
        .password-hint {
          font-size: 13px;
          color: ${COLORS.muted};
          margin-top: 8px;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          padding: 18px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          margin-top: 8px;
          transition: all 0.2s;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .submit-btn.loading {
          background: ${COLORS.border};
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Terms */
        .terms {
          font-size: 13px;
          color: ${COLORS.muted};
          text-align: center;
          margin-top: 20px;
          line-height: 1.5;
        }

        /* Back */
        .back-section {
          text-align: center;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid ${COLORS.border};
        }

        .back-link {
          color: ${COLORS.gray};
          font-size: 14px;
          text-decoration: none;
        }

        .back-link:hover {
          color: ${COLORS.ink};
        }

        /* Responsive */
        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }

          .logo-text {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  )
}