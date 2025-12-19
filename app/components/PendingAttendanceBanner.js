'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ConfirmAttendanceModal from './ConfirmAttendanceModal'

/**
 * Banner qui apparaît quand l'organisateur a des parties à confirmer
 * À intégrer dans le layout ou le dashboard
 */
export default function PendingAttendanceBanner({ userId, userName }) {
  const [pendingMatches, setPendingMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (userId) {
      loadPendingMatches()
    }
  }, [userId])

  async function loadPendingMatches() {
    try {
      // Récupérer les parties passées non confirmées
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = now.toTimeString().slice(0, 5)

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          match_time,
          attendance_confirmed,
          clubs (name)
        `)
        .eq('organizer_id', userId)
        .eq('attendance_confirmed', false)
        .eq('status', 'open')
        .or(`match_date.lt.${today},and(match_date.eq.${today},match_time.lt.${currentTime})`)
        .order('match_date', { ascending: false })
        .limit(5)

      if (error) throw error
      setPendingMatches(data || [])
    } catch (error) {
      console.error('Error loading pending matches:', error)
    }
  }

  async function openConfirmModal(match) {
    // Charger les participants
    const { data } = await supabase
      .from('match_participants')
      .select(`
        *,
        profiles (id, name, level, avatar_url, reliability_score)
      `)
      .eq('match_id', match.id)
      .eq('status', 'confirmed')

    setParticipants(data || [])
    setSelectedMatch(match)
    setShowModal(true)
  }

  function handleConfirmed() {
    // Retirer la partie confirmée de la liste
    setPendingMatches(prev => prev.filter(m => m.id !== selectedMatch.id))
    setShowModal(false)
    setSelectedMatch(null)
  }

  // Ne rien afficher si pas de parties à confirmer ou si dismissed
  if (pendingMatches.length === 0 || dismissed) return null

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        border: '1px solid #f59e0b',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12
      }}>
        <div style={{ fontSize: 24 }}>📋</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
            {pendingMatches.length === 1 
              ? 'Tu as une partie à confirmer'
              : `Tu as ${pendingMatches.length} parties à confirmer`
            }
          </div>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 12 }}>
            Confirme les présences pour mettre à jour les scores de fiabilité.
          </div>
          
          {/* Liste des parties */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingMatches.map(match => (
              <button
                key={match.id}
                onClick={() => openConfirmModal(match)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#fff',
                  border: '1px solid #f59e0b',
                  borderRadius: 8,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }}>
                    {new Date(match.match_date).toLocaleDateString('fr-FR', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })} à {match.match_time?.slice(0, 5)}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {match.clubs?.name}
                  </div>
                </div>
                <span style={{ 
                  color: '#f59e0b', 
                  fontSize: 13, 
                  fontWeight: '600' 
                }}>
                  Confirmer →
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Bouton fermer */}
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#92400e',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4
          }}
        >
          ✕
        </button>
      </div>

      {/* Modal de confirmation */}
      {selectedMatch && (
        <ConfirmAttendanceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedMatch(null)
          }}
          match={selectedMatch}
          participants={participants}
          organizerId={userId}
          organizerName={userName}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  )
}