'use client'

// app/join-invite/[token]/page.js
// Page pour accepter une invitation par lien

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function JoinInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [match, setMatch] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    loadInvite()
  }, [token])

  async function loadInvite() {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      // Charger l'invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('pending_invites')
        .select(`
          *,
          profiles:inviter_id (name, avatar_url)
        `)
        .eq('invite_token', token)
        .single()

      if (inviteError || !inviteData) {
        setError('Invitation introuvable ou expirée')
        setLoading(false)
        return
      }

      if (inviteData.status !== 'pending') {
        setError('Cette invitation a déjà été utilisée')
        setLoading(false)
        return
      }

      setInvite(inviteData)

      // Charger les détails du match
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          clubs (name, address),
          profiles!matches_organizer_id_fkey (name)
        `)
        .eq('id', inviteData.match_id)
        .single()

      setMatch(matchData)
      setLoading(false)

    } catch (err) {
      console.error('Error:', err)
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  async function acceptInvite() {
    if (!user) {
      // Stocker la redirection pour après l'onboarding
      sessionStorage.setItem('redirectAfterOnboarding', `/join-invite/${token}`)
      router.push('/auth')
      return
    }

    setAccepting(true)

    try {
      // Vérifier que l'utilisateur n'est pas déjà inscrit
      const { data: existingParticipant } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', invite.match_id)
        .eq('user_id', user.id)
        .single()

      if (existingParticipant) {
        router.push(`/dashboard/match/${invite.match_id}`)
        return
      }

      // Ajouter comme participant
      const { error: participantError } = await supabase
        .from('match_participants')
        .insert({
          match_id: invite.match_id,
          user_id: user.id,
          status: 'confirmed',
          team: invite.team || 'A',
          duo_with: invite.inviter_id
        })

      if (participantError) throw participantError

      // Mettre à jour l'invitation
      await supabase
        .from('pending_invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: user.id
        })
        .eq('id', invite.id)

      // Décrémenter les spots disponibles
      await supabase
        .from('matches')
        .update({ 
          spots_available: Math.max(0, (match.spots_available || 1) - 1)
        })
        .eq('id', invite.match_id)

      // Créer une notification pour l'inviteur
      await supabase
        .from('notifications')
        .insert({
          user_id: invite.inviter_id,
          type: 'player_joined',
          title: '🎉 Invitation acceptée !',
          message: `${invite.invitee_name || 'Ton partenaire'} a accepté ton invitation`,
          match_id: invite.match_id,
          related_user_id: user.id
        })

      // Rediriger vers la partie
      router.push(`/dashboard/match/${invite.match_id}`)

    } catch (err) {
      console.error('Error accepting invite:', err)
      setError('Erreur lors de l\'acceptation')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement de l'invitation...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f5f5f5'
      }}>
        <div style={{ 
          textAlign: 'center',
          background: '#fff',
          padding: 40,
          borderRadius: 20,
          maxWidth: 400,
          margin: '0 20px'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
            {error}
          </h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Le lien d'invitation n'est plus valide.
          </p>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: '#2e7d32',
              color: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #fff 100%)',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 32,
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎾</div>
          <h1 style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>
            Tu es invité(e) !
          </h1>
          <p style={{ color: '#666', fontSize: 15 }}>
            <strong>{invite.profiles?.name || 'Un joueur'}</strong> t'invite à jouer au padel en duo
          </p>
        </div>

        {/* Détails de la partie */}
        <div style={{
          background: '#f9f9f9',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 14, fontWeight: '600', marginBottom: 16, color: '#666' }}>
            DÉTAILS DE LA PARTIE
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <div>
                <div style={{ fontWeight: '600' }}>
                  {match?.match_date ? new Date(match.match_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  }) : 'Date à confirmer'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🕐</span>
              <div>
                <div style={{ fontWeight: '600' }}>
                  {match?.match_time?.substring(0, 5) || 'Heure à confirmer'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontWeight: '600' }}>
                  {match?.clubs?.name || 'Lieu à confirmer'}
                </div>
                {match?.clubs?.address && (
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {match.clubs.address}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>👥</span>
              <div>
                <div style={{ fontWeight: '600' }}>
                  Équipe {invite.team || 'A'}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  Tu joueras avec {invite.profiles?.name || 'ton partenaire'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={acceptInvite}
            disabled={accepting}
            style={{
              width: '100%',
              padding: 18,
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: '600',
              cursor: accepting ? 'wait' : 'pointer',
              opacity: accepting ? 0.7 : 1
            }}
          >
            {accepting ? '⏳ Inscription...' : user ? '✅ Accepter l\'invitation' : '🚀 Créer un compte et accepter'}
          </button>

          {!user && (
            <p style={{ 
              fontSize: 13, 
              color: '#666', 
              textAlign: 'center',
              marginTop: 8
            }}>
              Tu n'as pas encore de compte ? Pas de souci !<br/>
              Tu pourras en créer un en 30 secondes.
            </p>
          )}

          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: 14,
              color: '#666',
              textDecoration: 'none',
              fontSize: 14
            }}
          >
            Non merci, plus tard
          </Link>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: '#999' }}>
            Invitation envoyée à <strong>{invite.invitee_name}</strong>
            <br />
            via {invite.invitee_contact}
          </div>
        </div>
      </div>
    </div>
  )
}