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
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  
  // Form
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
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

      // Charger les groupes où je suis membre
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id)

      const groupIds = memberships?.map(m => m.group_id) || []

      // Charger aussi les groupes que j'ai créés
      const { data: createdGroups } = await supabase
        .from('player_groups')
        .select('id')
        .eq('created_by', session.user.id)

      const createdGroupIds = createdGroups?.map(g => g.id) || []
      const allGroupIds = [...new Set([...groupIds, ...createdGroupIds])]

      if (allGroupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('player_groups')
          .select(`
            *,
            profiles!player_groups_created_by_fkey (id, name),
            group_members (
              user_id,
              role,
              profiles (id, name, level)
            )
          `)
          .in('id', allGroupIds)
          .order('created_at', { ascending: false })

        setGroups(groupsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function createGroup(e) {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setCreating(true)

    try {
      const { data, error } = await supabase
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
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        })

      setNewGroupName('')
      setNewGroupDesc('')
      setShowCreateModal(false)
      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  async function leaveGroup(groupId) {
    if (!confirm('Quitter ce groupe ?')) return

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function deleteGroup(groupId) {
    if (!confirm('Supprimer ce groupe ? Cette action est irréversible.')) return

    try {
      await supabase
        .from('player_groups')
        .delete()
        .eq('id', groupId)

      loadData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function openInviteModal(group) {
    setSelectedGroup(group)
    setShowInviteModal(true)
    setCopied(false)
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/join-group/${selectedGroup.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function isGroupAdmin(group) {
    return group.created_by === user?.id
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>👥</div>
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
            Mes groupes
          </h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: 14 }}>
            Organise tes parties entre potes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Créer
        </button>
      </div>

      {/* Liste des groupes */}
      {groups.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #eee'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 8px' }}>
            Pas encore de groupe
          </h3>
          <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
            Crée un groupe pour jouer régulièrement avec tes potes
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(group => (
            <div
              key={group.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                border: '1px solid #eee'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 12
              }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 4px' }}>
                    {group.name}
                  </h3>
                  {group.description && (
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      {group.description}
                    </p>
                  )}
                </div>
                {isGroupAdmin(group) && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: '600'
                  }}>
                    Admin
                  </span>
                )}
              </div>

              {/* Membres */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  {group.group_members?.length || 0} membre{(group.group_members?.length || 0) > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.group_members?.slice(0, 8).map(member => (
                    <span
                      key={member.user_id}
                      style={{
                        background: member.user_id === user?.id ? '#1a1a1a' : '#f5f5f5',
                        color: member.user_id === user?.id ? '#fff' : '#666',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 13
                      }}
                    >
                      {member.profiles?.name?.split(' ')[0]}
                      {member.profiles?.level && (
                        <span style={{ opacity: 0.7 }}> • {member.profiles.level}</span>
                      )}
                    </span>
                  ))}
                  {(group.group_members?.length || 0) > 8 && (
                    <span style={{
                      background: '#f5f5f5',
                      color: '#666',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13
                    }}>
                      +{group.group_members.length - 8}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openInviteModal(group)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Inviter
                </button>
                <Link
                  href={`/dashboard/polls?group=${group.id}`}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#f5f5f5',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: '600',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                >
                  📊 Sondage
                </Link>
                {isGroupAdmin(group) ? (
                  <button
                    onClick={() => deleteGroup(group.id)}
                    style={{
                      padding: '10px 16px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                ) : (
                  <button
                    onClick={() => leaveGroup(group.id)}
                    style={{
                      padding: '10px 16px',
                      background: '#f5f5f5',
                      color: '#666',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Quitter
                  </button>
                )}
              </div>
            </div>
          ))}
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
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 20px' }}>
              👥 Nouveau groupe
            </h2>

            <form onSubmit={createGroup}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Nom du groupe
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Les padelos du jeudi"
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
                  Description <span style={{ color: '#999', fontWeight: '400' }}>(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Ex: Parties tous les jeudis soir"
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '2px solid #eee',
                    fontSize: 16
                  }}
                />
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
                  disabled={creating || !newGroupName.trim()}
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
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
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
          zIndex: 200,
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 8px' }}>
              🔗 Inviter dans {selectedGroup.name}
            </h2>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
              Partage ce lien pour inviter des joueurs
            </p>

            <div style={{
              background: '#f5f5f5',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              wordBreak: 'break-all',
              fontSize: 13
            }}>
              {typeof window !== 'undefined' && `${window.location.origin}/join-group/${selectedGroup.id}`}
            </div>

            <button
              onClick={copyInviteLink}
              style={{
                width: '100%',
                padding: 14,
                background: copied ? '#dcfce7' : '#1a1a1a',
                color: copied ? '#166534' : '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien'}
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/join-group/${selectedGroup.id}`
                window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins notre groupe de padel "${selectedGroup.name}" ! 🎾\n\n${link}`)}`, '_blank')
              }}
              style={{
                width: '100%',
                padding: 12,
                background: '#dcfce7',
                color: '#166534',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              📱 Partager sur WhatsApp
            </button>

            <button
              onClick={() => setShowInviteModal(false)}
              style={{
                width: '100%',
                padding: 12,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}