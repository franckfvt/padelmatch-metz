import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fff'
    }}>
      
      {/* Navigation - épurée */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        maxWidth: 1100,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🎾</span>
          <span style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
        </div>
        <Link href="/auth" style={{
          padding: '10px 20px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: '600'
        }}>
          Se connecter
        </Link>
      </nav>

      {/* Hero - simplifié, plus de respiration */}
      <section style={{
        padding: '80px 40px 100px',
        textAlign: 'center',
        maxWidth: 700,
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 64px)',
          fontWeight: '700',
          color: '#1a1a1a',
          lineHeight: 1.1,
          marginBottom: 20,
          letterSpacing: '-0.02em'
        }}>
          Trouve des joueurs<br />
          <span style={{ color: '#2e7d32' }}>de ton niveau</span>
        </h1>
        
        <p style={{
          fontSize: 18,
          color: '#666',
          maxWidth: 480,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Crée ta partie, partage le lien, et joue avec des joueurs 
          qui te correspondent. Simple.
        </p>
        
        {/* UN seul CTA principal */}
        <Link href="/auth" style={{
          display: 'inline-block',
          padding: '16px 40px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 12,
          textDecoration: 'none',
          fontSize: 16,
          fontWeight: '600'
        }}>
          Commencer gratuitement
        </Link>
        
        <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>
          Gratuit • Sans pub • Made in France 🇫🇷
        </p>
      </section>

      {/* Features - 3 colonnes épurées */}
      <section style={{
        padding: '80px 40px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 40
          }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
                Matchmaking par niveau
              </h3>
              <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
                Chaque joueur indique son niveau. Tu sais avec qui tu vas jouer avant de t'inscrire.
              </p>
            </div>
            
            <div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⭐</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
                Score de fiabilité
              </h3>
              <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
                Fini les annulations de dernière minute. Les joueurs fiables sont récompensés.
              </p>
            </div>
            
            <div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>📱</div>
              <h3 style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 }}>
                Partage en 1 clic
              </h3>
              <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
                Crée ta partie, copie le lien, et partage-le où tu veux. C'est tout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche - simplifié */}
      <section style={{
        padding: '80px 40px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: 48
          }}>
            Comment ça marche
          </h2>
          
          <div style={{ textAlign: 'left' }}>
            {[
              { num: '1', title: 'Crée ta partie', desc: 'Club, date, heure. C\'est tout ce dont tu as besoin.' },
              { num: '2', title: 'Partage le lien', desc: 'WhatsApp, Facebook, SMS... où tu veux.' },
              { num: '3', title: 'Les joueurs s\'inscrivent', desc: 'Ils voient les détails et rejoignent en 1 clic.' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 20,
                marginBottom: i < 2 ? 32 : 0,
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: 16,
                  flexShrink: 0
                }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 15, color: '#666', margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exemple de carte joueur - une seule */}
      <section style={{
        padding: '80px 40px',
        background: '#1a1a1a'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Chaque joueur a un profil
          </h2>
          <p style={{
            fontSize: 16,
            color: '#888',
            textAlign: 'center',
            marginBottom: 48
          }}>
            Tu sais exactement avec qui tu joues
          </p>
          
          {/* UNE seule carte, centrée */}
          <div style={{
            maxWidth: 320,
            margin: '0 auto',
            background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
            borderRadius: 20,
            padding: 24,
            color: '#fff'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎾</span>
                <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
              </div>
              <div style={{
                background: 'rgba(74, 222, 128, 0.2)',
                color: '#4ade80',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: '600'
              }}>
                ✓ 98%
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}>
                👨
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: '700', margin: 0 }}>Thomas</h3>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Metz • Revers à 2 mains</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: '#fbbf24',
                color: '#1a1a1a',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: '700'
              }}>
                ⭐ 6/10
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 13
              }}>
                ⚡ Équilibré
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final - simplifié */}
      <section style={{
        padding: '80px 40px',
        background: '#2e7d32',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#fff',
            marginBottom: 16
          }}>
            Prêt à jouer ?
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: 32
          }}>
            Crée ton profil en 30 secondes.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '16px 40px',
            background: '#fff',
            color: '#2e7d32',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: '700'
          }}>
            Créer mon profil
          </Link>
        </div>
      </section>

      {/* Footer - minimal */}
      <footer style={{
        padding: '32px 40px',
        background: '#1a1a1a',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <span style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>PadelMatch</span>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          © 2024 PadelMatch
        </p>
      </footer>
    </div>
  )
}