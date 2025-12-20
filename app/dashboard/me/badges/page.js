'use client'

/**
 * ============================================
 * PAGE: Mes Badges
 * ============================================
 * 
 * Affiche tous les badges obtenus et à obtenir
 * avec progression vers chaque badge
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BadgesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allBadges, setAllBadges] = useState([])
  const [earnedBadges, setEarnedBadges] = useState(new Set())
  const [stats, setStats] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'Tous', emoji: '🏅' },
    { id: 'founder', label: 'Fondateur', emoji: '🏛️' },
    { id: 'activity', label: 'Activité', emoji: '🎾' },
    { id: 'referral', label: 'Parrainage', emoji: '📢' },
    { id: 'social', label: 'Social', emoji: '🤝' },
    { id: 'contribution', label: 'Contribution', emoji: '🏟️' }
  ]

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

    // Charger le profil avec stats
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    // Charger tous les badges
    const { data: badgesData } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('condition_value', { ascending: true })

    setAllBadges(badgesData || [])

    // Charger les badges obtenus
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', session.user.id)

    setEarnedBadges(new Set((userBadges || []).map(b => b.badge_id)))

    // Calculer les stats pour la progression
    // Parties jouées
    const { count: matchesPlayed } = await supabase
      .from('match_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')

    // Parties organisées
    const { count: matchesOrganized } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    // Groupes ajoutés
    const { count: groupsAdded } = await supabase
      .from('community_groups')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', session.user.id)

    // Idées soumises
    const { count: ideasSubmitted } = await supabase
      .from('idea_box')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    setStats({
      signup_number: profileData?.signup_number || 9999,
      matches_played: matchesPlayed || 0,
      matches_won: profileData?.matches_won || 0,
      matches_organized: matchesOrganized || 0,
      referral_count: profileData?.referral_count || 0,
      groups_added: groupsAdded || 0,
      ideas_submitted: ideasSubmitted || 0,
      unique_partners: 0, // TODO: calculer
      unique_clubs: 0, // TODO: calculer
      reliability: profileData?.reliability_score || 100
    })

    setLoading(false)
  }

  function getProgress(badge) {
    const currentValue = stats[badge.condition_type] || 0
    const targetValue = badge.condition_value || 1
    
    // Pour signup_number, c'est inversé (plus petit = mieux)
    if (badge.condition_type === 'signup_number') {
      return currentValue <= targetValue ? 100 : 0
    }
    
    const progress = Math.min(100, Math.round((currentValue / targetValue) * 100))
    return progress
  }

  function getProgressText(badge) {
    const currentValue = stats[badge.condition_type] || 0
    const targetValue = badge.condition_value || 1
    
    if (badge.condition_type === 'signup_number') {
      if (currentValue <= targetValue) {
        return `Membre #${currentValue}`
      }
      return `Tu es #${currentValue}`
    }
    
    return `${currentValue} / ${targetValue}`
  }

  function getFilteredBadges() {
    let badges = activeCategory === 'all' ? allBadges : allBadges.filter(b => b.category === activeCategory)
    
    // Trier: badges obtenus d'abord, puis non-obtenus
    return badges.sort((a, b) => {
      const aEarned = earnedBadges.has(a.id)
      const bEarned = earnedBadges.has(b.id)
      if (aEarned && !bEarned) return -1
      if (!aEarned && bEarned) return 1
      return 0
    })
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏅</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const filteredBadges = getFilteredBadges()
  const earnedCount = allBadges.filter(b => earnedBadges.has(b.id)).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ 
          color: '#64748b', 
          textDecoration: 'none', 
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8
        }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          🏅 Mes Badges
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          {earnedCount} / {allBadges.length} badges obtenus
        </p>
      </div>

      {/* Résumé */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #334155)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32
          }}>
            🏆
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {earnedCount}
            </div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              badges obtenus
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Membre</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              #{profile?.signup_number || '?'}
            </div>
          </div>
        </div>
      </div>

      {/* Catégories */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 16px',
              background: activeCategory === cat.id ? '#1a1a2e' : '#fff',
              color: activeCategory === cat.id ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grille de badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12
      }}>
        {filteredBadges.map(badge => {
          const isEarned = earnedBadges.has(badge.id)
          const progress = getProgress(badge)
          const progressText = getProgressText(badge)

          return (
            <div
              key={badge.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 16,
                border: isEarned ? '2px solid #22c55e' : '1px solid #e2e8f0',
                opacity: isEarned ? 1 : 0.7,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Badge earned indicator */}
              {isEarned && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  ✓
                </div>
              )}

              {/* Emoji */}
              <div style={{
                fontSize: 36,
                marginBottom: 8,
                filter: isEarned ? 'none' : 'grayscale(100%)'
              }}>
                {badge.emoji}
              </div>

              {/* Nom */}
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                color: '#1a1a2e',
                marginBottom: 4
              }}>
                {badge.name}
              </div>

              {/* Description */}
              <div style={{
                fontSize: 11,
                color: '#64748b',
                marginBottom: 8,
                lineHeight: 1.4
              }}>
                {badge.description}
              </div>

              {/* Barre de progression */}
              {!isEarned && (
                <div>
                  <div style={{
                    height: 6,
                    background: '#f1f5f9',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 4
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: progress >= 100 ? '#22c55e' : '#3b82f6',
                      borderRadius: 3,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    {progressText}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA Parrainage */}
      <div style={{
        background: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        border: '1px solid #bbf7d0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#166534' }}>
          Gagne des badges en invitant !
        </h3>
        <p style={{ fontSize: 13, color: '#15803d', marginBottom: 16 }}>
          Tu as invité <strong>{profile?.referral_count || 0}</strong> personnes. Continue !
        </p>
        <Link
          href="/dashboard/community"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Inviter des amis
        </Link>
      </div>
    </div>
  )
}