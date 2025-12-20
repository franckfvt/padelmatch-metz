'use client'

/**
 * ============================================
 * LAYOUT DASHBOARD - NOUVELLE ARCHITECTURE
 * ============================================
 * 
 * Navigation: 5 onglets
 * 1. Accueil 🏠
 * 2. Explorer 🔍
 * 3. Mes parties 🎾
 * 4. Communauté 👥
 * 5. Moi 👤
 * 
 * Branding: Plateforme sobre + Joueurs colorés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

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

    if (!profileData?.level && !profileData?.experience) {
      router.push('/onboarding')
      return
    }

    setProfile(profileData)
    
    // TODO: Charger les notifications
    // const { data: notifs } = await supabase.from('notifications')...
    
    setLoading(false)
  }

  // 5 onglets principaux
  const navItems = [
    { href: '/dashboard', label: 'Accueil', icon: '🏠', exact: true },
    { href: '/dashboard/explore', label: 'Explorer', icon: '🔍', exact: false },
    { href: '/dashboard/matches', label: 'Mes parties', icon: '🎾', exact: false },
    { href: '/dashboard/community', label: 'Communauté', icon: '👥', exact: false },
    { href: '/dashboard/me', label: 'Moi', icon: '👤', exact: false },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  // Vérifier si un onglet est actif
  function isActive(item) {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#64748b' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* ============================================ */}
      {/* HEADER - STICKY                             */}
      {/* ============================================ */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 16px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          
          {/* Logo */}
          <Link href="/dashboard" style={{ 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            flexShrink: 0
          }}>
            <span style={{ fontSize: 24 }}>🎾</span>
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#1a1a2e'
            }} className="logo-text">
              PadelMatch
            </span>
          </Link>

          {/* Navigation centrale - Desktop */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }} className="desktop-nav">
            {navItems.map(item => {
              const active = isActive(item)
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? '#1a1a2e' : '#64748b',
                    background: active ? '#f1f5f9' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bouton Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: '#f1f5f9',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                position: 'relative'
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  background: '#ef4444',
                  borderRadius: '50%',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar utilisateur - Desktop */}
            <Link 
              href="/dashboard/me"
              className="user-avatar-desktop"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                border: pathname.startsWith('/dashboard/me') ? '2px solid #22c55e' : '2px solid transparent'
              }}
            >
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* CONTENU PRINCIPAL                           */}
      {/* ============================================ */}
      <main style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px 16px',
        paddingBottom: 100 // Espace pour la navbar mobile
      }}>
        {children}
      </main>

      {/* ============================================ */}
      {/* NAVBAR MOBILE - BOTTOM                      */}
      {/* ============================================ */}
      <nav 
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          padding: '8px 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          display: 'none', // Affiché via CSS sur mobile
          justifyContent: 'space-around',
          zIndex: 100
        }}
      >
        {navItems.map(item => {
          const active = isActive(item)
          return (
            <Link 
              key={item.href}
              href={item.href} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                color: active ? '#1a1a2e' : '#94a3b8',
                background: active ? '#f1f5f9' : 'transparent',
                minWidth: 56
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ 
                fontSize: 10, 
                fontWeight: active ? 600 : 500
              }}>
                {item.label === 'Mes parties' ? 'Parties' : item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ============================================ */}
      {/* PANNEAU NOTIFICATIONS                       */}
      {/* ============================================ */}
      {showNotifications && (
        <>
          <div 
            onClick={() => setShowNotifications(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 200
            }}
          />
          <div style={{
            position: 'fixed',
            top: 60,
            right: 16,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 100px)',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 201,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🔔</div>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                Aucune notification pour le moment
              </p>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* MODAL CARTE JOUEUR                          */}
      {/* ============================================ */}
      {showCardModal && (
        <PlayerCardModal 
          profile={profile} 
          onClose={() => setShowCardModal(false)} 
        />
      )}

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        /* Mobile first */
        .nav-label {
          display: none;
        }
        .logo-text {
          display: none !important;
        }
        .desktop-nav {
          display: none !important;
        }
        .mobile-nav {
          display: flex !important;
        }
        .user-avatar-desktop {
          display: none !important;
        }
        
        /* Desktop */
        @media (min-width: 768px) {
          .nav-label {
            display: inline !important;
          }
          .logo-text {
            display: inline !important;
          }
          .desktop-nav {
            display: flex !important;
          }
          .mobile-nav {
            display: none !important;
          }
          .user-avatar-desktop {
            display: flex !important;
          }
          main {
            padding-bottom: 24px !important;
          }
        }

        /* Scrollbar sobre */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}