'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* ========== NAVIGATION ========== */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{ 
          fontSize: 24, 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>🎾</span> PadelMatch
        </div>
        <Link href="/auth" style={{
          padding: '12px 28px',
          background: '#1a1a1a',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'opacity 0.2s'
        }}>
          Se connecter
        </Link>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '60px 40px 80px',
        textAlign: 'center'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          background: '#e8f5e9',
          color: '#2e7d32',
          padding: '10px 20px',
          borderRadius: 30,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 32
        }}>
          🎾 Disponible à Metz et environs
        </div>
        
        {/* Titre principal */}
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: '800',
          lineHeight: 1.1,
          marginBottom: 24,
          color: '#1a1a1a',
          letterSpacing: '-1px'
        }}>
          Trouve des joueurs<br />
          <span style={{ color: '#2e7d32' }}>de ton niveau</span>
        </h1>
        
        {/* Sous-titre */}
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: '#666',
          maxWidth: 550,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Fini les groupes WhatsApp. PadelMatch te connecte avec des joueurs compatibles en quelques secondes.
        </p>
        
        {/* Boutons CTA */}
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          marginBottom: 60
        }}>
          <Link href="/auth" style={{
            padding: '18px 36px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            Commencer gratuitement
            <span style={{ fontSize: 20 }}>→</span>
          </Link>
          <a 
            href="#how-it-works"
            style={{
              padding: '18px 36px',
              background: '#fff',
              color: '#1a1a1a',
              border: '2px solid #e5e5e5',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Voir comment ça marche
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
          flexWrap: 'wrap'
        }}>
          {[
            { number: '5', label: 'Clubs partenaires' },
            { number: '100%', label: 'Gratuit' },
            { number: '< 1 min', label: 'Pour trouver une partie' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: 36, 
                fontWeight: '800', 
                color: '#1a1a1a',
                marginBottom: 4
              }}>
                {stat.number}
              </div>
              <div style={{ fontSize: 14, color: '#999' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== PROBLÈME ========== */}
      <section style={{
        background: '#fafafa',
        padding: '80px 40px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 16,
            color: '#1a1a1a'
          }}>
            Le padel, c'est génial
          </h2>
          <p style={{
            fontSize: 20,
            color: '#666',
            textAlign: 'center',
            marginBottom: 60
          }}>
            Trouver 3 partenaires disponibles et du même niveau ? Beaucoup moins.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {[
              { 
                emoji: '😩', 
                title: 'Groupes WhatsApp interminables', 
                desc: '47 messages pour organiser une seule partie. "Qui est dispo ?" "Moi mais pas avant 19h" "Ah non finalement..."' 
              },
              { 
                emoji: '🤷', 
                title: 'Niveaux de jeu inconnus', 
                desc: 'Tu te retrouves avec des joueurs trop forts ou trop débutants. La partie n\'est fun pour personne.' 
              },
              { 
                emoji: '😤', 
                title: 'Annulations de dernière minute', 
                desc: 'Un joueur annule 2h avant. Impossible de trouver un remplaçant. Partie annulée. Terrain payé.' 
              }
            ].map((item, i) => (
              <div key={i} style={{
                background: '#fff',
                padding: 36,
                borderRadius: 20,
                border: '1px solid #eee'
              }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{item.emoji}</div>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: '700', 
                  marginBottom: 12,
                  color: '#1a1a1a'
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  color: '#666', 
                  lineHeight: 1.7,
                  fontSize: 15
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COMMENT ÇA MARCHE ========== */}
      <section id="how-it-works" style={{
        padding: '100px 40px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Comment ça marche ?
        </h2>
        <p style={{
          fontSize: 20,
          color: '#666',
          textAlign: 'center',
          marginBottom: 70
        }}>
          3 étapes. Moins d'une minute. Et tu joues.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 50
        }}>
          {[
            { 
              step: '1', 
              title: 'Crée ton profil', 
              desc: 'Indique ton niveau et tes préférences. 30 secondes chrono.' 
            },
            { 
              step: '2', 
              title: 'Trouve ou crée une partie', 
              desc: 'Rejoins une partie existante ou crée la tienne. On te suggère des joueurs compatibles.' 
            },
            { 
              step: '3', 
              title: 'Joue !', 
              desc: 'Retrouve tes partenaires sur le terrain. Chat intégré pour s\'organiser.' 
            }
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 70,
                height: 70,
                background: '#1a1a1a',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: '700',
                margin: '0 auto 24px'
              }}>
                {item.step}
              </div>
              <h3 style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                marginBottom: 12,
                color: '#1a1a1a'
              }}>
                {item.title}
              </h3>
              <p style={{ 
                color: '#666', 
                lineHeight: 1.7,
                fontSize: 16
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FONCTIONNALITÉS ========== */}
      <section style={{
        background: '#1a1a1a',
        color: '#fff',
        padding: '100px 40px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 70
          }}>
            Tout ce qu'il faut pour jouer
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32
          }}>
            {[
              { emoji: '🎯', title: 'Matching par niveau', desc: 'On te propose uniquement des joueurs de ton niveau pour des parties équilibrées.' },
              { emoji: '📍', title: 'Clubs de Metz', desc: 'Tous les clubs de padel de la région avec leurs disponibilités.' },
              { emoji: '💬', title: 'Chat intégré', desc: 'Organise-toi avec tes partenaires sans quitter l\'app.' },
              { emoji: '⭐', title: 'Joueurs favoris', desc: 'Retrouve facilement les joueurs avec qui tu aimes jouer.' },
              { emoji: '🔔', title: 'Alertes intelligentes', desc: 'Sois notifié quand une partie correspond à tes critères.' },
              { emoji: '✅', title: 'Score de fiabilité', desc: 'Fini les annulations. Les joueurs fiables sont mis en avant.' }
            ].map((item, i) => (
              <div key={i} style={{
                padding: 32,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.emoji}</div>
                <h3 style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  marginBottom: 10 
                }}>
                  {item.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: 15, 
                  lineHeight: 1.6 
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section style={{
        padding: '100px 40px',
        textAlign: 'center',
        background: '#fff'
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: '700',
          marginBottom: 16,
          color: '#1a1a1a'
        }}>
          Prêt à jouer ?
        </h2>
        <p style={{
          color: '#666',
          marginBottom: 40,
          fontSize: 20
        }}>
          Rejoins les joueurs de padel de Metz.
        </p>
        <Link href="/auth" style={{
          display: 'inline-block',
          padding: '20px 48px',
          background: '#2e7d32',
          color: '#fff',
          borderRadius: 14,
          fontSize: 18,
          fontWeight: '700',
          textDecoration: 'none'
        }}>
          Créer mon compte gratuitement
        </Link>
        <p style={{
          marginTop: 16,
          color: '#999',
          fontSize: 14
        }}>
          Inscription en 30 secondes · 100% gratuit
        </p>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{
        borderTop: '1px solid #eee',
        padding: '40px',
        textAlign: 'center',
        background: '#fafafa'
      }}>
        <div style={{ 
          fontSize: 18, 
          fontWeight: '600',
          marginBottom: 8,
          color: '#1a1a1a'
        }}>
          🎾 PadelMatch
        </div>
        <div style={{ color: '#999', fontSize: 14 }}>
          Trouve des joueurs de padel à Metz
        </div>
        <div style={{ 
          color: '#999', 
          fontSize: 13,
          marginTop: 20 
        }}>
          © 2024 PadelMatch. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}