import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fafafa'
    }}>
      
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        maxWidth: 1000,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <span style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
        </div>
        <Link href="/auth" style={{
          padding: '10px 20px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 10,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: '600'
        }}>
          Se connecter
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        maxWidth: 600,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#dcfce7',
          color: '#166534',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 20
        }}>
          🎾 Disponible à Metz
        </div>
        
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: '800',
          color: '#1a1a1a',
          lineHeight: 1.1,
          marginBottom: 16
        }}>
          Trouve des joueurs
          <br />
          <span style={{ color: '#16a34a' }}>de ton niveau</span>
        </h1>
        
        <p style={{
          fontSize: 18,
          color: '#666',
          marginBottom: 32,
          lineHeight: 1.5
        }}>
          Crée ta partie en 15 secondes.
          <br />
          Fini les 47 messages WhatsApp.
        </p>
        
        <Link href="/auth" style={{
          display: 'inline-block',
          padding: '16px 32px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 12,
          textDecoration: 'none',
          fontSize: 16,
          fontWeight: '600'
        }}>
          Commencer gratuitement →
        </Link>
      </section>

      {/* Le problème */}
      <section style={{
        padding: '40px 24px',
        maxWidth: 600,
        margin: '0 auto'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <h2 style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: '#dc2626',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12
          }}>
            ❌ Le problème
          </h2>
          <div style={{
            background: '#f5f5f5',
            borderRadius: 12,
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#666',
            lineHeight: 1.8
          }}>
            <div>Marc: "Qui pour jeudi 18h ?"</div>
            <div>Julie: "Moi si c'est pas trop tard"</div>
            <div>Lucas: "Moi !"</div>
            <div>Marc: "Ok on est 3, il manque 1"</div>
            <div>Julie: "Ah non finalement je peux pas"</div>
            <div>Marc: "..."</div>
            <div style={{ color: '#999' }}>... 47 messages plus tard ...</div>
          </div>
        </div>
      </section>

      {/* La solution */}
      <section style={{
        padding: '0 24px 40px',
        maxWidth: 600,
        margin: '0 auto'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #eee'
        }}>
          <h2 style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: '#16a34a',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12
          }}>
            ✅ Avec PadelMatch
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { emoji: '🎾', text: 'Crée ta partie en 15 sec' },
              { emoji: '🔗', text: 'Partage le lien' },
              { emoji: '👥', text: 'Les joueurs s\'inscrivent' },
              { emoji: '✅', text: 'Tu vois qui vient avec leur niveau' }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: '#f9fafb',
                borderRadius: 10
              }}>
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features clés */}
      <section style={{
        padding: '0 24px 40px',
        maxWidth: 600,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12
        }}>
          {[
            { emoji: '⭐', title: 'Niveau 1-10', desc: 'Plus de "il joue bien ?"' },
            { emoji: '📍', title: 'Droite / Gauche', desc: 'Trouve le bon partenaire' },
            { emoji: '💰', title: 'Paiement facile', desc: 'Fini de courir après l\'argent' },
            { emoji: '✅', title: 'Score fiabilité', desc: 'Évite les lapins' }
          ].map((f, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              border: '1px solid #eee',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.emoji}</div>
              <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{
        padding: '40px 24px 60px',
        textAlign: 'center'
      }}>
        <Link href="/auth" style={{
          display: 'inline-block',
          padding: '18px 40px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 12,
          textDecoration: 'none',
          fontSize: 16,
          fontWeight: '600'
        }}>
          🎾 Créer ma première partie
        </Link>
        <p style={{ 
          marginTop: 12, 
          fontSize: 13, 
          color: '#999' 
        }}>
          Gratuit • Pas de carte bancaire
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #eee',
        padding: '24px',
        textAlign: 'center',
        fontSize: 13,
        color: '#999'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          <span>🎾</span>
          <span style={{ fontWeight: '600', color: '#666' }}>PadelMatch</span>
        </div>
        <div>Fait avec ❤️ à Metz</div>
      </footer>
    </div>
  )
}