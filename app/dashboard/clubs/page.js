'use client'

/**
 * ============================================
 * PAGE CLUBS - VERSION 2
 * ============================================
 * 
 * Style similaire à la page Groupes
 * - Filtres par ville
 * - Infos complètes (site, adresse, etc.)
 * - Clubs favoris
 * - Clubs où j'ai joué
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClubsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Données
  const [clubs, setClubs] = useState([])
  const [favoriteClubIds, setFavoriteClubIds] = useState(new Set())
  const [playedClubIds, setPlayedClubIds] = useState(new Set())
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filterCity, setFilterCity] = useState('all')
  const [activeTab, setActiveTab] = useState('all') // all, favorites, played
  const [cities, setCities] = useState([])

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

    // Charger les clubs
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true })

    setClubs(clubsData || [])

    // Extraire les villes uniques
    const citiesSet = new Set()
    ;(clubsData || []).forEach(c => {
      if (c.city) citiesSet.add(c.city)
    })
    setCities(Array.from(citiesSet).sort())

    // Charger mes clubs favoris
    const { data: favorites } = await supabase
      .from('club_favorites')
      .select('club_id')
      .eq('user_id', session.user.id)

    setFavoriteClubIds(new Set((favorites || []).map(f => f.club_id)))

    // Charger les clubs où j'ai joué
    const { data: playedMatches } = await supabase
      .from('match_participants')
      .select('matches!inner(club_id)')
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')

    const playedIds = new Set()
    ;(playedMatches || []).forEach(mp => {
      if (mp.matches?.club_id) playedIds.add(mp.matches.club_id)
    })
    setPlayedClubIds(playedIds)

    // Filtre par défaut sur ma ville
    if (profileData?.city) {
      setFilterCity(profileData.city)
    }

    setLoading(false)
  }

  // Toggle favori
  async function toggleFavorite(clubId) {
    if (favoriteClubIds.has(clubId)) {
      await supabase
        .from('club_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId)

      setFavoriteClubIds(prev => {
        const next = new Set(prev)
        next.delete(clubId)
        return next
      })
    } else {
      await supabase
        .from('club_favorites')
        .insert({ user_id: user.id, club_id: clubId })

      setFavoriteClubIds(prev => new Set([...prev, clubId]))
    }
  }

  // Filtrer les clubs
  function getFilteredClubs() {
    let filtered = clubs

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
      )
    }

    // Filtre ville
    if (filterCity !== 'all') {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase() === filterCity.toLowerCase()
      )
    }

    // Filtre tab
    if (activeTab === 'favorites') {
      filtered = filtered.filter(c => favoriteClubIds.has(c.id))
    } else if (activeTab === 'played') {
      filtered = filtered.filter(c => playedClubIds.has(c.id))
    }

    return filtered
  }

  // Obtenir les suggestions de recherche
  function getSearchSuggestions() {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    
    const query = searchQuery.toLowerCase()
    const suggestions = []
    
    // Suggestions de clubs
    clubs.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
    ).slice(0, 5).forEach(club => {
      suggestions.push({
        type: 'club',
        id: club.id,
        label: club.name,
        sublabel: club.city
      })
    })
    
    // Suggestions de villes
    cities.filter(city => 
      city.toLowerCase().includes(query)
    ).slice(0, 3).forEach(city => {
      if (!suggestions.find(s => s.type === 'city' && s.label === city)) {
        suggestions.push({
          type: 'city',
          label: city,
          sublabel: `${clubs.filter(c => c.city === city).length} clubs`
        })
      }
    })
    
    return suggestions.slice(0, 6)
  }

  function handleSuggestionClick(suggestion) {
    if (suggestion.type === 'club') {
      router.push(`/dashboard/clubs/${suggestion.id}`)
    } else if (suggestion.type === 'city') {
      setFilterCity(suggestion.label)
      setSearchQuery('')
    }
    setShowSuggestions(false)
  }

  // Compter les parties jouées dans un club
  function getMatchesCountForClub(clubId) {
    // TODO: Implémenter le comptage réel
    return playedClubIds.has(clubId) ? '✓ Déjà joué' : null
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏟️</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const filteredClubs = getFilteredClubs()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/explore" style={{ 
          color: '#64748b', 
          textDecoration: 'none', 
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8
        }}>
          ← Explorer
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          🏟️ Clubs de padel
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Trouve un club près de chez toi
        </p>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 16 }}>
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
            placeholder="Rechercher un club, une ville..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(e.target.value.length >= 2)
            }}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
          
          {/* Suggestions dropdown */}
          {showSuggestions && getSearchSuggestions().length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              marginTop: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              {getSearchSuggestions().map((suggestion, i) => (
                <div
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: i < getSearchSuggestions().length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <span style={{ fontSize: 18 }}>
                    {suggestion.type === 'club' ? '🏟️' : '📍'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                      {suggestion.label}
                    </div>
                    {suggestion.sublabel && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {suggestion.sublabel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtres ville (pills) */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        <button
          onClick={() => setFilterCity('all')}
          style={{
            padding: '8px 16px',
            background: filterCity === 'all' ? '#1a1a2e' : '#fff',
            color: filterCity === 'all' ? '#fff' : '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          📍 Toutes
        </button>
        {cities.slice(0, 6).map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            style={{
              padding: '8px 16px',
              background: filterCity === city ? '#1a1a2e' : '#fff',
              color: filterCity === city ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        borderBottom: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'all', label: 'Tous', count: clubs.length },
          { id: 'favorites', label: '⭐ Favoris', count: favoriteClubIds.size },
          { id: 'played', label: '✓ Déjà joué', count: playedClubIds.size }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
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

      {/* Liste des clubs */}
      {filteredClubs.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🏟️</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
            {activeTab === 'favorites' 
              ? 'Aucun club en favoris' 
              : activeTab === 'played'
              ? 'Tu n\'as pas encore joué dans un club'
              : 'Aucun club trouvé'}
          </h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {activeTab === 'favorites' 
              ? 'Ajoute des clubs en favoris avec ⭐' 
              : activeTab === 'played'
              ? 'Participe à des parties pour voir tes clubs ici'
              : 'Essaie d\'élargir ta recherche'}
          </p>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredClubs.map((club, i, arr) => {
            const isFavorite = favoriteClubIds.has(club.id)
            const hasPlayed = playedClubIds.has(club.id)

            return (
              <div
                key={club.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  gap: 14
                }}
              >
                {/* Icône */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: hasPlayed ? '#dcfce7' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0
                }}>
                  🏟️
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
                      {club.name}
                    </span>
                    {hasPlayed && (
                      <span style={{
                        background: '#dcfce7',
                        color: '#16a34a',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        ✓ Déjà joué
                      </span>
                    )}
                  </div>

                  {/* Adresse */}
                  {(club.address || club.city) && (
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                      📍 {[club.address, club.city].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {/* Infos complémentaires */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {club.courts_count && (
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        🎾 {club.courts_count} terrains
                      </span>
                    )}
                    {club.phone && (
                      <a 
                        href={`tel:${club.phone}`}
                        style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}
                      >
                        📞 {club.phone}
                      </a>
                    )}
                    {club.website && (
                      <a 
                        href={club.website.startsWith('http') ? club.website : `https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}
                      >
                        🌐 Site web
                      </a>
                    )}
                  </div>
                </div>

                {/* Bouton favori */}
                <button
                  onClick={() => toggleFavorite(club.id)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: isFavorite ? '#fef3c7' : '#f1f5f9',
                    cursor: 'pointer',
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {isFavorite ? '⭐' : '☆'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <div style={{ fontSize: 13, color: '#0c4a6e', fontWeight: 600, marginBottom: 4 }}>
              Tu connais un club qui n'est pas listé ?
            </div>
            <div style={{ fontSize: 12, color: '#0369a1' }}>
              Contacte-nous à <a href="mailto:clubs@padelmatch.app" style={{ color: '#0369a1' }}>clubs@padelmatch.app</a> pour l'ajouter !
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}