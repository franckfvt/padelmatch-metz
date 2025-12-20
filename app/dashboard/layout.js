'use client'

/**
 * ============================================
 * LAYOUT DASHBOARD - VERSION DESKTOP RESPONSIVE
 * ============================================
 * 
 * Navigation: 5 onglets (Accueil, Explorer, Parties, Communauté, Moi)
 * 
 * Breakpoints:
 * - Mobile (<768px): Bottom nav, colonne unique
 * - Tablet (768-1024px): Header nav, 1-2 colonnes
 * - Desktop (>1024px): Header nav, 2 colonnes avec sidebar
 * 
 * Branding: Plateforme sobre + Joueurs colorés
 * 
 * ============================================
 */

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'
import WelcomeModal from '@/app/components/WelcomeModal'

// Context pour partager les données utilisateur
export const DashboardContext = createContext(null)
export function useDashboard() {
  return useContext(DashboardContext)
}

// Couleurs pour avatars basées sur la première lettre
const LETTER_COLORS = {
  A: '#3b82f6', B: '#22c55e', C: '#f59e0b', D: '#a855f7',
  E: '#ef4444', F: '#06b6d4', G: '#ec4899', H: '#14b8a6',
  I: '#3b82f6', J: '#22c55e', K: '#f59e0b', L: '#a855f7',
  M: '#ef4444', N: '#06b6d4', O: '#ec4899', P: '#14b8a6',
  Q: '#3b82f6', R: '#22c55e', S: '#f59e0b', T: '#a855f7',
  U: '#ef4444', V: '#06b6d4', W: '#ec4899', X: '#14b8a6',
  Y: '#3b82f6', Z: '#22c55e'
}

export function getColorForName(name) {
  const letter = (name || 'A')[0].toUpperCase()
  return LETTER_COLORS[letter] || '#3b82f6'
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showWelcome, setShowWelcome] = useState(false)

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
    
    // Charger les stats
    const { data: statsData } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    setStats(statsData)
    
    // Charger les favoris
    const { data: favsData } = await supabase
      .from('player_favorites')
      .select('*, profiles!player_favorites_favorite_id_fkey(id, name, avatar_url, level, city)')
      .eq('user_id', session.user.id)
      .limit(5)
    setFavorites(favsData || [])
    
    // Afficher le popup de bienvenue si première visite
    if (profileData && !profileData.has_seen_welcome) {
      setShowWelcome(true)
    }
    
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

  function isActive(item) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const avatarColor = getColorForName(profile?.name)

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

  const contextValue = {
    user,
    profile,
    stats,
    favorites,
    refreshData: checkAuth,
    avatarColor,
    getColorForName
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        
        {/* ============================================ */}
        {/* HEADER                                      */}
        {/* ============================================ */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div className="header-inner" style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 16px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            
            {/* Logo */}
            <Link href="/dashboard" style={{ 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              flexShrink: 0
            }}>
              <span style={{ fontSize: 28 }}>🎾</span>
              <span className="logo-text" style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: '#1a1a2e'
              }}>
                PadelMatch
              </span>
            </Link>

            {/* Navigation centrale - Desktop */}
            <nav className="desktop-nav" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              {navItems.map(item => {
                const active = isActive(item)
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      color: active ? '#1a1a2e' : '#64748b',
                      background: active ? '#f1f5f9' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Actions droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  position: 'relative'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
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

              {/* Avatar */}
              <Link 
                href="/dashboard/me"
                className="user-avatar"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: profile?.avatar_url ? '#000' : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                  border: pathname.startsWith('/dashboard/me') ? '3px solid #22c55e' : '3px solid transparent',
                  overflow: 'hidden'
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile?.name?.[0]?.toUpperCase() || '?'
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* ============================================ */}
        {/* CONTENU PRINCIPAL                           */}
        {/* ============================================ */}
        <main className="main-container" style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '24px 16px',
          paddingBottom: 100
        }}>
          {children}
        </main>

        {/* ============================================ */}
        {/* NAVBAR MOBILE                               */}
        {/* ============================================ */}
        <nav className="mobile-nav" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e2e8f0',
          padding: '8px 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          display: 'none',
          justifyContent: 'space-around',
          zIndex: 100
        }}>
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
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: active ? '#1a1a2e' : '#94a3b8',
                  background: active ? '#f1f5f9' : 'transparent',
                  minWidth: 60
                }}
              >
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>
                  {item.label === 'Mes parties' ? 'Parties' : item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Notifications Panel */}
        {showNotifications && (
          <>
            <div 
              onClick={() => setShowNotifications(false)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
            />
            <div style={{
              position: 'fixed',
              top: 70,
              right: 16,
              width: 360,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 100px)',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              zIndex: 201,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>Notifications</h3>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🔔</div>
                <p style={{ color: '#64748b', fontSize: 14 }}>Aucune notification pour le moment</p>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        {showCardModal && <PlayerCardModal profile={profile} onClose={() => setShowCardModal(false)} />}
        {showWelcome && profile && <WelcomeModal profile={profile} onClose={() => setShowWelcome(false)} />}

        {/* ============================================ */}
        {/* STYLES RESPONSIVE                           */}
        {/* ============================================ */}
        <style jsx global>{`
          * { box-sizing: border-box; }
          
          /* ===== MOBILE (< 768px) ===== */
          .logo-text { display: none !important; }
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
          .user-avatar { display: none !important; }
          .main-container { 
            padding: 16px !important; 
            padding-bottom: 100px !important; 
          }
          .header-inner { padding: 0 12px !important; }
          
          /* ===== TABLET (768px - 1024px) ===== */
          @media (min-width: 768px) {
            .logo-text { display: inline !important; }
            .desktop-nav { display: flex !important; }
            .mobile-nav { display: none !important; }
            .user-avatar { display: flex !important; }
            .main-container { 
              padding: 24px !important; 
              padding-bottom: 24px !important; 
            }
            .nav-label { display: none !important; }
            .header-inner { padding: 0 24px !important; }
          }
          
          /* ===== DESKTOP (> 1024px) ===== */
          @media (min-width: 1024px) {
            .nav-label { display: inline !important; }
            .main-container { padding: 32px !important; }
            .header-inner { padding: 0 32px !important; }
          }
          
          /* ===== LARGE (> 1280px) ===== */
          @media (min-width: 1280px) {
            .main-container { padding: 32px 48px !important; }
            .header-inner { padding: 0 48px !important; }
          }

          /* Scrollbar */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          
          html { scroll-behavior: smooth; }
        `}</style>
      </div>
    </DashboardContext.Provider>
  )
}