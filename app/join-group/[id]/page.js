'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JoinGroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    loadData()
  }, [groupId])

  async function loadData() {
    try {
      // Charger le groupe
      const { data: groupData, error: groupError } = await supabase
        .from('player_groups')
        .select(`
          *,
          profiles!player_groups_created_by_fkey (id, name)
        `)
        .eq('id', groupId)
        .single()

      if (groupError || !groupData) {
        setError('Ce groupe n\'existe pas.')
        setLoading(false)
        return
      }

      setGroup(groupData)

      // Charger les membres
      const { data: membersData } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles (id, name, experience, ambiance)
        `)
        .eq('group_id', groupId)

      setMembers(membersData || [])

      // Vérifier si connecté
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        // Vérifier si déjà membre
        const isMember = membersData?.some(m => m.user_id === session.user.id)
        setAlreadyMember(isMember)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading group:', error)
      setError('Erreur lors du chargement.')
      setLoading(false)
    }
  }

  async function joinGroup() {
    if (!user) {
      router.push(`/auth?redirect=/join-group/${groupId}`)
      return
    }

    setJoining(true)

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: parseInt(groupId),
          user_id: user.id,
          role: 'member'
        })

      if (error) throw error

      router.push('/dashboard/groups')
    } catch (error) {
      console.error('Error joining group:', error)
      setError('Erreur lors de l\'inscription au groupe.')
    } finally {
      setJoining(false)
    }
  }

  const experienceLabels = {
    'less6months': '🌱 Débutant',
    '6months2years': '📈 Intermédiaire',
    '2to5years': '💪 Confirmé',
    'more5years': '🏆 Expert'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (error && !group) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 48,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
            Groupe introuvable
          </h1>
          <p style={{ color: '#666', marginBottom: 24 }}>
            {error}
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        paddingTop: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎾</div>
            <div style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
              PadelMatch
            </div>
          </Link>
        </div>

        {/* Carte groupe */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #eee' }}>
            <div style={{
              width: 80,
              height: 80,
              background: '#f5f5f5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              margin: '0 auto 16px'
            }}>
              👥
            </div>
            <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
              {group.name}
            </h1>
            {group.description && (
              <p style={{ color: '#666', fontSize: 15 }}>{group.description}</p>
            )}
            <p style={{ color: '#999', fontSize: 14, marginTop: 8 }}>
              Créé par {group.profiles?.name}
            </p>
          </div>

          {/* Membres */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#999',
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              {members.length} membre{members.length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {members.map(m => (
                <div key={m.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    background: m.role === 'admin' ? '#1a1a1a' : '#e5e5e5',
                    color: m.role === 'admin' ? '#fff' : '#666',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: 14 }}>
                      {m.profiles?.name}
                      {m.role === 'admin' && ' ⭐'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {experienceLabels[m.profiles?.experience] || 'Niveau inconnu'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {alreadyMember ? (
            <div style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: 20,
              borderRadius: 14,
              textAlign: 'center',
              fontWeight: '600'
            }}>
              ✓ Tu fais déjà partie de ce groupe
            </div>
          ) : (
            <button
              onClick={joinGroup}
              disabled={joining}
              style={{
                width: '100%',
                padding: '18px',
                background: joining ? '#e5e5e5' : '#2e7d32',
                color: joining ? '#999' : '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: joining ? 'not-allowed' : 'pointer'
              }}
            >
              {joining ? 'Inscription...' : 'Rejoindre ce groupe'}
            </button>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '14px 16px',
              borderRadius: 12,
              fontSize: 14,
              marginTop: 16
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
          <Link href="/" style={{ color: '#666' }}>
            En savoir plus sur PadelMatch
          </Link>
        </div>
      </div>
    </div>
  )
}