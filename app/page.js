'use client'

/**
 * ============================================
 * LANDING PAGE - JUNTO BRAND
 * ============================================
 * 
 * Structure IDENTIQUE à l'original
 * Seuls les styles/couleurs/textes changent
 * 
 * ============================================
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

// Composant: Les 4 points animés
function FourDots({ size = 8, gap = 4 }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {FOUR_DOTS.colors.map((color, i) => (
        <div key={i} className="junto-dot" style={{ width: size, height: size, borderRadius: '50%', background: color }} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'Satoshi', -apple-system, sans-serif",
      background: COLORS.white,
      overflowX: 'hidden'
    }}>
      
      {/* ============================================ */}
      {/* NAVBAR                                      */}
      {/* ============================================ */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: isScrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: isScrolled ? `1px solid ${COLORS.border}` : 'none',
        transition: 'all 0.3s'
      }}>
        <div className="nav-container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink, letterSpacing: -1 }}>junto</span>
            <FourDots size={8} gap={4} />
          </div>
          
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ color: COLORS.gray, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Fonctionnalités</a>
            <a href="#how-it-works" style={{ color: COLORS.gray, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Comment ça marche</a>
            <Link href="/auth" style={{
              padding: '12px 24px',
              background: COLORS.primary,
              color: COLORS.white,
              borderRadius: 100,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.3s'
            }}>
              Commencer
            </Link>
          </div>

          <Link href="/auth" className="mobile-cta" style={{
            padding: '10px 20px',
            background: COLORS.primary,
            color: COLORS.white,
            borderRadius: 100,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            display: 'none'
          }}>
            Connexion
          </Link>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO                                        */}
      {/* ============================================ */}
      <section className="hero-section" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '120px 24px 80px',
        background: `linear-gradient(180deg, ${COLORS.bgSoft} 0%, ${COLORS.white} 100%)`
      }}>
        <div className="hero-container" style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center'
        }}>
          {/* Texte */}
          <div className="hero-text">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: COLORS.primarySoft,
              color: COLORS.primary,
              padding: '10px 18px',
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 24
            }}>
              <FourDots size={6} gap={3} />
              L'app des joueurs de padel
            </div>
            
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              color: COLORS.ink,
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: -2
            }}>
              Fini la galère pour<br/>
              <span style={{ color: COLORS.primary }}>
                trouver ton 4ème
              </span>
            </h1>
            
            <p style={{
              fontSize: 20,
              color: COLORS.gray,
              lineHeight: 1.6,
              marginBottom: 32,
              maxWidth: 480
            }}>
              Crée ta partie en 15 secondes, partage un lien, et trouve des joueurs de ton niveau. Plus de WhatsApp interminables.
            </p>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/auth" style={{
                padding: '18px 36px',
                background: COLORS.primary,
                color: COLORS.white,
                borderRadius: 100,
                textDecoration: 'none',
                fontSize: 17,
                fontWeight: 700,
                boxShadow: `0 4px 20px ${COLORS.primaryGlow}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s'
              }}>
                Créer ma partie <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <a href="#how-it-works" style={{
                padding: '18px 36px',
                background: COLORS.white,
                color: COLORS.ink,
                borderRadius: 100,
                textDecoration: 'none',
                fontSize: 17,
                fontWeight: 600,
                border: `2px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>▶</span> Découvrir
              </a>
            </div>
            
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['✓ 100% gratuit', '✓ Sans inscription complexe', '✓ Prêt en 15 sec'].map((item, i) => (
                <span key={i} style={{ fontSize: 14, color: COLORS.gray, fontWeight: 500 }}>{item}</span>
              ))}
            </div>
          </div>

          {/* Visual - Carte de match */}
          <div className="hero-visual" style={{ position: 'relative' }}>
            <div style={{
              background: COLORS.white,
              borderRadius: 28,
              padding: 24,
              boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
              border: `1px solid ${COLORS.border}`,
              transform: 'rotate(-2deg)',
              animation: 'float 6s ease-in-out infinite'
            }}>
              {/* Accent bar */}
              <div style={{
                height: 4,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber})`,
                borderRadius: 4,
                marginBottom: 20
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>Padel du samedi 🎾</div>
                  <div style={{ fontSize: 15, color: COLORS.primary, fontWeight: 600 }}>Samedi · 18h00</div>
                </div>
                <div style={{
                  background: COLORS.teal,
                  color: COLORS.white,
                  padding: '8px 14px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ width: 6, height: 6, background: COLORS.white, borderRadius: '50%' }} className="junto-dot" />
                  1 place
                </div>
              </div>

              <div style={{
                background: COLORS.bgSoft,
                padding: '14px 16px',
                borderRadius: 14,
                fontSize: 14,
                color: COLORS.gray,
                marginBottom: 20
              }}>
                📍 Club des Lilas, Bordeaux
              </div>

              {/* 4 joueurs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex' }}>
                  {[COLORS.player1, COLORS.player2, COLORS.player3].map((color, i) => (
                    <div key={i} style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: color,
                      border: `3px solid ${COLORS.white}`,
                      marginLeft: i > 0 ? -12 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: COLORS.white,
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      {['M', 'T', 'J'][i]}
                    </div>
                  ))}
                  {/* Place vide */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: COLORS.bgSoft,
                    border: `3px dashed ${COLORS.border}`,
                    marginLeft: -12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.muted,
                    fontSize: 20
                  }}>
                    ?
                  </div>
                </div>
                <button style={{
                  background: COLORS.primary,
                  color: COLORS.white,
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: 100,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Satoshi', sans-serif"
                }}>
                  Rejoindre
                </button>
              </div>
            </div>

            {/* Decoration blobs */}
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: COLORS.primarySoft,
              opacity: 0.5,
              zIndex: -1
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: COLORS.tealSoft,
              opacity: 0.5,
              zIndex: -1
            }} />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES                                    */}
      {/* ============================================ */}
      <section id="features" style={{ padding: '100px 24px', background: COLORS.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FourDots size={10} gap={5} />
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: COLORS.ink, marginBottom: 16, letterSpacing: -1 }}>
              Tout ce qu'il te faut pour jouer
            </h2>
            <p style={{ fontSize: 18, color: COLORS.gray, maxWidth: 500, margin: '0 auto' }}>
              Organise, trouve, joue. Simple comme ça.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }} className="features-grid">
            {[
              { icon: '📤', title: 'Partage ta partie', desc: 'Crée une belle carte et partage-la sur WhatsApp, Insta ou par SMS.', color: COLORS.primary },
              { icon: '🎯', title: 'Trouve ton niveau', desc: 'Les joueurs affichent leur niveau. Plus de mauvaises surprises.', color: COLORS.teal },
              { icon: '📊', title: 'Suis tes stats', desc: 'Parties jouées, victoires, partenaires favoris... tout est tracké.', color: COLORS.amber }
            ].map((f, i) => (
              <div key={i} style={{
                background: COLORS.white,
                borderRadius: 24,
                padding: 32,
                border: `2px solid ${COLORS.border}`,
                transition: 'all 0.3s'
              }} className="feature-card">
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: `${f.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 20
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS                                */}
      {/* ============================================ */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: COLORS.ink,
        color: COLORS.white
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: 16 }}>
              Simple comme 1, 2, 3
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }}>
              Une partie organisée en moins d'une minute
            </p>
          </div>

          <div className="steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40
          }}>
            {[
              { num: '1', icon: '⚡', title: 'Créez votre partie', desc: 'Date, heure, lieu et niveau souhaité. Votre partie est prête en quelques clics.' },
              { num: '2', icon: '🔗', title: 'Partagez le lien', desc: 'Envoyez votre carte de match sur WhatsApp, Instagram, ou par SMS.' },
              { num: '3', icon: '✅', title: 'Jouez !', desc: 'Les joueurs s\'inscrivent avec leur profil. Vous voyez leur niveau et c\'est parti !' }
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  background: `${COLORS.primary}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, margin: '0 auto 20px',
                  border: `1px solid ${COLORS.primary}50`
                }}>{step.icon}</div>
                <div style={{ fontSize: 14, color: COLORS.primary, fontWeight: 700, marginBottom: 8 }}>Étape {step.num}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL                                   */}
      {/* ============================================ */}
      <section style={{
        padding: '100px 24px',
        background: COLORS.primary,
        color: COLORS.white,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            {FOUR_DOTS.colors.map((_, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: COLORS.white,
                opacity: 0.3 + (i * 0.2),
                marginLeft: i > 0 ? 8 : 0
              }} />
            ))}
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
            Prêt à jouer<br/>ensemble ?
          </h2>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.95)', marginBottom: 40, lineHeight: 1.6 }}>
            Rejoins les joueurs qui ont adopté une nouvelle façon d'organiser.<br/>
            Gratuit, rapide et efficace.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '20px 48px',
            background: COLORS.white,
            color: COLORS.primary,
            borderRadius: 100,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            Créer ma première partie →
          </Link>
          <p style={{ marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
            Inscription gratuite • Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                      */}
      {/* ============================================ */}
      <footer style={{
        padding: '48px 24px',
        background: COLORS.ink,
        color: COLORS.muted
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="footer-grid" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 48,
            marginBottom: 48
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.white }}>junto</span>
                <FourDots size={6} gap={3} />
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
                L'app qui simplifie l'organisation de tes parties de padel. Fini les galères, place au jeu !
              </p>
            </div>
            <div>
              <h4 style={{ color: COLORS.white, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Produit</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#features" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: 14 }}>Fonctionnalités</a>
                <a href="#how-it-works" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: 14 }}>Comment ça marche</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: COLORS.white, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Légal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/terms" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: 14 }}>Conditions d'utilisation</Link>
                <Link href="/terms" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: 14 }}>Politique de confidentialité</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: COLORS.white, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="mailto:hello@junto.app" style={{ color: COLORS.muted, textDecoration: 'none', fontSize: 14 }}>hello@junto.app</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.secondary}`, paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, margin: 0 }}>
              © 2024 Junto. Fait avec ❤️ pour les joueurs de padel.
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================ */}
      {/* STYLES                                      */}
      {/* ============================================ */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(-2deg) translateY(-10px); }
        }
        
        @keyframes junto-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .junto-dot { animation: junto-breathe 3s ease-in-out infinite; }
        .junto-dot:nth-child(1) { animation-delay: 0s; }
        .junto-dot:nth-child(2) { animation-delay: 0.15s; }
        .junto-dot:nth-child(3) { animation-delay: 0.3s; }
        .junto-dot:nth-child(4) { animation-delay: 0.45s; }

        .feature-card:hover {
          border-color: ${COLORS.primary} !important;
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-cta { display: block !important; }
          
          .hero-container {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
            text-align: center;
          }
          .hero-text { order: 1; }
          .hero-visual { order: 2; }
          
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          
          .steps-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center;
          }
          .footer-grid > div { 
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-container { gap: 48px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }

        a:hover { opacity: 0.9; }
      `}</style>
    </div>
  )
}
