'use client'

/**
 * ============================================
 * COMPOSANT: WelcomeModal
 * ============================================
 * 
 * Popup de bienvenue pour les early adopters
 * Affiché une seule fois à la première connexion
 * 
 * ============================================
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function WelcomeModal({ profile, onClose }) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const isFounder = profile?.signup_number <= 100
  const isEarlyAdopter = profile?.signup_number <= 500
  const memberNumber = profile?.signup_number || '?'
  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join?ref=${profile?.referral_code}` 
    : ''

  async function handleClose() {
    // Marquer comme vu
    await supabase
      .from('profiles')
      .update({ has_seen_welcome: true })
      .eq('id', profile.id)
    
    onClose()
  }

  async function copyReferralLink() {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `🎾 Je viens de rejoindre PadelMatch, l'app pour organiser des parties de padel facilement ! Rejoins-moi :\n\n${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 420,
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Step 1: Bienvenue */}
        {step === 1 && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            {/* Badge Fondateur */}
            {isFounder && (
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                padding: '8px 20px',
                borderRadius: 20,
                marginBottom: 20
              }}>
                <span style={{ fontSize: 16 }}>🏛️</span>
                <span style={{ 
                  marginLeft: 8, 
                  fontWeight: 700, 
                  color: '#92400e',
                  fontSize: 14
                }}>
                  MEMBRE FONDATEUR #{memberNumber}
                </span>
              </div>
            )}

            {!isFounder && isEarlyAdopter && (
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                padding: '8px 20px',
                borderRadius: 20,
                marginBottom: 20
              }}>
                <span style={{ fontSize: 16 }}>🌅</span>
                <span style={{ 
                  marginLeft: 8, 
                  fontWeight: 700, 
                  color: '#1e40af',
                  fontSize: 14
                }}>
                  EARLY ADOPTER #{memberNumber}
                </span>
              </div>
            )}

            <div style={{ fontSize: 56, marginBottom: 16 }}>🎾</div>
            
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 800, 
              margin: '0 0 12px',
              color: '#1a1a2e'
            }}>
              Bienvenue sur PadelMatch !
            </h1>
            
            <p style={{ 
              fontSize: 16, 
              color: '#64748b', 
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              Tu fais partie des <strong style={{ color: '#1a1a2e' }}>tout premiers utilisateurs</strong> de l'app. 
              Merci de nous faire confiance ! 🙏
            </p>

            {isFounder && (
              <div style={{
                background: '#f0fdf4',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: 14, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                  🏛️ Tu as obtenu le badge "Fondateur" !
                </div>
                <div style={{ fontSize: 13, color: '#15803d' }}>
                  Ce badge exclusif restera sur ton profil pour toujours.
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: 16,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2: L'app a besoin de toi */}
        {step === 2 && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              margin: '0 0 12px',
              color: '#1a1a2e'
            }}>
              L'app a besoin de toi !
            </h2>
            
            <p style={{ 
              fontSize: 15, 
              color: '#64748b', 
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              PadelMatch est tout nouveau et <strong style={{ color: '#1a1a2e' }}>plus on sera nombreux, plus l'app sera utile</strong> pour trouver des parties et des partenaires.
            </p>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 12 }}>
                Comment tu peux aider :
              </h3>
              
              {[
                { emoji: '👥', text: 'Invite tes partenaires de padel à rejoindre l\'app' },
                { emoji: '🏟️', text: 'Ajoute les clubs où tu joues' },
                { emoji: '💬', text: 'Ajoute les groupes WhatsApp que tu connais' },
                { emoji: '💡', text: 'Partage tes idées dans la boîte à idées' },
                { emoji: '🎾', text: 'Crée et organise des parties !' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <span style={{ fontSize: 14, color: '#475569' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 2,
                  padding: 14,
                  background: '#1a1a2e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Parrainage */}
        {step === 3 && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
            
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              margin: '0 0 12px',
              color: '#1a1a2e'
            }}>
              Invite tes amis !
            </h2>
            
            <p style={{ 
              fontSize: 15, 
              color: '#64748b', 
              lineHeight: 1.6,
              marginBottom: 20
            }}>
              Chaque personne qui rejoint grâce à toi te rapproche de <strong style={{ color: '#1a1a2e' }}>nouveaux badges</strong> et d'un réseau de padel plus grand !
            </p>

            {/* Badges de parrainage */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 20
            }}>
              {[
                { emoji: '🤲', label: '1 invité', name: 'Parrain' },
                { emoji: '📢', label: '5 invités', name: 'Ambassadeur' },
                { emoji: '🌟', label: '20 invités', name: 'Super' },
                { emoji: '🏆', label: '50 invités', name: 'Légende' }
              ].map((badge, i) => (
                <div key={i} style={{
                  background: '#f8fafc',
                  borderRadius: 12,
                  padding: '12px 8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{badge.emoji}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{badge.label}</div>
                </div>
              ))}
            </div>

            {/* Lien de parrainage */}
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                Ton lien de parrainage
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {referralLink}
                </div>
                <button
                  onClick={copyReferralLink}
                  style={{
                    padding: '10px 14px',
                    background: copied ? '#22c55e' : '#1a1a2e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Bouton WhatsApp */}
            <button
              onClick={shareWhatsApp}
              style={{
                width: '100%',
                padding: 14,
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              💬 Partager sur WhatsApp
            </button>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: 14,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              C'est parti ! 🎾
            </button>

            <button
              onClick={handleClose}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Passer pour l'instant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}