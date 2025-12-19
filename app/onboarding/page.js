'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  // Étapes: 1-Nom, 2-Expérience, 3-Niveau, 4-Fréquence, 5-Ambiance, 6-Position, 7-Photo/Bio, 8-Preview

  const [formData, setFormData] = useState({
    name: '',
    experience: '',
    level: '',
    frequency: '',
    ambiance: '',
    position: '',
    bio: '',
    avatar_url: ''
  })

  const [copied, setCopied] = useState(false)
  const [showLevelHelp, setShowLevelHelp] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  const TOTAL_STEPS = 7 // Sans compter la preview

  // Labels
  const experienceOptions = [
    { id: 'less6months', label: 'Moins de 6 mois', emoji: '🌱', desc: 'Je découvre le padel' },
    { id: '6months2years', label: '6 mois - 2 ans', emoji: '📈', desc: 'Je progresse !' },
    { id: '2to5years', label: '2 - 5 ans', emoji: '💪', desc: 'Je maîtrise bien' },
    { id: 'more5years', label: 'Plus de 5 ans', emoji: '🏆', desc: 'Joueur expérimenté' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: '1-2x / mois', emoji: '🗓️', desc: 'Occasionnel' },
    { id: 'regular', label: '1x / semaine', emoji: '📅', desc: 'Régulier' },
    { id: 'often', label: '2-3x / semaine', emoji: '🔥', desc: 'Souvent' },
    { id: 'intense', label: '4x+ / semaine', emoji: '⚡', desc: 'Intensif' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', emoji: '😎', desc: 'Fun et convivial, sans prise de tête' },
    { id: 'mix', label: 'Équilibré', emoji: '⚡', desc: 'Fun mais on joue bien quand même' },
    { id: 'compet', label: 'Compétitif', emoji: '🏆', desc: 'On est là pour gagner !' }
  ]

  const positionOptions = [
    { id: 'right', label: 'Droite', emoji: '➡️', desc: 'Côté revers (le plus courant)' },
    { id: 'left', label: 'Gauche', emoji: '⬅️', desc: 'Côté coup droit' },
    { id: 'both', label: 'Les deux', emoji: '↔️', desc: 'Tu joues partout' }
  ]

  const positionLabels = {
    'left': 'Gauche',
    'right': 'Droite',
    'both': 'Les deux'
  }

  const ambianceLabels = {
    'loisir': 'Détente',
    'mix': 'Équilibré',
    'compet': 'Compétitif'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
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
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profile?.name && profile?.level && profile?.ambiance) {
      goToDestination()
      return
    }

    // Pré-remplir avec les données existantes
    setFormData({
      name: profile?.name || session.user.user_metadata?.name?.split(' ')[0] || '',
      experience: profile?.experience || '',
      level: profile?.level?.toString() || '',
      frequency: profile?.frequency || '',
      ambiance: profile?.ambiance || '',
      position: profile?.position || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    })

    setLoading(false)
  }

  function goToDestination() {
    const redirect = sessionStorage.getItem('redirectAfterOnboarding')
    if (redirect) {
      sessionStorage.removeItem('redirectAfterOnboarding')
      router.push(redirect)
    } else {
      router.push('/dashboard')
    }
  }

  async function saveProfile() {
    if (!formData.name || !formData.level || !formData.ambiance) {
      alert('Complète les informations obligatoires')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          experience: formData.experience || null,
          level: parseInt(formData.level),
          frequency: formData.frequency || null,
          ambiance: formData.ambiance,
          position: formData.position || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', user.id)

      if (error) throw error

      setStep(8) // Preview
      setSaving(false)

    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  function nextStep() {
    // Validations par étape
    if (step === 1 && !formData.name.trim()) {
      alert('Entre ton prénom')
      return
    }
    if (step === 2 && !formData.experience) {
      alert('Sélectionne ton expérience')
      return
    }
    if (step === 3 && !formData.level) {
      alert('Sélectionne ton niveau')
      return
    }
    // Étape 4 (fréquence) optionnelle
    if (step === 5 && !formData.ambiance) {
      alert('Choisis ton ambiance')
      return
    }
    // Étapes 6 et 7 optionnelles

    if (step === TOTAL_STEPS) {
      saveProfile()
    } else {
      setStep(step + 1)
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1)
  }

  function suggestLevel() {
    // Suggérer un niveau basé sur l'expérience
    const suggestions = {
      'less6months': '2',
      '6months2years': '4',
      '2to5years': '6',
      'more5years': '7'
    }
    if (formData.experience && suggestions[formData.experience]) {
      setFormData({ ...formData, level: suggestions[formData.experience] })
    }
    setShowLevelHelp(false)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Le fichier doit être une image')
      return
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image est trop grande (max 2MB)')
      return
    }

    setUploadingPhoto(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData({ ...formData, avatar_url: publicUrl })

    } catch (error) {
      console.error('Upload error:', error)
      alert('Erreur lors de l\'upload de la photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

        {/* Indicateur d'étapes */}
        {step <= TOTAL_STEPS && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 6, 
              marginBottom: 8 
            }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    background: i + 1 <= step ? '#1a1a1a' : '#e5e5e5',
                    transition: 'background 0.3s'
                  }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
              Étape {step}/{TOTAL_STEPS}
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
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Comment tu t'appelles ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              C'est le prénom que verront les autres joueurs
            </p>

            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ton prénom"
              autoFocus
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 12,
                border: '2px solid #eee',
                fontSize: 18,
                marginBottom: 20,
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={nextStep}
              disabled={!formData.name.trim()}
              style={{
                width: '100%',
                padding: 16,
                background: formData.name.trim() ? '#1a1a1a' : '#e5e5e5',
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

        {/* === ÉTAPE 2: EXPÉRIENCE === */}
        {step === 2 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Tu joues depuis combien de temps ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              Ça nous aide à estimer ton niveau
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {experienceOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, experience: opt.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: formData.experience === opt.id ? '#1a1a1a' : '#eee',
                    background: formData.experience === opt.id ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button
                onClick={nextStep}
                disabled={!formData.experience}
                style={{
                  ...continueButtonStyle,
                  background: formData.experience ? '#1a1a1a' : '#e5e5e5',
                  color: formData.experience ? '#fff' : '#999',
                  cursor: formData.experience ? 'pointer' : 'not-allowed'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 3: NIVEAU === */}
        {step === 3 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Quel est ton niveau ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 16px', fontSize: 14 }}>
              De 1 (débutant) à 10 (pro)
            </p>

            {/* Aide niveau */}
            {!showLevelHelp ? (
              <button
                onClick={() => setShowLevelHelp(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 12,
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: 16
                }}
              >
                💡 Je ne sais pas quel niveau choisir
              </button>
            ) : (
              <div style={{
                background: '#eff6ff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 8 }}>
                  💡 Guide rapide
                </div>
                <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                  <div><strong>1-2</strong> : Débutant, j'apprends les règles</div>
                  <div><strong>3-4</strong> : Je sais jouer, je progresse</div>
                  <div><strong>5-6</strong> : Bon niveau, matchs équilibrés</div>
                  <div><strong>7-8</strong> : Très bon, je fais des tournois</div>
                  <div><strong>9-10</strong> : Excellent, niveau compétition</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={suggestLevel}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: '#1e40af',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Suggérer selon mon expérience
                  </button>
                  <button
                    onClick={() => setShowLevelHelp(false)}
                    style={{
                      padding: 10,
                      background: '#fff',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Échelle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#999' }}>
              <span>Débutant</span>
              <span>Pro</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, level: level.toString() })}
                  style={{
                    padding: '16px 0',
                    borderRadius: 10,
                    border: '2px solid',
                    borderColor: formData.level === level.toString() ? '#1a1a1a' : '#eee',
                    background: formData.level === level.toString() ? '#1a1a1a' : '#fff',
                    color: formData.level === level.toString() ? '#fff' : '#666',
                    fontSize: 18,
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button
                onClick={nextStep}
                disabled={!formData.level}
                style={{
                  ...continueButtonStyle,
                  background: formData.level ? '#1a1a1a' : '#e5e5e5',
                  color: formData.level ? '#fff' : '#999',
                  cursor: formData.level ? 'pointer' : 'not-allowed'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 4: FRÉQUENCE === */}
        {step === 4 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Tu joues combien de fois par semaine ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              Optionnel - aide à trouver des joueurs similaires
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {frequencyOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, frequency: opt.id })}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: formData.frequency === opt.id ? '#1a1a1a' : '#eee',
                    background: formData.frequency === opt.id ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{opt.emoji}</div>
                  <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 14 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button onClick={nextStep} style={continueButtonStyle}>
                {formData.frequency ? 'Continuer →' : 'Passer →'}
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 5: AMBIANCE === */}
        {step === 5 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Quelle ambiance tu recherches ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              Pour te matcher avec des joueurs qui partagent ta vision
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {ambianceOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, ambiance: opt.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: formData.ambiance === opt.id ? '#1a1a1a' : '#eee',
                    background: formData.ambiance === opt.id ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 32 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: 16 }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button
                onClick={nextStep}
                disabled={!formData.ambiance}
                style={{
                  ...continueButtonStyle,
                  background: formData.ambiance ? '#1a1a1a' : '#e5e5e5',
                  color: formData.ambiance ? '#fff' : '#999',
                  cursor: formData.ambiance ? 'pointer' : 'not-allowed'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 6: POSITION === */}
        {step === 6 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Ta position préférée ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              Optionnel - tu peux changer plus tard
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {positionOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, position: opt.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: formData.position === opt.id ? '#1a1a1a' : '#eee',
                    background: formData.position === opt.id ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button onClick={nextStep} style={continueButtonStyle}>
                {formData.position ? 'Continuer →' : 'Passer →'}
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 7: PHOTO + BIO === */}
        {step === 7 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Personnalise ton profil
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              Optionnel - rends ta carte unique !
            </p>

            {/* Photo */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#1a1a1a' }}>
                📸 Photo de profil
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: formData.avatar_url ? `url(${formData.avatar_url}) center/cover` : '#f5f5f5',
                    border: '2px dashed #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 28,
                    color: '#999'
                  }}
                >
                  {!formData.avatar_url && (uploadingPhoto ? '...' : '+')}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    style={{
                      padding: '10px 16px',
                      background: '#f5f5f5',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    {uploadingPhoto ? 'Upload...' : formData.avatar_url ? 'Changer' : 'Ajouter une photo'}
                  </button>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    Max 2MB, JPG ou PNG
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#1a1a1a' }}>
                ✏️ Une petite phrase sur toi
              </div>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Ex: Dispo le weekend, je joue pour le fun !"
                maxLength={100}
                rows={2}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 10,
                  border: '2px solid #eee',
                  fontSize: 15,
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: 12, color: '#999', textAlign: 'right' }}>
                {formData.bio.length}/100
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={prevStep} style={backButtonStyle}>←</button>
              <button
                onClick={nextStep}
                disabled={saving}
                style={{
                  ...continueButtonStyle,
                  background: saving ? '#ccc' : '#1a1a1a'
                }}
              >
                {saving ? 'Création...' : 'Créer mon profil 🎾'}
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 8: PREVIEW CARTE === */}
        {step === 8 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 4px' }}>
                Bienvenue {formData.name} !
              </h2>
              <p style={{ color: '#666', margin: 0 }}>
                Voici ta carte de joueur
              </p>
            </div>

            {/* La carte - Design chaleureux */}
            <div style={{
              background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
              borderRadius: 24,
              padding: 24,
              color: '#fff',
              marginBottom: 20,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              {/* Header carte */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🎾</span>
                  <span style={{ fontSize: 12, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11
                }}>
                  ✅ 100%
                </div>
              </div>

              {/* Photo + Nom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid rgba(255,255,255,0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28
                  }}>
                    👤
                  </div>
                )}
                <div>
                  <h2 style={{ 
                    fontSize: 26, 
                    fontWeight: '700', 
                    margin: 0,
                    letterSpacing: '-0.5px'
                  }}>
                    {formData.name}
                  </h2>
                  {formData.bio && (
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                      "{formData.bio}"
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: '700'
                }}>
                  ⭐ {formData.level}/10
                </span>
                {formData.ambiance && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 14
                  }}>
                    {ambianceEmojis[formData.ambiance]} {ambianceLabels[formData.ambiance]}
                  </span>
                )}
                {formData.position && (
                  <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 14
                  }}>
                    🎾 {positionLabels[formData.position]}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: '700' }}>0</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>parties</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: '700' }}>0%</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>victoires</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: '700', color: '#fbbf24' }}>🔥0</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>série</div>
                </div>
              </div>
            </div>

            {/* Explication carte */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#166534', marginBottom: 4 }}>
                ✨ Ta carte se met à jour automatiquement
              </div>
              <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                Après chaque partie, tes stats (victoires, série) se mettent à jour. Plus tu joues, plus ta carte reflète ton vrai niveau !
              </div>
            </div>

            {/* Copier lien */}
            <button
              onClick={copyProfileLink}
              style={{
                width: '100%',
                padding: 14,
                background: copied ? '#dcfce7' : '#f5f5f5',
                color: copied ? '#166534' : '#1a1a1a',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien de ma carte'}
            </button>

            {/* Astuce Facebook */}
            <div style={{
              background: '#eff6ff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 4 }}>
                💡 Astuce Facebook
              </div>
              <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                Colle ton lien quand tu réponds à "Cherche joueurs". L'orga voit direct ton niveau !
              </div>
            </div>

            {/* Actions finales */}
            <button
              onClick={goToDestination}
              style={{
                width: '100%',
                padding: 18,
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎾 Trouver des joueurs
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// Styles réutilisables
const backButtonStyle = {
  padding: 16,
  background: '#f5f5f5',
  color: '#666',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: '600',
  cursor: 'pointer'
}

const continueButtonStyle = {
  flex: 1,
  padding: 16,
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: '600',
  cursor: 'pointer'
}