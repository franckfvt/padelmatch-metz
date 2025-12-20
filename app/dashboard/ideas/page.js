'use client'

/**
 * ============================================
 * PAGE: Boîte à idées
 * ============================================
 * 
 * Permet aux utilisateurs de :
 * - Soumettre des idées
 * - Voir les idées des autres
 * - Voter pour les idées
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function IdeasPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState([])
  const [myVotes, setMyVotes] = useState(new Set())
  const [activeTab, setActiveTab] = useState('popular')
  const [showNewIdea, setShowNewIdea] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'feature'
  })

  const categoryConfig = {
    feature: { label: 'Nouvelle fonctionnalité', emoji: '✨', color: '#3b82f6' },
    improvement: { label: 'Amélioration', emoji: '⚡', color: '#f59e0b' },
    bug: { label: 'Bug à corriger', emoji: '🐛', color: '#ef4444' },
    other: { label: 'Autre', emoji: '💬', color: '#64748b' }
  }

  const statusConfig = {
    pending: { label: 'En attente', color: '#94a3b8' },
    reviewing: { label: 'En cours d\'étude', color: '#3b82f6' },
    planned: { label: 'Planifié', color: '#22c55e' },
    done: { label: 'Réalisé', color: '#22c55e' },
    rejected: { label: 'Refusé', color: '#ef4444' }
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

    // Charger les idées
    const { data: ideasData } = await supabase
      .from('idea_box')
      .select(`
        *,
        profiles!idea_box_user_id_fkey (name)
      `)
      .order('votes_count', { ascending: false })

    setIdeas(ideasData || [])

    // Charger mes votes
    const { data: votesData } = await supabase
      .from('idea_votes')
      .select('idea_id')
      .eq('user_id', session.user.id)

    setMyVotes(new Set((votesData || []).map(v => v.idea_id)))

    setLoading(false)
  }

  async function submitIdea(e) {
    e.preventDefault()
    
    if (!newIdea.title.trim()) {
      alert('Le titre est requis')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('idea_box')
        .insert({
          user_id: user.id,
          title: newIdea.title.trim(),
          description: newIdea.description.trim() || null,
          category: newIdea.category
        })

      if (error) throw error

      // Reset et recharger
      setNewIdea({ title: '', description: '', category: 'feature' })
      setShowNewIdea(false)
      loadData()

    } catch (error) {
      console.error('Error submitting idea:', error)
      alert('Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleVote(ideaId) {
    const hasVoted = myVotes.has(ideaId)

    if (hasVoted) {
      // Retirer le vote
      await supabase
        .from('idea_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('idea_id', ideaId)

      setMyVotes(prev => {
        const next = new Set(prev)
        next.delete(ideaId)
        return next
      })

      // Mettre à jour localement
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, votes_count: idea.votes_count - 1 }
          : idea
      ))
    } else {
      // Ajouter le vote
      await supabase
        .from('idea_votes')
        .insert({
          user_id: user.id,
          idea_id: ideaId
        })

      setMyVotes(prev => new Set([...prev, ideaId]))

      // Mettre à jour localement
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId 
          ? { ...idea, votes_count: idea.votes_count + 1 }
          : idea
      ))
    }
  }

  function getSortedIdeas() {
    let sorted = [...ideas]
    
    switch (activeTab) {
      case 'popular':
        return sorted.sort((a, b) => b.votes_count - a.votes_count)
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      case 'mine':
        return sorted.filter(i => i.user_id === user?.id)
      default:
        return sorted
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
        <div style={{ color: '#64748b' }}>Chargement...</div>
      </div>
    )
  }

  const sortedIdeas = getSortedIdeas()

  return (
    <div>
      {/* Bouton retour */}
      <Link href="/dashboard" style={{ 
        color: '#64748b', 
        textDecoration: 'none', 
        fontSize: 14,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12
      }}>
        ← Retour à l'accueil
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            💡 Boîte à idées
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            Propose et vote pour les prochaines fonctionnalités
          </p>
        </div>
        <button
          onClick={() => setShowNewIdea(true)}
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Proposer
        </button>
      </div>

      {/* Info */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🚀</span>
          <div style={{ fontSize: 13, color: '#0c4a6e' }}>
            Tes idées nous aident à améliorer l'app ! Vote pour les idées que tu veux voir réalisées.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        borderBottom: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'popular', label: '🔥 Populaires' },
          { id: 'recent', label: '🕐 Récentes' },
          { id: 'mine', label: '📝 Mes idées' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a1a2e' : '#94a3b8',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a2e' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des idées */}
      {sortedIdeas.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>💡</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a2e' }}>
            {activeTab === 'mine' ? 'Tu n\'as pas encore proposé d\'idée' : 'Aucune idée pour le moment'}
          </h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            Sois le premier à proposer une idée !
          </p>
          <button
            onClick={() => setShowNewIdea(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Proposer une idée
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedIdeas.map(idea => {
            const cat = categoryConfig[idea.category] || categoryConfig.other
            const status = statusConfig[idea.status] || statusConfig.pending
            const hasVoted = myVotes.has(idea.id)

            return (
              <div
                key={idea.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: 16,
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: 12
                }}
              >
                {/* Bouton vote */}
                <button
                  onClick={() => toggleVote(idea.id)}
                  style={{
                    width: 48,
                    padding: '12px 8px',
                    background: hasVoted ? '#f0fdf4' : '#f8fafc',
                    border: hasVoted ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 16 }}>{hasVoted ? '💚' : '🤍'}</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: hasVoted ? '#22c55e' : '#64748b'
                  }}>
                    {idea.votes_count}
                  </span>
                </button>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{
                      background: cat.color + '15',
                      color: cat.color,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {cat.emoji} {cat.label}
                    </span>
                    {idea.status !== 'pending' && (
                      <span style={{
                        background: status.color + '15',
                        color: status.color,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {status.label}
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 600,
                    margin: '0 0 4px',
                    color: '#1a1a2e'
                  }}>
                    {idea.title}
                  </h3>

                  {idea.description && (
                    <p style={{
                      fontSize: 13,
                      color: '#64748b',
                      margin: '0 0 8px',
                      lineHeight: 1.5
                    }}>
                      {idea.description}
                    </p>
                  )}

                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Par {idea.profiles?.name || 'Anonyme'} · {new Date(idea.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>

                  {idea.admin_response && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 8,
                      borderLeft: '3px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>
                        Réponse de l'équipe
                      </div>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        {idea.admin_response}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nouvelle idée */}
      {showNewIdea && (
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
          zIndex: 1000,
          padding: 16
        }}
        onClick={() => setShowNewIdea(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 20px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                💡 Nouvelle idée
              </h3>
              <button
                onClick={() => setShowNewIdea(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitIdea} style={{ padding: 20 }}>
              {/* Catégorie */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewIdea({ ...newIdea, category: key })}
                      style={{
                        padding: '12px',
                        border: newIdea.category === key ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                        borderRadius: 10,
                        background: newIdea.category === key ? config.color + '10' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{config.emoji}</span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', marginTop: 4 }}>
                        {config.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Titre *
                </label>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="Décris ton idée en une phrase"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                  Détails (optionnel)
                </label>
                <textarea
                  value={newIdea.description}
                  onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                  placeholder="Explique en détail ton idée, pourquoi elle serait utile..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    fontSize: 15,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !newIdea.title.trim()}
                style={{
                  width: '100%',
                  padding: 16,
                  background: submitting || !newIdea.title.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: submitting || !newIdea.title.trim() ? '#94a3b8' : '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: submitting || !newIdea.title.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Envoi...' : 'Envoyer mon idée'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}