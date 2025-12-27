'use client'

/**
 * ============================================
 * PAGE MA CARTE - STYLE WARM + GAMIFICATION
 * ============================================
 * 
 * Fonctionnalités :
 * - Carte joueur avec niveau (Bronze→Légende)
 * - Série en cours affichée
 * - 2 formats de partage (Story 9:16 + Feed 1:1)
 * - Stats complètes
 * - Badges de performance
 * - QR Code personnel
 * - Style Warm cohérent
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  getPlayerLevel, 
  calculateFullStats,
  getUnlockedBadges 
} from '@/app/lib/gamification'
import { ProfileCard, ShareModal } from '@/app/components/ShareCards'

// === DESIGN TOKENS WARM ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  green: '#22c55e',
  greenSoft: '#dcfce7',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  cardDark: '#1a1a1a',
  
  border: '#eae8e4',
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

const AMBIANCE_CONFIG = {
  chill: { emoji: '😌', label: 'Détente', color: COLORS.p3 },
  loisir: { emoji: '😌', label: 'Détente', color: COLORS.p3 },
  mix: { emoji: '⚡', label: 'Équilibré', color: COLORS.p2 },
  competition: { emoji: '🔥', label: 'Compétition', color: COLORS.p1 },
  compet: { emoji: '🔥', label: 'Compétition', color: COLORS.p1 }
}

const POSITION_CONFIG = {
  left: { emoji: '⬅️', label: 'Gauche' },
  gauche: { emoji: '⬅️', label: 'Gauche' },
  right: { emoji: '➡️', label: 'Droite' },
  droite: { emoji: '➡️', label: 'Droite' },
  both: { emoji: '↔️', label: 'Polyvalent' }
}

// === COMPOSANT: Les 4 points animés ===
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: '50%', 
            background: c
          }} 
        />
      ))}
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function MaCartePage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Stats & Gamification
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    organized: 0
  })
  const [playerLevel, setPlayerLevel] = useState(null)
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [userBadges, setUserBadges] = useState([]) // Badges auto-déclarés
  
  // Partage
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareType, setShareType] = useState('profile')
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)

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

    // Profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setProfile(profileData)

    // Stats complètes avec gamification
    const fullStats = await calculateFullStats(supabase, session.user.id)
    setStats(fullStats)
    
    // Niveau joueur
    const level = getPlayerLevel(fullStats.totalGames)
    setPlayerLevel(level)
    
    // Badges de performance débloqués
    const badges = getUnlockedBadges(fullStats)
    setUnlockedBadges(badges)
    
    // Badges auto-déclarés (depuis la BDD)
    const { data: dbBadges } = await supabase
      .from('user_badges')
      .select(`badge_id, earned_at, badge_definitions (id, name, emoji, description)`)
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })
    setUserBadges(dbBadges || [])

    setLoading(false)
  }

  // === PARTAGE ===
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/player/${user?.id}` : ''

  function generateQRCode() {
    if (qrCodeUrl || !profileUrl) return qrCodeUrl
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=1a1a1a&margin=10`
    setQrCodeUrl(url)
    return url
  }

  async function handleNativeShare() {
    const shareText = `🎾 Mon profil 2×2\n${playerLevel?.emoji} ${playerLevel?.name}\n⭐ Niveau ${profile?.level || '?'}\n📍 ${profile?.city || 'France'}\n\n👉 ${profileUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.name} - 2×2`, text: shareText, url: profileUrl })
        return
      } catch (err) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Impossible de copier le lien')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Parrainage
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${user?.id?.slice(0, 8)}` : ''

  async function shareReferral() {
    const text = `🎾 Rejoins-moi sur 2×2, l'app pour organiser des parties de padel !\n\n👉 ${referralLink}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rejoins 2×2 !', text, url: referralLink })
        return
      } catch (err) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Helpers
  function getAvatarColor(name) {
    if (!name) return COLORS.p1
    return PLAYER_COLORS[name.charCodeAt(0) % 4]
  }

  const avatarColor = getAvatarColor(profile?.name)
  const ambiance = AMBIANCE_CONFIG[profile?.ambiance] || AMBIANCE_CONFIG.mix
  const position = POSITION_CONFIG[profile?.position] || POSITION_CONFIG.both

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 20,
        background: COLORS.bg
      }}>
        <FourDots size={14} gap={8} />
        <div style={{ color: COLORS.gray, fontSize: 15 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ 
        maxWidth: 500, 
        margin: '0 auto', 
        padding: '0 16px 100px',
        background: COLORS.bg,
        minHeight: '100vh'
      }}>
        
        {/* === HEADER === */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px 0',
          marginBottom: 8
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, margin: 0 }}>
            Ma Carte
          </h1>
          <Link href="/dashboard/profile/edit" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 16px',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.gray,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              ✏️ Modifier
            </button>
          </Link>
        </div>

        {/* === CARTE PRINCIPALE === */}
        <div style={{
          background: COLORS.cardDark,
          borderRadius: 28,
          padding: 32,
          marginBottom: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          {/* Avatar */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: profile?.avatar_url ? COLORS.bgSoft : avatarColor,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.white,
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
          }}>
            {profile?.avatar_url 
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : profile?.name?.[0]?.toUpperCase() || '?'
            }
          </div>

          {/* Nom */}
          <h2 style={{ 
            fontSize: 26, 
            fontWeight: 800, 
            color: COLORS.white, 
            textAlign: 'center',
            margin: '0 0 8px'
          }}>
            {profile?.name || 'Joueur'}
          </h2>

          {/* Niveau joueur (Bronze→Légende) */}
          {playerLevel && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <div style={{
                background: `${playerLevel.color}30`,
                color: playerLevel.color,
                padding: '8px 16px',
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {playerLevel.emoji} {playerLevel.name}
              </div>
            </div>
          )}

          {/* Niveau padel + Ville */}
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: 15,
            marginBottom: 20
          }}>
            ⭐ Niveau {profile?.level || '?'} · 📍 {profile?.city || 'France'}
          </div>

          {/* Stats sur la carte */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 20,
            padding: '16px 0',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.white }}>
                {stats.totalGames}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Parties</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>
                {stats.winRate}%
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Victoires</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 800, 
                color: stats.currentStreak > 0 ? COLORS.p2 : COLORS.white 
              }}>
                {stats.currentStreak > 0 ? `${stats.currentStreak}🔥` : '0'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Série</div>
            </div>
          </div>

          {/* Tags position/ambiance */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 10, 
            flexWrap: 'wrap',
            marginBottom: 20
          }}>
            <span style={{ 
              background: 'rgba(255,255,255,0.1)', 
              color: 'rgba(255,255,255,0.85)', 
              padding: '8px 14px', 
              borderRadius: 100, 
              fontSize: 13, 
              fontWeight: 600 
            }}>
              {position.emoji} {position.label}
            </span>
            <span style={{ 
              background: `${ambiance.color}30`, 
              color: ambiance.color, 
              padding: '8px 14px', 
              borderRadius: 100, 
              fontSize: 13, 
              fontWeight: 600 
            }}>
              {ambiance.emoji} {ambiance.label}
            </span>
          </div>

          {/* Logo 2×2 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              background: 'rgba(255,255,255,0.05)',
              padding: '10px 20px',
              borderRadius: 100
            }}>
              <span style={{ 
                fontSize: 18, 
                fontWeight: 900, 
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: -1
              }}>
                2×2
              </span>
              <FourDots size={6} gap={3} />
            </div>
          </div>
        </div>

        {/* === BOUTONS PARTAGE === */}
        <div style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>
            📤 Partager ma carte
          </h3>
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              onClick={() => {
                setShareType('profile')
                setShowShareModal(true)
              }}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: COLORS.ink,
                color: COLORS.white,
                border: 'none',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📱 Story / Feed
            </button>
            <button
              onClick={() => {
                generateQRCode()
                document.getElementById('qr-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: COLORS.card,
                color: COLORS.ink,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📲 QR Code
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleNativeShare}
              style={{
                flex: 1,
                padding: '12px',
                background: COLORS.bgSoft,
                border: 'none',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.gray,
                cursor: 'pointer'
              }}
            >
              📤 Partager
            </button>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '12px',
                background: COLORS.bgSoft,
                border: 'none',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.gray,
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copié !' : '🔗 Copier le lien'}
            </button>
          </div>
        </div>

        {/* === QR CODE === */}
        <div 
          id="qr-section"
          style={{
            background: COLORS.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>
            📲 Mon QR Code
          </h3>
          
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              style={{ 
                width: 160, 
                height: 160, 
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`
              }} 
            />
          ) : (
            <button
              onClick={generateQRCode}
              style={{
                width: 160,
                height: 160,
                borderRadius: 16,
                border: `2px dashed ${COLORS.border}`,
                background: COLORS.bgSoft,
                color: COLORS.muted,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span style={{ fontSize: 32 }}>📲</span>
              Générer le QR
            </button>
          )}
          
          <p style={{ fontSize: 13, color: COLORS.muted, margin: '16px 0 0' }}>
            Scanne pour voir mon profil
          </p>
        </div>

        {/* === BADGES === */}
        <div style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 24,
          marginBottom: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: 0 }}>
              🏅 Mes badges
            </h3>
            <Link href="/dashboard/me/badges" style={{ textDecoration: 'none' }}>
              <span style={{ 
                fontSize: 13, 
                color: COLORS.p4, 
                fontWeight: 600, 
                cursor: 'pointer',
                background: `${COLORS.p4}15`,
                padding: '6px 12px',
                borderRadius: 100
              }}>
                {unlockedBadges.length + userBadges.length} badges →
              </span>
            </Link>
          </div>
          
          {(unlockedBadges.length === 0 && userBadges.length === 0) ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '24px',
              background: COLORS.bgSoft,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
              <p style={{ color: COLORS.gray, margin: 0, fontSize: 13 }}>
                Joue des parties pour débloquer des badges !
              </p>
            </div>
          ) : (
            <>
              {/* Badges de performance */}
              {unlockedBadges.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 10, fontWeight: 600 }}>
                    🏆 Performance
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {unlockedBadges.slice(0, 4).map((badge) => (
                      <div 
                        key={badge.id}
                        title={badge.description}
                        style={{
                          background: COLORS.bgSoft,
                          borderRadius: 12,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.ink
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{badge.emoji}</span>
                        {badge.name}
                      </div>
                    ))}
                    {unlockedBadges.length > 4 && (
                      <div style={{
                        background: COLORS.bgSoft,
                        borderRadius: 12,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.muted
                      }}>
                        +{unlockedBadges.length - 4}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Badges auto-déclarés */}
              {userBadges.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 10, fontWeight: 600 }}>
                    ✨ Mon style
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {userBadges.slice(0, 4).map((ub) => (
                      <div 
                        key={ub.badge_id}
                        style={{
                          background: `${COLORS.p3}15`,
                          borderRadius: 12,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.ink
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{ub.badge_definitions?.emoji || '🏅'}</span>
                        {ub.badge_definitions?.name || 'Badge'}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* === STATS DÉTAILLÉES === */}
        <div style={{
          background: COLORS.card,
          borderRadius: 24,
          padding: 24,
          marginBottom: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>
            📊 Statistiques
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.totalGames}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Parties jouées</div>
            </div>
            <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.green }}>{stats.wins}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Victoires</div>
            </div>
            <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.winRate}%</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Taux victoire</div>
            </div>
            <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{stats.organized}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Organisées</div>
            </div>
          </div>
        </div>

        {/* === PARRAINAGE === */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.p4}15, ${COLORS.p3}15)`,
          borderRadius: 24,
          padding: 24,
          marginBottom: 16,
          border: `1px solid ${COLORS.p4}30`
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>
            🎁 Parrainage
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: COLORS.card,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.p4 }}>
                {profile?.referral_count || 0}
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>invités</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>
                Invite tes potes !
              </div>
              <div style={{ fontSize: 12, color: COLORS.gray }}>
                Débloque des badges exclusifs en invitant tes amis
              </div>
            </div>
          </div>
          
          <button
            onClick={shareReferral}
            style={{
              width: '100%',
              padding: '14px',
              background: COLORS.p4,
              color: COLORS.white,
              border: 'none',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📤 Inviter mes amis
          </button>
        </div>

        {/* === RÉGLAGES === */}
        <div style={{
          background: COLORS.card,
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ height: 4, background: COLORS.ink }} />
          <div style={{ padding: '20px 8px 8px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 12px', padding: '0 16px' }}>
              ⚙️ Réglages
            </h3>
            
            {[
              { href: '/dashboard/profile/edit', icon: '✏️', label: 'Modifier mon profil' },
              { href: '/dashboard/settings/notifications', icon: '🔔', label: 'Notifications' },
              { href: '/dashboard/settings/privacy', icon: '🔐', label: 'Confidentialité' },
              { href: '/dashboard/settings/help', icon: '❓', label: 'Aide & FAQ' },
              { href: '/terms', icon: '📄', label: 'CGU & Mentions légales' },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink, flex: 1 }}>{item.label}</span>
                  <span style={{ color: COLORS.muted, fontSize: 18 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
          
          <div style={{ padding: '8px 16px 16px', borderTop: `1px solid ${COLORS.border}` }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '14px',
                background: COLORS.bgSoft,
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.p1,
                cursor: 'pointer'
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>

        {/* === FOOTER === */}
        <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
          <FourDots size={8} gap={4} />
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>
            2×2 v2.0 · Made with 🎾 in France
          </p>
        </div>
      </div>

      {/* === MODAL PARTAGE (Story/Feed) === */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type={shareType}
        data={{
          name: profile?.name,
          level: profile?.level || 'Intermédiaire',
          city: profile?.city || 'France',
          totalGames: stats.totalGames,
          wins: stats.wins,
          winRate: stats.winRate,
          currentStreak: stats.currentStreak,
          playerLevel
        }}
      />

      <style jsx global>{`
        body {
          background: ${COLORS.bg};
        }
      `}</style>
    </>
  )
}