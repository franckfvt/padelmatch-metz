'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CreateMatchModal from '@/app/components/CreateMatchModal'

export default function MesPartiesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming') // upcoming, history, stats
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Data
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [pastMatches, setPastMatches] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0,
    asTeamA: 0,
    asTeamB: 0,
    favoriteClub: null,
    favoritePartners: []
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUser(session.user)

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setProfile(profileData)

    // Prochaines parties
    const { data: upcoming } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        team,
        status,
        matches (
          id, match_date, match_time, status, spots_available,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name)
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .gte('matches.match_date', new Date().toISOString().split('T')[0])
      .order('matches(match_date)', { ascending: true })

    // Ajouter les parties que j'organise
    const { data: organized } = await supabase
      .from('matches')
      .select(`
        id, match_date, match_time, status, spots_available,
        clubs (name, address),
        profiles!matches_organizer_id_fkey (name)
      `)
      .eq('organizer_id', session.user.id)
      .gte('match_date', new Date().toISOString().split('T')[0])
      .order('match_date', { ascending: true })

    // Combiner et dédupliquer
    const upcomingIds = new Set((upcoming || []).map(u => u.match_id))
    const allUpcoming = [
      ...(upcoming || []).map(u => ({ ...u.matches, isParticipant: true, team: u.team })),
      ...(organized || []).filter(m => !upcomingIds.has(m.id)).map(m => ({ ...m, isOrganizer: true }))
    ].sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

    setUpcomingMatches(allUpcoming)

    // Historique (parties passées)
    const { data: past } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        team,
        matches (
          id, match_date, match_time, status, winner,
          score_set1_a, score_set1_b, score_set2_a, score_set2_b, score_set3_a, score_set3_b,
          clubs (name),
          profiles!matches_organizer_id_fkey (name)
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', new Date().toISOString().split('T')[0])
      .order('matches(match_date)', { ascending: false })
      .limit(50)

    const pastWithResults = (past || [])
      .filter(p => p.matches)
      .map(p => ({
        ...p.matches,
        myTeam: p.team,
        won: p.matches.winner === p.team,
        lost: p.matches.winner && p.matches.winner !== p.team
      }))

    setPastMatches(pastWithResults)

    // Calculer les stats
    const wins = pastWithResults.filter(m => m.won).length
    const losses = pastWithResults.filter(m => m.lost).length
    const total = pastWithResults.length

    // Parties organisées
    const { count: organizedCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    // Club préféré
    const clubCounts = {}
    pastWithResults.forEach(m => {
      if (m.clubs?.name) {
        clubCounts[m.clubs.name] = (clubCounts[m.clubs.name] || 0) + 1
      }
    })
    const favoriteClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0]

    setStats({
      total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      organized: organizedCount || 0,
      asTeamA: pastWithResults.filter(m => m.myTeam === 'A').length,
      asTeamB: pastWithResults.filter(m => m.myTeam === 'B').length,
      favoriteClub: favoriteClub ? favoriteClub[0] : null
    })

    setLoading(false)
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.substring(0, 5)
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
            Mes parties
          </h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            Tes prochaines parties et ton historique
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          + Créer une partie
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid #e5e5e5',
        paddingBottom: 12
      }}>
        {[
          { id: 'upcoming', label: '📅 À venir', count: upcomingMatches.length },
          { id: 'history', label: '📜 Historique', count: pastMatches.length },
          { id: 'stats', label: '📊 Stats', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#666',
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 12
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* === TAB: À VENIR === */}
      {activeTab === 'upcoming' && (
        <div>
          {upcomingMatches.length === 0 ? (
            <div style={{
              background: '#f9f9f9',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                Pas de partie prévue
              </h3>
              <p style={{ color: '#666', marginBottom: 20 }}>
                Crée une partie ou rejoins-en une !
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '14px 28px',
                  background: '#22c55e',
                  color: '#fff',
                  borderRadius: 12,
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: 15
                }}
              >
                Créer une partie
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingMatches.map(match => (
                <Link
                  key={match.id}
                  href={`/dashboard/match/${match.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: '#fff',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #e5e5e5',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Date */}
                  <div style={{
                    width: 60,
                    height: 60,
                    background: '#e8f5e9',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: 11, color: '#2e7d32', fontWeight: '600' }}>
                      {formatDate(match.match_date).split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>
                      {new Date(match.match_date).getDate()}
                    </div>
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: 15,
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {match.clubs?.name || 'Lieu à définir'}
                      {match.isOrganizer && (
                        <span style={{
                          fontSize: 10,
                          background: '#ffd700',
                          color: '#000',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontWeight: '600'
                        }}>
                          ORGA
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatTime(match.match_time)} • {4 - (match.spots_available || 0)}/4 joueurs
                    </div>
                  </div>

                  {/* Équipe */}
                  {match.team && (
                    <div style={{
                      padding: '6px 12px',
                      background: match.team === 'A' ? '#e8f5e9' : '#e3f2fd',
                      color: match.team === 'A' ? '#2e7d32' : '#1976d2',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      Équipe {match.team}
                    </div>
                  )}

                  {/* Flèche */}
                  <div style={{ color: '#ccc', fontSize: 18 }}>→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB: HISTORIQUE === */}
      {activeTab === 'history' && (
        <div>
          {pastMatches.length === 0 ? (
            <div style={{
              background: '#f9f9f9',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                Pas encore d'historique
              </h3>
              <p style={{ color: '#666' }}>
                Tes parties passées apparaîtront ici
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastMatches.map(match => (
                <Link
                  key={match.id}
                  href={`/dashboard/match/${match.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: '#fff',
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #e5e5e5'
                  }}
                >
                  {/* Résultat */}
                  <div style={{
                    width: 60,
                    height: 60,
                    background: match.won ? '#e8f5e9' : match.lost ? '#ffebee' : '#f5f5f5',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      fontSize: 24,
                      marginBottom: 2
                    }}>
                      {match.won ? '🏆' : match.lost ? '😔' : '⏳'}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: '600',
                      color: match.won ? '#2e7d32' : match.lost ? '#c62828' : '#666'
                    }}>
                      {match.won ? 'Victoire' : match.lost ? 'Défaite' : 'En attente'}
                    </div>
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: 15, marginBottom: 4 }}>
                      {match.clubs?.name || 'Partie'}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {new Date(match.match_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Score */}
                  {match.winner && (
                    <div style={{
                      textAlign: 'right',
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      {match.score_set1_a}-{match.score_set1_b}
                      {match.score_set2_a && ` / ${match.score_set2_a}-${match.score_set2_b}`}
                      {match.score_set3_a && ` / ${match.score_set3_a}-${match.score_set3_b}`}
                    </div>
                  )}

                  {/* Équipe */}
                  <div style={{
                    padding: '6px 12px',
                    background: match.myTeam === 'A' ? '#e8f5e9' : '#e3f2fd',
                    color: match.myTeam === 'A' ? '#2e7d32' : '#1976d2',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    Éq. {match.myTeam}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB: STATS === */}
      {activeTab === 'stats' && (
        <div>
          {/* Stats principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}>
            <StatCard
              icon="🎾"
              value={stats.total}
              label="Parties jouées"
              color="#1a1a1a"
            />
            <StatCard
              icon="🏆"
              value={stats.wins}
              label="Victoires"
              color="#2e7d32"
            />
            <StatCard
              icon="📉"
              value={stats.losses}
              label="Défaites"
              color="#c62828"
            />
            <StatCard
              icon="📈"
              value={`${stats.winRate}%`}
              label="Taux de victoire"
              color="#1976d2"
            />
          </div>

          {/* Stats secondaires */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #e5e5e5'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
              Détails
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatRow 
                label="Parties organisées" 
                value={stats.organized}
                icon="👑"
              />
              <StatRow 
                label="En Équipe A" 
                value={stats.asTeamA}
                icon="🅰️"
              />
              <StatRow 
                label="En Équipe B" 
                value={stats.asTeamB}
                icon="🅱️"
              />
              {stats.favoriteClub && (
                <StatRow 
                  label="Club préféré" 
                  value={stats.favoriteClub}
                  icon="📍"
                />
              )}
            </div>
          </div>

          {/* Win rate visual */}
          {stats.total > 0 && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #e5e5e5',
              marginTop: 16
            }}>
              <h3 style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                Ratio victoires/défaites
              </h3>
              
              <div style={{
                height: 24,
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                background: '#f0f0f0'
              }}>
                <div style={{
                  width: `${stats.winRate}%`,
                  background: 'linear-gradient(90deg, #2e7d32, #4caf50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: '600',
                  minWidth: stats.winRate > 10 ? 'auto' : 0
                }}>
                  {stats.winRate > 15 && `${stats.wins}V`}
                </div>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: 12,
                  fontWeight: '600'
                }}>
                  {stats.losses > 0 && `${stats.losses}D`}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontSize: 12,
                color: '#999'
              }}>
                <span>Victoires: {stats.wins}</span>
                <span>Défaites: {stats.losses}</span>
              </div>
            </div>
          )}

          {/* Message si pas de stats */}
          {stats.total === 0 && (
            <div style={{
              background: '#f9f9f9',
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              marginTop: 16
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                Pas encore de stats
              </h3>
              <p style={{ color: '#666' }}>
                Joue des parties pour voir tes statistiques !
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal création de partie */}
      <CreateMatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(match) => {
          setShowCreateModal(false)
          router.push(`/dashboard/match/${match.id}`)
        }}
        profile={profile}
        userId={user?.id}
      />
    </div>
  )
}

// Composant StatCard
function StatCard({ icon, value, label, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #e5e5e5',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ 
        fontSize: 32, 
        fontWeight: '700', 
        color,
        marginBottom: 4
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#666' }}>{label}</div>
    </div>
  )
}

// Composant StatRow
function StatRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: '#666' }}>{label}</span>
      </div>
      <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{value}</span>
    </div>
  )
}