'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PollsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [polls, setPolls] = useState([])
  const [groups, setGroups] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newPoll, setNewPoll] = useState({
    title: '',
    group_id: '',
    club_id: '',
    options: [
      { date: '', time: '' },
      { date: '', time: '' },
      { date: '', time: '' }
    ]
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

      // Charger mes groupes
      const { data: groupsData } = await supabase
        .from('group_members')
        .select('group_id, player_groups (id, name)')
        .eq('user_id', session.user.id)

      setGroups(groupsData?.map(g => g.player_groups).filter(Boolean) || [])

      // Charger les clubs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      setClubs(clubsData || [])

      // Charger les sondages
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
              id,
              user_id,
              vote,
              profiles (id, name)
            )
          )
        `)
        .or(`created_by.eq.${session.user.id},group_id.in.(${groupsData?.map(g => g.group_id).join(',') || 0})`)
        .order('created_at', { ascending: false })

      setPolls(pollsData || [])
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function createPoll(e) {
    e.preventDefault()
    if (!newPoll.title.trim()) return

    const validOptions = newPoll.options.filter(o => o.date && o.time)
    if (validOptions.length < 2) {
      alert('Ajoute au moins 2 créneaux')
      return
    }

    setCreating(true)

    try {
      // Créer le sondage
      const { data: poll, error } = await supabase
        .from('availability_polls')
        .insert({
          title: newPoll.title.trim(),
          group_id: newPoll.group_id ? parseInt(newPoll.group_id) : null,
          club_id: newPoll.club_id ? parseInt(newPoll.club_id) : null,
          created_by: user.id,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Créer les options
      for (const opt of validOptions) {
        await supabase
          .from('poll_options')
          .insert({
            poll_id: poll.id,
            date: opt.date,
            time: opt.time
          })
      }

      setShowCreateModal(false)
      setNewPoll({
        title: '',
        group_id: '',
        club_id: '',
        options: [
          { date: '', time: '' },
          { date: '', time: '' },
          { date: '', time: '' }
        ]
      })
      loadData()

    } catch (error) {
      console.error('Error creating poll:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function vote(optionId, vote) {
    try {
      // Supprimer vote existant
      await supabase
        .from('poll_votes')
        .delete()
        .eq('option_id', optionId)
        .eq('user_id', user.id)

      // Ajouter nouveau vote
      await supabase
        .from('poll_votes')
        .insert({
          option_id: optionId,
          user_id: user.id,
          vote: vote
        })

      loadData()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  async function closePoll(pollId) {
    try {
      await supabase
        .from('availability_polls')
        .update({ status: 'closed' })
        .eq('id', pollId)

      loadData()
    } catch (error) {
      console.error('Error closing poll:', error)
    }
  }

  async function createMatchFromOption(poll, option) {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          organizer_id: user.id,
          club_id: poll.club_id,
          match_date: option.date,
          match_time: option.time,
          spots_total: 4,
          spots_available: 3,
          ambiance: 'mix',
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      // Fermer le sondage
      await closePoll(poll.id)

      router.push(`/dashboard/match/${match.id}`)
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  function addOption() {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { date: '', time: '' }]
    })
  }

  function updateOption(index, field, value) {
    const options = [...newPoll.options]
    options[index][field] = value
    setNewPoll({ ...newPoll, options })
  }

  function removeOption(index) {
    if (newPoll.options.length <= 2) return
    const options = newPoll.options.filter((_, i) => i !== index)
    setNewPoll({ ...newPoll, options })
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  function getMinDate() {
    return new Date().toISOString().split('T')[0]
  }

  function getMyVote(option) {
    return option.poll_votes?.find(v => v.user_id === user?.id)?.vote
  }

  function getVoteCounts(option) {
    const votes = option.poll_votes || []
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      maybe: votes.filter(v => v.vote === 'maybe').length,
      no: votes.filter(v => v.vote === 'no').length
    }
  }

  function getBestOption(poll) {
    let best = null
    let bestScore = -1
    
    for (const opt of poll.poll_options || []) {
      const counts = getVoteCounts(opt)
      const score = counts.yes * 2 + counts.maybe
      if (score > bestScore) {
        bestScore = score
        best = opt
      }
    }
    
    return best
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🗓️</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
            Sondages
          </h1>
          <p style={{ color: '#666' }}>
            Trouve le meilleur créneau pour ta prochaine partie
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '14px 24px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Créer un sondage
        </button>
      </div>

      {polls.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗓️</div>
          <h2 style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
            Pas de sondage en cours
          </h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Crée un sondage pour trouver le meilleur créneau avec ton groupe
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '14px 28px',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Créer un sondage
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {polls.map(poll => {
            const isCreator = poll.created_by === user?.id
            const bestOption = getBestOption(poll)

            return (
              <div
                key={poll.id}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: 24,
                  border: poll.status === 'closed' ? '1px solid #e5e5e5' : '1px solid #eee',
                  opacity: poll.status === 'closed' ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <h2 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>
                        {poll.title}
                      </h2>
                      {poll.status === 'closed' && (
                        <span style={{
                          background: '#f5f5f5',
                          color: '#666',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: '600'
                        }}>
                          Fermé
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      Par {poll.profiles?.name}
                      {poll.player_groups && <span> · {poll.player_groups.name}</span>}
                      {poll.clubs && <span> · 📍 {poll.clubs.name}</span>}
                    </div>
                  </div>
                  {isCreator && poll.status === 'open' && (
                    <button
                      onClick={() => closePoll(poll.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#f5f5f5',
                        color: '#666',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Fermer
                    </button>
                  )}
                </div>

                {/* Options */}
                <div style={{ display: 'grid', gap: 12 }}>
                  {poll.poll_options?.map(option => {
                    const myVote = getMyVote(option)
                    const counts = getVoteCounts(option)
                    const isBest = option.id === bestOption?.id

                    return (
                      <div
                        key={option.id}
                        style={{
                          padding: 16,
                          background: isBest ? '#e8f5e9' : '#f5f5f5',
                          borderRadius: 12,
                          border: isBest ? '2px solid #2e7d32' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                                {formatDate(option.date)}
                              </div>
                              <div style={{ fontSize: 20, fontWeight: '700', color: '#2e7d32' }}>
                                {formatTime(option.time)}
                              </div>
                            </div>
                            {isBest && (
                              <span style={{
                                background: '#2e7d32',
                                color: '#fff',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: '600'
                              }}>
                                ⭐ Meilleur
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>✅ {counts.yes}</span>
                            <span style={{ fontSize: 14 }}>🤔 {counts.maybe}</span>
                            <span style={{ fontSize: 14 }}>❌ {counts.no}</span>
                          </div>
                        </div>

                        {poll.status === 'open' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => vote(option.id, 'yes')}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: myVote === 'yes' ? '#2e7d32' : '#fff',
                                color: myVote === 'yes' ? '#fff' : '#1a1a1a',
                                border: '2px solid #2e7d32',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Dispo
                            </button>
                            <button
                              onClick={() => vote(option.id, 'maybe')}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: myVote === 'maybe' ? '#f59e0b' : '#fff',
                                color: myVote === 'maybe' ? '#fff' : '#1a1a1a',
                                border: '2px solid #f59e0b',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              🤔 Peut-être
                            </button>
                            <button
                              onClick={() => vote(option.id, 'no')}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: myVote === 'no' ? '#dc2626' : '#fff',
                                color: myVote === 'no' ? '#fff' : '#1a1a1a',
                                border: '2px solid #dc2626',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              ❌ Pas dispo
                            </button>
                          </div>
                        )}

                        {/* Qui a voté */}
                        {option.poll_votes?.length > 0 && (
                          <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                            {option.poll_votes.filter(v => v.vote === 'yes').map(v => v.profiles?.name).join(', ')}
                            {option.poll_votes.filter(v => v.vote === 'yes').length > 0 && ' ✅'}
                          </div>
                        )}

                        {/* Créer la partie */}
                        {isCreator && poll.status === 'open' && poll.club_id && (
                          <button
                            onClick={() => createMatchFromOption(poll, option)}
                            style={{
                              marginTop: 12,
                              padding: '10px 16px',
                              background: '#1a1a1a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            🎾 Créer la partie sur ce créneau
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Créer */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
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
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>Créer un sondage</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createPoll}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Titre du sondage *
                </label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={e => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder="Ex: Padel cette semaine ?"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {groups.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                    Groupe (optionnel)
                  </label>
                  <select
                    value={newPoll.group_id}
                    onChange={e => setNewPoll({ ...newPoll, group_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e5e5e5',
                      borderRadius: 12,
                      fontSize: 15,
                      boxSizing: 'border-box',
                      background: '#fff'
                    }}
                  >
                    <option value="">Pas de groupe</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Club (optionnel)
                </label>
                <select
                  value={newPoll.club_id}
                  onChange={e => setNewPoll({ ...newPoll, club_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="">Pas encore décidé</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Créneaux proposés *
                </label>
                <div style={{ display: 'grid', gap: 12 }}>
                  {newPoll.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="date"
                        value={opt.date}
                        onChange={e => updateOption(i, 'date', e.target.value)}
                        min={getMinDate()}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '2px solid #e5e5e5',
                          borderRadius: 10,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="time"
                        value={opt.time}
                        onChange={e => updateOption(i, 'time', e.target.value)}
                        style={{
                          width: 100,
                          padding: '12px',
                          border: '2px solid #e5e5e5',
                          borderRadius: 10,
                          fontSize: 14
                        }}
                      />
                      {newPoll.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          style={{
                            padding: '12px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 10,
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  style={{
                    marginTop: 12,
                    padding: '10px 16px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  + Ajouter un créneau
                </button>
              </div>

              <button
                type="submit"
                disabled={creating || !newPoll.title.trim()}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: creating || !newPoll.title.trim() ? '#e5e5e5' : '#1a1a1a',
                  color: creating || !newPoll.title.trim() ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating || !newPoll.title.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : 'Créer le sondage'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}