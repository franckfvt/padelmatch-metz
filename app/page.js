import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎾</span>
          <span style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a' }}>PadelMatch</span>
        </div>
        <Link href="/auth" style={{
          padding: '12px 24px',
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
        padding: '60px 40px 80px',
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#e8f5e9',
          color: '#2e7d32',
          padding: '8px 16px',
          borderRadius: 20,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 24
        }}>
          🎾 Gratuit • Sans pub • Made in France
        </div>
        
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: '800',
          color: '#1a1a1a',
          lineHeight: 1.1,
          marginBottom: 24
        }}>
          Trouve des joueurs
          <br />
          <span style={{ color: '#2e7d32' }}>de ton niveau</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: '#666',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Crée ta partie, invite tes potes ou trouve de nouveaux partenaires. 
          Chaque joueur a un profil avec son niveau et son ambiance.
        </p>
        
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{
            padding: '18px 36px',
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: 14,
            textDecoration: 'none',
            fontSize: 17,
            fontWeight: '600'
          }}>
            Créer ma partie
          </Link>
          <Link href="/auth" style={{
            padding: '18px 36px',
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: 14,
            textDecoration: 'none',
            fontSize: 17,
            fontWeight: '600',
            border: '2px solid #e5e5e5'
          }}>
            Rejoindre une partie
          </Link>
        </div>

        {/* Mini features - sans stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          marginTop: 60,
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>🎯</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Matchmaking par niveau</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>⭐</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Score de fiabilité</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>📱</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Partage facile</div>
          </div>
        </div>
      </section>

      {/* Le problème */}
      <section style={{
        padding: '80px 40px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 48
          }}>
            Le problème avec WhatsApp
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24
          }}>
            <div style={{
              background: '#fff',
              padding: 32,
              borderRadius: 20,
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤷</div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Niveau inconnu
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Quelqu'un répond "moi !" sur le groupe, mais tu connais pas son niveau. Mauvaise surprise sur le terrain.
              </p>
            </div>
            
            <div style={{
              background: '#fff',
              padding: 32,
              borderRadius: 20,
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>😵</div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Messages noyés
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                "Qui vient samedi ?" 15 réponses en vrac, tu recomptes 3 fois, et tu sais toujours pas qui vient.
              </p>
            </div>
            
            <div style={{
              background: '#fff',
              padding: 32,
              borderRadius: 20,
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💨</div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Annulations
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                "Désolé je peux plus" 2h avant. Tu dois tout relancer pour trouver un remplaçant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* La solution */}
      <section style={{
        padding: '80px 40px',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 16
          }}>
            PadelMatch résout tout
          </h2>
          <p style={{
            fontSize: 18,
            color: '#999',
            textAlign: 'center',
            marginBottom: 48,
            maxWidth: 600,
            margin: '0 auto 48px'
          }}>
            Chaque joueur a un profil. Tu sais avec qui tu joues.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Matchmaking par niveau</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Chaque joueur a un niveau de 1 à 10. Tu sais exactement avec qui tu joues avant de confirmer.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Score de fiabilité</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Les joueurs qui annulent au dernier moment voient leur score baisser. Fini les lapins !
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Partage en 1 clic</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Partage ta partie sur WhatsApp ou tes groupes Facebook. Chaque joueur qui clique voit les détails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section style={{
        padding: '80px 40px'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 48
          }}>
            Comment ça marche ?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 32
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60,
                height: 60,
                background: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: '700',
                margin: '0 auto 20px'
              }}>
                1
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Crée ton profil
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                En 30 secondes : ton prénom, ton niveau (1-10), et l'ambiance que tu recherches.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60,
                height: 60,
                background: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: '700',
                margin: '0 auto 20px'
              }}>
                2
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Crée ou rejoins
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Tu as un terrain ? Crée ta partie. Tu cherches une partie ? Rejoins-en une qui te correspond.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60,
                height: 60,
                background: '#2e7d32',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: '700',
                margin: '0 auto 20px'
              }}>
                3
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Joue avec les bons joueurs
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Tu connais le niveau et la fiabilité de chacun. Plus de mauvaises surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exemple de profils - DESIGN CARTE RÉALISTE */}
      <section style={{
        padding: '80px 40px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Chaque joueur a sa carte
          </h2>
          <p style={{
            fontSize: 18,
            color: '#666',
            textAlign: 'center',
            marginBottom: 48
          }}>
            Tu sais exactement avec qui tu vas jouer
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            maxWidth: 1000,
            margin: '0 auto'
          }}>
            {/* Carte 1 - Marie */}
            <div style={{
              background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
              borderRadius: 20,
              padding: 24,
              color: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎾</span>
                  <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  ✓ 98%
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f472b6 0%, #c084fc 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  👩
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: '700', margin: 0 }}>Marie</h3>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Joue 2x/semaine</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
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
                  😎 Détente
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  🎾 Droite
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>24</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>parties</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>58%</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>victoires</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700', color: '#fbbf24' }}>🔥3</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>série</div>
                </div>
              </div>
            </div>

            {/* Carte 2 - Thomas */}
            <div style={{
              background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
              borderRadius: 20,
              padding: 24,
              color: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎾</span>
                  <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  ✓ 100%
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  👨
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: '700', margin: 0 }}>Thomas</h3>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Joue 3x/semaine</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '700'
                }}>
                  ⭐ 8/10
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  🏆 Compétitif
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  🎾 Gauche
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>67</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>parties</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>72%</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>victoires</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700', color: '#fbbf24' }}>🔥8</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>série</div>
                </div>
              </div>
            </div>

            {/* Carte 3 - Lucas */}
            <div style={{
              background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
              borderRadius: 20,
              padding: 24,
              color: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎾</span>
                  <span style={{ fontSize: 11, fontWeight: '600', opacity: 0.7 }}>PADELMATCH</span>
                </div>
                <div style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: '600'
                }}>
                  ⚠ 75%
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}>
                  👦
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: '700', margin: 0 }}>Lucas</h3>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>Joue 1x/semaine</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: '700'
                }}>
                  ⭐ 3/10
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  ⚡ Équilibré
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  🎾 Les deux
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>8</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>parties</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700' }}>38%</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>victoires</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: '700', color: '#666' }}>🔥0</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>série</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
        padding: '80px 40px',
        background: '#2e7d32',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '700',
            marginBottom: 16
          }}>
            Prêt à jouer avec les bons partenaires ?
          </h2>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 32
          }}>
            Crée ton profil gratuitement en 30 secondes.
          </p>
          <Link href="/auth" style={{
            display: 'inline-block',
            padding: '18px 36px',
            background: '#fff',
            color: '#2e7d32',
            borderRadius: 14,
            textDecoration: 'none',
            fontSize: 17,
            fontWeight: '700'
          }}>
            Créer mon profil gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px',
        background: '#1a1a1a',
        color: '#999',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🎾</span>
          <span style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>PadelMatch</span>
        </div>
        <p style={{ fontSize: 14 }}>
          Fait avec ❤️ pour les joueurs de padel
        </p>
        <p style={{ fontSize: 13, marginTop: 16 }}>
          © 2024 PadelMatch. Tous droits réservés.
        </p>
      </footer>
    </div>
  )
}