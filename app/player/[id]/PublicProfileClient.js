'use client'

/**
 * ============================================
 * PAGE PROFIL PUBLIC - SIMPLE ET PROPRE
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function PublicProfileClient() {
  const params = useParams()
  const playerId = params?.id
  
  const [profile, setProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (playerId) loadData()
  }, [playerId])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (err || !data) {
        setError('Joueur introuvable')
      } else {
        setProfile(data)
      }
    } catch (e) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a2e',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          maxWidth: 360
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1a1a2e' }}>
            Joueur introuvable
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Ce profil n'existe pas.
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Découvrir PadelMatch
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === playerId

  const playerData = {
    name: profile.name,
    level: profile.level,
    position: profile.position,
    frequency: profile.frequency,
    city: profile.region || profile.city,
    avatar_url: profile.avatar_url,
    badge: profile.badge
  }

  // Own profile
  if (isOwnProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #334155, #1e293b)',
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>
              ← Retour
            </Link>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>🎴 Ma carte</h1>
            <div style={{ width: 50 }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <PlayerCard player={playerData} variant="share" />
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${profile.name} - PadelMatch`, url: window.location.href })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Lien copié !')
              }
            }}
            style={{
              width: '100%',
              padding: 16,
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            📤 Partager ma carte
          </button>

          <Link href="/dashboard/me" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{
              width: '100%',
              padding: 14,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              ✏️ Modifier mon profil
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Other player's profile
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #334155, #1e293b)',
      padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ marginBottom: 32 }}>
        <PlayerCard player={playerData} variant="mobile" />
      </div>

      <Link href="/" style={{ textDecoration: 'none', width: '100%', maxWidth: 280 }}>
        <div style={{
          background: '#22c55e',
          borderRadius: 14,
          padding: 16,
          textAlign: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15
        }}>
          🎾 Rejoindre PadelMatch
        </div>
      </Link>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 16 }}>
        Trouve des partenaires de padel près de chez toi
      </p>
    </div>
  )
}