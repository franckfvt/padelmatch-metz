'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

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

      // Charger mes groupes avec les membres
      const { data: groupsData } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          player_groups (
            id,
            name,
            description,
            created_by,
            created_at
          )
        `)
        .eq('user_id', session.user.id)

      // Pour chaque groupe, charger les membres
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (g) => {
          const { data: members } = await supabase
            .from('group_members')
            .select(`
              user_id,
              role,
              profiles (id, name, experience, ambiance, matches_played, matches_won)
            `)
            .eq('group_id', g.group_id)

          // Charger les stats du groupe (parties jouées ensemble)
          const { count: matchCount } = await supabase
            .from('matches')
            .select('id', { count: 'exact' })
            .contains('team_a', [session.user.id])
            .eq('status', 'completed')

          return {
            ...g.player_groups,
            role: g.role,
            members: members || [],
            matchesPlayed: matchCount || 0
          }
        })
      )

      setGroups(groupsWithMembers.filter(Boolean))
      setLoading(false)

    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function createGroup(e) {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setCreating(true)

    try {
      // Créer le groupe
      const { data: group, error } = await supabase
        .from('player_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter le créateur comme admin
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      setShowCreateModal(false)
      setNewGroupName('')
      setNewGroupDesc('')
      loadData()

    } catch (error) {
      console.error('Error creating group:', error)
      alert('Erreur lors de la création du groupe')
    } finally {
      setCreating(false)
    }
  }

  async function leaveGroup(groupId) {
    if (!confirm('Tu veux vraiment quitter ce groupe ?')) return

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      loadData()
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  async function deleteGroup(groupId) {
    if (!confirm('Tu veux vraiment supprimer ce groupe ? Cette action est irréversible.')) return

    try {
      await supabase.from('group_members').delete().eq('group_id', groupId)
      await supabase.from('player_groups').delete().eq('id', groupId)
      loadData()
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  function openInviteModal(group) {
    setSelectedGroup(group)
    setInviteLink(`${window.location.origin}/join-group/${group.id}`)
    setShowInviteModal(true)
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `👥 Rejoins mon groupe de padel "${selectedGroup.name}" sur PadelMatch !\n\n${inviteLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const experienceLabels = {
    'less6months': 'Débutant',
    '6months2years': 'Intermédiaire',
    '2to5years': 'Confirmé',
    'more5years': 'Expert'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>👥</div>
        <div style={{ color: '#666' }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
            Mes groupes
          </h1>
          <p style={{ color: '#666' }}>
            Crée des groupes pour jouer régulièrement avec les mêmes personnes
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
          + Créer un groupe
        </button>
      </div>

      {groups.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <h2 style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
            Pas encore de groupe
          </h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Crée un groupe pour inviter tes partenaires de jeu réguliers
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
            Créer mon premier groupe
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {groups.map(group => {
            const isAdmin = group.created_by === user?.id

            return (
              <div
                key={group.id}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: 24,
                  border: '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>
                      {group.name}
                    </h2>
                    {group.description && (
                      <p style={{ color: '#666', fontSize: 14 }}>{group.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 14, color: '#666' }}>
                      <span>👥 {group.members?.length || 0} membres</span>
                      <span>🎾 {group.matchesPlayed} parties</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openInviteModal(group)}
                      style={{
                        padding: '10px 16px',
                        background: '#f5f5f5',
                        color: '#1a1a1a',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Inviter
                    </button>
                    {isAdmin ? (
                      <button
                        onClick={() => deleteGroup(group.id)}
                        style={{
                          padding: '10px 16px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Supprimer
                      </button>
                    ) : (
                      <button
                        onClick={() => leaveGroup(group.id)}
                        style={{
                          padding: '10px 16px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Quitter
                      </button>
                    )}
                  </div>
                </div>

                {/* Membres */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: '600', color: '#999', marginBottom: 12, textTransform: 'uppercase' }}>
                    Membres
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {group.members?.map(member => {
                      const winRate = member.profiles?.matches_played > 0 
                        ? Math.round((member.profiles?.matches_won || 0) / member.profiles.matches_played * 100)
                        : 0

                      return (
                        <div
                          key={member.user_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            background: '#f5f5f5',
                            borderRadius: 12
                          }}
                        >
                          <div style={{
                            width: 40,
                            height: 40,
                            background: member.role === 'admin' ? '#1a1a1a' : '#e5e5e5',
                            color: member.role === 'admin' ? '#fff' : '#666',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16
                          }}>
                            👤
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: 14, color: '#1a1a1a' }}>
                              {member.profiles?.name}
                              {member.role === 'admin' && <span style={{ fontSize: 10, marginLeft: 6 }}>⭐</span>}
                              {member.user_id === user?.id && <span style={{ fontSize: 11, color: '#666' }}> (toi)</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {experienceLabels[member.profiles?.experience] || 'Niveau inconnu'}
                              {member.profiles?.matches_played > 0 && (
                                <span> · {winRate}% wins</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions rapides */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee', display: 'flex', gap: 12 }}>
                  <Link href={`/dashboard?group=${group.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '12px 20px',
                      background: '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      🎾 Créer une partie pour ce groupe
                    </button>
                  </Link>
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
            maxWidth: 420
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>Créer un groupe</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createGroup}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Nom du groupe *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Ex: Padel du mardi"
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

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: '600', display: 'block', marginBottom: 8 }}>
                  Description (optionnel)
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="Ex: Notre groupe de potes pour les parties du mardi soir"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e5e5',
                    borderRadius: 12,
                    fontSize: 15,
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newGroupName.trim()}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: creating || !newGroupName.trim() ? '#e5e5e5' : '#1a1a1a',
                  color: creating || !newGroupName.trim() ? '#999' : '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: creating || !newGroupName.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Création...' : 'Créer le groupe'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inviter */}
      {showInviteModal && selectedGroup && (
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
            maxWidth: 420
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: '700' }}>Inviter dans "{selectedGroup.name}"</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#666', marginBottom: 20, fontSize: 15 }}>
              Partage ce lien pour inviter des joueurs dans ton groupe.
            </p>

            <div style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              wordBreak: 'break-all',
              fontSize: 14,
              color: '#666'
            }}>
              {inviteLink}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <button
                onClick={copyLink}
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
                {copied ? 'Copié !' : 'Copier le lien'}
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
                Partager sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}