'use client'

/**
 * ============================================
 * PAGE CRÉATION DE PARTIE - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * 6 étapes :
 * 1. Réservation (oui/non)
 * 2. Lieu (club ou ville)
 * 3. Date/Heure (précise ou flexible)
 * 4. Inviter joueurs
 * 5. Ambiance/Niveau/Prix
 * 6. Récap & Partage
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral - Équipe A
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal - Équipe B
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e5',
  p3Soft: '#e5f9f7',
  p4Soft: '#f0edff',
  
  // Interface sobre
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  
  // Borders
  border: '#e5e7eb',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

const AMBIANCE_CONFIG = {
  loisir: { label: 'Détente', emoji: '😌', color: COLORS.p3 },
  mix: { label: 'Équilibré', emoji: '⚡', color: COLORS.p2 },
  compet: { label: 'Compétitif', emoji: '🔥', color: COLORS.p1 }
}

const TOTAL_STEPS = 6

// === HELPER: Couleur avatar basée sur le nom ===
function getAvatarColor(name, index = 0) {
  if (name) return PLAYER_COLORS[name.charCodeAt(0) % 4]
  return PLAYER_COLORS[index % 4]
}

// === COMPOSANT: Les 4 dots animés ===
function FourDots({ size = 10, gap = 5 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div key={i} className="dot-breathe" style={{ 
          width: size, height: size, 
          borderRadius: size > 10 ? 4 : '50%', 
          background: c,
          animationDelay: `${i * 0.15}s`
        }} />
      ))}
    </div>
  )
}

// === COMPOSANT: Option Button ===
function OptionButton({ selected, onClick, emoji, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        border: selected ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
        borderRadius: 20,
        background: selected ? COLORS.bgSoft : COLORS.card,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%'
      }}
    >
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: COLORS.gray }}>{subtitle}</div>
      </div>
      {selected && (
        <div style={{ 
          width: 24, height: 24, 
          borderRadius: 12,
          background: COLORS.ink,
          color: COLORS.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700
        }}>✓</div>
      )}
    </button>
  )
}

// === COMPOSANT: Avatar carré arrondi ===
function Avatar({ name, src, size = 44, colorIndex = 0 }) {
  const radius = Math.round(size * 0.28)
  const color = getAvatarColor(name, colorIndex)
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: src ? 'transparent' : color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 700,
      color: COLORS.white,
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        name?.[0]?.toUpperCase() || '?'
      )}
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function CreateMatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitePlayerId = searchParams.get('invite')
  
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

  function getNextDays(count) {
    const days = []
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for (let i = 0; i < count; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push({
        value: date.toISOString().split('T')[0],
        dayShort: dayNames[date.getDay()],
        dayNum: date.getDate(),
        monthShort: monthNames[date.getMonth()]
      })
    }
    return days
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
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
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  }
  
  const buttonPrimaryStyle = {
    width: '100%',
    padding: 16,
    background: COLORS.ink,
    color: COLORS.white,
    border: 'none',
    borderRadius: 100,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit'
  }

  // ============================================
  // RENDER - LOADING
  // ============================================
  
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-content">
          <div className="loading-dots">
            {PLAYER_COLORS.map((c, i) => (
              <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="loading-text">Chargement...</div>
        </div>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${COLORS.bg};
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-content { text-align: center; }
          .loading-dots { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
          .loading-dot {
            width: 16px;
            height: 16px;
            border-radius: 6px;
            animation: loadBounce 1.4s ease-in-out infinite;
          }
          .loading-text { color: ${COLORS.gray}; font-size: 14px; }
          @keyframes loadBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-14px); }
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // RENDER - AJOUT CLUB
  // ============================================
  
  if (showAddClub) {
    return (
      <div className="add-club-page">
        <div className="add-club-container">
          <button onClick={() => setShowAddClub(false)} className="back-btn">←</button>
          
          <h2 className="page-title">Ajouter un club</h2>
          
          <div className="form-group">
            <label>Nom du club *</label>
            <input
              type="text"
              value={newClub.name}
              onChange={e => setNewClub({ ...newClub, name: e.target.value })}
              placeholder="Ex: Padel Club Lyon"
              style={inputStyle}
            />
          </div>
          
          <div className="form-group">
            <label>Ville *</label>
            <input
              type="text"
              value={newClub.city}
              onChange={e => setNewClub({ ...newClub, city: e.target.value })}
              placeholder="Ex: Lyon"
              style={inputStyle}
            />
          </div>
          
          <div className="form-group">
            <label>Adresse (optionnel)</label>
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
              marginTop: 24
            }}
          >
            Ajouter ce club
          </button>
        </div>
        
        <style jsx>{`
          .add-club-page {
            min-height: 100vh;
            background: ${COLORS.bg};
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .add-club-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 24px 16px;
          }
          .back-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            margin-bottom: 16px;
            padding: 0;
          }
          .page-title {
            font-size: 22px;
            font-weight: 700;
            color: ${COLORS.ink};
            margin: 0 0 24px;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: ${COLORS.gray};
            margin-bottom: 6px;
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // RENDER - MAIN
  // ============================================
  
  return (
    <div className="create-page">
      <div className="create-container">
        
        {/* Header */}
        <div className="header">
          {step > 1 && step < 6 ? (
            <button onClick={() => setStep(step - 1)} className="back-btn">←</button>
          ) : step === 1 ? (
            <Link href="/dashboard/parties" className="back-btn">←</Link>
          ) : null}
          
          <div className="header-content">
            <div className="header-title-row">
              <h1 className="header-title">
                {step === 6 ? 'Partie créée !' : 'Créer une partie'}
              </h1>
              {step < 6 && <FourDots size={8} gap={4} />}
            </div>
            {step < 6 && (
              <div className="header-step">Étape {step} sur {TOTAL_STEPS - 1}</div>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        {step < 6 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }} />
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 1 : As-tu réservé ?                   */}
        {/* ============================================ */}
        {step === 1 && (
          <div className="step-content">
            <h2 className="step-title">As-tu déjà réservé un terrain ?</h2>
            <p className="step-subtitle">On adapte les infos selon ta situation</p>
            
            <div className="options-list">
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
              style={{ ...buttonPrimaryStyle, marginTop: 32, opacity: canProceed() ? 1 : 0.5 }}
            >
              Continuer
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 2 : Où ?                              */}
        {/* ============================================ */}
        {step === 2 && (
          <div className="step-content">
            <h2 className="step-title">Où veux-tu jouer ?</h2>
            <p className="step-subtitle">
              {formData.hasBooked ? "Indique le club où tu as réservé" : "Choisis un club ou indique une zone"}
            </p>
            
            {/* Toggle Club / Ville */}
            {!formData.hasBooked && (
              <div className="toggle-group">
                {['club', 'city'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, locationType: type, club_id: null, club_name: '' })}
                    className={`toggle-btn ${formData.locationType === type ? 'active' : ''}`}
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
                  <div className="selected-club">
                    <div className="selected-icon">✅</div>
                    <div className="selected-info">
                      <div className="selected-name">{formData.club_name}</div>
                      <div className="selected-city">{formData.club_data?.city}</div>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, club_id: null, club_name: '', club_data: null })}
                      className="remove-btn"
                    >✕</button>
                  </div>
                )}
                
                {!formData.club_id && (
                  <div className="clubs-list">
                    {sortedClubs.slice(0, 10).map(club => (
                      <div key={club.id} onClick={() => selectClub(club)} className="club-item">
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavoriteClub(club.id) }}
                          className="fav-btn"
                        >
                          {favoriteClubIds.includes(club.id) ? '⭐' : '☆'}
                        </button>
                        <div className="club-info">
                          <div className="club-name">{club.name}</div>
                          <div className="club-city">{club.city}</div>
                        </div>
                      </div>
                    ))}
                    
                    <button onClick={() => setShowAddClub(true)} className="add-club-btn">
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
                
                <label className="range-label">Rayon de recherche : {formData.radius} km</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={formData.radius}
                  onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                  className="range-input"
                />
              </>
            )}
            
            <button
              onClick={() => setStep(3)}
              disabled={!canProceed()}
              style={{ ...buttonPrimaryStyle, marginTop: 32, opacity: canProceed() ? 1 : 0.5 }}
            >
              Continuer
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 3 : Quand ?                           */}
        {/* ============================================ */}
        {step === 3 && (
          <div className="step-content">
            <h2 className="step-title">Quand veux-tu jouer ?</h2>
            <p className="step-subtitle">
              {formData.hasBooked ? "Indique la date et l'heure réservées" : "Date précise ou flexible"}
            </p>
            
            {/* Toggle Précis / Flexible */}
            {!formData.hasBooked && (
              <div className="toggle-group">
                {['precise', 'flexible'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, dateType: type })}
                    className={`toggle-btn ${formData.dateType === type ? 'active' : ''}`}
                  >
                    {type === 'precise' ? '📅 Date précise' : '🔄 Flexible'}
                  </button>
                ))}
              </div>
            )}
            
            {/* Date précise */}
            {(formData.hasBooked || formData.dateType === 'precise') && (
              <>
                <label className="section-label">📅 Choisis un jour</label>
                <div className="days-carousel">
                  {getNextDays(7).map((day, idx) => {
                    const isSelected = formData.date === day.value
                    const isToday = idx === 0
                    return (
                      <button
                        key={day.value}
                        onClick={() => setFormData({ ...formData, date: day.value })}
                        className={`day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                      >
                        <div className="day-name">{isToday ? 'Auj.' : day.dayShort}</div>
                        <div className="day-num">{day.dayNum}</div>
                        <div className="day-month">{day.monthShort}</div>
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'date'
                    input.min = getMinDate()
                    input.value = formData.date || getMinDate()
                    input.onchange = (e) => setFormData({ ...formData, date: e.target.value })
                    input.showPicker()
                  }}
                  className="more-dates-btn"
                >
                  📆 Voir plus de dates
                </button>
                
                <div className="time-section">
                  <label className="section-label">🕐 À quelle heure ?</label>
                  <div className="time-grid">
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(time => {
                      const isSelected = formData.time === time
                      return (
                        <button
                          key={time}
                          onClick={() => setFormData({ ...formData, time })}
                          className={`time-btn ${isSelected ? 'selected' : ''}`}
                        >
                          {time.slice(0, 2)}h
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="custom-time">
                    <span className="custom-time-label">ou</span>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="time-input"
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Date flexible */}
            {!formData.hasBooked && formData.dateType === 'flexible' && (
              <>
                <label className="section-label">Quels jours te conviennent ?</label>
                <div className="flexible-days">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                    <button
                      key={day}
                      onClick={() => {
                        const days = formData.flexibleDays.includes(day)
                          ? formData.flexibleDays.filter(d => d !== day)
                          : [...formData.flexibleDays, day]
                        setFormData({ ...formData, flexibleDays: days })
                      }}
                      className={`flex-day-btn ${formData.flexibleDays.includes(day) ? 'selected' : ''}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                
                <label className="section-label" style={{ marginTop: 20 }}>Quel moment de la journée ?</label>
                <div className="period-grid">
                  {[
                    { id: 'morning', label: '🌅 Matin', desc: '8h-12h' },
                    { id: 'noon', label: '☀️ Midi', desc: '12h-14h' },
                    { id: 'afternoon', label: '🌤️ Après-midi', desc: '14h-18h' },
                    { id: 'evening', label: '🌙 Soir', desc: '18h-22h' }
                  ].map(period => (
                    <button
                      key={period.id}
                      onClick={() => setFormData({ ...formData, flexiblePeriod: period.id })}
                      className={`period-btn ${formData.flexiblePeriod === period.id ? 'selected' : ''}`}
                    >
                      <div className="period-label">{period.label}</div>
                      <div className="period-desc">{period.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <button
              onClick={() => setStep(4)}
              disabled={!canProceed()}
              style={{ ...buttonPrimaryStyle, marginTop: 32, opacity: canProceed() ? 1 : 0.5 }}
            >
              Continuer
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 4 : Inviter joueurs                   */}
        {/* ============================================ */}
        {step === 4 && (
          <div className="step-content">
            <h2 className="step-title">As-tu déjà des partenaires ?</h2>
            <p className="step-subtitle">Ajoute les joueurs qui jouent avec toi (optionnel)</p>
            
            {/* Ton équipe */}
            <div className="team-select">
              <label className="section-label">Tu joues dans quelle équipe ?</label>
              <div className="team-btns">
                {['A', 'B'].map(team => (
                  <button
                    key={team}
                    onClick={() => setFormData({ ...formData, organizer_team: team })}
                    className={`team-btn ${formData.organizer_team === team ? 'selected' : ''}`}
                    style={{ 
                      background: formData.organizer_team === team 
                        ? (team === 'A' ? COLORS.p1 : COLORS.p3) 
                        : COLORS.card 
                    }}
                  >
                    Équipe {team}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Partenaires ajoutés */}
            {formData.partners.length > 0 && (
              <div className="partners-list">
                <label className="section-label">Partenaires ajoutés ({formData.partners.length}/3)</label>
                {formData.partners.map((partner, idx) => (
                  <div key={partner.id} className={`partner-card ${partner.isManual ? 'manual' : ''}`}>
                    <Avatar 
                      name={partner.name} 
                      src={partner.avatar_url} 
                      size={44} 
                      colorIndex={idx}
                    />
                    <div className="partner-info">
                      <div className="partner-name">{partner.name}</div>
                      <div className="partner-meta">
                        {partner.isManual ? (
                          <>
                            <span className="pending-tag">⏳ Pas encore sur l'app</span>
                            {partner.email && <span className="email-tag">· {partner.email}</span>}
                          </>
                        ) : (
                          <span>Niveau {partner.level}/10 · ✓ Sur l'app</span>
                        )}
                      </div>
                    </div>
                    <div className="partner-team-btns">
                      {['A', 'B'].map(team => (
                        <button
                          key={team}
                          onClick={() => setPartnerTeam(partner.id, team)}
                          className={`partner-team-btn ${partner.team === team ? 'active' : ''}`}
                          style={{ 
                            background: partner.team === team 
                              ? (team === 'A' ? COLORS.p1 : COLORS.p3) 
                              : COLORS.bgSoft 
                          }}
                        >
                          {team}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removePartner(partner.id)} className="remove-partner-btn">×</button>
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
                  <div className="player-results">
                    {playerResults.map((player, idx) => (
                      <div key={player.id} onClick={() => addPartner(player)} className="player-result">
                        <Avatar name={player.name} src={player.avatar_url} size={36} colorIndex={idx} />
                        <div className="player-result-info">
                          <div className="player-result-name">{player.name}</div>
                          <div className="player-result-level">Niveau {player.level}/10</div>
                        </div>
                        <div className="add-player-btn">+ Ajouter</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Joueurs récents */}
                {playerSearch.length < 2 && recentPlayers.length > 0 && (
                  <div className="recent-players">
                    <label className="section-label">Joueurs récents</label>
                    <div className="recent-list">
                      {recentPlayers.filter(p => !formData.partners.some(fp => fp.id === p.id)).slice(0, 4).map((player, idx) => (
                        <button key={player.id} onClick={() => addPartner(player)} className="recent-player">
                          <Avatar name={player.name} src={player.avatar_url} size={28} colorIndex={idx} />
                          <span>{player.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Ajout manuel */}
                <div className="manual-invite">
                  <label className="manual-label">✉️ Inviter quelqu'un</label>
                  <div className="manual-inputs">
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
                    className={`manual-add-btn ${manualPartnerName.trim() ? 'active' : ''} ${manualPartnerEmail.trim() ? 'email' : ''}`}
                  >
                    {manualPartnerEmail.trim() ? '📤 Ajouter et envoyer invitation' : '+ Ajouter à la partie'}
                  </button>
                  <p className="manual-hint">
                    💡 {manualPartnerEmail.trim() 
                      ? "Cette personne recevra un email pour rejoindre" 
                      : "Ajoute un email pour envoyer une invitation automatique"}
                  </p>
                </div>
              </>
            )}
            
            <button onClick={() => setStep(5)} style={{ ...buttonPrimaryStyle, marginTop: 32 }}>
              Continuer
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 5 : Ambiance / Niveau / Prix          */}
        {/* ============================================ */}
        {step === 5 && (
          <div className="step-content">
            <h2 className="step-title">Derniers détails</h2>
            <p className="step-subtitle">Ambiance, niveau et infos pratiques</p>
            
            {/* Ambiance */}
            <div className="ambiance-section">
              <label className="section-label">Ambiance de la partie</label>
              <div className="ambiance-btns">
                {Object.entries(AMBIANCE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setFormData({ ...formData, ambiance: key })}
                    className={`ambiance-btn ${formData.ambiance === key ? 'selected' : ''}`}
                    style={{
                      borderColor: formData.ambiance === key ? config.color : COLORS.border,
                      background: formData.ambiance === key ? `${config.color}15` : COLORS.card
                    }}
                  >
                    <div className="ambiance-emoji">{config.emoji}</div>
                    <div className="ambiance-label" style={{ color: formData.ambiance === key ? config.color : COLORS.ink }}>
                      {config.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Niveau */}
            <div className="level-section">
              <label className="section-label">Niveau recherché : {formData.level_min} - {formData.level_max}</label>
              <div className="level-selects">
                <select
                  value={formData.level_min}
                  onChange={e => setFormData({ ...formData, level_min: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>Min: {n}</option>
                  ))}
                </select>
                <span className="level-arrow">→</span>
                <select
                  value={formData.level_max}
                  onChange={e => setFormData({ ...formData, level_max: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>Max: {n}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Prix (optionnel) */}
            {formData.hasBooked && (
              <div className="price-section">
                <label className="section-label">Prix total du terrain (optionnel)</label>
                <div className="price-input-row">
                  <input
                    type="number"
                    value={formData.price_total}
                    onChange={e => setFormData({ ...formData, price_total: e.target.value })}
                    placeholder="Ex: 40"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span className="price-currency">€</span>
                </div>
                {formData.price_total && (
                  <div className="price-per-person">
                    💰 {(parseFloat(formData.price_total) / 4).toFixed(2)}€ par joueur
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ ...buttonPrimaryStyle, marginTop: 24, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? '⏳ Création...' : '🎾 Créer la partie'}
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* ÉTAPE 6 : Récap & Partage                   */}
        {/* ============================================ */}
        {step === 6 && matchCreated && (
          <div className="step-content success-step">
            <div className="success-emoji">🎉</div>
            <h2 className="success-title">Partie créée !</h2>
            <p className="success-subtitle">Partage-la pour trouver des joueurs</p>
            
            {/* Récap */}
            <div className="recap-card">
              <div className="recap-row">
                <span className="recap-icon">📍</span>
                <span className="recap-text">{matchCreated.clubs?.name || matchCreated.city || 'Lieu à définir'}</span>
              </div>
              {matchCreated.match_date && (
                <div className="recap-row">
                  <span className="recap-icon">📅</span>
                  <span className="recap-text">
                    {formatDate(matchCreated.match_date)}
                    {matchCreated.match_time && ` à ${matchCreated.match_time.slice(0,5)}`}
                  </span>
                </div>
              )}
              <div className="recap-row">
                <span className="recap-icon">👥</span>
                <span className="recap-text">
                  {matchCreated.spots_available} place{matchCreated.spots_available > 1 ? 's' : ''} disponible{matchCreated.spots_available > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <button onClick={handleShare} style={buttonPrimaryStyle}>
              📤 Partager
            </button>
            
            <button
              onClick={copyLink}
              className={`copy-btn ${copied ? 'copied' : ''}`}
            >
              {copied ? '✓ Copié !' : '🔗 Copier lien'}
            </button>
            
            <Link href={`/dashboard/match/${matchCreated.id}`} className="view-match-link">
              Voir la partie →
            </Link>
            
            <Link href="/dashboard/parties" className="back-link">
              Retour à mes parties
            </Link>
          </div>
        )}
      </div>

      {/* === STYLES === */}
      <style jsx global>{`
        @keyframes dot-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }
      `}</style>

      <style jsx>{`
        .create-page {
          min-height: 100vh;
          background: ${COLORS.bg};
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .create-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .back-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          color: ${COLORS.ink};
        }

        .header-content { flex: 1; }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: ${COLORS.ink};
        }

        .header-step {
          font-size: 13px;
          color: ${COLORS.gray};
          margin-top: 2px;
        }

        /* Progress bar */
        .progress-bar {
          height: 4px;
          background: ${COLORS.border};
          border-radius: 2px;
          margin-bottom: 32px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: ${COLORS.ink};
          border-radius: 2px;
          transition: width 0.3s;
        }

        /* Step content */
        .step-content {
          padding-bottom: 40px;
        }

        .step-title {
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 8px;
          color: ${COLORS.ink};
        }

        .step-subtitle {
          text-align: center;
          color: ${COLORS.gray};
          font-size: 14px;
          margin: 0 0 24px;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.gray};
          margin-bottom: 10px;
        }

        /* Toggle group */
        .toggle-group {
          display: flex;
          background: ${COLORS.bgSoft};
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 20px;
        }

        .toggle-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: ${COLORS.gray};
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }

        .toggle-btn.active {
          background: ${COLORS.card};
          color: ${COLORS.ink};
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        /* Clubs */
        .selected-club {
          background: ${COLORS.bgSoft};
          border: 2px solid ${COLORS.ink};
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selected-icon { font-size: 24px; }
        .selected-info { flex: 1; }
        .selected-name { font-weight: 700; color: ${COLORS.ink}; }
        .selected-city { font-size: 13px; color: ${COLORS.gray}; }

        .remove-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: ${COLORS.gray};
        }

        .clubs-list {
          max-height: 300px;
          overflow: auto;
        }

        .club-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          margin-bottom: 8px;
          cursor: pointer;
        }

        .fav-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }

        .club-info { flex: 1; }
        .club-name { font-weight: 600; }
        .club-city { font-size: 13px; color: ${COLORS.gray}; }

        .add-club-btn {
          width: 100%;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border: 2px dashed ${COLORS.border};
          border-radius: 16px;
          color: ${COLORS.gray};
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          margin-top: 8px;
          font-family: inherit;
        }

        /* Range */
        .range-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: ${COLORS.gray};
          margin-bottom: 8px;
        }

        .range-input {
          width: 100%;
          accent-color: ${COLORS.ink};
        }

        /* Days carousel */
        .days-carousel {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .day-btn {
          flex-shrink: 0;
          width: 72px;
          padding: 14px 10px;
          border: 2px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          cursor: pointer;
          text-align: center;
          font-family: inherit;
        }

        .day-btn.selected {
          border-color: ${COLORS.ink};
          background: ${COLORS.bgSoft};
        }

        .day-btn.today {
          border-color: ${COLORS.p3};
        }

        .day-name {
          font-size: 11px;
          color: ${COLORS.gray};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .day-btn.selected .day-name { color: ${COLORS.ink}; }

        .day-num {
          font-size: 24px;
          font-weight: 800;
          color: ${COLORS.ink};
          line-height: 1.2;
        }

        .day-month {
          font-size: 11px;
          color: ${COLORS.gray};
        }

        .more-dates-btn {
          width: 100%;
          padding: 12px;
          background: ${COLORS.bgSoft};
          border: none;
          border-radius: 12px;
          color: ${COLORS.gray};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        /* Time */
        .time-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid ${COLORS.border};
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }

        .time-btn {
          padding: 14px 8px;
          border: 2px solid ${COLORS.border};
          border-radius: 12px;
          background: ${COLORS.card};
          color: ${COLORS.ink};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .time-btn.selected {
          border-color: ${COLORS.ink};
          background: ${COLORS.ink};
          color: ${COLORS.white};
        }

        .custom-time {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border-radius: 12px;
        }

        .custom-time-label {
          font-size: 13px;
          color: ${COLORS.gray};
        }

        .time-input {
          flex: 1;
          padding: 10px;
          border: 1px solid ${COLORS.border};
          border-radius: 8px;
          font-size: 15px;
          font-family: inherit;
        }

        /* Flexible days */
        .flexible-days {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .flex-day-btn {
          padding: 12px 18px;
          border: none;
          border-radius: 12px;
          background: ${COLORS.bgSoft};
          color: ${COLORS.ink};
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }

        .flex-day-btn.selected {
          background: ${COLORS.ink};
          color: ${COLORS.white};
        }

        .period-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .period-btn {
          padding: 16px;
          border: 2px solid ${COLORS.border};
          border-radius: 14px;
          background: ${COLORS.card};
          cursor: pointer;
          text-align: center;
          font-family: inherit;
        }

        .period-btn.selected {
          border-color: ${COLORS.ink};
          background: ${COLORS.bgSoft};
        }

        .period-label {
          font-size: 15px;
          font-weight: 600;
          color: ${COLORS.ink};
        }

        .period-desc {
          font-size: 12px;
          color: ${COLORS.gray};
          margin-top: 4px;
        }

        /* Team select */
        .team-select {
          background: ${COLORS.bgSoft};
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .team-btns {
          display: flex;
          gap: 10px;
        }

        .team-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 12px;
          color: ${COLORS.ink};
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }

        .team-btn.selected {
          color: ${COLORS.white};
        }

        /* Partners */
        .partners-list {
          margin-bottom: 20px;
        }

        .partner-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border-radius: 16px;
          margin-bottom: 10px;
          border: 2px solid transparent;
        }

        .partner-card.manual {
          background: ${COLORS.p2Soft};
          border-color: ${COLORS.p2};
        }

        .partner-info { flex: 1; min-width: 0; }
        .partner-name { font-weight: 600; font-size: 15px; color: ${COLORS.ink}; }
        .partner-meta { font-size: 12px; color: ${COLORS.gray}; display: flex; flex-wrap: wrap; gap: 6px; }
        .pending-tag { color: ${COLORS.p2}; font-weight: 600; }
        .email-tag { color: ${COLORS.p3}; }

        .partner-team-btns {
          display: flex;
          gap: 4px;
        }

        .partner-team-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          background: ${COLORS.bgSoft};
          color: ${COLORS.gray};
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .partner-team-btn.active {
          color: ${COLORS.white};
        }

        .remove-partner-btn {
          background: none;
          border: none;
          color: ${COLORS.gray};
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
        }

        /* Player results */
        .player-results {
          border: 1px solid ${COLORS.border};
          border-radius: 16px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .player-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid ${COLORS.border};
          cursor: pointer;
        }

        .player-result:last-child { border-bottom: none; }

        .player-result-info { flex: 1; }
        .player-result-name { font-weight: 600; font-size: 14px; }
        .player-result-level { font-size: 12px; color: ${COLORS.gray}; }

        .add-player-btn {
          color: ${COLORS.p3};
          font-weight: 600;
          font-size: 13px;
        }

        /* Recent players */
        .recent-players { margin-bottom: 16px; }

        .recent-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .recent-player {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: ${COLORS.bgSoft};
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
        }

        /* Manual invite */
        .manual-invite {
          background: ${COLORS.bgSoft};
          border-radius: 16px;
          padding: 20px;
          margin-top: 16px;
          border: 2px solid ${COLORS.border};
        }

        .manual-label {
          font-size: 14px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin-bottom: 14px;
          display: block;
        }

        .manual-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .manual-add-btn {
          width: 100%;
          padding: 14px 20px;
          background: ${COLORS.border};
          color: ${COLORS.white};
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: not-allowed;
          font-family: inherit;
        }

        .manual-add-btn.active {
          background: ${COLORS.ink};
          cursor: pointer;
        }

        .manual-add-btn.email {
          background: ${COLORS.p3};
          box-shadow: 0 4px 12px rgba(0, 184, 169, 0.25);
        }

        .manual-hint {
          font-size: 12px;
          color: ${COLORS.gray};
          margin-top: 10px;
          text-align: center;
        }

        /* Ambiance */
        .ambiance-section { margin-bottom: 24px; }

        .ambiance-btns {
          display: flex;
          gap: 10px;
        }

        .ambiance-btn {
          flex: 1;
          padding: 14px;
          border: 2px solid ${COLORS.border};
          border-radius: 16px;
          background: ${COLORS.card};
          cursor: pointer;
          text-align: center;
          font-family: inherit;
        }

        .ambiance-emoji {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .ambiance-label {
          font-size: 13px;
          font-weight: 600;
        }

        /* Level */
        .level-section { margin-bottom: 24px; }

        .level-selects {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .level-selects select {
          flex: 1;
        }

        .level-arrow {
          color: ${COLORS.gray};
        }

        /* Price */
        .price-section { margin-bottom: 24px; }

        .price-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .price-currency {
          color: ${COLORS.gray};
        }

        .price-per-person {
          font-size: 13px;
          color: ${COLORS.gray};
          margin-top: 8px;
        }

        /* Success step */
        .success-step {
          text-align: center;
        }

        .success-emoji {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .success-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
          color: ${COLORS.ink};
        }

        .success-subtitle {
          color: ${COLORS.gray};
          font-size: 14px;
          margin: 0 0 32px;
        }

        .recap-card {
          background: ${COLORS.bgSoft};
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .recap-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .recap-row:last-child { margin-bottom: 0; }

        .recap-icon { font-size: 20px; }
        .recap-text { font-weight: 600; }

        .copy-btn {
          width: 100%;
          padding: 14px;
          background: ${COLORS.bgSoft};
          border: 1px solid ${COLORS.border};
          border-radius: 100px;
          color: ${COLORS.ink};
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          font-family: inherit;
        }

        .copy-btn.copied {
          background: ${COLORS.p3Soft};
          border-color: ${COLORS.p3};
          color: ${COLORS.p3};
        }

        .view-match-link {
          display: block;
          width: 100%;
          padding: 14px;
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 100px;
          color: ${COLORS.ink};
          font-weight: 600;
          text-decoration: none;
          margin-top: 12px;
          text-align: center;
        }

        .back-link {
          display: block;
          color: ${COLORS.gray};
          font-size: 14px;
          text-decoration: none;
          margin-top: 16px;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .manual-inputs {
            grid-template-columns: 1fr;
          }

          .time-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  )
}