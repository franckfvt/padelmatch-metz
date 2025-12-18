'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [myMatches, setMyMatches] = useState([])
  const [availableMatches, setAvailableMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal création
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    level: 'all',
    price_total: '',
    private_notes: ''
  })
  
  // Modal succès (après création)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdMatchId, setCreatedMatchId] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true)
    }
  }, [searchParams])

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

      // Clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      setClubs(clubsData || [])

      // Mes parties (organisateur)
      const { data: myMatchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name),
          profiles!matches_organizer_id_fkey (id, name, level, position),
          match_participants (
            user_id,
            status,
            profiles (id, name, level, position)
          )
        `)
        .eq('organizer_id', session.user.id)
        .gte('match_date', new Date().toISOString().split('T')[0])
        .in('status', ['open', 'full'])
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })

      // Parties où je suis participant
      const { data: participatingData } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      const participatingIds = participatingData?.map(p => p.match_id) || []

      let allMyMatches = myMatchesData || []
      
      if (participatingIds.length > 0) {
        const { data: participatingMatches } = await supabase
          .from('matches')
          .select(`
            *,
            clubs (id, name),
            profiles!matches_organizer_id_fkey (id, name, level, position),
            match_participants (
              user_id,
              status,
              profiles (id, name, level, position)
            )
          `)
          .in('id', participatingIds)
          .gte('match_date', new Date().toISOString().split('T')[0])
          .in('status', ['open', 'full'])
          .order('match_date', { ascending: true })

        const existingIds = allMyMatches.map(m => m.id)
        participatingMatches?.forEach(m => {
          if (!existingIds.includes(m.id)) {
            allMyMatches.push(m)
          }
        })
      }

      allMyMatches.sort((a, b) => {
        const dateA = new Date(`${a.match_date}T${a.match_time}`)
        const dateB = new Date(`${b.match_date}T${b.match_time}`)
        return dateA - dateB
      })

      setMyMatches(allMyMatches)

      // Parties disponibles
      const { data: availableData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name),
          profiles!matches_organizer_id_fkey (id, name, level, position),
          match_participants (
            user_id,
            status,
            profiles (id, name, level, position)
          )
        `)
        .neq('organizer_id', session.user.id)
        .eq('status', 'open')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true })
        .limit(10)

      const available = (availableData || []).filter(m => 
        !participatingIds.includes(m.id)
      )

      setAvailableMatches(available)
      setLoading(false)

    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function createMatch(e) {
    e.preventDefault()
    if (!newMatch.club_id || !newMatch.date || !newMatch.time) {
      alert('Remplis le club, la date et l\'heure')
      return
    }

    setCreating(true)

    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: parseInt(newMatch.club_id),
          match_date: newMatch.date,
          match_time: newMatch.time,
          level_required: newMatch.level,
          price_total: newMatch.price_total ? parseFloat(newMatch.price_total) : null,
          private_notes: newMatch.private_notes || null,
          spots_total: 4,
          spots_available: 3,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Fermer modal création, ouvrir modal succès
      setShowCreate(false)
      setCreatedMatchId(data.id)
      setShowSuccess(true)
      
      // Reset form
      setNewMatch({
        club_id: '',
        date: '',
        time: '',
        level: 'all',
        price_total: '',
        private_notes: ''
      })
      
      // Recharger les données
      loadData()

    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${createdMatchId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const link = `${window.location.origin}/join/${createdMatchId}`
    const club = clubs.find(c => c.id === parseInt(newMatch.club_id))?.name || 'padel'
    const message = `🎾 Qui pour une partie de padel ?\n\n📍 ${club}\n📅 ${formatDate(newMatch.date)} à ${newMatch.time}\n\n👉 ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
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

  function getPlayerCount(match) {
    const confirmed = match.match_participants?.filter(p => p.status === 'confirmed').length || 0
    return 1 + confirmed
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            Salut {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: 14 }}>
            Prêt à jouer ?
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '12px 20px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          Créer
        </button>
      </div>

      {/* Quick actions si nouveau */}
      {myMatches.length === 0 && availableMatches.length === 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
          <h2 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 8px' }}>
            Bienvenue sur PadelMatch !
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
            Tu es niveau {profile?.level}/10, position {profile?.position === 'left' ? 'Gauche' : profile?.position === 'right' ? 'Droite' : 'Les deux'}
          </p>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '14px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Créer une partie
            </button>
            <Link
              href="/dashboard/profile"
              style={{
                padding: '14px 24px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Voir ma carte
            </Link>
          </div>

          {/* Astuce Facebook */}
          <div style={{
            background: '#eff6ff',
            borderRadius: 12,
            padding: 16,
            marginTop: 20,
            textAlign: 'left'
          }}>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 4 }}>
              💡 Astuce
            </div>
            <div style={{ fontSize: 13, color: '#1e40af' }}>
              Partage ton lien de profil sur les groupes Facebook pour te faire connaître !
            </div>
          </div>
        </div>
      )}

      {/* Mes prochaines parties */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
          📅 Mes prochaines parties
        </h2>

        {myMatches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <p style={{ color: '#666', margin: 0 }}>Aucune partie prévue</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myMatches.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/match/${match.id}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: '600', 
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {match.clubs?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatDate(match.match_date)} à {formatTime(match.match_time)}
                    </div>
                  </div>
                  <div style={{
                    background: getPlayerCount(match) >= 4 ? '#dcfce7' : '#fef3c7',
                    color: getPlayerCount(match) >= 4 ? '#166534' : '#92400e',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    {getPlayerCount(match)}/4
                  </div>
                </div>

                {/* Joueurs */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginTop: 12,
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: match.organizer_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                    color: match.organizer_id === user?.id ? '#fff' : '#1a1a1a',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12
                  }}>
                    👑 {match.profiles?.name?.split(' ')[0]}
                  </span>
                  
                  {match.match_participants?.filter(p => p.status === 'confirmed').map(p => (
                    <span key={p.user_id} style={{
                      background: p.user_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                      color: p.user_id === user?.id ? '#fff' : '#666',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12
                    }}>
                      {p.profiles?.name?.split(' ')[0]}
                    </span>
                  ))}
                  
                  {Array(4 - getPlayerCount(match)).fill(0).map((_, i) => (
                    <span key={i} style={{
                      background: '#fff',
                      border: '1px dashed #ddd',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#999'
                    }}>
                      ?
                    </span>
                  ))}
                </div>

                {match.organizer_id === user?.id && (
                  <div style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: '#16a34a',
                    fontWeight: '500'
                  }}>
                    👑 Tu organises
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Parties disponibles */}
      {availableMatches.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
            🔥 Parties à rejoindre
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {availableMatches.map(match => (
              <Link
                key={match.id}
                href={`/dashboard/match/${match.id}`}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #eee',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: '600', 
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {match.clubs?.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {formatDate(match.match_date)} à {formatTime(match.match_time)}
                    </div>
                    {match.level_required && match.level_required !== 'all' && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#16a34a',
                        marginTop: 4 
                      }}>
                        Niveau {match.level_required}+
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: '600'
                  }}>
                    {getPlayerCount(match)}/4
                  </div>
                </div>

                <div style={{ 
                  fontSize: 13,
                  color: '#666',
                  marginTop: 10
                }}>
                  Organisé par {match.profiles?.name?.split(' ')[0]}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* === MODAL CRÉATION === */}
      {showCreate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>
                🎾 Nouvelle partie
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMatch}>
              {/* Club */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 6,
                  color: '#1a1a1a'
                }}>
                  📍 Où ?
                </label>
                <select
                  value={newMatch.club_id}
                  onChange={(e) => setNewMatch({ ...newMatch, club_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    border: '2px solid #eee',
                    fontSize: 16,
                    background: '#fff'
                  }}
                  required
                >
                  <option value="">Choisis un club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              {/* Date et Heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: '600',
                    marginBottom: 6,
                    color: '#1a1a1a'
                  }}>
                    📅 Quand ?
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: 14,
                      borderRadius: 12,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: 14, 
                    fontWeight: '600',
                    marginBottom: 6,
                    color: '#1a1a1a'
                  }}>
                    🕐 Heure
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 14,
                      borderRadius: 12,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                    required
                  />
                </div>
              </div>

              {/* Niveau */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 6,
                  color: '#1a1a1a'
                }}>
                  🎯 Niveau minimum <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setNewMatch({ ...newMatch, level: 'all' })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '2px solid',
                      borderColor: newMatch.level === 'all' ? '#1a1a1a' : '#eee',
                      background: newMatch.level === 'all' ? '#1a1a1a' : '#fff',
                      color: newMatch.level === 'all' ? '#fff' : '#666',
                      fontSize: 13,
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Tous
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewMatch({ ...newMatch, level: level.toString() })}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '2px solid',
                        borderColor: newMatch.level === level.toString() ? '#1a1a1a' : '#eee',
                        background: newMatch.level === level.toString() ? '#1a1a1a' : '#fff',
                        color: newMatch.level === level.toString() ? '#fff' : '#666',
                        fontSize: 13,
                        fontWeight: '500',
                        cursor: 'pointer',
                        minWidth: 40
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 6,
                  color: '#1a1a1a'
                }}>
                  💰 Prix du terrain <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={newMatch.price_total}
                    onChange={(e) => setNewMatch({ ...newMatch, price_total: e.target.value })}
                    placeholder="60"
                    style={{
                      width: '100%',
                      padding: '14px 40px 14px 14px',
                      borderRadius: 12,
                      border: '2px solid #eee',
                      fontSize: 16
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }}>€</span>
                </div>
                {newMatch.price_total && (
                  <div style={{ fontSize: 13, color: '#16a34a', marginTop: 6 }}>
                    → {(parseFloat(newMatch.price_total) / 4).toFixed(0)}€ par personne
                  </div>
                )}
              </div>

              {/* Notes privées */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: '600',
                  marginBottom: 6,
                  color: '#1a1a1a'
                }}>
                  📝 Infos pratiques <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={newMatch.private_notes}
                  onChange={(e) => setNewMatch({ ...newMatch, private_notes: e.target.value })}
                  placeholder="Terrain 3, code portail 1234..."
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                />
              </div>

              {/* Bouton créer */}
              <button
                type="submit"
                disabled={creating}
                style={{
                  width: '100%',
                  padding: 16,
                  background: creating ? '#ccc' : '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : '🎾 Créer la partie'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL SUCCÈS === */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 8px' }}>
              Partie créée !
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 15 }}>
              Partage le lien pour inviter des joueurs
            </p>

            {/* Lien */}
            <div style={{
              background: '#f5f5f5',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              wordBreak: 'break-all',
              fontSize: 13,
              color: '#666'
            }}>
              {typeof window !== 'undefined' && `${window.location.origin}/join/${createdMatchId}`}
            </div>

            {/* Bouton copier */}
            <button
              onClick={copyInviteLink}
              style={{
                width: '100%',
                padding: 14,
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 10
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>

            {/* Partage rapide */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#dcfce7',
                  color: '#166534',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📱 WhatsApp
              </button>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/join/${createdMatchId}`
                  navigator.clipboard.writeText(link)
                  alert('Lien copié ! Colle-le sur Facebook.')
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📘 Facebook
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <Link
                href={`/dashboard/match/${createdMatchId}`}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#f5f5f5',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Voir la partie →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}