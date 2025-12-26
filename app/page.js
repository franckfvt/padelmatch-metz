'use client'

/**
 * ============================================
 * LANDING PAGE 2×2 - STORYTELLING APPROACH
 * ============================================
 * 
 * Arc narratif :
 * 1. Ouverture - Le padel se joue à 4
 * 2. Le problème - Trouver le 4ème
 * 3. La révélation - Et si c'était simple ?
 * 4. La preuve - Crée, Partage, Joue
 * 5. L'invitation - La partie t'attend
 * 
 * Design : Dark → Light → Dark
 * Animations : Intersection Observer
 * 
 * ============================================
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// === 2×2 DESIGN TOKENS ===
const COLORS = {
  p1: '#ff5a5f',  // Coral
  p2: '#ffb400',  // Amber
  p3: '#00b8a9',  // Teal
  p4: '#7c5cff',  // Violet
  
  ink: '#0a0a0a',
  dark: '#141414',
  gray: '#6b7280',
  muted: '#9ca3af',
  light: '#fafafa',
  white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

// === HOOK: Intersection Observer pour animations ===
function useInView(options = {}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        if (options.once !== false) {
          observer.unobserve(entry.target)
        }
      } else if (options.once === false) {
        setIsInView(false)
      }
    }, { threshold: options.threshold || 0.2, rootMargin: options.rootMargin || '0px' })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, isInView]
}

// === COMPOSANT: Les 4 dots ===
function FourDots({ size = 12, gap = 6, animate = false, missingFourth = false, className = '' }) {
  return (
    <div className={`four-dots ${className}`} style={{ display: 'flex', gap }}>
      {PLAYER_COLORS.map((c, i) => (
        <div 
          key={i} 
          className={`dot ${animate ? 'animate' : ''} ${missingFourth && i === 3 ? 'missing' : ''}`}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: Math.max(3, size * 0.3),
            background: c,
            animationDelay: `${i * 0.15}s`
          }} 
        />
      ))}
    </div>
  )
}

// === COMPOSANT: Section avec animation ===
function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, isInView] = useInView({ threshold: 0.3 })
  
  return (
    <div 
      ref={ref} 
      className={`animated-section ${className} ${isInView ? 'in-view' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// === PAGE PRINCIPALE ===
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing">
      
      {/* ================================================ */}
      {/* ACTE 1 : L'OUVERTURE                            */}
      {/* ================================================ */}
      <section className="act act-1">
        <div className="act-content">
          <AnimatedSection>
            <div className="logo-large">
              <span className="logo-text">2×2</span>
              <FourDots size={16} gap={8} animate className="logo-dots" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={400}>
            <h1 className="headline-main">
              Le padel se joue à 4.
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={600}>
            <p className="headline-sub">Toujours.</p>
          </AnimatedSection>

          <div className="scroll-indicator">
            <div className="scroll-line" />
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* ACTE 2 : LE PROBLÈME                            */}
      {/* ================================================ */}
      <section className="act act-2">
        <div className="act-content">
          <AnimatedSection>
            <h2 className="headline-problem">
              Mais trouver le 4ème...
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="dots-problem">
              <FourDots size={24} gap={12} missingFourth />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <div className="messages-chaos">
              <div className="message msg-1">"Dispo demain ?"</div>
              <div className="message msg-2">"Finalement non"</div>
              <div className="message msg-3">"Et toi Pierre ?"</div>
              <div className="message msg-4 seen">Pierre a vu le message.</div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={600}>
            <div className="stat-pain">
              <span className="stat-number">47</span>
              <span className="stat-label">messages en moyenne<br/>pour organiser une partie</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================ */}
      {/* TRANSITION : Dark to Light                       */}
      {/* ================================================ */}
      <section className="transition-section">
        <div className="transition-content">
          <AnimatedSection>
            <p className="transition-text">Et si on arrêtait ?</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================ */}
      {/* ACTE 3 : LA RÉVÉLATION                          */}
      {/* ================================================ */}
      <section className="act act-3">
        <div className="act-content">
          <AnimatedSection>
            <h2 className="headline-reveal">
              Et si c'était simple ?
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="logo-reveal">
              <span className="logo-text-dark">2×2</span>
              <FourDots size={20} gap={10} animate className="logo-dots-reveal" />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={500}>
            <div className="reveal-statement">
              <p>Un lien.</p>
              <p>Quatre joueurs.</p>
              <p className="highlight">C'est fait.</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================ */}
      {/* ACTE 4 : LA PREUVE                              */}
      {/* ================================================ */}
      <section className="act act-4">
        <div className="act-content">
          
          {/* Étape 1: Crée */}
          <div className="proof-step">
            <AnimatedSection>
              <div className="step-number">
                <div className="step-dot" style={{ background: COLORS.p1 }} />
              </div>
              <h3 className="step-title">Crée</h3>
              <p className="step-desc">
                Date, lieu, niveau.<br/>
                30 secondes.
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <div className="step-visual visual-create">
                <div className="mini-card">
                  <div className="mini-card-header">
                    <span>🎾</span>
                    <span>Samedi 15h</span>
                  </div>
                  <div className="mini-card-body">
                    <div className="mini-location">Padel Club Metz</div>
                    <div className="mini-slots">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="mini-slot" style={{ 
                          background: i === 0 ? COLORS.p1 : 'rgba(0,0,0,0.1)',
                          borderRadius: 4
                        }}>
                          {i === 0 && <span style={{ color: '#fff', fontSize: 10 }}>T</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Étape 2: Partage */}
          <div className="proof-step">
            <AnimatedSection>
              <div className="step-number">
                <div className="step-dot" style={{ background: COLORS.p2 }} />
              </div>
              <h3 className="step-title">Partage</h3>
              <p className="step-desc">
                WhatsApp, SMS, où tu veux.<br/>
                Un seul lien.
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <div className="step-visual visual-share">
                <div className="share-link">
                  <span className="link-text">2x2.app/join/abc123</span>
                  <div className="share-icons">
                    <div className="share-icon" style={{ background: '#25D366' }}>💬</div>
                    <div className="share-icon" style={{ background: COLORS.p3 }}>📱</div>
                    <div className="share-icon" style={{ background: COLORS.p4 }}>📧</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Étape 3: Joue */}
          <div className="proof-step">
            <AnimatedSection>
              <div className="step-number">
                <div className="step-dot" style={{ background: COLORS.p3 }} />
              </div>
              <h3 className="step-title">Joue</h3>
              <p className="step-desc">
                Ils cliquent, ils rejoignent.<br/>
                Toi, tu joues.
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={200}>
              <div className="step-visual visual-play">
                <div className="court-mini">
                  <div className="court-net" />
                  <div className="court-players">
                    {PLAYER_COLORS.map((c, i) => (
                      <div 
                        key={i} 
                        className="court-player"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="complete-badge">Complet ✓</div>
              </div>
            </AnimatedSection>
          </div>

        </div>
      </section>

      {/* ================================================ */}
      {/* FEATURES : Résumé sobre                         */}
      {/* ================================================ */}
      <section className="act act-features">
        <div className="act-content">
          <AnimatedSection>
            <h2 className="features-title">Tout ce qu'il faut.<br/>Rien de plus.</h2>
          </AnimatedSection>

          <div className="features-list">
            {[
              { icon: '📅', title: 'Parties flexibles', desc: 'Date précise ou "dispo cette semaine"' },
              { icon: '👥', title: 'Ton réseau', desc: 'Retrouve tes partenaires favoris' },
              { icon: '💬', title: 'Chat intégré', desc: 'Discute avec ton groupe' },
              { icon: '📊', title: 'Tes stats', desc: 'Suis ta progression' },
              { icon: '🔔', title: 'Rappels', desc: 'Ne rate plus jamais une partie' },
              { icon: '🆓', title: 'Gratuit', desc: 'Pour toujours. Promis.' },
            ].map((f, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="feature-item">
                  <span className="feature-icon">{f.icon}</span>
                  <div className="feature-text">
                    <span className="feature-title">{f.title}</span>
                    <span className="feature-desc">{f.desc}</span>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* ACTE 5 : L'INVITATION                           */}
      {/* ================================================ */}
      <section className="act act-5">
        <div className="act-content">
          <AnimatedSection>
            <FourDots size={20} gap={10} animate className="final-dots" />
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <h2 className="headline-final">
              La partie t'attend.
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <Link href="/auth" className="cta-main">
              Rejoindre 2×2
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={600}>
            <p className="cta-sub">Gratuit. Pour toujours.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* ================================================ */}
      {/* FOOTER MINIMAL                                  */}
      {/* ================================================ */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span>2×2</span>
            <FourDots size={8} gap={4} />
          </div>
          <div className="footer-links">
            <Link href="/terms">CGU</Link>
            <a href="mailto:contact@2x2.app">Contact</a>
            <a href="https://instagram.com/2x2padel" target="_blank" rel="noopener">Instagram</a>
          </div>
          <p className="footer-copy">Made with 🎾 in France</p>
        </div>
      </footer>

      {/* ================================================ */}
      {/* STYLES                                          */}
      {/* ================================================ */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* Animations */
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes scrollLine {
          0% { transform: translateY(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }

        .dot.animate {
          animation: breathe 3s ease-in-out infinite;
        }

        .dot.missing {
          animation: pulse 1.5s ease-in-out infinite;
          opacity: 0.3;
        }
      `}</style>

      <style jsx>{`
        .landing {
          background: ${COLORS.ink};
          color: ${COLORS.white};
        }

        /* Animated sections */
        .animated-section {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .animated-section.in-view {
          opacity: 1;
          transform: translateY(0);
        }

        /* Acts base */
        .act {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }

        .act-content {
          max-width: 800px;
          width: 100%;
          text-align: center;
        }

        /* ========== ACTE 1 ========== */
        .act-1 {
          min-height: 100vh;
          background: ${COLORS.ink};
          position: relative;
        }

        .logo-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-bottom: 60px;
        }

        .logo-text {
          font-size: clamp(64px, 15vw, 120px);
          font-weight: 900;
          letter-spacing: -4px;
          color: ${COLORS.white};
        }

        .logo-dots {
          justify-content: center;
        }

        .headline-main {
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 16px;
          color: ${COLORS.white};
        }

        .headline-sub {
          font-size: clamp(20px, 4vw, 32px);
          color: ${COLORS.muted};
          font-weight: 400;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
        }

        .scroll-line {
          width: 2px;
          height: 40px;
          background: linear-gradient(to bottom, ${COLORS.white}, transparent);
          animation: scrollLine 2s ease-in-out infinite;
        }

        /* ========== ACTE 2 ========== */
        .act-2 {
          background: ${COLORS.dark};
        }

        .headline-problem {
          font-size: clamp(24px, 5vw, 40px);
          font-weight: 700;
          margin-bottom: 40px;
          color: ${COLORS.white};
        }

        .dots-problem {
          display: flex;
          justify-content: center;
          margin-bottom: 50px;
        }

        .messages-chaos {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 300px;
          margin: 0 auto 50px;
        }

        .message {
          background: rgba(255,255,255,0.1);
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 14px;
          color: ${COLORS.white};
          opacity: 0.9;
        }

        .message.msg-1 { align-self: flex-end; }
        .message.msg-2 { align-self: flex-start; background: rgba(255,90,95,0.2); }
        .message.msg-3 { align-self: flex-end; }
        .message.msg-4 { 
          align-self: flex-start; 
          background: transparent;
          color: ${COLORS.muted};
          font-style: italic;
          font-size: 13px;
          padding-left: 0;
        }

        .stat-pain {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stat-number {
          font-size: clamp(48px, 10vw, 80px);
          font-weight: 900;
          color: ${COLORS.p1};
        }

        .stat-label {
          font-size: 14px;
          color: ${COLORS.muted};
          text-align: center;
          line-height: 1.5;
        }

        /* ========== TRANSITION ========== */
        .transition-section {
          min-height: 50vh;
          background: linear-gradient(to bottom, ${COLORS.dark}, ${COLORS.light});
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .transition-text {
          font-size: clamp(20px, 4vw, 32px);
          color: ${COLORS.ink};
          font-weight: 500;
        }

        /* ========== ACTE 3 ========== */
        .act-3 {
          background: ${COLORS.light};
          color: ${COLORS.ink};
        }

        .headline-reveal {
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 700;
          margin-bottom: 50px;
          color: ${COLORS.ink};
        }

        .logo-reveal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 50px;
        }

        .logo-text-dark {
          font-size: clamp(48px, 12vw, 80px);
          font-weight: 900;
          letter-spacing: -3px;
          color: ${COLORS.ink};
        }

        .reveal-statement p {
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 500;
          margin-bottom: 12px;
          color: ${COLORS.gray};
        }

        .reveal-statement .highlight {
          color: ${COLORS.ink};
          font-weight: 700;
          font-size: clamp(24px, 5vw, 36px);
        }

        /* ========== ACTE 4 ========== */
        .act-4 {
          background: ${COLORS.white};
          color: ${COLORS.ink};
          padding: 100px 24px;
        }

        .act-4 .act-content {
          max-width: 1000px;
        }

        .proof-step {
          margin-bottom: 100px;
        }

        .proof-step:last-child {
          margin-bottom: 0;
        }

        .step-number {
          margin-bottom: 20px;
        }

        .step-dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
          margin: 0 auto;
        }

        .step-title {
          font-size: clamp(32px, 7vw, 56px);
          font-weight: 900;
          margin-bottom: 16px;
          color: ${COLORS.ink};
        }

        .step-desc {
          font-size: clamp(16px, 3vw, 20px);
          color: ${COLORS.gray};
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .step-visual {
          display: flex;
          justify-content: center;
        }

        /* Visual: Create */
        .mini-card {
          background: ${COLORS.light};
          border-radius: 16px;
          padding: 20px;
          width: 240px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .mini-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 600;
        }

        .mini-card-body {}

        .mini-location {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 12px;
        }

        .mini-slots {
          display: flex;
          gap: 8px;
        }

        .mini-slot {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Visual: Share */
        .share-link {
          background: ${COLORS.light};
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .link-text {
          font-family: monospace;
          font-size: 14px;
          color: ${COLORS.gray};
          background: ${COLORS.white};
          padding: 10px 16px;
          border-radius: 8px;
        }

        .share-icons {
          display: flex;
          gap: 12px;
        }

        .share-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        /* Visual: Play */
        .visual-play {
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .court-mini {
          width: 200px;
          height: 120px;
          background: ${COLORS.ink};
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .court-net {
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: rgba(255,255,255,0.3);
        }

        .court-players {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px 80px;
        }

        .court-player {
          width: 24px;
          height: 24px;
          border-radius: 7px;
        }

        .complete-badge {
          background: ${COLORS.p3};
          color: ${COLORS.white};
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }

        /* ========== STATS ========== */
        .act-stats {
          background: ${COLORS.light};
          color: ${COLORS.ink};
          min-height: auto;
          padding: 80px 24px;
        }

        .stats-intro {
          font-size: 14px;
          color: ${COLORS.muted};
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 40px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          max-width: 600px;
          margin: 0 auto;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stat-value {
          font-size: clamp(32px, 7vw, 48px);
          font-weight: 900;
          color: ${COLORS.ink};
        }

        .stat-label-small {
          font-size: 13px;
          color: ${COLORS.gray};
          text-align: center;
        }

        /* ========== FEATURES ========== */
        .act-features {
          background: ${COLORS.white};
          color: ${COLORS.ink};
          min-height: auto;
          padding: 100px 24px;
        }

        .features-title {
          font-size: clamp(24px, 5vw, 36px);
          font-weight: 700;
          margin-bottom: 60px;
          line-height: 1.3;
        }

        .features-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          max-width: 600px;
          margin: 0 auto;
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: ${COLORS.light};
          border-radius: 16px;
        }

        .feature-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feature-title {
          font-weight: 600;
          font-size: 15px;
          color: ${COLORS.ink};
        }

        .feature-desc {
          font-size: 13px;
          color: ${COLORS.gray};
        }

        /* ========== ACTE 5 ========== */
        .act-5 {
          background: ${COLORS.ink};
          color: ${COLORS.white};
          min-height: 80vh;
        }

        .final-dots {
          justify-content: center;
          margin-bottom: 40px;
        }

        .headline-final {
          font-size: clamp(32px, 7vw, 56px);
          font-weight: 700;
          margin-bottom: 40px;
        }

        .cta-main {
          display: inline-block;
          padding: 20px 48px;
          background: ${COLORS.white};
          color: ${COLORS.ink};
          font-size: 18px;
          font-weight: 700;
          text-decoration: none;
          border-radius: 100px;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .cta-main:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(255,255,255,0.2);
        }

        .cta-sub {
          margin-top: 24px;
          color: ${COLORS.muted};
          font-size: 14px;
        }

        /* ========== FOOTER ========== */
        .footer {
          background: ${COLORS.ink};
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 40px 24px;
        }

        .footer-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
          font-size: 24px;
          font-weight: 900;
          color: ${COLORS.white};
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 24px;
        }

        .footer-links a {
          color: ${COLORS.muted};
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: ${COLORS.white};
        }

        .footer-copy {
          color: ${COLORS.gray};
          font-size: 13px;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }

          .features-list {
            grid-template-columns: 1fr;
          }

          .feature-item {
            padding: 16px;
          }

          .court-players {
            gap: 30px 60px;
          }

          .court-player {
            width: 20px;
            height: 20px;
            border-radius: 6px;
          }
        }

        @media (max-width: 480px) {
          .act {
            padding: 60px 20px;
          }

          .proof-step {
            margin-bottom: 80px;
          }

          .messages-chaos {
            max-width: 260px;
          }

          .message {
            font-size: 13px;
            padding: 10px 14px;
          }

          .cta-main {
            padding: 18px 36px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}