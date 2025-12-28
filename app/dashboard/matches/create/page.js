'use client'

/**
 * ============================================
 * PAGE CRÉATION DE PARTIE - VERSION SIMPLIFIÉE
 * ============================================
 * 
 * UN SEUL ÉCRAN avec :
 * - Date (aujourd'hui, demain, ou sélection)
 * - Heure (boutons rapides)
 * - Lieu (club favori ou saisie)
 * - Nombre de joueurs recherchés
 * - Niveau minimum
 * - Bouton créer + partage WhatsApp
 * 
 * Message de partage optimisé :
 * "🎾 Cherche 2 joueurs niveau 4+ à Padelbreak Orchies
 *  le 23 décembre à 10h
 *  👉 [lien]"
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// === DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',
  p2: '#ffb400',
  p3: '#00b8a9',
  p4: '#7c5cff',
  
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  bg: '#f9f8f6',
  bgSoft: '#f5f4f2',
  card: '#ffffff',
  border: '#eae8e4',
  white: '#ffffff',
  
  green: '#22c55e',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// === HELPERS ===
function getAvatarColor(name, index = 0) {
  if (name) return PLAYER_COLORS[name.charCodeAt(0) % 4]
  return PLAYER_COLORS[index % 4]
}

function getNextDays(count) {
  const days = []
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : dayNames[date.getDay()],
      dayNum: date.getDate(),
      month: monthNames[date.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1
    })
  }
  return days
}

function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// === PAGE PRINCIPALE ===
export default function CreateMatchPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Données
  const [clubs, setClubs] = useState([])
  const [favoriteClubs, setFavoriteClubs] = useState([])
  
  // Formulaire
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    club_id: null,
    club_name: '',
    customLocation: '',
    playersNeeded: 2,
    levelMin: null
  })
  
  // État après création
  const [matchCreated, setMatchCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const nextDays = getNextDays(7)
  const timeSlots = ['08h', '09h', '10h', '11h', '12h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h']

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth'); return }

    setUser(session.user)
    
    const [profileRes, clubsRes, favoritesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('user_favorite_clubs').select('club_id').eq('user_id', session.user.id)
    ])

    setProfile(profileRes.data)
    setClubs(clubsRes.data || [])
    
    const favIds = (favoritesRes.data || []).map(f => f.club_id)
    setFavoriteClubs(clubsRes.data?.filter(c => favIds.includes(c.id)) || [])
    
    // Pré-remplir le niveau avec celui du joueur
    if (profileRes.data?.level) {
      setFormData(prev => ({ ...prev, levelMin: parseFloat(profileRes.data.level) }))
    }
    
    setLoading(false)
  }

  function selectClub(club) {
    setFormData({ ...formData, club_id: club.id, club_name: club.name, customLocation: '' })
  }

  function selectDate(dateStr) {
    setFormData({ ...formData, date: dateStr })
  }

  function selectTime(time) {
    setFormData({ ...formData, time })
  }

  function canSubmit() {
    return formData.date && formData.time && (formData.club_id || formData.customLocation)
  }

  async function handleSubmit() {
    if (!canSubmit()) return
    setSubmitting(true)

    try {
      const matchData = {
        organizer_id: user.id,
        status: 'open',
        spots_total: 4,
        spots_available: formData.playersNeeded,
        match_date: formData.date,
        match_time: formData.time.replace('h', ':00'),
        level_min: formData.levelMin,
        has_booked: false
      }

      if (formData.club_id) {
        matchData.club_id = formData.club_id
      } else if (formData.customLocation) {
        matchData.city = formData.customLocation
      }

      const { data: match, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select(`*, clubs (id, name, city)`)
        .single()

      if (error) throw error

      setMatchCreated(match)
    } catch (err) {
      console.error('Erreur création:', err)
      alert('Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  // === PARTAGE ===
  const matchUrl = matchCreated 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${matchCreated.id}`
    : ''

  function getShareMessage() {
    if (!matchCreated) return ''
    
    const lieu = matchCreated.clubs?.name || matchCreated.city || formData.customLocation || 'Lieu à définir'
    const date = formatDateLong(matchCreated.match_date)
    const heure = matchCreated.match_time?.slice(0, 5).replace(':', 'h') || ''
    const niveau = formData.levelMin ? `niveau ${formData.levelMin}+` : ''
    const nbJoueurs = formData.playersNeeded

    return `🎾 Cherche ${nbJoueurs} joueur${nbJoueurs > 1 ? 's' : ''} ${niveau}
📍 ${lieu}
📅 ${date} à ${heure}

Rejoins-nous ! 👉 ${matchUrl}`
  }

  async function handleShare() {
    const text = getShareMessage()
    
    if (navigator.share) {
      try {
        await navigator.share({ title: '🎾 Partie de Padel', text, url: matchUrl })
        return
      } catch {}
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(matchUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // === LOADING ===
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((c, i) => (
            <div key={i} className="dot-pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: c, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // === ÉCRAN DE SUCCÈS ===
  if (matchCreated) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>Partie créée !</h1>
          <p style={{ color: COLORS.gray }}>Partage-la pour trouver des joueurs</p>
        </div>

        {/* Récap */}
        <div style={{ 
          background: COLORS.card, 
          borderRadius: 20, 
          padding: 24, 
          border: `1px solid ${COLORS.border}`,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>📍</span>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.ink }}>{matchCreated.clubs?.name || formData.customLocation}</div>
              {matchCreated.clubs?.city && <div style={{ fontSize: 13, color: COLORS.gray }}>{matchCreated.clubs.city}</div>}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>📅</span>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.ink }}>{formatDateLong(matchCreated.match_date)}</div>
              <div style={{ fontSize: 13, color: COLORS.gray }}>à {matchCreated.match_time?.slice(0, 5).replace(':', 'h')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>👥</span>
            <div>
              <div style={{ fontWeight: 700, color: COLORS.ink }}>Cherche {formData.playersNeeded} joueur{formData.playersNeeded > 1 ? 's' : ''}</div>
              {formData.levelMin && <div style={{ fontSize: 13, color: COLORS.gray }}>Niveau {formData.levelMin}+</div>}
            </div>
          </div>
        </div>

        {/* Message preview */}
        <div style={{ 
          background: COLORS.bgSoft, 
          borderRadius: 16, 
          padding: 16, 
          marginBottom: 24,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          color: COLORS.gray,
          whiteSpace: 'pre-line'
        }}>
          {getShareMessage()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleShare} style={{
            padding: '16px 24px',
            background: '#25D366',
            color: COLORS.white,
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}>
            <span>📱</span> Partager sur WhatsApp
          </button>

          <button onClick={copyLink} style={{
            padding: '16px 24px',
            background: COLORS.card,
            color: COLORS.ink,
            border: `2px solid ${COLORS.border}`,
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            {copied ? '✅ Lien copié !' : '📋 Copier le lien'}
          </button>

          <Link href={`/dashboard/match/${matchCreated.id}`} style={{
            padding: '16px 24px',
            background: COLORS.bgSoft,
            color: COLORS.gray,
            border: 'none',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            textAlign: 'center',
            textDecoration: 'none'
          }}>
            Voir la partie →
          </Link>
        </div>

        <style jsx global>{`
          .dot-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }

  // === FORMULAIRE PRINCIPAL ===
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Link href="/dashboard/parties" style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: 18
        }}>←</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink }}>Nouvelle partie</h1>
      </div>

      {/* SECTION: Date */}
      <section style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
          📅 Quel jour ?
        </label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {nextDays.map(day => (
            <button
              key={day.date}
              onClick={() => selectDate(day.date)}
              style={{
                padding: '12px 16px',
                minWidth: 80,
                border: formData.date === day.date ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                borderRadius: 14,
                background: formData.date === day.date ? COLORS.bgSoft : COLORS.card,
                cursor: 'pointer',
                textAlign: 'center',
                flexShrink: 0
              }}
            >
              <div style={{ fontSize: 12, color: COLORS.gray, marginBottom: 2 }}>{day.dayName}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{day.dayNum}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{day.month}</div>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION: Heure */}
      <section style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
          ⏰ À quelle heure ?
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {timeSlots.map(time => (
            <button
              key={time}
              onClick={() => selectTime(time)}
              style={{
                padding: '10px 16px',
                border: formData.time === time ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                borderRadius: 10,
                background: formData.time === time ? COLORS.bgSoft : COLORS.card,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.ink
              }}
            >
              {time}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION: Lieu */}
      <section style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
          📍 Où ?
        </label>

        {/* Clubs favoris */}
        {favoriteClubs.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>Mes clubs favoris</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favoriteClubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => selectClub(club)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    border: formData.club_id === club.id ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    background: formData.club_id === club.id ? COLORS.bgSoft : COLORS.card,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: COLORS.ink }}>{club.name}</div>
                    {club.city && <div style={{ fontSize: 12, color: COLORS.gray }}>{club.city}</div>}
                  </div>
                  {formData.club_id === club.id && <span style={{ color: COLORS.green }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saisie manuelle */}
        <div style={{ marginTop: favoriteClubs.length > 0 ? 16 : 0 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
            {favoriteClubs.length > 0 ? 'Ou saisir un autre lieu' : 'Nom du club ou ville'}
          </div>
          <input
            type="text"
            value={formData.customLocation}
            onChange={(e) => setFormData({ ...formData, customLocation: e.target.value, club_id: null, club_name: '' })}
            placeholder="Ex: Padelbreak Orchies, Padel Arena..."
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1px solid ${formData.customLocation ? COLORS.ink : COLORS.border}`,
              borderRadius: 12,
              fontSize: 15,
              background: COLORS.card
            }}
          />
        </div>
      </section>

      {/* SECTION: Joueurs recherchés */}
      <section style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
          👥 Combien de joueurs cherches-tu ?
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setFormData({ ...formData, playersNeeded: n })}
              style={{
                flex: 1,
                padding: '14px',
                border: formData.playersNeeded === n ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                borderRadius: 12,
                background: formData.playersNeeded === n ? COLORS.bgSoft : COLORS.card,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.ink
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION: Niveau minimum */}
      <section style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
          ⭐ Niveau minimum (optionnel)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[null, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(level => (
            <button
              key={level || 'any'}
              onClick={() => setFormData({ ...formData, levelMin: level })}
              style={{
                padding: '10px 16px',
                border: formData.levelMin === level ? `2px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                borderRadius: 10,
                background: formData.levelMin === level ? COLORS.bgSoft : COLORS.card,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.ink
              }}
            >
              {level ? `${level}+` : 'Tous'}
            </button>
          ))}
        </div>
      </section>

      {/* BOUTON CRÉER */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit() || submitting}
        style={{
          width: '100%',
          padding: '18px',
          background: canSubmit() ? COLORS.ink : COLORS.border,
          color: canSubmit() ? COLORS.white : COLORS.muted,
          border: 'none',
          borderRadius: 16,
          fontSize: 17,
          fontWeight: 700,
          cursor: canSubmit() ? 'pointer' : 'not-allowed',
          marginBottom: 16
        }}
      >
        {submitting ? 'Création...' : '🎾 Créer la partie'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: COLORS.muted }}>
        Tu pourras ensuite partager le lien pour trouver des joueurs
      </p>

      <style jsx global>{`
        input:focus {
          outline: none;
          border-color: ${COLORS.ink} !important;
        }
        .dot-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}