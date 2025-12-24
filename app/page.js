'use client'

/**
 * ============================================
 * LANDING PAGE - JUNTO BRAND v2.0
 * ============================================
 * 
 * Design: Mémorable, vivant, impactant
 * Focus: Les 4 points comme ADN visuel
 * 
 * ============================================
 */

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

// ============================================
// COMPOSANTS RÉUTILISABLES
// ============================================

// Les 4 points animés (signature Junto)
function FourDots({ size = 8, gap = 4, className = '' }) {
  return (
    <div style={{ display: 'flex', gap }} className={className}>
      {FOUR_DOTS.colors.map((color, i) => (
        <div key={i} className="junto-dot" style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: color 
        }} />
      ))}
    </div>
  )
}

// Avatar joueur animé
function PlayerAvatar({ color, initial, delay = 0, size = 56 }) {
  return (
    <div 
      className="player-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.35,
        border: '3px solid #fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animationDelay: `${delay}s`
      }}
    >
      {initial}
    </div>
  )
}

// Terrain de padel animé avec les 4 joueurs
function PadelCourt() {
  const [step, setStep] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s + 1) % 4)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const players = [
    { color: COLORS.player1, initial: 'T', label: 'Toi' },
    { color: COLORS.player2, initial: 'P', label: 'Partenaire' },
    { color: COLORS.player3, initial: 'A', label: 'Adversaire' },
    { color: COLORS.player4, initial: '?', label: 'Qui ?' }
  ]

  return (
    <div className="padel-court-container">
      <div className="padel-court">
        {/* Court background */}
        <div className="court-surface">
          <div className="court-line court-line-center" />
          <div className="court-line court-line-service-left" />
          <div className="court-line court-line-service-right" />
          <div className="court-net" />
        </div>
        
        {/* Players */}
        <div className="court-players">
          {players.map((p, i) => (
            <div 
              key={i}
              className={`court-player court-player-${i + 1} ${step >= i ? 'visible' : ''}`}
            >
              <div 
                className="player-dot"
                style={{ 
                  background: p.color,
                  boxShadow: step === i ? `0 0 20px ${p.color}` : 'none'
                }}
              >
                {p.initial}
              </div>
              <span className="player-label">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Counter */}
      <div className="court-counter">
        <div className="counter-dots">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i}
              className={`counter-dot ${step >= i ? 'active' : ''}`}
              style={{ 
                background: step >= i ? FOUR_DOTS.colors[i] : COLORS.border 
              }}
            />
          ))}
        </div>
        <span className="counter-text">
          {step + 1}/4 joueurs
        </span>
      </div>
    </div>
  )
}

// WhatsApp chaos animation
function WhatsAppChaos() {
  const messages = [
    { text: "Dispo samedi 16h ?", time: "14:00", type: "sent" },
    { text: "Moi ! 🙋", time: "14:15", type: "received" },
    { text: "C'est qui ?", time: "14:16", type: "sent" },
    { text: "On est combien ?", time: "14:30", type: "received" },
    { text: "Ah désolé j'peux plus", time: "17:45", type: "received", alert: true },
  ]

  return (
    <div className="whatsapp-chaos">
      <div className="whatsapp-header">
        <span className="whatsapp-title">🎾 Padel crew</span>
        <span className="whatsapp-count">47 messages</span>
      </div>
      <div className="whatsapp-messages">
        {messages.map((m, i) => (
          <div 
            key={i}
            className={`whatsapp-msg ${m.type} ${m.alert ? 'alert' : ''}`}
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            <span>{m.text}</span>
            <small>{m.time}</small>
          </div>
        ))}
      </div>
      <div className="whatsapp-frustration">
        <span>😤</span>
        <span>3h plus tard...</span>
      </div>
    </div>
  )
}

