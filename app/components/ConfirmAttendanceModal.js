'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Modal de confirmation des présences après une partie
 * Apparaît pour l'organisateur après que la partie soit passée
 */
export default function ConfirmAttendanceModal({ 
  isOpen, 
  onClose, 
  match,
  participants,
  organizerId,
  organizerName,
  onConfirmed
}) {
  const [attendance, setAttendance] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Initialiser les présences (tous présents par défaut)
  useEffect(() => {
    if (isOpen && participants) {
      const initial = {}
      participants.forEach(p => {
        initial[p.user_id] = 'present' // 'present' ou 'absent'
      })
      // L'organisateur est toujours présent
      initial[organizerId] = 'present'
      setAttendance(initial)
      setSubmitted(false)
    }
  }, [isOpen, participants, organizerId])

  async function handleSubmit() {
    setSubmitting(true)

    try {
      // Pour chaque participant, mettre à jour le statut
      for (const participant of participants) {
        const isAbsent = attendance[participant.user_id] === 'absent'
        
        // Mettre à jour showed_up dans match_participants
        await supabase
          .from('match_participants')
          .update({ 
            showed_up: !isAbsent,
            attendance_confirmed_at: new Date().toISOString()
          })
          .eq('id', participant.id)

        // Si absent, mettre à jour le score de fiabilité
        if (isAbsent) {
          await supabase.rpc('update_reliability_score', {
            p_user_id: participant.user_id,
            p_action: 'no_show'
          })

          // Créer une notification pour le joueur absent
          await supabase.from('notifications').insert({
            user_id: participant.user_id,
            type: 'reliability_update',
            title: '⚠️ Absence signalée',
            message: `${organizerName} t'a marqué absent pour la partie du ${new Date(match.match_date).toLocaleDateString('fr-FR')}. Ton score de fiabilité a été impacté.`,
            match_id: match.id,
            related_user_id: organizerId
          })
        } else {
          // Présent = bonus de fiabilité
          await supabase.rpc('update_reliability_score', {
            p_user_id: participant.user_id,
            p_action: 'showed_up'
          })
        }
      }

      // Marquer la partie comme "présences confirmées"
      await supabase
        .from('matches')
        .update({ 
          attendance_confirmed: true,
          attendance_confirmed_at: new Date().toISOString()
        })
        .eq('id', match.id)

      setSubmitted(true)
      
      // Callback
      if (onConfirmed) onConfirmed()

    } catch (error) {
      console.error('Error confirming attendance:', error)
      alert('Erreur lors de la confirmation')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleAttendance(userId) {
    // L'organisateur ne peut pas être marqué absent
    if (userId === organizerId) return
    
    setAttendance(prev => ({
      ...prev,
      [userId]: prev[userId] === 'present' ? 'absent' : 'present'
    }))
  }

  if (!isOpen) return null

  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

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
    }}>
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
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 4px' }}>
                📋 Confirmer les présences
              </h2>
              <div style={{ fontSize: 13, color: '#666' }}>
                Partie du {new Date(match.match_date).toLocaleDateString('fr-FR')}
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
        </div>

        {submitted ? (
          // Écran de succès
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              Présences confirmées !
            </h3>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Les scores de fiabilité ont été mis à jour.
              {absentCount > 0 && (
                <><br/><span style={{ color: '#f59e0b' }}>
                  {absentCount} joueur(s) marqué(s) absent(s)
                </span></>
              )}
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '14px 32px',
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          // Formulaire de confirmation
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              Qui était présent à la partie ? Les joueurs absents verront leur score de fiabilité impacté.
            </p>

            {/* Organisateur (toujours présent) */}
            <div style={{
              padding: 14,
              background: '#e8f5e9',
              borderRadius: 12,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 40,
                height: 40,
                background: '#2e7d32',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '600'
              }}>
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                  {organizerName} <span style={{ fontSize: 12, color: '#666', fontWeight: '400' }}>(toi)</span>
                </div>
                <div style={{ fontSize: 12, color: '#2e7d32' }}>Organisateur · Présent</div>
              </div>
            </div>

            {/* Liste des participants */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {participants.filter(p => p.user_id !== organizerId).map(participant => {
                const isAbsent = attendance[participant.user_id] === 'absent'
                
                return (
                  <div
                    key={participant.id}
                    onClick={() => toggleAttendance(participant.user_id)}
                    style={{
                      padding: 14,
                      background: isAbsent ? '#fef2f2' : '#f5f5f5',
                      border: isAbsent ? '2px solid #ef4444' : '2px solid transparent',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    {participant.profiles?.avatar_url ? (
                      <img
                        src={participant.profiles.avatar_url}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          opacity: isAbsent ? 0.5 : 1
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 40,
                        height: 40,
                        background: isAbsent ? '#fecaca' : '#e5e5e5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18
                      }}>
                        {isAbsent ? '✗' : '👤'}
                      </div>
                    )}

                    {/* Infos */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: isAbsent ? '#991b1b' : '#1a1a1a',
                        textDecoration: isAbsent ? 'line-through' : 'none'
                      }}>
                        {participant.profiles?.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        ⭐ {participant.profiles?.level}/10 · ✅ {participant.profiles?.reliability_score || 100}%
                      </div>
                    </div>

                    {/* Boutons Présent/Absent */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAttendance(prev => ({ ...prev, [participant.user_id]: 'present' }))
                        }}
                        style={{
                          padding: '8px 12px',
                          background: !isAbsent ? '#22c55e' : '#fff',
                          color: !isAbsent ? '#fff' : '#666',
                          border: !isAbsent ? 'none' : '1px solid #e5e5e5',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Présent
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAttendance(prev => ({ ...prev, [participant.user_id]: 'absent' }))
                        }}
                        style={{
                          padding: '8px 12px',
                          background: isAbsent ? '#ef4444' : '#fff',
                          color: isAbsent ? '#fff' : '#666',
                          border: isAbsent ? 'none' : '1px solid #e5e5e5',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✗ Absent
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Avertissement si absents */}
            {absentCount > 0 && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20
              }}>
                <div style={{ fontSize: 13, color: '#92400e' }}>
                  ⚠️ <strong>{absentCount} joueur(s)</strong> marqué(s) absent(s). 
                  Leur score de fiabilité sera impacté (-20 points) et ils recevront une notification.
                </div>
              </div>
            )}

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 16,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Plus tard
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: 16,
                  background: submitting ? '#ccc' : '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Confirmation...' : '✓ Confirmer les présences'}
              </button>
            </div>

            <div style={{ 
              marginTop: 16, 
              fontSize: 12, 
              color: '#999',
              textAlign: 'center' 
            }}>
              Cette action met à jour les scores de fiabilité de tous les joueurs.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}