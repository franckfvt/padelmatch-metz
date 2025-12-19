'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// === ICÔNES SVG ===
const Icons = {
  home: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  tennis: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  users: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  calendar: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  user: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  trophy: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 22V8a6 6 0 1 1 12 0v14"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    </svg>
  ),
  stats: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  menu: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  x: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

// Logo PadelMatch
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Raquette de padel stylisée */}
    <circle cx="16" cy="12" r="10" fill="#2e7d32" opacity="0.2"/>
    <circle cx="16" cy="12" r="10" stroke="#2e7d32" strokeWidth="2" fill="none"/>
    {/* Grille de la raquette */}
    <line x1="16" y1="4" x2="16" y2="20" stroke="#2e7d32" strokeWidth="1.5"/>
    <line x1="8" y1="12" x2="24" y2="12" stroke="#2e7d32" strokeWidth="1.5"/>
    <line x1="10" y1="6" x2="22" y2="18" stroke="#2e7d32" strokeWidth="1" opacity="0.5"/>
    <line x1="22" y1="6" x2="10" y2="18" stroke="#2e7d32" strokeWidth="1" opacity="0.5"/>
    {/* Manche */}
    <rect x="14" y="20" width="4" height="8" rx="2" fill="#2e7d32"/>
    {/* Balle */}
    <circle cx="24" cy="24" r="4" fill="#fbbf24"/>
    <path d="M22 22 Q24 24 22 26" stroke="#fff" strokeWidth="1" fill="none"/>
  </svg>
)

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

    if (!profileData?.name || !profileData?.level || !profileData?.ambiance) {
      router.push('/onboarding')
      return
    }

    setProfile(profileData)
    setLoading(false)
  }

  const navItems = [
    { href: '/dashboard', label: 'Accueil', icon: 'home' },
    { href: '/dashboard/clubs', label: 'Parties', icon: 'tennis' },
    { href: '/dashboard/stats', label: 'Mes stats', icon: 'stats' },
    { href: '/dashboard/groups', label: 'Groupes', icon: 'users' },
    { href: '/dashboard/profile', label: 'Profil', icon: 'user' },
  ]

  const getIcon = (iconName, isActive) => {
    const IconComponent = Icons[iconName]
    if (!IconComponent) return null
    return <IconComponent size={20} color={isActive ? '#2e7d32' : '#666'} />
  }

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
          <Logo size={64} />
          <div style={{ color: '#666', marginTop: 16 }}>Chargement...</div>
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
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={36} />
            <span style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
          </Link>

          {/* Nav Desktop */}
          <nav style={{ display: 'flex', gap: 4 }} className="desktop-nav">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: '600',
                    color: isActive ? '#2e7d32' : '#666',
                    background: isActive ? '#e8f5e9' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  {getIcon(item.icon, isActive)}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Profil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }} className="desktop-profile">
              <div style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>
                {profile?.name}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                ⭐ {profile?.level}/10 · {profile?.matches_played || 0} parties
              </div>
            </div>
            <Link href="/dashboard/profile">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: '2px solid #e8f5e9'
                  }} 
                />
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  background: '#e8f5e9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <Icons.user size={20} color="#2e7d32" />
                </div>
              )}
            </Link>

            {/* Menu Mobile Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8
              }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <Icons.x size={24} color="#1a1a1a" /> : <Icons.menu size={24} color="#1a1a1a" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            borderBottom: '1px solid #eee',
            padding: 16,
            display: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }} className="mobile-menu">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 16,
                    fontWeight: '600',
                    color: isActive ? '#2e7d32' : '#666',
                    background: isActive ? '#e8f5e9' : 'transparent',
                    marginBottom: 4
                  }}
                >
                  {getIcon(item.icon, isActive)}
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px'
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
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
      }} className="mobile-bottom-nav">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                textDecoration: 'none',
                fontSize: 10,
                fontWeight: '600',
                color: isActive ? '#2e7d32' : '#666',
                padding: '4px 8px',
                minWidth: 60
              }}
            >
              {getIcon(item.icon, isActive)}
              <span>{item.label}</span>
            </Link>
          )
        })}
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
            padding-bottom: 80px !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-profile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}