'use client'

/**
 * ============================================
 * PAGE ACTIVITÉ - 2×2 BRAND
 * ============================================
 * 
 * Feed social : voir l'activité de sa communauté
 * 
 * Layout responsive:
 * - Mobile: Feed seul, full width
 * - Desktop: Feed + Sidebar (stats, matchs proches, joueurs)
 * 
 * Types de contenu:
 * - 🏆 Résultats de matchs (scores confirmés)
 * - 📅 Matchs à venir avec places dispo
 * - 👋 Nouveaux joueurs
 * - 🔥 Séries & Badges
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS, FOUR_DOTS, getAvatarColor } from '@/app/lib/design-tokens'

export default function ActivitePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [recentPlayers, setRecentPlayers] = useState([])
  const [stats, setStats] = useState({ matches: 0, wins: 0, streak: 0 })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    const userId = session.user.id

    // Charger le profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(profileData)
    
    // TODO: Charger les vraies données
    // Pour l'instant, on simule des données vides ou de démo
    
    // Simuler quelques activités pour la démo
    // En prod, on chargera depuis la DB
    setActivities([])
    setUpcomingMatches([])
    setRecentPlayers([])
    setStats({ matches: 0, wins: 0, streak: 0 })
    
    setLoading(false)
  }

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {FOUR_DOTS.colors.map((color, i) => (
              <div 
                key={i} 
                className="loading-dot"
                style={{ 
                  width: 14, 
                  height: 14, 
                  borderRadius: '50%', 
                  background: color,
                }} 
              />
            ))}
          </div>
          <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
        </div>
        <style jsx>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
          }
          .loading-dot {
            animation: bounce 1.4s ease-in-out infinite;
          }
          .loading-dot:nth-child(1) { animation-delay: 0s; }
          .loading-dot:nth-child(2) { animation-delay: 0.1s; }
          .loading-dot:nth-child(3) { animation-delay: 0.2s; }
          .loading-dot:nth-child(4) { animation-delay: 0.3s; }
        `}</style>
      </div>
    )
  }

  const hasActivity = activities.length > 0

  return (
    <div style={styles.page}>
      
      {/* Layout responsive */}
      <div style={styles.layout}>
        
        {/* === COLONNE PRINCIPALE - FEED === */}
        <div style={styles.mainColumn}>
          
          {/* Header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>
              <span>⚡</span>
              <span>Activité</span>
            </h1>
            <p style={styles.pageSubtitle}>L'activité de ta communauté padel</p>
          </div>

          {/* Feed */}
          {hasActivity ? (
            <div style={styles.feed}>
              {activities.map((activity, idx) => (
                <ActivityCard key={idx} activity={activity} />
              ))}
            </div>
          ) : (
            /* État vide */
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚡</div>
              <h2 style={styles.emptyTitle}>Pas encore d'activité</h2>
              <p style={styles.emptyText}>
                Crée ton premier match et invite tes potes pour voir l'activité de ta communauté
              </p>
              <Link href="/dashboard/parties" style={styles.emptyButton}>
                <span>🎾</span>
                <span>Créer une partie</span>
              </Link>
              
              {/* 4 dots décoratifs */}
              <div style={styles.emptyDots}>
                {FOUR_DOTS.colors.map((color, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: 0.3 }} />
                ))}
              </div>
            </div>
          )}

          {/* Info box - visible seulement si pas d'activité */}
          {!hasActivity && (
            <div style={styles.infoBox}>
              <div style={styles.infoIcon}>💡</div>
              <div style={styles.infoContent}>
                <div style={styles.infoTitle}>Bientôt ici</div>
                <div style={styles.infoText}>
                  Tu verras les résultats des matchs de tes potes, les parties à venir avec des places dispo, et les nouveaux joueurs qui rejoignent 2×2.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === SIDEBAR (Desktop only) === */}
        <div style={styles.sidebar} className="sidebar-desktop">
          
          {/* Stats rapides */}
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>
              <span>📊</span>
              <span>Tes stats</span>
            </div>
            <div style={styles.statsRow}>
              <div style={styles.statMini}>
                <div style={styles.statValue}>{stats.matches}</div>
                <div style={styles.statLabel}>Matchs</div>
              </div>
              <div style={styles.statMini}>
                <div style={{ ...styles.statValue, color: COLORS.teal }}>
                  {stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0}%
                </div>
                <div style={styles.statLabel}>Victoires</div>
              </div>
              <div style={styles.statMini}>
                <div style={{ ...styles.statValue, color: COLORS.primary }}>
                  {stats.streak > 0 ? `🔥 ${stats.streak}` : '—'}
                </div>
                <div style={styles.statLabel}>Série</div>
              </div>
            </div>
          </div>

          {/* Matchs à venir */}
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>
              <span>📅</span>
              <span>Matchs proches</span>
            </div>
            
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match, idx) => (
                <div key={idx} style={styles.sidebarItem}>
                  <div style={{ ...styles.sidebarAvatar, background: `linear-gradient(135deg, ${COLORS.p1}, ${COLORS.p2})` }} />
                  <div style={styles.sidebarItemMeta}>
                    <div style={styles.sidebarItemName}>{match.date}</div>
                    <div style={styles.sidebarItemSub}>{match.club} · {match.spots} places</div>
                  </div>
                  <Link href={`/dashboard/match/${match.id}`} style={styles.sidebarItemAction}>Voir</Link>
                </div>
              ))
            ) : (
              <div style={styles.sidebarEmpty}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>Aucun match prévu</div>
              </div>
            )}
          </div>

          {/* Joueurs actifs */}
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>
              <span>👥</span>
              <span>Joueurs actifs</span>
            </div>
            
            {recentPlayers.length > 0 ? (
              recentPlayers.map((player, idx) => (
                <div key={idx} style={styles.sidebarItem}>
                  <div style={{ 
                    ...styles.sidebarAvatar, 
                    background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                    overflow: 'hidden'
                  }}>
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{player.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div style={styles.sidebarItemMeta}>
                    <div style={styles.sidebarItemName}>{player.name}</div>
                    <div style={styles.sidebarItemSub}>Niveau {player.level}</div>
                  </div>
                  <button style={styles.sidebarItemAction}>Inviter</button>
                </div>
              ))
            ) : (
              <div style={styles.sidebarEmpty}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>Invite tes premiers potes !</div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={styles.ctaCard}>
            <h3 style={styles.ctaTitle}>🎾 Organise un match</h3>
            <p style={styles.ctaText}>Invite tes potes et joue ce week-end</p>
            <Link href="/dashboard/parties" style={styles.ctaButton}>Créer une partie</Link>
          </div>
          
        </div>
      </div>

      {/* Styles responsives */}
      <style jsx global>{`
        .sidebar-desktop {
          display: none;
        }
        
        @media (min-width: 900px) {
          .sidebar-desktop {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}

// === COMPOSANT: Card d'activité ===
function ActivityCard({ activity }) {
  const getActivityBadge = (type) => {
    switch (type) {
      case 'result': return { label: '🏆 Résultat', bg: 'rgba(0, 184, 169, 0.15)', color: COLORS.teal }
      case 'upcoming': return { label: '📅 À venir', bg: 'rgba(255, 180, 0, 0.15)', color: '#cc9000' }
      case 'new_player': return { label: '👋 Nouveau', bg: 'rgba(124, 92, 255, 0.15)', color: COLORS.violet }
      case 'streak': return { label: '🔥 Série', bg: 'rgba(255, 90, 95, 0.15)', color: COLORS.primary }
      default: return { label: '⚡', bg: COLORS.bgSoft, color: COLORS.gray }
    }
  }

  const badge = getActivityBadge(activity.type)

  return (
    <div style={styles.feedCard}>
      <div style={styles.feedCardHeader}>
        <div style={styles.feedAvatars}>
          {activity.players?.slice(0, 4).map((player, i) => (
            <div 
              key={i} 
              style={{ 
                ...styles.feedAvatar, 
                background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                marginLeft: i > 0 ? -8 : 0,
                zIndex: 4 - i
              }}
            >
              {player.avatar_url ? (
                <img src={player.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: COLORS.white, fontWeight: 700, fontSize: 14 }}>{player.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
          ))}
        </div>
        <div style={styles.feedMeta}>
          <div style={styles.feedTitle}>{activity.title}</div>
          <div style={styles.feedSubtitle}>{activity.subtitle}</div>
        </div>
        <div style={{ ...styles.feedBadge, background: badge.bg, color: badge.color }}>
          {badge.label}
        </div>
      </div>
      
      {activity.content && (
        <div style={styles.feedContent} dangerouslySetInnerHTML={{ __html: activity.content }} />
      )}
      
      {activity.score && (
        <div style={styles.feedScore}>
          {activity.score.map((set, i) => (
            <div key={i} style={styles.scoreSet}>{set}</div>
          ))}
        </div>
      )}
      
      {activity.cta && (
        <Link href={activity.cta.href} style={styles.feedAction}>
          {activity.cta.label}
        </Link>
      )}
    </div>
  )
}

// === STYLES ===
const styles = {
  page: {
    minHeight: '60vh',
  },
  
  loadingContainer: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Layout
  layout: {
    display: 'flex',
    gap: 32,
    maxWidth: 1000,
    margin: '0 auto',
  },
  
  mainColumn: {
    flex: 1,
    minWidth: 0,
    maxWidth: 600,
  },
  
  sidebar: {
    width: 320,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  
  // Page header
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: COLORS.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 4,
  },
  
  // Feed
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  
  feedCard: {
    background: COLORS.white,
    borderRadius: 16,
    padding: 16,
    border: `2px solid ${COLORS.border}`,
  },
  
  feedCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  
  feedAvatars: {
    display: 'flex',
    position: 'relative',
  },
  
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: `3px solid ${COLORS.white}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  
  feedMeta: {
    flex: 1,
    minWidth: 0,
  },
  
  feedTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  
  feedSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  
  feedBadge: {
    padding: '6px 12px',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  
  feedContent: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  
  feedScore: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  
  scoreSet: {
    padding: '8px 16px',
    background: COLORS.bgSoft,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.ink,
  },
  
  feedAction: {
    display: 'block',
    marginTop: 12,
    padding: 12,
    background: COLORS.ink,
    color: COLORS.white,
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  
  // Empty state
  emptyState: {
    background: COLORS.white,
    borderRadius: 20,
    border: `2px solid ${COLORS.border}`,
    padding: 48,
    textAlign: 'center',
  },
  
  emptyIcon: {
    fontSize: 56,
    marginBottom: 20,
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 8,
  },
  
  emptyText: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 24,
    maxWidth: 280,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.5,
  },
  
  emptyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: COLORS.ink,
    color: COLORS.white,
    padding: '14px 28px',
    borderRadius: 100,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
  },
  
  emptyDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  
  // Info box
  infoBox: {
    marginTop: 24,
    padding: 20,
    background: COLORS.bgSoft,
    borderRadius: 16,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(124, 92, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  
  infoContent: {
    flex: 1,
  },
  
  infoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 4,
  },
  
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 1.5,
  },
  
  // Sidebar
  sidebarCard: {
    background: COLORS.white,
    borderRadius: 16,
    padding: 20,
    border: `2px solid ${COLORS.border}`,
  },
  
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  
  statsRow: {
    display: 'flex',
    gap: 12,
  },
  
  statMini: {
    flex: 1,
    textAlign: 'center',
    padding: 12,
    background: COLORS.bgSoft,
    borderRadius: 12,
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: COLORS.ink,
  },
  
  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  
  sidebarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sidebarItemMeta: {
    flex: 1,
    minWidth: 0,
  },
  
  sidebarItemName: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.ink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  
  sidebarItemSub: {
    fontSize: 11,
    color: COLORS.muted,
  },
  
  sidebarItemAction: {
    padding: '6px 12px',
    background: COLORS.bgSoft,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  
  sidebarEmpty: {
    padding: 24,
    textAlign: 'center',
    background: COLORS.bgSoft,
    borderRadius: 12,
  },
  
  // CTA Card
  ctaCard: {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.violet})`,
    borderRadius: 16,
    padding: 20,
    textAlign: 'center',
  },
  
  ctaTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.white,
    marginBottom: 8,
  },
  
  ctaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  
  ctaButton: {
    display: 'inline-block',
    padding: '12px 24px',
    background: COLORS.white,
    color: COLORS.ink,
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
  },
}