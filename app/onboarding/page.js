'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PlayerCard from '@/app/components/PlayerCard'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [existingProfile, setExistingProfile] = useState(null)
  
  const [profile, setProfile] = useState({
    level: '', position: '', ambiance: '', frequency: '', experience: '', region: '', city: ''
  })

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setUser(session.user)

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setExistingProfile(profileData)

      if (profileData?.level && profileData?.position && profileData?.ambiance) {
        const redirectUrl = sessionStorage.getItem('redirectAfterOnboarding') || sessionStorage.getItem('redirectAfterLogin')
        if (redirectUrl) { sessionStorage.removeItem('redirectAfterOnboarding'); sessionStorage.removeItem('redirectAfterLogin'); router.push(redirectUrl) }
        else router.push('/dashboard')
        return
      }

      if (profileData) {
        setProfile({
          level: profileData.level?.toString() || '', position: profileData.position || '', ambiance: profileData.ambiance || '',
          frequency: profileData.frequency || '', experience: profileData.experience || '', region: profileData.region || '', city: profileData.city || ''
        })
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({
        level: parseInt(profile.level), position: profile.position, ambiance: profile.ambiance,
        frequency: profile.frequency, experience: profile.experience, region: profile.region, city: profile.city
      }).eq('id', user.id)
      setStep(7)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const levelOptions = [
    { id: '2', label: '2.0', desc: 'Débutant' }, { id: '3', label: '3.0', desc: 'Intermédiaire' },
    { id: '4', label: '4.0', desc: 'Confirmé' }, { id: '5', label: '5.0', desc: 'Avancé' },
    { id: '6', label: '6.0', desc: 'Expert' }, { id: '7', label: '7.0+', desc: 'Pro' }
  ]

  const positionOptions = [
    { id: 'right', emoji: '👉', label: 'Droite', desc: 'Je joue souvent à droite' },
    { id: 'left', emoji: '👈', label: 'Gauche', desc: 'Je préfère le côté gauche' },
    { id: 'both', emoji: '↔️', label: 'Les deux', desc: 'Je suis polyvalent' }
  ]

  const ambianceOptions = [
    { id: 'loisir', emoji: '😎', label: 'Détente', desc: 'On est là pour s\'amuser', color: COLORS.teal },
    { id: 'mix', emoji: '⚡', label: 'Équilibré', desc: 'Fun mais on veut progresser', color: COLORS.secondary },
    { id: 'compet', emoji: '🏆', label: 'Compétitif', desc: 'On joue pour gagner', color: COLORS.amber }
  ]

  const frequencyOptions = [
    { id: 'weekly', label: '1-2x/semaine' }, { id: 'biweekly', label: '2-3x/mois' },
    { id: 'monthly', label: '1x/mois' }, { id: 'occasionally', label: 'Occasionnel' }
  ]

  const experienceOptions = [
    { id: 'beginner', label: 'Moins de 6 mois' }, { id: 'intermediate', label: '6 mois - 2 ans' },
    { id: 'experienced', label: '2-5 ans' }, { id: 'veteran', label: 'Plus de 5 ans' }
  ]

  const regionsWithCities = {
    'Île-de-France': ['Paris', 'Boulogne', 'Levallois', 'Neuilly', 'Vincennes', 'Saint-Denis', 'Versailles', 'Nanterre'],
    'Hauts-de-France': ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Calais', 'Valenciennes'],
    'Grand Est': ['Strasbourg', 'Reims', 'Metz', 'Nancy', 'Mulhouse', 'Colmar', 'Troyes'],
    'Normandie': ['Rouen', 'Le Havre', 'Caen', 'Cherbourg', 'Évreux', 'Dieppe'],
    'Bretagne': ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Saint-Malo', 'Saint-Brieuc'],
    'Pays de la Loire': ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'La Roche-sur-Yon'],
    'Centre-Val de Loire': ['Tours', 'Orléans', 'Bourges', 'Blois', 'Chartres', 'Châteauroux'],
    'Bourgogne-Franche-Comté': ['Dijon', 'Besançon', 'Belfort', 'Chalon-sur-Saône', 'Auxerre'],
    'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'La Rochelle', 'Pau', 'Bayonne', 'Biarritz'],
    'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Tarbes'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand', 'Annecy', 'Valence'],
    'PACA': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Cannes', 'Antibes'],
    'Corse': ['Ajaccio', 'Bastia', 'Porto-Vecchio']
  }

  const cityOptions = profile.region ? regionsWithCities[profile.region] || [] : []

  // Loading Junto
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg, fontFamily: "'Satoshi', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            {FOUR_DOTS.colors.map((c, i) => <div key={i} className="junto-loading-dot" style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ color: COLORS.gray }}>Chargement...</div>
        </div>
        <style jsx global>{`
          @keyframes junto-loading { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-14px); } }
          .junto-loading-dot { animation: junto-loading 1.4s ease-in-out infinite; }
          .junto-loading-dot:nth-child(1) { animation-delay: 0s; }
          .junto-loading-dot:nth-child(2) { animation-delay: 0.1s; }
          .junto-loading-dot:nth-child(3) { animation-delay: 0.2s; }
          .junto-loading-dot:nth-child(4) { animation-delay: 0.3s; }
        `}</style>
      </div>
    )
  }

  // Étape finale - Carte prête
  if (step === 7) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.ink, padding: 24, fontFamily: "'Satoshi', sans-serif" }}>
        <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 48, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            {FOUR_DOTS.colors.map((c, i) => <div key={i} className="junto-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />)}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: COLORS.white, marginBottom: 10 }}>Ta carte est prête !</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, fontSize: 16 }}>Partage-la pour trouver des partenaires</p>

          <div style={{ marginBottom: 36 }}>
            <PlayerCard player={{ name: existingProfile?.name || 'Joueur', level: profile.level, position: profile.position, ambiance: profile.ambiance, avatar_url: existingProfile?.avatar_url }} standalone size="normal" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/player/${user.id}`); alert('Lien copié !') }} style={{ padding: 18, background: COLORS.white, color: COLORS.ink, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>📋 Copier le lien</button>
            <button onClick={() => { const url = sessionStorage.getItem('redirectAfterOnboarding') || '/dashboard'; sessionStorage.removeItem('redirectAfterOnboarding'); router.push(url) }} style={{ padding: 18, background: COLORS.primary, color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${COLORS.primaryGlow}` }}>🎾 C'est parti !</button>
          </div>
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

  // Composant Option
  function Option({ selected, onClick, emoji, label, desc, color }) {
    return (
      <button onClick={onClick} style={{
        width: '100%', padding: 18, background: selected ? (color ? `${color}15` : COLORS.primarySoft) : COLORS.white,
        border: `2px solid ${selected ? (color || COLORS.primary) : COLORS.border}`, borderRadius: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left'
      }}>
        {emoji && <span style={{ fontSize: 28 }}>{emoji}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: COLORS.ink, fontSize: 16 }}>{label}</div>
          {desc && <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 2 }}>{desc}</div>}
        </div>
        {selected && <span style={{ color: color || COLORS.primary, fontSize: 20 }}>✓</span>}
      </button>
    )
  }

  // Grille Level
  function LevelGrid() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {levelOptions.map(opt => (
          <button key={opt.id} onClick={() => setProfile({ ...profile, level: opt.id })} style={{
            padding: 18, background: profile.level === opt.id ? COLORS.primarySoft : COLORS.white,
            border: `2px solid ${profile.level === opt.id ? COLORS.primary : COLORS.border}`, borderRadius: 16,
            cursor: 'pointer', textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: profile.level === opt.id ? COLORS.primary : COLORS.ink }}>{opt.label}</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{opt.desc}</div>
          </button>
        ))}
      </div>
    )
  }

  const steps = [
    { title: 'Quel est ton niveau ?', subtitle: 'Sur une échelle de 2 à 7+', component: <LevelGrid />, valid: !!profile.level },
    { title: 'Côté préféré ?', subtitle: 'Position sur le terrain', component: <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{positionOptions.map(o => <Option key={o.id} selected={profile.position === o.id} onClick={() => setProfile({ ...profile, position: o.id })} emoji={o.emoji} label={o.label} desc={o.desc} />)}</div>, valid: !!profile.position },
    { title: 'Quel style de jeu ?', subtitle: 'L\'ambiance qui te correspond', component: <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{ambianceOptions.map(o => <Option key={o.id} selected={profile.ambiance === o.id} onClick={() => setProfile({ ...profile, ambiance: o.id })} emoji={o.emoji} label={o.label} desc={o.desc} color={o.color} />)}</div>, valid: !!profile.ambiance },
    { title: 'Tu joues souvent ?', subtitle: 'Ta fréquence de jeu', component: <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{frequencyOptions.map(o => <Option key={o.id} selected={profile.frequency === o.id} onClick={() => setProfile({ ...profile, frequency: o.id })} label={o.label} />)}</div>, valid: !!profile.frequency },
    { title: 'Depuis combien de temps ?', subtitle: 'Ton expérience au padel', component: <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{experienceOptions.map(o => <Option key={o.id} selected={profile.experience === o.id} onClick={() => setProfile({ ...profile, experience: o.id })} label={o.label} />)}</div>, valid: !!profile.experience },
    { title: 'Où joues-tu ?', subtitle: 'Ta région et ville', component: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <select value={profile.region} onChange={e => setProfile({ ...profile, region: e.target.value, city: '' })} style={{ width: '100%', padding: 16, border: `2px solid ${COLORS.border}`, borderRadius: 14, fontSize: 15, fontFamily: "'Satoshi', sans-serif" }}>
          <option value="">Sélectionne ta région</option>
          {Object.keys(regionsWithCities).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {profile.region && (
          <select value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} style={{ width: '100%', padding: 16, border: `2px solid ${COLORS.border}`, borderRadius: 14, fontSize: 15, fontFamily: "'Satoshi', sans-serif" }}>
            <option value="">Sélectionne ta ville</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
    ), valid: !!profile.region }
  ]

  const currentStep = steps[step - 1]
  const isLastStep = step === steps.length

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: 24, fontFamily: "'Satoshi', sans-serif" }}>
      <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 32 }}>
        
        {/* Logo Junto */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {FOUR_DOTS.colors.map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink }}>Crée ton profil</h1>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i < step ? COLORS.primary : COLORS.border }} />
          ))}
        </div>

        {/* Question */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>{currentStep.title}</h2>
          <p style={{ color: COLORS.gray, fontSize: 15 }}>{currentStep.subtitle}</p>
        </div>

        {/* Contenu */}
        {currentStep.component}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: 16, background: COLORS.bgSoft, color: COLORS.gray, border: `2px solid ${COLORS.border}`, borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Retour</button>
          )}
          <button onClick={() => isLastStep ? saveProfile() : setStep(step + 1)} disabled={!currentStep.valid || saving} style={{
            flex: 2, padding: 16, background: currentStep.valid ? COLORS.primary : COLORS.border,
            color: COLORS.white, border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700,
            cursor: currentStep.valid ? 'pointer' : 'not-allowed', opacity: currentStep.valid ? 1 : 0.5
          }}>{saving ? '...' : isLastStep ? 'Terminer ✓' : 'Continuer →'}</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, color: COLORS.muted }}>Étape {step} sur {steps.length}</span>
        </div>
      </div>
    </div>
  )
}
