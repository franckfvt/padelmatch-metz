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
  const [recentMatches, setRecentMatches] = useState([])
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
      // Vérifier si connecté
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      // Charger le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (profileError || !profileData) {
        console.error('Profile error:', profileError)
        setError('Joueur introuvable')
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Charger les parties récentes
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`*, clubs (name)`)
        .or(`team_a.cs.{${playerId}},team_b.cs.{${playerId}}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(5)

      setRecentMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Erreur lors du chargement')
      setLoading(false)
    }
  }

  function getWinRate() {
    if (!profile?.matches_played || profile.matches_played === 0) return 0
    return Math.round((profile.matches_won || 0) / profile.matches_played * 100)
  }

  function didWin(match) {
    if (!match.winner) return null
    const winningTeam = match.winner === 'team_a' ? match.team_a : match.team_b
    return winningTeam?.includes(playerId)
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

  // === SI C'EST SA PROPRE CARTE (connecté) ===
  if (isOwnProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        padding: '24px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: 550, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20 
          }}>
            <Link href="/dashboard" style={{ 
              color: 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              fontSize: 14 
            }}>
              ← Retour
            </Link>
            <h1 style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#fff',
              margin: 0
            }}>
              🎴 Ma carte joueur
            </h1>
            <div style={{ width: 50 }} />
          </div>
          
          {/* Carte format partage */}
          <div ref={cardRef} style={{ marginBottom: 24 }}>
            <PlayerCard 
              player={{
                name: profile.name,
                level: profile.level,
                position: profile.position,
                ambiance: profile.ambiance,
                frequency: profile.frequency,
                experience: profile.experience,
                region: profile.region || profile.city,
                avatar_url: profile.avatar_url,
                matches_played: profile.matches_played,
                reliability_score: profile.reliability_score
              }} 
              variant="share"
              standalone
            />
          </div>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {/* Partager */}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📤 Partager ma carte
            </button>

            {/* QR Code */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 20,
              textAlign: 'center'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                alt="QR Code"
                style={{ width: 150, height: 150, margin: '0 auto 12px', borderRadius: 8 }}
              />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
                Scanne ce QR code pour voir ma carte
              </p>
            </div>

            {/* Modifier mon profil */}
            <Link href="/dashboard/me" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✏️ Modifier mon profil
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // === SI C'EST UN AUTRE JOUEUR (QR code scanné) ===
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      padding: '20px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        
        {/* Carte joueur - Version verticale mobile compacte */}
        <div style={{ marginBottom: 16 }}>
          <PlayerCard 
            player={{
              name: profile.name,
              level: profile.level,
              position: profile.position,
              ambiance: profile.ambiance,
              frequency: profile.frequency,
              experience: profile.experience,
              region: profile.region || profile.city,
              avatar_url: profile.avatar_url,
              matches_played: profile.matches_played,
              reliability_score: profile.reliability_score
            }} 
            variant="profile"
          />
        </div>

        {/* Historique récent - Compact */}
        {recentMatches.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Dernières :</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {recentMatches.slice(0, 5).map((match, i) => {
                const won = didWin(match)
                return (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: won === true ? 'rgba(34, 197, 94, 0.25)' : won === false ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12
                    }}
                  >
                    {won === true ? '✅' : won === false ? '❌' : '➖'}
                  </div>
                )
              })}
            </div>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              {getWinRate()}%
            </span>
          </div>
        )}

        {/* CTA */}
        <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
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

        {/* Petite note */}
        <p style={{ 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: 12, 
          marginTop: 16 
        }}>
          Trouve des partenaires de padel près de chez toi
        </p>
      </div>
    </div>
  )
}