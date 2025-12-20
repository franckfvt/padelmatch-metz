'use client'

/**
 * ============================================
 * PAGE COMMUNAUTÉ - VERSION 3
 * ============================================
 * 
 * Améliorations:
 * - Input de recherche ville (autocomplete)
 * - Meilleur UX favoris
 * - Boutons action plus visibles
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CommunityPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Tabs et recherche
  const [activeTab, setActiveTab] = useState('nearby')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Filtre ville
  const [citySearch, setCitySearch] = useState('')
  const [filterCity, setFilterCity] = useState('all')
  const [cities, setCities] = useState([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  
  // Données
  const [nearbyPlayers, setNearbyPlayers] = useState([])
  const [favoritePlayers, setFavoritePlayers] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [recentPlayers, setRecentPlayers] = useState([])
  
  // Modal inviter
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

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
      .select('id, name, avatar_url, level, city, region')
      .neq('id', session.user.id)
      .limit(100)

    // Extraire les villes uniques
    const citiesSet = new Set()
    ;(nearby || []).forEach(p => {
      if (p.city) citiesSet.add(p.city)
    })
    setCities(Array.from(citiesSet).sort())

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
      setFilterCity(profileData.city)
      setCitySearch(profileData.city)
    }
    setNearbyPlayers(sortedNearby)

    // Charger les favoris
    const { data: favorites } = await supabase
      .from('player_favorites')
      .select(`
        favorite_user_id,
        profiles!player_favorites_favorite_user_id_fkey (id, name, avatar_url, level, city)
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
            profiles!match_participants_user_id_fkey (id, name, avatar_url, level, city)
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
          recentPlayersMap.set(p.user_id, {
            ...p.profiles,
            lastPlayedDate: match.match_date
          })
        }
      })
    })
    setRecentPlayers(Array.from(recentPlayersMap.values()))

    if (typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/join?ref=${profileData?.referral_code || session.user.id}`)
    }

    setLoading(false)
  }

  // Recherche de joueurs
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
      .select('id, name, avatar_url, level, city')
      .neq('id', user?.id)
      .ilike('name', `%${query}%`)
      .limit(10)

    setSearchResults(data || [])
    setIsSearching(false)
  }

  // Sélectionner une ville
  function selectCity(city) {
    setFilterCity(city)
    setCitySearch(city)
    setShowCitySuggestions(false)
  }

  // Réinitialiser le filtre ville
  function clearCityFilter() {
    setFilterCity('all')
    setCitySearch('')
  }

  // Filtrer les suggestions de ville
  function getCitySuggestions() {
    if (!citySearch.trim()) return cities.slice(0, 8)
    return cities.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase())
    ).slice(0, 8)
  }

  // Ajouter/Retirer des favoris
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
        .insert({
          user_id: user.id,
          favorite_user_id: playerId
        })

      setFavoriteIds(prev => new Set([...prev, playerId]))
      
      const player = nearbyPlayers.find(p => p.id === playerId) || 
                     recentPlayers.find(p => p.id === playerId) ||
                     searchResults.find(p => p.id === playerId)
      if (player) {
        setFavoritePlayers(prev => [...prev, player])
      }
    }
  }

  // Copier le lien d'invitation
  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `🎾 Rejoins-moi sur PadelMatch pour organiser des parties de padel !\n\n${inviteLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareSMS() {
    const text = `Rejoins-moi sur PadelMatch ! ${inviteLink}`
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
  }

  // Filtrer les joueurs par ville
  function getFilteredPlayers(players) {
    if (filterCity === 'all') return players
    return players.filter(p => p.city?.toLowerCase() === filterCity.toLowerCase())
  }

  // === AVATAR COMPONENT ===
  function PlayerAvatar({ player, index, size = 48 }) {
    if (player?.avatar_url) {
      return (
        <img
          src={player.avatar_url}
          alt={player.name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      )
    }

    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: playerColors[index % playerColors.length],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        color: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {player?.name?.[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  // === PLAYER CARD COMPONENT ===
  function PlayerCard({ player, index, showLastPlayed = false }) {
    const isFavorite = favoriteIds.has(player.id)

    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <Link href={`/player/${player.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <PlayerAvatar player={player} index={index} size={44} />
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 2 }}>
              {player.name}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {player.city && <span>📍 {player.city}</span>}
              {player.city && player.level && <span> · </span>}
              {player.level && <span>⭐ {player.level}</span>}
            </div>
            {showLastPlayed && player.lastPlayedDate && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Dernière partie : {new Date(player.lastPlayedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        </Link>

        <button
          onClick={() => toggleFavorite(player.id)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: isFavorite ? '#fef3c7' : '#f1f5f9',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    )
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  // Données selon tab actif
  let currentPlayers = []
  let emptyMessage = ''
  let emptyIcon = '👥'

  switch (activeTab) {
    case 'nearby':
      currentPlayers = getFilteredPlayers(nearbyPlayers)
      emptyMessage = filterCity !== 'all' ? `Aucun joueur trouvé à ${filterCity}` : 'Aucun joueur trouvé'
      emptyIcon = '📍'
      break
    case 'favorites':
      currentPlayers = getFilteredPlayers(favoritePlayers)
      emptyMessage = 'Tu n\'as pas encore de joueurs favoris'
      emptyIcon = '⭐'
      break
    case 'recent':
      currentPlayers = getFilteredPlayers(recentPlayers)
      emptyMessage = 'Tu n\'as pas encore joué avec d\'autres joueurs'
      emptyIcon = '🕐'
      break
  }

  return (
    <div>
      {/* ============================================ */}
      {/* HEADER                                      */}
      {/* ============================================ */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Communauté
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Trouve des joueurs et agrandis ton réseau
        </p>
      </div>

      {/* ============================================ */}
      {/* BARRE DE RECHERCHE JOUEURS                  */}
      {/* ============================================ */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={searchQuery}
            onChange={(e) => searchPlayers(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              background: '#fff'
            }}
          />
        </div>

        {/* Résultats de recherche */}
        {searchQuery.length >= 2 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            zIndex: 50,
            marginTop: 8,
            maxHeight: 300,
            overflow: 'auto'
          }}>
            {isSearching ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                Recherche...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                Aucun joueur trouvé
              </div>
            ) : (
              searchResults.map((player, i) => (
                <div
                  key={player.id}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderBottom: i < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}
                >
                  <Link href={`/player/${player.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <PlayerAvatar player={player} index={i} size={36} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {player.city && `📍 ${player.city} · `}Niveau {player.level}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleFavorite(player.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 18,
                      cursor: 'pointer'
                    }}
                  >
                    {favoriteIds.has(player.id) ? '⭐' : '☆'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOUTON INVITER                              */}
      {/* ============================================ */}
      <button
        onClick={() => setShowInviteModal(true)}
        style={{
          width: '100%',
          padding: 14,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 16,
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        📧 Inviter des amis
      </button>

      {/* ============================================ */}
      {/* FILTRE VILLE (INPUT + SUGGESTIONS)          */}
      {/* ============================================ */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
          📍 Filtrer par ville
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Tape une ville..."
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value)
                setShowCitySuggestions(true)
                if (!e.target.value.trim()) {
                  setFilterCity('all')
                }
              }}
              onFocus={() => setShowCitySuggestions(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                background: '#fff'
              }}
            />

            {/* Suggestions */}
            {showCitySuggestions && getCitySuggestions().length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 40,
                marginTop: 4,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {getCitySuggestions().map((city, i) => (
                  <button
                    key={city}
                    onClick={() => selectCity(city)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: filterCity === city ? '#f1f5f9' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#1a1a2e',
                      borderBottom: i < getCitySuggestions().length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filterCity !== 'all' && (
            <button
              onClick={clearCityFilter}
              style={{
                padding: '12px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {filterCity !== 'all' && (
          <div style={{ marginTop: 8 }}>
            <span style={{
              display: 'inline-block',
              background: '#1a1a2e',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600
            }}>
              📍 {filterCity}
            </span>
          </div>
        )}
      </div>

      {/* Overlay pour fermer les suggestions */}
      {showCitySuggestions && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }}
          onClick={() => setShowCitySuggestions(false)}
        />
      )}

      {/* ============================================ */}
      {/* TABS                                        */}
      {/* ============================================ */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        borderBottom: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'nearby', label: 'Joueurs', count: getFilteredPlayers(nearbyPlayers).length },
          { id: 'favorites', label: 'Favoris', count: getFilteredPlayers(favoritePlayers).length },
          { id: 'recent', label: 'Récents', count: getFilteredPlayers(recentPlayers).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a1a2e' : '#94a3b8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a2e' : '2px solid transparent',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.id ? '#1a1a2e' : '#f1f5f9',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* LISTE DES JOUEURS                           */}
      {/* ============================================ */}
      {currentPlayers.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>{emptyIcon}</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
            {emptyMessage}
          </h3>
          {activeTab === 'favorites' && (
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Ajoute des joueurs en favoris avec ⭐
            </p>
          )}
          {activeTab === 'recent' && (
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Joue des parties pour voir tes partenaires ici
            </p>
          )}
        </div>
      ) : (
        <div className="players-grid">
          {currentPlayers.slice(0, 20).map((player, i) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              index={i} 
              showLastPlayed={activeTab === 'recent'}
            />
          ))}
          {currentPlayers.length > 20 && (
            <div style={{ textAlign: 'center', padding: 16, color: '#64748b', fontSize: 13 }}>
              Et {currentPlayers.length - 20} autres joueurs...
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL INVITER DES AMIS                      */}
      {/* ============================================ */}
      {showInviteModal && (
        <div style={{
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
          padding: 16
        }}
        onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 20px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Inviter des amis
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                Partage ton lien pour que tes amis rejoignent PadelMatch !
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Ton lien personnel
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 12,
                    color: '#64748b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {inviteLink}
                  </div>
                  <button
                    onClick={copyInviteLink}
                    style={{
                      padding: '12px 16px',
                      background: copied ? '#22c55e' : '#1a1a2e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copied ? '✓' : 'Copier'}
                  </button>
                </div>
              </div>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>
                Partager via
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <button
                  onClick={shareWhatsApp}
                  style={{
                    padding: '16px 8px',
                    background: '#25D366',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: 24 }}>💬</span>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>WhatsApp</span>
                </button>
                <button
                  onClick={shareSMS}
                  style={{
                    padding: '16px 8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: 24 }}>✉️</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>SMS</span>
                </button>
                <button
                  onClick={() => {
                    const subject = 'Rejoins-moi sur PadelMatch !'
                    const body = `Salut !\n\nRejoins-moi sur PadelMatch pour organiser des parties de padel.\n\n${inviteLink}`
                    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                  }}
                  style={{
                    padding: '16px 8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontSize: 24 }}>📧</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Email</span>
                </button>
              </div>
            </div>

            <div style={{
              padding: 20,
              background: '#f0fdf4',
              borderTop: '1px solid #dcfce7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }}>🎁</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#166534' }}>
                    Gagne des badges !
                  </div>
                  <div style={{ fontSize: 13, color: '#15803d' }}>
                    Tu as invité <strong>{profile?.referral_count || 0}</strong> personnes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        .players-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        /* Tablet - 768px */
        @media (min-width: 768px) {
          .players-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Desktop - 1024px */
        @media (min-width: 1024px) {
          .players-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* Large desktop - 1280px */
        @media (min-width: 1280px) {
          .players-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </div>
  )
}