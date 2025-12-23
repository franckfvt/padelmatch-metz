'use client'

/**
 * ============================================
 * LAYOUT DASHBOARD - JUNTO BRAND
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import WelcomeModal from '@/app/components/WelcomeModal'
import { COLORS, FOUR_DOTS, getAvatarColor } from '@/app/lib/design-tokens'

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {FOUR_DOTS.colors.map((color, i) => (
            <div key={i} className="junto-loading-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
          ))}
        </div>
        <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase.channel(`profile-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => setProfile(payload.new))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!profileData?.level && !profileData?.experience) { router.push('/onboarding'); return }
    setProfile(profileData)
    if (profileData && !profileData.has_seen_welcome) setShowWelcome(true)
    setLoading(false)
  }

  const navItems = [
    { href: '/dashboard/parties', label: 'Parties', icon: '🎾' },
    { href: '/dashboard/joueurs', label: 'Joueurs', icon: '👥' },
    { href: '/dashboard/carte', label: 'Ma carte', icon: '🎴' },
  ]

  const isActive = (item) => pathname.startsWith(item.href)

  if (loading) return <LoadingDots />

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      
      {/* HEADER */}
      <header style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="logo-text" style={{ fontSize: 22, fontWeight: 700, color: COLORS.ink, letterSpacing: -1 }}>junto</span>
            <FourDots size={8} gap={4} />
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} style={{
                padding: '10px 18px', borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 600,
                color: isActive(item) ? COLORS.white : COLORS.gray,
                background: isActive(item) ? COLORS.primary : 'transparent',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <span>{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{
              width: 42, height: 42, borderRadius: 12, border: `2px solid ${COLORS.border}`, background: COLORS.white,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, position: 'relative'
            }}>🔔</button>

            <Link href="/dashboard/me" className="user-avatar-desktop" style={{
              width: 42, height: 42, borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : getAvatarColor(profile?.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.white, fontWeight: 700, fontSize: 15, textDecoration: 'none',
              border: pathname.startsWith('/dashboard/me') ? `3px solid ${COLORS.primary}` : '3px solid transparent',
              overflow: 'hidden'
            }}>
              {profile?.avatar_url ? <img src={`${profile.avatar_url}?t=${profile.updated_at || Date.now()}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.name?.[0]?.toUpperCase() || '?'}
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-content" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px', paddingBottom: 100 }}>
        {children}
      </main>

      {/* MOBILE NAV */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: COLORS.white, borderTop: `1px solid ${COLORS.border}`,
        padding: '10px 0', paddingBottom: 'max(10px, env(safe-area-inset-bottom))', display: 'none', justifyContent: 'space-around', zIndex: 100
      }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 16,
            textDecoration: 'none', color: isActive(item) ? COLORS.primary : COLORS.muted,
            background: isActive(item) ? COLORS.primarySoft : 'transparent', minWidth: 64
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: isActive(item) ? 700 : 500 }}>{item.label}</span>
          </Link>
        ))}
        <Link href="/dashboard/me" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 16,
          textDecoration: 'none', color: pathname.startsWith('/dashboard/me') ? COLORS.primary : COLORS.muted,
          background: pathname.startsWith('/dashboard/me') ? COLORS.primarySoft : 'transparent', minWidth: 64
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: profile?.avatar_url ? 'transparent' : getAvatarColor(profile?.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.white, fontWeight: 700, fontSize: 11, overflow: 'hidden'
          }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: 11, fontWeight: pathname.startsWith('/dashboard/me') ? 700 : 500 }}>Moi</span>
        </Link>
      </nav>

      {/* NOTIFICATIONS PANEL */}
      {showNotifications && (
        <>
          <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 72, right: 16, width: 340, maxWidth: 'calc(100vw - 32px)', background: COLORS.white, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 201, border: `1px solid ${COLORS.border}` }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: COLORS.ink }}>Notifications</h3>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.muted }}>✕</button>
            </div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                {FOUR_DOTS.colors.map((color, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: 0.3 }} />)}
              </div>
              <p style={{ color: COLORS.gray, fontSize: 14 }}>Aucune notification</p>
            </div>
          </div>
        </>
      )}

      {/* STYLES */}
      <style jsx global>{`
        .nav-label, .logo-text { display: none !important; }
        .desktop-nav { display: none !important; }
        .mobile-nav { display: flex !important; }
        .user-avatar-desktop { display: none !important; }
        
        @media (min-width: 768px) {
          .nav-label, .logo-text { display: inline !important; }
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
          .user-avatar-desktop { display: flex !important; }
          main { padding-bottom: 24px !important; }
          .main-content { padding: 32px 24px !important; }
        }
        
        @media (min-width: 1024px) { .main-content { padding: 32px 40px !important; } }
        @media (min-width: 1280px) { .main-content { padding: 32px 48px !important; } }
      `}</style>

      {showWelcome && profile && <WelcomeModal profile={profile} onClose={() => setShowWelcome(false)} />}
    </div>
  )
}
