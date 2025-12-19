'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'

// Logo simple
const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 22 }}>🎾</span>
    <span style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
  </div>
)

// Panneau de notifications - simplifié
function NotificationPanel({ userId, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) loadNotifications()
  }, [userId])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function getIcon(type) {
    switch(type) {
      case 'player_joined': return '🎾'
      case 'player_left': return '⚠️'
      case 'match_reminder': return '🔔'
      case 'match_full': return '✅'
      case 'match_cancelled': return '❌'
      default: return '📢'
    }
  }

  function formatTime(date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    if (diff < 60000) return "À l'instant"
    if (diff < 3600000) return `Il y a ${Math.floor(diff/60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)}h`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: '600', margin: 0 }}>Notifications</h3>
          {unread > 0 && <span style={{ fontSize: 13, color: '#666' }}>{unread} non lue{unread > 1 ? 's' : ''}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
      </div>

      {unread > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#2e7d32', fontSize: 13, fontWeight: '600', cursor: 'pointer' }}>
            Tout marquer comme lu
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🔔</div>
            <p style={{ color: '#999', margin: 0, fontSize: 14 }}>Aucune notification</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f5f5f5',
                background: notif.is_read ? '#fff' : '#fafafa',
                cursor: 'pointer',
                display: 'flex',
                gap: 12
              }}
            >
              <div style={{ fontSize: 18 }}>{getIcon(notif.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: notif.is_read ? '400' : '600', color: '#1a1a1a' }}>{notif.title}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{notif.message}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{formatTime(notif.created_at)}</div>
              </div>
              {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#2e7d32', alignSelf: 'center' }} />}
            </div>
          ))
        )}
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPlayerCard, setShowPlayerCard] = useState(false)
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
    loadNotifications(session.user.id)
  }

  async function loadNotifications(userId) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }

  const navItems = [
    { href: '/dashboard', label: 'Accueil' },
    { href: '/dashboard/matches', label: 'Mes parties' },
    { href: '/dashboard/stats', label: 'Stats' },
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
          <div style={{ fontSize: 40 }}>🎾</div>
          <div style={{ color: '#666', marginTop: 16, fontSize: 14 }}>Chargement...</div>
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
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>

          {/* Nav Desktop */}
          <nav style={{ display: 'flex', gap: 8 }} className="desktop-nav">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: '500',
                    color: isActive ? '#1a1a1a' : '#666',
                    background: isActive ? '#f5f5f5' : 'transparent'
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                borderRadius: 8
              }}
            >
              <span style={{ fontSize: 20 }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#e53935',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Ma carte - desktop */}
            <button
              onClick={() => setShowPlayerCard(true)}
              style={{
                padding: '8px 14px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              className="desktop-card-btn"
            >
              🎴 Ma carte
            </button>

            {/* Avatar */}
            <Link href="/dashboard/profile" className="desktop-profile">
              <div style={{
                width: 36,
                height: 36,
                background: profile?.avatar_url ? `url(${profile.avatar_url})` : 'linear-gradient(135deg, #4ade80, #22c55e)',
                backgroundSize: 'cover',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600',
                fontSize: 14
              }}>
                {!profile?.avatar_url && (profile?.name?.[0] || 'U')}
              </div>
            </Link>

            {/* Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                fontSize: 20
              }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? '✕' : '☰'}
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
            padding: 16
          }} className="mobile-menu">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: '500',
                    color: isActive ? '#1a1a1a' : '#666',
                    background: isActive ? '#f5f5f5' : 'transparent',
                    marginBottom: 4
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: '500',
                color: '#666',
                marginBottom: 8
              }}
            >
              Mon profil
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); setShowPlayerCard(true) }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎴 Ma carte
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>

      {/* Panneau notifications */}
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
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 380,
            background: '#fff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <NotificationPanel 
              userId={user?.id}
              onClose={() => {
                setShowNotifications(false)
                if (user) loadNotifications(user.id)
              }}
            />
          </div>
        </>
      )}

      {/* Modal Ma carte */}
      <PlayerCardModal
        isOpen={showPlayerCard}
        onClose={() => setShowPlayerCard(false)}
        profile={profile}
        userId={user?.id}
      />

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
                color: isActive ? '#1a1a1a' : '#999',
                padding: '4px 12px'
              }}
            >
              <span style={{ fontSize: 20 }}>
                {item.href === '/dashboard' ? '🏠' : item.href.includes('matches') ? '🎾' : '📊'}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/dashboard/profile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            textDecoration: 'none',
            fontSize: 10,
            fontWeight: '600',
            color: pathname.includes('profile') ? '#1a1a1a' : '#999',
            padding: '4px 12px'
          }}
        >
          <span style={{ fontSize: 20 }}>👤</span>
          <span>Profil</span>
        </Link>
      </nav>

      {/* Styles responsives */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-profile { display: none !important; }
          .desktop-card-btn { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-bottom-nav { display: flex !important; }
          main { padding-bottom: 80px !important; }
        }
      `}</style>
    </div>
  )
}