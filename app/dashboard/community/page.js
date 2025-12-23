'use client'

/**
 * ============================================
 * PAGE COMMUNAUTÉ - AVEC MA CARTE INTÉGRÉE
 * ============================================
 * 
 * Structure:
 * 1. MA CARTE en haut (visible immédiatement)
 *    - Carte compacte
 *    - Bouton Partager (intelligent)
 *    - Bouton Mode Tournoi (plein écran)
 * 
 * 2. JOUEURS en dessous
 *    - Recherche
 *    - Tabs: Près de toi / Favoris / Récents
 *    - Liste des joueurs
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBadgeById } from '@/app/lib/badges'

// ============================================
// TOKENS DE DESIGN (cohérence avec page match)
// ============================================
const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardDark: '#1e293b',
  text: '#1a1a2e',
  textMuted: '#64748b',
  textLight: 'rgba(255,255,255,0.7)',
  border: '#e2e8f0',
  accent: '#22c55e',
  accentLight: '#dcfce7'
}

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20
}

export default function CommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Ma Carte
  const [showTournamentMode, setShowTournamentMode] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)
  
  // Tabs et recherche
  const [activeTab, setActiveTab] = useState('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Données joueurs
  const [nearbyPlayers, setNearbyPlayers] = useState([])
  const [favoritePlayers, setFavoritePlayers] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [recentPlayers, setRecentPlayers] = useState([])

  const playerColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

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

    // Charger les joueurs
    const { data: nearby } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, region, position')
      .neq('id', session.user.id)
      .limit(50)

    // Trier par ville de l'utilisateur d'abord
    let sortedNearby = nearby || []
    if (profileData?.city) {
      const sameCity = sortedNearby.filter(p => 
        p.city?.toLowerCase() === profileData.city?.toLowerCase()
      )
      const otherPlayers = sortedNearby.filter(p => 
        p.city?.toLowerCase() !== profileData.city?.toLowerCase()
      )
      sortedNearby = [...sameCity, ...otherPlayers]
    }
    setNearbyPlayers(sortedNearby)

    // Charger les favoris
    const { data: favorites } = await supabase
      .from('player_favorites')
      .select(`
        favorite_user_id,
        profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city, position)
      `)
      .eq('user_id', session.user.id)

    const favIds = new Set((favorites || []).map(f => f.favorite_user_id))
    setFavoriteIds(favIds)
    setFavoritePlayers((favorites || []).map(f => f.profiles).filter(Boolean))

    // Charger les joueurs récents
    const { data: recentMatches } = await supabase
      .from('match_participants')
      .select(`
        match_id,
        matches!inner (
          id, match_date,
          match_participants (
            user_id,
            profiles!match_participants_user_id_fkey (id, name, avatar_url, level, city, position)
          )
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .order('matches(match_date)', { ascending: false })
      .limit(10)

    const recentPlayersMap = new Map()
    ;(recentMatches || []).forEach(mp => {
      const match = mp.matches
      if (!match) return
      ;(match.match_participants || []).forEach(p => {
        if (p.user_id !== session.user.id && p.profiles && !recentPlayersMap.has(p.user_id)) {
          recentPlayersMap.set(p.user_id, p.profiles)
        }
      })
    })
    setRecentPlayers(Array.from(recentPlayersMap.values()))

    setLoading(false)
  }

  // ============================================
  // FONCTIONS PARTAGE MA CARTE
  // ============================================

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/player/${user?.id}` 
    : ''

  // Partage intelligent
  async function handleShare() {
    const shareText = `🎾 Mon profil Junto
⭐ Niveau ${profile?.level || '?'}
📍 ${profile?.city || 'France'}

👉 ${profileUrl}`
    
    // Mobile avec navigator.share
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - Junto`,
          text: shareText,
          url: profileUrl
        })
        return
      } catch (err) {
        // Annulé ou erreur, on continue
      }
    }
    
    // Fallback: WhatsApp (le plus utilisé)
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  // Copier le lien
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Impossible de copier le lien')
    }
  }

  // Télécharger PNG
  async function downloadCard() {
    if (!cardRef.current) return
    setDownloading(true)
    
    try {
      const html2canvas = (await import('html2canvas')).default
      
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const capture = html2canvas(cardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const canvas = await Promise.race([capture, timeout])
      
      const link = document.createElement('a')
      link.download = `carte-${profile?.name || 'joueur'}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      await copyLink()
      alert('Le lien de ton profil a été copié !')
    } finally {
      setDownloading(false)
    }
  }

  // Recherche joueurs
  async function searchPlayers(query) {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, position')
      .neq('id', user?.id)
      .ilike('name', `%${query}%`)
      .limit(10)

    setSearchResults(data || [])
    setIsSearching(false)
  }

  // Toggle favori
  async function toggleFavorite(playerId) {
    if (favoriteIds.has(playerId)) {
      await supabase
        .from('player_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_user_id', playerId)

      setFavoriteIds(prev => {
        const next = new Set(prev)
        next.delete(playerId)
        return next
      })
      setFavoritePlayers(prev => prev.filter(p => p.id !== playerId))
    } else {
      await supabase
        .from('player_favorites')
        .insert({ user_id: user.id, favorite_user_id: playerId })

      setFavoriteIds(prev => new Set([...prev, playerId]))
      
      const player = nearbyPlayers.find(p => p.id === playerId) || 
                     recentPlayers.find(p => p.id === playerId) ||
                     searchResults.find(p => p.id === playerId)
      if (player) {
        setFavoritePlayers(prev => [...prev, player])
      }
    }
  }

  // ============================================
  // CONFIG
  // ============================================
  
  const positionLabel = {
    right: '➡️ Droite',
    left: '⬅️ Gauche',
    both: '↔️ Polyvalent'
  }

  // ============================================
  // COMPOSANT CARTE COMPACTE
  // ============================================

  function MyCardCompact() {
    const badge = profile?.badge ? getBadgeById(profile.badge) : null
    const avatarColor = playerColors[(profile?.name?.[0]?.charCodeAt(0) || 0) % playerColors.length]
    
    return (
      <div 
        ref={cardRef}
        style={{
          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
          borderRadius: RADIUS.lg,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: RADIUS.lg,
          background: profile?.avatar_url 
            ? 'transparent'
            : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          fontWeight: 700,
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
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

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 6 
          }}>
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {profile?.name || 'Joueur'}
            </span>
            {badge && (
              <span style={{ fontSize: 14 }}>{badge.emoji}</span>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 6,
            fontSize: 12 
          }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              padding: '4px 10px',
              borderRadius: 6,
              fontWeight: 700
            }}>
              ⭐ {profile?.level || '?'}
            </span>
            {(profile?.city || profile?.region) && (
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                padding: '4px 10px',
                borderRadius: 6
              }}>
                📍 {profile?.city || profile?.region}
              </span>
            )}
            <span style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              padding: '4px 10px',
              borderRadius: 6
            }}>
              {positionLabel[profile?.position] || '↔️ Polyvalent'}
            </span>
          </div>
        </div>

        {/* Logo Junto petit */}
        <div style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}>
          🎾
        </div>
      </div>
    )
  }

  // ============================================
  // COMPOSANT JOUEUR
  // ============================================

  function PlayerCard({ player }) {
    const isFav = favoriteIds.has(player.id)
    const color = playerColors[(player.name?.[0]?.charCodeAt(0) || 0) % playerColors.length]
    
    return (
      <div style={{
        background: COLORS.card,
        borderRadius: RADIUS.lg,
        padding: 14,
        border: `1px solid ${COLORS.border}`,
        position: 'relative'
      }}>
        {/* Bouton favori */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(player.id) }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: isFav ? '#fef3c7' : COLORS.bg,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isFav ? '⭐' : '☆'}
        </button>

        <Link href={`/player/${player.id}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: player.avatar_url 
                ? 'transparent'
                : `linear-gradient(135deg, ${color}, ${color}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 10,
              overflow: 'hidden'
            }}>
              {player.avatar_url ? (
                <img 
                  src={player.avatar_url} 
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                player.name?.[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Nom */}
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: COLORS.text,
              marginBottom: 6,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {player.name}
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{
                background: COLORS.accentLight,
                color: '#16a34a',
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600
              }}>
                ⭐ {player.level || '?'}
              </span>
              {player.city && (
                <span style={{
                  background: COLORS.bg,
                  color: COLORS.textMuted,
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11
                }}>
                  📍 {player.city}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  // Liste de joueurs à afficher selon l'onglet
  let playersToShow = []
  if (searchQuery.length >= 2) {
    playersToShow = searchResults
  } else if (activeTab === 'nearby') {
    playersToShow = nearbyPlayers
  } else if (activeTab === 'favorites') {
    playersToShow = favoritePlayers
  } else if (activeTab === 'recent') {
    playersToShow = recentPlayers
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* ============================================ */}
      {/* SECTION MA CARTE                            */}
      {/* ============================================ */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: RADIUS.xl,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h2 style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            color: '#fff', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            🎴 Ma carte
          </h2>
          <Link href="/dashboard/profile/edit" style={{ 
            fontSize: 13, 
            color: 'rgba(255,255,255,0.6)', 
            textDecoration: 'none' 
          }}>
            ✏️ Modifier
          </Link>
        </div>

        {/* Carte compacte */}
        <MyCardCompact />

        {/* Boutons d'action */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 10, 
          marginTop: 16 
        }}>
          {/* Bouton Partager - Principal */}
          <button
            onClick={handleShare}
            style={{
              padding: 14,
              background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
              border: 'none',
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            📤 Partager
          </button>

          {/* Bouton Mode Tournoi */}
          <button
            onClick={() => setShowTournamentMode(true)}
            style={{
              padding: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            🏆 Tournoi
          </button>
        </div>

        {/* Actions secondaires */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 20, 
          marginTop: 14 
        }}>
          <button
            onClick={downloadCard}
            disabled={downloading}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: downloading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {downloading ? '⏳' : '📥'} Télécharger PNG
          </button>
          <button
            onClick={copyLink}
            style={{
              background: 'none',
              border: 'none',
              color: copied ? COLORS.accent : 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {copied ? '✓ Copié !' : '🔗 Copier le lien'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION JOUEURS                             */}
      {/* ============================================ */}
      
      {/* Recherche */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher un joueur..."
          value={searchQuery}
          onChange={(e) => searchPlayers(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
            background: COLORS.card
          }}
        />
      </div>

      {/* Tabs */}
      {searchQuery.length < 2 && (
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {[
            { id: 'nearby', label: '📍 Près de toi', count: nearbyPlayers.length },
            { id: 'favorites', label: '⭐ Favoris', count: favoritePlayers.length },
            { id: 'recent', label: '🕐 Récents', count: recentPlayers.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.id ? COLORS.text : COLORS.bg,
                color: activeTab === tab.id ? '#fff' : COLORS.textMuted,
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {tab.label}
              <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : COLORS.border,
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: 11
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Liste des joueurs */}
      {isSearching ? (
        <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>
          Recherche...
        </div>
      ) : playersToShow.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: COLORS.bg, 
          borderRadius: RADIUS.lg 
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            {activeTab === 'favorites' ? '⭐' : activeTab === 'recent' ? '🕐' : '👥'}
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 14 }}>
            {activeTab === 'favorites' 
              ? 'Aucun favori pour l\'instant'
              : activeTab === 'recent'
                ? 'Aucune partie récente'
                : searchQuery.length >= 2
                  ? 'Aucun joueur trouvé'
                  : 'Aucun joueur dans ta région'
            }
          </div>
        </div>
      ) : (
        <div className="players-grid">
          {playersToShow.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* MODE TOURNOI - PLEIN ÉCRAN                  */}
      {/* ============================================ */}
      {showTournamentMode && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setShowTournamentMode(false)}
        >
          {/* Carte géante */}
          <div style={{
            background: 'linear-gradient(135deg, #334155, #1e293b)',
            borderRadius: 24,
            padding: 32,
            textAlign: 'center',
            maxWidth: 320,
            width: '100%'
          }}>
            {/* Avatar */}
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: profile?.avatar_url 
                ? 'transparent'
                : `linear-gradient(135deg, ${playerColors[(profile?.name?.[0]?.charCodeAt(0) || 0) % playerColors.length]}, ${playerColors[(profile?.name?.[0]?.charCodeAt(0) || 0) % playerColors.length]}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
              fontWeight: 700,
              color: '#fff',
              margin: '0 auto 20px',
              border: '3px solid rgba(255,255,255,0.3)',
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
            <div style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              color: '#fff',
              marginBottom: 24 
            }}>
              {profile?.name}
            </div>

            {/* NIVEAU GÉANT */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '3px solid #22c55e',
              borderRadius: 20,
              padding: '24px 40px',
              marginBottom: 24
            }}>
              <div style={{ 
                fontSize: 72, 
                fontWeight: 900, 
                color: '#4ade80', 
                lineHeight: 1 
              }}>
                {profile?.level || '?'}
              </div>
              <div style={{ 
                fontSize: 14, 
                color: '#4ade80', 
                marginTop: 8,
                fontWeight: 600,
                letterSpacing: 2
              }}>
                NIVEAU
              </div>
            </div>

            {/* Position */}
            <div style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 20
            }}>
              {positionLabel[profile?.position] || '↔️ Polyvalent'}
            </div>

            {/* Lien court */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)'
            }}>
              padelmatch.fr/p/{profile?.name?.toLowerCase().replace(/\s+/g, '').slice(0, 10)}
            </div>
          </div>

          {/* Logo */}
          <div style={{
            marginTop: 32,
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)'
          }}>
            🎾 Junto
          </div>

          {/* Instruction */}
          <div style={{
            marginTop: 20,
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)'
          }}>
            Tap pour fermer
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        .players-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (min-width: 640px) {
          .players-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .players-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  )
}