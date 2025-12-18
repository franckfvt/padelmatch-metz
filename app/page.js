'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [playerCount, setPlayerCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadStats()
  }, [])

  async function checkAuthAndLoadStats() {
    // Vérifier si déjà connecté
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push('/dashboard')
      return
    }

    // Charger le nombre de joueurs
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('name', 'is', null)

    setPlayerCount(count || 0)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{ fontSize: 48 }}>🎾</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <span style={{ fontSize: 20, fontWeight: '700' }}>PadelMatch</span>
        </div>
        <Link
          href="/auth"
          style={{
            padding: '10px 20px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: '600'
          }}
        >
          Connexion
        </Link>
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 20px 80px',
        textAlign: 'center',
        maxWidth: 700,
        margin: '0 auto'
      }}>
        {/* Badge compteur */}
        {playerCount > 0 && (
          <div style={{
            display: 'inline-block',
            background: '#dcfce7',
            color: '#166534',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 24
          }}>
            🎾 {playerCount} joueur{playerCount > 1 ? 's' : ''} inscrit{playerCount > 1 ? 's' : ''}
          </div>
        )}

        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 56px)',
          fontWeight: '800',
          color: '#1a1a1a',
          margin: '0 0 16px',
          lineHeight: 1.1,
          letterSpacing: '-1px'
        }}>
          Trouve des joueurs<br />
          <span style={{ color: '#16a34a' }}>de ton niveau</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: '#666',
          margin: '0 0 32px',
          lineHeight: 1.6
        }}>
          Fini les 47 messages WhatsApp pour organiser une partie.<br />
          Crée, invite, joue. En moins de 5 minutes.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/auth"
            style={{
              padding: '16px 32px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: '600'
            }}
          >
            Créer mon profil →
          </Link>
          <a
            href="#comment-ca-marche"
            style={{
              padding: '16px 32px',
              background: '#fff',
              color: '#1a1a1a',
              border: '2px solid #eee',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: '600'
            }}
          >
            Comment ça marche ?
          </a>
        </div>
      </section>

      {/* Problème WhatsApp */}
      <section style={{
        padding: '60px 20px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
            margin: '0 0 40px',
            color: '#1a1a1a'
          }}>
            😩 Le problème qu'on connaît tous
          </h2>

          {/* Simulation WhatsApp */}
          <div style={{
            background: '#e5ddd5',
            borderRadius: 16,
            padding: 20,
            maxWidth: 400,
            margin: '0 auto 40px'
          }}>
            {[
              { name: 'Marc', msg: 'Qui pour jeudi 18h ?' },
              { name: 'Julie', msg: 'Moi !' },
              { name: 'Thomas', msg: 'Peut-être, je confirme demain' },
              { name: 'Marc', msg: 'Thomas tu confirmes ?' },
              { name: 'Lucas', msg: 'Moi je peux mais que si c\'est 19h' },
              { name: 'Julie', msg: 'Ah non 19h je peux plus du coup' },
              { name: 'Thomas', msg: 'Finalement je peux pas 😅' },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 8,
                  maxWidth: '80%'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: '600', color: '#128c7e' }}>{m.name}</div>
                <div style={{ fontSize: 14 }}>{m.msg}</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', color: '#999', fontSize: 13, marginTop: 16 }}>
              ... et 40 messages plus tard 😮‍💨
            </div>
          </div>

          {/* VS Solution */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20
          }}>
            <div style={{
              background: '#fee2e2',
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>❌</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 8px' }}>WhatsApp</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 14, lineHeight: 1.8 }}>
                <li>47 messages pour savoir qui vient</li>
                <li>"C'est qui ce mec ?"</li>
                <li>"Il joue bien ?"</li>
                <li>Annulations de dernière minute</li>
              </ul>
            </div>
            <div style={{
              background: '#dcfce7',
              borderRadius: 16,
              padding: 24
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', margin: '0 0 8px' }}>PadelMatch</h3>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 14, lineHeight: 1.8 }}>
                <li>Crée ta partie en 15 secondes</li>
                <li>Partage le lien, c'est tout</li>
                <li>Tu vois le niveau de chacun</li>
                <li>Score de fiabilité visible</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" style={{
        padding: '80px 20px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
            margin: '0 0 50px',
            color: '#1a1a1a'
          }}>
            Comment ça marche ?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 30
          }}>
            {[
              { emoji: '👤', title: 'Crée ton profil', desc: 'Niveau 1-10, position Droite/Gauche, en 30 secondes' },
              { emoji: '🎾', title: 'Crée ou rejoins', desc: 'Une partie existante ou la tienne, c\'est toi qui choisis' },
              { emoji: '🔗', title: 'Partage le lien', desc: 'WhatsApp, Facebook, SMS... Les joueurs s\'inscrivent' },
              { emoji: '🏆', title: 'Joue !', desc: 'Équipes, paiement, résultats. Tout est géré.' }
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 24,
                  textAlign: 'center',
                  border: '1px solid #eee'
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: '700',
                  margin: '0 auto 16px'
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{step.emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: '600', margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features clés */}
      <section style={{
        padding: '80px 20px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
            margin: '0 0 50px',
            color: '#1a1a1a'
          }}>
            Ce qui change tout
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20
          }}>
            {[
              { 
                emoji: '⭐', 
                title: 'Niveau 1-10', 
                desc: 'Fini "débutant/confirmé". Les vrais joueurs disent "je cherche un 5+".' 
              },
              { 
                emoji: '🎾', 
                title: 'Position D/G', 
                desc: 'Trouve un partenaire compatible. Tu joues à droite ? On te trouve un gaucher.' 
              },
              { 
                emoji: '✅', 
                title: 'Score de fiabilité', 
                desc: 'Les flakers sont identifiés. 98% fiable = tu peux compter sur lui.' 
              },
              { 
                emoji: '💰', 
                title: 'Paiement intégré', 
                desc: 'Lydia, PayPal, RIB. Plus besoin de relancer tout le monde.' 
              },
              { 
                emoji: '👥', 
                title: 'Équipes visuelles', 
                desc: 'Vois qui joue avec qui. L\'orga peut gérer les équipes en 1 clic.' 
              },
              { 
                emoji: '🔗', 
                title: 'Carte de visite', 
                desc: 'Ton profil partageable. Colle ton lien sur Facebook, fini les "Moi !".' 
              }
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid #eee'
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{feature.emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: '600', margin: '0 0 8px' }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* La carte de visite */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: '700',
            margin: '0 0 16px',
            color: '#fff'
          }}>
            Ta carte de visite padel
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 40px'
          }}>
            Partage ton profil sur les groupes Facebook.<br />
            Les organisateurs voient ton niveau instantanément.
          </p>

          {/* Exemple de carte */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 320,
            margin: '0 auto 40px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>🎾</span>
              <span style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>PADELMATCH</span>
            </div>
            <h3 style={{ 
              fontSize: 28, 
              fontWeight: '700', 
              color: '#fff',
              margin: '0 0 12px'
            }}>
              Toi ?
            </h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <span style={{
                background: '#fbbf24',
                color: '#1a1a1a',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: '700'
              }}>
                ⭐ ?/10
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14
              }}>
                🎾 Position
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 16
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>?</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>parties</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#22c55e' }}>?%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>wins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#fbbf24' }}>🔥?</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>série</div>
              </div>
            </div>
          </div>

          <Link
            href="/auth"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: '#fff',
              color: '#1a1a1a',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: '700'
            }}
          >
            Créer ma carte →
          </Link>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
        padding: '80px 20px',
        background: '#fafafa',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            margin: '0 0 16px',
            color: '#1a1a1a'
          }}>
            Prêt à jouer ?
          </h2>
          <p style={{
            fontSize: 18,
            color: '#666',
            margin: '0 0 32px'
          }}>
            Crée ton profil en 30 secondes.<br />
            C'est gratuit, pour toujours.
          </p>
          <Link
            href="/auth"
            style={{
              display: 'inline-block',
              padding: '18px 40px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 14,
              textDecoration: 'none',
              fontSize: 18,
              fontWeight: '700'
            }}
          >
            🎾 Créer mon profil gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 20px',
        borderTop: '1px solid #eee',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <span style={{ fontWeight: '600' }}>PadelMatch</span>
        </div>
        <p style={{ color: '#999', fontSize: 14, margin: 0 }}>
          L'app pour organiser tes parties de padel
        </p>
      </footer>
    </div>
  )
}