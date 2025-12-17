'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function MatchPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [match, setMatch] = useState(null)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadData()
    
    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    try {
      // User
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData)

      // Match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (id, name, address, booking_url),
          profiles!matches_organizer_id_fkey (id, name, experience, ambiance)
        `)
        .eq('id', matchId)
        .single()

      if (matchError || !matchData) {
        alert('Partie introuvable')
        router.push('/dashboard')
        return
      }

      setMatch(matchData)

      // Participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select(`
          *,
          profiles (id, name, experience, ambiance)
        `)
        .eq('match_id', matchId)

      setParticipants(participantsData || [])

      // Messages
      await loadMessages()

      setLoading(false)
    } catch (error) {
      console.error('Error loading match:', error)
      setLoading(false)
    }
  }

  async function loadMessages() {
    const { data: messagesData } = await supabase
      .from('match_messages')
      .select(`
        *,
        profiles (id, name)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    setMessages(messagesData || [])
  }

  async function joinMatch() {
    try {
      // Vérifier si déjà inscrit
      const isParticipant = participants.some(p => p.user_id === user.id)
      if (isParticipant || match.organizer_id === user.id) {
        alert('Tu es déjà inscrit à cette partie !')
        return
      }

      // Ajouter le participant
      const { error } = await supabase
        .from('match_participants')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          status: 'confirmed'
        })

      if (error) throw error

      // Mettre à jour les places
      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available - 1,
          status: match.spots_available - 1 === 0 ? 'full' : 'open'
        })
        .eq('id', matchId)

      loadData()
      
      // Envoyer un message auto
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `${profile?.name || 'Un joueur'} a rejoint la partie ! 🎾`
      })
      
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Erreur lors de l\'inscription')
    }
  }

  async function leaveMatch() {
    if (!confirm('Tu veux vraiment quitter cette partie ?')) return

    try {
      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', user.id)

      if (error) throw error

      // Mettre à jour les places
      await supabase
        .from('matches')
        .update({ 
          spots_available: match.spots_available + 1,
          status: 'open'
        })
        .eq('id', matchId)

      // Envoyer un message auto
      await supabase.from('match_messages').insert({
        match_id: parseInt(matchId),
        user_id: user.id,
        message: `${profile?.name || 'Un joueur'} a quitté la partie 😢`
      })

      loadData()
    } catch (error) {
      console.error('Error leaving match:', error)
      alert('Erreur lors du départ')
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('match_messages')
        .insert({
          match_id: parseInt(matchId),
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${matchId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const link = `${window.location.origin}/join/${matchId}`
    const text = `🎾 ${profile?.name || 'Quelqu\'un'} t'invite à jouer au padel !\n\n📅 ${formatDate(match.match_date)} à ${formatTime(match.match_time)}\n📍 ${match.clubs?.name}\n\nRejoins la partie : ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    return date.toLocaleDateString('fr-FR', options)
  }

  // Format time
  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  // Format message time
  function formatMessageTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Labels
  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎾</div>
        <div style={{ color: '#666' }}>Chargement de la partie...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>😕</div>
        <div style={{ color: '#666' }}>Partie introuvable</div>
        <Link href="/dashboard" style={{ color: '#1a1a1a', marginTop: 16, display: 'inline-block' }}>
          ← Retour au dashboard
        </Link>
      </div>
    )
  }

  const isOrganizer = match.organizer_id === user?.id
  const isParticipant = participants.some(p => p.user_id === user?.id)
  const canJoin = !isOrganizer && !isParticipant && match.spots_available > 0
  const canChat = isOrganizer || isParticipant

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: 24,
      alignItems: 'start'
    }}>
      
      {/* Colonne gauche - Détails */}
      <div>
        {/* Bouton retour */}
        <Link href="/dashboard" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#666',
          textDecoration: 'none',
          fontSize: 14,
          marginBottom: 20
        }}>
          ← Retour
        </Link>

        {/* Card principale */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          marginBottom: 20,
          border: '1px solid #eee'
        }}>
          {/* Badge statut */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              background: match.status === 'open' ? '#e8f5e9' : '#fef3c7',
              color: match.status === 'open' ? '#2e7d32' : '#92400e',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: '600'
            }}>
              {match.status === 'open' 
                ? `${match.spots_available} place${match.spots_available > 1 ? 's' : ''} disponible${match.spots_available > 1 ? 's' : ''}`
                : 'Complet'
              }
            </span>
          </div>

          {/* Date et heure */}
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: 8
          }}>
            {formatDate(match.match_date)}
          </h1>
          <div style={{ 
            fontSize: 36, 
            fontWeight: '700',
            color: '#2e7d32',
            marginBottom: 20
          }}>
            {formatTime(match.match_time)}
          </div>

          {/* Lieu */}
          <div style={{
            background: '#f5f5f5',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20
          }}>
            <div style={{ 
              fontWeight: '700', 
              fontSize: 18,
              color: '#1a1a1a',
              marginBottom: 4
            }}>
              📍 {match.clubs?.name}
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              {match.clubs?.address}
            </div>
            {match.clubs?.booking_url && (
              <a
                href={match.clubs.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  background: '#fff',
                  color: '#1a1a1a',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: '600',
                  textDecoration: 'none',
                  border: '1px solid #e5e5e5'
                }}
              >
                Voir le club →
              </a>
            )}
          </div>

          {/* Ambiance */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Ambiance</div>
            <span style={{
              display: 'inline-block',
              background: match.ambiance === 'compet' ? '#fef3c7' : 
                         match.ambiance === 'loisir' ? '#dbeafe' : '#f5f5f5',
              color: match.ambiance === 'compet' ? '#92400e' : 
                     match.ambiance === 'loisir' ? '#1e40af' : '#666',
              padding: '10px 20px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: '600'
            }}>
              {match.ambiance === 'compet' ? '🏆 Compétitif' : 
               match.ambiance === 'loisir' ? '😎 Détente' : '⚡ Équilibré'}
            </span>
          </div>

          {/* Actions */}
          {canJoin && (
            <button
              onClick={joinMatch}
              style={{
                width: '100%',
                padding: '18px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              Rejoindre cette partie
            </button>
          )}

          {(isOrganizer || isParticipant) && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                width: '100%',
                padding: '18px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              📤 Inviter quelqu'un
            </button>
          )}

          {isParticipant && !isOrganizer && (
            <button
              onClick={leaveMatch}
              style={{
                width: '100%',
                padding: '14px',
                background: '#fff',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Quitter la partie
            </button>
          )}
        </div>

        {/* Joueurs */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: '700',
            marginBottom: 20,
            color: '#1a1a1a'
          }}>
            Joueurs ({1 + participants.length}/{match.spots_total})
          </h2>

          <div style={{ display: 'grid', gap: 12 }}>
            {/* Organisateur */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#fafafa',
              borderRadius: 12
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: '#1a1a1a',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  {match.profiles?.name || 'Organisateur'}
                  {match.organizer_id === user?.id && (
                    <span style={{ fontSize: 12, color: '#666' }}>(toi)</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {experienceLabels[match.profiles?.experience] || 'Organisateur'} · ⭐ Organisateur
                </div>
              </div>
            </div>

            {/* Participants */}
            {participants.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 12
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  background: '#e5e5e5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    {p.profiles?.name || 'Joueur'}
                    {p.user_id === user?.id && (
                      <span style={{ fontSize: 12, color: '#666' }}>(toi)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {experienceLabels[p.profiles?.experience] || 'Niveau inconnu'}
                  </div>
                </div>
              </div>
            ))}

            {/* Places vides */}
            {Array.from({ length: match.spots_available }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                  border: '2px dashed #e5e5e5',
                  borderRadius: 12,
                  color: '#999',
                  fontSize: 14
                }}
              >
                Place disponible
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne droite - Chat */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        height: 600,
        position: 'sticky',
        top: 100
      }}>
        {/* Header chat */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #eee'
        }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            💬 Chat de la partie
          </h2>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 20
        }}>
          {!canChat ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40,
              color: '#999'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 14 }}>
                Rejoins la partie pour accéder au chat
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 40,
              color: '#999'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <p style={{ fontSize: 14 }}>
                Aucun message pour l'instant
              </p>
              <p style={{ fontSize: 13 }}>
                Dis bonjour ! 👋
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {messages.map(msg => {
                const isMe = msg.user_id === user?.id
                const isSystem = msg.message.includes('a rejoint') || msg.message.includes('a quitté')
                
                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        textAlign: 'center',
                        fontSize: 13,
                        color: '#999',
                        padding: '8px 0'
                      }}
                    >
                      {msg.message}
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: isMe ? 'row-reverse' : 'row',
                      gap: 8,
                      alignItems: 'flex-end'
                    }}
                  >
                    {!isMe && (
                      <div style={{
                        width: 32,
                        height: 32,
                        background: '#e5e5e5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        👤
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%'
                    }}>
                      {!isMe && (
                        <div style={{ 
                          fontSize: 12, 
                          color: '#666',
                          marginBottom: 4,
                          marginLeft: 12
                        }}>
                          {msg.profiles?.name}
                        </div>
                      )}
                      <div style={{
                        background: isMe ? '#1a1a1a' : '#f5f5f5',
                        color: isMe ? '#fff' : '#1a1a1a',
                        padding: '12px 16px',
                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        fontSize: 15,
                        lineHeight: 1.4
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        color: '#999',
                        marginTop: 4,
                        textAlign: isMe ? 'right' : 'left',
                        marginLeft: isMe ? 0 : 12,
                        marginRight: isMe ? 12 : 0
                      }}>
                        {formatMessageTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input message */}
        {canChat && (
          <form 
            onSubmit={sendMessage}
            style={{
              padding: 16,
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: 12
            }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Ton message..."
              style={{
                flex: 1,
                padding: '14px 18px',
                border: '2px solid #e5e5e5',
                borderRadius: 30,
                fontSize: 15,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '14px 24px',
                background: !newMessage.trim() || sending ? '#e5e5e5' : '#1a1a1a',
                color: !newMessage.trim() || sending ? '#999' : '#fff',
                border: 'none',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: '600',
                cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer'
              }}
            >
              →
            </button>
          </form>
        )}
      </div>

      {/* Modal Inviter */}
      {showInviteModal && (
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
            padding: 32,
            width: '100%',
            maxWidth: 420
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>
                Inviter quelqu'un
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
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

            <p style={{ 
              color: '#666', 
              marginBottom: 24,
              fontSize: 15,
              lineHeight: 1.5
            }}>
              Partage ce lien pour inviter des joueurs à rejoindre cette partie.
            </p>

            {/* Lien */}
            <div style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              wordBreak: 'break-all',
              fontSize: 14,
              color: '#666'
            }}>
              {typeof window !== 'undefined' && `${window.location.origin}/join/${matchId}`}
            </div>

            {/* Boutons */}
            <div style={{ display: 'grid', gap: 12 }}>
              <button
                onClick={copyInviteLink}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: copied ? '#e8f5e9' : '#1a1a1a',
                  color: copied ? '#2e7d32' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copied ? '✓ Copié !' : '📋 Copier le lien'}
              </button>
              
              <button
                onClick={shareWhatsApp}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📱 Partager sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}