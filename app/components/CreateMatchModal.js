'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Modal de création de partie en 3 étapes
 * Étape 1: QUAND (date + heure)
 * Étape 2: OÙ (club)
 * Étape 3: QUI (niveau + nombre de joueurs)
 */
export default function CreateMatchModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  profile, 
  clubs = [] 
}) {
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Données du formulaire
  const [formData, setFormData] = useState({
    date: '',
    time: '18:00',
    club_id: '',
    spots: '3',
    level_min: '',
    level_max: '',
    // Options avancées
    ambiance: 'mix',
    gender: 'any',
    price_total: '',
    description: '',
    private_notes: '',
    is_duo: false,
    duo_player_id: '',
    duo_player_name: ''
  })

  // Initialiser les valeurs par défaut basées sur le profil
  useEffect(() => {
    if (profile && isOpen) {
      const userLevel = profile.level || 5
      setFormData(prev => ({
        ...prev,
        level_min: Math.max(1, userLevel - 2).toString(),
        level_max: Math.min(10, userLevel + 2).toString(),
        ambiance: profile.ambiance || 'mix',
        // Club favori (dernier utilisé stocké en localStorage)
        club_id: localStorage.getItem('lastClubId') || ''
      }))
    }
  }, [profile, isOpen])

  // Reset au fermeture
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setShowAdvanced(false)
    }
  }, [isOpen])

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆' }
  ]

  const genderOptions = [
    { id: 'any', label: 'Peu importe' },
    { id: 'mixed', label: 'Mixte' },
    { id: 'men', label: 'Hommes' },
    { id: 'women', label: 'Femmes' }
  ]

  // Générer les dates rapides (aujourd'hui + 6 jours)
  function getQuickDates() {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      
      let label
      if (i === 0) label = "Auj."
      else if (i === 1) label = "Demain"
      else label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
      
      dates.push({
        label,
        value: d.toISOString().split('T')[0]
      })
    }
    return dates
  }

  // Heures rapides
  const quickTimes = ['12:00', '14:00', '17:00', '18:00', '19:00', '20:00', '21:00']

  function nextStep() {
    if (step === 1) {
      if (!formData.date) {
        alert('Sélectionne une date')
        return
      }
      if (!formData.time) {
        alert('Sélectionne une heure')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.club_id) {
        alert('Sélectionne un club')
        return
      }
      setStep(3)
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1)
  }

  async function createMatch() {
    setCreating(true)

    try {
      // Mémoriser le club favori
      if (formData.club_id) {
        localStorage.setItem('lastClubId', formData.club_id)
      }

      // Calcul des places
      const spotsTotal = parseInt(formData.spots) + (formData.is_duo ? 2 : 1)
      const pricePerPerson = formData.price_total 
        ? Math.round(parseFloat(formData.price_total) / spotsTotal * 100) 
        : null

      const matchData = {
        organizer_id: user.id,
        match_date: formData.date,
        match_time: formData.time,
        club_id: parseInt(formData.club_id),
        spots_total: spotsTotal,
        spots_available: parseInt(formData.spots),
        level_min: parseInt(formData.level_min),
        level_max: parseInt(formData.level_max),
        ambiance: formData.ambiance,
        gender: formData.gender,
        price_total: formData.price_total ? Math.round(parseFloat(formData.price_total) * 100) : null,
        price_per_person: pricePerPerson,
        description: formData.description || null,
        private_notes: formData.private_notes || null,
        status: 'open',
        organizer_team: 'A',
        is_flexible: false
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

      // Callback de succès
      onSuccess(data)

    } catch (error) {
      console.error('Error creating match:', error)
      alert(`Erreur lors de la création: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e5e5e5',
    borderRadius: 10,
    fontSize: 15,
    boxSizing: 'border-box',
    background: '#fff'
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 440,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>
              🎾 Créer une partie
            </h2>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Étape {step}/3
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Progress bar */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? '#2e7d32' : '#e5e5e5',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {/* === ÉTAPE 1: QUAND === */}
          {step === 1 && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                📅 Quand voulez-vous jouer ?
              </h3>

              {/* Dates rapides */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                  Jour
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {getQuickDates().map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, date: d.value })}
                      style={{
                        padding: '10px 14px',
                        border: formData.date === d.value ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        background: formData.date === d.value ? '#e8f5e9' : '#fff',
                        color: formData.date === d.value ? '#2e7d32' : '#666',
                        fontSize: 13,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures rapides */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                  Heure
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {quickTimes.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, time: t })}
                      style={{
                        padding: '10px 14px',
                        border: formData.time === t ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        background: formData.time === t ? '#e8f5e9' : '#fff',
                        color: formData.time === t ? '#2e7d32' : '#666',
                        fontSize: 13,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  style={{ ...inputStyle, maxWidth: 140 }}
                />
              </div>

              <button
                onClick={nextStep}
                style={{
                  width: '100%',
                  padding: 16,
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continuer →
              </button>
            </>
          )}

          {/* === ÉTAPE 2: OÙ === */}
          {step === 2 && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                📍 Où jouez-vous ?
              </h3>

              <div style={{ marginBottom: 20 }}>
                <select
                  value={formData.club_id}
                  onChange={e => setFormData({ ...formData, club_id: e.target.value })}
                  style={{ ...inputStyle, fontSize: 16 }}
                >
                  <option value="">Sélectionne un club</option>
                  {formData.club_id && clubs.find(c => c.id.toString() === formData.club_id) && (
                    <option value={formData.club_id} style={{ fontWeight: '600' }}>
                      ⭐ {clubs.find(c => c.id.toString() === formData.club_id)?.name} (récent)
                    </option>
                  )}
                  {clubs.filter(c => c.id.toString() !== formData.club_id).map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              <div style={{
                background: '#f5f5f5',
                borderRadius: 10,
                padding: 12,
                marginBottom: 20,
                fontSize: 13,
                color: '#666'
              }}>
                💡 Le club sera visible par les joueurs qui rejoignent.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 2,
                    padding: 16,
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continuer →
                </button>
              </div>
            </>
          )}

          {/* === ÉTAPE 3: QUI === */}
          {step === 3 && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                👥 Qui recherchez-vous ?
              </h3>

              {/* Nombre de joueurs */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                  Combien de joueurs tu cherches ?
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['1', '2', '3'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, spots: num })}
                      style={{
                        flex: 1,
                        padding: '16px',
                        border: formData.spots === num ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                        borderRadius: 12,
                        background: formData.spots === num ? '#e8f5e9' : '#fff',
                        color: formData.spots === num ? '#2e7d32' : '#666',
                        fontSize: 20,
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Niveau */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                  Niveau accepté
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <select
                    value={formData.level_min}
                    onChange={e => setFormData({ ...formData, level_min: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n}/10</option>
                    ))}
                  </select>
                  <span style={{ color: '#999', fontWeight: '600' }}>→</span>
                  <select
                    value={formData.level_max}
                    onChange={e => setFormData({ ...formData, level_max: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n}/10</option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                  Joueurs de niveau {formData.level_min} à {formData.level_max} acceptés
                </div>
              </div>

              {/* Options avancées (toggle) */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#666',
                  cursor: 'pointer',
                  marginBottom: showAdvanced ? 16 : 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {showAdvanced ? '▼' : '▶'} Plus d'options (ambiance, prix, duo...)
              </button>

              {/* Options avancées (contenu) */}
              {showAdvanced && (
                <div style={{
                  background: '#fafafa',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  {/* Ambiance */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                      Ambiance
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {ambianceOptions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, ambiance: opt.id })}
                          style={{
                            flex: 1,
                            padding: '10px 6px',
                            border: formData.ambiance === opt.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                            borderRadius: 10,
                            background: formData.ambiance === opt.id ? '#e8f5e9' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{opt.emoji}</div>
                          <div style={{ fontSize: 11, fontWeight: '600', color: formData.ambiance === opt.id ? '#2e7d32' : '#666' }}>
                            {opt.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Genre */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                      Type de partie
                    </label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      style={inputStyle}
                    >
                      {genderOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prix */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                      Prix total du terrain (€)
                    </label>
                    <input
                      type="number"
                      value={formData.price_total}
                      onChange={e => setFormData({ ...formData, price_total: e.target.value })}
                      placeholder="Ex: 60"
                      style={inputStyle}
                    />
                    {formData.price_total && (
                      <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 4 }}>
                        = {Math.round(parseFloat(formData.price_total) / (parseInt(formData.spots) + 1))}€ par personne
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                      Description (optionnel)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Match détendu, débutants bienvenus !"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  {/* Notes privées */}
                  <div>
                    <label style={{ fontSize: 13, color: '#666', marginBottom: 8, display: 'block' }}>
                      Notes privées (toi seul)
                    </label>
                    <textarea
                      value={formData.private_notes}
                      onChange={e => setFormData({ ...formData, private_notes: e.target.value })}
                      placeholder="Ex: Code portail: 1234, terrain n°3"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={prevStep}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Retour
                </button>
                <button
                  onClick={createMatch}
                  disabled={creating}
                  style={{
                    flex: 2,
                    padding: 16,
                    background: creating ? '#ccc' : '#2e7d32',
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}