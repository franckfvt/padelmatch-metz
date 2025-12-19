'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [myMatches, setMyMatches] = useState([])
  const [clubs, setClubs] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Modal succès post-création
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdMatch, setCreatedMatch] = useState(null)
  const [copied, setCopied] = useState(false)

  const [newMatch, setNewMatch] = useState({
    club_id: '',
    date: '',
    time: '',
    spots: '3',
    ambiance: 'mix',
    level: 'all',
    price_total: '',
    private_notes: '',
    description: ''
  })

  const levelOptions = [
    { id: 'all', label: 'Tous niveaux', emoji: '🎾' },
    { id: 'less6months', label: 'Débutant', emoji: '🌱' },
    { id: '6months2years', label: 'Intermédiaire', emoji: '📈' },
    { id: '2to5years', label: 'Confirmé', emoji: '💪' },
    { id: 'more5years', label: 'Expert', emoji: '🏆' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆' }
  ]

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

      if (!profileData?.name) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      // Clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      setClubs(clubsData || [])

      // Mes groupes
      const { data: groupsData } = await supabase
        .from('group_members')
        .select(`
          group_id,
          player_groups (id, name)
        `)
        .eq('user_id', session.user.id)

      setGroups(groupsData?.map(g => g.player_groups).filter(Boolean) || [])

      // ========================================
      // FIX: Charger mes parties correctement
      // ========================================
      const today = new Date().toISOString().split('T')[0]
      
      // 1. Parties où je suis organisateur
      const { data: organizedMatches } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address),
          profiles!matches_organizer_id_fkey (id, name),
          match_participants (user_id, status, profiles (id, name))
        `)
        .eq('organizer_id', session.user.id)
        .gte('match_date', today)
        .neq('status', 'cancelled')
        .order('match_date', { ascending: true })

      // 2. Parties où je participe
      const { data: participations } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')

      let participatingMatches = []
      if (participations && participations.length > 0) {
        const matchIds = participations.map(p => p.match_id)
        
        const { data: pMatches } = await supabase
          .from('matches')
          .select(`
            *,
            clubs (id, name, address),
            profiles!matches_organizer_id_fkey (id, name),
            match_participants (user_id, status, profiles (id, name))
          `)
          .in('id', matchIds)
          .gte('match_date', today)
          .neq('status', 'cancelled')
      
        participatingMatches = pMatches || []
      }

      // 3. Fusionner et dédupliquer
      const allMatches = [...(organizedMatches || [])]
      participatingMatches.forEach(m => {
        if (!allMatches.find(am => am.id === m.id)) {
          allMatches.push(m)
        }
      })

      // 4. Trier par date/heure
      allMatches.sort((a, b) => {
        const dateA = new Date(`${a.match_date}T${a.match_time}`)
        const dateB = new Date(`${b.match_date}T${b.match_time}`)
        return dateA - dateB
      })

      setMyMatches(allMatches)
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
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
          spots_total: 4,
          spots_available: parseInt(newMatch.spots),
          ambiance: newMatch.ambiance,
          level_required: newMatch.level,
          price_total: newMatch.price_total ? parseInt(newMatch.price_total) * 100 : 0,
          private_notes: newMatch.private_notes || null,
          description: newMatch.description || null,
          status: 'open'
        })
        .select(`
          *,
          clubs (id, name)
        `)
        .single()

      if (error) throw error

      // Fermer modal création
      setShowCreateModal(false)
      
      // Sauvegarder les infos du match créé pour le modal succès
      setCreatedMatch(data)
      
      // Ouvrir modal succès
      setShowSuccessModal(true)
      
      // Reset form
      setNewMatch({
        club_id: '',
        date: '',
        time: '',
        spots: '3',
        ambiance: 'mix',
        level: 'all',
        price_total: '',
        private_notes: '',
        description: ''
      })
      
      // Recharger les données
      loadData()

    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  function getInviteLink() {
    if (!createdMatch) return ''
    return `${window.location.origin}/join/${createdMatch.id}`
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(getInviteLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const clubName = createdMatch?.clubs?.name || 'Padel'
    const date = formatDate(createdMatch?.match_date)
    const time = formatTime(createdMatch?.match_time)
    const message = `🎾 Qui pour une partie de padel ?\n\n📍 ${clubName}\n📅 ${date} à ${time}\n\n👉 ${getInviteLink()}`
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
    return 1 + confirmed // Orga + participants
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎾</div>
        <p style={{ color: '#666' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      
      {/* Header avec infos profil */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: '700', margin: '0 0 4px' }}>
          Salut {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
          Niveau {profile?.level || '?'}/10
          {profile?.position && ` • ${profile.position === 'left' ? 'Gauche' : profile.position === 'right' ? 'Droite' : 'Les deux'}`}
        </p>
      </div>

      {/* Boutons d'action principaux */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            flex: 2,
            padding: '16px 20px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🎾 Créer une partie
        </button>
        <Link
          href="/dashboard/profile"
          style={{
            flex: 1,
            padding: '16px 20px',
            background: '#f5f5f5',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: '600',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Ma carte
        </Link>
      </div>

      {/* Mes prochaines parties */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
          📅 Mes prochaines parties
        </h2>

        {myMatches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
            <p style={{ color: '#666', margin: '0 0 16px' }}>
              Aucune partie prévue
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Créer ma première partie
            </button>
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
                    <div style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                      {match.clubs?.name}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {formatDate(match.match_date)} à {formatTime(match.match_time)}
                    </div>
                    {match.organizer_id === user?.id && (
                      <div style={{ 
                        fontSize: 12, 
                        color: '#16a34a', 
                        marginTop: 6,
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#dcfce7',
                        padding: '4px 8px',
                        borderRadius: 6
                      }}>
                        👑 Tu organises
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: getPlayerCount(match) >= 4 ? '#dcfce7' : '#fef3c7',
                    color: getPlayerCount(match) >= 4 ? '#166534' : '#92400e',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {getPlayerCount(match)}/4
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* === MODAL CRÉATION === */}
      {showCreateModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700', margin: 0 }}>🎾 Nouvelle partie</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMatch}>
              {/* Club */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  📍 Où joues-tu ? *
                </label>
                <select
                  value={newMatch.club_id}
                  onChange={e => setNewMatch({ ...newMatch, club_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    background: '#fff'
                  }}
                >
                  <option value="">Choisis un club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              {/* Date et heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    📅 Date *
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                    min={getMinDate()}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 15
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    🕐 Heure *
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 15
                    }}
                  />
                </div>
              </div>

              {/* Joueurs recherchés */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  👥 Combien de joueurs tu cherches ? *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewMatch({ ...newMatch, spots: num })}
                      style={{
                        flex: 1,
                        padding: '14px',
                        border: newMatch.spots === num ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        background: newMatch.spots === num ? '#f5f5f5' : '#fff',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 16
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  ✏️ Description (optionnel)
                </label>
                <input
                  type="text"
                  value={newMatch.description}
                  onChange={e => setNewMatch({ ...newMatch, description: e.target.value })}
                  placeholder="Ex: Match mixte, on cherche 2 filles"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15
                  }}
                />
              </div>

              {/* Prix */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  💰 Prix total du terrain (optionnel)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={newMatch.price_total}
                    onChange={e => setNewMatch({ ...newMatch, price_total: e.target.value })}
                    placeholder="Ex: 60"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      paddingRight: 50,
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 15
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999',
                    fontWeight: '600'
                  }}>
                    €
                  </span>
                </div>
                {newMatch.price_total && (
                  <p style={{ fontSize: 13, color: '#16a34a', marginTop: 6 }}>
                    → {Math.round(parseInt(newMatch.price_total) / 4)}€ par personne
                  </p>
                )}
              </div>

              {/* Niveau */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  🎯 Niveau recherché
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {levelOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewMatch({ ...newMatch, level: opt.id })}
                      style={{
                        padding: '10px 14px',
                        border: newMatch.level === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        background: newMatch.level === opt.id ? '#f5f5f5' : '#fff',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: '500'
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambiance */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  🎭 Ambiance
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ambianceOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewMatch({ ...newMatch, ambiance: opt.id })}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        border: newMatch.ambiance === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        background: newMatch.ambiance === opt.id ? '#f5f5f5' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes privées */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  🔒 Infos pratiques (optionnel)
                </label>
                <textarea
                  value={newMatch.private_notes}
                  onChange={e => setNewMatch({ ...newMatch, private_notes: e.target.value })}
                  placeholder="Ex: Terrain n°3, code portail 1234..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    resize: 'none'
                  }}
                />
                <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  Visible uniquement par les joueurs acceptés
                </p>
              </div>

              {/* Bouton créer */}
              <button
                type="submit"
                disabled={creating || !newMatch.club_id || !newMatch.date || !newMatch.time}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? '#e5e5e5' : '#1a1a1a',
                  color: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating || !newMatch.club_id || !newMatch.date || !newMatch.time ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : '🎾 Créer la partie'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL SUCCÈS POST-CRÉATION === */}
      {showSuccessModal && createdMatch && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 420,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: '700', margin: '0 0 8px' }}>
              Partie créée !
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 15 }}>
              Partage le lien pour trouver des joueurs
            </p>

            {/* Résumé de la partie */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: '600', marginBottom: 4 }}>{createdMatch.clubs?.name}</div>
              <div style={{ fontSize: 14, color: '#666' }}>
                {formatDate(createdMatch.match_date)} à {formatTime(createdMatch.match_time)}
              </div>
            </div>

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
              {getInviteLink()}
            </div>

            {/* Bouton copier */}
            <button
              onClick={copyInviteLink}
              style={{
                width: '100%',
                padding: 16,
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>

            {/* Astuce Facebook */}
            <div style={{
              background: '#eff6ff',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              textAlign: 'left',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 4 }}>
                💡 Astuce pour Facebook
              </div>
              <div style={{ fontSize: 12, color: '#1e40af' }}>
                Colle ce lien dans ton groupe padel. Les joueurs verront directement les infos !
              </div>
            </div>

            {/* Boutons partage */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1,
                  padding: 14,
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
                  copyInviteLink()
                }}
                style={{
                  flex: 1,
                  padding: 14,
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
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  flex: 1,
                  padding: 14,
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
                href={`/dashboard/match/${createdMatch.id}`}
                style={{
                  flex: 1,
                  padding: 14,
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