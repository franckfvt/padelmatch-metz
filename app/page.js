'use client'

/**
 * ============================================
 * LANDING PAGE - VERSION DESKTOP RESPONSIVE
 * ============================================
 * 
 * Proposition de valeur:
 * "Fini la galère pour organiser une partie de padel"
 * 
 * 3 fonctionnalités principales:
 * 1. Organiser & partager (carte match)
 * 2. Trouver parties & joueurs (carte joueur)
 * 3. Tracker stats & progresser
 * 
 * ============================================
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'

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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fff',
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
        borderBottom: isScrolled ? '1px solid #e2e8f0' : 'none',
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
            <span style={{ fontSize: 28 }}>🎾</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>PadelMatch</span>
          </div>
          
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ color: '#64748b', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Fonctionnalités</a>
            <a href="#how-it-works" style={{ color: '#64748b', textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>Comment ça marche</a>
            <Link href="/auth" style={{
              padding: '12px 24px',
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 600,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              Commencer
            </Link>
          </div>

          {/* Mobile menu button */}
          <Link href="/auth" className="mobile-cta" style={{
            padding: '10px 20px',
            background: '#1a1a2e',
            color: '#fff',
            borderRadius: 10,
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
      {/* HERO - 2 colonnes desktop                   */}
      {/* ============================================ */}
      <section className="hero-section" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '120px 24px 80px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)'
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
              display: 'inline-block',
              background: '#dcfce7',
              color: '#166534',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 24
            }}>
              🎾 L'app des joueurs de padel
            </div>
            
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              color: '#1a1a2e',
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: '-1px'
            }}>
              Fini la galère pour<br/>
              <span style={{ 
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                organiser ton padel
              </span>
            </h1>
            
            <p style={{
              fontSize: 20,
              color: '#64748b',
              lineHeight: 1.6,
              marginBottom: 32,
              maxWidth: 480
            }}>
              Crée ta partie en 15 secondes, partage un lien, et trouve des joueurs de ton niveau. Plus de WhatsApp interminables.
            </p>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/auth" style={{
                padding: '18px 36px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                borderRadius: 14,
                textDecoration: 'none',
                fontSize: 17,
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                Créer ma partie <span style={{ fontSize: 20 }}>→</span>
              </Link>
              <a href="#how-it-works" style={{
                padding: '18px 36px',
                background: '#fff',
                color: '#1a1a2e',
                borderRadius: 14,
                textDecoration: 'none',
                fontSize: 17,
                fontWeight: 600,
                border: '2px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                Voir comment ça marche
              </a>
            </div>
            
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['✓ 100% gratuit', '✓ Sans inscription complexe', '✓ Prêt en 15 sec'].map((item, i) => (
                <span key={i} style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{item}</span>
              ))}
            </div>
          </div>

          {/* Visual - Carte de match */}
          <div className="hero-visual" style={{ position: 'relative' }}>
            {/* Carte de match principale */}
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 25px 80px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              transform: 'rotate(2deg)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a2e, #334155)',
                borderRadius: 16,
                padding: 20,
                color: '#fff',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Samedi 21 décembre</div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>18h00</div>
                  </div>
                  <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>⚡ Mix</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>📍 Padel Club Paris 15</div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Joueurs confirmés</div>
                <div style={{ display: 'flex', gap: -8 }}>
                  {['#3b82f6', '#22c55e', '#f59e0b', '#e2e8f0'].map((color, i) => (
                    <div key={i} style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: color === '#e2e8f0' ? color : `linear-gradient(135deg, ${color}, ${color}cc)`,
                      border: '3px solid #fff',
                      marginLeft: i > 0 ? -12 : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: color === '#e2e8f0' ? '#94a3b8' : '#fff',
                      fontWeight: 700, fontSize: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {color === '#e2e8f0' ? '+' : ['T', 'M', 'S'][i]}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>⭐ Niveau 5-7</span>
                <span style={{ background: '#f0fdf4', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#16a34a' }}>1 place dispo</span>
              </div>
            </div>

            {/* Notification flottante */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              background: '#fff',
              borderRadius: 16,
              padding: '14px 18px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transform: 'rotate(-3deg)',
              animation: 'float 3s ease-in-out infinite'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>L</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>Lucas a rejoint !</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>⭐ Niveau 6 • 94% fiable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* LE PROBLÈME                                 */}
      {/* ============================================ */}
      <section style={{
        padding: '100px 24px',
        background: 'linear-gradient(180deg, #fff 0%, #fef2f2 100%)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: '#fee2e2',
            color: '#dc2626',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20
          }}>
            😫 Le problème
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>
            Tu connais cette galère ?
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 48 }}>
            Organiser une partie de padel, c'est souvent ça...
          </p>
          
          <div className="problem-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24
          }}>
            {[
              { emoji: '📱', number: '47', title: 'messages WhatsApp', desc: '"T\'es dispo samedi ?" "Quel niveau ?" "Finalement non désolé"...' },
              { emoji: '🤷', number: '?', title: 'Niveaux inconnus', desc: 'Tu invites quelqu\'un... et tu découvres son niveau sur le terrain.' },
              { emoji: '💨', number: '2h', title: 'avant le match', desc: '"Désolé je peux plus venir". Et tu repars à zéro.' }
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 20,
                padding: 32,
                textAlign: 'center',
                border: '1px solid #fecaca',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{item.emoji}</div>
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: 800, 
                  color: '#dc2626',
                  marginBottom: 4
                }}>
                  {item.number}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3 FONCTIONNALITÉS PRINCIPALES               */}
      {/* ============================================ */}
      <section id="features" style={{
        padding: '100px 24px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>
              Tout ce dont tu as besoin
            </h2>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
              PadelMatch simplifie l'organisation de tes parties et te connecte avec des joueurs de ton niveau
            </p>
          </div>

          {/* Feature 1 - Organiser */}
          <div className="feature-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
            marginBottom: 100
          }}>
            <div>
              <div style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                📅 Organiser
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2 }}>
                Crée ta partie en 15 secondes, partage et c'est complet
              </h3>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Tu définis la date, l'heure, le lieu et le niveau souhaité. Tu partages ta <strong>carte de match</strong> sur WhatsApp, Instagram ou où tu veux. Les joueurs s'inscrivent en un clic avec leur profil vérifié.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Carte de match partageable sur les réseaux', 'Inscription en 1 clic pour les joueurs', 'Notifications automatiques'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#16a34a' }}>✓</span>
                    <span style={{ fontSize: 15, color: '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #22c55e15, #16a34a10)',
              borderRadius: 24,
              padding: 40,
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Match card preview */}
              <div style={{
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: 320
              }}>
                <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 14, padding: 20, color: '#fff', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Dimanche 22 déc.</div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>10h30</div>
                  <div style={{ fontSize: 14 }}>📍 Tennis Padel Soleil</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex' }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: i < 3 ? ['#3b82f6', '#f59e0b', '#a855f7'][i] : '#e2e8f0',
                        border: '2px solid #fff', marginLeft: i > 0 ? -10 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: i < 3 ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: 13
                      }}>{i < 3 ? ['J', 'P', 'M'][i] : '?'}</div>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>1 place</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Trouver */}
          <div className="feature-row feature-row-reverse" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
            marginBottom: 100
          }}>
            <div style={{ order: 2 }}>
              <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                🔍 Explorer
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2 }}>
                Trouve des parties et des joueurs de ton niveau
              </h3>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Explore les parties disponibles près de chez toi, filtre par niveau et ambiance. Consulte la <strong>carte joueur</strong> de chacun pour voir son niveau, sa fiabilité et ses stats avant de jouer ensemble.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Parties filtrées par niveau et ville', 'Profil vérifié avec score de fiabilité', 'Ajoute tes joueurs favoris'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1e40af' }}>✓</span>
                    <span style={{ fontSize: 15, color: '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              order: 1,
              background: 'linear-gradient(135deg, #3b82f615, #1e40af10)',
              borderRadius: 24,
              padding: 40,
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Player card preview */}
              <div style={{
                background: 'linear-gradient(145deg, #1a1a2e, #334155)',
                borderRadius: 20,
                padding: 24,
                color: '#fff',
                width: '100%',
                maxWidth: 300,
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🎾</span>
                    <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.6 }}>PADELMATCH</span>
                  </div>
                  <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>✓ 96%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>S</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>Sophie</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>Paris • 3x/semaine</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <span style={{ background: '#fbbf24', color: '#1a1a1a', padding: '5px 12px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>⭐ 6/10</span>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 6, fontSize: 13 }}>⚡ Mix</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700 }}>38</div><div style={{ fontSize: 10, opacity: 0.6 }}>parties</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700 }}>71%</div><div style={{ fontSize: 10, opacity: 0.6 }}>victoires</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>🔥3</div><div style={{ fontSize: 10, opacity: 0.6 }}>série</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 - Tracker */}
          <div className="feature-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                📊 Progresser
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2 }}>
                Track tes matchs et partage tes stats
              </h3>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
                Enregistre les scores de tes matchs, suis ta progression avec des stats détaillées. Débloque des <strong>badges</strong> et partage tes victoires sur les réseaux sociaux. Monte dans le classement !
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Historique complet de tes matchs', '24 badges à débloquer', 'Cartes de victoire partageables'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#92400e' }}>✓</span>
                    <span style={{ fontSize: 15, color: '#475569' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b15, #d9770610)',
              borderRadius: 24,
              padding: 40,
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Stats preview */}
              <div style={{
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: 320
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>📊 Tes stats</h4>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Ce mois</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { value: '12', label: 'Parties', color: '#3b82f6' },
                    { value: '8', label: 'Victoires', color: '#22c55e' },
                    { value: '67%', label: 'Win rate', color: '#f59e0b' },
                    { value: '🔥 4', label: 'Série', color: '#ef4444' }
                  ].map((stat, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['🏆', '🎯', '⚡', '🔥', '👑'].map((badge, i) => (
                    <div key={i} style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: i < 3 ? '#fef3c7' : '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                      opacity: i < 3 ? 1 : 0.4
                    }}>{badge}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMMENT ÇA MARCHE                           */}
      {/* ============================================ */}
      <section id="how-it-works" style={{
        padding: '100px 24px',
        background: '#1a1a2e',
        color: '#fff'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: 16 }}>
              Comment ça marche ?
            </h2>
            <p style={{ fontSize: 18, opacity: 0.8 }}>
              En 3 étapes, ta partie est organisée
            </p>
          </div>

          <div className="steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40
          }}>
            {[
              { num: '1', icon: '⚡', title: 'Crée ta partie', desc: 'Date, heure, lieu, niveau. C\'est prêt en 15 secondes.' },
              { num: '2', icon: '🔗', title: 'Partage le lien', desc: 'Sur WhatsApp, Instagram, Facebook... où tu veux.' },
              { num: '3', icon: '✅', title: 'Jouez !', desc: 'Les joueurs s\'inscrivent. Tu vois leur niveau. C\'est parti !' }
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, margin: '0 auto 20px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>{step.icon}</div>
                <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 700, marginBottom: 8 }}>Étape {step.num}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.6 }}>{step.desc}</p>
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
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
            Prêt à organiser ta<br/>prochaine partie ?
          </h2>
          <p style={{ fontSize: 20, opacity: 0.95, marginBottom: 40, lineHeight: 1.6 }}>
            Rejoins les joueurs qui ont dit adieu aux galères d'organisation.<br/>
            C'est gratuit, rapide, et ça change tout.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '20px 48px',
            background: '#fff',
            color: '#16a34a',
            borderRadius: 14,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            Créer ma partie gratuitement →
          </Link>
          <p style={{ marginTop: 20, fontSize: 14, opacity: 0.85 }}>
            Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                      */}
      {/* ============================================ */}
      <footer style={{
        padding: '48px 24px',
        background: '#1a1a2e',
        color: '#94a3b8'
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
                <span style={{ fontSize: 24 }}>🎾</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>PadelMatch</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
                L'app qui simplifie l'organisation de tes parties de padel. Fini les galères, place au jeu !
              </p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Produit</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Fonctionnalités</a>
                <a href="#how-it-works" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Comment ça marche</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Légal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Conditions d'utilisation</Link>
                <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>Politique de confidentialité</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="mailto:hello@padelmatch.fr" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>hello@padelmatch.fr</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, margin: 0 }}>
              © 2024 PadelMatch. Fait avec ❤️ pour les joueurs de padel.
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================ */}
      {/* STYLES RESPONSIVE                           */}
      {/* ============================================ */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(-3deg) translateY(-10px); }
        }

        /* Mobile */
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
          
          .problem-grid {
            grid-template-columns: 1fr !important;
          }
          
          .feature-row, .feature-row-reverse {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .feature-row > div:first-child,
          .feature-row-reverse > div:first-child {
            order: 1 !important;
          }
          .feature-row > div:last-child,
          .feature-row-reverse > div:last-child {
            order: 2 !important;
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

        /* Tablet */
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-container {
            gap: 48px !important;
          }
          .feature-row, .feature-row-reverse {
            gap: 48px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        /* Hover effects */
        a:hover { opacity: 0.9; }
        button:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  )
}