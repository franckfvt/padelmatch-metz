'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [myMatches, setMyMatches] = useState([])
  const [groups, setGroups] = useState([])
  const [clubs, setClubs] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdMatch, setCreatedMatch] = useState(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedProfile, setCopiedProfile] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Recherche joueur pour duo
  const [duoSearch, setDuoSearch] = useState('')
  const [duoSearchResults, setDuoSearchResults] = useState([])
  const [searchingDuo, setSearchingDuo] = useState(false)

  // État du nouveau match
  const [newMatch, setNewMatch] = useState({
    // Mode
    mode: 'terrain', // 'terrain' ou 'flexible'
    
    // Mode Terrain
    club_id: '',
    date: '',
    time: '',
    
    // Mode Flexible
    city: '',
    radius: '20',
    flexible_dates: [], // ['2024-01-15', '2024-01-16']
    time_start: '08:00',
    time_end: '22:00',
    
    // Commun
    spots: '3',
    ambiance: 'mix',
    gender: 'any', // 'any', 'mixed', 'men', 'women'
    level_min: '1',
    level_max: '10',
    price_total: '',
    description: '',
    private_notes: '',
    group_id: '',
    
    // Duo
    is_duo: false,
    duo_type: 'existing', // 'existing' ou 'invite'
    duo_player_id: '',
    duo_player_name: '',
    duo_invite_contact: '', // email ou téléphone
    duo_invite_name: ''
  })

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

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', desc: 'Fun et convivial' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', desc: 'Fun mais on joue bien' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', desc: 'On est là pour gagner' }
  ]

  const genderOptions = [
    { id: 'any', label: 'Peu importe', emoji: '👥' },
    { id: 'mixed', label: 'Mixte', emoji: '👫' },
    { id: 'men', label: 'Hommes', emoji: '👨' },
    { id: 'women', label: 'Femmes', emoji: '👩' }
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
          player_groups (id, name, description, created_by)
        `)
        .eq('user_id', session.user.id)

      setGroups(groupsData?.map(g => g.player_groups).filter(Boolean) || [])

      // Mes favoris (pour le duo)
      const { data: favoritesData } = await supabase
        .from('player_favorites')
        .select(`
          favorite_id,
          profiles:favorite_id (id, name, level, avatar_url)
        `)
        .eq('user_id', session.user.id)

      setFavorites(favoritesData?.map(f => f.profiles).filter(Boolean) || [])

      // === Mes parties avec 2 requêtes séparées ===
      const today = new Date().toISOString().split('T')[0]
      
      // 1. Parties où je suis organisateur
      const { data: orgMatches } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name)
        `)
        .eq('organizer_id', session.user.id)
        .gte('match_date', today)
        .order('match_date', { ascending: true })

      // 2. Parties où je suis participant
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
          .select(`
            *,
            clubs (name, address),
            profiles!matches_organizer_id_fkey (name)
          `)
          .in('id', matchIds)
          .gte('match_date', today)
          .order('match_date', { ascending: true })
        
        partMatches = partData || []
      }

      // Fusionner et dédupliquer
      const allMyMatches = [...(orgMatches || []), ...partMatches]
      const uniqueMyMatches = allMyMatches.reduce((acc, match) => {
        if (!acc.find(m => m.id === match.id)) {
          acc.push(match)
        }
        return acc
      }, [])
      
      // Trier par date
      uniqueMyMatches.sort((a, b) => {
        const dateA = new Date(a.match_date + 'T' + a.match_time)
        const dateB = new Date(b.match_date + 'T' + b.match_time)
        return dateA - dateB
      })

      setMyMatches(uniqueMyMatches.slice(0, 5))

      // Toutes les parties ouvertes
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name),
          match_participants (user_id, profiles (name))
        `)
        .eq('status', 'open')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(10)

      setMatches(matchesData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  // Recherche de joueur pour duo
  async function searchDuoPlayer(query) {
    if (query.length < 2) {
      setDuoSearchResults([])
      return
    }

    setSearchingDuo(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, level, avatar_url')
        .neq('id', user.id)
        .ilike('name', `%${query}%`)
        .limit(5)

      setDuoSearchResults(data || [])
    } catch (error) {
      console.error('Error searching:', error)
    }
    setSearchingDuo(false)
  }

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (duoSearch) searchDuoPlayer(duoSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [duoSearch])

  async function createMatch(e) {
    e.preventDefault()
    setCreating(true)

    try {
      // Déterminer le nombre de spots (si duo, on cherche 2 ou 1 joueur de moins)
      let spotsAvailable = parseInt(newMatch.spots)
      if (newMatch.is_duo) {
        spotsAvailable = Math.max(1, spotsAvailable - 1) // On est 2, donc 1 spot de moins
      }

      // Créer le match
      const matchData = {
        organizer_id: user.id,
        match_date: newMatch.mode === 'terrain' ? newMatch.date : (newMatch.flexible_dates[0] || newMatch.date),
        match_time: newMatch.mode === 'terrain' ? newMatch.time : newMatch.time_start,
        spots_total: 4,
        spots_available: spotsAvailable,
        ambiance: newMatch.ambiance,
        gender: newMatch.gender,
        level_min: parseInt(newMatch.level_min),
        level_max: parseInt(newMatch.level_max),
        price_total: newMatch.price_total ? parseInt(newMatch.price_total) * 100 : 0,
        description: newMatch.description || null,
        private_notes: newMatch.private_notes || null,
        status: 'open',
        organizer_team: 'A', // L'orga est toujours en équipe A
        
        // Mode flexible
        is_flexible: newMatch.mode === 'flexible',
        flexible_city: newMatch.mode === 'flexible' ? newMatch.city : null,
        flexible_radius: newMatch.mode === 'flexible' ? parseInt(newMatch.radius) : null,
        flexible_dates: newMatch.mode === 'flexible' && newMatch.flexible_dates.length > 0 
          ? newMatch.flexible_dates 
          : null,
        flexible_time_start: newMatch.mode === 'flexible' ? newMatch.time_start : null,
        flexible_time_end: newMatch.mode === 'flexible' ? newMatch.time_end : null,
      }

      // Si mode terrain, ajouter le club
      if (newMatch.mode === 'terrain' && newMatch.club_id) {
        matchData.club_id = parseInt(newMatch.club_id)
      }

      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select(`
          *,
          clubs (name, address)
        `)
        .single()

      if (error) throw error

      // Si duo avec joueur existant, l'ajouter comme participant CONFIRMÉ
      if (newMatch.is_duo && newMatch.duo_type === 'existing' && newMatch.duo_player_id) {
        await supabase
          .from('match_participants')
          .insert({
            match_id: data.id,
            user_id: newMatch.duo_player_id,
            status: 'confirmed', // ✅ Confirmé directement (invité par l'orga)
            team: 'A', // Même équipe que l'orga
            duo_with: user.id // Lié à l'orga
          })
        
        // Créer une notification pour le partenaire
        await supabase
          .from('notifications')
          .insert({
            user_id: newMatch.duo_player_id,
            type: 'duo_request',
            title: '🎾 Tu as été ajouté à une partie !',
            message: `${profile?.name || 'Un joueur'} t'a ajouté comme partenaire pour une partie le ${new Date(newMatch.date).toLocaleDateString('fr-FR')}`,
            match_id: data.id,
            related_user_id: user.id
          })
      }

      // Si duo avec invitation par contact
      if (newMatch.is_duo && newMatch.duo_type === 'invite' && newMatch.duo_invite_contact) {
        const { data: inviteData } = await supabase
          .from('pending_invites')
          .insert({
            match_id: data.id,
            inviter_id: user.id,
            invitee_name: newMatch.duo_invite_name || 'Partenaire',
            invitee_contact: newMatch.duo_invite_contact,
            team: 'A',
            status: 'pending'
          })
          .select()
          .single()
        
        // Envoyer l'email/SMS d'invitation
        if (inviteData) {
          try {
            await fetch('/api/send-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inviteId: inviteData.id,
                inviteToken: inviteData.invite_token,
                inviteeName: newMatch.duo_invite_name || 'Partenaire',
                inviteeContact: newMatch.duo_invite_contact,
                inviterName: profile?.name || 'Un joueur',
                matchDate: newMatch.date,
                matchTime: newMatch.time,
                clubName: clubs.find(c => c.id === parseInt(newMatch.club_id))?.name || 'À définir'
              })
            })
          } catch (e) {
            console.error('Erreur envoi invitation:', e)
            // On continue même si l'email échoue
          }
        }
      }

      // Fermer modal création, ouvrir modal succès
      setShowCreateModal(false)
      setCreatedMatch(data)
      setShowSuccessModal(true)
      
      // Reset form
      resetForm()
      
      // Recharger les données
      loadData()

    } catch (error) {
      console.error('Error creating match:', error)
      alert(`Erreur lors de la création: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  function resetForm() {
    setNewMatch({
      mode: 'terrain',
      club_id: '',
      date: '',
      time: '',
      city: '',
      radius: '20',
      flexible_dates: [],
      time_start: '08:00',
      time_end: '22:00',
      spots: '3',
      ambiance: 'mix',
      gender: 'any',
      level_min: '1',
      level_max: '10',
      price_total: '',
      description: '',
      private_notes: '',
      group_id: '',
      is_duo: false,
      duo_type: 'existing',
      duo_player_id: '',
      duo_player_name: '',
      duo_invite_contact: '',
      duo_invite_name: ''
    })
    setDuoSearch('')
    setDuoSearchResults([])
    setShowAdvanced(false)
  }

  function toggleFlexibleDate(date) {
    const dates = newMatch.flexible_dates
    if (dates.includes(date)) {
      setNewMatch({ ...newMatch, flexible_dates: dates.filter(d => d !== date) })
    } else {
      setNewMatch({ ...newMatch, flexible_dates: [...dates, date].sort() })
    }
  }

  function getNext7Days() {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? "Auj." : i === 1 ? "Demain" : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      })
    }
    return days
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'short', day: 'numeric', month: 'short' }
    return date.toLocaleDateString('fr-FR', options)
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
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
    const text = `🎾 Padel - ${formatDate(createdMatch.match_date)} à ${formatTime(createdMatch.match_time)}\n📍 ${createdMatch.clubs?.name || createdMatch.flexible_city || 'À définir'}\n\nRejoins-nous !\n${getInviteLink()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getInviteLink())}`, '_blank')
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopiedProfile(true)
    setTimeout(() => setCopiedProfile(false), 2000)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header avec profil et stats */}
      <div style={{
        background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: '700', margin: '0 0 8px' }}>
              Salut {profile?.name || 'Joueur'} 👋
            </h1>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              {profile?.level && (
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: '700'
                }}>
                  ⭐ {profile.level}/10
                </span>
              )}
              {profile?.ambiance && (
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 14
                }}>
                  {ambianceEmojis[profile.ambiance]} {ambianceLabels[profile.ambiance]}
                </span>
              )}
              <span style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: '600'
              }}>
                ✓ {profile?.reliability_score || 100}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, opacity: 0.8 }}>
              <span>🎾 {profile?.matches_played || 0} parties</span>
              <span>🏆 {profile?.matches_won || 0} victoires</span>
              {profile?.current_streak > 0 && (
                <span style={{ color: '#fbbf24' }}>🔥 {profile.current_streak} série</span>
              )}
            </div>
          </div>
          
          {/* Bouton partager ma carte */}
          <button
            onClick={copyProfileLink}
            style={{
              padding: '10px 16px',
              background: copiedProfile ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {copiedProfile ? '✓ Copié !' : '📋 Partager ma carte'}
          </button>
        </div>
      </div>

      {/* Gros bouton Créer une partie */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          width: '100%',
          padding: 24,
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          fontSize: 18,
          fontWeight: '700',
          cursor: 'pointer',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}
      >
        <span style={{ fontSize: 28 }}>🎾</span>
        Créer une partie
      </button>

      {/* Actions secondaires */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 32
      }}>
        <Link href="/dashboard/clubs" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 16,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 13 }}>
              Trouver une partie
            </div>
          </div>
        </Link>

        <Link href="/dashboard/stats" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 16,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 13 }}>
              Mes stats
            </div>
          </div>
        </Link>

        <Link href="/dashboard/groups" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 16,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>👥</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 13 }}>
              Mes groupes
            </div>
          </div>
        </Link>

        <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 16,
            border: '2px solid #e5e5e5',
            textAlign: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
            <div style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 13 }}>
              Mon profil
            </div>
          </div>
        </Link>
      </div>

      {/* Mes prochaines parties */}
      {myMatches.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' }}>
            🗓️ Mes prochaines parties
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {myMatches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0

              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 16,
                    border: '2px solid #2e7d32'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          {isOrganizer && (
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: '700'
                            }}>
                              👑 ORGA
                            </span>
                          )}
                          {match.is_flexible && (
                            <span style={{
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: '700'
                            }}>
                              📍 FLEXIBLE
                            </span>
                          )}
                          <span style={{ fontWeight: '700', color: '#1a1a1a' }}>
                            {formatDate(match.match_date)}
                          </span>
                          <span style={{ 
                            background: '#2e7d32', 
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontSize: 13,
                            fontWeight: '600'
                          }}>
                            {formatTime(match.match_time)}
                          </span>
                        </div>
                        <div style={{ color: '#666', fontSize: 14 }}>
                          📍 {match.clubs?.name || match.flexible_city || 'À définir'}
                        </div>
                      </div>
                      <div style={{
                        background: '#2e7d32',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: '600'
                      }}>
                        Voir →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Parties disponibles */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1a1a1a' }}>
          🎾 Parties disponibles
        </h2>
        
        {matches.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            border: '1px solid #eee'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Aucune partie disponible pour le moment
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
              Créer la première partie
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {matches.map(match => {
              const isOrganizer = match.organizer_id === user?.id
              const isParticipant = match.match_participants?.some(p => p.user_id === user?.id)
              const isInvolved = isOrganizer || isParticipant
              const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0

              return (
                <Link 
                  href={`/dashboard/match/${match.id}`}
                  key={match.id}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: 16,
                    border: isInvolved ? '2px solid #2e7d32' : '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          {match.is_flexible && (
                            <span style={{
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: '700'
                            }}>
                              📍 FLEXIBLE
                            </span>
                          )}
                          <span style={{ fontWeight: '700', color: '#1a1a1a' }}>
                            {formatDate(match.match_date)}
                          </span>
                          <span style={{ 
                            background: '#2e7d32', 
                            color: '#fff',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontSize: 13,
                            fontWeight: '600'
                          }}>
                            {formatTime(match.match_time)}
                          </span>
                          {pricePerPerson > 0 && (
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '3px 8px',
                              borderRadius: 5,
                              fontSize: 13,
                              fontWeight: '600'
                            }}>
                              💰 {pricePerPerson}€
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>
                          📍 {match.clubs?.name || match.flexible_city || 'À définir'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {match.level_min && match.level_max && (
                            <span style={{
                              fontSize: 12,
                              background: '#e8f5e9',
                              color: '#2e7d32',
                              padding: '3px 8px',
                              borderRadius: 5,
                              fontWeight: '500'
                            }}>
                              ⭐ {match.level_min === match.level_max ? `${match.level_min}/10` : `${match.level_min}-${match.level_max}/10`}
                            </span>
                          )}
                          <span style={{
                            fontSize: 12,
                            background: match.ambiance === 'compet' ? '#fef3c7' : 
                                       match.ambiance === 'loisir' ? '#dbeafe' : '#f3f4f6',
                            color: match.ambiance === 'compet' ? '#92400e' : 
                                   match.ambiance === 'loisir' ? '#1e40af' : '#4b5563',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontWeight: '500'
                          }}>
                            {ambianceEmojis[match.ambiance]} {ambianceLabels[match.ambiance]}
                          </span>
                          <span style={{
                            fontSize: 12,
                            background: match.spots_available === 0 ? '#fee2e2' : '#f5f5f5',
                            color: match.spots_available === 0 ? '#dc2626' : '#666',
                            padding: '3px 8px',
                            borderRadius: 5,
                            fontWeight: '500'
                          }}>
                            {match.spots_available === 0 ? 'Complet' : `${match.spots_available} place${match.spots_available > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        background: isInvolved ? '#2e7d32' : '#1a1a1a',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: '600'
                      }}>
                        {isInvolved ? 'Voir' : 'Rejoindre'}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Création */}
      {showCreateModal && (
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
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>
                🎾 Créer une partie
              </h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createMatch}>
              {/* === MODE TERRAIN / FLEXIBLE === */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Tu as déjà réservé un terrain ?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div
                    onClick={() => setNewMatch({ ...newMatch, mode: 'terrain' })}
                    style={{
                      padding: 14,
                      border: newMatch.mode === 'terrain' ? '2px solid #2e7d32' : '2px solid #eee',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: newMatch.mode === 'terrain' ? '#e8f5e9' : '#fff'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🏟️</div>
                    <div style={{ fontSize: 13, fontWeight: '600' }}>Oui, j'ai un terrain</div>
                  </div>
                  <div
                    onClick={() => setNewMatch({ ...newMatch, mode: 'flexible' })}
                    style={{
                      padding: 14,
                      border: newMatch.mode === 'flexible' ? '2px solid #1e40af' : '2px solid #eee',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: newMatch.mode === 'flexible' ? '#dbeafe' : '#fff'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🔍</div>
                    <div style={{ fontSize: 13, fontWeight: '600' }}>Non, je cherche</div>
                  </div>
                </div>
              </div>

              {/* === MODE TERRAIN === */}
              {newMatch.mode === 'terrain' && (
                <>
                  {/* Club */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      📍 Club *
                    </label>
                    <select
                      value={newMatch.club_id}
                      onChange={e => setNewMatch({ ...newMatch, club_id: e.target.value })}
                      required
                      style={inputStyle}
                    >
                      <option value="">Sélectionne un club</option>
                      {clubs.map(club => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date et Heure */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                        📅 Date *
                      </label>
                      <input
                        type="date"
                        value={newMatch.date}
                        onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                        min={getMinDate()}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                        🕐 Heure *
                      </label>
                      <input
                        type="time"
                        value={newMatch.time}
                        onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === MODE FLEXIBLE === */}
              {newMatch.mode === 'flexible' && (
                <>
                  {/* Ville */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      📍 Ville ou zone *
                    </label>
                    <input
                      type="text"
                      value={newMatch.city}
                      onChange={e => setNewMatch({ ...newMatch, city: e.target.value })}
                      placeholder="Ex: Metz, Paris 15e..."
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Rayon */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      🎯 Rayon de recherche
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['5', '10', '20', '30', '50'].map(km => (
                        <div
                          key={km}
                          onClick={() => setNewMatch({ ...newMatch, radius: km })}
                          style={{
                            flex: 1,
                            padding: '10px 6px',
                            border: newMatch.radius === km ? '2px solid #1e40af' : '2px solid #eee',
                            borderRadius: 8,
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontWeight: '600',
                            fontSize: 13,
                            background: newMatch.radius === km ? '#dbeafe' : '#fff'
                          }}
                        >
                          {km}km
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates flexibles */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      📅 Quand es-tu dispo ? (sélectionne plusieurs jours)
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {getNext7Days().map(day => (
                        <div
                          key={day.date}
                          onClick={() => toggleFlexibleDate(day.date)}
                          style={{
                            padding: '10px 14px',
                            border: newMatch.flexible_dates.includes(day.date) 
                              ? '2px solid #1e40af' 
                              : '2px solid #eee',
                            borderRadius: 8,
                            cursor: 'pointer',
                            textAlign: 'center',
                            background: newMatch.flexible_dates.includes(day.date) ? '#dbeafe' : '#fff',
                            fontWeight: '500',
                            fontSize: 13
                          }}
                        >
                          {day.label}
                        </div>
                      ))}
                    </div>
                    <input
                      type="date"
                      onChange={e => {
                        if (e.target.value && !newMatch.flexible_dates.includes(e.target.value)) {
                          toggleFlexibleDate(e.target.value)
                        }
                      }}
                      min={getMinDate()}
                      style={{ ...inputStyle, marginTop: 8 }}
                      placeholder="Autre date..."
                    />
                  </div>

                  {/* Heures flexibles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                        🕐 À partir de
                      </label>
                      <input
                        type="time"
                        value={newMatch.time_start}
                        onChange={e => setNewMatch({ ...newMatch, time_start: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                        Jusqu'à
                      </label>
                      <input
                        type="time"
                        value={newMatch.time_end}
                        onChange={e => setNewMatch({ ...newMatch, time_end: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* === DUO === */}
              <div style={{ 
                marginBottom: 16, 
                padding: 16, 
                background: newMatch.is_duo ? '#fef3c7' : '#f9fafb',
                borderRadius: 12,
                border: newMatch.is_duo ? '2px solid #fbbf24' : '1px solid #eee'
              }}>
                <div 
                  onClick={() => setNewMatch({ ...newMatch, is_duo: !newMatch.is_duo })}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: newMatch.is_duo ? '2px solid #fbbf24' : '2px solid #d1d5db',
                    background: newMatch.is_duo ? '#fbbf24' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700'
                  }}>
                    {newMatch.is_duo && '✓'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>👥 Je suis en duo</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Ton partenaire sera dans ton équipe</div>
                  </div>
                </div>

                {newMatch.is_duo && (
                  <div style={{ marginTop: 16 }}>
                    {/* Type de duo */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setNewMatch({ ...newMatch, duo_type: 'existing' })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: newMatch.duo_type === 'existing' ? '2px solid #92400e' : '2px solid #eee',
                          borderRadius: 8,
                          background: newMatch.duo_type === 'existing' ? '#fef3c7' : '#fff',
                          fontWeight: '600',
                          fontSize: 12,
                          cursor: 'pointer',
                          color: '#1a1a1a'
                        }}
                      >
                        🎾 Joueur inscrit
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMatch({ ...newMatch, duo_type: 'invite' })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: newMatch.duo_type === 'invite' ? '2px solid #92400e' : '2px solid #eee',
                          borderRadius: 8,
                          background: newMatch.duo_type === 'invite' ? '#fef3c7' : '#fff',
                          fontWeight: '600',
                          fontSize: 12,
                          cursor: 'pointer',
                          color: '#1a1a1a'
                        }}
                      >
                        ✉️ Inviter quelqu'un
                      </button>
                    </div>

                    {/* Joueur existant */}
                    {newMatch.duo_type === 'existing' && (
                      <div>
                        {/* Favoris */}
                        {favorites.length > 0 && !newMatch.duo_player_id && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>⭐ Tes favoris</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {favorites.slice(0, 4).map(fav => (
                                <div
                                  key={fav.id}
                                  onClick={() => setNewMatch({ 
                                    ...newMatch, 
                                    duo_player_id: fav.id,
                                    duo_player_name: fav.name
                                  })}
                                  style={{
                                    padding: '8px 12px',
                                    background: '#fff',
                                    border: '1px solid #eee',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}
                                >
                                  {fav.avatar_url ? (
                                    <img src={fav.avatar_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                                  ) : '👤'}
                                  {fav.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recherche */}
                        {!newMatch.duo_player_id ? (
                          <div>
                            <input
                              type="text"
                              value={duoSearch}
                              onChange={e => setDuoSearch(e.target.value)}
                              placeholder="Rechercher un joueur..."
                              style={inputStyle}
                            />
                            {duoSearchResults.length > 0 && (
                              <div style={{
                                background: '#fff',
                                border: '1px solid #eee',
                                borderRadius: 8,
                                marginTop: 4,
                                maxHeight: 150,
                                overflow: 'auto'
                              }}>
                                {duoSearchResults.map(player => (
                                  <div
                                    key={player.id}
                                    onClick={() => {
                                      setNewMatch({
                                        ...newMatch,
                                        duo_player_id: player.id,
                                        duo_player_name: player.name
                                      })
                                      setDuoSearch('')
                                      setDuoSearchResults([])
                                    }}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f5f5f5',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10
                                    }}
                                  >
                                    {player.avatar_url ? (
                                      <img src={player.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                    ) : (
                                      <div style={{ width: 28, height: 28, background: '#e5e5e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                    )}
                                    <div>
                                      <div style={{ fontWeight: '600', fontSize: 14 }}>{player.name}</div>
                                      <div style={{ fontSize: 12, color: '#666' }}>⭐ {player.level}/10</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            padding: 12,
                            background: '#fff',
                            borderRadius: 8,
                            border: '2px solid #22c55e',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>✓</span>
                              <span style={{ fontWeight: '600' }}>{newMatch.duo_player_name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewMatch({ ...newMatch, duo_player_id: '', duo_player_name: '' })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: 18
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invitation */}
                    {newMatch.duo_type === 'invite' && (
                      <div>
                        <input
                          type="text"
                          value={newMatch.duo_invite_name}
                          onChange={e => setNewMatch({ ...newMatch, duo_invite_name: e.target.value })}
                          placeholder="Prénom de ton partenaire"
                          style={{ ...inputStyle, marginBottom: 8 }}
                        />
                        <input
                          type="text"
                          value={newMatch.duo_invite_contact}
                          onChange={e => setNewMatch({ ...newMatch, duo_invite_contact: e.target.value })}
                          placeholder="Téléphone ou email"
                          style={inputStyle}
                        />
                        <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                          📱 Un lien d'invitation sera envoyé pour confirmer sa présence
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Joueurs recherchés */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  👥 Combien de joueurs tu cherches ? *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(newMatch.is_duo ? ['1', '2'] : ['1', '2', '3']).map(num => (
                    <div
                      key={num}
                      onClick={() => setNewMatch({ ...newMatch, spots: num })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: newMatch.spots === num ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: newMatch.spots === num ? '#fafafa' : '#fff'
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
                {newMatch.is_duo && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                    💡 Tu es en duo, donc {parseInt(newMatch.spots) + 2} joueurs au total
                  </div>
                )}
              </div>

              {/* Niveau min/max */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  ⭐ Niveau recherché
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Min</div>
                    <select
                      value={newMatch.level_min}
                      onChange={e => setNewMatch({ ...newMatch, level_min: e.target.value })}
                      style={inputStyle}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n}/10</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ color: '#999', fontWeight: '600', paddingTop: 18 }}>→</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Max</div>
                    <select
                      value={newMatch.level_max}
                      onChange={e => setNewMatch({ ...newMatch, level_max: e.target.value })}
                      style={inputStyle}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n}/10</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ambiance */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  Ambiance
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {ambianceOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setNewMatch({ ...newMatch, ambiance: opt.id })}
                      style={{
                        padding: '10px 6px',
                        border: newMatch.ambiance === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newMatch.ambiance === opt.id ? '#e8f5e9' : '#fff'
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genre / Mixte */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  Type de partie
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {genderOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setNewMatch({ ...newMatch, gender: opt.id })}
                      style={{
                        padding: '10px 4px',
                        border: newMatch.gender === opt.id ? '2px solid #1e40af' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: newMatch.gender === opt.id ? '#dbeafe' : '#fff'
                      }}
                    >
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: '600' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options avancées */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {showAdvanced ? '▼' : '▶'} Options avancées
              </button>

              {showAdvanced && (
                <>
                  {/* Description */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      ✏️ Description
                    </label>
                    <textarea
                      value={newMatch.description}
                      onChange={e => setNewMatch({ ...newMatch, description: e.target.value })}
                      placeholder="Ex: Match détendu, débutants bienvenus !"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  {/* Prix */}
                  {newMatch.mode === 'terrain' && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                        💰 Prix total du terrain
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={newMatch.price_total}
                          onChange={e => setNewMatch({ ...newMatch, price_total: e.target.value })}
                          placeholder="Ex: 60"
                          min="0"
                          style={{ ...inputStyle, paddingRight: 40 }}
                        />
                        <span style={{
                          position: 'absolute',
                          right: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#999',
                          fontWeight: '600'
                        }}>
                          €
                        </span>
                      </div>
                      {newMatch.price_total && (
                        <p style={{ fontSize: 12, color: '#2e7d32', marginTop: 4 }}>
                          → {Math.round(parseInt(newMatch.price_total) / 4)}€ par personne
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notes privées */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                      🔒 Notes privées
                    </label>
                    <textarea
                      value={newMatch.private_notes}
                      onChange={e => setNewMatch({ ...newMatch, private_notes: e.target.value })}
                      placeholder="Ex: Code portail 1234, terrain n°3..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                    <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                      Visible uniquement par les joueurs inscrits
                    </p>
                  </div>
                </>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={creating || (newMatch.mode === 'terrain' && (!newMatch.club_id || !newMatch.date || !newMatch.time)) || (newMatch.mode === 'flexible' && (!newMatch.city || newMatch.flexible_dates.length === 0))}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: creating ? '#e5e5e5' : '#1a1a1a',
                  color: creating ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : 'Créer la partie 🎾'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Succès */}
      {showSuccessModal && createdMatch && (
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
          padding: 20,
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            padding: 28,
            width: '100%',
            maxWidth: 420,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
              Partie créée !
            </h2>
            <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
              {createdMatch.is_flexible ? (
                <>
                  📍 {createdMatch.flexible_city} ({createdMatch.flexible_radius}km)<br />
                  Dates flexibles
                </>
              ) : (
                <>
                  {formatDate(createdMatch.match_date)} à {formatTime(createdMatch.match_time)}<br />
                  📍 {createdMatch.clubs?.name}
                </>
              )}
            </p>

            {/* Mémo partage */}
            <div style={{
              background: '#e8f5e9',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              textAlign: 'left',
              border: '1px solid #a5d6a7'
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#2e7d32', marginBottom: 4 }}>
                💡 Partage ce lien pour remplir ta partie !
              </div>
              <div style={{ fontSize: 12, color: '#2e7d32' }}>
                Les joueurs verront tous les détails et pourront s'inscrire en 1 clic.
              </div>
            </div>

            {/* Lien d'invitation */}
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
                padding: 14,
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>

            {/* Partage réseaux */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={shareFacebook}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#1877F2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Facebook
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
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push(`/dashboard/match/${createdMatch.id}`)
                }}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Voir la partie →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '2px solid #e5e5e5',
  borderRadius: 10,
  fontSize: 15,
  boxSizing: 'border-box',
  background: '#fff'
}