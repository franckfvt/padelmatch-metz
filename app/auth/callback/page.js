'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Vérifier si profil complet
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
          router.push('/auth')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router])

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