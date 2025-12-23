'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

export default function WelcomeModal({ profile, onClose }) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const isFounder = profile?.signup_number <= 100
  const isEarlyAdopter = profile?.signup_number <= 500
  const memberNumber = profile?.signup_number || '?'
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${profile?.referral_code}` : ''

  async function handleClose() {
    await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', profile.id)
    onClose()
  }

  async function copyReferralLink() {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `🎾 Je viens de rejoindre Junto, l'app pour organiser des parties de padel facilement ! Rejoins-moi :\n\n${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: COLORS.white, borderRadius: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto' }}>
        
        {step === 1 && (
          <div style={{ padding: 36, textAlign: 'center' }}>
            {isFounder && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.amberSoft, padding: '10px 22px', borderRadius: 100, marginBottom: 24 }}>
                <span style={{ fontSize: 18 }}>🏛️</span>
                <span style={{ fontWeight: 700, color: COLORS.amberDark, fontSize: 14 }}>MEMBRE FONDATEUR #{memberNumber}</span>
              </div>
            )}
            {!isFounder && isEarlyAdopter && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: COLORS.tealSoft, padding: '10px 22px', borderRadius: 100, marginBottom: 24 }}>
                <span style={{ fontSize: 18 }}>🌅</span>
                <span style={{ fontWeight: 700, color: COLORS.tealDark, fontSize: 14 }}>EARLY ADOPTER #{memberNumber}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {FOUR_DOTS.colors.map((c, i) => <div key={i} className="junto-dot" style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />)}
            </div>
            
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 14px', color: COLORS.ink, letterSpacing: -1 }}>Bienvenue sur Junto !</h1>
            <p style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.6, marginBottom: 28 }}>Tu fais partie des <strong style={{ color: COLORS.ink }}>tout premiers utilisateurs</strong>. Merci de nous faire confiance ! 🙏</p>

            {isFounder && (
              <div style={{ background: COLORS.primarySoft, borderRadius: 18, padding: 18, marginBottom: 28, border: `2px solid ${COLORS.primary}30` }}>
                <div style={{ fontSize: 15, color: COLORS.primary, fontWeight: 600 }}>🏛️ Tu as obtenu le badge "Fondateur" !</div>
                <div style={{ fontSize: 13, color: COLORS.primary, opacity: 0.8, marginTop: 4 }}>Ce badge exclusif restera sur ton profil pour toujours.</div>
              </div>
            )}

            <button onClick={() => setStep(2)} style={{ width: '100%', padding: 18, background: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Satoshi', sans-serif" }}>Continuer →</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px', color: COLORS.ink }}>Rejoins le mouvement !</h2>
            <p style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.6, marginBottom: 20 }}>Tu fais partie d'une <strong style={{ color: COLORS.teal }}>communauté de passionnés</strong> qui grandit chaque jour.</p>

            <div style={{ background: COLORS.tealSoft, borderRadius: 16, padding: 16, marginBottom: 20, border: `1px solid ${COLORS.teal}30` }}>
              <div style={{ fontSize: 13, color: COLORS.tealDark, fontWeight: 600 }}>🎾 Plus on sera nombreux, plus on trouvera de partenaires !</div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>🏅 Deviens ambassadeur :</h3>
              {[
                { emoji: '👥', text: 'Invite tes partenaires de padel habituels' },
                { emoji: '💡', text: 'Propose tes idées pour améliorer l\'app' },
                { emoji: '🎾', text: 'Organise ta première partie !' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? `1px solid ${COLORS.border}` : 'none' }}>
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  <span style={{ fontSize: 14, color: COLORS.dark }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 14, background: COLORS.bgSoft, color: COLORS.gray, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Retour</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, padding: 14, background: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Voir les badges →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: COLORS.ink }}>🎁 Invite et débloque des badges !</h2>
            <p style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.5, marginBottom: 20 }}>Plus tu invites, plus tu gagnes de badges exclusifs !</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 20 }}>
              {[
                { emoji: '🤲', count: '1', name: 'Parrain', bg: COLORS.tealSoft, border: COLORS.teal },
                { emoji: '📢', count: '5', name: 'Ambassadeur', bg: COLORS.amberSoft, border: COLORS.amber },
                { emoji: '🌟', count: '20', name: 'Super Star', bg: COLORS.primarySoft, border: COLORS.primary },
                { emoji: '🏆', count: '50', name: 'Légende', bg: '#f0f0ff', border: '#8b5cf6' }
              ].map((badge, i) => (
                <div key={i} style={{ flex: 1, background: badge.bg, borderRadius: 16, padding: '16px 8px', border: `2px solid ${badge.border}30` }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{badge.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.ink }}>{badge.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>{badge.count} invité{badge.count > 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>

            <div style={{ background: COLORS.bgSoft, borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray, display: 'block', marginBottom: 10 }}>Ton lien de parrainage</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: COLORS.white, border: `2px solid ${COLORS.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 12, color: COLORS.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{referralLink}</div>
                <button onClick={copyReferralLink} style={{ padding: '12px 18px', background: copied ? COLORS.teal : COLORS.ink, color: COLORS.white, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{copied ? '✓' : 'Copier'}</button>
              </div>
            </div>

            <button onClick={shareWhatsApp} style={{ width: '100%', padding: 16, background: '#25D366', color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>💬 Partager sur WhatsApp</button>

            <button onClick={handleClose} style={{ width: '100%', padding: 16, background: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Satoshi', sans-serif" }}>C'est parti ! 🎾</button>

            <button onClick={handleClose} style={{ marginTop: 14, background: 'none', border: 'none', color: COLORS.muted, fontSize: 13, cursor: 'pointer' }}>Passer pour l'instant</button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes junto-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); opacity: 0.8; } }
        .junto-dot { animation: junto-breathe 3s ease-in-out infinite; }
        .junto-dot:nth-child(1) { animation-delay: 0s; }
        .junto-dot:nth-child(2) { animation-delay: 0.15s; }
        .junto-dot:nth-child(3) { animation-delay: 0.3s; }
        .junto-dot:nth-child(4) { animation-delay: 0.45s; }
      `}</style>
    </div>
  )
}
