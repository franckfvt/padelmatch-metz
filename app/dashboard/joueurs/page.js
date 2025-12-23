'use client'

/**
 * ============================================
 * PAGE JOUEURS - Hub social
 * ============================================
 * 
 * Sections:
 * - Recherche
 * - Mes favoris
 * - Joué récemment
 * - Joueurs près de moi
 * 
 * Action principale: [Inviter] sur chaque joueur
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { COLORS, RADIUS, getAvatarColor } from '@/app/lib/design-tokens'

export default function JoueursPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedMatchId = searchParams.get('match') // Si on vient de "Inviter" depuis une partie
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Données
  const [favoritePlayers, setFavoritePlayers] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [recentPlayers, setRecentPlayers] = useState([])
  const [nearbyPlayers, setNearbyPlayers] = useState([])
  
  // Modal invitation
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [myOpenMatches, setMyOpenMatches] = useState([])
  const [preselectedMatch, setPreselectedMatch] = useState(null)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPlayers()
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery])

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

    // === FAVORIS ===
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

    // === JOUEURS RÉCENTS (joué avec) ===
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
      .limit(20)

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
    setRecentPlayers(Array.from(recentPlayersMap.values()).slice(0, 10))

    // === JOUEURS PRÈS DE MOI ===
    let nearbyQuery = supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, position')
      .neq('id', session.user.id)
      .limit(30)

    // Prioriser la même ville
    if (profileData?.city) {
      nearbyQuery = nearbyQuery.ilike('city', `%${profileData.city}%`)
    }

    const { data: nearby } = await nearbyQuery

    // Trier: même ville d'abord
    let sortedNearby = nearby || []
    if (profileData?.city) {
      sortedNearby.sort((a, b) => {
        const aMatch = a.city?.toLowerCase() === profileData.city?.toLowerCase()
        const bMatch = b.city?.toLowerCase() === profileData.city?.toLowerCase()
        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1
        return 0
      })
    }
    setNearbyPlayers(sortedNearby)

    // === MES PARTIES OUVERTES (pour le modal invitation) ===
    const today = new Date().toISOString().split('T')[0]
    const { data: openMatches } = await supabase
      .from('matches')
      .select('id, match_date, match_time, spots_available, clubs(name), city')
      .eq('organizer_id', session.user.id)
      .eq('status', 'open')
      .gt('spots_available', 0)
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(5)

    setMyOpenMatches(openMatches || [])

    // Si un match est pré-sélectionné (vient de "Inviter" sur une partie)
    if (preselectedMatchId) {
      const match = (openMatches || []).find(m => m.id === preselectedMatchId)
      if (match) {
        setPreselectedMatch(match)
      }
    }

    setLoading(false)
  }

  async function searchPlayers() {
    setIsSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, level, city, position')
      .neq('id', user?.id)
      .ilike('name', `%${searchQuery}%`)
      .limit(10)

    setSearchResults(data || [])
    setIsSearching(false)
  }

  // === TOGGLE FAVORI ===
  async function toggleFavorite(playerId, e) {
    e?.stopPropagation()
    
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
      
      // Trouver le joueur dans les listes
      const player = nearbyPlayers.find(p => p.id === playerId) || 
                     recentPlayers.find(p => p.id === playerId) ||
                     searchResults.find(p => p.id === playerId)
      if (player) {
        setFavoritePlayers(prev => [...prev, player])
      }
    }
  }

  // === INVITER UN JOUEUR ===
  function openInviteModal(player, e) {
    e?.stopPropagation()
    setSelectedPlayer(player)
    setShowInviteModal(true)
  }

  async function inviteToExistingMatch(matchId) {
    if (!selectedPlayer) return
    setInviting(true)

    try {
      // Ajouter le joueur comme participant
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: matchId,
          user_id: selectedPlayer.id,
          status: 'invited',
          invited_by: user.id
        })

      if (error) throw error

      // Récupérer la partie pour décrémenter les places
      const match = myOpenMatches.find(m => m.id === matchId)
      if (match && match.spots_available > 0) {
        await supabase
          .from('matches')
          .update({ spots_available: match.spots_available - 1 })
          .eq('id', matchId)
      }

      // Fermer le modal et afficher confirmation
      setShowInviteModal(false)
      setSelectedPlayer(null)
      alert(`${selectedPlayer.name} a été invité(e) !`)
      
      // Recharger les données
      loadData()
    } catch (err) {
      console.error('Erreur invitation:', err)
      alert('Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  function createMatchWithPlayer() {
    if (!selectedPlayer) return
    setShowInviteModal(false)
    router.push(`/dashboard/matches/create?invite=${selectedPlayer.id}`)
  }

  // === HELPERS ===
  
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain'
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  }

  // === COMPOSANT CARTE JOUEUR ===
  function PlayerCard({ player, showInvite = true }) {
    const isFavorite = favoriteIds.has(player.id)
    
    return (
      <div
        onClick={() => router.push(`/player/${player.id}`)}
        style={{
          background: COLORS.card,
          borderRadius: RADIUS.md,
          border: `1px solid ${COLORS.border}`,
          padding: 14,
          cursor: 'pointer',
          transition: 'transform 0.1s',
          minWidth: 140
        }}
      >
        {/* Avatar + Favori */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
            color: '#fff',
            overflow: 'hidden'
          }}>
            {player.avatar_url 
              ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : player.name?.[0]?.toUpperCase()
            }
          </div>
          <button
            onClick={(e) => toggleFavorite(player.id, e)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4
            }}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        {/* Info */}
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text, marginBottom: 4 }}>
          {player.name}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 2 }}>
          ⭐ Niveau {player.level || '?'}
        </div>
        {player.city && (
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            📍 {player.city}
          </div>
        )}

        {/* Bouton Inviter */}
        {showInvite && (
          <button
            onClick={(e) => openInviteModal(player, e)}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '8px 12px',
              background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.sm,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Inviter
          </button>
        )}
      </div>
    )
  }

  // === RENDER ===

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  // Helper pour afficher la date
  function formatMatchDate(dateStr, timeStr) {
    if (!dateStr) return 'Date flexible'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    let dateText = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    if (date.toDateString() === today.toDateString()) dateText = "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) dateText = 'Demain'
    
    return `${dateText}${timeStr ? ' à ' + timeStr.slice(0,5) : ''}`
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 100px' }}>
      
      {/* Bandeau contexte si match pré-sélectionné */}
      {preselectedMatch && (
        <div style={{
          background: COLORS.accentLight,
          borderRadius: RADIUS.md,
          padding: 16,
          marginBottom: 16,
          border: `1px solid ${COLORS.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 700, color: COLORS.accent, fontSize: 14, marginBottom: 2 }}>
              🎯 Invite des joueurs pour ta partie
            </div>
            <div style={{ fontSize: 13, color: COLORS.accentText }}>
              {formatMatchDate(preselectedMatch.match_date, preselectedMatch.match_time)} • {preselectedMatch.clubs?.name || preselectedMatch.city || 'Lieu à définir'}
            </div>
          </div>
          <button
            onClick={() => {
              setPreselectedMatch(null)
              router.replace('/dashboard/joueurs')
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: COLORS.accent,
              padding: 4
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.text }}>
          👥 Joueurs
        </h1>
        <p style={{ color: COLORS.textMuted, margin: '4px 0 0', fontSize: 14 }}>
          Trouve des partenaires de jeu
        </p>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher un joueur..."
          style={{
            width: '100%',
            padding: '14px 16px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Résultats de recherche */}
        {searchQuery.length >= 2 && (
          <div style={{
            marginTop: 12,
            background: COLORS.card,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden'
          }}>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: 'center', color: COLORS.textMuted }}>
                Recherche...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: COLORS.textMuted }}>
                Aucun joueur trouvé
              </div>
            ) : (
              searchResults.map(player => (
                <div
                  key={player.id}
                  onClick={() => router.push(`/player/${player.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderBottom: `1px solid ${COLORS.border}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    color: '#fff',
                    overflow: 'hidden'
                  }}>
                    {player.avatar_url 
                      ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : player.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{player.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      ⭐ {player.level || '?'} • {player.city || 'Ville inconnue'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(player.id, e)}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                  >
                    {favoriteIds.has(player.id) ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={(e) => openInviteModal(player, e)}
                    style={{
                      padding: '6px 12px',
                      background: COLORS.accent,
                      color: '#fff',
                      border: 'none',
                      borderRadius: RADIUS.sm,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Inviter
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Section Favoris */}
      {favoritePlayers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
            ⭐ Mes favoris
          </h2>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            overflowX: 'auto',
            paddingBottom: 8,
            marginRight: -16,
            paddingRight: 16
          }}>
            {favoritePlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Section Récents */}
      {recentPlayers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
            🕐 Joué récemment
          </h2>
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            overflowX: 'auto',
            paddingBottom: 8,
            marginRight: -16,
            paddingRight: 16
          }}>
            {recentPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {/* Section Près de moi */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
          📍 {profile?.city ? `Joueurs à ${profile.city}` : 'Joueurs'}
        </h2>
        
        {nearbyPlayers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            background: COLORS.card,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <p style={{ color: COLORS.textMuted }}>
              Aucun joueur trouvé dans ta zone
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12
          }}>
            {nearbyPlayers.slice(0, 12).map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL INVITATION                            */}
      {/* ============================================ */}
      {showInviteModal && selectedPlayer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: COLORS.card,
              borderRadius: RADIUS.lg,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: COLORS.text }}>
                Inviter {selectedPlayer.name}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: COLORS.textMuted }}
              >
                ×
              </button>
            </div>

            {/* Joueur sélectionné */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: COLORS.bg,
              borderRadius: RADIUS.md,
              marginBottom: 20
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: selectedPlayer.avatar_url ? 'transparent' : getAvatarColor(selectedPlayer.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 600,
                color: '#fff',
                overflow: 'hidden'
              }}>
                {selectedPlayer.avatar_url 
                  ? <img src={selectedPlayer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : selectedPlayer.name?.[0]?.toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.text }}>{selectedPlayer.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>
                  ⭐ Niveau {selectedPlayer.level || '?'} • {selectedPlayer.city || ''}
                </div>
              </div>
            </div>

            {/* Parties disponibles */}
            {(preselectedMatch || myOpenMatches.length > 0) && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10 }}>
                  {preselectedMatch ? 'Ajouter à ta partie :' : 'Tes parties avec des places :'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Match pré-sélectionné en premier */}
                  {preselectedMatch && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        background: COLORS.accentLight,
                        borderRadius: RADIUS.md,
                        border: `2px solid ${COLORS.accent}`
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.accent }}>
                          {formatMatchDate(preselectedMatch.match_date, preselectedMatch.match_time)}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.accentText }}>
                          {preselectedMatch.clubs?.name || preselectedMatch.city || 'Lieu à définir'} • {preselectedMatch.spots_available} place{preselectedMatch.spots_available > 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => inviteToExistingMatch(preselectedMatch.id)}
                        disabled={inviting}
                        style={{
                          padding: '10px 16px',
                          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                          color: '#fff',
                          border: 'none',
                          borderRadius: RADIUS.sm,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: inviting ? 'not-allowed' : 'pointer',
                          opacity: inviting ? 0.7 : 1
                        }}
                      >
                        + Ajouter
                      </button>
                    </div>
                  )}
                  
                  {/* Autres matchs */}
                  {myOpenMatches.filter(m => m.id !== preselectedMatch?.id).map(match => (
                    <div
                      key={match.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        background: COLORS.bg,
                        borderRadius: RADIUS.md,
                        border: `1px solid ${COLORS.border}`
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>
                          {formatMatchDate(match.match_date, match.match_time)}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                          {match.clubs?.name || match.city || 'Lieu à définir'} • {match.spots_available} place{match.spots_available > 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => inviteToExistingMatch(match.id)}
                        disabled={inviting}
                        style={{
                          padding: '8px 14px',
                          background: COLORS.accent,
                          color: '#fff',
                          border: 'none',
                          borderRadius: RADIUS.sm,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: inviting ? 'not-allowed' : 'pointer',
                          opacity: inviting ? 0.7 : 1
                        }}
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Séparateur */}
            {(preselectedMatch || myOpenMatches.length > 0) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>ou</span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              </div>
            )}

            {/* Créer nouvelle partie */}
            <button
              onClick={createMatchWithPlayer}
              style={{
                width: '100%',
                padding: 14,
                background: `linear-gradient(135deg, ${COLORS.accent}, #16a34a)`,
                color: '#fff',
                border: 'none',
                borderRadius: RADIUS.md,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              🆕 Créer une partie avec {selectedPlayer.name?.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}