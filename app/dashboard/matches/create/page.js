'use client'

/**
 * ============================================
 * PAGE CRÉATION DE PARTIE - Version dédiée
 * ============================================
 * 
 * Remplace le modal CreateMatchModal par une page
 * plus légère et maintenable.
 * 
 * 6 étapes :
 * 1. Réservation (oui/non)
 * 2. Lieu (club ou ville)
 * 3. Date/Heure
 * 4. Inviter joueurs
 * 5. Ambiance/Niveau/Prix
 * 6. Récap & Partage
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { COLORS, FOUR_DOTS, RADIUS, getAvatarColor, AMBIANCE_CONFIG } from '@/app/lib/design-tokens'

const TOTAL_STEPS = 6

export default function CreateMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitePlayerId = searchParams.get('invite') // ID du joueur à pré-ajouter
  
  // Auth
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Navigation
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [matchCreated, setMatchCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // Données clubs
  const [clubs, setClubs] = useState([])
  const [favoriteClubIds, setFavoriteClubIds] = useState([])
  const [recentClubs, setRecentClubs] = useState([])
  const [clubSearch, setClubSearch] = useState('')
  const [showAddClub, setShowAddClub] = useState(false)
  const [newClub, setNewClub] = useState({ name: '', address: '', city: '' })
  
  // Données joueurs
  const [recentPlayers, setRecentPlayers] = useState([])
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState([])
  const [manualPartnerName, setManualPartnerName] = useState('')
  const [manualPartnerEmail, setManualPartnerEmail] = useState('')
  
  // Formulaire
  const [formData, setFormData] = useState({
    hasBooked: null,
    locationType: 'club',
    club_id: null,
    club_name: '',
    club_data: null,
    city: '',
    radius: 10,
    dateType: 'precise',
    date: '',
    time: '',
    flexibleDays: [],
    flexiblePeriod: '',
    partners: [],
    level_min: 3,
    level_max: 7,
    ambiance: 'mix',
    price_total: '',
    paymentMethod: 'paylib',
    organizer_team: 'A'
  })

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  
  useEffect(() => {
    loadInitialData()
  }, [])
  
  useEffect(() => {
    if (playerSearch.length >= 2) {
      searchPlayers()
    } else {
      setPlayerResults([])
    }
  }, [playerSearch])

  async function loadInitialData() {
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
    
    // Initialiser le formulaire avec les données du profil
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        city: profileData.city || '',
        level_min: Math.max(1, (profileData.level || 5) - 2),
        level_max: Math.min(10, (profileData.level || 5) + 2),
        ambiance: profileData.ambiance || 'mix'
      }))
    }
    
    // Clubs
    const { data: clubsData } = await supabase
      .from('clubs')
      .select('*')
      .order('name')
    setClubs(clubsData || [])
    
    // Favoris clubs
    const { data: favClubs } = await supabase
      .from('user_favorite_clubs')
      .select('club_id')
      .eq('user_id', session.user.id)
    setFavoriteClubIds((favClubs || []).map(f => f.club_id))
    
    // Clubs récents
    const { data: recentMatchesData } = await supabase
      .from('matches')
      .select('club_id, clubs(id, name, address, city)')
      .eq('organizer_id', session.user.id)
      .not('club_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    const seen = new Set()
    const recent = []
    ;(recentMatchesData || []).forEach(m => {
      if (m.clubs && !seen.has(m.clubs.id)) {
        seen.add(m.clubs.id)
        recent.push(m.clubs)
      }
    })
    setRecentClubs(recent.slice(0, 5))
    
    // Joueurs récents
    const { data: recentPlayersData } = await supabase
      .from('match_participants')
      .select('profiles:user_id (id, name, level, avatar_url)')
      .neq('user_id', session.user.id)
      .limit(20)
    
    const uniquePlayers = []
    const seenPlayers = new Set()
    ;(recentPlayersData || []).forEach(d => {
      if (d.profiles && !seenPlayers.has(d.profiles.id)) {
        seenPlayers.add(d.profiles.id)
        uniquePlayers.push(d.profiles)
      }
    })
    setRecentPlayers(uniquePlayers.slice(0, 6))
    
    // Si on a un joueur à inviter (depuis ?invite=PLAYER_ID)
    if (invitePlayerId) {
      const { data: invitedPlayer } = await supabase
        .from('profiles')
        .select('id, name, level, avatar_url')
        .eq('id', invitePlayerId)
        .single()
      
      if (invitedPlayer) {
        setFormData(prev => ({
          ...prev,
          partners: [{
            id: invitedPlayer.id,
            name: invitedPlayer.name,
            level: invitedPlayer.level,
            avatar_url: invitedPlayer.avatar_url,
            team: 'A',
            isManual: false
          }]
        }))
      }
    }
    
    setLoading(false)
  }

  // ============================================
  // FONCTIONS CLUBS
  // ============================================
  
  async function toggleFavoriteClub(clubId) {
    if (favoriteClubIds.includes(clubId)) {
      await supabase
        .from('user_favorite_clubs')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId)
      setFavoriteClubIds(prev => prev.filter(id => id !== clubId))
    } else {
      await supabase
        .from('user_favorite_clubs')
        .insert({ user_id: user.id, club_id: clubId })
      setFavoriteClubIds(prev => [...prev, clubId])
    }
  }
  
  function selectClub(club) {
    setFormData({
      ...formData,
      club_id: club.id,
      club_name: club.name,
      club_data: club,
      city: club.city || ''
    })
  }
  
  async function addNewClub() {
    if (!newClub.name || !newClub.city) return
    
    const { data: club, error } = await supabase
      .from('clubs')
      .insert({
        name: newClub.name,
        address: newClub.address,
        city: newClub.city,
        created_by: user.id
      })
      .select()
      .single()
    
    if (!error && club) {
      setClubs([...clubs, club])
      selectClub(club)
      setShowAddClub(false)
      setNewClub({ name: '', address: '', city: '' })
    }
  }
  
  // Filtrer les clubs
  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(clubSearch.toLowerCase())
  )
  
  // Clubs triés (favoris d'abord, puis récents, puis le reste)
  const sortedClubs = [
    ...filteredClubs.filter(c => favoriteClubIds.includes(c.id)),
    ...recentClubs.filter(c => !favoriteClubIds.includes(c.id) && filteredClubs.some(fc => fc.id === c.id)),
    ...filteredClubs.filter(c => !favoriteClubIds.includes(c.id) && !recentClubs.some(rc => rc.id === c.id))
  ]

  // ============================================
  // FONCTIONS JOUEURS
  // ============================================
  
  async function searchPlayers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, level, avatar_url')
      .neq('id', user?.id)
      .ilike('name', `%${playerSearch}%`)
      .limit(5)
    
    const partnerIds = formData.partners.map(p => p.id)
    setPlayerResults((data || []).filter(p => !partnerIds.includes(p.id)))
  }
  
  function addPartner(player) {
    if (formData.partners.length >= 3) return
    
    const newPartner = {
      id: player.id,
      name: player.name,
      level: player.level,
      avatar_url: player.avatar_url,
      team: formData.organizer_team,
      isManual: false
    }
    
    setFormData({
      ...formData,
      partners: [...formData.partners, newPartner]
    })
    setPlayerSearch('')
    setPlayerResults([])
  }
  
  function addManualPartner() {
    if (!manualPartnerName.trim() || formData.partners.length >= 3) return
    
    const newPartner = {
      id: `manual-${Date.now()}`,
      name: manualPartnerName.trim(),
      email: manualPartnerEmail.trim() || null,
      inviteToken: crypto.randomUUID(),
      team: formData.organizer_team,
      isManual: true
    }
    
    setFormData({
      ...formData,
      partners: [...formData.partners, newPartner]
    })
    setManualPartnerName('')
    setManualPartnerEmail('')
  }
  
  function removePartner(partnerId) {
    setFormData({
      ...formData,
      partners: formData.partners.filter(p => p.id !== partnerId)
    })
  }
  
  function setPartnerTeam(partnerId, team) {
    setFormData({
      ...formData,
      partners: formData.partners.map(p =>
        p.id === partnerId ? { ...p, team } : p
      )
    })
  }

  // ============================================
  // VALIDATION
  // ============================================
  
  function canProceed() {
    switch (step) {
      case 1: return formData.hasBooked !== null
      case 2:
        if (formData.locationType === 'club') return formData.club_id !== null
        return formData.city.trim() !== ''
      case 3:
        if (formData.dateType === 'precise') return formData.date && formData.time
        return formData.flexibleDays.length > 0
      case 4: return true
      case 5: return true
      default: return true
    }
  }
  
  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  // ============================================
  // SOUMISSION
  // ============================================
  
  async function handleSubmit() {
    setSubmitting(true)
    
    try {
      const spotsNeeded = 3 - formData.partners.length
      
      const matchData = {
        organizer_id: user.id,
        status: 'open',
        spots_total: 4,
        spots_available: spotsNeeded,
        level_min: formData.level_min,
        level_max: formData.level_max,
        ambiance: formData.ambiance,
        organizer_team: formData.organizer_team,
        has_booked: formData.hasBooked
      }
      
      // Lieu
      if (formData.locationType === 'club' && formData.club_id) {
        matchData.club_id = formData.club_id
      } else if (formData.city) {
        matchData.city = formData.city
        matchData.radius = formData.radius || 10
      }
      
      // Date
      if (formData.dateType === 'precise') {
        if (formData.date) matchData.match_date = formData.date
        if (formData.time) matchData.match_time = formData.time
      } else {
        if (formData.flexibleDays.length > 0) {
          matchData.flexible_day = formData.flexibleDays.join(',')
        }
        if (formData.flexiblePeriod) {
          matchData.flexible_period = formData.flexiblePeriod
        }
      }
      
      // Prix
      if (formData.price_total) {
        matchData.price_total = Math.round(parseFloat(formData.price_total) * 100)
        matchData.payment_method = formData.paymentMethod
      }
      
      // Créer le match
      const { data: match, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select(`*, clubs (id, name, address, city), profiles:organizer_id (id, name, avatar_url, level)`)
        .single()
      
      if (error) throw error
      
      // Ajouter les partenaires inscrits
      const registeredPartners = formData.partners.filter(p => !p.isManual)
      if (registeredPartners.length > 0) {
        await supabase.from('match_participants').insert(
          registeredPartners.map(p => ({
            match_id: match.id,
            user_id: p.id,
            team: p.team || 'A',
            status: 'confirmed',
            invited_by: user.id
          }))
        )
      }
      
      // Ajouter les partenaires manuels dans pending_invites
      const manualPartners = formData.partners.filter(p => p.isManual)
      if (manualPartners.length > 0) {
        // Créer les invitations
        const invitesData = manualPartners.map(p => ({
          match_id: match.id,
          inviter_id: user.id,
          invitee_name: p.name,
          invitee_email: p.email || null,
          team: p.team || 'A',
          status: 'pending',
          invite_token: p.inviteToken || crypto.randomUUID()
        }))
        
        await supabase.from('pending_invites').insert(invitesData)
        
        // Envoyer les emails pour ceux qui ont un email
        const emailInvites = manualPartners.filter(p => p.email)
        for (const partner of emailInvites) {
          try {
            const response = await fetch('/api/send-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inviteToken: partner.inviteToken,
                inviteeName: partner.name,
                inviteeContact: partner.email,
                inviterName: profile?.name || 'Un joueur',
                matchDate: formData.date || null,
                matchTime: formData.time || null,
                clubName: formData.club_name || formData.city || 'À définir'
              })
            })
            
            const result = await response.json()
            if (result.success) {
              console.log(`✅ Email envoyé à ${partner.email}`)
            }
          } catch (err) {
            console.error(`❌ Erreur envoi email à ${partner.email}:`, err)
          }
        }
      }
      
      setMatchCreated(match)
      setStep(6)
      
    } catch (err) {
      console.error('Erreur création:', err)
      alert('Erreur lors de la création de la partie')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // PARTAGE
  // ============================================
  
  const matchUrl = matchCreated 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${matchCreated.id}`
    : ''
  
  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }
  
  async function handleShare() {
    const shareText = `🎾 Partie de Padel
📍 ${matchCreated?.clubs?.name || matchCreated?.city || 'Lieu à définir'}
📅 ${formatDate(matchCreated?.match_date)}${matchCreated?.match_time ? ` à ${matchCreated.match_time.slice(0,5)}` : ''}

Rejoins-nous ! 👉 ${matchUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🎾 Partie de Padel',
          text: shareText,
          url: matchUrl
        })
        return
      } catch {}
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
  }
  
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(matchUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // ============================================
  // STYLES
  // ============================================
  
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  }
  
  const buttonPrimaryStyle = {
    width: '100%',
    padding: 16,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer'
  }

  // ============================================
  // RENDER - LOADING
  // ============================================
  
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
        <div style={{ color: COLORS.textMuted }}>Chargement...</div>
      </div>
    )
  }

  // ============================================
  // RENDER - AJOUT CLUB
  // ============================================
  
  if (showAddClub) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px' }}>
        <button
          onClick={() => setShowAddClub(false)}
          style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', marginBottom: 16 }}
        >
          ←
        </button>
        
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
          Ajouter un club
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
              Nom du club *
            </label>
            <input
              type="text"
              value={newClub.name}
              onChange={e => setNewClub({ ...newClub, name: e.target.value })}
              placeholder="Ex: Padel Club Lyon"
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
              Ville *
            </label>
            <input
              type="text"
              value={newClub.city}
              onChange={e => setNewClub({ ...newClub, city: e.target.value })}
              placeholder="Ex: Lyon"
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
              Adresse (optionnel)
            </label>
            <input
              type="text"
              value={newClub.address}
              onChange={e => setNewClub({ ...newClub, address: e.target.value })}
              placeholder="Ex: 123 rue du Padel"
              style={inputStyle}
            />
          </div>
          
          <button
            onClick={addNewClub}
            disabled={!newClub.name || !newClub.city}
            style={{
              ...buttonPrimaryStyle,
              opacity: (!newClub.name || !newClub.city) ? 0.5 : 1,
              marginTop: 8
            }}
          >
            Ajouter ce club
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER - MAIN
  // ============================================
  
  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {step > 1 && step < 6 ? (
          <button
            onClick={() => setStep(step - 1)}
            style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }}
          >
            ←
          </button>
        ) : step === 1 ? (
          <Link href="/dashboard/parties" style={{ fontSize: 24, textDecoration: 'none' }}>
            ←
          </Link>
        ) : null}
        
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: COLORS.text }}>
            {step === 6 ? '🎉 Partie créée !' : 'Créer une partie'}
          </h1>
          {step < 6 && (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              Étape {step} sur {TOTAL_STEPS - 1}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      {step < 6 && (
        <div style={{
          height: 4,
          background: COLORS.border,
          borderRadius: 2,
          marginBottom: 32,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(step / (TOTAL_STEPS - 1)) * 100}%`,
            background: COLORS.primary,
            borderRadius: 2,
            transition: 'width 0.3s'
          }} />
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 1 : As-tu réservé ?                   */}
      {/* ============================================ */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            As-tu déjà réservé un terrain ?
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
            On adapte les infos selon ta situation
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OptionButton
              selected={formData.hasBooked === true}
              onClick={() => setFormData({ ...formData, hasBooked: true })}
              emoji="✅"
              title="Oui, j'ai réservé"
              subtitle="J'ai déjà un créneau"
            />
            <OptionButton
              selected={formData.hasBooked === false}
              onClick={() => setFormData({ ...formData, hasBooked: false })}
              emoji="🔍"
              title="Pas encore"
              subtitle="Je cherche où et quand jouer"
            />
          </div>
          
          <button
            onClick={() => setStep(2)}
            disabled={!canProceed()}
            style={{
              ...buttonPrimaryStyle,
              marginTop: 32,
              opacity: canProceed() ? 1 : 0.5
            }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 2 : Où ?                              */}
      {/* ============================================ */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Où veux-tu jouer ?
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
            {formData.hasBooked ? "Indique le club où tu as réservé" : "Choisis un club ou indique une zone"}
          </p>
          
          {/* Toggle Club / Ville */}
          {!formData.hasBooked && (
            <div style={{
              display: 'flex',
              background: COLORS.bg,
              borderRadius: 16,
              padding: 4,
              marginBottom: 20
            }}>
              {['club', 'city'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, locationType: type, club_id: null, club_name: '' })}
                  style={{
                    flex: 1,
                    padding: 12,
                    border: 'none',
                    borderRadius: 12,
                    background: formData.locationType === type ? COLORS.card : 'transparent',
                    color: formData.locationType === type ? COLORS.text : COLORS.textMuted,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: formData.locationType === type ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {type === 'club' ? '🏟️ Club précis' : '📍 Zone / Ville'}
                </button>
              ))}
            </div>
          )}
          
          {/* Sélection Club */}
          {(formData.hasBooked || formData.locationType === 'club') && (
            <>
              <input
                type="text"
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                placeholder="🔍 Rechercher un club..."
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              
              {formData.club_id && (
                <div style={{
                  background: COLORS.primaryLight,
                  border: `2px solid ${COLORS.primary}`,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{ fontSize: 24 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: COLORS.text }}>{formData.club_name}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{formData.club_data?.city}</div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, club_id: null, club_name: '', club_data: null })}
                    style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: COLORS.textMuted }}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {!formData.club_id && (
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {sortedClubs.slice(0, 10).map(club => (
                    <div
                      key={club.id}
                      onClick={() => selectClub(club)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        background: COLORS.card,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 16,
                        marginBottom: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); toggleFavoriteClub(club.id) }}
                        style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                      >
                        {favoriteClubIds.includes(club.id) ? '⭐' : '☆'}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{club.name}</div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{club.city}</div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setShowAddClub(true)}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: COLORS.bg,
                      border: `2px dashed ${COLORS.border}`,
                      borderRadius: 16,
                      color: COLORS.textMuted,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      marginTop: 8
                    }}
                  >
                    + Ajouter un club
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Sélection Ville */}
          {!formData.hasBooked && formData.locationType === 'city' && (
            <>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Lyon, Paris, Marseille..."
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: 'block' }}>
                Rayon de recherche : {formData.radius} km
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={formData.radius}
                onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </>
          )}
          
          <button
            onClick={() => setStep(3)}
            disabled={!canProceed()}
            style={{
              ...buttonPrimaryStyle,
              marginTop: 32,
              opacity: canProceed() ? 1 : 0.5
            }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 3 : Quand ?                           */}
      {/* ============================================ */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Quand veux-tu jouer ?
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
            {formData.hasBooked ? "Indique la date et l'heure réservées" : "Date précise ou flexible"}
          </p>
          
          {/* Toggle Précis / Flexible */}
          {!formData.hasBooked && (
            <div style={{
              display: 'flex',
              background: COLORS.bg,
              borderRadius: 16,
              padding: 4,
              marginBottom: 20
            }}>
              {['precise', 'flexible'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, dateType: type })}
                  style={{
                    flex: 1,
                    padding: 12,
                    border: 'none',
                    borderRadius: 12,
                    background: formData.dateType === type ? COLORS.card : 'transparent',
                    color: formData.dateType === type ? COLORS.text : COLORS.textMuted,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: formData.dateType === type ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {type === 'precise' ? '📅 Date précise' : '🔄 Flexible'}
                </button>
              ))}
            </div>
          )}
          
          {/* Date précise */}
          {(formData.hasBooked || formData.dateType === 'precise') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  min={getMinDate()}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={inputStyle}
                />
              </div>
              
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
          
          {/* Date flexible */}
          {!formData.hasBooked && formData.dateType === 'flexible' && (
            <>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: 'block' }}>
                Quels jours te conviennent ?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      const days = formData.flexibleDays.includes(day)
                        ? formData.flexibleDays.filter(d => d !== day)
                        : [...formData.flexibleDays, day]
                      setFormData({ ...formData, flexibleDays: days })
                    }}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: 12,
                      background: formData.flexibleDays.includes(day) 
                        ? COLORS.primary 
                        : COLORS.bg,
                      color: formData.flexibleDays.includes(day) ? '#fff' : COLORS.text,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: 'block' }}>
                Quel moment de la journée ?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { id: 'morning', label: '🌅 Matin' },
                  { id: 'noon', label: '☀️ Midi' },
                  { id: 'afternoon', label: '🌤️ Après-midi' },
                  { id: 'evening', label: '🌙 Soir' }
                ].map(period => (
                  <button
                    key={period.id}
                    onClick={() => setFormData({ ...formData, flexiblePeriod: period.id })}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: 12,
                      background: formData.flexiblePeriod === period.id 
                        ? COLORS.primary 
                        : COLORS.bg,
                      color: formData.flexiblePeriod === period.id ? '#fff' : COLORS.text,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </>
          )}
          
          <button
            onClick={() => setStep(4)}
            disabled={!canProceed()}
            style={{
              ...buttonPrimaryStyle,
              marginTop: 32,
              opacity: canProceed() ? 1 : 0.5
            }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 4 : Inviter joueurs                   */}
      {/* ============================================ */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            As-tu déjà des partenaires ?
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
            Ajoute les joueurs qui jouent avec toi (optionnel)
          </p>
          
          {/* Ton équipe */}
          <div style={{
            background: COLORS.bg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20
          }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, display: 'block' }}>
              Tu joues dans quelle équipe ?
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(team => (
                <button
                  key={team}
                  onClick={() => setFormData({ ...formData, organizer_team: team })}
                  style={{
                    flex: 1,
                    padding: 12,
                    border: 'none',
                    borderRadius: 12,
                    background: formData.organizer_team === team
                      ? (team === 'A' ? COLORS.primary : COLORS.info)
                      : COLORS.card,
                    color: formData.organizer_team === team ? '#fff' : COLORS.text,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  {team === 'A' ? '🅰️' : '🅱️'} Équipe {team}
                </button>
              ))}
            </div>
          </div>
          
          {/* Partenaires ajoutés */}
          {formData.partners.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: 'block' }}>
                Partenaires ajoutés ({formData.partners.length}/3)
              </label>
              {formData.partners.map(partner => (
                <div
                  key={partner.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    background: partner.isManual ? '#fffbeb' : COLORS.bg,
                    borderRadius: 16,
                    marginBottom: 10,
                    border: partner.isManual ? '2px solid #fcd34d' : '2px solid transparent'
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: partner.isManual 
                      ? '#fef3c7'
                      : (partner.avatar_url ? 'transparent' : getAvatarColor(partner.name)),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: partner.isManual ? 20 : 16,
                    color: partner.isManual ? '#92400e' : '#fff',
                    overflow: 'hidden'
                  }}>
                    {partner.isManual ? (partner.email ? '✉️' : '👤') : (
                      partner.avatar_url 
                        ? <img src={partner.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : partner.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>{partner.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {partner.isManual ? (
                        <>
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏳ Pas encore sur l'app</span>
                          {partner.email && (
                            <span style={{ color: '#0891b2' }}>· {partner.email}</span>
                          )}
                        </>
                      ) : (
                        <span>Niveau {partner.level}/10 · ✓ Sur l'app</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['A', 'B'].map(team => (
                      <button
                        key={team}
                        onClick={() => setPartnerTeam(partner.id, team)}
                        style={{
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: 8,
                          background: partner.team === team
                            ? (team === 'A' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #2563eb)')
                            : '#f1f5f9',
                          color: partner.team === team ? '#fff' : COLORS.textMuted,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {team === 'A' ? '🅰️' : '🅱️'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => removePartner(partner.id)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer', padding: 4 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Recherche joueurs */}
          {formData.partners.length < 3 && (
            <>
              <input
                type="text"
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                placeholder="🔍 Rechercher un joueur..."
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              
              {playerResults.length > 0 && (
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
                  {playerResults.map(player => (
                    <div
                      key={player.id}
                      onClick={() => addPartner(player)}
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
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: '#fff',
                        overflow: 'hidden'
                      }}>
                        {player.avatar_url 
                          ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : player.name?.[0]?.toUpperCase()
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Niveau {player.level}/10</div>
                      </div>
                      <div style={{ color: COLORS.primary, fontWeight: 600 }}>+ Ajouter</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Joueurs récents */}
              {playerSearch.length < 2 && recentPlayers.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: 'block' }}>
                    Joueurs récents
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {recentPlayers.filter(p => !formData.partners.some(fp => fp.id === p.id)).slice(0, 4).map(player => (
                      <button
                        key={player.id}
                        onClick={() => addPartner(player)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: COLORS.bg,
                          border: 'none',
                          borderRadius: 16,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: player.avatar_url ? 'transparent' : getAvatarColor(player.name),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: '#fff',
                          overflow: 'hidden'
                        }}>
                          {player.avatar_url 
                            ? <img src={player.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : player.name?.[0]?.toUpperCase()
                          }
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ajout manuel */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: 16,
                padding: 20,
                marginTop: 16,
                border: '2px solid #e2e8f0'
              }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✉️ Inviter quelqu'un
                </label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={manualPartnerName}
                    onChange={e => setManualPartnerName(e.target.value)}
                    placeholder="Prénom *"
                    style={{ ...inputStyle, padding: '14px 16px', borderRadius: 12 }}
                  />
                  <input
                    type="email"
                    value={manualPartnerEmail}
                    onChange={e => setManualPartnerEmail(e.target.value)}
                    placeholder="Email"
                    style={{ ...inputStyle, padding: '14px 16px', borderRadius: 12 }}
                  />
                </div>
                
                <button
                  onClick={addManualPartner}
                  disabled={!manualPartnerName.trim()}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: manualPartnerName.trim() 
                      ? (manualPartnerEmail.trim() ? '#00b8a9' : COLORS.primary)
                      : COLORS.border,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: manualPartnerName.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: manualPartnerName.trim() && manualPartnerEmail.trim() 
                      ? '0 4px 12px rgba(0, 184, 169, 0.25)' 
                      : 'none'
                  }}
                >
                  {manualPartnerEmail.trim() ? '📤 Ajouter et envoyer invitation' : '+ Ajouter à la partie'}
                </button>
                
                <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 10, textAlign: 'center' }}>
                  💡 {manualPartnerEmail.trim() 
                    ? "Cette personne recevra un email pour rejoindre" 
                    : "Ajoute un email pour envoyer une invitation automatique"}
                </p>
              </div>
            </>
          )}
          
          <button
            onClick={() => setStep(5)}
            style={{ ...buttonPrimaryStyle, marginTop: 32 }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 5 : Ambiance / Niveau / Prix          */}
      {/* ============================================ */}
      {step === 5 && (
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
            Derniers détails
          </h2>
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginBottom: 24 }}>
            Ambiance, niveau et infos pratiques
          </p>
          
          {/* Ambiance */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, display: 'block' }}>
              Ambiance de la partie
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(AMBIANCE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, ambiance: key })}
                  style={{
                    flex: 1,
                    padding: 14,
                    border: formData.ambiance === key ? `2px solid ${config.color}` : `1px solid ${COLORS.border}`,
                    borderRadius: 16,
                    background: formData.ambiance === key ? `${config.color}15` : COLORS.card,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{config.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: formData.ambiance === key ? config.color : COLORS.text }}>
                    {config.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Niveau */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, display: 'block' }}>
              Niveau recherché : {formData.level_min} - {formData.level_max}
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={formData.level_min}
                onChange={e => setFormData({ ...formData, level_min: parseInt(e.target.value) })}
                style={{ ...inputStyle, flex: 1 }}
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>Min: {n}</option>
                ))}
              </select>
              <span style={{ color: COLORS.textMuted }}>→</span>
              <select
                value={formData.level_max}
                onChange={e => setFormData({ ...formData, level_max: parseInt(e.target.value) })}
                style={{ ...inputStyle, flex: 1 }}
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>Max: {n}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Prix (optionnel) */}
          {formData.hasBooked && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: 'block' }}>
                Prix total du terrain (optionnel)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  value={formData.price_total}
                  onChange={e => setFormData({ ...formData, price_total: e.target.value })}
                  placeholder="Ex: 40"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ display: 'flex', alignItems: 'center', color: COLORS.textMuted }}>€</span>
              </div>
              {formData.price_total && (
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 8 }}>
                  💰 {(parseFloat(formData.price_total) / 4).toFixed(2)}€ par joueur
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...buttonPrimaryStyle,
              marginTop: 16,
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? '⏳ Création...' : '🎾 Créer la partie'}
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* ÉTAPE 6 : Récap & Partage                   */}
      {/* ============================================ */}
      {step === 6 && matchCreated && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Partie créée !
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 32 }}>
            Partage-la pour trouver des joueurs
          </p>
          
          {/* Récap */}
          <div style={{
            background: COLORS.bg,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <span style={{ fontWeight: 600 }}>
                {matchCreated.clubs?.name || matchCreated.city || 'Lieu à définir'}
              </span>
            </div>
            {matchCreated.match_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <span>{formatDate(matchCreated.match_date)}</span>
                {matchCreated.match_time && (
                  <span style={{ color: COLORS.textMuted }}>à {matchCreated.match_time.slice(0,5)}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>👥</span>
              <span>{matchCreated.spots_available} place{matchCreated.spots_available > 1 ? 's' : ''} disponible{matchCreated.spots_available > 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {/* Actions */}
          <button
            onClick={handleShare}
            style={{ ...buttonPrimaryStyle, marginBottom: 12 }}
          >
            📤 Partager
          </button>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: 14,
                background: copied ? COLORS.primaryLight : COLORS.bg,
                border: `1px solid ${copied ? COLORS.primary : COLORS.border}`,
                borderRadius: 16,
                color: copied ? COLORS.primary : COLORS.text,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copié !' : '🔗 Copier lien'}
            </button>
          </div>
          
          <Link
            href={`/dashboard/match/${matchCreated.id}`}
            style={{
              display: 'block',
              padding: 14,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              color: COLORS.text,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 12
            }}
          >
            Voir la partie →
          </Link>
          
          <Link
            href="/dashboard/parties"
            style={{
              color: COLORS.textMuted,
              fontSize: 14,
              textDecoration: 'none'
            }}
          >
            Retour à mes parties
          </Link>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPOSANTS LOCAUX
// ============================================

function OptionButton({ selected, onClick, emoji, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        border: selected ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
        borderRadius: 20,
        background: selected ? COLORS.primaryLight : COLORS.card,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%'
      }}
    >
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>{title}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{subtitle}</div>
      </div>
      {selected && (
        <div style={{ marginLeft: 'auto', color: COLORS.primary, fontSize: 20 }}>✓</div>
      )}
    </button>
  )
}