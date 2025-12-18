'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PollsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGroupId = searchParams.get('group')
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [polls, setPolls] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(!!preselectedGroupId)
  const [creating, setCreating] = useState(false)
  const [newPoll, setNewPoll] = useState({
    title: '',
    group_id: preselectedGroupId || '',
    club_id: '',
    options: [{ date: '', time: '' }, { date: '', time: '' }]
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // Clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      setClubs(clubsData || [])

      // Groupes où je suis
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id)

      const groupIds = memberships?.map(m => m.group_id) || []

      // Groupes créés
      const { data: createdGroups } = await supabase
        .from('player_groups')
        .select('id')
        .eq('created_by', session.user.id)

      const createdGroupIds = createdGroups?.map(g => g.id) || []
      const allGroupIds = [...new Set([...groupIds, ...createdGroupIds])]

      if (allGroupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('player_groups')
          .select('*')
          .in('id', allGroupIds)

        setGroups(groupsData || [])

        // Sondages de ces groupes
        const { data: pollsData } = await supabase
          .from('availability_polls')
          .select(`
            *,
            player_groups (id, name),
            clubs (id, name),
            profiles!availability_polls_created_by_fkey (id, name),
            poll_options (
              id,
              date,
              time,
              poll_votes (
                user_id,
                profiles (id, name)
              )
            )
          `)
          .in('group_id', allGroupIds)
          .eq('status', 'open')
          .order('created_at', { ascending: false })

        setPolls(pollsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function createPoll(e) {
    e.preventDefault()
    
    const validOptions = newPoll.options.filter(o => o.date && o.time)
    if (!newPoll.title || !newPoll.group_id || validOptions.length < 2) {
      alert('Remplis le titre, le groupe et au moins 2 options')
      return
    }

    setCreating(true)

    try {
      // Créer le sondage
      const { data: poll, error } = await supabase
        .from('availability_polls')
        .insert({
          title: newPoll.title,
          group_id: parseInt(newPoll.group_id),
          club_id: newPoll.club_id ? parseInt(newPoll.club_id) : null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Créer les options
      for (const option of validOptions) {
        await supabase
          .from('poll_options')
          .insert({
            poll_id: poll.id,
            date: option.date,
            time: option.time
          })
      }

      setNewPoll({
        title: '',
        group_id: '',
        club_id: '',
        options: [{ date: '', time: '' }, { date: '', time: '' }]
      })
      setShowCreateModal(false)
      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function vote(optionId, currentlyVoted) {
    try {
      if (currentlyVoted) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('option_id', optionId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('poll_votes')
          .insert({
            option_id: optionId,
            user_id: user.id
          })
      }
      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function closePoll(pollId) {
    if (!confirm('Fermer ce sondage ?')) return

    try {
      await supabase
        .from('availability_polls')
        .update({ status: 'closed' })
        .eq('id', pollId)

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function convertToMatch(poll, winningOption) {
    if (!confirm(`Créer une partie le ${formatDate(winningOption.date)} à ${winningOption.time} ?`)) return

    try {
      // Créer le match
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: poll.club_id,
          match_date: winningOption.date,
          match_time: winningOption.time,
          spots_total: 4,
          spots_available: 3,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour le sondage
      await supabase
        .from('availability_polls')
        .update({ 
          status: 'converted',
          converted_match_id: match.id
        })
        .eq('id', poll.id)

      router.push(`/dashboard/match/${match.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la création de la partie')
    }
  }

  function addOption() {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { date: '', time: '' }]
    })
  }

  function updateOption(index, field, value) {
    const updated = [...newPoll.options]
    updated[index][field] = value
    setNewPoll({ ...newPoll, options: updated })
  }

  function removeOption(index) {
    if (newPoll.options.length <= 2) return
    const updated = newPoll.options.filter((_, i) => i !== index)
    setNewPoll({ ...newPoll, options: updated })
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  function hasVoted(option) {
    return option.poll_votes?.some(v => v.user_id === user?.id)
  }

  function getVoteCount(option) {
    return option.poll_votes?.length || 0
  }

  function getWinningOption(poll) {
    let maxVotes = 0
    let winner = null
    for (const option of poll.poll_options || []) {
      const votes = getVoteCount(option)
      if (votes > maxVotes) {
        maxVotes = votes
        winner = option
      }
    }
    return winner
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            Sondages
          </h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: 14 }}>
            Trouve le meilleur créneau
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={groups.length === 0}
          style={{
            padding: '12px 20px',
            background: groups.length === 0 ? '#e5e5e5' : '#1a1a1a',
            color: groups.length === 0 ? '#999' : '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
            cursor: groups.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          + Créer
        </button>
      </div>

      {/* Message si pas de groupe */}
      {groups.length === 0 && (
        <div style={{
          background: '#fffbeb',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          border: '1px solid #fcd34d'
        }}>
          <div style={{ fontSize: 14, color: '#92400e' }}>
            💡 Crée d'abord un groupe pour pouvoir lancer des sondages
          </div>
          <Link
            href="/dashboard/groups"
            style={{
              display: 'inline-block',
              marginTop: 10,
              padding: '8px 16px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Créer un groupe
          </Link>
        </div>
      )}

      {/* Liste des sondages */}
      {polls.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 8px' }}>
            Pas de sondage actif
          </h3>
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
            Crée un sondage pour trouver quand tout le monde est dispo
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {polls.map(poll => {
            const winningOption = getWinningOption(poll)
            const isPollCreator = poll.created_by === user?.id
            
            return (
              <div
                key={poll.id}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #eee'
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 4px' }}>
                      {poll.title}
                    </h3>
                    {isPollCreator && (
                      <button
                        onClick={() => closePoll(poll.id)}
                        style={{
                          padding: '4px 10px',
                          background: '#f5f5f5',
                          color: '#666',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Fermer
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {poll.player_groups?.name} • Par {poll.profiles?.name}
                    {poll.clubs?.name && ` • 📍 ${poll.clubs.name}`}
                  </div>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {poll.poll_options?.map(option => {
                    const voted = hasVoted(option)
                    const voteCount = getVoteCount(option)
                    const isWinning = winningOption?.id === option.id && voteCount > 0
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => vote(option.id, voted)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: voted ? '#dcfce7' : isWinning ? '#fef3c7' : '#f9fafb',
                          border: '2px solid',
                          borderColor: voted ? '#16a34a' : isWinning ? '#f59e0b' : '#eee',
                          borderRadius: 10,
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                            {formatDate(option.date)}
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {option.time?.slice(0, 5)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {voteCount > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              {option.poll_votes?.slice(0, 3).map((vote, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 11,
                                    background: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: 4
                                  }}
                                >
                                  {vote.profiles?.name?.split(' ')[0]}
                                </span>
                              ))}
                              {voteCount > 3 && (
                                <span style={{ fontSize: 11, color: '#666' }}>
                                  +{voteCount - 3}
                                </span>
                              )}
                            </div>
                          )}
                          <div style={{
                            background: voted ? '#16a34a' : '#e5e5e5',
                            color: voted ? '#fff' : '#999',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: '600',
                            minWidth: 40,
                            textAlign: 'center'
                          }}>
                            {voteCount}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Bouton convertir (pour le créateur) */}
                {isPollCreator && winningOption && getVoteCount(winningOption) >= 2 && (
                  <button
                    onClick={() => convertToMatch(poll, winningOption)}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      padding: '12px 16px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🎾 Créer la partie ({formatDate(winningOption.date)} à {winningOption.time?.slice(0, 5)})
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Retour */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link
          href="/dashboard/profile"
          style={{ color: '#666', fontSize: 14, textDecoration: 'none' }}
        >
          ← Retour au profil
        </Link>
      </div>

      {/* Modal Créer */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: 24,
            width: '100%',
            maxWidth: 500,
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 20px' }}>
              📊 Nouveau sondage
            </h2>

            <form onSubmit={createPoll}>
              {/* Titre */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Question
                </label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="Ex: Dispo cette semaine ?"
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                  required
                />
              </div>

              {/* Groupe */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Groupe
                </label>
                <select
                  value={newPoll.group_id}
                  onChange={(e) => setNewPoll({ ...newPoll, group_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16,
                    background: '#fff'
                  }}
                  required
                >
                  <option value="">Choisir un groupe</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Club (optionnel) */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Club <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <select
                  value={newPoll.club_id}
                  onChange={(e) => setNewPoll({ ...newPoll, club_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16,
                    background: '#fff'
                  }}
                >
                  <option value="">Pas encore défini</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Créneaux proposés
                </label>
                {newPoll.options.map((option, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="date"
                      value={option.date}
                      onChange={(e) => updateOption(i, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        border: '2px solid #eee',
                        fontSize: 14
                      }}
                    />
                    <input
                      type="time"
                      value={option.time}
                      onChange={(e) => updateOption(i, 'time', e.target.value)}
                      style={{
                        width: 100,
                        padding: 12,
                        borderRadius: 8,
                        border: '2px solid #eee',
                        fontSize: 14
                      }}
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        style={{
                          padding: '12px 14px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  + Ajouter un créneau
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: creating ? '#ccc' : '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creating ? 'Création...' : 'Créer le sondage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PollsPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    }>
      <PollsContent />
    </Suspense>
  )
}