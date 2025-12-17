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
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth')
          return
        }
        
        setUser(session.user)
        
        // Charger le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/auth')
      }
    }
    
    loadUser()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          router.push('/auth')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Loading state
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
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Jouer', icon: '🎾' },
    { href: '/dashboard/clubs', label: 'Clubs', icon: '📍' },
    { href: '/dashboard/profile', label: 'Profil', icon: '👤' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <Link href="/dashboard" style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#1a1a1a',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>🎾</span> PadelMatch
          </Link>

          {/* Navigation Desktop */}
          <nav style={{
            display: 'flex',
            gap: 8,
            background: '#f5f5f5',
            padding: 4,
            borderRadius: 12
          }}>
            {navItems.map(item => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#1a1a1a' : '#666',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <span style={{ 
              fontSize: 14, 
              color: '#666',
              display: 'none'  // Hidden on mobile
            }}>
              {profile?.name || 'Joueur'}
            </span>
            <div style={{
              width: 40,
              height: 40,
              background: '#e5e5e5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18
            }}>
              👤
            </div>
          </div>
        </div>
      </header>

      {/* Bannière profil incomplet */}
      {profile && (!profile.experience || !profile.ambiance) && (
        <div style={{
          background: '#fef3c7',
          borderBottom: '1px solid #fcd34d',
          padding: '12px 24px'
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <span style={{ fontSize: 14, color: '#92400e' }}>
              ⚠️ Complete ton profil pour trouver des joueurs de ton niveau
            </span>
            <Link href="/onboarding" style={{
              padding: '8px 16px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Compléter mon profil
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px 100px'
      }}>
        {children}
      </main>

      {/* Navigation Mobile (bottom) */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #eee',
        padding: '12px 0 20px',
        display: 'none',  // Show only on mobile via media query
        justifyContent: 'space-around',
        zIndex: 100
      }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                color: isActive ? '#1a1a1a' : '#999',
                fontSize: 12,
                fontWeight: isActive ? '600' : '500'
              }}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* CSS pour mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          header nav {
            display: none !important;
          }
          main {
            padding-bottom: 120px !important;
          }
          nav[style*="position: fixed"] {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}