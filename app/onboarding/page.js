'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // 1: Nom, 2: Niveau, 3: Position, 4: Preview

  const [formData, setFormData] = useState({
    name: '',
    level: '',
    position: ''
  })

  const [copied, setCopied] = useState(false)

  const positionLabels = {
    'left': 'Gauche',
    'right': 'Droite',
    'both': 'Les deux'
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
      .select('name, level, position')
      .eq('id', session.user.id)
      .single()

    if (profile?.name && profile?.level) {
      router.push('/dashboard')
      return
    }

    // Pré-remplir avec les données existantes
    setFormData({
      name: profile?.name || session.user.user_metadata?.name?.split(' ')[0] || '',
      level: profile?.level?.toString() || '',
      position: profile?.position || ''
    })

    setLoading(false)
  }

  async function saveProfile() {
    if (!formData.name || !formData.level) {
      alert('Complète ton nom et ton niveau')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          level: parseInt(formData.level),
          position: formData.position || null
        })
        .eq('id', user.id)

      if (error) throw error

      // Aller à l'étape preview
      setStep(4)
      setSaving(false)

    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  function nextStep() {
    if (step === 1 && !formData.name) {
      alert('Entre ton prénom')
      return
    }
    if (step === 2 && !formData.level) {
      alert('Sélectionne ton niveau')
      return
    }
    
    if (step === 3) {
      saveProfile()
    } else {
      setStep(step + 1)
    }
  }

  function copyProfileLink() {
    const link = `${window.location.origin}/player/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function goToDashboard() {
    // Vérifier s'il y a une redirection stockée
    const redirect = sessionStorage.getItem('redirectAfterOnboarding')
    if (redirect) {
      sessionStorage.removeItem('redirectAfterOnboarding')
      router.push(redirect)
    } else {
      router.push('/dashboard')
    }
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
      <div style={{ maxWidth: 400, margin: '0 auto', paddingTop: 40 }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎾</div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            PadelMatch
          </h1>
        </div>

        {/* Indicateur d'étapes */}
        {step < 4 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 8, 
            marginBottom: 32 
          }}>
            {[1, 2, 3].map(s => (
              <div
                key={s}
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: s <= step ? '#1a1a1a' : '#e5e5e5'
                }}
              />
            ))}
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
              Les autres joueurs verront ce prénom
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
                marginBottom: 20
              }}
            />

            <button
              onClick={nextStep}
              style={{
                width: '100%',
                padding: 16,
                background: formData.name ? '#1a1a1a' : '#e5e5e5',
                color: formData.name ? '#fff' : '#999',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: '600',
                cursor: formData.name ? 'pointer' : 'not-allowed'
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
            <h2 style={{ fontSize: 20, fontWeight: '700', margin: '0 0 8px' }}>
              Quel est ton niveau ?
            </h2>
            <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
              De 1 (débutant) à 10 (pro)
            </p>

            {/* Échelle visuelle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 12,
              fontSize: 12,
              color: '#999'
            }}>
              <span>Débutant</span>
              <span>Pro</span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: 8,
              marginBottom: 20
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, level: level.toString() })}
                  style={{
                    padding: '16px 0',
                    borderRadius: 12,
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

            {/* Aide contextuelle */}
            {formData.level && (
              <div style={{
                background: '#f5f5f5',
                borderRadius: 10,
                padding: 12,
                marginBottom: 20,
                fontSize: 13,
                color: '#666'
              }}>
                {parseInt(formData.level) <= 3 && "🌱 Tu découvres le padel, parfait pour progresser !"}
                {parseInt(formData.level) >= 4 && parseInt(formData.level) <= 6 && "📈 Tu maîtrises les bases et tu progresses bien !"}
                {parseInt(formData.level) >= 7 && parseInt(formData.level) <= 8 && "💪 Tu as un bon niveau, les matchs sont intenses !"}
                {parseInt(formData.level) >= 9 && "🏆 Tu es un joueur confirmé, niveau compétition !"}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <button
                onClick={nextStep}
                style={{
                  flex: 1,
                  padding: 16,
                  background: formData.level ? '#1a1a1a' : '#e5e5e5',
                  color: formData.level ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: formData.level ? 'pointer' : 'not-allowed'
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* === ÉTAPE 3: POSITION === */}
        {step === 3 && (
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
              Optionnel, tu peux changer plus tard
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 10,
              marginBottom: 20
            }}>
              {[
                { id: 'right', emoji: '➡️', label: 'Droite', desc: 'Côté revers (le plus courant)' },
                { id: 'left', emoji: '⬅️', label: 'Gauche', desc: 'Côté coup droit' },
                { id: 'both', emoji: '↔️', label: 'Les deux', desc: 'Tu joues des deux côtés' }
              ].map(pos => (
                <button
                  key={pos.id}
                  onClick={() => setFormData({ ...formData, position: pos.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: formData.position === pos.id ? '#1a1a1a' : '#eee',
                    background: formData.position === pos.id ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 24 }}>{pos.emoji}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{pos.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{pos.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <button
                onClick={nextStep}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: 16,
                  background: saving ? '#ccc' : '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Création...' : 'Créer mon profil →'}
              </button>
            </div>

            {/* Skip */}
            <button
              onClick={() => {
                setFormData({ ...formData, position: '' })
                saveProfile()
              }}
              style={{
                width: '100%',
                marginTop: 12,
                padding: 12,
                background: 'transparent',
                color: '#999',
                border: 'none',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Passer cette étape
            </button>
          </div>
        )}

        {/* === ÉTAPE 4: PREVIEW CARTE === */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: '700', margin: '0 0 4px' }}>
                Ton profil est prêt !
              </h2>
              <p style={{ color: '#666', margin: 0 }}>
                Voici ta carte de joueur
              </p>
            </div>

            {/* La carte */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
              borderRadius: 20,
              padding: 24,
              color: '#fff',
              marginBottom: 20
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>🎾</span>
                  <span style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12
                }}>
                  ✅ 100% fiable
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h2 style={{ 
                  fontSize: 28, 
                  fontWeight: '700', 
                  margin: '0 0 8px',
                  letterSpacing: '-0.5px'
                }}>
                  {formData.name}
                </h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                  {formData.position && (
                    <span style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      🎾 {positionLabels[formData.position]}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: '700' }}>0</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>parties</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: '700' }}>0%</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>victoires</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: '700', color: '#fbbf24' }}>🔥0</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>série</div>
                </div>
              </div>
            </div>

            {/* Copier le lien */}
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
                marginBottom: 20
              }}
            >
              {copied ? '✓ Lien copié !' : '📋 Copier le lien de ma carte'}
            </button>

            {/* Astuce Facebook */}
            <div style={{
              background: '#eff6ff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ fontSize: 13, fontWeight: '600', color: '#1e40af', marginBottom: 4 }}>
                💡 Astuce pour les groupes Facebook
              </div>
              <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
                Colle ton lien quand tu réponds à un post "Cherche joueurs". L'organisateur verra directement ton niveau !
              </div>
            </div>

            {/* Question : que faire ? */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: 12,
                textAlign: 'center'
              }}>
                Que veux-tu faire ?
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => router.push('/dashboard?create=true')}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🎾 Créer une partie
                </button>
                <button
                  onClick={goToDashboard}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: '#fff',
                    color: '#1a1a1a',
                    border: '2px solid #1a1a1a',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Rejoindre
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}