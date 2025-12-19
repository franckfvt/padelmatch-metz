'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'

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
  chart: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
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
  bell: ({ color = 'currentColor', size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
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

// Panneau de notifications
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
      .limit(30)
    
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(id) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
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
    <>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: '700', margin: 0 }}>Notifications</h3>
          {unread > 0 && <span style={{ fontSize: 12, color: '#666' }}>{unread} non lue{unread > 1 ? 's' : ''}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
      </div>

      {/* Actions */}
      {unread > 0 && (
        <div style={{ padding: '8px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <button
            onClick={markAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#2e7d32',
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Tout marquer comme lu
          </button>
        </div>
      )}

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Chargement...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <p style={{ color: '#666', margin: 0 }}>Aucune notification</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              style={{
                padding: 16,
                borderBottom: '1px solid #f0f0f0',
                background: notif.is_read ? '#fff' : '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                gap: 12
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: notif.is_read ? '#f5f5f5' : '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}>
                {getIcon(notif.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: notif.is_read ? '500' : '600', fontSize: 14 }}>{notif.title}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{notif.message}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{formatTime(notif.created_at)}</div>
              </div>
              {!notif.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#2e7d32', alignSelf: 'center' }} />
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPlayerCard, setShowPlayerCard] = useState(false)

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

    // Charger les notifications non lues
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
    { href: '/dashboard', label: 'Accueil', icon: 'home' },
    { href: '/dashboard/matches', label: 'Mes parties', icon: 'tennis' },
    { href: '/dashboard/stats', label: 'Stats', icon: 'chart' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Cloche de notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                borderRadius: 10
              }}
            >
              <Icons.bell size={22} color="#666" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#e53935',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Bouton Ma carte */}
            <button
              onClick={() => setShowPlayerCard(true)}
              style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                color: '#fff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 10,
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
            {/* Bouton Ma carte dans le menu mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setShowPlayerCard(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: '600',
                color: '#fff',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              🎴 Ma carte
            </button>
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

      {/* Panneau de notifications */}
      {showNotifications && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease'
        }}>
          <NotificationPanel 
            userId={user?.id}
            onClose={() => {
              setShowNotifications(false)
              if (user) loadNotifications(user.id)
            }}
          />
        </div>
      )}

      {/* Overlay pour fermer les notifications */}
      {showNotifications && (
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
        {/* Bouton Ma carte dans la bottom nav */}
        <button
          onClick={() => setShowPlayerCard(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            fontSize: 10,
            fontWeight: '600',
            color: '#1a1a1a',
            padding: '4px 8px',
            minWidth: 60,
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 20 }}>🎴</span>
          <span>Carte</span>
        </button>
      </nav>

      {/* Styles responsives */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-profile {
            display: none !important;
          }
          .desktop-card-btn {
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
          .desktop-card-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}