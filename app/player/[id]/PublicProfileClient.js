'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function PublicProfileClient() {
  const params = useParams()
  const playerId = params?.id
  
  const [profile, setProfile] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (playerId) {
      loadData()
    }
  }, [playerId])

  async function loadData() {
    try {
      console.log('Loading player ID:', playerId)
      
      // Charger le profil (doit être accessible publiquement via RLS)
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        {/* Carte joueur - Grande */}
        <div style={{ marginBottom: 20 }}>
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
            standalone
            size="large"
          />
        </div>

        {/* Stats rapides */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>
              {profile.matches_played || 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Parties</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#22c55e' }}>
              {profile.matches_won || 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Victoires</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: '800', color: '#3b82f6' }}>
              {getWinRate()}%
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Win rate</div>
          </div>
        </div>

        {/* Historique récent */}
        {recentMatches.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textAlign: 'center' }}>
              Dernières parties
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {recentMatches.slice(0, 5).map((match, i) => {
                const won = didWin(match)
                return (
                  <div
                    key={i}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: won === true ? 'rgba(34, 197, 94, 0.2)' : won === false ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}
                  >
                    {won === true ? '✅' : won === false ? '❌' : '➖'}
                  </div>
                )
              })}
            </div>
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