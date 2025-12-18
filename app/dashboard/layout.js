'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }
    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    // Rediriger vers onboarding si profil incomplet
    if (!profileData?.name || !profileData?.level) {
      router.push('/onboarding')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navbar fixe */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 100
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none'
        }}>
          <span style={{ fontSize: 24 }}>🎾</span>
          <span style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            PadelMatch
          </span>
        </Link>

        {/* Bouton Créer - CENTRAL ET VISIBLE */}
        <Link href="/dashboard?create=true" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 10,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: '600'
        }}>
          <span style={{ fontSize: 18 }}>+</span>
          <span>Créer une partie</span>
        </Link>

        {/* Profil */}
        <Link href="/dashboard/profile" style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: pathname === '/dashboard/profile' ? '#1a1a1a' : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          fontSize: 18,
          transition: 'all 0.2s'
        }}>
          {pathname === '/dashboard/profile' ? '👤' : '👤'}
        </Link>
      </nav>

      {/* Contenu avec padding pour navbar */}
      <main style={{ paddingTop: 64 }}>
        {children}
      </main>

      {/* Bottom nav mobile (optionnel) */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        background: '#fff',
        borderTop: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 20px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100
      }}>
        <Link href="/dashboard" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          textDecoration: 'none',
          color: pathname === '/dashboard' ? '#1a1a1a' : '#999',
          fontSize: 12
        }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span>Accueil</span>
        </Link>

        <Link href="/dashboard?create=true" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          textDecoration: 'none',
          background: '#1a1a1a',
          color: '#fff',
          padding: '8px 24px',
          borderRadius: 12,
          marginTop: -20
        }}>
          <span style={{ fontSize: 22 }}>+</span>
          <span style={{ fontSize: 11 }}>Créer</span>
        </Link>

        <Link href="/dashboard/profile" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          textDecoration: 'none',
          color: pathname === '/dashboard/profile' ? '#1a1a1a' : '#999',
          fontSize: 12
        }}>
          <span style={{ fontSize: 22 }}>👤</span>
          <span>Profil</span>
        </Link>
      </nav>

      {/* Padding bottom pour bottom nav */}
      <div style={{ height: 90 }} />
    </div>
  )
}