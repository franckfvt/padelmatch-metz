'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StatsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [playedWith, setPlayedWith] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('historique')
  const [filter, setFilter] = useState('all') // all, won, lost

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      // Mon profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // Mes parties (où je suis orga ou participant)
      // 1. Parties où je suis organisateur
      const { data: orgMatches } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          match_participants (
            user_id,
            team,
            profiles (id, name, level, avatar_url)
          )
        `)
        .eq('organizer_id', session.user.id)
        .in('status', ['completed', 'open', 'full'])
        .order('match_date', { ascending: false })

      // 2. Parties où je suis participant
      const { data: participations } = await supabase
        .from('match_participants')
        .select('match_id, team')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      let partMatches = []
      if (participations && participations.length > 0) {
        const matchIds = participations.map(p => p.match_id)
        const { data: partData } = await supabase
          .from('matches')
          .select(`
            *,
            clubs (name, address),
            profiles!matches_organizer_id_fkey (id, name),
            match_participants (
              user_id,
              team,
              profiles (id, name, level, avatar_url)
            )
          `)
          .in('id', matchIds)
          .in('status', ['completed', 'open', 'full'])
          .order('match_date', { ascending: false })
        
        // Ajouter l'info de mon équipe
        partMatches = (partData || []).map(m => {
          const myPart = participations.find(p => p.match_id === m.id)
          return { ...m, myTeam: myPart?.team }
        })
      }

      // Fusionner et dédupliquer
      const allMatches = [...(orgMatches || []).map(m => ({ ...m, isOrganizer: true, myTeam: 'A' })), ...partMatches]
      const uniqueMatches = allMatches.reduce((acc, match) => {
        if (!acc.find(m => m.id === match.id)) {
          acc.push(match)
        }
        return acc
      }, [])

      // Trier par date (plus récent d'abord)
      uniqueMatches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

      // Calculer si j'ai gagné ou perdu
      const matchesWithResult = uniqueMatches.map(m => {
        let result = null
        if (m.status === 'completed' && m.winner) {
          if (m.isOrganizer) {
            // Si je suis orga, je suis en équipe A par défaut
            result = m.winner === 'A' ? 'won' : 'lost'
          } else if (m.myTeam) {
            result = m.winner === m.myTeam ? 'won' : 'lost'
          }
        }
        return { ...m, result }
      })

      setMatches(matchesWithResult)

      // Extraire les joueurs avec qui j'ai joué
      const playersMap = new Map()
      matchesWithResult.forEach(match => {
        match.match_participants?.forEach(p => {
          if (p.user_id !== session.user.id && p.profiles) {
            const existing = playersMap.get(p.user_id) || { 
              ...p.profiles, 
              gamesPlayed: 0, 
              gamesWon: 0 
            }
            existing.gamesPlayed++
            if (match.result === 'won') existing.gamesWon++
            playersMap.set(p.user_id, existing)
          }
        })
      })
      
      // Trier par nombre de parties jouées ensemble
      const playersArray = Array.from(playersMap.values())
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      
      setPlayedWith(playersArray)

      // Charger mes favoris
      const { data: favoritesData } = await supabase
        .from('player_favorites')
        .select(`
          favorite_id,
          profiles:favorite_id (id, name, level, avatar_url, reliability_score)
        `)
        .eq('user_id', session.user.id)

      setFavorites(favoritesData?.map(f => f.profiles).filter(Boolean) || [])

      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function removeFavorite(playerId) {
    try {
      await supabase
        .from('player_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_id', playerId)

      setFavorites(favorites.filter(f => f.id !== playerId))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'

    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  // Stats calculées
  const totalPlayed = matches.filter(m => m.status === 'completed').length
  const totalWon = matches.filter(m => m.result === 'won').length
  const totalLost = matches.filter(m => m.result === 'lost').length
  const winRate = totalPlayed > 0 ? Math.round(totalWon / totalPlayed * 100) : 0

  // Filtrer les parties
  const filteredMatches = matches.filter(m => {
    if (filter === 'won') return m.result === 'won'
    if (filter === 'lost') return m.result === 'lost'
    return true
  })

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
        <div style={{ color: '#666' }}>Chargement de tes stats...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>
          Mes statistiques
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Ton historique et tes performances
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a' }}>
            {profile?.matches_played || totalPlayed}
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
            Parties jouées
          </div>
        </div>

        <div style={{
          background: '#dcfce7',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: '700', color: '#166534' }}>
            {profile?.matches_won || totalWon}
          </div>
          <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
            Victoires
          </div>
        </div>

        <div style={{
          background: '#fee2e2',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: '700', color: '#dc2626' }}>
            {totalLost}
          </div>
          <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>
            Défaites
          </div>
        </div>

        <div style={{
          background: '#fef3c7',
          borderRadius: 16,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, fontWeight: '700', color: '#92400e' }}>
            {winRate}%
          </div>
          <div style={{ fontSize: 13, color: '#92400e', marginTop: 4 }}>
            Taux victoire
          </div>
        </div>
      </div>

      {/* Streak & Level */}
      <div style={{
        background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700' }}>
            ⭐ {profile?.level}/10
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Niveau</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#fbbf24' }}>
            🔥 {profile?.current_streak || 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Série actuelle</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700' }}>
            🏆 {profile?.best_streak || 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Meilleure série</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: '700', color: '#4ade80' }}>
            ✓ {profile?.reliability_score || 100}%
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Fiabilité</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        border: '1px solid #eee'
      }}>
        {[
          { id: 'historique', label: '📜 Historique' },
          { id: 'joueurs', label: '👥 Joueurs' },
          { id: 'favoris', label: '⭐ Favoris' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#666',
              fontWeight: '600',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Historique */}
      {activeTab === 'historique' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'won', label: '✓ Victoires' },
              { id: 'lost', label: '✕ Défaites' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  border: filter === f.id ? '2px solid #1a1a1a' : '2px solid #eee',
                  borderRadius: 8,
                  background: filter === f.id ? '#fafafa' : '#fff',
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: '#1a1a1a'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMatches.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
              <p style={{ color: '#666', marginBottom: 16 }}>
                {filter === 'all' 
                  ? "Tu n'as pas encore joué de parties" 
                  : `Aucune ${filter === 'won' ? 'victoire' : 'défaite'} pour le moment`}
              </p>
              {filter === 'all' && (
                <Link href="/dashboard" style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Créer une partie
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredMatches.map(match => (
                <Link 
                  key={match.id}
                  href={`/dashboard/match/${match.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 16,
                    border: match.result === 'won' 
                      ? '2px solid #22c55e' 
                      : match.result === 'lost' 
                      ? '2px solid #ef4444' 
                      : '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        {/* Badge résultat */}
                        {match.result && (
                          <span style={{
                            background: match.result === 'won' ? '#dcfce7' : '#fee2e2',
                            color: match.result === 'won' ? '#166534' : '#dc2626',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: '700'
                          }}>
                            {match.result === 'won' ? '✓ VICTOIRE' : '✕ DÉFAITE'}
                          </span>
                        )}
                        {match.status === 'open' && (
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: '700'
                          }}>
                            À VENIR
                          </span>
                        )}
                        <span style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }}>
                          {formatDate(match.match_date)} • {formatTime(match.match_time)}
                        </span>
                      </div>
                      
                      <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}>
                        📍 {match.clubs?.name}
                      </div>

                      {/* Score */}
                      {match.status === 'completed' && match.score_set1_a && (
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: '600', 
                          color: '#1a1a1a',
                          background: '#f5f5f5',
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6
                        }}>
                          {match.score_set1_a}-{match.score_set1_b}
                          {match.score_set2_a && ` / ${match.score_set2_a}-${match.score_set2_b}`}
                          {match.score_set3_a && ` / ${match.score_set3_a}-${match.score_set3_b}`}
                        </div>
                      )}

                      {/* Joueurs */}
                      {match.match_participants && match.match_participants.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                          {match.match_participants.slice(0, 4).map((p, i) => (
                            p.profiles?.avatar_url ? (
                              <img
                                key={i}
                                src={p.profiles.avatar_url}
                                alt=""
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #fff',
                                  marginLeft: i > 0 ? -8 : 0
                                }}
                              />
                            ) : (
                              <div
                                key={i}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: '#e5e5e5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 12,
                                  border: '2px solid #fff',
                                  marginLeft: i > 0 ? -8 : 0
                                }}
                              >
                                👤
                              </div>
                            )
                          ))}
                          {match.match_participants.length > 4 && (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: '#1a1a1a',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: '700',
                              marginLeft: -8
                            }}>
                              +{match.match_participants.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ color: '#999', fontSize: 20 }}>→</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Joueurs */}
      {activeTab === 'joueurs' && (
        <div>
          <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
            Les joueurs avec qui tu as joué le plus
          </p>

          {playedWith.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ color: '#666' }}>
                Tu n'as pas encore joué avec d'autres joueurs
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {playedWith.map((player, index) => (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 14,
                    border: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    {/* Rang */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: index < 3 ? '#fbbf24' : '#f5f5f5',
                      color: index < 3 ? '#1a1a1a' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: 12
                    }}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#e5e5e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18
                      }}>
                        👤
                      </div>
                    )}

                    {/* Infos */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        ⭐ {player.level}/10 · {player.gamesPlayed} partie{player.gamesPlayed > 1 ? 's' : ''} ensemble
                      </div>
                    </div>

                    {/* Win rate ensemble */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: '700',
                        color: player.gamesWon / player.gamesPlayed >= 0.5 ? '#22c55e' : '#f59e0b'
                      }}>
                        {Math.round(player.gamesWon / player.gamesPlayed * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: '#999' }}>win</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Favoris */}
      {activeTab === 'favoris' && (
        <div>
          <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
            Tes joueurs favoris - invite-les rapidement pour tes prochaines parties
          </p>

          {favorites.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <p style={{ color: '#666', marginBottom: 8 }}>
                Tu n'as pas encore de joueurs favoris
              </p>
              <p style={{ color: '#999', fontSize: 13 }}>
                Clique sur un joueur dans une partie pour l'ajouter à tes favoris
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {favorites.map(player => (
                <div
                  key={player.id}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 14,
                    border: '2px solid #fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  {/* Avatar */}
                  <Link href={`/player/${player.id}`}>
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt=""
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        cursor: 'pointer'
                      }}>
                        👤
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                      ⭐ {player.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Niveau {player.level}/10 · {player.reliability_score || 100}% fiable
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => removeFavorite(player.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}