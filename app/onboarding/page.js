'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PlayerCard from '@/app/components/PlayerCard'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [existingProfile, setExistingProfile] = useState(null)
  
  // Données du profil - étendues
  const [profile, setProfile] = useState({
    level: '',
    position: '',
    ambiance: '',
    frequency: '',
    experience: '',
    region: '',
    city: ''
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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setExistingProfile(profileData)
      
      // Si profil complet, rediriger
      if (profileData?.level && profileData?.position && profileData?.ambiance) {
        // Vérifier s'il y a un redirect en attente
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
      
      // Pré-remplir si données existantes
      if (profileData) {
        setProfile({
          level: profileData.level?.toString() || '',
          position: profileData.position || '',
          ambiance: profileData.ambiance || '',
          frequency: profileData.frequency || '',
          experience: profileData.experience || '',
          region: profileData.region || ''
        })
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
          level: parseInt(profile.level),
          position: profile.position,
          ambiance: profile.ambiance,
          frequency: profile.frequency,
          experience: profile.experience,
          region: profile.region,
          city: profile.city
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      // Aller à l'étape carte
      setStep(7)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  // Options
  const levelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const positionOptions = [
    { id: 'right', label: 'Droite', desc: 'Côté revers (droitier)', emoji: '👉' },
    { id: 'left', label: 'Gauche', desc: 'Côté coup droit (droitier)', emoji: '👈' },
    { id: 'both', label: 'Polyvalent', desc: 'Je joue des deux côtés', emoji: '↔️' }
  ]

  const ambianceOptions = [
    { id: 'loisir', label: 'Détente', desc: 'Fun et convivial, sans prise de tête', emoji: '😎' },
    { id: 'progression', label: 'Progresser', desc: 'Je veux m\'améliorer', emoji: '📈' },
    { id: 'compet', label: 'Compétitif', desc: 'On est là pour gagner', emoji: '🏆' }
  ]

  const frequencyOptions = [
    { id: 'occasional', label: 'Occasionnellement', desc: '1-2 fois par mois', emoji: '🗓️' },
    { id: 'regular', label: 'Régulièrement', desc: '1 fois par semaine', emoji: '📅' },
    { id: 'often', label: 'Souvent', desc: '2-3 fois par semaine', emoji: '🔥' },
    { id: 'intense', label: 'Intensément', desc: '4+ fois par semaine', emoji: '⚡' }
  ]

  const experienceOptions = [
    { id: 'less6months', label: 'Moins de 6 mois', desc: 'Je découvre le padel', emoji: '🌱' },
    { id: '6months2years', label: '6 mois - 2 ans', desc: 'Je progresse bien', emoji: '📈' },
    { id: '2to5years', label: '2 - 5 ans', desc: 'Je maîtrise le jeu', emoji: '💪' },
    { id: 'more5years', label: 'Plus de 5 ans', desc: 'Joueur expérimenté', emoji: '🏆' }
  ]

  // Régions et villes principales
  const regionsWithCities = {
    'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Versailles', 'Nanterre', 'Créteil', 'Argenteuil', 'Montreuil'],
    'Hauts-de-France': ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Valenciennes', 'Lens', 'Calais'],
    'Grand Est': ['Strasbourg', 'Reims', 'Metz', 'Mulhouse', 'Nancy', 'Colmar', 'Troyes', 'Charleville-Mézières'],
    'Normandie': ['Rouen', 'Le Havre', 'Caen', 'Cherbourg', 'Évreux', 'Dieppe', 'Alençon'],
    'Bretagne': ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Saint-Malo', 'Saint-Brieuc'],
    'Pays de la Loire': ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'La Roche-sur-Yon', 'Cholet', 'Laval'],
    'Centre-Val de Loire': ['Tours', 'Orléans', 'Bourges', 'Blois', 'Chartres', 'Châteauroux', 'Dreux'],
    'Bourgogne-Franche-Comté': ['Dijon', 'Besançon', 'Belfort', 'Chalon-sur-Saône', 'Auxerre', 'Mâcon', 'Nevers'],
    'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'La Rochelle', 'Pau', 'Bayonne', 'Angoulême', 'Biarritz'],
    'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Tarbes', 'Albi', 'Carcassonne'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy', 'Valence', 'Chambéry'],
    'PACA': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Cannes', 'Antibes', 'Fréjus'],
    'Corse': ['Ajaccio', 'Bastia', 'Porto-Vecchio', 'Corte', 'Calvi']
  }

  const regionOptions = Object.keys(regionsWithCities).map(r => ({ id: r, label: r }))
  const cityOptions = profile.region ? regionsWithCities[profile.region] || [] : []

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

  // Étape finale : afficher la carte
  if (step === 7) {
    const playerData = {
      name: existingProfile?.name || 'Joueur',
      level: profile.level,
      position: profile.position,
      ambiance: profile.ambiance,
      frequency: profile.frequency,
      experience: profile.experience,
      region: profile.region,
      avatar_url: existingProfile?.avatar_url
    }

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: 500,
          margin: '0 auto',
          paddingTop: 40,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: 8
          }}>
            Ta carte est prête !
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.6)', 
            marginBottom: 32,
            fontSize: 16
          }}>
            Partage-la sur Facebook pour trouver des partenaires
          </p>

          {/* La carte */}
          <div style={{ marginBottom: 32 }}>
            <PlayerCard player={playerData} standalone size="normal" />
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => {
                const link = `${window.location.origin}/player/${user.id}`
                navigator.clipboard.writeText(link)
                alert('Lien copié ! Partage-le sur Facebook 🎾')
              }}
              style={{
                padding: '18px',
                background: '#1877f2',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              📋 Copier le lien de ma carte
            </button>
            
            <button
              onClick={() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterOnboarding') || sessionStorage.getItem('redirectAfterLogin')
                if (redirectUrl) {
                  sessionStorage.removeItem('redirectAfterOnboarding')
                  sessionStorage.removeItem('redirectAfterLogin')
                  router.push(redirectUrl)
                } else {
                  router.push('/dashboard')
                }
              }}
              style={{
                padding: '18px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎾 Aller au dashboard
            </button>
          </div>
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
              <span style={{ fontSize: 13, color: '#999' }}>Étape {step}/6</span>
              <span style={{ fontSize: 13, color: '#999' }}>
                {step === 1 && 'Ton niveau'}
                {step === 2 && 'Ton poste'}
                {step === 3 && 'Ton ambiance'}
                {step === 4 && 'Ta fréquence'}
                {step === 5 && 'Ton expérience'}
                {step === 6 && 'Ta région'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5, 6].map(s => (
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

          {/* ========== ÉTAPE 1 : NIVEAU ========== */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Quel est ton niveau ?
              </h2>
              <p style={{ color: '#666', marginBottom: 20, fontSize: 15, lineHeight: 1.5 }}>
                Un niveau précis permet de trouver des partenaires adaptés.
              </p>

              {/* Aide niveau */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: 14,
                marginBottom: 24,
                fontSize: 13,
                color: '#166534'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>💡 Repères :</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  <span><strong>1-2</strong> : Débutant</span>
                  <span><strong>3-4</strong> : Intermédiaire</span>
                  <span><strong>5-6</strong> : Confirmé</span>
                  <span><strong>7-8</strong> : Avancé</span>
                  <span><strong>9-10</strong> : Compétiteur/Pro</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {levelOptions.map(lvl => (
                  <div
                    key={lvl}
                    onClick={() => setProfile({ ...profile, level: lvl.toString() })}
                    style={{
                      aspectRatio: '1',
                      border: profile.level === lvl.toString()
                        ? '3px solid #1a1a1a' 
                        : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.level === lvl.toString() ? '#f5f5f5' : '#fff',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: '700',
                      color: profile.level === lvl.toString() ? '#1a1a1a' : '#666'
                    }}
                  >
                    {lvl}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  <strong>Guide rapide :</strong><br/>
                  1-2 : Débutant • 3-4 : Intermédiaire<br/>
                  5-6 : Confirmé • 7-8 : Expert • 9-10 : Pro
                </div>
              </div>

              <button
                onClick={() => profile.level && setStep(2)}
                disabled={!profile.level}
                style={{
                  width: '100%',
                  marginTop: 32,
                  padding: '18px',
                  background: profile.level ? '#1a1a1a' : '#e5e5e5',
                  color: profile.level ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: profile.level ? 'pointer' : 'not-allowed'
                }}
              >
                Continuer
              </button>
            </>
          )}

          {/* ========== ÉTAPE 2 : POSITION ========== */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Tu joues de quel côté ?
              </h2>
              <p style={{ color: '#666', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
                C'est souvent la première question qu'on pose !
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {positionOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, position: opt.id })}
                    style={{
                      padding: '24px',
                      border: profile.position === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.position === opt.id ? '#fafafa' : '#fff',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{opt.emoji}</div>
                    <div style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a', marginBottom: 4 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(1)} style={{
                  padding: '18px 24px', background: '#fff', color: '#1a1a1a',
                  border: '2px solid #e5e5e5', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
                }}>
                  Retour
                </button>
                <button
                  onClick={() => profile.position && setStep(3)}
                  disabled={!profile.position}
                  style={{
                    flex: 1, padding: '18px',
                    background: profile.position ? '#1a1a1a' : '#e5e5e5',
                    color: profile.position ? '#fff' : '#999',
                    border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600',
                    cursor: profile.position ? 'pointer' : 'not-allowed'
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
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Quelle ambiance tu recherches ?
              </h2>
              <p style={{ color: '#666', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
                On te matche avec des joueurs qui veulent la même chose.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {ambianceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, ambiance: opt.id })}
                    style={{
                      padding: '24px',
                      border: profile.ambiance === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
                      borderRadius: 16,
                      cursor: 'pointer',
                      background: profile.ambiance === opt.id ? '#fafafa' : '#fff',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{opt.emoji}</div>
                    <div style={{ fontWeight: '700', fontSize: 18, color: '#1a1a1a', marginBottom: 4 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>{opt.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(2)} style={{
                  padding: '18px 24px', background: '#fff', color: '#1a1a1a',
                  border: '2px solid #e5e5e5', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
                }}>
                  Retour
                </button>
                <button
                  onClick={() => profile.ambiance && setStep(4)}
                  disabled={!profile.ambiance}
                  style={{
                    flex: 1, padding: '18px',
                    background: profile.ambiance ? '#1a1a1a' : '#e5e5e5',
                    color: profile.ambiance ? '#fff' : '#999',
                    border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600',
                    cursor: profile.ambiance ? 'pointer' : 'not-allowed'
                  }}
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {/* ========== ÉTAPE 4 : FRÉQUENCE ========== */}
          {step === 4 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Tu joues à quelle fréquence ?
              </h2>
              <p style={{ color: '#666', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
                Pour te proposer le bon nombre de parties.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {frequencyOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, frequency: opt.id })}
                    style={{
                      padding: '20px 24px',
                      border: profile.frequency === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
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
                      <div style={{ fontWeight: '600', fontSize: 16, color: '#1a1a1a', marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(3)} style={{
                  padding: '18px 24px', background: '#fff', color: '#1a1a1a',
                  border: '2px solid #e5e5e5', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
                }}>
                  Retour
                </button>
                <button
                  onClick={() => profile.frequency && setStep(5)}
                  disabled={!profile.frequency}
                  style={{
                    flex: 1, padding: '18px',
                    background: profile.frequency ? '#1a1a1a' : '#e5e5e5',
                    color: profile.frequency ? '#fff' : '#999',
                    border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600',
                    cursor: profile.frequency ? 'pointer' : 'not-allowed'
                  }}
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {/* ========== ÉTAPE 5 : EXPÉRIENCE ========== */}
          {step === 5 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Tu joues depuis combien de temps ?
              </h2>
              <p style={{ color: '#666', marginBottom: 32, fontSize: 16, lineHeight: 1.5 }}>
                Ça aide à comprendre ton parcours.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {experienceOptions.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setProfile({ ...profile, experience: opt.id })}
                    style={{
                      padding: '20px 24px',
                      border: profile.experience === opt.id ? '2px solid #1a1a1a' : '2px solid #e5e5e5',
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
                      <div style={{ fontWeight: '600', fontSize: 16, color: '#1a1a1a', marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button onClick={() => setStep(4)} style={{
                  padding: '18px 24px', background: '#fff', color: '#1a1a1a',
                  border: '2px solid #e5e5e5', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
                }}>
                  Retour
                </button>
                <button
                  onClick={() => profile.experience && setStep(6)}
                  disabled={!profile.experience}
                  style={{
                    flex: 1, padding: '18px',
                    background: profile.experience ? '#1a1a1a' : '#e5e5e5',
                    color: profile.experience ? '#fff' : '#999',
                    border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600',
                    cursor: profile.experience ? 'pointer' : 'not-allowed'
                  }}
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {/* ========== ÉTAPE 6 : RÉGION + VILLE ========== */}
          {step === 6 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: '#1a1a1a' }}>
                Où joues-tu habituellement ?
              </h2>
              <p style={{ color: '#666', marginBottom: 24, fontSize: 15, lineHeight: 1.5 }}>
                Pour te proposer des parties et joueurs près de chez toi.
              </p>

              {/* Sélection région */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Ta région
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 8,
                  maxHeight: 200,
                  overflowY: 'auto',
                  padding: 4
                }}>
                  {regionOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setProfile({ ...profile, region: opt.id, city: '' })}
                      style={{
                        padding: '12px 10px',
                        border: profile.region === opt.id ? '2px solid #22c55e' : '2px solid #e5e5e5',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: profile.region === opt.id ? '#f0fdf4' : '#fff',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: profile.region === opt.id ? '600' : '500',
                        color: profile.region === opt.id ? '#166534' : '#666'
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sélection ville si région choisie */}
              {profile.region && cityOptions.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    Ta ville (ou la plus proche)
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 8,
                    maxHeight: 180,
                    overflowY: 'auto',
                    padding: 4
                  }}>
                    {cityOptions.map(city => (
                      <div
                        key={city}
                        onClick={() => setProfile({ ...profile, city })}
                        style={{
                          padding: '12px 10px',
                          border: profile.city === city ? '2px solid #22c55e' : '2px solid #e5e5e5',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: profile.city === city ? '#f0fdf4' : '#fff',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          fontSize: 13,
                          fontWeight: profile.city === city ? '600' : '500',
                          color: profile.city === city ? '#166534' : '#666'
                        }}
                      >
                        📍 {city}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setStep(5)} style={{
                  padding: '18px 24px', background: '#fff', color: '#1a1a1a',
                  border: '2px solid #e5e5e5', borderRadius: 14, fontSize: 16, fontWeight: '600', cursor: 'pointer'
                }}>
                  Retour
                </button>
                <button
                  onClick={saveProfile}
                  disabled={!profile.region || !profile.city || saving}
                  style={{
                    flex: 1, padding: '18px',
                    background: profile.region && profile.city && !saving ? '#22c55e' : '#e5e5e5',
                    color: profile.region && profile.city && !saving ? '#fff' : '#999',
                    border: 'none', borderRadius: 14, fontSize: 16, fontWeight: '600',
                    cursor: profile.region && profile.city && !saving ? 'pointer' : 'not-allowed'
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Créer ma carte de joueur 🎴'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Skip pour plus tard */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => {
              const redirectUrl = sessionStorage.getItem('redirectAfterOnboarding') || sessionStorage.getItem('redirectAfterLogin')
              if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterOnboarding')
                sessionStorage.removeItem('redirectAfterLogin')
                router.push(redirectUrl)
              } else {
                router.push('/dashboard')
              }
            }}
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