// Junto solution card
function JuntoSolution() {
  return (
    <div className="junto-solution">
      <div className="solution-header">
        <div className="solution-logo">
          <span>junto</span>
          <FourDots size={6} gap={3} />
        </div>
        <span className="solution-badge">15 sec</span>
      </div>
      <div className="solution-card">
        <div className="solution-accent" />
        <div className="solution-content">
          <div className="solution-title">Padel du samedi 🎾</div>
          <div className="solution-meta">Samedi · 18h00 · Club des Lilas</div>
          <div className="solution-players">
            {[
              { color: COLORS.player1, i: 'M', name: 'Marie', level: '5.5' },
              { color: COLORS.player2, i: 'T', name: 'Thomas', level: '5.0' },
              { color: COLORS.player3, i: 'J', name: 'Julie', level: '5.5' },
            ].map((p, idx) => (
              <div key={idx} className="solution-player">
                <div className="sp-avatar" style={{ background: p.color }}>{p.i}</div>
                <div className="sp-info">
                  <span className="sp-name">{p.name}</span>
                  <span className="sp-level">Niv. {p.level}</span>
                </div>
                <div className="sp-badge">✓ 98%</div>
              </div>
            ))}
            <div className="solution-player empty">
              <div className="sp-avatar empty">?</div>
              <div className="sp-info">
                <span className="sp-name">Place libre</span>
                <span className="sp-level">Niv. 5-6</span>
              </div>
              <button className="sp-join">Rejoindre</button>
            </div>
          </div>
        </div>
      </div>
      <div className="solution-result">
        <span className="result-icon">✨</span>
        <span>Partie complète en 2 minutes</span>
      </div>
    </div>
  )
}

