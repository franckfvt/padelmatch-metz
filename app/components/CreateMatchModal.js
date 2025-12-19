'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CreateMatchModal({ isOpen, onClose, onSuccess, profile, userId }) {
  const [step, setStep] = useState(1)
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState({
    club_id: '',
    club_name: '',
    date: '',
    time: '',
    spots: 3,
    level_min: Math.max(1, (profile?.level || 5) - 2),
    level_max: Math.min(10, (profile?.level || 5) + 2),
    ambiance: profile?.ambiance || 'mix',
    price_total: '',
    description: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadClubs()
      setStep(1)
    }
  }, [isOpen])

  async function loadClubs() {
    const { data } = await supabase.from('clubs').select('*').order('name')
    setClubs(data || [])
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  function getFilteredClubs() {
    if (!searchQuery) return clubs.slice(0, 5)
    return clubs.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  }

  async function handleSubmit() {
    if (!formData.club_id || !formData.date || !formData.time) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: userId,
          club_id: formData.club_id,
          match_date: formData.date,
          match_time: formData.time,
          spots_total: formData.spots + 1, // +1 pour l'organisateur
          level_min: formData.level_min,
          level_max: formData.level_max,
          ambiance: formData.ambiance,
          price_total: formData.price_total ? parseInt(formData.price_total) * 100 : null,
          description: formData.description || null,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error
      
      onSuccess?.(data)
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Erreur lors de la création')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', desc: 'Fun et convivial' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', desc: 'Fun mais on joue bien' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', desc: 'On est là pour gagner' }
  ]

  return (
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
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#666' }}
          >
            {step > 1 ? '← Retour' : '✕ Fermer'}
          </button>
          <span style={{ fontSize: 14, color: '#999' }}>Étape {step}/3</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: s < step ? '#22c55e' : s === step ? '#1a1a1a' : '#e5e5e5'
            }} />
          ))}
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {/* ÉTAPE 1: Où ? */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Où joues-tu ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 15, marginBottom: 24 }}>
                Sélectionne le club où tu as réservé
              </p>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un club..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 15,
                  marginBottom: 16,
                  boxSizing: 'border-box'
                }}
              />

              {!searchQuery && <p style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clubs récents</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {getFilteredClubs().map(club => (
                  <div
                    key={club.id}
                    onClick={() => setFormData({ ...formData, club_id: club.id, club_name: club.name })}
                    style={{
                      padding: '16px',
                      border: `2px solid ${formData.club_id === club.id ? '#1a1a1a' : '#e5e5e5'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: formData.club_id === club.id ? '#fafafa' : '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{club.name}</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{club.address}</div>
                    </div>
                    {formData.club_id === club.id && (
                      <span style={{ color: '#1a1a1a', fontSize: 18 }}>✓</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.club_id}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: formData.club_id ? '#1a1a1a' : '#e5e5e5',
                  color: formData.club_id ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: formData.club_id ? 'pointer' : 'not-allowed',
                  marginTop: 24
                }}
              >
                Continuer →
              </button>
            </>
          )}

          {/* ÉTAPE 2: Quand ? */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Quand ?
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 15, marginBottom: 24 }}>
                Date et heure de ta partie
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  min={getMinDate()}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 10,
                    fontSize: 15,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Heure
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 10,
                    fontSize: 15,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Joueurs recherchés (en plus de toi)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setFormData({ ...formData, spots: n })}
                      style={{
                        flex: 1,
                        padding: '14px',
                        border: `2px solid ${formData.spots === n ? '#1a1a1a' : '#e5e5e5'}`,
                        borderRadius: 10,
                        background: formData.spots === n ? '#1a1a1a' : '#fff',
                        color: formData.spots === n ? '#fff' : '#1a1a1a',
                        fontSize: 16,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!formData.date || !formData.time}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: formData.date && formData.time ? '#1a1a1a' : '#e5e5e5',
                  color: formData.date && formData.time ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: formData.date && formData.time ? 'pointer' : 'not-allowed',
                  marginTop: 24
                }}
              >
                Continuer →
              </button>
            </>
          )}

          {/* ÉTAPE 3: Détails */}
          {step === 3 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                Derniers détails
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 15, marginBottom: 24 }}>
                Niveau et ambiance souhaités
              </p>

              {/* Niveau */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Niveau recherché : {formData.level_min} - {formData.level_max}
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.level_min}
                    onChange={e => setFormData({ ...formData, level_min: Math.min(parseInt(e.target.value), formData.level_max) })}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.level_max}
                    onChange={e => setFormData({ ...formData, level_max: Math.max(parseInt(e.target.value), formData.level_min) })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Ambiance */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Ambiance
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ambianceOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, ambiance: opt.id })}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
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

              {/* Prix (optionnel) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Prix total du terrain (optionnel)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={formData.price_total}
                    onChange={e => setFormData({ ...formData, price_total: e.target.value })}
                    placeholder="Ex: 60"
                    style={{
                      width: '100%',
                      padding: '14px 40px 14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 15,
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>€</span>
                </div>
                {formData.price_total && (
                  <p style={{ fontSize: 13, color: '#2e7d32', marginTop: 4 }}>
                    → {Math.round(parseInt(formData.price_total) / (formData.spots + 1))}€ par personne
                  </p>
                )}
              </div>

              {/* Récapitulatif */}
              <div style={{
                background: '#f5f5f5',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24
              }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Récapitulatif</div>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {formData.club_name} • {new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {formData.time}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {formData.spots + 1} joueurs • Niveau {formData.level_min}-{formData.level_max}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#e5e5e5' : '#1a1a1a',
                  color: loading ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Création...' : 'Créer la partie 🎾'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}