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
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [showAllPlayers, setShowAllPlayers] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(profileData)

      // Mes parties (orga)
      const { data: orgMatches } = await supabase
        .from('matches')
        .select(`*, clubs (name), match_participants (user_id, team, profiles (id, name, level, avatar_url))`)
        .eq('organizer_id', session.user.id)
        .in('status', ['completed', 'open', 'full'])
        .order('match_date', { ascending: false })

      // Mes parties (participant)
      const { data: participations } = await supabase
        .from('match_participants')
        .select('match_id, team')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      let partMatches = []
      if (participations?.length > 0) {
        const { data } = await supabase
          .from('matches')
          .select(`*, clubs (name), profiles!matches_organizer_id_fkey (name), match_participants (user_id, team, profiles (id, name, level, avatar_url))`)
          .in('id', participations.map(p => p.match_id))
          .in('status', ['completed', 'open', 'full'])
          .order('match_date', { ascending: false })
        
        partMatches = (data || []).map(m => ({ ...m, myTeam: participations.find(p => p.match_id === m.id)?.team }))
      }

      // Fusionner et calculer résultats
      const allMatches = [...(orgMatches || []).map(m => ({ ...m, isOrganizer: true, myTeam: 'A' })), ...partMatches]
      const unique = allMatches.reduce((acc, m) => acc.find(x => x.id === m.id) ? acc : [...acc, m], [])
      unique.sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

      const withResults = unique.map(m => ({
        ...m,
        result: m.status === 'completed' && m.winner ? (m.winner === (m.isOrganizer ? 'A' : m.myTeam) ? 'won' : 'lost') : null
      }))
      setMatches(withResults)

      // Joueurs fréquents
      const playersMap = new Map()
      withResults.forEach(match => {
        match.match_participants?.forEach(p => {
          if (p.user_id !== session.user.id && p.profiles) {
            const existing = playersMap.get(p.user_id) || { ...p.profiles, games: 0, wins: 0 }
            existing.games++
            if (match.result === 'won') existing.wins++
            playersMap.set(p.user_id, existing)
          }
        })
      })
      setPlayedWith(Array.from(playersMap.values()).sort((a, b) => b.games - a.games))

      // Favoris
      const { data: favs } = await supabase
        .from('player_favorites')
        .select(`favorite_id, profiles:favorite_id (id, name, level, avatar_url, reliability_score)`)
        .eq('user_id', session.user.id)
      setFavorites(favs?.map(f => f.profiles).filter(Boolean) || [])

      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  async function removeFavorite(id) {
    await supabase.from('player_favorites').delete().eq('user_id', user.id).eq('favorite_id', id)
    setFavorites(favorites.filter(f => f.id !== id))
  }

  function formatDate(d) {
    const date = new Date(d)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><div style={{ fontSize: 40 }}>📊</div><div style={{ color: '#666', marginTop: 16 }}>Chargement...</div></div>
  }

  const totalPlayed = matches.filter(m => m.status === 'completed').length
  const totalWon = matches.filter(m => m.result === 'won').length
  const winRate = totalPlayed > 0 ? Math.round(totalWon / totalPlayed * 100) : 0
  const displayedMatches = showAllMatches ? matches : matches.slice(0, 5)
  const displayedPlayers = showAllPlayers ? playedWith : playedWith.slice(0, 5)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      {/* === HEADER === */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: '700', margin: '0 0 8px' }}>Mes stats</h1>
        <p style={{ color: '#666', margin: 0 }}>Historique et performances</p>
      </div>

      {/* === STATS PRINCIPALES === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
        <StatCard value={profile?.matches_played || totalPlayed} label="Parties" />
        <StatCard value={profile?.matches_won || totalWon} label="Victoires" color="#dcfce7" textColor="#166534" />
        <StatCard value={`${winRate}%`} label="Win rate" color="#fef3c7" textColor="#92400e" />
        <StatCard value={profile?.current_streak || 0} label="🔥 Série" color={profile?.current_streak > 0 ? '#fee2e2' : '#f5f5f5'} textColor={profile?.current_streak > 0 ? '#dc2626' : '#666'} />
      </div>

      {/* === HISTORIQUE === */}
      <Section title="📜 Historique" count={matches.length}>
        {matches.length === 0 ? (
          <EmptyState icon="🎾" text="Aucune partie jouée" />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayedMatches.map(match => (
                <Link key={match.id} href={`/dashboard/match/${match.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Résultat */}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: match.result === 'won' ? '#dcfce7' : match.result === 'lost' ? '#fee2e2' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {match.result === 'won' ? '✓' : match.result === 'lost' ? '✕' : '⏳'}
                    </div>
                    
                    {/* Infos */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 15 }}>
                        {formatDate(match.match_date)} · {match.match_time?.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {match.clubs?.name} {match.isOrganizer && <span style={{ color: '#2e7d32' }}>· Orga</span>}
                      </div>
                    </div>

                    {/* Avatars */}
                    <div style={{ display: 'flex' }}>
                      {match.match_participants?.slice(0, 3).map((p, i) => (
                        <Avatar key={i} profile={p.profiles} size={28} style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid #fff' }} />
                      ))}
                    </div>

                    <span style={{ color: '#ccc' }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
            {matches.length > 5 && (
              <button onClick={() => setShowAllMatches(!showAllMatches)} style={seeMoreStyle}>
                {showAllMatches ? 'Voir moins' : `Voir tout (${matches.length})`}
              </button>
            )}
          </>
        )}
      </Section>

      {/* === PARTENAIRES FRÉQUENTS === */}
      <Section title="👥 Partenaires fréquents" count={playedWith.length}>
        {playedWith.length === 0 ? (
          <EmptyState icon="👥" text="Joue des parties pour voir tes partenaires" />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayedPlayers.map((player, i) => (
                <Link key={player.id} href={`/player/${player.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Rang */}
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? '#fbbf24' : '#f5f5f5', color: i < 3 ? '#1a1a1a' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: '700' }}>
                      {i + 1}
                    </div>
                    
                    <Avatar profile={player} size={40} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{player.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>⭐ {player.level}/10 · {player.games} partie{player.games > 1 ? 's' : ''}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: '700', color: player.wins / player.games >= 0.5 ? '#22c55e' : '#f59e0b' }}>
                        {Math.round(player.wins / player.games * 100)}%
                      </div>
                      <div style={{ fontSize: 10, color: '#999' }}>win</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {playedWith.length > 5 && (
              <button onClick={() => setShowAllPlayers(!showAllPlayers)} style={seeMoreStyle}>
                {showAllPlayers ? 'Voir moins' : `Voir tout (${playedWith.length})`}
              </button>
            )}
          </>
        )}
      </Section>

      {/* === FAVORIS === */}
      <Section title="⭐ Mes favoris" count={favorites.length}>
        {favorites.length === 0 ? (
          <EmptyState icon="⭐" text="Ajoute des joueurs en favoris depuis leurs profils" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {favorites.map(player => (
              <div key={player.id} style={{ background: '#fff', border: '2px solid #fbbf24', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href={`/player/${player.id}`}><Avatar profile={player} size={44} /></Link>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>⭐ {player.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Niveau {player.level}/10 · {player.reliability_score || 100}% fiable</div>
                </div>
                <button onClick={() => removeFavorite(player.id)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: '600', cursor: 'pointer' }}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// === COMPOSANTS ===

function StatCard({ value, label, color = '#fff', textColor = '#1a1a1a' }) {
  return (
    <div style={{ background: color, border: color === '#fff' ? '1px solid #eee' : 'none', borderRadius: 12, padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: '700', color: textColor }}>{value}</div>
      <div style={{ fontSize: 11, color: textColor, opacity: 0.8, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: '600', margin: 0 }}>{title}</h2>
        {count > 0 && <span style={{ fontSize: 13, color: '#999' }}>{count}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>{icon}</div>
      <div style={{ color: '#999', fontSize: 14 }}>{text}</div>
    </div>
  )
}

function Avatar({ profile, size = 40, style = {} }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #4ade80, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: size * 0.4, ...style }}>
      {profile?.name?.[0] || '?'}
    </div>
  )
}

const seeMoreStyle = {
  width: '100%',
  padding: 12,
  background: 'transparent',
  color: '#666',
  border: '1px dashed #ddd',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: '500',
  cursor: 'pointer',
  marginTop: 12
}