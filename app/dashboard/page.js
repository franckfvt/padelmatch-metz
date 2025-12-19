'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateMatchModal from '@/app/components/CreateMatchModal'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [myMatches, setMyMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'my-level', 'this-week'

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
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
      
      // Parties où je suis organisateur
      const { data: orgMatches } = await supabase
        .from('matches')
        .select(`*, clubs (name, address), profiles!matches_organizer_id_fkey (name)`)
        .eq('organizer_id', session.user.id)
        .gte('match_date', today)
        .order('match_date', { ascending: true })

      // Parties où je suis participant
      const { data: participations } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      let partMatches = []
      if (participations && participations.length > 0) {
        const matchIds = participations.map(p => p.match_id)
        const { data: partData } = await supabase
          .from('matches')
          .select(`*, clubs (name, address), profiles!matches_organizer_id_fkey (name)`)
          .in('id', matchIds)
          .gte('match_date', today)
          .order('match_date', { ascending: true })
        
        partMatches = partData || []
      }

      // Fusionner et dédupliquer
      const allMyMatches = [...(orgMatches || []), ...partMatches]
      const uniqueMyMatches = allMyMatches.reduce((acc, match) => {
        if (!acc.find(m => m.id === match.id)) acc.push(match)
        return acc
      }, [])
      
      uniqueMyMatches.sort((a, b) => {
        const dateA = new Date(a.match_date + 'T' + a.match_time)
        const dateB = new Date(b.match_date + 'T' + b.match_time)
        return dateA - dateB
      })

      setMyMatches(uniqueMyMatches.slice(0, 3))

      // Toutes les parties ouvertes
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`*, clubs (name, address), profiles!matches_organizer_id_fkey (name), match_participants (user_id)`)
        .eq('status', 'open')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(20)

      setMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === tomorrow.toDateString()) return "Demain"
    
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getFilteredMatches() {
    let filtered = matches
    
    if (filter === 'my-level' && profile?.level) {
      filtered = matches.filter(m => {
        const min = m.level_min || 1
        const max = m.level_max || 10
        return profile.level >= min && profile.level <= max
      })
    } else if (filter === 'this-week') {
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() + 7)
      filtered = matches.filter(m => new Date(m.match_date) <= weekEnd)
    }
    
    return filtered
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  const filteredMatches = getFilteredMatches()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      
      {/* Greeting simple */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>
          Bonjour {profile?.name?.split(' ')[0] || 'Joueur'}
        </h1>
        <p style={{ fontSize: 15, color: '#666', margin: 0 }}>
          {myMatches.length > 0 
            ? `Tu as ${myMatches.length} partie${myMatches.length > 1 ? 's' : ''} à venir`
            : 'Aucune partie prévue pour le moment'
          }
        </p>
      </div>

      {/* Action principale - UNE seule */}
      <div 
        onClick={() => setShowCreateModal(true)}
        style={{
          background: '#1a1a1a',
          color: '#fff',
          padding: '24px 28px',
          borderRadius: 16,
          marginBottom: 48,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
            Créer une partie
          </h3>
          <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>
            Tu as réservé un terrain ? Trouve des joueurs.
          </p>
        </div>
        <span style={{ fontSize: 24, opacity: 0.5 }}>→</span>
      </div>

      {/* Mes prochaines parties */}
      {myMatches.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
              Mes prochaines parties
            </h2>
            <Link href="/dashboard/matches" style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>
              Tout voir
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myMatches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const spotsLeft = match.spots_total - (match.match_participants?.length || 0) - 1
              
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#ccc'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: '#2e7d32', fontWeight: '600', marginBottom: 4 }}>
                        {formatDate(match.match_date)} · {formatTime(match.match_time)}
                        {isOrganizer && <span style={{ marginLeft: 8, color: '#92400e' }}>👑</span>}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                        {match.clubs?.name || match.flexible_city || 'À définir'}
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        ⭐ {match.level_min}-{match.level_max} · {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>
                        {match.spots_total - spotsLeft}/{match.spots_total}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>joueurs</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Parties disponibles */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            Parties disponibles
          </h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              fontSize: 14, 
              color: '#666', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Filtrer {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Filtres - cachés par défaut */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'my-level', label: 'Mon niveau' },
              { id: 'this-week', label: 'Cette semaine' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  background: filter === f.id ? '#1a1a1a' : '#fff',
                  color: filter === f.id ? '#fff' : '#666',
                  border: filter === f.id ? 'none' : '1px solid #e5e5e5',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        
        {filteredMatches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#fff',
            border: '2px dashed #e5e5e5',
            borderRadius: 12
          }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎾</div>
            <h4 style={{ fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 8 }}>
              Aucune partie disponible
            </h4>
            <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
              {filter !== 'all' ? 'Essaie d\'élargir tes filtres' : 'Sois le premier à en créer une !'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Créer une partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredMatches.map(match => {
              const participantsCount = match.match_participants?.length || 0
              const spotsLeft = match.spots_total - participantsCount - 1
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : null
              
              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = '#ccc'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = '#eee'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#2e7d32', fontWeight: '600', marginBottom: 4 }}>
                        {formatDate(match.match_date)} · {formatTime(match.match_time)}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                        {match.clubs?.name || match.flexible_city || 'Lieu flexible'}
                      </div>
                      <div style={{ fontSize: 13, color: '#888' }}>
                        ⭐ {match.level_min}-{match.level_max} · {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
                        {pricePerPerson && <span> · {pricePerPerson}€</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: '700', color: spotsLeft <= 1 ? '#ea580c' : '#1a1a1a' }}>
                          {spotsLeft}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {spotsLeft === 1 ? 'place' : 'places'}
                        </div>
                      </div>
                      <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Modal création */}
      <CreateMatchModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          loadData()
        }}
        profile={profile}
        userId={user?.id}
      />
    </div>
  )
}