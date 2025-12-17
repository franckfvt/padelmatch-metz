'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PublicProfilePage() {
  const params = useParams()
  const playerId = params.id

  const [profile, setProfile] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  const experienceEmojis = {
    'less6months': '🌱',
    '6months2years': '📈',
    '2to5years': '💪',
    'more5years': '🏆'
  }

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

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
        .select(`
          *,
          clubs (name)
        `)
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

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #2e7d32 100%)',
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
      background: 'linear-gradient(180deg, #1a1a1a 0%, #2e7d32 50%, #1a1a1a 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: 400,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 20, fontWeight: '700', color: '#fff', opacity: 0.8 }}>
              🎾 PadelMatch
            </div>
          </Link>
        </div>

        {/* Carte profil principale */}
        <div style={{
          background: '#fff',
          borderRadius: 32,
          padding: 32,
          marginBottom: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Avatar */}
          <div style={{
            width: 100,
            height: 100,
            background: '#f5f5f5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            margin: '0 auto 20px',
            border: '4px solid #2e7d32'
          }}>
            👤
          </div>

          {/* Nom */}
          <h1 style={{
            fontSize: 32,
            fontWeight: '800',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 12
          }}>
            {profile.name}
          </h1>

          {/* Badges niveau/ambiance */}
          <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 24
          }}>
            {profile.experience && (
              <span style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '8px 16px',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: '600'
              }}>
                {experienceEmojis[profile.experience]} {experienceLabels[profile.experience]}
              </span>
            )}
            {profile.ambiance && (
              <span style={{
                background: profile.ambiance === 'compet' ? '#fef3c7' :
                           profile.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
                color: profile.ambiance === 'compet' ? '#92400e' :
                       profile.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
                padding: '8px 16px',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: '600'
              }}>
                {ambianceEmojis[profile.ambiance]} {ambianceLabels[profile.ambiance]}
              </span>
            )}
          </div>

          {/* Stats principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24
          }}>
            <div style={{
              background: '#f5f5f5',
              borderRadius: 16,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#1a1a1a' }}>
                {profile.matches_played || 0}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Parties</div>
            </div>
            <div style={{
              background: '#e8f5e9',
              borderRadius: 16,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#2e7d32' }}>
                {profile.matches_won || 0}
              </div>
              <div style={{ fontSize: 12, color: '#2e7d32' }}>Victoires</div>
            </div>
            <div style={{
              background: '#f5f5f5',
              borderRadius: 16,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, fontWeight: '800', color: '#1a1a1a' }}>
                {getWinRate()}%
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Win rate</div>
            </div>
          </div>

          {/* Streak et fiabilité */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 24
          }}>
            {profile.current_streak > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: '700', color: '#f59e0b' }}>
                  🔥 {profile.current_streak}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Série en cours</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: '700', color: '#2e7d32' }}>
                ⭐ {profile.reliability_score || 100}%
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Fiabilité</div>
            </div>
          </div>

          {/* Historique récent */}
          {recentMatches.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#999',
                marginBottom: 12,
                textTransform: 'uppercase'
              }}>
                Dernières parties
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {recentMatches.slice(0, 5).map((match, i) => {
                  const won = didWin(match)
                  return (
                    <div
                      key={i}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: won === true ? '#2e7d32' : won === false ? '#dc2626' : '#999',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: '600'
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
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              🎾 Jouer avec {profile.name}
            </button>
          </Link>
        </div>

        {/* Lien PadelMatch */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14
        }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
            Crée ton profil sur PadelMatch
          </Link>
        </div>
      </div>
    </div>
  )
}