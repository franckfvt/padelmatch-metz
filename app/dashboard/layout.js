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
  const [showCardModal, setShowCardModal] = useState(false)
  const [copied, setCopied] = useState(false)

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

    if (!profileData?.experience && !profileData?.level) {
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

  function copyLink() {
    const link = `${window.location.origin}/player/${profile?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  // Helper pour couleur niveau
  const getLevelColor = (level) => {
    const lvl = parseInt(level) || 5
    if (lvl >= 8) return '#f59e0b'
    if (lvl >= 6) return '#a855f7'
    if (lvl >= 4) return '#3b82f6'
    return '#22c55e'
  }

  const levelColor = getLevelColor(profile?.level)

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
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🎾</span>
            <span style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
          </Link>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Bouton Ma Carte */}
            <button
              onClick={() => setShowCardModal(true)}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎴 Ma carte
            </button>

            {/* Avatar */}
            <Link href="/dashboard/profile">
              <div style={{
                width: 36,
                height: 36,
                background: '#f5f5f5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                cursor: 'pointer'
              }}>
                👤
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px 20px 100px'
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
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
      }}>
        {navItems.map(item => (
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
              color: pathname === item.href ? '#2e7d32' : '#999',
              padding: '4px 8px'
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Modal Ma Carte */}
      {showCardModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setShowCardModal(false)}
        >
          <div 
            style={{
              background: '#111',
              borderRadius: 20,
              padding: 20,
              width: '100%',
              maxWidth: 400
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Carte simplifiée inline */}
            <div style={{
              background: '#0a0a0f',
              borderRadius: 12,
              overflow: 'hidden',
              border: `2px solid ${levelColor}`,
              marginBottom: 16
            }}>
              {/* Header carte */}
              <div style={{
                background: `linear-gradient(135deg, ${levelColor}20, transparent)`,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                {/* Niveau */}
                <div style={{
                  width: 60,
                  height: 60,
                  background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${levelColor}`
                }}>
                  <span style={{ fontSize: 28, fontWeight: '900', color: levelColor }}>
                    {profile?.level || '?'}
                  </span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>NIVEAU</span>
                </div>

                {/* Nom + Style */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
                    {profile?.name || 'Joueur'}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {profile?.ambiance === 'compet' ? '🏆 Compétitif' : 
                     profile?.ambiance === 'loisir' ? '😎 Détente' : '⚡ Équilibré'}
                  </div>
                </div>
              </div>

              {/* Infos */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
                background: 'rgba(255,255,255,0.05)'
              }}>
                {[
                  { label: 'Poste', value: profile?.position === 'right' ? 'Droite' : profile?.position === 'left' ? 'Gauche' : 'Polyvalent' },
                  { label: 'Fréquence', value: profile?.frequency === 'intense' ? '4x+/sem' : profile?.frequency === 'often' ? '2-3x/sem' : profile?.frequency === 'regular' ? '1x/sem' : '1-2x/mois' },
                  { label: 'Expérience', value: profile?.experience === 'more5years' ? '+5 ans' : profile?.experience === '2to5years' ? '2-5 ans' : profile?.experience === '6months2years' ? '6m-2ans' : '<6 mois' },
                  { label: 'Région', value: profile?.region || 'France' }
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: 12,
                    background: '#0a0a0f',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <span style={{ fontSize: 12 }}>🎾</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>PADELMATCH</span>
              </div>
            </div>

            {/* Boutons */}
            <button
              onClick={copyLink}
              style={{
                width: '100%',
                padding: '14px',
                background: copied ? '#22c55e' : '#1877f2',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 10
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>
            
            <button
              onClick={() => setShowCardModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}