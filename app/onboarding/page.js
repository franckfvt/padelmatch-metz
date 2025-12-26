'use client'

/**
 * ============================================
 * PAGE ONBOARDING - 2×2 BRAND (OPTION A)
 * ============================================
 * 
 * Parcours de création de profil en 6 étapes
 * + Écran final avec carte joueur
 * 
 * Étapes :
 * 1. Niveau (2.0 à 7.0+)
 * 2. Position (Droite/Gauche/Polyvalent)
 * 3. Ambiance (Détente/Équilibré/Compétitif)
 * 4. Fréquence (1-2x/sem, etc.)
 * 5. Expérience (durée de pratique)
 * 6. Localisation (Région + Ville)
 * 7. Écran final - Carte prête
 * 
 * Design : Interface sobre + avatars carrés arrondis colorés
 * 
 * ============================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  // Players - LES SEULES COULEURS VIVES
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  // Soft versions
  p1Soft: '#fff0f0',
  p2Soft: '#fff8e5',
  p3Soft: '#e5f9f7',
  p4Soft: '#f0edff',
  
  // Interface sobre
  ink: '#1a1a1a',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // Backgrounds
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  cardDark: '#1a1a1a',
  
  // Borders
  border: '#e5e7eb',
  
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// === COMPOSANT: Les 4 points animés ===
function FourDots({ size = 12, gap = 6, animate = false }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          className={animate ? 'dot-breathe' : ''}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size > 10 ? 4 : '50%', 
            background: c,
            animationDelay: animate ? `${i * 0.15}s` : undefined
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Carte Joueur 2×2 pour l'écran final ===
function PlayerCardPreview({ player }) {
  const positionConfig = { 
    right: { emoji: '➡️', label: 'Droite' }, 
    left: { emoji: '⬅️', label: 'Gauche' }, 
    both: { emoji: '↔️', label: 'Polyvalent' } 
  }
  const ambianceConfig = {
    loisir: { emoji: '😌', label: 'Détente', color: COLORS.p3 },
    mix: { emoji: '⚡', label: 'Équilibré', color: COLORS.p2 },
    compet: { emoji: '🔥', label: 'Compétition', color: COLORS.p1 }
  }
  
  const position = positionConfig[player?.position] || positionConfig.both
  const ambiance = ambianceConfig[player?.ambiance] || ambianceConfig.mix
  const initial = player?.name?.[0]?.toUpperCase() || '?'
  const avatarColor = PLAYER_COLORS[player?.name?.charCodeAt(0) % 4] || COLORS.p1

  return (
    <div style={{
      width: 300,
      background: COLORS.cardDark,
      borderRadius: 28,
      padding: 32,
      textAlign: 'center',
      margin: '0 auto'
    }}>
      {/* Avatar carré arrondi */}
      <div style={{
        width: 90,
        height: 90,
        borderRadius: 22,
        background: player?.avatar_url ? `url(${player.avatar_url}) center/cover` : avatarColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
        fontWeight: 700,
        color: COLORS.white,
        margin: '0 auto 20px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
      }}>
        {!player?.avatar_url && initial}
      </div>

      {/* Nom */}
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.white, marginBottom: 6 }}>
        {player?.name || 'Joueur'}
      </div>
      
      {/* Ville */}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
        📍 {player?.city || 'France'}
      </div>

      {/* Niveau - Badge principal */}
      <div style={{
        display: 'inline-block',
        background: `${COLORS.p3}20`,
        border: `2px solid ${COLORS.p3}`,
        borderRadius: 18,
        padding: '16px 36px',
        marginBottom: 20
      }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: COLORS.p3, lineHeight: 1 }}>
          {player?.level || '?'}
        </div>
        <div style={{ fontSize: 10, color: COLORS.p3, marginTop: 6, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Niveau
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ 
          background: 'rgba(255,255,255,0.1)', 
          color: 'rgba(255,255,255,0.85)', 
          padding: '8px 14px', 
          borderRadius: 100, 
          fontSize: 13, 
          fontWeight: 600 
        }}>
          {position.emoji} {position.label}
        </span>
        <span style={{ 
          background: `${ambiance.color}30`, 
          color: ambiance.color, 
          padding: '8px 14px', 
          borderRadius: 100, 
          fontSize: 13, 
          fontWeight: 600 
        }}>
          {ambiance.emoji} {ambiance.label}
        </span>
      </div>

      {/* Logo 2×2 */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.white, letterSpacing: -0.5 }}>2×2</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {PLAYER_COLORS.map((c, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [existingProfile, setExistingProfile] = useState(null)
  
  const [profile, setProfile] = useState({
    level: '',
    position: '',
    ambiance: '',
    frequency: '',
    experience: '',
    region: '',
    city: ''
  })

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Pas connecté → redirection auth
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)

      // Récupérer le profil existant
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setExistingProfile(profileData)

      // Profil déjà complet → redirection
      if (profileData?.level && profileData?.position && profileData?.ambiance) {
        const redirectUrl = sessionStorage.getItem('redirectAfterOnboarding') || sessionStorage.getItem('redirectAfterLogin')
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterOnboarding')
          sessionStorage.removeItem('redirectAfterLogin')
          router.push(redirectUrl)
        } else {
          router.push('/dashboard')
        }
        return
      }

      // Pré-remplir avec les données existantes
      if (profileData) {
        setProfile({
          level: profileData.level?.toString() || '',
          position: profileData.position || '',
          ambiance: profileData.ambiance || '',
          frequency: profileData.frequency || '',
          experience: profileData.experience || '',
          region: profileData.region || '',
          city: profileData.city || ''
        })
      }
      
      setLoading(false)
    }
    checkUser()
  }, [router])

  // === SAUVEGARDE DU PROFIL ===
  async function saveProfile() {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({
        level: parseInt(profile.level),
        position: profile.position,
        ambiance: profile.ambiance,
        frequency: profile.frequency,
        experience: profile.experience,
        region: profile.region,
        city: profile.city
      }).eq('id', user.id)
      
      setStep(7) // Écran final
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
    } finally {
      setSaving(false)
    }
  }

  // === OPTIONS DES ÉTAPES ===
  const levelOptions = [
    { id: '2', label: '2.0', desc: 'Débutant' },
    { id: '3', label: '3.0', desc: 'Intermédiaire' },
    { id: '4', label: '4.0', desc: 'Confirmé' },
    { id: '5', label: '5.0', desc: 'Avancé' },
    { id: '6', label: '6.0', desc: 'Expert' },
    { id: '7', label: '7.0+', desc: 'Pro' }
  ]

  const positionOptions = [
    { id: 'right', emoji: '👉', label: 'Droite', desc: 'Je joue souvent à droite' },
    { id: 'left', emoji: '👈', label: 'Gauche', desc: 'Je préfère le côté gauche' },
    { id: 'both', emoji: '↔️', label: 'Les deux', desc: 'Je suis polyvalent' }
  ]

  const ambianceOptions = [
    { id: 'loisir', emoji: '😎', label: 'Détente', desc: 'On est là pour s\'amuser', color: COLORS.p3 },
    { id: 'mix', emoji: '⚡', label: 'Équilibré', desc: 'Fun mais on veut progresser', color: COLORS.p2 },
    { id: 'compet', emoji: '🏆', label: 'Compétitif', desc: 'On joue pour gagner', color: COLORS.p1 }
  ]

  const frequencyOptions = [
    { id: 'weekly', label: '1-2x/semaine' },
    { id: 'biweekly', label: '2-3x/mois' },
    { id: 'monthly', label: '1x/mois' },
    { id: 'occasionally', label: 'Occasionnel' }
  ]

  const experienceOptions = [
    { id: 'beginner', label: 'Moins de 6 mois' },
    { id: 'intermediate', label: '6 mois - 2 ans' },
    { id: 'experienced', label: '2-5 ans' },
    { id: 'veteran', label: 'Plus de 5 ans' }
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

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-dots">
            {PLAYER_COLORS.map((c, i) => (
              <div key={i} className="loading-dot" style={{ background: c, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="loading-text">Chargement...</div>
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${COLORS.bg};
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .loading-content { text-align: center; }
          .loading-dots { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
          .loading-dot {
            width: 16px;
            height: 16px;
            border-radius: 6px;
            animation: loadBounce 1.4s ease-in-out infinite;
          }
          .loading-text { color: ${COLORS.gray}; font-size: 14px; }
          @keyframes loadBounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-14px); }
          }
        `}</style>
      </div>
    )
  }

  // === ÉCRAN FINAL - CARTE PRÊTE ===
  if (step === 7) {
    return (
      <div className="final-screen">
        <div className="final-content">
          {/* Logo 2×2 */}
          <div className="final-logo">
            <FourDots size={14} gap={8} animate={true} />
          </div>
          
          <h1 className="final-title">Ta carte est prête !</h1>
          <p className="final-subtitle">Partage-la pour trouver des partenaires</p>

          {/* Carte joueur */}
          <div className="final-card">
            <PlayerCardPreview 
              player={{ 
                name: existingProfile?.name || 'Joueur', 
                level: profile.level, 
                position: profile.position, 
                ambiance: profile.ambiance, 
                avatar_url: existingProfile?.avatar_url,
                city: profile.city || existingProfile?.city
              }} 
            />
          </div>

          {/* Actions */}
          <div className="final-actions">
            <button 
              className="btn-white"
              onClick={() => { 
                navigator.clipboard.writeText(`${window.location.origin}/player/${user.id}`)
                alert('Lien copié !') 
              }}
            >
              📋 Copier le lien
            </button>
            <button 
              className="btn-primary"
              onClick={() => { 
                const url = sessionStorage.getItem('redirectAfterOnboarding') || '/dashboard'
                sessionStorage.removeItem('redirectAfterOnboarding')
                router.push(url) 
              }}
            >
              🎾 C'est parti !
            </button>
          </div>
        </div>

        <style jsx>{`
          .final-screen {
            min-height: 100vh;
            background: ${COLORS.cardDark};
            padding: 24px;
            font-family: 'Satoshi', -apple-system, sans-serif;
          }
          .final-content {
            max-width: 500px;
            margin: 0 auto;
            padding-top: 48px;
            text-align: center;
          }
          .final-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }
          .final-title {
            font-size: 32px;
            font-weight: 800;
            color: ${COLORS.white};
            margin: 0 0 10px;
          }
          .final-subtitle {
            color: rgba(255,255,255,0.6);
            margin: 0 0 36px;
            font-size: 16px;
          }
          .final-card {
            margin-bottom: 36px;
          }
          .final-actions {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .btn-white {
            padding: 18px;
            background: ${COLORS.white};
            color: ${COLORS.ink};
            border: none;
            border-radius: 100px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-primary {
            padding: 18px;
            background: ${COLORS.ink};
            color: ${COLORS.white};
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 100px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
        <style jsx global>{`
          @keyframes dot-breathe {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
          }
          .dot-breathe { animation: dot-breathe 3s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  // === COMPOSANTS D'OPTIONS ===
  function Option({ selected, onClick, emoji, label, desc, color }) {
    const bgColor = selected ? (color ? `${color}15` : COLORS.p1Soft) : COLORS.white
    const borderColor = selected ? (color || COLORS.p1) : COLORS.border
    
    return (
      <button onClick={onClick} className="option-btn" style={{
        background: bgColor,
        borderColor: borderColor
      }}>
        {emoji && <span className="option-emoji">{emoji}</span>}
        <div className="option-content">
          <div className="option-label">{label}</div>
          {desc && <div className="option-desc">{desc}</div>}
        </div>
        {selected && <span className="option-check" style={{ color: color || COLORS.p1 }}>✓</span>}
      </button>
    )
  }

  function LevelGrid() {
    return (
      <div className="level-grid">
        {levelOptions.map(opt => (
          <button 
            key={opt.id} 
            onClick={() => setProfile({ ...profile, level: opt.id })}
            className="level-btn"
            style={{
              background: profile.level === opt.id ? COLORS.p1Soft : COLORS.white,
              borderColor: profile.level === opt.id ? COLORS.p1 : COLORS.border
            }}
          >
            <div className="level-value" style={{ color: profile.level === opt.id ? COLORS.p1 : COLORS.ink }}>
              {opt.label}
            </div>
            <div className="level-desc">{opt.desc}</div>
          </button>
        ))}
      </div>
    )
  }

  // === CONFIGURATION DES ÉTAPES ===
  const steps = [
    { 
      title: 'Quel est ton niveau ?', 
      subtitle: 'Sur une échelle de 2 à 7+', 
      component: <LevelGrid />, 
      valid: !!profile.level 
    },
    { 
      title: 'Côté préféré ?', 
      subtitle: 'Position sur le terrain', 
      component: (
        <div className="options-list">
          {positionOptions.map(o => (
            <Option 
              key={o.id} 
              selected={profile.position === o.id} 
              onClick={() => setProfile({ ...profile, position: o.id })} 
              emoji={o.emoji} 
              label={o.label} 
              desc={o.desc} 
            />
          ))}
        </div>
      ), 
      valid: !!profile.position 
    },
    { 
      title: 'Quel style de jeu ?', 
      subtitle: 'L\'ambiance qui te correspond', 
      component: (
        <div className="options-list">
          {ambianceOptions.map(o => (
            <Option 
              key={o.id} 
              selected={profile.ambiance === o.id} 
              onClick={() => setProfile({ ...profile, ambiance: o.id })} 
              emoji={o.emoji} 
              label={o.label} 
              desc={o.desc} 
              color={o.color} 
            />
          ))}
        </div>
      ), 
      valid: !!profile.ambiance 
    },
    { 
      title: 'Tu joues souvent ?', 
      subtitle: 'Ta fréquence de jeu', 
      component: (
        <div className="options-grid">
          {frequencyOptions.map(o => (
            <Option 
              key={o.id} 
              selected={profile.frequency === o.id} 
              onClick={() => setProfile({ ...profile, frequency: o.id })} 
              label={o.label} 
            />
          ))}
        </div>
      ), 
      valid: !!profile.frequency 
    },
    { 
      title: 'Depuis combien de temps ?', 
      subtitle: 'Ton expérience au padel', 
      component: (
        <div className="options-grid">
          {experienceOptions.map(o => (
            <Option 
              key={o.id} 
              selected={profile.experience === o.id} 
              onClick={() => setProfile({ ...profile, experience: o.id })} 
              label={o.label} 
            />
          ))}
        </div>
      ), 
      valid: !!profile.experience 
    },
    { 
      title: 'Où joues-tu ?', 
      subtitle: 'Ta région et ville', 
      component: (
        <div className="location-selects">
          <select 
            value={profile.region} 
            onChange={e => setProfile({ ...profile, region: e.target.value, city: '' })}
            className="select-input"
          >
            <option value="">Sélectionne ta région</option>
            {Object.keys(regionsWithCities).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {profile.region && (
            <select 
              value={profile.city} 
              onChange={e => setProfile({ ...profile, city: e.target.value })}
              className="select-input"
            >
              <option value="">Sélectionne ta ville</option>
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      ), 
      valid: !!profile.region 
    }
  ]

  const currentStep = steps[step - 1]
  const isLastStep = step === steps.length

  // === RENDER PRINCIPAL ===
  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        
        {/* Header avec logo 2×2 */}
        <div className="onboarding-header">
          <FourDots size={12} gap={6} />
          <h1 className="header-title">Crée ton profil</h1>
        </div>

        {/* Barre de progression */}
        <div className="progress-bar">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className="progress-step"
              style={{ background: i < step ? COLORS.p1 : COLORS.border }}
            />
          ))}
        </div>

        {/* Question */}
        <div className="question-header">
          <h2 className="question-title">{currentStep.title}</h2>
          <p className="question-subtitle">{currentStep.subtitle}</p>
        </div>

        {/* Contenu de l'étape */}
        <div className="step-content">
          {currentStep.component}
        </div>

        {/* Boutons navigation */}
        <div className="nav-buttons">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-back">
              ← Retour
            </button>
          )}
          <button 
            onClick={() => isLastStep ? saveProfile() : setStep(step + 1)} 
            disabled={!currentStep.valid || saving}
            className="btn-next"
            style={{
              background: currentStep.valid ? COLORS.ink : COLORS.border,
              opacity: currentStep.valid ? 1 : 0.5,
              cursor: currentStep.valid ? 'pointer' : 'not-allowed'
            }}
          >
            {saving ? '...' : isLastStep ? 'Terminer ✓' : 'Continuer →'}
          </button>
        </div>

        {/* Indicateur d'étape */}
        <div className="step-indicator">
          Étape {step} sur {steps.length}
        </div>
      </div>

      {/* === STYLES === */}
      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          background: ${COLORS.bg};
          padding: 24px;
          font-family: 'Satoshi', -apple-system, sans-serif;
        }

        .onboarding-content {
          max-width: 500px;
          margin: 0 auto;
          padding-top: 32px;
        }

        /* Header */
        .onboarding-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .onboarding-header > :global(div) {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .header-title {
          font-size: 26px;
          font-weight: 800;
          color: ${COLORS.ink};
          margin: 0;
        }

        /* Progress */
        .progress-bar {
          display: flex;
          gap: 6px;
          margin-bottom: 36px;
        }

        .progress-step {
          flex: 1;
          height: 4px;
          border-radius: 100px;
          transition: background 0.3s;
        }

        /* Question */
        .question-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .question-title {
          font-size: 24px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin: 0 0 8px;
        }

        .question-subtitle {
          color: ${COLORS.gray};
          font-size: 15px;
          margin: 0;
        }

        /* Step content */
        .step-content {
          margin-bottom: 36px;
        }

        /* Navigation */
        .nav-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-back {
          flex: 1;
          padding: 16px;
          background: ${COLORS.bgSoft};
          color: ${COLORS.gray};
          border: 2px solid ${COLORS.border};
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-next {
          flex: 2;
          padding: 16px;
          color: ${COLORS.white};
          border: none;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .step-indicator {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: ${COLORS.muted};
        }

        /* Options list */
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* Level grid */
        .level-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .level-btn {
          padding: 18px;
          border: 2px solid;
          border-radius: 16px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .level-value {
          font-size: 24px;
          font-weight: 800;
        }

        .level-desc {
          font-size: 12px;
          color: ${COLORS.gray};
          margin-top: 4px;
        }

        /* Location selects */
        .location-selects {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .select-input {
          width: 100%;
          padding: 16px;
          border: 2px solid ${COLORS.border};
          border-radius: 14px;
          font-size: 15px;
          font-family: 'Satoshi', sans-serif;
          background: ${COLORS.white};
          cursor: pointer;
        }

        .select-input:focus {
          outline: none;
          border-color: ${COLORS.ink};
        }
      `}</style>

      <style jsx global>{`
        /* Option button */
        .option-btn {
          width: 100%;
          padding: 18px;
          border: 2px solid;
          border-radius: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
          transition: all 0.2s;
          font-family: 'Satoshi', sans-serif;
        }

        .option-emoji {
          font-size: 28px;
        }

        .option-content {
          flex: 1;
        }

        .option-label {
          font-weight: 700;
          color: ${COLORS.ink};
          font-size: 16px;
        }

        .option-desc {
          font-size: 13px;
          color: ${COLORS.gray};
          margin-top: 2px;
        }

        .option-check {
          font-size: 20px;
        }
      `}</style>
    </div>
  )
}