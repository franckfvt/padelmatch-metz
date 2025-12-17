'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  
  // Données du profil
  const [profile, setProfile] = useState({
    experience: '',
    frequency: '',
    ambiance: ''
  })

  // Vérifier que l'utilisateur est connecté
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth')
        return
      }
      
      setUser(session.user)
      
      // Vérifier si profil déjà complet
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('experience, ambiance')
        .eq('id', session.user.id)
        .single()
      
      if (existingProfile?.experience && existingProfile?.ambiance) {
        router.push('/dashboard')
        return
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [router])

  // Sauvegarder le profil
  async function saveProfile() {
    if (!user) return
    
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          experience: profile.experience,
          frequency: profile.frequency,
          ambiance: profile.ambiance
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  // Options pour chaque étape
  const experienceOptions = [
    { id: 'less6months', label: 'Moins de 6 mois', desc: 'Je découvre le padel', emoji: '🌱' },
    { id: '6months2years', label: '6 mois - 2 ans', desc: 'Je progresse bien', emoji: '📈' },
    { id: '2to5years', label: '2 - 5 ans', desc: 'Je maîtrise le jeu', emoji: '💪' },
    { id: 'more5years', label: 'Plus de 5 ans', desc: 'Joueur expérimenté', emoji: '🏆' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: 'Occasionnellement', desc: '1-2 fois par mois', emoji: '🗓️' },
    { id: 'regular', label: 'Régulièrement', desc: '1 fois par semaine', emoji: '📅' },
    { id: 'often', label: 'Souvent', desc: '2-3 fois par semaine', emoji: '🔥' },
    { id: 'intense', label: 'Intensément', desc: '4+ fois par semaine', emoji: '⚡' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', desc: 'Fun et convivial, sans prise de tête', emoji: '😎' },
    { id: 'mix', label: 'Équilibré', desc: 'Fun mais on joue bien quand même', emoji: '⚡' },
    { id: 'compet', label: 'Compétitif', desc: 'On est là pour gagner', emoji: '🏆' }
  ]

  // Affichage loading
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: '#666' }}>Chargement...</div>
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎾</div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a' }}>
            PadelMatch
          </h1>
        </div>

        {/* Carte principale */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          
          {/* Barre de progression */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <span style={{ fontSize: 13, color: '#999' }}>Étape {step}/3</span>
              <span style={{ fontSize: 13, color: '#999' }}>
                {step === 1 && 'Ton expérience'}
                {step === 2 && 'Ta fréquence'}
                {step === 3 && 'Ton ambiance'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: 8
            }}>
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: step >= s ? '#1a1a1a' : '#e5e5e5',
                    transition: 'background 0.3s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* ========== ÉTAPE 1 : EXPÉRIENCE ========== */}
          {step === 1 && (
            <>
              <h2 style={{ 
                fontSize: 26, 
                fontWeight: '700', 
                marginBottom: 8,
                color: '#1a1a1a'
              }}>
                Tu joues depuis combien de temps ?
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: 32,
                fontSize: 16,
                lineHeight: 1.5
              }}>
                Ça nous aide à te trouver des joueurs de ton niveau.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {experienceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, experience: opt.id })}
                    style={{
                      padding: '20px 24px',
                      border: profile.experience === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.experience === opt.id ? '#fafafa' : '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{opt.emoji}</div>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: 16,
                        color: '#1a1a1a',
                        marginBottom: 2
                      }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {opt.desc}
                      </div>
                    </div>
                    {profile.experience === opt.id && (
                      <div style={{ 
                        marginLeft: 'auto',
                        width: 24,
                        height: 24,
                        background: '#1a1a1a',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => profile.experience && setStep(2)}
                disabled={!profile.experience}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: profile.experience ? '#1a1a1a' : '#e5e5e5',
                  color: profile.experience ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: profile.experience ? 'pointer' : 'not-allowed',
                  marginTop: 32,
                  transition: 'background 0.2s'
                }}
              >
                Continuer
              </button>
            </>
          )}

          {/* ========== ÉTAPE 2 : FRÉQUENCE ========== */}
          {step === 2 && (
            <>
              <h2 style={{ 
                fontSize: 26, 
                fontWeight: '700', 
                marginBottom: 8,
                color: '#1a1a1a'
              }}>
                Tu joues à quelle fréquence ?
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: 32,
                fontSize: 16,
                lineHeight: 1.5
              }}>
                Pour te proposer le bon nombre de parties.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {frequencyOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, frequency: opt.id })}
                    style={{
                      padding: '20px 24px',
                      border: profile.frequency === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.frequency === opt.id ? '#fafafa' : '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}
                  >
                    <div style={{ fontSize: 28 }}>{opt.emoji}</div>
                    <div>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: 16,
                        color: '#1a1a1a',
                        marginBottom: 2
                      }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {opt.desc}
                      </div>
                    </div>
                    {profile.frequency === opt.id && (
                      <div style={{ 
                        marginLeft: 'auto',
                        width: 24,
                        height: 24,
                        background: '#1a1a1a',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 32 
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '18px 24px',
                    background: '#fff',
                    color: '#1a1a1a',
                    border: '2px solid #e5e5e5',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retour
                </button>
                <button
                  onClick={() => profile.frequency && setStep(3)}
                  disabled={!profile.frequency}
                  style={{
                    flex: 1,
                    padding: '18px',
                    background: profile.frequency ? '#1a1a1a' : '#e5e5e5',
                    color: profile.frequency ? '#fff' : '#999',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: profile.frequency ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s'
                  }}
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {/* ========== ÉTAPE 3 : AMBIANCE ========== */}
          {step === 3 && (
            <>
              <h2 style={{ 
                fontSize: 26, 
                fontWeight: '700', 
                marginBottom: 8,
                color: '#1a1a1a'
              }}>
                Quelle ambiance tu recherches ?
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: 32,
                fontSize: 16,
                lineHeight: 1.5
              }}>
                On te matche avec des joueurs qui veulent la même chose.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {ambianceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, ambiance: opt.id })}
                    style={{
                      padding: '24px',
                      border: profile.ambiance === opt.id 
                        ? '2px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.ambiance === opt.id ? '#fafafa' : '#fff',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{opt.emoji}</div>
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: 18,
                      color: '#1a1a1a',
                      marginBottom: 4
                    }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {opt.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'flex', 
                gap: 12, 
                marginTop: 32 
              }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '18px 24px',
                    background: '#fff',
                    color: '#1a1a1a',
                    border: '2px solid #e5e5e5',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retour
                </button>
                <button
                  onClick={saveProfile}
                  disabled={!profile.ambiance || saving}
                  style={{
                    flex: 1,
                    padding: '18px',
                    background: profile.ambiance && !saving ? '#2e7d32' : '#e5e5e5',
                    color: profile.ambiance && !saving ? '#fff' : '#999',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: profile.ambiance && !saving ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s'
                  }}
                >
                  {saving ? 'Enregistrement...' : 'C\'est parti ! 🎾'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Skip pour plus tard */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 24 
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Compléter plus tard
          </button>
        </div>
      </div>
    </div>
  )
}