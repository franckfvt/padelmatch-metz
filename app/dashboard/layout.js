'use client'

/**
 * ============================================
 * LAYOUT DASHBOARD - VERSION DÉFINITIVE
 * ============================================
 * 
 * Navbar: Accueil | Parties | Stats | [🎴] [🔔] | Profil
 * 
 * ⚠️ NE PLUS MODIFIER CE FICHIER ⚠️
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

  // 4 onglets principaux
  const navItems = [
    { href: '/dashboard', label: 'Accueil', icon: '🏠' },
    { href: '/dashboard/matches', label: 'Parties', icon: '🎾' },
    { href: '/dashboard/stats', label: 'Stats', icon: '📊' },
    { href: '/dashboard/profile', label: 'Profil', icon: '👤' },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
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
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* ============================================ */}
      {/* NAVBAR - HAUT DE PAGE - STICKY              */}
      {/* ============================================ */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
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
            gap: 8,
            flexShrink: 0
          }}>
            <span style={{ fontSize: 26 }}>🎾</span>
            <span style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: '#111',
              display: 'none'
            }} className="logo-text">
              PadelMatch
            </span>
          </Link>

          {/* Navigation centrale */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {/* Accueil */}
            <Link href="/dashboard" style={{
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: '600',
              color: pathname === '/dashboard' ? '#111' : '#666',
              background: pathname === '/dashboard' ? '#f3f4f6' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>🏠</span>
              <span className="nav-label">Accueil</span>
            </Link>

            {/* Parties */}
            <Link href="/dashboard/matches" style={{
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: '600',
              color: pathname === '/dashboard/matches' ? '#111' : '#666',
              background: pathname === '/dashboard/matches' ? '#f3f4f6' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>🎾</span>
              <span className="nav-label">Parties</span>
            </Link>

            {/* Stats */}
            <Link href="/dashboard/stats" style={{
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: '600',
              color: pathname === '/dashboard/stats' ? '#111' : '#666',
              background: pathname === '/dashboard/stats' ? '#f3f4f6' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>📊</span>
              <span className="nav-label">Stats</span>
            </Link>

            {/* Séparateur */}
            <div style={{ 
              width: 1, 
              height: 24, 
              background: '#e5e7eb',
              margin: '0 8px'
            }} />

            {/* Bouton Ma Carte */}
            <button
              onClick={() => setShowCardModal(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: '#f3f4f6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}
              title="Ma carte joueur"
            >
              🎴
            </button>

            {/* Bouton Notifications */}
            <button
              onClick={() => {/* TODO: Ouvrir panneau notifs */}}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: '#f3f4f6',
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
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Séparateur */}
            <div style={{ 
              width: 1, 
              height: 24, 
              background: '#e5e7eb',
              margin: '0 8px'
            }} />

            {/* Profil */}
            <Link href="/dashboard/profile" style={{
              padding: '8px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: '600',
              color: pathname === '/dashboard/profile' ? '#111' : '#666',
              background: pathname === '/dashboard/profile' ? '#f3f4f6' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>👤</span>
              <span className="nav-label">Profil</span>
            </Link>
          </nav>

          {/* Spacer pour équilibrer sur desktop */}
          <div style={{ width: 60 }} className="spacer" />
        </div>
      </header>

      {/* ============================================ */}
      {/* CONTENU PRINCIPAL                           */}
      {/* ============================================ */}
      <main style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        {children}
      </main>

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
        .nav-label {
          display: none;
        }
        .logo-text {
          display: none !important;
        }
        .spacer {
          display: none !important;
        }
        
        @media (min-width: 640px) {
          .nav-label {
            display: inline !important;
          }
          .logo-text {
            display: inline !important;
          }
          .spacer {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}