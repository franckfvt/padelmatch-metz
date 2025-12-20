'use client'

/**
 * ============================================
 * PAGE: Toutes les parties disponibles
 * ============================================
 * 
 * Liste complète avec filtres avancés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AllMatchesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterAmbiance, setFilterAmbiance] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
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

    // Charger toutes les parties
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        profiles!matches_organizer_id_fkey (id, name, avatar_url, level),
        clubs (id, name, city)
      `)
      .eq('status', 'open')
      .gte('match_date', new Date().toISOString().split('T')[0])
      .order('match_date', { ascending: true })

    setMatches(matchesData || [])

    // Extraire les villes
    const citiesSet = new Set()
    ;(matchesData || []).forEach(m => {
      if (m.clubs?.city) citiesSet.add(m.clubs.city)
      if (m.city) citiesSet.add(m.city)
    })
    setCities(Array.from(citiesSet).sort())

    if (profileData?.city) {
      setFilterCity(profileData.city)
    }

    setLoading(false)
  }

  function getFilteredMatches() {
    let filtered = matches

    // Filtre niveau
    if (filterLevel !== 'all') {
      const [min, max] = filterLevel.split('-').map(Number)
      filtered = filtered.filter(m => 
        (m.level_min || 1) >= min && (m.level_max || 10) <= max
      )
    }

    // Filtre ambiance
    if (filterAmbiance !== 'all') {
      filtered = filtered.filter(m => m.ambiance === filterAmbiance)
    }

    // Filtre ville
    if (filterCity !== 'all') {
      filtered = filtered.filter(m => 
        m.clubs?.city?.toLowerCase() === filterCity.toLowerCase() ||
        m.city?.toLowerCase() === filterCity.toLowerCase()
      )
    }

    // Filtre date
    if (filterDate !== 'all') {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      if (filterDate === 'today') {
        filtered = filtered.filter(m => m.match_date === todayStr)
      } else if (filterDate === 'week') {
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + 7)
        filtered = filtered.filter(m => 
          new Date(m.match_date) <= weekEnd
        )
      } else if (filterDate === 'weekend') {
        filtered = filtered.filter(m => {
          const d = new Date(m.match_date)
          return d.getDay() === 0 || d.getDay() === 6
        })
      }
    }

    return filtered
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Date flexible'
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const ambianceConfig = {
    loisir: { emoji: '😎', label: 'Détente', color: '#22c55e' },
    mix: { emoji: '⚡', label: 'Équilibré', color: '#3b82f6' },
    compet: { emoji: '🏆', label: 'Compétitif', color: '#f59e0b' }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const filteredMatches = getFilteredMatches()

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
          marginBottom: 12
        }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          🎾 Toutes les parties
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          {filteredMatches.length} partie{filteredMatches.length > 1 ? 's' : ''} disponible{filteredMatches.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1a1a2e' }}>
          🔍 Filtres
        </div>

        {/* Ville */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Ville</label>
          <select
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              background: '#fff'
            }}
          >
            <option value="all">Toutes les villes</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Quand</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tout' },
              { id: 'today', label: "Aujourd'hui" },
              { id: 'week', label: 'Cette semaine' },
              { id: 'weekend', label: 'Week-end' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterDate(opt.id)}
                style={{
                  padding: '8px 12px',
                  border: filterDate === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: filterDate === opt.id ? '#f0fdf4' : '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: filterDate === opt.id ? '#166534' : '#64748b'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Niveau */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Niveau</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tous' },
              { id: '1-3', label: '1-3 Débutant' },
              { id: '4-6', label: '4-6 Inter.' },
              { id: '7-10', label: '7+ Avancé' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterLevel(opt.id)}
                style={{
                  padding: '8px 12px',
                  border: filterLevel === opt.id ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: filterLevel === opt.id ? '#f0fdf4' : '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: filterLevel === opt.id ? '#166534' : '#64748b'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ambiance */}
        <div>
          <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>Ambiance</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterAmbiance('all')}
              style={{
                padding: '8px 12px',
                border: filterAmbiance === 'all' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                borderRadius: 8,
                background: filterAmbiance === 'all' ? '#f0fdf4' : '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                color: filterAmbiance === 'all' ? '#166534' : '#64748b'
              }}
            >
              Toutes
            </button>
            {Object.entries(ambianceConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterAmbiance(key)}
                style={{
                  padding: '8px 12px',
                  border: filterAmbiance === key ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: filterAmbiance === key ? `${cfg.color}15` : '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: filterAmbiance === key ? cfg.color : '#64748b'
                }}
              >
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des parties */}
      {filteredMatches.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🔍</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
            Aucune partie trouvée
          </h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Essaie d'élargir tes filtres
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredMatches.map(match => (
            <Link 
              key={match.id} 
              href={`/dashboard/match/${match.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 16,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
                      {formatDate(match.match_date)}
                      {match.match_time && ` • ${match.match_time.slice(0, 5)}`}
                    </div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                      📍 {match.clubs?.name || match.city || 'Lieu à définir'}
                    </div>
                  </div>
                  {match.ambiance && ambianceConfig[match.ambiance] && (
                    <span style={{
                      padding: '4px 10px',
                      background: `${ambianceConfig[match.ambiance].color}15`,
                      color: ambianceConfig[match.ambiance].color,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {ambianceConfig[match.ambiance].emoji} {ambianceConfig[match.ambiance].label}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {match.profiles?.avatar_url ? (
                        <img src={match.profiles.avatar_url} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 14 }}>{match.profiles?.name?.[0] || '?'}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      par {match.profiles?.name || 'Inconnu'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {match.level_min && match.level_max && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#f0fdf4',
                        color: '#166534',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        Niv. {match.level_min}-{match.level_max}
                      </span>
                    )}
                    <span style={{
                      padding: '6px 12px',
                      background: '#22c55e',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      Rejoindre →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}