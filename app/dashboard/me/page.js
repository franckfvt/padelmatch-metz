'use client'

/**
 * ============================================
 * PAGE MOI - STYLE STRAVA
 * ============================================
 * 
 * Mission: "Mon profil complet centralisé"
 * 
 * Contenu:
 * - Hero header (avatar, nom, niveau, fiabilité)
 * - Stats rapides
 * - Bouton "Ma carte"
 * - Mes stats détaillées
 * - Paiement
 * - Profil public (preview)
 * - Paramètres
 * 
 * Branding: Sobre + Joueurs colorés
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
  
  // Stats
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    organized: 0,
    streak: 0,
    favoriteClub: null,
    favoritePartner: null
  })

  // Couleurs avatars
  const playerColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4']

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  const ambianceLabels = {
    'loisir': 'Détente 😎',
    'mix': 'Équilibré ⚡',
    'compet': 'Compétitif 🏆'
  }

  const positionLabels = {
    'left': 'Gauche 👈',
    'right': 'Droite 👉',
    'both': 'Polyvalent ↔️'
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

    // Charger les stats
    const today = new Date().toISOString().split('T')[0]

    // Parties jouées (participations confirmées dans le passé)
    const { data: pastParticipations } = await supabase
      .from('match_participants')
      .select(`
        match_id, team,
        matches!inner (id, match_date, winner, clubs(name))
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .lt('matches.match_date', today)

    const matchesPlayed = pastParticipations?.length || 0
    
    let wins = 0
    let losses = 0
    const clubCounts = {}

    ;(pastParticipations || []).forEach(p => {
      const match = p.matches
      if (match?.winner) {
        if (match.winner === p.team) wins++
        else losses++
      }
      if (match?.clubs?.name) {
        clubCounts[match.clubs.name] = (clubCounts[match.clubs.name] || 0) + 1
      }
    })

    // Club préféré
    const favoriteClub = Object.entries(clubCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Parties organisées
    const { count: organizedCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', session.user.id)

    // Calculer la série
    let streak = 0
    const sortedMatches = (pastParticipations || [])
      .filter(p => p.matches?.winner)
      .sort((a, b) => new Date(b.matches.match_date) - new Date(a.matches.match_date))
    
    for (const p of sortedMatches) {
      if (p.matches.winner === p.team) streak++
      else break
    }

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

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const reliabilityScore = profile?.reliability_score || 100
  const reliabilityColor = reliabilityScore >= 90 ? '#22c55e' : reliabilityScore >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <>
    <div className="profile-layout">
      {/* ============================================ */}
      {/* HERO HEADER                                 */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Bouton Modifier en haut à droite */}
        <Link href="/dashboard/profile/edit" style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16,
          textDecoration: 'none'
        }}>
          <button style={{
            padding: '8px 14px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            ✏️ Modifier
          </button>
        </Link>

        {/* Avatar */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          margin: '0 auto 16px',
          border: '3px solid #22c55e'
        }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            profile?.name?.[0]?.toUpperCase() || '?'
          )}
        </div>

        {/* Nom */}
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a2e' }}>
          {profile?.name}
        </h1>
        
        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {profile?.level && (
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600
            }}>
              ⭐ Niveau {profile.level}
            </span>
          )}
          {profile?.city && (
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600
            }}>
              📍 {profile.city}
            </span>
          )}
          <span style={{
            background: reliabilityColor + '15',
            color: reliabilityColor,
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600
          }}>
            ✓ {reliabilityScore}% fiable
          </span>
        </div>

        {/* Stats rapides */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
              {stats.matchesPlayed}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Parties</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
              {stats.wins}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Victoires</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>
              {stats.winRate}%
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Win rate</div>
          </div>
        </div>

        {/* Bouton Ma carte */}
        <button
          onClick={() => setShowCardModal(true)}
          style={{
            width: '100%',
            padding: 14,
            background: 'linear-gradient(135deg, #1a1a2e, #334155)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          🎴 Voir ma carte joueur
        </button>
      </div>

      {/* ============================================ */}
      {/* STATS DÉTAILLÉES                            */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1a1a2e' }}>
          📊 Mes stats
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatRow label="Parties jouées" value={stats.matchesPlayed} icon="🎾" />
          <StatRow label="Victoires" value={stats.wins} icon="🏆" />
          <StatRow label="Défaites" value={stats.losses} icon="📉" />
          <StatRow label="Série actuelle" value={stats.streak > 0 ? `🔥 ${stats.streak}` : '-'} icon="⚡" />
          <StatRow label="Parties organisées" value={stats.organized} icon="👑" />
          {stats.favoriteClub && (
            <StatRow label="Club préféré" value={stats.favoriteClub} icon="📍" />
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* BADGES & PARRAINAGE                         */}
      {/* ============================================ */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #fcd34d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#92400e' }}>
            🏅 Badges & Parrainage
          </h2>
          <Link href="/dashboard/me/badges" style={{ fontSize: 13, color: '#92400e', textDecoration: 'none', fontWeight: 500 }}>
            Voir tout →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Badges */}
          <div style={{
            flex: 1,
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
              {profile?.badges_count || 0}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>badges</div>
          </div>

          {/* Filleuls */}
          <div style={{
            flex: 1,
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>👥</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
              {profile?.referral_count || 0}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>filleuls</div>
          </div>

          {/* Numéro membre */}
          <div style={{
            flex: 1,
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎫</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
              #{profile?.signup_number || '?'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>membre</div>
          </div>
        </div>

        <Link href="/dashboard/community" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            padding: 14,
            background: '#92400e',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            📧 Inviter des amis
          </button>
        </Link>
      </div>

      {/* ============================================ */}
      {/* MON PROFIL                                  */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            👤 Mon profil
          </h2>
          <Link href="/dashboard/profile" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Modifier →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile?.position && (
            <InfoRow label="Position" value={positionLabels[profile.position] || profile.position} />
          )}
          {profile?.experience && (
            <InfoRow label="Expérience" value={experienceLabels[profile.experience] || profile.experience} />
          )}
          {profile?.ambiance && (
            <InfoRow label="Ambiance" value={ambianceLabels[profile.ambiance] || profile.ambiance} />
          )}
          {profile?.region && (
            <InfoRow label="Région" value={profile.region} />
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* PAIEMENT                                    */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            💳 Paiement
          </h2>
          <Link href="/dashboard/profile?tab=payment" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
            Configurer →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PaymentRow 
            icon="🔵" 
            label="Lydia" 
            value={profile?.lydia_username ? `@${profile.lydia_username}` : null}
          />
          <PaymentRow 
            icon="🔵" 
            label="PayPal" 
            value={profile?.paypal_email}
          />
          <PaymentRow 
            icon="🏦" 
            label="RIB / IBAN" 
            value={profile?.rib ? '••••' + profile.rib.slice(-4) : null}
          />
        </div>

        {!profile?.lydia_username && !profile?.paypal_email && !profile?.rib && (
          <div style={{
            background: '#fef3c7',
            padding: 12,
            borderRadius: 8,
            marginTop: 12
          }}>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
              ⚠️ Configure tes moyens de paiement pour recevoir de l'argent facilement
            </p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* PROFIL PUBLIC                               */}
      {/* ============================================ */}
      <Link href={`/player/${profile?.id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              👁️
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
                Voir mon profil public
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Ce que les autres joueurs voient
              </div>
            </div>
          </div>
          <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
        </div>
      </Link>

      {/* ============================================ */}
      {/* PARAMÈTRES                                  */}
      {/* ============================================ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1a1a2e', padding: 20, paddingBottom: 0 }}>
          ⚙️ Paramètres
        </h2>

        <div>
          <SettingsRow 
            icon="👤" 
            label="Mon compte" 
            href="/dashboard/settings/account"
          />
          <SettingsRow 
            icon="🔔" 
            label="Notifications" 
            href="/dashboard/settings/notifications"
          />
          <SettingsRow 
            icon="🔒" 
            label="Confidentialité" 
            href="/dashboard/settings/privacy"
          />
          <SettingsRow 
            icon="💡" 
            label="Boîte à idées" 
            href="/dashboard/ideas"
          />
          <SettingsRow 
            icon="❓" 
            label="Aide & Support" 
            href="/dashboard/settings/help"
          />
          <SettingsRow 
            icon="📄" 
            label="Conditions d'utilisation" 
            href="/terms"
            external
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* DÉCONNEXION                                 */}
      {/* ============================================ */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: 16,
          background: '#fff',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Se déconnecter
      </button>

      {/* ============================================ */}
      {/* MODAL CARTE JOUEUR                          */}
      {/* ============================================ */}
      {showCardModal && (
        <PlayerCardModal
          profile={profile}
          onClose={() => setShowCardModal(false)}
        />
      )}
    </div>

    {/* ============================================ */}
    {/* STYLES RESPONSIVE                           */}
    {/* ============================================ */}
    <style jsx global>{`
      .profile-layout {
        display: block;
      }
      
      .profile-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      /* Tablet - 768px */
      @media (min-width: 768px) {
        .profile-stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      
      /* Desktop - 1024px */
      @media (min-width: 1024px) {
        .profile-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          align-items: start;
        }
      }
    `}</style>
    </>
  )
}

// === COMPOSANTS UTILITAIRES ===

function StatRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f1f5f9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
      </div>
      <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{value}</span>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f1f5f9'
    }}>
      <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#1a1a2e', fontSize: 14 }}>{value}</span>
    </div>
  )
}

function PaymentRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #f1f5f9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
      </div>
      {value ? (
        <span style={{ fontWeight: 500, color: '#1a1a2e', fontSize: 14 }}>{value}</span>
      ) : (
        <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>Non configuré</span>
      )}
    </div>
  )
}

function SettingsRow({ icon, label, href, external = false }) {
  const content = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid #f1f5f9',
      cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: '#1a1a2e', fontSize: 15 }}>{label}</span>
      </div>
      <span style={{ color: '#cbd5e1', fontSize: 18 }}>›</span>
    </div>
  )

  if (external) {
    return <a href={href} target="_blank" style={{ textDecoration: 'none' }}>{content}</a>
  }

  return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>
}