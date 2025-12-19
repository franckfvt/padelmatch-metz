'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PlayerCard from '@/app/components/PlayerCard'

export default function PublicProfileClient({ playerId }) {
  const [profile, setProfile] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [playerId])

  async function loadData() {
    try {
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
        background: '#f5f5f5',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            {error}
          </h1>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Découvrir PadelMatch
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 20, fontWeight: '700', color: '#fff', opacity: 0.8 }}>
              🎾 PadelMatch
            </div>
          </Link>
        </div>

        {/* Carte joueur */}
        <div style={{ marginBottom: 24 }}>
          <PlayerCard 
            player={{
              name: profile.name,
              level: profile.level,
              position: profile.position,
              ambiance: profile.ambiance,
              frequency: profile.frequency,
              experience: profile.experience,
              region: profile.region,
              avatar_url: profile.avatar_url
            }} 
            standalone 
          />
        </div>

        {/* Stats supplémentaires */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>
            📊 Statistiques
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
                {profile.matches_played || 0}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Parties</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#22c55e' }}>
                {profile.matches_won || 0}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Victoires</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
                {getWinRate()}%
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Win rate</div>
            </div>
          </div>

          {/* Streak et fiabilité */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {profile.current_streak > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#f59e0b' }}>
                  🔥 {profile.current_streak}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Série en cours</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: '700', color: '#22c55e' }}>
                ✅ {profile.reliability_score || 100}%
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Fiabilité</div>
            </div>
          </div>
        </div>

        {/* Historique récent */}
        {recentMatches.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
              Dernières parties
            </h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {recentMatches.slice(0, 5).map((match, i) => {
                const won = didWin(match)
                return (
                  <div
                    key={i}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: won === true ? '#22c55e' : won === false ? '#dc2626' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: '700'
                    }}
                  >
                    {won === true ? 'W' : won === false ? 'L' : '?'}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href="/auth" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: '18px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: 16
          }}>
            🎾 Jouer avec {profile.name}
          </button>
        </Link>

        {/* Lien PadelMatch */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14
        }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
            Crée ta carte sur PadelMatch →
          </Link>
        </div>
      </div>
    </div>
  )
}