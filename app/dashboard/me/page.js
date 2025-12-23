'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'
import { COLORS, FOUR_DOTS, AMBIANCE_CONFIG, POSITION_CONFIG } from '@/app/lib/design-tokens'

export default function MePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [recentMatches, setRecentMatches] = useState([])
  const [userBadges, setUserBadges] = useState([])
  const [stats, setStats] = useState({ matchesPlayed: 0, wins: 0, losses: 0, winRate: 0, organized: 0, streak: 0, favoriteClub: null })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }
    setUser(session.user)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]

    const { data: pastParticipations } = await supabase.from('match_participants')
      .select(`match_id, team, matches!inner (id, match_date, winner, clubs(name))`)
      .eq('user_id', session.user.id).eq('status', 'confirmed').lt('matches.match_date', today)
      .order('matches(match_date)', { ascending: false }).limit(20)

    const matchesPlayed = pastParticipations?.length || 0
    let wins = 0, losses = 0
    const clubCounts = {}
    const recent = []

    ;(pastParticipations || []).forEach((p, i) => {
      const match = p.matches
      let result = null
      if (match?.winner) {
        if (match.winner === p.team) { wins++; result = 'win' }
        else { losses++; result = 'loss' }
      }
      if (match?.clubs?.name) clubCounts[match.clubs.name] = (clubCounts[match.clubs.name] || 0) + 1
      if (i < 3 && match) recent.push({ date: match.match_date, club: match.clubs?.name || 'Club inconnu', result })
    })

    setRecentMatches(recent)
    const favoriteClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const { count: organizedCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('organizer_id', session.user.id)

    let streak = 0
    const sortedMatches = (pastParticipations || []).filter(p => p.matches?.winner).sort((a, b) => new Date(b.matches.match_date) - new Date(a.matches.match_date))
    for (const p of sortedMatches) { if (p.matches.winner === p.team) streak++; else break }

    const { data: badgesData } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', session.user.id).order('earned_at', { ascending: false }).limit(5)
    setUserBadges(badgesData || [])

    setStats({ matchesPlayed, wins, losses, winRate: matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0, organized: organizedCount || 0, streak, favoriteClub })
    setLoading(false)
  }

  async function logout() { await supabase.auth.signOut(); router.push('/') }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {FOUR_DOTS.colors.map((c, i) => <div key={i} className="junto-loading-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ color: COLORS.gray }}>Chargement...</div>
      </div>
    )
  }

  const reliabilityScore = profile?.reliability_score || 100
  const ambiance = AMBIANCE_CONFIG[profile?.preferred_ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.preferred_position] || POSITION_CONFIG.both
  const avatarColor = FOUR_DOTS.colors[0]

  return (
    <>
      <div className="profile-layout">
        
        {/* COLONNE GAUCHE - PROFIL */}
        <div className="profile-left-column">
          <div style={{ background: COLORS.white, borderRadius: 24, padding: 28, marginBottom: 24, border: `2px solid ${COLORS.border}`, textAlign: 'center' }}>
            
            {/* Avatar avec accent */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: profile?.avatar_url ? COLORS.bgSoft : avatarColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 42, fontWeight: 700, color: COLORS.white,
                border: `4px solid ${COLORS.primary}`, overflow: 'hidden',
                boxShadow: `0 4px 20px ${COLORS.primaryGlow}`
              }}>
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.name?.[0]?.toUpperCase() || '?'}
              </div>
              {/* Badge niveau */}
              <div style={{ position: 'absolute', bottom: -4, right: -4, background: COLORS.primary, color: COLORS.white, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, border: `2px solid ${COLORS.white}` }}>⭐ {profile?.level || '?'}</div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: COLORS.ink }}>{profile?.name}</h2>
            <div style={{ color: COLORS.gray, fontSize: 14, marginBottom: 16 }}>📍 {profile?.city || 'France'}</div>

            {/* Tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ padding: '6px 14px', background: `${ambiance.color}20`, color: ambiance.color, borderRadius: 100, fontSize: 13, fontWeight: 600 }}>{ambiance.emoji} {ambiance.label}</span>
              <span style={{ padding: '6px 14px', background: COLORS.bgSoft, color: COLORS.gray, borderRadius: 100, fontSize: 13 }}>{position.emoji} {position.label}</span>
            </div>

            {/* Fiabilité */}
            <div style={{ background: COLORS.bgSoft, borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.gray }}>Fiabilité</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: reliabilityScore >= 80 ? COLORS.teal : COLORS.amber }}>{reliabilityScore}%</span>
              </div>
              <div style={{ height: 6, background: COLORS.border, borderRadius: 100 }}>
                <div style={{ width: `${reliabilityScore}%`, height: '100%', background: reliabilityScore >= 80 ? COLORS.teal : COLORS.amber, borderRadius: 100 }} />
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/dashboard/profile/edit" style={{ flex: 1, padding: 14, background: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>✏️ Modifier</Link>
              <button onClick={() => setShowCardModal(true)} style={{ flex: 1, padding: 14, background: COLORS.bgSoft, color: COLORS.ink, border: `2px solid ${COLORS.border}`, borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>🎴 Ma carte</button>
            </div>
          </div>

          {/* Paramètres */}
          <div style={{ background: COLORS.white, borderRadius: 20, border: `2px solid ${COLORS.border}`, overflow: 'hidden', marginBottom: 24 }}>
            {[
              { href: '/dashboard/settings/notifications', icon: '🔔', label: 'Notifications' },
              { href: '/dashboard/settings/privacy', icon: '🔒', label: 'Confidentialité' },
              { href: '/dashboard/settings/help', icon: '❓', label: 'Aide' }
            ].map((item, i) => (
              <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < 2 ? `1px solid ${COLORS.border}` : 'none', textDecoration: 'none', color: COLORS.ink, fontSize: 15 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: COLORS.muted }}>›</span>
              </Link>
            ))}
          </div>

          <button onClick={logout} style={{ width: '100%', padding: 16, background: COLORS.primarySoft, color: COLORS.primary, border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Déconnexion</button>
        </div>

        {/* COLONNE DROITE - STATS + BADGES */}
        <div className="profile-right-column">
          
          {/* Stats */}
          <div style={{ background: COLORS.white, borderRadius: 24, padding: 24, marginBottom: 24, border: `2px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px', color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>📊 Statistiques</h3>
            <div className="stats-grid">
              {[
                { icon: '🎾', value: stats.matchesPlayed, label: 'Parties', c: COLORS.primary },
                { icon: '🏆', value: stats.wins, label: 'Victoires', c: COLORS.teal },
                { icon: '📈', value: `${stats.winRate}%`, label: 'Win rate', c: COLORS.amber },
                { icon: '👑', value: stats.organized, label: 'Organisées', c: COLORS.secondary }
              ].map((stat, i) => (
                <div key={i} style={{ background: COLORS.bgSoft, borderRadius: 18, padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.c }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div style={{ background: `linear-gradient(145deg, ${COLORS.amberSoft} 0%, ${COLORS.bgSoft} 100%)`, borderRadius: 24, padding: 24, marginBottom: 24, border: `2px solid ${COLORS.amber}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: COLORS.amberDark }}>🏅 Mes badges</h3>
              <Link href="/dashboard/me/badges" style={{ fontSize: 13, color: COLORS.amberDark, textDecoration: 'none', fontWeight: 600 }}>Voir tous →</Link>
            </div>

            {userBadges.length > 0 ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {userBadges.slice(0, 6).map((badge, i) => (
                  <div key={i} style={{ background: COLORS.white, borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.amber}, ${COLORS.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{badge.badges?.icon || '🏅'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{badge.badges?.name || 'Badge'}</div>
                      <div style={{ fontSize: 12, color: COLORS.gray }}>Obtenu</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.amberDark, marginBottom: 4 }}>Aucun badge encore</div>
                <div style={{ fontSize: 13, color: COLORS.amber }}>Joue des parties pour débloquer tes premiers badges !</div>
              </div>
            )}

            <div style={{ marginTop: 18, padding: '12px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 14, color: COLORS.amberDark, fontWeight: 600, textAlign: 'center' }}>{userBadges.length}/24 badges débloqués</div>
          </div>

          {/* Dernières parties */}
          <div style={{ background: COLORS.white, borderRadius: 24, padding: 24, border: `2px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px', color: COLORS.ink }}>📅 Dernières parties</h3>

            {recentMatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: COLORS.muted, fontSize: 14 }}>Aucune partie jouée</div>
            ) : (
              <div>
                {recentMatches.map((match, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < recentMatches.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>{formatDate(match.date)}</div>
                      <div style={{ fontSize: 13, color: COLORS.gray }}>{match.club}</div>
                    </div>
                    {match.result && (
                      <span style={{ padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: match.result === 'win' ? COLORS.tealSoft : COLORS.primarySoft, color: match.result === 'win' ? COLORS.teal : COLORS.primary }}>
                        {match.result === 'win' ? '🏆 Victoire' : 'Défaite'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCardModal && <PlayerCardModal profile={profile} onClose={() => setShowCardModal(false)} />}

      <style jsx global>{`
        @keyframes junto-loading { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-12px); } }
        .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
        .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
        .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
        .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
        .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }
        .profile-layout { display: flex; flex-direction: column; gap: 24px; }
        .profile-left-column { width: 100%; }
        .profile-right-column { width: 100%; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (min-width: 1024px) {
          .profile-layout { flex-direction: row; align-items: flex-start; }
          .profile-left-column { width: 340px; flex-shrink: 0; }
          .profile-right-column { flex: 1; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </>
  )
}
