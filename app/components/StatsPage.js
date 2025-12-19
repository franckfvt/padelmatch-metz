'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LogMatchModal from './LogMatchModal'
import { VictoryCardMini } from './VictoryCard'
import { MonthlyRecapButton } from './MonthlyRecap'

/**
 * Page de stats complète style Strava
 * Affiche l'historique, les stats, et permet d'ajouter des parties
 */
export default function StatsPage({ userId }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [activeTab, setActiveTab] = useState('activity') // 'activity', 'stats'

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  async function loadData() {
    try {
      // Charger les stats globales
      const { data: statsData } = await supabase
        .rpc('get_player_full_stats', { p_user_id: userId })

      if (statsData && statsData.length > 0) {
        setStats(statsData[0])
      }

      // Charger l'historique récent
      const { data: matchesData } = await supabase
        .rpc('get_recent_matches', { p_user_id: userId, p_limit: 20 })

      setRecentMatches(matchesData || [])

    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mois actuel pour le récap
  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ color: '#666' }}>Chargement des stats...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header avec stats principales */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        color: '#fff',
        padding: '24px 20px 32px'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: '700', marginBottom: 20 }}>
          📊 Mes Stats
        </h1>

        {/* Stats principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: '700' }}>
              {stats?.total_matches || 0}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Parties</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#4ade80' }}>
              {stats?.win_rate || 0}%
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Victoires</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#fbbf24' }}>
              🔥 {stats?.current_streak || 0}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Série</div>
          </div>
        </div>

        {/* Bouton ajouter partie */}
        <button
          onClick={() => setShowLogModal(true)}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 14,
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          ➕ Enregistrer une partie
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            flex: 1,
            padding: 14,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '2px solid #2e7d32' : '2px solid transparent',
            color: activeTab === 'activity' ? '#2e7d32' : '#666',
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Activité
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            flex: 1,
            padding: 14,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'stats' ? '2px solid #2e7d32' : '2px solid transparent',
            color: activeTab === 'stats' ? '#2e7d32' : '#666',
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Statistiques
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {/* Tab Activité */}
        {activeTab === 'activity' && (
          <div>
            {/* Récap mensuel */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 }}>
                📅 Récaps mensuels
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MonthlyRecapButton userId={userId} month={currentMonth} />
                {stats?.total_matches > 0 && (
                  <MonthlyRecapButton userId={userId} month={lastMonth} />
                )}
              </div>
            </div>

            {/* Historique */}
            <h3 style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 }}>
              🎾 Historique des parties
            </h3>

            {recentMatches.length === 0 ? (
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
                border: '1px solid #eee'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
                <p style={{ color: '#666', marginBottom: 16 }}>
                  Aucune partie enregistrée
                </p>
                <button
                  onClick={() => setShowLogModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Ajouter ma première partie
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentMatches.map(match => (
                  <VictoryCardMini
                    key={match.id}
                    result={match.result}
                    score={match.score_us ? `${match.score_us}` : null}
                    partnerName={match.partner_name}
                    date={match.played_date}
                    location={match.location}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Stats */}
        {activeTab === 'stats' && (
          <div>
            {/* Wins vs Losses */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              border: '1px solid #eee'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 16 }}>
                🏆 Victoires / Défaites
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: 24,
                    background: '#e5e5e5',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    <div style={{
                      width: `${stats?.win_rate || 0}%`,
                      background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                      borderRadius: 12
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: '700', color: '#22c55e' }}>
                  {stats?.win_rate || 0}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666' }}>
                <span>🏆 {stats?.total_wins || 0} victoires</span>
                <span>😤 {stats?.total_losses || 0} défaites</span>
              </div>
            </div>

            {/* Stats détaillées */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              border: '1px solid #eee'
            }}>
              <h3 style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 16 }}>
                📈 Détails
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Total parties</span>
                  <span style={{ fontWeight: '700' }}>{stats?.total_matches || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Meilleure série</span>
                  <span style={{ fontWeight: '700', color: '#f59e0b' }}>
                    🔥 {stats?.best_streak || 0} victoires
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Série actuelle</span>
                  <span style={{ fontWeight: '700', color: stats?.current_streak > 0 ? '#22c55e' : '#666' }}>
                    {stats?.current_streak || 0} {stats?.current_streak > 0 ? '🔥' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>Ce mois-ci</span>
                  <span style={{ fontWeight: '700' }}>
                    {stats?.wins_this_month || 0}W / {(stats?.matches_this_month || 0) - (stats?.wins_this_month || 0)}L
                  </span>
                </div>
              </div>
            </div>

            {/* Favoris */}
            {(stats?.favorite_club || stats?.favorite_partner) && (
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                border: '1px solid #eee'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 16 }}>
                  ⭐ Favoris
                </h3>
                
                {stats?.favorite_club && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    marginBottom: stats?.favorite_partner ? 12 : 0
                  }}>
                    <span style={{ fontSize: 24 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#999' }}>Club préféré</div>
                      <div style={{ fontWeight: '600' }}>{stats.favorite_club}</div>
                    </div>
                  </div>
                )}

                {stats?.favorite_partner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🤝</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#999' }}>Partenaire favori</div>
                      <div style={{ fontWeight: '600' }}>{stats.favorite_partner}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'ajout de partie */}
      <LogMatchModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        userId={userId}
        onSuccess={() => {
          loadData()
          setShowLogModal(false)
        }}
      />
    </div>
  )
}