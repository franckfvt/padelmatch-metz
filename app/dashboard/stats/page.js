'use client'

/**
 * ============================================
 * PAGE STATS - VERSION SIMPLIFIÉE
 * ============================================
 * 
 * Fonctionnalités essentielles :
 * - Stats rapides (parties, victoires, winrate)
 * - Bouton "+ Ajouter une partie" 
 * - Historique des parties
 * - Partenaires fréquents
 * 
 * PAS de :
 * - Gamification excessive (badges, niveaux)
 * - Feed social (pas de masse critique)
 * - Objectifs mensuels
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// === DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  border: '#eae8e4',
  white: '#ffffff',
  
  green: '#22c55e',
  greenSoft: '#dcfce7',
  red: '#ef4444',
  redSoft: '#fee2e2',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

function getAvatarColor(name, index = 0) {
  if (name) return PLAYER_COLORS[name.charCodeAt(0) % 4]
  return PLAYER_COLORS[index % 4]
}

export default function StatsPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Stats
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    thisMonth: 0
  })
  
  // Historique & partenaires
  const [recentGames, setRecentGames] = useState([])
  const [frequentPartners, setFrequentPartners] = useState([])
  
  // Modal ajouter partie
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGame, setNewGame] = useState({
    result: 'win',
    score: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(profileData)

    // Stats depuis game_results
    const { data: gameResults } = await supabase
      .from('game_results')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })

    const games = gameResults || []
    const wins = games.filter(g => g.result === 'win').length
    const losses = games.filter(g => g.result === 'loss').length
    const total = wins + losses

    // Stats ce mois
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonth = games.filter(g => g.played_at >= firstOfMonth).length

    setStats({
      totalGames: total,
      wins,
      losses,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      thisMonth
    })

    // Dernières parties
    setRecentGames(games.slice(0, 10))

    // Partenaires fréquents (via matchs organisés et participés)
    const { data: participations } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        matches!inner (
          id,
          organizer_id,
          match_participants (
            user_id,
            profiles:user_id (id, name, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .limit(50)

    // Compter les partenaires
    const partnerCount = {}
    participations?.forEach(p => {
      p.matches?.match_participants?.forEach(mp => {
        if (mp.user_id !== userId && mp.profiles) {
          const key = mp.user_id
          if (!partnerCount[key]) {
            partnerCount[key] = { ...mp.profiles, count: 0 }
          }
          partnerCount[key].count++
        }
      })
    })

    const sorted = Object.values(partnerCount).sort((a, b) => b.count - a.count).slice(0, 5)
    setFrequentPartners(sorted)

    setLoading(false)
  }

  async function handleAddGame() {
    if (!newGame.date) return
    setSubmitting(true)

    try {
      await supabase.from('game_results').insert({
        user_id: user.id,
        result: newGame.result,
        score: newGame.score || null,
        played_at: newGame.date
      })

      // Refresh
      await loadData()
      setShowAddModal(false)
      setNewGame({ result: 'win', score: '', date: new Date().toISOString().split('T')[0] })
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'ajout')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'

    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="dot-pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: c, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>Mes Stats</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 18px',
            background: COLORS.ink,
            color: COLORS.white,
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>+</span> Ajouter
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12, 
        marginBottom: 28 
      }}>
        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          padding: 20, 
          textAlign: 'center',
          border: `1px solid ${COLORS.border}`
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.ink }}>{stats.totalGames}</div>
          <div style={{ fontSize: 13, color: COLORS.gray }}>parties</div>
        </div>

        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          padding: 20, 
          textAlign: 'center',
          border: `1px solid ${COLORS.border}`
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.ink }}>
            <span style={{ color: COLORS.green }}>{stats.wins}</span>
            <span style={{ color: COLORS.muted, fontWeight: 400 }}> - </span>
            <span style={{ color: COLORS.red }}>{stats.losses}</span>
          </div>
          <div style={{ fontSize: 13, color: COLORS.gray }}>V - D</div>
        </div>

        <div style={{ 
          background: COLORS.card, 
          borderRadius: 16, 
          padding: 20, 
          textAlign: 'center',
          border: `1px solid ${COLORS.border}`
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: stats.winRate >= 50 ? COLORS.green : COLORS.ink }}>
            {stats.winRate}%
          </div>
          <div style={{ fontSize: 13, color: COLORS.gray }}>winrate</div>
        </div>
      </div>

      {/* Ce mois-ci */}
      <div style={{ 
        background: COLORS.bgSoft, 
        borderRadius: 14, 
        padding: 16, 
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: COLORS.gray }}>📅 Ce mois-ci</span>
        <span style={{ fontWeight: 700, color: COLORS.ink }}>{stats.thisMonth} partie{stats.thisMonth > 1 ? 's' : ''}</span>
      </div>

      {/* Partenaires fréquents */}
      {frequentPartners.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 14 }}>
            🤝 Partenaires fréquents
          </h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {frequentPartners.map((partner, i) => (
              <div key={partner.id} style={{ 
                textAlign: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: partner.avatar_url ? 'transparent' : getAvatarColor(partner.name, i),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.white,
                  overflow: 'hidden',
                  marginBottom: 6
                }}>
                  {partner.avatar_url ? (
                    <img src={partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    partner.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{partner.name?.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{partner.count}x</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historique */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 14 }}>
          📊 Historique
        </h2>

        {recentGames.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            background: COLORS.bgSoft, 
            borderRadius: 16 
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <div style={{ color: COLORS.gray, marginBottom: 16 }}>Aucune partie enregistrée</div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 20px',
                background: COLORS.ink,
                color: COLORS.white,
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Ajouter ma première partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentGames.map((game, i) => (
              <div key={game.id || i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                background: COLORS.card,
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`
              }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: game.result === 'win' ? COLORS.greenSoft : COLORS.redSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18
                }}>
                  {game.result === 'win' ? '🏆' : '😤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: game.result === 'win' ? COLORS.green : COLORS.red 
                  }}>
                    {game.result === 'win' ? 'Victoire' : 'Défaite'}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.gray }}>
                    {game.score || 'Score non renseigné'}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {formatDate(game.played_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: Ajouter une partie */}
      {showAddModal && (
        <>
          <div 
            onClick={() => setShowAddModal(false)} 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 1000 
            }} 
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: COLORS.card,
            borderRadius: '24px 24px 0 0',
            padding: 24,
            zIndex: 1001,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              width: 40, 
              height: 4, 
              background: COLORS.border, 
              borderRadius: 2, 
              margin: '0 auto 20px' 
            }} />

            <h3 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 24, textAlign: 'center' }}>
              Ajouter une partie
            </h3>

            {/* Résultat */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: COLORS.gray, marginBottom: 10 }}>
                Résultat
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setNewGame({ ...newGame, result: 'win' })}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: newGame.result === 'win' ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    background: newGame.result === 'win' ? COLORS.greenSoft : COLORS.card,
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    color: newGame.result === 'win' ? COLORS.green : COLORS.gray
                  }}
                >
                  🏆 Victoire
                </button>
                <button
                  onClick={() => setNewGame({ ...newGame, result: 'loss' })}
                  style={{
                    flex: 1,
                    padding: 16,
                    border: newGame.result === 'loss' ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    background: newGame.result === 'loss' ? COLORS.redSoft : COLORS.card,
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    color: newGame.result === 'loss' ? COLORS.red : COLORS.gray
                  }}
                >
                  😤 Défaite
                </button>
              </div>
            </div>

            {/* Score */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: COLORS.gray, marginBottom: 10 }}>
                Score (optionnel)
              </label>
              <input
                type="text"
                value={newGame.score}
                onChange={(e) => setNewGame({ ...newGame, score: e.target.value })}
                placeholder="Ex: 6-4 6-3"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  fontSize: 15
                }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: COLORS.gray, marginBottom: 10 }}>
                Date
              </label>
              <input
                type="date"
                value={newGame.date}
                onChange={(e) => setNewGame({ ...newGame, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  fontSize: 15
                }}
              />
            </div>

            {/* Bouton */}
            <button
              onClick={handleAddGame}
              disabled={submitting}
              style={{
                width: '100%',
                padding: 16,
                background: COLORS.ink,
                color: COLORS.white,
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {submitting ? 'Enregistrement...' : '✓ Enregistrer'}
            </button>
          </div>
        </>
      )}

      <style jsx global>{`
        input:focus {
          outline: none;
          border-color: ${COLORS.ink} !important;
        }
        .dot-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}