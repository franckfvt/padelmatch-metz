'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)

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

    if (!profileData?.experience) {
      router.push('/onboarding')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  const navItems = [
    { href: '/dashboard', label: 'Accueil', icon: '🏠' },
    { href: '/dashboard/clubs', label: 'Parties', icon: '🎾' },
    { href: '/dashboard/groups', label: 'Groupes', icon: '👥' },
    { href: '/dashboard/polls', label: 'Sondages', icon: '🗓️' },
    { href: '/dashboard/profile', label: 'Profil', icon: '👤' },
  ]

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      background: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header Desktop */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🎾</span>
            <span style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
          </Link>

          {/* Nav Desktop */}
          <nav style={{ display: 'flex', gap: 8 }} className="desktop-nav">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: '600',
                  color: pathname === item.href ? '#1a1a1a' : '#666',
                  background: pathname === item.href ? '#f5f5f5' : 'transparent'
                }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>

          {/* Profil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Bouton Ma Carte */}
            <button
              onClick={() => setShowCardModal(true)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🎴 Ma carte
            </button>
            <div style={{ textAlign: 'right', display: 'none' }} className="desktop-profile">
              <div style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>
                {profile?.name}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                🎾 {profile?.matches_played || 0} parties · 🏆 {profile?.matches_won || 0} wins
              </div>
            </div>
            <Link href="/dashboard/profile">
              <div style={{
                width: 40,
                height: 40,
                background: '#f5f5f5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                cursor: 'pointer'
              }}>
                👤
              </div>
            </Link>

            {/* Menu Mobile Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                padding: 8
              }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            borderBottom: '1px solid #eee',
            padding: 16,
            display: 'none'
          }} className="mobile-menu">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: '600',
                  color: pathname === item.href ? '#1a1a1a' : '#666',
                  background: pathname === item.href ? '#f5f5f5' : 'transparent',
                  marginBottom: 4
                }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #eee',
        display: 'none',
        justifyContent: 'space-around',
        padding: '12px 0',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }} className="mobile-bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              fontSize: 10,
              fontWeight: '600',
              color: pathname === item.href ? '#2e7d32' : '#666',
              padding: '4px 12px'
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Styles responsives */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-profile {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          main {
            padding-bottom: 100px !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-profile {
            display: block !important;
          }
        }
      `}</style>

      {/* Modal Ma Carte */}
      {showCardModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowCardModal(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
              borderRadius: 24,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
                🎴 Ta carte joueur
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                Partage-la pour trouver des partenaires !
              </p>
            </div>

            <PlayerCard 
              player={{
                name: profile?.name,
                level: profile?.level,
                position: profile?.position,
                ambiance: profile?.ambiance,
                frequency: profile?.frequency,
                experience: profile?.experience,
                region: profile?.region,
                avatar_url: profile?.avatar_url
              }} 
              standalone 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/player/${profile?.id}`
                  navigator.clipboard.writeText(link)
                  alert('Lien copié ! 🎾')
                }}
                style={{
                  padding: '14px',
                  background: '#1877f2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📋 Copier le lien
              </button>
              <button
                onClick={() => setShowCardModal(false)}
                style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}