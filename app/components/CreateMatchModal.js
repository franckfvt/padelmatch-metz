'use client'

/**
 * ============================================
 * MODAL CRÉATION DE PARTIE - Version complète
 * ============================================
 * 
 * Fonctionnalités :
 * - 6 étapes de création
 * - Clubs favoris (⭐)
 * - Historique clubs utilisés
 * - Info club (site web)
 * - Ajout club manuel
 * - Partenaires avec équipes
 * - Carte de match preview
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MatchShareCard from './MatchShareCard'

export default function CreateMatchModal({ isOpen, onClose, onSuccess, profile, userId }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clubs, setClubs] = useState([])
  const [favoriteClubIds, setFavoriteClubIds] = useState([])
  const [recentClubs, setRecentClubs] = useState([])
  const [recentPlayers, setRecentPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState([])
  const [matchCreated, setMatchCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  
  // UI states
  const [showAddClub, setShowAddClub] = useState(false)
  const [showClubInfo, setShowClubInfo] = useState(null)
  const [newClub, setNewClub] = useState({ name: '', address: '', city: '', website: '' })
  const [manualPartnerName, setManualPartnerName] = useState('')

  // Données du formulaire
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
    flexibleDays: [], // CHANGÉ : tableau au lieu de string
    flexiblePeriod: '',
    partners: [], // Structure: { id?, name, level?, team, isManual: boolean }
    level_min: Math.max(1, (profile?.level || 5) - 2),
    level_max: Math.min(10, (profile?.level || 5) + 2),
    ambiance: profile?.ambiance || 'mix',
    price_total: '',
    paymentMethod: 'paylib',
    organizer_team: 'A'
  })

  const TOTAL_STEPS = 6

  // === CHARGEMENT ===
  useEffect(() => {
    if (isOpen) {
      loadClubs()
      loadFavoriteClubs()
      loadRecentClubs()
      loadRecentPlayers()
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (playerSearch.length >= 2) {
      searchPlayers()
    } else {
      setPlayerResults([])
    }
  }, [playerSearch])

  function resetForm() {
    setStep(1)
    setMatchCreated(null)
    setCopied(false)
    setShowAddClub(false)
    setShowClubInfo(null)
    setNewClub({ name: '', address: '', city: '', website: '' })
    setSearchQuery('')
    setManualPartnerName('')
    setFormData({
      hasBooked: null,
      locationType: 'club',
      club_id: null,
      club_name: '',
      club_data: null,
      city: profile?.city || '', // Pré-remplir avec la ville du profil
      radius: 10,
      dateType: 'precise',
      date: '',
      time: '',
      flexibleDays: [], // CHANGÉ
      flexiblePeriod: '',
      partners: [],
      level_min: Math.max(1, (profile?.level || 5) - 2),
      level_max: Math.min(10, (profile?.level || 5) + 2),
      ambiance: profile?.ambiance || 'mix',
      price_total: '',
      paymentMethod: 'paylib',
      organizer_team: 'A'
    })
  }

  async function loadClubs() {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .order('name')
    setClubs(data || [])
  }

  async function loadFavoriteClubs() {
    if (!userId) return
    const { data } = await supabase
      .from('user_favorite_clubs')
      .select('club_id')
      .eq('user_id', userId)
    setFavoriteClubIds((data || []).map(f => f.club_id))
  }

  async function loadRecentClubs() {
    if (!userId) return
    // Charger les clubs utilisés récemment via les matchs
    const { data } = await supabase
      .from('matches')
      .select('club_id, clubs(id, name, address, city, website)')
      .eq('organizer_id', userId)
      .not('club_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Dédupliquer
    const seen = new Set()
    const recent = []
    ;(data || []).forEach(m => {
      if (m.clubs && !seen.has(m.clubs.id)) {
        seen.add(m.clubs.id)
        recent.push(m.clubs)
      }
    })
    setRecentClubs(recent.slice(0, 5))
  }

  async function loadRecentPlayers() {
    if (!userId) return
    const { data } = await supabase
      .from('match_participants')
      .select('profiles:user_id (id, name, level, avatar_url)')
      .neq('user_id', userId)
      .limit(20)
    
    const uniquePlayers = []
    const seen = new Set()
    ;(data || []).forEach(d => {
      if (d.profiles && !seen.has(d.profiles.id)) {
        seen.add(d.profiles.id)
        uniquePlayers.push(d.profiles)
      }
    })
    setRecentPlayers(uniquePlayers.slice(0, 6))
  }

  async function searchPlayers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, level, avatar_url')
      .neq('id', userId)
      .ilike('name', `%${playerSearch}%`)
      .limit(5)
    
    const partnerIds = formData.partners.map(p => p.id)
    setPlayerResults((data || []).filter(p => !partnerIds.includes(p.id)))
  }

  // === CLUBS FAVORIS ===
  async function toggleFavoriteClub(clubId) {
    if (!userId) return
    
    if (favoriteClubIds.includes(clubId)) {
      // Retirer des favoris
      await supabase
        .from('user_favorite_clubs')
        .delete()
        .eq('user_id', userId)
        .eq('club_id', clubId)
      setFavoriteClubIds(prev => prev.filter(id => id !== clubId))
    } else {
      // Ajouter aux favoris
      await supabase
        .from('user_favorite_clubs')
        .insert({ user_id: userId, club_id: clubId })
      setFavoriteClubIds(prev => [...prev, clubId])
    }
  }

  // === AJOUT CLUB MANUEL ===
  async function addNewClub() {
    if (!newClub.name.trim()) {
      alert('Indique au moins le nom du club')
      return
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert({
          name: newClub.name.trim(),
          address: newClub.address.trim() || null,
          city: newClub.city.trim() || null,
          website: newClub.website.trim() || null,
          is_verified: false
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Sélectionner le nouveau club
      setClubs(prev => [...prev, data])
      setFormData({
        ...formData,
        club_id: data.id,
        club_name: data.name,
        club_data: data
      })
      setShowAddClub(false)
      setNewClub({ name: '', address: '', city: '', website: '' })
    } catch (error) {
      console.error('Error adding club:', error)
      alert('Erreur lors de l\'ajout du club')
    }
    setLoading(false)
  }

  // === HELPERS ===
  function getFilteredClubs() {
    if (!searchQuery) {
      // Afficher favoris puis récents
      const favClubs = clubs.filter(c => favoriteClubIds.includes(c.id))
      const recentNotFav = recentClubs.filter(c => !favoriteClubIds.includes(c.id))
      return [...favClubs, ...recentNotFav].slice(0, 6)
    }
    return clubs.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6)
  }

  function selectClub(club) {
    setFormData({
      ...formData,
      club_id: club.id,
      club_name: club.name,
      club_data: club
    })
    setShowClubInfo(null)
  }

  function addPartner(player) {
    if (formData.partners.length >= 3) return
    setFormData({
      ...formData,
      partners: [...formData.partners, { ...player, team: null, isManual: false }]
    })
    setPlayerSearch('')
    setPlayerResults([])
  }

  // Nouvelle fonction pour ajouter un partenaire manuellement
  function addManualPartner() {
    if (!manualPartnerName.trim()) return
    if (formData.partners.length >= 3) return
    
    const newPartner = {
      id: `manual_${Date.now()}`, // ID temporaire unique
      name: manualPartnerName.trim(),
      email: formData.manualPartnerEmail?.trim() || null,
      level: null,
      team: null,
      isManual: true
    }
    
    setFormData({
      ...formData,
      partners: [...formData.partners, newPartner],
      manualPartnerEmail: '' // Reset email
    })
    setManualPartnerName('')
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

  function getSpotsNeeded() {
    return 3 - formData.partners.length
  }

  function canProceed() {
    switch (step) {
      case 1: return formData.hasBooked !== null
      case 2:
        if (formData.locationType === 'club') return formData.club_id !== null
        return formData.city.trim() !== ''
      case 3:
        if (formData.dateType === 'precise') return formData.date && formData.time
        return formData.flexibleDays.length > 0 // CHANGÉ : vérifier le tableau
      case 4: return true
      case 5: return true
      default: return true
    }
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  // === SOUMISSION ===
  async function handleSubmit() {
    setLoading(true)
    try {
      // Construire les données du match
      const matchData = {
        organizer_id: userId,
        status: 'open',
        spots_total: 4,
        spots_available: getSpotsNeeded(),
        level_min: formData.level_min,
        level_max: formData.level_max,
        ambiance: formData.ambiance
      }

      // Club ou ville
      if (formData.locationType === 'club' && formData.club_id) {
        matchData.club_id = formData.club_id
      } else if (formData.locationType === 'city' && formData.city) {
        matchData.city = formData.city
        matchData.radius = formData.radius || 10
      }

      // Date/heure précise ou flexible
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

      // Optionnels (seulement si définis)
      if (formData.organizer_team) matchData.organizer_team = formData.organizer_team
      if (formData.hasBooked !== null) matchData.has_booked = formData.hasBooked
      if (formData.price_total) matchData.price_total = Math.round(parseFloat(formData.price_total) * 100)
      if (formData.paymentMethod) matchData.payment_method = formData.paymentMethod

      console.log('Creating match with data:', matchData)

      const { data: match, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select(`*, clubs (id, name, address)`)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Match created:', match)

      // Séparer les partenaires inscrits des manuels
      const registeredPartners = formData.partners.filter(p => !p.isManual)
      const manualPartners = formData.partners.filter(p => p.isManual)

      console.log('All partners to save:', formData.partners.map(p => ({
        name: p.name,
        team: p.team,
        isManual: p.isManual
      })))

      // Ajouter les partenaires INSCRITS dans match_participants
      if (registeredPartners.length > 0) {
        const participantsData = registeredPartners.map(p => ({
          match_id: match.id,
          user_id: p.id,
          team: p.team, // IMPORTANT: ne pas mettre || null ici
          status: 'confirmed',
          added_by_organizer: true
        }))
        
        console.log('Inserting registered partners:', participantsData)
        
        const { error: partError } = await supabase
          .from('match_participants')
          .insert(participantsData)
        
        if (partError) {
          console.error('Error adding participants:', partError)
        } else {
          console.log('Partners added successfully!')
        }
      }

      // Ajouter les partenaires MANUELS dans pending_invites
      if (manualPartners.length > 0) {
        const invitesData = manualPartners.map(p => ({
          match_id: match.id,
          inviter_id: userId,
          invitee_name: p.name,
          invitee_email: p.email || null,
          team: p.team || null,
          status: 'pending',
          invite_token: crypto.randomUUID()
        }))
        
        console.log('Adding manual partners:', invitesData)
        
        const { error: inviteError } = await supabase
          .from('pending_invites')
          .insert(invitesData)
        
        if (inviteError) {
          console.error('Error adding invites:', inviteError)
          // Ne pas faire échouer la création du match pour ça
        }
        
        // Log pour les invitations avec email (à implémenter côté backend)
        const emailInvites = manualPartners.filter(p => p.email)
        if (emailInvites.length > 0) {
          console.log('📧 Email invites to send:', emailInvites.map(p => ({ name: p.name, email: p.email })))
        }
      }

      setMatchCreated(match)
      setStep(6)
    } catch (error) {
      console.error('Error creating match:', error)
      alert(`Erreur: ${error.message || 'Erreur lors de la création'}`)
    }
    setLoading(false)
  }

  async function copyLink() {
    if (!matchCreated) return
    await navigator.clipboard.writeText(`${window.location.origin}/join/${matchCreated.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  // === RENDER ===
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 10
        }}>
          <button
            onClick={() => {
              if (showAddClub) {
                setShowAddClub(false)
              } else if (showClubInfo) {
                setShowClubInfo(null)
              } else if (step > 1 && step < 6) {
                setStep(step - 1)
              } else {
                onClose()
              }
            }}
            style={{ background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: '#666' }}
          >
            {(showAddClub || showClubInfo || (step > 1 && step < 6)) ? '← Retour' : '✕ Fermer'}
          </button>
          {step < 6 && !showAddClub && !showClubInfo && (
            <span style={{ fontSize: 13, color: '#999' }}>Étape {step}/{TOTAL_STEPS - 1}</span>
          )}
        </div>

        {/* Progress bar */}
        {step < 6 && !showAddClub && !showClubInfo && (
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(step / (TOTAL_STEPS - 1)) * 100}%`,
                background: '#22c55e',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        <div style={{ padding: '24px 20px' }}>

          {/* === MODAL AJOUT CLUB === */}
          {showAddClub && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Ajouter un club
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>
                Ce club sera disponible pour tous les utilisateurs
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
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

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  Adresse
                </label>
                <input
                  type="text"
                  value={newClub.address}
                  onChange={e => setNewClub({ ...newClub, address: e.target.value })}
                  placeholder="Ex: 123 rue du Padel"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  Ville
                </label>
                <input
                  type="text"
                  value={newClub.city}
                  onChange={e => setNewClub({ ...newClub, city: e.target.value })}
                  placeholder="Ex: Lyon"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 6 }}>
                  Site web
                </label>
                <input
                  type="url"
                  value={newClub.website}
                  onChange={e => setNewClub({ ...newClub, website: e.target.value })}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>

              <button
                onClick={addNewClub}
                disabled={loading || !newClub.name.trim()}
                style={{
                  width: '100%',
                  padding: 16,
                  background: loading || !newClub.name.trim() ? '#e5e5e5' : '#22c55e',
                  color: loading || !newClub.name.trim() ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: loading || !newClub.name.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Ajout...' : 'Ajouter et sélectionner'}
              </button>
            </>
          )}

          {/* === MODAL INFO CLUB === */}
          {showClubInfo && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎾</div>
                <h2 style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
                  {showClubInfo.name}
                </h2>
                {showClubInfo.address && (
                  <p style={{ color: '#666', fontSize: 14 }}>{showClubInfo.address}</p>
                )}
                {showClubInfo.city && (
                  <p style={{ color: '#888', fontSize: 13 }}>{showClubInfo.city}</p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {showClubInfo.website && (
                  <a
                    href={showClubInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: 14,
                      background: '#f5f5f5',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: '#1a1a1a',
                      fontWeight: '600',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    🌐 Voir le site web
                  </a>
                )}

                {showClubInfo.google_maps_url && (
                  <a
                    href={showClubInfo.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: 14,
                      background: '#f5f5f5',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: '#1a1a1a',
                      fontWeight: '600',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    📍 Voir sur Google Maps
                  </a>
                )}

                {showClubInfo.phone && (
                  <a
                    href={`tel:${showClubInfo.phone}`}
                    style={{
                      padding: 14,
                      background: '#f5f5f5',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: '#1a1a1a',
                      fontWeight: '600',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    📞 {showClubInfo.phone}
                  </a>
                )}

                <button
                  onClick={() => {
                    selectClub(showClubInfo)
                  }}
                  style={{
                    width: '100%',
                    padding: 16,
                    background: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: 10
                  }}
                >
                  Sélectionner ce club
                </button>
              </div>
            </>
          )}

          {/* === ÉTAPE 1 : Terrain réservé ? === */}
          {step === 1 && !showAddClub && !showClubInfo && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                As-tu déjà réservé un terrain ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>
                On adapte les infos à demander selon ta situation
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

              <ContinueButton onClick={() => setStep(2)} disabled={!canProceed()} />
            </>
          )}

          {/* === ÉTAPE 2 : Où ? === */}
          {step === 2 && !showAddClub && !showClubInfo && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Où veux-tu jouer ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>
                {formData.hasBooked ? "Indique le club où tu as réservé" : "Choisis un club ou indique une zone"}
              </p>

              {/* Toggle Club / Ville */}
              {!formData.hasBooked && (
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                  background: '#f5f5f5',
                  padding: 4,
                  borderRadius: 10
                }}>
                  <button
                    onClick={() => setFormData({ ...formData, locationType: 'club' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      borderRadius: 8,
                      background: formData.locationType === 'club' ? '#fff' : 'transparent',
                      fontWeight: '600',
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: formData.locationType === 'club' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    📍 Un club
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, locationType: 'city' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      borderRadius: 8,
                      background: formData.locationType === 'city' ? '#fff' : 'transparent',
                      fontWeight: '600',
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: formData.locationType === 'city' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    🗺️ Une ville
                  </button>
                </div>
              )}

              {/* Sélection Club */}
              {(formData.hasBooked || formData.locationType === 'club') && (
                <>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Rechercher un club..."
                    style={inputStyle}
                  />

                  {!searchQuery && (
                    <p style={{ fontSize: 11, color: '#888', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {favoriteClubIds.length > 0 ? '⭐ Favoris & récents' : '🕐 Clubs récents'}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {getFilteredClubs().map(club => (
                      <div
                        key={club.id}
                        style={{
                          padding: 14,
                          border: `2px solid ${formData.club_id === club.id ? '#22c55e' : '#e5e5e5'}`,
                          borderRadius: 12,
                          background: formData.club_id === club.id ? '#f0fdf4' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                      >
                        {/* Étoile favori */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavoriteClub(club.id)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 20,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {favoriteClubIds.includes(club.id) ? '⭐' : '☆'}
                        </button>

                        {/* Infos club */}
                        <div
                          onClick={() => selectClub(club)}
                          style={{ flex: 1, cursor: 'pointer' }}
                        >
                          <div style={{ fontWeight: '600', fontSize: 15 }}>{club.name}</div>
                          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                            {club.city || club.address || 'Adresse non renseignée'}
                          </div>
                        </div>

                        {/* Bouton info */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowClubInfo(club)
                          }}
                          style={{
                            background: '#f5f5f5',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 10px',
                            fontSize: 14,
                            cursor: 'pointer'
                          }}
                        >
                          ℹ️
                        </button>

                        {/* Check si sélectionné */}
                        {formData.club_id === club.id && (
                          <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bouton ajouter club */}
                  <button
                    onClick={() => setShowAddClub(true)}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: '#f9f9f9',
                      border: '2px dashed #ddd',
                      borderRadius: 12,
                      marginTop: 12,
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#666',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    ➕ Ajouter un nouveau club
                  </button>
                </>
              )}

              {/* Sélection Ville */}
              {!formData.hasBooked && formData.locationType === 'city' && (
                <>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Lyon, Bordeaux..."
                    style={inputStyle}
                  />

                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                      Rayon : {formData.radius} km
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={formData.radius}
                      onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                      <span>5 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </>
              )}

              <ContinueButton onClick={() => setStep(3)} disabled={!canProceed()} />
            </>
          )}

          {/* === ÉTAPE 3 : Quand ? === */}
          {step === 3 && !showAddClub && !showClubInfo && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                📅 Quand veux-tu jouer ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>
                {formData.hasBooked ? "Indique la date et l'heure" : "Choisis une date ou reste flexible"}
              </p>

              {/* Toggle Précis / Flexible - Design amélioré */}
              {!formData.hasBooked && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 24
                }}>
                  <button
                    onClick={() => setFormData({ ...formData, dateType: 'precise' })}
                    style={{
                      padding: 20,
                      border: formData.dateType === 'precise' ? '2px solid #22c55e' : '2px solid #e5e5e5',
                      borderRadius: 16,
                      background: formData.dateType === 'precise' ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Date précise</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Je connais le jour</div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, dateType: 'flexible' })}
                    style={{
                      padding: 20,
                      border: formData.dateType === 'flexible' ? '2px solid #22c55e' : '2px solid #e5e5e5',
                      borderRadius: 16,
                      background: formData.dateType === 'flexible' ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🤷</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Flexible</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Plusieurs jours possibles</div>
                  </button>
                </div>
              )}

              {/* Date précise - Design amélioré */}
              {(formData.hasBooked || formData.dateType === 'precise') && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  borderRadius: 20,
                  padding: 24,
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 12,
                      color: '#166534'
                    }}>
                      📅 Quel jour ?
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: 16,
                        border: '2px solid #22c55e',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 600,
                        background: '#fff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 12,
                      color: '#166534'
                    }}>
                      🕐 À quelle heure ?
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 16,
                        border: '2px solid #22c55e',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 600,
                        background: '#fff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Date flexible - Design amélioré */}
              {!formData.hasBooked && formData.dateType === 'flexible' && (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: 20,
                  padding: 24,
                  border: '1px solid #e2e8f0'
                }}>
                  <label style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    display: 'block', 
                    marginBottom: 16,
                    color: '#334155'
                  }}>
                    📆 Quels jours te conviennent ?
                  </label>
                  
                  {/* Grille des jours */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 8,
                    marginBottom: 20
                  }}>
                    {[
                      { day: 'Lundi', short: 'Lun' },
                      { day: 'Mardi', short: 'Mar' },
                      { day: 'Mercredi', short: 'Mer' },
                      { day: 'Jeudi', short: 'Jeu' },
                      { day: 'Vendredi', short: 'Ven' },
                      { day: 'Samedi', short: 'Sam' },
                      { day: 'Dimanche', short: 'Dim' },
                      { day: 'all', short: 'Tous', emoji: '✓' }
                    ].map(({ day, short, emoji }) => {
                      const isAll = day === 'all'
                      const allSelected = formData.flexibleDays.length === 7
                      const isSelected = isAll ? allSelected : formData.flexibleDays.includes(day)
                      
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (isAll) {
                              if (allSelected) {
                                setFormData({ ...formData, flexibleDays: [] })
                              } else {
                                setFormData({ ...formData, flexibleDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] })
                              }
                            } else {
                              if (isSelected) {
                                setFormData({ ...formData, flexibleDays: formData.flexibleDays.filter(d => d !== day) })
                              } else {
                                setFormData({ ...formData, flexibleDays: [...formData.flexibleDays, day] })
                              }
                            }
                          }}
                          style={{
                            padding: '12px 8px',
                            border: `2px solid ${isSelected ? '#22c55e' : '#e5e5e5'}`,
                            borderRadius: 10,
                            background: isSelected ? '#22c55e' : '#fff',
                            color: isSelected ? '#fff' : '#374151',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {emoji || short}
                        </button>
                      )
                    })}
                  </div>

                  {formData.flexibleDays.length > 0 && (
                    <div style={{ 
                      background: '#dcfce7', 
                      padding: '10px 14px', 
                      borderRadius: 10,
                      fontSize: 13, 
                      color: '#166534',
                      fontWeight: 600,
                      marginBottom: 20
                    }}>
                      ✓ {formData.flexibleDays.length === 7 ? 'Tous les jours' : formData.flexibleDays.join(', ')}
                    </div>
                  )}

                  {/* Moment de la journée */}
                  <label style={{ 
                    fontSize: 14, 
                    fontWeight: 700, 
                    display: 'block', 
                    marginBottom: 12,
                    color: '#334155'
                  }}>
                    🌤️ Quel moment ? (optionnel)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { id: 'matin', emoji: '🌅', label: 'Matin' },
                      { id: 'aprem', emoji: '☀️', label: 'Après-midi' },
                      { id: 'soir', emoji: '🌙', label: 'Soir' }
                    ].map(period => (
                      <button
                        key={period.id}
                        onClick={() => setFormData({
                          ...formData,
                          flexiblePeriod: formData.flexiblePeriod === period.id ? '' : period.id
                        })}
                        style={{
                          padding: 14,
                          border: `2px solid ${formData.flexiblePeriod === period.id ? '#22c55e' : '#e5e5e5'}`,
                          borderRadius: 12,
                          background: formData.flexiblePeriod === period.id ? '#f0fdf4' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{period.emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{period.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* === ÉTAPE 4 : Partenaires ? === */}
          {step === 4 && !showAddClub && !showClubInfo && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                As-tu déjà des partenaires ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 }}>
                Ajoute les joueurs qui jouent avec toi (optionnel)
              </p>

              {/* Partenaires ajoutés */}
              {formData.partners.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: '600', color: '#888', display: 'block', marginBottom: 8 }}>
                    Partenaires ajoutés ({formData.partners.length}/3)
                  </label>
                  {formData.partners.map(partner => (
                    <div key={partner.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: partner.isManual ? '#fffbeb' : '#f9f9f9',
                      borderRadius: 10,
                      marginBottom: 8,
                      border: partner.isManual ? '1px solid #fcd34d' : 'none'
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: partner.isManual ? '#fef3c7' : '#ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        overflow: 'hidden'
                      }}>
                        {partner.isManual 
                          ? '✏️'
                          : partner.avatar_url
                            ? <img src={partner.avatar_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                            : partner.name?.[0] || '?'
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: 14 }}>{partner.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {partner.isManual ? '⏳ Pas encore sur l\'app' : `Niveau ${partner.level}/10`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setPartnerTeam(partner.id, 'A')}
                          style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderRadius: 8,
                            background: partner.team === 'A' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#f1f5f9',
                            color: partner.team === 'A' ? '#fff' : '#64748b',
                            fontSize: 12,
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          🅰️ Équipe A
                        </button>
                        <button
                          onClick={() => setPartnerTeam(partner.id, 'B')}
                          style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderRadius: 8,
                            background: partner.team === 'B' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#f1f5f9',
                            color: partner.team === 'B' ? '#fff' : '#64748b',
                            fontSize: 12,
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          🅱️ Équipe B
                        </button>
                      </div>
                      <button
                        onClick={() => removePartner(partner.id)}
                        style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer', padding: 4 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recherche */}
              {formData.partners.length < 3 && (
                <>
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={e => setPlayerSearch(e.target.value)}
                    placeholder="🔍 Rechercher un joueur..."
                    style={inputStyle}
                  />

                  {playerResults.length > 0 && (
                    <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, marginTop: 8, overflow: 'hidden' }}>
                      {playerResults.map(player => (
                        <div
                          key={player.id}
                          onClick={() => addPartner(player)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            background: '#fff'
                          }}
                        >
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            overflow: 'hidden'
                          }}>
                            {player.avatar_url
                              ? <img src={player.avatar_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                              : player.name?.[0] || '?'
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: 14 }}>{player.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>Niveau {player.level}/10</div>
                          </div>
                          <span style={{ color: '#22c55e', fontWeight: '600', fontSize: 13 }}>+ Ajouter</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Séparateur */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e5e5' }}></div>
                    <span style={{ fontSize: 12, color: '#888' }}>ou</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e5e5' }}></div>
                  </div>

                  {/* Ajout manuel avec email */}
                  <div style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: '600', color: '#1a1a2e', display: 'block', marginBottom: 12 }}>
                      ✉️ Inviter quelqu'un qui n'est pas sur l'app
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="text"
                        value={manualPartnerName}
                        onChange={e => setManualPartnerName(e.target.value)}
                        placeholder="Nom ou pseudo *"
                        style={{ ...inputStyle }}
                      />
                      <input
                        type="email"
                        value={formData.manualPartnerEmail || ''}
                        onChange={e => setFormData({...formData, manualPartnerEmail: e.target.value})}
                        placeholder="Email (optionnel - pour l'inviter)"
                        style={{ ...inputStyle }}
                      />
                      <button
                        onClick={addManualPartner}
                        disabled={!manualPartnerName.trim()}
                        style={{
                          padding: '12px 16px',
                          background: manualPartnerName.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e5e5e5',
                          color: manualPartnerName.trim() ? '#fff' : '#999',
                          border: 'none',
                          borderRadius: 10,
                          fontWeight: '600',
                          cursor: manualPartnerName.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        {formData.manualPartnerEmail ? '✉️ Ajouter et envoyer invitation' : '+ Ajouter à la partie'}
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                      💡 Si tu ajoutes un email, cette personne recevra une invitation pour rejoindre
                    </p>
                  </div>

                  {/* Joueurs récents */}
                  {!playerSearch && recentPlayers.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        🕐 Joueurs récents
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {recentPlayers.filter(p => !formData.partners.find(pa => pa.id === p.id)).slice(0, 4).map(player => (
                          <button
                            key={player.id}
                            onClick={() => addPartner(player)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e5e5e5',
                              borderRadius: 20,
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 13
                            }}
                          >
                            <span>{player.name}</span>
                            <span style={{ color: '#888' }}>({player.level})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Info places */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: 12,
                marginTop: 20,
                textAlign: 'center'
              }}>
                <span style={{ color: '#166534', fontSize: 14 }}>
                  {getSpotsNeeded() === 0 ? "✅ Équipe complète !" : `🎾 ${getSpotsNeeded()} place${getSpotsNeeded() > 1 ? 's' : ''} à pourvoir`}
                </span>
              </div>

              {/* Mon équipe */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Tu joues dans quelle équipe ?
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setFormData({ ...formData, organizer_team: 'A' })}
                    style={{
                      flex: 1,
                      padding: 14,
                      border: `2px solid ${formData.organizer_team === 'A' ? '#22c55e' : '#e5e5e5'}`,
                      borderRadius: 10,
                      background: formData.organizer_team === 'A' ? '#f0fdf4' : '#fff',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🅰️ Équipe A
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, organizer_team: 'B' })}
                    style={{
                      flex: 1,
                      padding: 14,
                      border: `2px solid ${formData.organizer_team === 'B' ? '#3b82f6' : '#e5e5e5'}`,
                      borderRadius: 10,
                      background: formData.organizer_team === 'B' ? '#eff6ff' : '#fff',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🅱️ Équipe B
                  </button>
                </div>
              </div>

              <ContinueButton onClick={() => setStep(5)} disabled={false} text="Continuer" />
            </>
          )}

          {/* === ÉTAPE 5 : Détails === */}
          {step === 5 && !showAddClub && !showClubInfo && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Derniers détails
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 8 }}>
                Optionnel mais utile pour trouver des joueurs
              </p>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  display: 'block',
                  margin: '0 auto 24px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#22c55e',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {loading ? '...' : '→ Passer et créer directement'}
              </button>

              {/* Niveau recherché - Design amélioré */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 12 }}>
                  🎯 Niveau recherché
                </label>
                
                {/* Boutons de preset */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: 8, 
                  marginBottom: 16 
                }}>
                  {[
                    { label: 'Tous', min: 1, max: 10, desc: '1-10' },
                    { label: 'Débutant', min: 1, max: 3, desc: '1-3' },
                    { label: 'Inter', min: 4, max: 6, desc: '4-6' },
                    { label: 'Avancé', min: 7, max: 10, desc: '7+' }
                  ].map(preset => {
                    const isSelected = formData.level_min === preset.min && formData.level_max === preset.max
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setFormData({ ...formData, level_min: preset.min, level_max: preset.max })}
                        style={{
                          padding: '12px 8px',
                          border: `2px solid ${isSelected ? '#22c55e' : '#e5e5e5'}`,
                          borderRadius: 10,
                          background: isSelected ? '#22c55e' : '#fff',
                          color: isSelected ? '#fff' : '#374151',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{preset.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{preset.desc}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Sélection personnalisée */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 16, 
                  borderRadius: 12,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, textAlign: 'center' }}>
                    Ou personnalise la fourchette :
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select
                      value={formData.level_min}
                      onChange={e => setFormData({ 
                        ...formData, 
                        level_min: Math.min(parseInt(e.target.value), formData.level_max) 
                      })}
                      style={{
                        flex: 1,
                        padding: 12,
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        background: '#fff'
                      }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>Niveau {n}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>à</span>
                    <select
                      value={formData.level_max}
                      onChange={e => setFormData({ 
                        ...formData, 
                        level_max: Math.max(parseInt(e.target.value), formData.level_min) 
                      })}
                      style={{
                        flex: 1,
                        padding: 12,
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        background: '#fff'
                      }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>
                          {n === 10 ? 'Niveau 10' : `Niveau ${n}+`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: 12, 
                    padding: '8px 16px',
                    background: '#dcfce7',
                    borderRadius: 8,
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: '#166534' 
                  }}>
                    ✓ Niveau {formData.level_min} à {formData.level_max}{formData.level_max < 10 ? '+' : ''}
                  </div>
                </div>
              </div>

              {/* Ambiance */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>Ambiance</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'loisir', emoji: '😎', label: 'Détente' },
                    { id: 'mix', emoji: '⚡', label: 'Équilibré' },
                    { id: 'compet', emoji: '🏆', label: 'Compétitif' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, ambiance: opt.id })}
                      style={{
                        flex: 1,
                        padding: '14px 8px',
                        border: `2px solid ${formData.ambiance === opt.id ? '#1a1a1a' : '#e5e5e5'}`,
                        borderRadius: 10,
                        background: formData.ambiance === opt.id ? '#fafafa' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: 20 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: '600', marginTop: 4 }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Prix total du terrain (optionnel)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.price_total}
                    onChange={e => setFormData({ ...formData, price_total: e.target.value })}
                    placeholder="Ex: 60.00"
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>€</span>
                </div>
                {formData.price_total && (
                  <p style={{ fontSize: 13, color: '#22c55e', marginTop: 6 }}>
                    → {(parseFloat(formData.price_total) / 4).toFixed(2)}€ par personne
                  </p>
                )}
              </div>

              {/* Moyen de paiement */}
              {formData.price_total && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    Comment tu veux être remboursé ?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'paylib', label: 'Paylib' },
                      { id: 'lydia', label: 'Lydia' },
                      { id: 'cash', label: 'Espèces' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setFormData({ ...formData, paymentMethod: opt.id })}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: `2px solid ${formData.paymentMethod === opt.id ? '#1a1a1a' : '#e5e5e5'}`,
                          borderRadius: 8,
                          background: formData.paymentMethod === opt.id ? '#fafafa' : '#fff',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: '600'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ContinueButton
                onClick={handleSubmit}
                disabled={loading}
                text={loading ? 'Création...' : 'Créer la partie 🎾'}
              />
            </>
          )}

          {/* === ÉTAPE 6 : Récap === */}
          {step === 6 && matchCreated && !showAddClub && !showClubInfo && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: 40
                }}>
                  ✓
                </div>
                <h2 style={{ fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#1a1a2e' }}>Partie créée ! 🎉</h2>
                <p style={{ color: '#64748b', fontSize: 15 }}>Partage-la maintenant pour trouver des joueurs</p>
              </div>

              {/* Carte de match style FIFA */}
              <div style={{ marginBottom: 24 }}>
                <MatchShareCard 
  match={{
    match_date: formData.date || null,
    match_time: formData.time || null,
    flexible_day: formData.flexibleDays.join(', '),
    flexible_period: formData.flexiblePeriod,
    level_min: formData.level_min,
    level_max: formData.level_max,
    ambiance: formData.ambiance,
    spots_available: getSpotsNeeded(),
    club_name: selectedClub?.name || formData.city
  }}
  organizer={profile}
/>
              </div>

              {/* Boutons de partage rapide */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10, textAlign: 'center' }}>
                  Partager via
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <button
                    onClick={() => {
                      const text = `🎾 Partie de padel !\n📅 ${formData.date || 'Date flexible'}\n📍 ${selectedClub?.name || formData.city}\n\nRejoins-nous : ${window.location.origin}/join/${matchCreated.id}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                    }}
                    style={{
                      padding: '14px 8px',
                      background: '#25D366',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 22 }}>💬</span>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `🎾 Partie de padel ! Rejoins-nous : ${window.location.origin}/join/${matchCreated.id}`
                      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
                    }}
                    style={{
                      padding: '14px 8px',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 22 }}>✉️</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>SMS</span>
                  </button>
                  <button
                    onClick={copyLink}
                    style={{
                      padding: '14px 8px',
                      background: copied ? '#dcfce7' : '#f1f5f9',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{copied ? '✓' : '🔗'}</span>
                    <span style={{ fontSize: 11, color: copied ? '#166534' : '#64748b', fontWeight: 600 }}>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  onSuccess?.(matchCreated)
                  onClose()
                  router.push(`/dashboard/match/${matchCreated.id}`)
                }}
                style={{
                  width: '100%',
                  padding: 16,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                Voir ma partie →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// === COMPOSANTS ===

function OptionButton({ selected, onClick, emoji, title, subtitle }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        border: `2px solid ${selected ? '#1a1a1a' : '#e5e5e5'}`,
        borderRadius: 12,
        background: selected ? '#fafafa' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%'
      }}
    >
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: '600', fontSize: 16, color: '#1a1a1a' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{subtitle}</div>
      </div>
      {selected && <span style={{ marginLeft: 'auto', color: '#22c55e', fontSize: 20 }}>✓</span>}
    </button>
  )
}

function ContinueButton({ onClick, disabled, text = 'Continuer →' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: 16,
        background: disabled ? '#e5e5e5' : '#1a1a1a',
        color: disabled ? '#999' : '#fff',
        border: 'none',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        marginTop: 24
      }}
    >
      {text}
    </button>
  )
}

// === STYLES ===

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  border: '2px solid #e5e5e5',
  borderRadius: 10,
  fontSize: 15,
  boxSizing: 'border-box',
  outline: 'none'
}