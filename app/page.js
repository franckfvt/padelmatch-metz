import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fff'
    }}>
      
      {/* Nav - ultra minimal */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        maxWidth: 1100,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎾</span>
          <span style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
        </div>
        <Link href="/auth" style={{
          padding: '10px 20px',
          background: 'transparent',
          color: '#666',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: '500'
        }}>
          Connexion
        </Link>
      </nav>

      {/* HERO - La douleur + la promesse */}
      <section style={{
        padding: '80px 24px 100px',
        maxWidth: 800,
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Accroche émotionnelle */}
        <p style={{
          fontSize: 18,
          color: '#666',
          marginBottom: 20,
          fontWeight: '500'
        }}>
          Tu connais la galère pour compléter une partie ?
        </p>
        
        {/* Headline - La promesse */}
        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 64px)',
          fontWeight: '800',
          color: '#1a1a1a',
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: '-1px'
        }}>
          Crée ta partie.<br/>
          <span style={{ color: '#2e7d32' }}>Complète-la en 5 min.</span>
        </h1>
        
        {/* Sous-titre concret */}
        <p style={{
          fontSize: 20,
          color: '#555',
          maxWidth: 500,
          margin: '0 auto 40px',
          lineHeight: 1.5
        }}>
          Fini les 47 messages WhatsApp.<br/>
          Tu partages un lien, les joueurs s'inscrivent avec leur niveau.
        </p>
        
        {/* UN SEUL CTA */}
        <Link href="/auth" style={{
          display: 'inline-block',
          padding: '20px 48px',
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: 14,
          textDecoration: 'none',
          fontSize: 18,
          fontWeight: '700',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s'
        }}>
          Créer ma partie →
        </Link>
        
        <p style={{
          marginTop: 16,
          fontSize: 14,
          color: '#999'
        }}>
          Gratuit • 15 secondes • Sans carte bancaire
        </p>
      </section>

      {/* LA DOULEUR - Ce qu'ils vivent */}
      <section style={{
        padding: '80px 24px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Organiser une partie aujourd'hui
          </h2>
          <p style={{
            fontSize: 18,
            color: '#666',
            textAlign: 'center',
            marginBottom: 48
          }}>
            (Ça te parle ?)
          </p>
          
          {/* Timeline de la galère */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 28px',
            border: '1px solid #eee',
            maxWidth: 600,
            margin: '0 auto'
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 13, 
                  color: '#999', 
                  fontWeight: '600',
                  minWidth: 50
                }}>14h00</span>
                <p style={{ margin: 0, color: '#333', fontSize: 16 }}>
                  "Dispo samedi 16h ?" sur WhatsApp
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 13, 
                  color: '#999', 
                  fontWeight: '600',
                  minWidth: 50
                }}>15h20</span>
                <p style={{ margin: 0, color: '#333', fontSize: 16 }}>
                  "Moi !" <span style={{ color: '#999' }}>(C'est qui ce mec ? Il joue bien ?)</span>
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 13, 
                  color: '#999', 
                  fontWeight: '600',
                  minWidth: 50
                }}>17h00</span>
                <p style={{ margin: 0, color: '#333', fontSize: 16 }}>
                  "Ah désolé finalement je peux plus" <span style={{ color: '#dc2626' }}>😤</span>
                </p>
              </div>
            </div>
            
            <div style={{ 
              borderTop: '1px solid #eee', 
              paddingTop: 20,
              marginTop: 20 
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 13, 
                  color: '#dc2626', 
                  fontWeight: '600',
                  minWidth: 50
                }}>17h15</span>
                <p style={{ margin: 0, color: '#dc2626', fontSize: 16, fontWeight: '600' }}>
                  Tu repars à zéro... 3h de perdues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LA SOLUTION - Comment ça marche */}
      <section style={{
        padding: '80px 24px',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 60
          }}>
            Avec PadelMatch
          </h2>
          
          {/* 3 étapes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 40
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16
              }}>⚡</div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                marginBottom: 8 
              }}>
                15 secondes
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 15,
                lineHeight: 1.6
              }}>
                Tu crées ta partie.<br/>Date, heure, lieu. C'est tout.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16
              }}>🔗</div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                marginBottom: 8 
              }}>
                1 lien
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 15,
                lineHeight: 1.6
              }}>
                Tu partages sur WhatsApp, Facebook, où tu veux.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16
              }}>✅</div>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                marginBottom: 8 
              }}>
                Tu sais qui vient
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 15,
                lineHeight: 1.6
              }}>
                Chaque joueur a son niveau.<br/>Plus de mauvaises surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PREUVE SOCIALE - La carte joueur */}
      <section style={{
        padding: '80px 24px',
        background: '#fff'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: 12
          }}>
            Chaque joueur a sa carte
          </h2>
          <p style={{
            fontSize: 17,
            color: '#666',
            marginBottom: 40
          }}>
            Tu vois le niveau et la fiabilité <strong>avant</strong> qu'il rejoigne
          </p>
          
          {/* Une seule carte - centrée */}
          <div style={{
            background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
            borderRadius: 24,
            padding: 28,
            color: '#fff',
            maxWidth: 340,
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            textAlign: 'left'
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎾</span>
                <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.6 }}>PADELMATCH</span>
              </div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: '700'
              }}>
                ✓ 98%
              </div>
            </div>

            {/* Profil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>
                👨
              </div>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: '700', margin: 0 }}>Thomas</h3>
                <p style={{ fontSize: 13, opacity: 0.6, margin: '4px 0 0' }}>Joue 2x/semaine</p>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <span style={{
                background: '#fbbf24',
                color: '#1a1a1a',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: '700'
              }}>
                ⭐ 7/10
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14
              }}>
                🏆 Compétitif
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14
              }}>
                ➡️ Droite
              </span>
            </div>

            {/* Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 8,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700' }}>42</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>parties</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700' }}>68%</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>victoires</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#fbbf24' }}>🔥5</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>série</div>
              </div>
            </div>
          </div>
          
          <p style={{
            marginTop: 32,
            fontSize: 15,
            color: '#888',
            maxWidth: 400,
            margin: '32px auto 0'
          }}>
            98% de fiabilité = il vient toujours.<br/>
            Fini les lapins.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        padding: '80px 24px',
        background: '#2e7d32',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: '700',
            marginBottom: 16,
            lineHeight: 1.2
          }}>
            Ta prochaine partie<br/>commence ici
          </h2>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 32
          }}>
            En 15 secondes, c'est créé.<br/>
            En 5 minutes, c'est complet.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '20px 48px',
            background: '#fff',
            color: '#2e7d32',
            borderRadius: 14,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: '700'
          }}>
            Créer ma partie gratuitement
          </Link>
        </div>
      </section>

      {/* Footer minimal */}
      <footer style={{
        padding: '32px 24px',
        background: '#1a1a1a',
        color: '#666',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🎾</span>
          <span style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>PadelMatch</span>
        </div>
        <p style={{ fontSize: 13, margin: 0 }}>
          Fait avec ❤️ pour les joueurs de padel • 2024
        </p>
      </footer>
    </div>
  )
}