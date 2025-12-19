'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

// Composant interne qui utilise useSearchParams
function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  
  // Redirection après onboarding (si l'user venait d'un lien de partie)
  const redirectTo = searchParams.get('redirect')

  // 4 étapes seulement : Nom, Niveau, Ambiance, Terminé
  const TOTAL_STEPS = 4

  const [formData, setFormData] = useState({
    name: '',
    level: '5', // Défaut au milieu
    ambiance: ''
  })

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', desc: 'Fun et convivial, sans prise de tête' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', desc: 'Fun mais on joue bien quand même' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', desc: 'On est là pour gagner !' }
  ]

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  // Descriptions de niveau pour aider l'utilisateur
  const levelDescriptions = {
    1: 'Débutant complet',
    2: 'Débutant',
    3: 'Débutant avancé',
    4: 'Intermédiaire',
    5: 'Intermédiaire',
    6: 'Intermédiaire avancé',
    7: 'Confirmé',
    8: 'Confirmé avancé',
    9: 'Expert',
    10: 'Pro / Compétiteur'
  }

  const levelCategories = {
    1: 'beginner', 2: 'beginner', 3: 'beginner',
    4: 'intermediate', 5: 'intermediate', 6: 'intermediate',
    7: 'advanced', 8: 'advanced',
    9: 'expert', 10: 'expert'
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth')
      return
    }

    setUser(session.user)

    // Vérifier si profil déjà complet
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, level, ambiance')
      .eq('id', session.user.id)
      .single()

    // Si déjà complet, aller au dashboard
    if (profile?.name && profile?.level && profile?.ambiance) {
      router.push(redirectTo || '/dashboard')
      return
    }

    // Pré-remplir avec les données existantes
    if (profile) {
      setFormData({
        name: profile.name || '',
        level: profile.level?.toString() || '5',
        ambiance: profile.ambiance || ''
      })
    }

    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          level: parseInt(formData.level),
          ambiance: formData.ambiance
        })
        .eq('id', user.id)

      if (error) throw error

      // Passer à l'étape finale (étape 4)
      setStep(4)
      setSaving(false)

    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  function nextStep() {
    // Validations
    if (step === 1 && !formData.name.trim()) {
      alert('Entre ton prénom')
      return
    }
    if (step === 2 && !formData.level) {
      alert('Sélectionne ton niveau')
      return
    }
    if (step === 3 && !formData.ambiance) {
      alert('Choisis ton ambiance de jeu')
      return
    }

    if (step === 3) {
      // Dernière étape avant la fin → sauvegarder
      saveProfile()
    } else {
      setStep(step + 1)
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1)
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function goToDashboard() {
    router.push(redirectTo || '/dashboard')
  }

  function goToCreateMatch() {
    router.push('/dashboard?create=true')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 20
    }}>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 40 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>🎾</div>
          <h1 style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            PadelMatch
          </h1>
        </div>

        {/* Indicateur d'étapes (seulement pour les 3 premières) */}
        {step < 4 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 8, 
              marginBottom: 8 
            }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: i <= step ? '#2e7d32' : '#e5e5e5',
                    transition: 'background 0.3s'
                  }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
              Étape {step}/3
            </div>
          </div>
        )}

        {/* === ÉTAPE 1: NOM === */}
        {step === 1 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>
              👋 Bienvenue !
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14, textAlign: 'center' }}>
              Comment tu t'appelles ?
            </p>

            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ton prénom"
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                fontSize: 18,
                border: '2px solid #e5e5e5',
                borderRadius: 12,
                outline: 'none',
                textAlign: 'center',
                fontWeight: '600'
              }}
              onKeyDown={(e) => e.key === 'Enter' && nextStep()}
            />

            <button
              onClick={nextStep}
              disabled={!formData.name.trim()}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '16px',
                background: formData.name.trim() ? '#2e7d32' : '#e5e5e5',
                color: formData.name.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: '600',
                cursor: formData.name.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* === ÉTAPE 2: NIVEAU === */}
        {step === 2 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>
              ⭐ Ton niveau
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14, textAlign: 'center' }}>
              Comment tu évalues ton niveau de padel ?
            </p>

            {/* Slider de niveau */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16
              }}>
                <span style={{ 
                  fontSize: 48, 
                  fontWeight: '700',
                  color: '#2e7d32'
                }}>
                  {formData.level}
                </span>
                <span style={{ fontSize: 24, color: '#999' }}>/10</span>
              </div>

              <input
                type="range"
                min="1"
                max="10"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  appearance: 'none',
                  background: `linear-gradient(to right, #2e7d32 0%, #2e7d32 ${(parseInt(formData.level) - 1) * 11.11}%, #e5e5e5 ${(parseInt(formData.level) - 1) * 11.11}%, #e5e5e5 100%)`,
                  cursor: 'pointer'
                }}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontSize: 11,
                color: '#999'
              }}>
                <span>Débutant</span>
                <span>Expert</span>
              </div>
            </div>

            {/* Description du niveau */}
            <div style={{
              background: '#f5f5f5',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              marginBottom: 24
            }}>
              <div style={{ fontSize: 14, color: '#666' }}>
                {levelDescriptions[parseInt(formData.level)]}
              </div>
            </div>

            {/* Aide */}
            <div style={{
              background: '#e8f5e9',
              borderRadius: 12,
              padding: 14,
              marginBottom: 24
            }}>
              <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: '600', marginBottom: 8 }}>
                💡 Repères
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                <strong>1-3</strong> : Débutant (moins d'1 an)<br/>
                <strong>4-5</strong> : Intermédiaire<br/>
                <strong>6-7</strong> : Confirmé (2+ ans, bon niveau)<br/>
                <strong>8-10</strong> : Expert / Compétition
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <button
                onClick={nextStep}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 3: AMBIANCE === */}
        {step === 3 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>
              🎯 Ton style de jeu
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14, textAlign: 'center' }}>
              Tu joues plutôt pour...
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {ambianceOptions.map(option => (
                <div
                  key={option.id}
                  onClick={() => setFormData({ ...formData, ambiance: option.id })}
                  style={{
                    padding: 16,
                    border: formData.ambiance === option.id ? '2px solid #2e7d32' : '2px solid #e5e5e5',
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: formData.ambiance === option.id ? '#e8f5e9' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 32 }}>{option.emoji}</div>
                  <div>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: '600',
                      color: formData.ambiance === option.id ? '#2e7d32' : '#1a1a1a'
                    }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                      {option.desc}
                    </div>
                  </div>
                  {formData.ambiance === option.id && (
                    <div style={{ marginLeft: 'auto', color: '#2e7d32', fontSize: 20 }}>✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.ambiance || saving}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: formData.ambiance && !saving ? '#2e7d32' : '#e5e5e5',
                  color: formData.ambiance && !saving ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: formData.ambiance && !saving ? 'pointer' : 'not-allowed'
                }}
              >
                {saving ? 'Création...' : 'Créer mon profil →'}
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 4: TERMINÉ ! === */}
        {step === 4 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: '700', margin: '0 0 8px' }}>
              Ton profil est créé !
            </h2>
            <p style={{ color: '#666', margin: '0 0 24px', fontSize: 14 }}>
              Voici ta carte de joueur PadelMatch
            </p>

            {/* Mini carte de profil */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
              borderRadius: 16,
              padding: 20,
              color: '#fff',
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>🎾</span>
                  <span style={{ fontSize: 12, fontWeight: '600', opacity: 0.8 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11
                }}>
                  ✅ 100% fiable
                </div>
              </div>

              <h3 style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                margin: '0 0 12px',
                letterSpacing: '-0.3px'
              }}>
                {formData.name}
              </h3>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '700'
                }}>
                  ⭐ {formData.level}/10
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '500'
                }}>
                  {ambianceEmojis[formData.ambiance]} {ambianceLabels[formData.ambiance]}
                </span>
              </div>
            </div>

            {/* Astuce */}
            <div style={{
              background: '#dbeafe',
              borderRadius: 12,
              padding: 14,
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <div style={{ fontSize: 13, color: '#1e40af' }}>
                💡 <strong>Astuce :</strong> Colle ton lien PadelMatch quand tu réponds sur les groupes Facebook. L'orga verra ton niveau direct !
              </div>
            </div>

            {/* Bouton copier le lien */}
            <button
              onClick={copyProfileLink}
              style={{
                width: '100%',
                padding: '16px',
                background: copied ? '#dcfce7' : '#f5f5f5',
                color: copied ? '#166534' : '#1a1a1a',
                border: copied ? '2px solid #22c55e' : '2px solid #e5e5e5',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12,
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier mon lien PadelMatch'}
            </button>

            {/* Séparateur */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '20px 0',
              color: '#999',
              fontSize: 13
            }}>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
              <span>Que veux-tu faire ?</span>
              <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
            </div>

            {/* Actions principales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={goToCreateMatch}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                🎾 Créer une partie
              </button>
              
              <button
                onClick={goToDashboard}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#fff',
                  color: '#666',
                  border: '2px solid #e5e5e5',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                🔍 Voir les parties disponibles
              </button>
            </div>

            {/* Lien vers compléter le profil */}
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => router.push('/dashboard/profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Compléter mon profil plus tard (photo, position...)
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Styles pour le slider */}
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #2e7d32;
          cursor: pointer;
          border: 4px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #2e7d32;
          cursor: pointer;
          border: 4px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

// Composant principal avec Suspense (requis par Next.js pour useSearchParams)
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}