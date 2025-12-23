'use client'

/**
 * ============================================
 * PAGE GROUPES
 * ============================================
 * 
 * Liste de tous les groupes WhatsApp, Facebook, etc.
 * avec filtres par ville, type, recherche
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState(new Set())
  const [filterCity, setFilterCity] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cities, setCities] = useState([])

  const typeConfig = {
    whatsapp: { icon: '💬', label: 'WhatsApp', color: '#dcfce7' },
    facebook: { icon: '👥', label: 'Facebook', color: '#dbeafe' },
    telegram: { icon: '✈️', label: 'Telegram', color: '#e0e7ff' },
    discord: { icon: '🎮', label: 'Discord', color: '#fae8ff' },
    other: { icon: '🔗', label: 'Autre', color: '#f1f5f9' }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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

    // Charger tous les groupes
    const { data: groupsData } = await supabase
      .from('community_groups')
      .select('*')
      .eq('is_active', true)
      .order('member_count', { ascending: false })

    setGroups(groupsData || [])

    // Extraire les villes uniques
    const citiesSet = new Set()
    ;(groupsData || []).forEach(g => {
      if (g.city) citiesSet.add(g.city)
    })
    setCities(Array.from(citiesSet).sort())

    // Si l'utilisateur a une ville, la sélectionner par défaut
    if (profileData?.city) {
      setFilterCity(profileData.city)
    }

    // Charger les groupes rejoints
    const { data: memberships } = await supabase
      .from('user_group_memberships')
      .select('group_id')
      .eq('user_id', session.user.id)

    setMyGroups(new Set((memberships || []).map(m => m.group_id)))

    setLoading(false)
  }

  async function joinGroup(groupId, inviteLink) {
    // Enregistrer l'adhésion
    await supabase
      .from('user_group_memberships')
      .insert({
        user_id: user.id,
        group_id: groupId
      })

    setMyGroups(prev => new Set([...prev, groupId]))

    // Ouvrir le lien d'invitation
    window.open(inviteLink, '_blank')
  }

  function getFilteredGroups() {
    let filtered = groups

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.name?.toLowerCase().includes(query) ||
        g.city?.toLowerCase().includes(query) ||
        g.region?.toLowerCase().includes(query)
      )
    }

    // Filtre ville
    if (filterCity !== 'all') {
      filtered = filtered.filter(g =>
        g.city?.toLowerCase() === filterCity.toLowerCase() ||
        g.region?.toLowerCase().includes(filterCity.toLowerCase())
      )
    }

    // Filtre type
    if (filterType !== 'all') {
      filtered = filtered.filter(g => g.type === filterType)
    }

    return filtered
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const filteredGroups = getFilteredGroups()

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            Groupes
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            Rejoins des communautés de padel
          </p>
        </div>
        <Link
          href="/dashboard/groups/add"
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          + Ajouter
        </Link>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 14px 14px 44px',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              outline: 'none',
              background: '#fff'
            }}
          />
        </div>
      </div>

      {/* Filtres ville */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        <button
          onClick={() => setFilterCity('all')}
          style={{
            padding: '8px 16px',
            background: filterCity === 'all' ? '#1a1a2e' : '#fff',
            color: filterCity === 'all' ? '#fff' : '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          📍 Toutes
        </button>
        {cities.slice(0, 6).map(city => (
          <button
            key={city}
            onClick={() => setFilterCity(city)}
            style={{
              padding: '8px 16px',
              background: filterCity === city ? '#1a1a2e' : '#fff',
              color: filterCity === city ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Filtres type */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '8px 16px',
            background: filterType === 'all' ? '#1a1a2e' : '#fff',
            color: filterType === 'all' ? '#fff' : '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Tous les types
        </button>
        {Object.entries(typeConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            style={{
              padding: '8px 16px',
              background: filterType === key ? '#1a1a2e' : '#fff',
              color: filterType === key ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* Liste des groupes */}
      {filteredGroups.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>👥</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
            Aucun groupe trouvé
          </h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            {filterCity !== 'all' && `Pas de groupe à ${filterCity}. `}
            Tu peux en ajouter un !
          </p>
          <Link
            href="/dashboard/groups/add"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            + Ajouter un groupe
          </Link>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {filteredGroups.map((group, i, arr) => {
            const config = typeConfig[group.type] || typeConfig.other
            const hasJoined = myGroups.has(group.id)

            return (
              <div
                key={group.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0
                }}>
                  {config.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#1a1a2e',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.name}
                    </span>
                    {group.is_verified && (
                      <span style={{ color: '#3b82f6', fontSize: 14 }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {config.label}
                    {group.city && ` · ${group.city}`}
                    {group.member_count > 0 && ` · ${group.member_count} membres`}
                  </div>
                  {group.description && (
                    <div style={{
                      fontSize: 12,
                      color: '#94a3b8',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.description}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => hasJoined ? window.open(group.invite_link, '_blank') : joinGroup(group.id, group.invite_link)}
                  style={{
                    padding: '10px 16px',
                    background: hasJoined ? '#f1f5f9' : '#1a1a2e',
                    color: hasJoined ? '#64748b' : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {hasJoined ? 'Ouvrir' : 'Rejoindre'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: '#0c4a6e' }}>
            Ces groupes sont gérés par leurs créateurs. Junto n'est pas responsable de leur contenu.
          </div>
        </div>
      </div>
    </div>
  )
}