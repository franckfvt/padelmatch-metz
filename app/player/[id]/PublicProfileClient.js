'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function PublicProfileClient() {
  const params = useParams()
  const playerId = params?.id
  const cardRef = useRef(null)
  
  const [profile, setProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = currentUser?.id === playerId

  useEffect(() => {
    if (playerId) {
      loadData()
    }
  }, [playerId])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (profileError || !profileData) {
        setError('Joueur introuvable')
        setLoading(false)
        return
      }

      setProfile(profileData)
      setLoading(false)
    } catch (error) {
      setError('Erreur lors du chargement')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e2e8f0 100%)',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#1a1a2e' }}>
            Joueur introuvable
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Ce profil n'existe pas ou n'est plus disponible.
          </p>
          <Link href="/" style={{
            display: 'block',
            padding: '16px 28px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: 15
          }}>
            Découvrir PadelMatch →
          </Link>
        </div>
      </div>
    )
  }

  // Données du joueur avec ID explicite
  const playerData = {
    id: playerId,
    name: profile.name,
    level: profile.level,
    position: profile.position,
    frequency: profile.frequency,
    city: profile.region || profile.city,
    avatar_url: profile.avatar_url,
    badge: profile.badge
  }

  // === PROPRE CARTE ===
  if (isOwnProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
        padding: '24px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24 
          }}>
            <Link href="/dashboard" style={{ 
              color: 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              fontSize: 14
            }}>
              ← Retour
            </Link>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
              🎴 Ma carte
            </h1>
            <div style={{ width: 50 }} />
          </div>
          
          <div ref={cardRef} style={{ marginBottom: 20 }}>
            <PlayerCard 
              player={playerData}
              variant="share"
              showQR={true}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${profile.name} - Joueur PadelMatch`,
                    text: `Découvre mon profil de joueur de padel !`,
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Lien copié !')
                }
              }}
              style={{
                padding: 16,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📤 Partager ma carte
            </button>

            <Link href="/dashboard/me" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: 14,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
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
      </div>
    )
  }

  // === CARTE D'UN AUTRE JOUEUR ===
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Carte - PAS de scale, juste centrée */}
      <div style={{ marginBottom: 32 }}>
        <PlayerCard 
          player={playerData}
          variant="mobile"
          showQR={false}
        />
      </div>

      {/* CTA - bien séparé */}
      <Link href="/" style={{ textDecoration: 'none', width: '100%', maxWidth: 280 }}>
        <div style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: 14,
          padding: '16px 24px',
          textAlign: 'center',
          color: '#fff',
          fontWeight: '700',
          fontSize: 15
        }}>
          🎾 Rejoindre PadelMatch
        </div>
      </Link>

      <p style={{ 
        textAlign: 'center', 
        color: 'rgba(255,255,255,0.4)', 
        fontSize: 12, 
        marginTop: 16 
      }}>
        Trouve des partenaires de padel près de chez toi
      </p>
    </div>
  )
}