'use client'

/**
 * ============================================
 * PAGE MOI - DESIGN WIREFRAME DESKTOP
 * ============================================
 * 
 * Layout 2 colonnes:
 * - Gauche (320px): Profil + Paramètres + Déconnexion
 * - Droite (flex-1): Stats carrés + Badges + Dernières parties
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlayerCardModal from '@/app/components/PlayerCardModal'

export default function MePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCardModal, setShowCardModal] = useState(false)
  const [recentMatches, setRecentMatches] = useState([])
  const [userBadges, setUserBadges] = useState([])
  
  // Stats
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0,
    streak: 0,
    favoriteClub: null
  })

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente', color: '#22c55e', bg: '#dcfce7' },
    mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6', bg: '#dbeafe' },
    compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b', bg: '#fef3c7' }
  }

  const positionConfig = {
    left: { emoji: '👈', label: 'Gauche' },
    right: { emoji: '👉', label: 'Droite' },
    both: { emoji: '↔️', label: 'Polyvalent' }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    const today = new Date().toISOString().split('T')[0]

    // Parties jouées
    const { data: pastParticipations } = await supabase
      .from('match_participants')
      .select(`
        match_id, team,
        matches!inner (id, match_date, winner, clubs(name))
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)
      .order('matches(match_date)', { ascending: false })
      .limit(20)

    const matchesPlayed = pastParticipations?.length || 0
    
    let wins = 0
    let losses = 0
    const clubCounts = {}
    const recent = []

    ;(pastParticipations || []).forEach((p, i) => {
      const match = p.matches
      let result = null
      if (match?.winner) {
        if (match.winner === p.team) {
          wins++
          result = 'win'
        } else {
          losses++
          result = 'loss'
        }
      }
      if (match?.clubs?.name) {
        clubCounts[match.clubs.name] = (clubCounts[match.clubs.name] || 0) + 1
      }
      if (i < 3 && match) {
        recent.push({
          date: match.match_date,
          club: match.clubs?.name || 'Club inconnu',
          result
        })
      }
    })

    setRecentMatches(recent)

    const favoriteClub = Object.entries(clubCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const { count: organizedCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    let streak = 0
    const sortedMatches = (pastParticipations || [])
      .filter(p => p.matches?.winner)
      .sort((a, b) => new Date(b.matches.match_date) - new Date(a.matches.match_date))
    
    for (const p of sortedMatches) {
      if (p.matches.winner === p.team) streak++
      else break
    }

    // Charger les badges de l'utilisateur
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })
      .limit(5)

    setUserBadges(badgesData || [])

    setStats({
      matchesPlayed,
      wins,
      losses,
      winRate: matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0,
      organized: organizedCount || 0,
      streak,
      favoriteClub
    })

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const reliabilityScore = profile?.reliability_score || 100
  const ambiance = ambianceConfig[profile?.preferred_ambiance] || ambianceConfig.mix
  const position = positionConfig[profile?.preferred_position] || positionConfig.both

  // Couleur avatar basée sur la première lettre
  const avatarColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']
  const avatarColor = avatarColors[(profile?.name?.[0]?.charCodeAt(0) || 0) % avatarColors.length]

  return (
    <>
      <div className="profile-layout">
        
        {/* ============================================ */}
        {/* COLONNE GAUCHE - PROFIL + PARAMÈTRES        */}
        {/* ============================================ */}
        <div className="profile-left-column">
          
          {/* Card Profil */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9',
            textAlign: 'center'
          }}>
            {/* Avatar */}
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
              color: '#fff',
              margin: '0 auto 16px',
              overflow: 'hidden'
            }}>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Nom */}
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1a1a2e' }}>
              {profile?.name}
            </h2>

            {/* Niveau & Ville */}
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>
              ⭐ Niveau {profile?.level || '?'} • 📍 {profile?.city || 'France'}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '4px 12px',
                background: ambiance.bg,
                color: ambiance.color,
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500
              }}>
                {ambiance.emoji} {ambiance.label}
              </span>
              <span style={{
                padding: '4px 12px',
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500
              }}>
                {position.emoji} {position.label}
              </span>
            </div>

            {/* Bouton Modifier */}
            <Link href="/dashboard/profile/edit" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: 12,
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}>
                ✏️ Modifier le profil
              </button>
            </Link>
          </div>

          {/* Card Paramètres */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#1a1a2e' }}>
              ⚙️ Paramètres
            </h3>

            <div>
              <SettingsLink href="/dashboard/settings" icon="👤" label="Mon compte" />
              <SettingsLink href="/dashboard/settings/notifications" icon="🔔" label="Notifications" />
              <SettingsLink href="/dashboard/settings/privacy" icon="🔒" label="Confidentialité" />
              <SettingsLink href="/dashboard/ideas" icon="💡" label="Boîte à idées" />
              <SettingsLink href="/dashboard/help" icon="❓" label="Aide" />
              <SettingsLink href="/dashboard/terms" icon="📄" label="CGU" />
              
              {/* Déconnexion */}
              <div
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: 14
                }}
              >
                <span>🚪</span>
                <span>Déconnexion</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* COLONNE DROITE - STATS + BADGES + PARTIES   */}
        {/* ============================================ */}
        <div className="profile-right-column">
          
          {/* Card Statistiques */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
              📊 Statistiques
            </h3>

            <div className="stats-grid">
              {[
                { icon: '🎾', value: stats.matchesPlayed, label: 'Parties' },
                { icon: '🏆', value: stats.wins, label: 'Victoires' },
                { icon: '📈', value: `${reliabilityScore}%`, label: 'Fiabilité' },
                { icon: '⭐', value: profile?.level || '?', label: 'Niveau' }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Badges - Amélioré */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            border: '1px solid #fcd34d'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#92400e' }}>
                🏅 Mes badges
              </h3>
              <Link href="/dashboard/me/badges" style={{ 
                fontSize: 13, 
                color: '#92400e', 
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                Voir tous →
              </Link>
            </div>

            {userBadges.length > 0 ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {userBadges.slice(0, 6).map((badge, i) => (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>
                      {badge.badges?.icon || '🏅'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{badge.badges?.name || 'Badge'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Obtenu</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(255,255,255,0.7)', 
                borderRadius: 12, 
                padding: 20, 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Aucun badge encore</div>
                <div style={{ fontSize: 13, color: '#a16207' }}>Joue des parties pour débloquer tes premiers badges !</div>
              </div>
            )}

            <div style={{ 
              marginTop: 16, 
              padding: '10px 14px', 
              background: 'rgba(255,255,255,0.6)', 
              borderRadius: 10,
              fontSize: 13,
              color: '#92400e',
              fontWeight: 500,
              textAlign: 'center'
            }}>
              {userBadges.length}/24 badges débloqués
            </div>
          </div>

          {/* Card Dernières parties */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
              📅 Dernières parties
            </h3>

            {recentMatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 14 }}>
                Aucune partie jouée
              </div>
            ) : (
              <div>
                {recentMatches.map((match, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < recentMatches.length - 1 ? '1px solid #f8fafc' : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e' }}>
                        {formatDate(match.date)}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {match.club}
                      </div>
                    </div>
                    {match.result && (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: match.result === 'win' ? '#dcfce7' : '#fee2e2',
                        color: match.result === 'win' ? '#16a34a' : '#dc2626'
                      }}>
                        {match.result === 'win' ? 'Victoire' : 'Défaite'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal carte joueur */}
      {showCardModal && (
        <PlayerCardModal
          profile={profile}
          onClose={() => setShowCardModal(false)}
        />
      )}

      {/* Styles responsive */}
      <style jsx global>{`
        .profile-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .profile-left-column {
          width: 100%;
        }
        
        .profile-right-column {
          width: 100%;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        /* Desktop - 1024px */
        @media (min-width: 1024px) {
          .profile-layout {
            flex-direction: row;
            align-items: flex-start;
          }
          .profile-left-column {
            width: 320px;
            flex-shrink: 0;
          }
          .profile-right-column {
            flex: 1;
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </>
  )
}

// Composant lien paramètres
function SettingsLink({ href, icon, label }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 8px',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#475569',
        fontSize: 14
      }}
      onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  )
}