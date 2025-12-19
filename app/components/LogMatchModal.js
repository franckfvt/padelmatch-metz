'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Modal pour enregistrer une partie jouée en dehors de l'app
 * Comme "Enregistrer une activité" sur Strava
 */
export default function LogMatchModal({ 
  isOpen, 
  onClose, 
  userId,
  onSuccess 
}) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    result: '', // 'win', 'loss', 'no_result'
    score_us: '',
    score_them: '',
    partner_name: '',
    opponent1_name: '',
    opponent2_name: '',
    notes: '',
    ambiance: 'mix'
  })

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: '',
      result: '',
      score_us: '',
      score_them: '',
      partner_name: '',
      opponent1_name: '',
      opponent2_name: '',
      notes: '',
      ambiance: 'mix'
    })
    setStep(1)
    setSaved(false)
  }

  async function handleSubmit() {
    if (!formData.date || !formData.result) {
      alert('Remplis au moins la date et le résultat')
      return
    }

    setSaving(true)

    try {
      // Enregistrer dans match_history (table pour les parties manuelles)
      const { data, error } = await supabase
        .from('match_history')
        .insert({
          user_id: userId,
          played_date: formData.date,
          location: formData.location || null,
          result: formData.result,
          score_us: formData.score_us || null,
          score_them: formData.score_them || null,
          partner_name: formData.partner_name || null,
          opponent1_name: formData.opponent1_name || null,
          opponent2_name: formData.opponent2_name || null,
          notes: formData.notes || null,
          ambiance: formData.ambiance,
          source: 'manual' // vs 'app' pour les parties créées via l'app
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour les stats du profil
      await supabase.rpc('increment_match_stats', {
        p_user_id: userId,
        p_is_win: formData.result === 'win'
      })

      setSaved(true)
      if (onSuccess) onSuccess(data)

    } catch (error) {
      console.error('Error logging match:', error)
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

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
          padding: 20,
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>
              📝 Enregistrer une partie
            </h2>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              Ajoute une partie jouée en dehors de l'app
            </div>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
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

        {saved ? (
          // Écran de succès
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {formData.result === 'win' ? '🏆' : formData.result === 'loss' ? '💪' : '🎾'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              {formData.result === 'win' ? 'Victoire enregistrée !' : 
               formData.result === 'loss' ? 'Partie enregistrée !' : 
               'Partie ajoutée !'}
            </h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Tes stats ont été mises à jour.
            </p>
            
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { resetForm(); }}
                style={{
                  padding: '14px 24px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Ajouter une autre
              </button>
              <button
                onClick={() => { resetForm(); onClose(); }}
                style={{
                  padding: '14px 24px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Terminé
              </button>
            </div>
          </div>
        ) : (
          // Formulaire
          <div style={{ padding: 20 }}>
            {/* Date */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                📅 Date de la partie *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 15
                }}
              />
            </div>

            {/* Résultat */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                🏆 Résultat *
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'win', label: 'Victoire', emoji: '🏆', color: '#22c55e' },
                  { id: 'loss', label: 'Défaite', emoji: '😤', color: '#ef4444' },
                  { id: 'no_result', label: 'Pas de score', emoji: '🎾', color: '#666' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, result: opt.id })}
                    style={{
                      flex: 1,
                      padding: '14px 10px',
                      border: formData.result === opt.id ? `2px solid ${opt.color}` : '2px solid #e5e5e5',
                      borderRadius: 12,
                      background: formData.result === opt.id ? `${opt.color}15` : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</div>
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: '600',
                      color: formData.result === opt.id ? opt.color : '#666'
                    }}>
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Score (optionnel, si victoire ou défaite) */}
            {(formData.result === 'win' || formData.result === 'loss') && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  📊 Score (optionnel)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="text"
                    value={formData.score_us}
                    onChange={e => setFormData({ ...formData, score_us: e.target.value })}
                    placeholder="6/4 6/3"
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 15,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ color: '#999', fontWeight: '600' }}>vs</span>
                  <input
                    type="text"
                    value={formData.score_them}
                    onChange={e => setFormData({ ...formData, score_them: e.target.value })}
                    placeholder="4/6 3/6"
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 10,
                      fontSize: 15,
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Lieu */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                📍 Où as-tu joué ? (optionnel)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Padel Club Metz"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 15
                }}
              />
            </div>

            {/* Partenaire */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                👥 Avec qui ? (optionnel)
              </label>
              <input
                type="text"
                value={formData.partner_name}
                onChange={e => setFormData({ ...formData, partner_name: e.target.value })}
                placeholder="Prénom de ton partenaire"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 15
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                📝 Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Comment s'est passée la partie ?"
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e5e5e5',
                  borderRadius: 10,
                  fontSize: 15,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Bouton submit */}
            <button
              onClick={handleSubmit}
              disabled={saving || !formData.date || !formData.result}
              style={{
                width: '100%',
                padding: 16,
                background: saving || !formData.result ? '#e5e5e5' : '#2e7d32',
                color: saving || !formData.result ? '#999' : '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: '600',
                cursor: saving || !formData.result ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Enregistrement...' : '✓ Enregistrer la partie'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}