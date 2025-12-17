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
        padding: '80px 40px',
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
          🎾 Disponible a Metz
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
          Cree ta partie, invite tes potes ou trouve de nouveaux partenaires. Chaque joueur a un profil avec son niveau et son ambiance.
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
            Creer ma partie
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

        {/* Mini stats */}
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
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Score de fiabilite</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>100%</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Gratuit</div>
          </div>
        </div>
      </section>

      {/* Le probleme */}
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
            Le probleme avec WhatsApp
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
                Quelqu un repond "moi !" sur le groupe, mais tu connais pas son niveau. Mauvaise surprise sur le terrain.
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
                Messages noyes
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                "Qui vient samedi ?" 15 reponses en vrac, tu recomptes 3 fois, et tu sais toujours pas qui vient.
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
                "Desole je peux plus" 2h avant. Tu dois tout relancer pour trouver un remplacant.
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
            PadelMatch resout tout
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
                Debutant, intermediaire, confirme ou expert. Tu choisis le niveau que tu recherches, et tu vois le niveau de ceux qui veulent jouer.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>😎</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Ambiance affichee</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Detente, equilibre ou competitif. Chaque joueur affiche ce qu il recherche. Plus de malentendus.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Score de fiabilite</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Les joueurs qui annulent souvent, ca se voit. Tu sais sur qui tu peux compter.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Liste claire</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Tu vois qui est inscrit, leur profil complet. Plus besoin de recompter les "moi !" sur WhatsApp.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Partage facile</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Un lien a partager sur WhatsApp. Les joueurs s inscrivent en 30 secondes avec leur profil.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 32,
              borderRadius: 20
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <h3 style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Chat dedie</h3>
              <p style={{ color: '#999', fontSize: 16, lineHeight: 1.6 }}>
                Un chat par partie. Toutes les infos au meme endroit, pas noyees dans un groupe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
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
            Comment ca marche ?
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
                1
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Cree ton profil
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Indique ton niveau, ton ambiance et ta frequence de jeu. 30 secondes.
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
                2
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Cree ou rejoins
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Tu as un terrain ? Cree ta partie. Tu cherches une partie ? Rejoins-en une qui te correspond.
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
                Tu connais le niveau et la fiabilite de chacun. Plus de mauvaises surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exemple de profil */}
      <section style={{
        padding: '80px 40px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: '700',
            color: '#1a1a1a',
            textAlign: 'center',
            marginBottom: 16
          }}>
            Chaque joueur a un profil complet
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            maxWidth: 800,
            margin: '0 auto'
          }}>
            {/* Profil 1 */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  background: '#e5e5e5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: 18 }}>Marie</div>
                  <div style={{ fontSize: 13, color: '#2e7d32' }}>⭐ 98% fiable</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  📈 Intermediaire
                </span>
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  😎 Detente
                </span>
              </div>
            </div>

            {/* Profil 2 */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  background: '#e5e5e5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: 18 }}>Thomas</div>
                  <div style={{ fontSize: 13, color: '#2e7d32' }}>⭐ 100% fiable</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  💪 Confirme
                </span>
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  🏆 Competitif
                </span>
              </div>
            </div>

            {/* Profil 3 */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 50,
                  height: 50,
                  background: '#e5e5e5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: 18 }}>Lucas</div>
                  <div style={{ fontSize: 13, color: '#f59e0b' }}>⭐ 75% fiable</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  🌱 Debutant
                </span>
                <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                  ⚡ Equilibre
                </span>
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
            Pret a jouer avec les bons partenaires ?
          </h2>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 32
          }}>
            Cree ton profil gratuitement et trouve des joueurs de ton niveau.
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
            Commencer gratuitement
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
          Fait avec ❤️ a Metz pour les joueurs de padel
        </p>
        <p style={{ fontSize: 13, marginTop: 16 }}>
          © 2024 PadelMatch. Tous droits reserves.
        </p>
      </footer>
    </div>
  )
}