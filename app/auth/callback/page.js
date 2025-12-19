'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Attendre que Supabase traite le token
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth')
        return
      }

      if (!session) {
        router.push('/auth')
        return
      }

      // Vérifier si le profil est complet
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, level')
        .eq('id', session.user.id)
        .single()

      // Récupérer la redirection stockée
      const redirect = sessionStorage.getItem('redirectAfterLogin')

      if (profile?.name && profile?.level) {
        // Profil complet → redirection ou dashboard
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      } else {
        // Profil incomplet → onboarding
        // Transférer la redirection pour après l'onboarding
        if (redirect) {
          sessionStorage.removeItem('redirectAfterLogin')
          sessionStorage.setItem('redirectAfterOnboarding', redirect)
        }
        router.push('/onboarding')
      }

    } catch (error) {
      console.error('Callback error:', error)
      router.push('/auth')
    }
  }

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
        <div style={{ color: '#666' }}>Connexion en cours...</div>
      </div>
    </div>
  )
}