// Stats counter animé
function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const increment = end / (duration / 16)
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return <span ref={ref}>{count}{suffix}</span>
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(f => (f + 1) % 4)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    {
      id: 0,
      color: COLORS.player1,
      title: "Ton profil, ta réputation",
      desc: "Niveau, stats, fiabilité. Les autres savent avec qui ils jouent.",
      icon: "👤",
      gradient: `linear-gradient(135deg, ${COLORS.primarySoft} 0%, #fff 100%)`
    },
    {
      id: 1,
      color: COLORS.player2,
      title: "15 secondes chrono",
      desc: "Crée ta partie en 3 clics. Pas de formulaire interminable.",
      icon: "⚡",
      gradient: `linear-gradient(135deg, ${COLORS.secondarySoft} 0%, #fff 100%)`
    },
    {
      id: 2,
      color: COLORS.player3,
      title: "Partage, c'est tout",
      desc: "Un lien. WhatsApp, Insta, SMS. Les joueurs s'inscrivent.",
      icon: "🔗",
      gradient: `linear-gradient(135deg, ${COLORS.amberSoft} 0%, #fff 100%)`
    },
    {
      id: 3,
      color: COLORS.player4,
      title: "Fiabilité garantie",
      desc: "98% de présence ? Tu le sais avant. Fini les annulations.",
      icon: "✓",
      gradient: `linear-gradient(135deg, ${COLORS.tealSoft} 0%, #fff 100%)`
    }
  ]

  return (
    <div className="landing-page">
      
      {/* ============================================ */}
      {/* NAVBAR                                      */}
      {/* ============================================ */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">junto</span>
            <FourDots size={8} gap={4} />
          </div>
          
          <div className="nav-links">
            <a href="#problem">Le problème</a>
            <a href="#features">Fonctionnalités</a>
            <Link href="/auth" className="nav-cta">
              Commencer
            </Link>
          </div>

          <Link href="/auth" className="mobile-cta">
            Connexion
          </Link>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO                                        */}
      {/* ============================================ */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Texte */}
          <div className="hero-text">
            <div className="hero-badge">
              <FourDots size={6} gap={3} />
              <span>L'app des joueurs de padel</span>
            </div>
            
            <h1 className="hero-title">
              Fini la galère pour<br/>
              <span className="highlight">trouver ton 4ème</span>
            </h1>
            
            <p className="hero-subtitle">
              Crée ta partie en 15 secondes, partage un lien, et trouve des joueurs de ton niveau. Plus de WhatsApp interminables.
            </p>
            
            <div className="hero-actions">
              <Link href="/auth" className="btn-primary">
                Créer ma partie <span>→</span>
              </Link>
              <a href="#problem" className="btn-secondary">
                <span className="play-icon">▶</span> Découvrir
              </a>
            </div>
            
            <div className="hero-proof">
              <span>✓ 100% gratuit</span>
              <span>✓ Sans inscription complexe</span>
              <span>✓ Prêt en 15 sec</span>
            </div>
          </div>

          {/* Visual - Carte de match */}
          <div className="hero-visual">
            <div className="hero-card">
              <div className="card-accent" />
              
              <div className="card-header">
                <div>
                  <div className="card-title">Padel du samedi 🎾</div>
                  <div className="card-time">Samedi · 18h00</div>
                </div>
                <div className="card-badge">
                  <span className="badge-dot junto-dot" />
                  1 place
                </div>
              </div>

              <div className="card-location">
                📍 Club des Lilas, Bordeaux
              </div>

              <div className="card-players">
                <div className="players-stack">
                  {[COLORS.player1, COLORS.player2, COLORS.player3].map((color, i) => (
                    <div 
                      key={i} 
                      className="player-avatar-small"
                      style={{ background: color, zIndex: 3 - i }}
                    >
                      {['M', 'T', 'J'][i]}
                    </div>
                  ))}
                  <div className="player-avatar-small empty">?</div>
                </div>
                <button className="join-btn">Rejoindre</button>
              </div>
            </div>

            {/* Decoration */}
            <div className="hero-blob hero-blob-1" />
            <div className="hero-blob hero-blob-2" />
            
            {/* Floating badges */}
            <div className="floating-badge floating-badge-1">
              <span className="fb-icon">✓</span>
              <span>98% fiable</span>
            </div>
            <div className="floating-badge floating-badge-2">
              <span className="fb-icon">⭐</span>
              <span>Niv. 5.5</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-dots">
            <FourDots size={10} gap={6} />
          </div>
          <span>Découvrir</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION PROBLÈME - Le chaos WhatsApp        */}
      {/* ============================================ */}
      <section id="problem" className="problem-section">
        <div className="problem-container">
          <div className="problem-header">
            <h2 className="section-title">
              Tu connais <span className="strike">cette galère</span>
            </h2>
          </div>
          
          <div className="problem-comparison">
            {/* AVANT */}
            <div className="comparison-card before">
              <div className="comparison-label">
                <span className="label-icon">😤</span>
                <span>Avant</span>
              </div>
              <WhatsAppChaos />
            </div>
            
            {/* Flèche */}
            <div className="comparison-arrow">
              <div className="arrow-line" />
              <div className="arrow-dots">
                {FOUR_DOTS.colors.map((c, i) => (
                  <div 
                    key={i} 
                    className="arrow-dot junto-dot"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="arrow-line" />
            </div>
            
            {/* APRÈS */}
            <div className="comparison-card after">
              <div className="comparison-label">
                <span className="label-icon">😎</span>
                <span>Avec Junto</span>
              </div>
              <JuntoSolution />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4 RAISONS - Les 4 points            */}
      {/* ============================================ */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="features-header">
            <div className="features-dots">
              {FOUR_DOTS.colors.map((c, i) => (
                <div 
                  key={i}
                  className={`feature-dot junto-dot ${activeFeature === i ? 'active' : ''}`}
                  style={{ 
                    background: c,
                    transform: activeFeature === i ? 'scale(1.5)' : 'scale(1)',
                    boxShadow: activeFeature === i ? `0 0 20px ${c}` : 'none'
                  }}
                  onClick={() => setActiveFeature(i)}
                />
              ))}
            </div>
            <h2 className="section-title">
              4 joueurs. <span className="gradient-text">4 raisons.</span>
            </h2>
            <p className="section-subtitle">
              Comme sur le terrain, tout fonctionne ensemble.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div 
                key={i}
                className={`feature-card ${activeFeature === i ? 'active' : ''}`}
                onClick={() => setActiveFeature(i)}
                style={{
                  '--accent-color': feature.color,
                  '--accent-soft': `${feature.color}15`
                }}
              >
                <div className="feature-number" style={{ color: feature.color }}>
                  0{i + 1}
                </div>
                <div 
                  className="feature-icon"
                  style={{ background: `${feature.color}15` }}
                >
                  <span>{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
                <div 
                  className="feature-bar"
                  style={{ background: feature.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION TERRAIN - Animation 4 joueurs       */}
      {/* ============================================ */}
      <section className="court-section">
        <div className="court-container">
          <div className="court-content">
            <h2 className="section-title light">
              Sans les 4,<br/>
              <span className="gradient-text-light">pas de match</span>
            </h2>
            <p className="section-subtitle light">
              Junto connecte les joueurs de padel.<br/>
              Pas les terrains. Pas les scores. <strong>Les GENS.</strong>
            </p>
            <div className="court-tagline">
              <FourDots size={12} gap={6} />
              <span>Ensemble, on joue mieux</span>
            </div>
          </div>
          <div className="court-visual">
            <PadelCourt />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION STATS - Preuve sociale              */}
      {/* ============================================ */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value" style={{ color: COLORS.primary }}>
                <AnimatedCounter end={15} suffix="s" />
              </div>
              <div className="stat-label">Pour créer une partie</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value" style={{ color: COLORS.teal }}>
                <AnimatedCounter end={98} suffix="%" />
              </div>
              <div className="stat-label">Taux de présence moyen</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value" style={{ color: COLORS.amber }}>
                <AnimatedCounter end={0} suffix="€" />
              </div>
              <div className="stat-label">Pour toujours</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL                                   */}
      {/* ============================================ */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-dots">
            {FOUR_DOTS.colors.map((c, i) => (
              <div 
                key={i}
                className="cta-dot junto-dot"
                style={{ background: '#fff', opacity: 0.3 + (i * 0.2) }}
              />
            ))}
          </div>
          
          <h2 className="cta-title">
            Prêt à jouer<br/>ensemble ?
          </h2>
          
          <p className="cta-text">
            Rejoins les joueurs qui ont adopté une nouvelle façon d'organiser.<br/>
            Gratuit, rapide et efficace.
          </p>
          
          <Link href="/auth" className="cta-button">
            Créer ma première partie →
          </Link>
          
          <p className="cta-small">
            Inscription gratuite • Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                      */}
      {/* ============================================ */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span>junto</span>
                <FourDots size={6} gap={3} />
              </div>
              <p>
                L'app qui simplifie l'organisation de tes parties de padel. Fini les galères, place au jeu !
              </p>
            </div>
            <div className="footer-links">
              <h4>Produit</h4>
              <a href="#features">Fonctionnalités</a>
              <a href="#problem">Comment ça marche</a>
            </div>
            <div className="footer-links">
              <h4>Légal</h4>
              <Link href="/terms">Conditions d'utilisation</Link>
              <Link href="/terms">Politique de confidentialité</Link>
            </div>
            <div className="footer-links">
              <h4>Contact</h4>
              <a href="mailto:hello@junto.app">hello@junto.app</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Junto. Fait avec ❤️ pour les joueurs de padel.</p>
          </div>
        </div>
      </footer>

      {/* ============================================ */}
      {/* STYLES                                      */}
      {/* ============================================ */}
      <style jsx global>{`
        /* ========================================
           BASE & RESET
           ======================================== */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .landing-page {
          min-height: 100vh;
          font-family: 'Satoshi', -apple-system, sans-serif;
          background: ${COLORS.white};
          overflow-x: hidden;
          color: ${COLORS.ink};
        }

        /* ========================================
           ANIMATIONS
           ======================================== */
        @keyframes junto-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        
        @keyframes float {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(-2deg) translateY(-10px); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 90, 95, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 90, 95, 0.5); }
        }
        
        @keyframes msgAppear {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .junto-dot {
          animation: junto-breathe 3s ease-in-out infinite;
        }
        .junto-dot:nth-child(1) { animation-delay: 0s; }
        .junto-dot:nth-child(2) { animation-delay: 0.15s; }
        .junto-dot:nth-child(3) { animation-delay: 0.3s; }
        .junto-dot:nth-child(4) { animation-delay: 0.45s; }

        /* ========================================
           NAVBAR
           ======================================== */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s ease;
        }
        
        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid ${COLORS.border};
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: ${COLORS.ink};
          letter-spacing: -1px;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        
        .nav-links a {
          color: ${COLORS.gray};
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .nav-links a:hover {
          color: ${COLORS.ink};
        }
        
        .nav-cta {
          padding: 12px 24px !important;
          background: ${COLORS.primary} !important;
          color: ${COLORS.white} !important;
          border-radius: 100px;
          font-weight: 600 !important;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        
        .nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${COLORS.primaryGlow};
        }
        
        .mobile-cta {
          display: none;
          padding: 10px 20px;
          background: ${COLORS.primary};
          color: ${COLORS.white};
          border-radius: 100px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        /* ========================================
           HERO
           ======================================== */
        .hero-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 60px;
          background: linear-gradient(180deg, ${COLORS.bgSoft} 0%, ${COLORS.white} 100%);
          position: relative;
        }
        
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: ${COLORS.primarySoft};
          color: ${COLORS.primary};
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        .hero-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          color: ${COLORS.ink};
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -2px;
        }
        
        .hero-title .highlight {
          color: ${COLORS.primary};
        }
        
        .hero-subtitle {
          font-size: 20px;
          color: ${COLORS.gray};
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 480px;
        }
        
        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        
        .btn-primary {
          padding: 18px 36px;
          background: ${COLORS.primary};
          color: ${COLORS.white};
          border-radius: 100px;
          text-decoration: none;
          font-size: 17px;
          font-weight: 700;
          box-shadow: 0 4px 20px ${COLORS.primaryGlow};
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px ${COLORS.primaryGlow};
        }
        
        .btn-secondary {
          padding: 18px 36px;
          background: ${COLORS.white};
          color: ${COLORS.ink};
          border-radius: 100px;
          text-decoration: none;
          font-size: 17px;
          font-weight: 600;
          border: 2px solid ${COLORS.border};
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-secondary:hover {
          border-color: ${COLORS.primary};
          color: ${COLORS.primary};
        }
        
        .play-icon {
          font-size: 14px;
        }
        
        .hero-proof {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        
        .hero-proof span {
          font-size: 14px;
          color: ${COLORS.gray};
          font-weight: 500;
        }
        
        /* Hero Visual */
        .hero-visual {
          position: relative;
        }
        
        .hero-card {
          background: ${COLORS.white};
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
          border: 1px solid ${COLORS.border};
          transform: rotate(-2deg);
          animation: float 6s ease-in-out infinite;
        }
        
        .card-accent {
          height: 4px;
          background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber});
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        
        .card-title {
          font-size: 22px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin-bottom: 4px;
        }
        
        .card-time {
          font-size: 15px;
          color: ${COLORS.primary};
          font-weight: 600;
        }
        
        .card-badge {
          background: ${COLORS.teal};
          color: ${COLORS.white};
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .badge-dot {
          width: 6px;
          height: 6px;
          background: ${COLORS.white};
          border-radius: 50%;
        }
        
        .card-location {
          background: ${COLORS.bgSoft};
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 14px;
          color: ${COLORS.gray};
          margin-bottom: 20px;
        }
        
        .card-players {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .players-stack {
          display: flex;
        }
        
        .player-avatar-small {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid ${COLORS.white};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${COLORS.white};
          font-weight: 700;
          font-size: 14px;
          margin-left: -12px;
        }
        
        .player-avatar-small:first-child {
          margin-left: 0;
        }
        
        .player-avatar-small.empty {
          background: ${COLORS.bgSoft};
          border: 3px dashed ${COLORS.border};
          color: ${COLORS.muted};
          font-size: 20px;
        }
        
        .join-btn {
          background: ${COLORS.primary};
          color: ${COLORS.white};
          border: none;
          padding: 14px 28px;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Satoshi', sans-serif;
          transition: all 0.3s ease;
        }
        
        .join-btn:hover {
          transform: scale(1.05);
        }
        
        .hero-blob {
          position: absolute;
          border-radius: 50%;
          z-index: -1;
        }
        
        .hero-blob-1 {
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          background: ${COLORS.primarySoft};
          opacity: 0.6;
        }
        
        .hero-blob-2 {
          bottom: -30px;
          left: -30px;
          width: 80px;
          height: 80px;
          background: ${COLORS.tealSoft};
          opacity: 0.6;
        }
        
        .floating-badge {
          position: absolute;
          background: ${COLORS.white};
          padding: 10px 16px;
          border-radius: 100px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          animation: bounce 3s ease-in-out infinite;
        }
        
        .floating-badge-1 {
          top: 20%;
          right: -20px;
          animation-delay: 0s;
        }
        
        .floating-badge-2 {
          bottom: 30%;
          left: -30px;
          animation-delay: 1.5s;
        }
        
        .fb-icon {
          width: 24px;
          height: 24px;
          background: ${COLORS.tealSoft};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        
        /* Scroll indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: ${COLORS.gray};
          font-size: 13px;
          font-weight: 500;
          animation: bounce 2s ease-in-out infinite;
        }
        
        .scroll-arrow {
          font-size: 20px;
          opacity: 0.5;
        }

        /* ========================================
           PROBLEM SECTION
           ======================================== */
        .problem-section {
          padding: 120px 24px;
          background: ${COLORS.white};
        }
        
        .problem-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .problem-header {
          text-align: center;
          margin-bottom: 80px;
        }
        
        .section-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          color: ${COLORS.ink};
          letter-spacing: -2px;
          line-height: 1.2;
        }
        
        .section-title .strike {
          text-decoration: line-through;
          text-decoration-color: ${COLORS.primary};
          text-decoration-thickness: 4px;
        }
        
        .problem-comparison {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
        }
        
        .comparison-card {
          flex: 1;
          max-width: 400px;
        }
        
        .comparison-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: 700;
        }
        
        .label-icon {
          font-size: 28px;
        }
        
        /* WhatsApp Chaos */
        .whatsapp-chaos {
          background: #e5ddd5;
          border-radius: 20px;
          padding: 20px;
          min-height: 360px;
        }
        
        .whatsapp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
        }
        
        .whatsapp-title {
          font-weight: 700;
          font-size: 15px;
          color: #075e54;
        }
        
        .whatsapp-count {
          font-size: 12px;
          color: #888;
          background: #fff;
          padding: 4px 10px;
          border-radius: 100px;
        }
        
        .whatsapp-messages {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .whatsapp-msg {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          animation: msgAppear 0.4s ease-out both;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .whatsapp-msg.sent {
          align-self: flex-end;
          background: #dcf8c6;
          border-bottom-right-radius: 4px;
        }
        
        .whatsapp-msg.received {
          align-self: flex-start;
          background: #fff;
          border-bottom-left-radius: 4px;
        }
        
        .whatsapp-msg.alert {
          background: #ffebee;
          border: 1px solid #ffcdd2;
        }
        
        .whatsapp-msg small {
          font-size: 11px;
          color: #888;
          align-self: flex-end;
        }
        
        .whatsapp-frustration {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px dashed rgba(0, 0, 0, 0.2);
          color: #888;
          font-size: 14px;
          font-style: italic;
        }
        
        .whatsapp-frustration span:first-child {
          font-size: 24px;
        }
        
        /* Comparison Arrow */
        .comparison-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .arrow-line {
          width: 2px;
          height: 40px;
          background: linear-gradient(180deg, ${COLORS.border}, ${COLORS.primary});
        }
        
        .arrow-dots {
          display: flex;
          gap: 6px;
        }
        
        .arrow-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        /* Junto Solution */
        .junto-solution {
          background: ${COLORS.white};
          border-radius: 20px;
          padding: 20px;
          border: 2px solid ${COLORS.border};
          min-height: 360px;
          display: flex;
          flex-direction: column;
        }
        
        .solution-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .solution-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 18px;
        }
        
        .solution-badge {
          background: ${COLORS.tealSoft};
          color: ${COLORS.teal};
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
        }
        
        .solution-card {
          background: ${COLORS.bgSoft};
          border-radius: 16px;
          overflow: hidden;
          flex: 1;
        }
        
        .solution-accent {
          height: 4px;
          background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber});
        }
        
        .solution-content {
          padding: 16px;
        }
        
        .solution-title {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .solution-meta {
          font-size: 13px;
          color: ${COLORS.gray};
          margin-bottom: 16px;
        }
        
        .solution-players {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .solution-player {
          display: flex;
          align-items: center;
          gap: 12px;
          background: ${COLORS.white};
          padding: 10px 12px;
          border-radius: 12px;
          animation: slideIn 0.4s ease-out both;
        }
        
        .solution-player:nth-child(1) { animation-delay: 0.1s; }
        .solution-player:nth-child(2) { animation-delay: 0.2s; }
        .solution-player:nth-child(3) { animation-delay: 0.3s; }
        .solution-player:nth-child(4) { animation-delay: 0.4s; }
        
        .solution-player.empty {
          border: 2px dashed ${COLORS.border};
          background: transparent;
        }
        
        .sp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
        }
        
        .sp-avatar.empty {
          background: ${COLORS.bgSoft};
          color: ${COLORS.muted};
          border: 2px dashed ${COLORS.border};
        }
        
        .sp-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .sp-name {
          font-weight: 600;
          font-size: 13px;
        }
        
        .sp-level {
          font-size: 11px;
          color: ${COLORS.gray};
        }
        
        .sp-badge {
          background: ${COLORS.tealSoft};
          color: ${COLORS.teal};
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
        }
        
        .sp-join {
          background: ${COLORS.primary};
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Satoshi', sans-serif;
        }
        
        .solution-result {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid ${COLORS.border};
          color: ${COLORS.teal};
          font-weight: 600;
          font-size: 14px;
        }
        
        .result-icon {
          font-size: 20px;
        }

        /* ========================================
           FEATURES SECTION
           ======================================== */
        .features-section {
          padding: 120px 24px;
          background: ${COLORS.bgSoft};
        }
        
        .features-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .features-header {
          text-align: center;
          margin-bottom: 64px;
        }
        
        .features-dots {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .feature-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .section-subtitle {
          font-size: 18px;
          color: ${COLORS.gray};
          margin-top: 16px;
        }
        
        .gradient-text {
          background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        
        .feature-card {
          background: ${COLORS.white};
          border-radius: 24px;
          padding: 32px 24px;
          border: 2px solid ${COLORS.border};
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .feature-card:hover,
        .feature-card.active {
          border-color: var(--accent-color);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }
        
        .feature-number {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          opacity: 0.6;
        }
        
        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }
        
        .feature-title {
          font-size: 18px;
          font-weight: 700;
          color: ${COLORS.ink};
          margin-bottom: 10px;
          line-height: 1.3;
        }
        
        .feature-desc {
          font-size: 14px;
          color: ${COLORS.gray};
          line-height: 1.6;
        }
        
        .feature-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        
        .feature-card:hover .feature-bar,
        .feature-card.active .feature-bar {
          transform: scaleX(1);
        }

        /* ========================================
           COURT SECTION
           ======================================== */
        .court-section {
          padding: 120px 24px;
          background: ${COLORS.ink};
          color: ${COLORS.white};
        }
        
        .court-container {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        
        .section-title.light {
          color: ${COLORS.white};
        }
        
        .section-subtitle.light {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .gradient-text-light {
          background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .court-tagline {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 18px;
          font-weight: 600;
        }
        
        /* Padel Court Animation */
        .padel-court-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .padel-court {
          aspect-ratio: 4/3;
          background: linear-gradient(180deg, #1a472a 0%, #2d5a3f 100%);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          border: 3px solid #3d6b4f;
        }
        
        .court-surface {
          position: absolute;
          inset: 20px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
        }
        
        .court-line {
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
        }
        
        .court-line-center {
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
        }
        
        .court-line-service-left {
          top: 30%;
          bottom: 30%;
          left: 50%;
          width: 2px;
          transform: translateX(-50%);
        }
        
        .court-net {
          position: absolute;
          top: 50%;
          left: -10px;
          right: -10px;
          height: 6px;
          background: #333;
          transform: translateY(-50%);
        }
        
        .court-players {
          position: absolute;
          inset: 0;
        }
        
        .court-player {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0;
          transform: scale(0);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .court-player.visible {
          opacity: 1;
          transform: scale(1);
        }
        
        .court-player-1 { top: 20%; left: 25%; }
        .court-player-2 { top: 20%; right: 25%; }
        .court-player-3 { bottom: 20%; left: 25%; }
        .court-player-4 { bottom: 20%; right: 25%; }
        
        .player-dot {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          border: 3px solid #fff;
          transition: box-shadow 0.3s ease;
        }
        
        .player-label {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          background: rgba(0, 0, 0, 0.5);
          padding: 4px 10px;
          border-radius: 100px;
        }
        
        .court-counter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .counter-dots {
          display: flex;
          gap: 8px;
        }
        
        .counter-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .counter-text {
          font-size: 16px;
          font-weight: 600;
          color: ${COLORS.white};
        }

        /* ========================================
           STATS SECTION
           ======================================== */
        .stats-section {
          padding: 80px 24px;
          background: ${COLORS.white};
        }
        
        .stats-container {
          max-width: 900px;
          margin: 0 auto;
        }
        
        .stats-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: clamp(48px, 8vw, 72px);
          font-weight: 900;
          letter-spacing: -3px;
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 15px;
          color: ${COLORS.gray};
          font-weight: 500;
        }
        
        .stat-divider {
          width: 1px;
          height: 60px;
          background: ${COLORS.border};
        }

        /* ========================================
           CTA SECTION
           ======================================== */
        .cta-section {
          padding: 120px 24px;
          background: ${COLORS.primary};
          color: ${COLORS.white};
          text-align: center;
        }
        
        .cta-container {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .cta-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .cta-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }
        
        .cta-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        
        .cta-text {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: 40px;
          line-height: 1.6;
        }
        
        .cta-button {
          display: inline-block;
          padding: 20px 48px;
          background: ${COLORS.white};
          color: ${COLORS.primary};
          border-radius: 100px;
          text-decoration: none;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .cta-button:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
        }
        
        .cta-small {
          margin-top: 20px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
        }

        /* ========================================
           FOOTER
           ======================================== */
        .footer {
          padding: 64px 24px 32px;
          background: ${COLORS.ink};
          color: ${COLORS.muted};
        }
        
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }
        
        .footer-brand {
          max-width: 280px;
        }
        
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 20px;
          font-weight: 700;
          color: ${COLORS.white};
        }
        
        .footer-brand p {
          font-size: 14px;
          line-height: 1.7;
        }
        
        .footer-links h4 {
          color: ${COLORS.white};
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .footer-links a {
          display: block;
          color: ${COLORS.muted};
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        
        .footer-links a:hover {
          color: ${COLORS.white};
        }
        
        .footer-bottom {
          border-top: 1px solid ${COLORS.secondary};
          padding-top: 24px;
          text-align: center;
        }
        
        .footer-bottom p {
          font-size: 13px;
        }

        /* ========================================
           RESPONSIVE
           ======================================== */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .court-container {
            grid-template-columns: 1fr;
            gap: 48px;
            text-align: center;
          }
          
          .court-tagline {
            justify-content: center;
          }
        }
        
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .mobile-cta { display: block; }
          
          .hero-container {
            grid-template-columns: 1fr;
            gap: 48px;
            text-align: center;
          }
          
          .hero-text { order: 1; }
          .hero-visual { order: 2; }
          
          .hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
          
          .hero-actions {
            justify-content: center;
          }
          
          .hero-proof {
            justify-content: center;
          }
          
          .floating-badge {
            display: none;
          }
          
          .problem-comparison {
            flex-direction: column;
            gap: 24px;
          }
          
          .comparison-card {
            max-width: 100%;
          }
          
          .comparison-arrow {
            flex-direction: row;
            transform: rotate(90deg);
          }
          
          .arrow-line {
            width: 40px;
            height: 2px;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .features-dots {
            gap: 12px;
          }
          
          .stats-grid {
            flex-direction: column;
            gap: 32px;
          }
          
          .stat-divider {
            width: 60px;
            height: 1px;
          }
          
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            text-align: center;
          }
          
          .footer-brand {
            max-width: 100%;
          }
          
          .footer-logo {
            justify-content: center;
          }
          
          .scroll-indicator {
            display: none;
          }
        }
        
        @media (max-width: 480px) {
          .hero-title {
            font-size: 32px;
          }
          
          .section-title {
            font-size: 28px;
          }
          
          .btn-primary,
          .btn-secondary {
            padding: 16px 28px;
            font-size: 15px;
          }
          
          .whatsapp-chaos,
          .junto-solution {
            min-height: 320px;
          }
        }
      `}</style>
    </div>
  )
}