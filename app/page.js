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
          Tu organises une partie ?
          <br />
          <span style={{ color: '#2e7d32' }}>Gere-la proprement.</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: '#666',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Cree ta partie, partage le lien sur WhatsApp, et retrouve des joueurs de ton niveau. Fini le chaos des groupes.
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
            Creer ma partie gratuitement
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
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>30 sec</div>
            <div style={{ fontSize: 14, color: '#666' }}>pour creer une partie</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>100%</div>
            <div style={{ fontSize: 14, color: '#666' }}>gratuit</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>5 clubs</div>
            <div style={{ fontSize: 14, color: '#666' }}>a Metz</div>
          </div>
        </div>
      </section>

      {/* Probleme */}
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
            marginBottom: 16
          }}>
            Organiser sur WhatsApp, c est le chaos
          </h2>
          <p style={{
            fontSize: 18,
            color: '#666',
            textAlign: 'center',
            marginBottom: 48,
            maxWidth: 600,
            margin: '0 auto 48px'
          }}>
            Tu connais la galere...
          </p>
          
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
              <div style={{ fontSize: 40, marginBottom: 16 }}>😵</div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                "Qui vient samedi ?"
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                15 reponses en vrac, tu recomptes 3 fois, et tu sais toujours pas qui vient vraiment.
              </p>
            </div>
            
            <div style={{
              background: '#fff',
              padding: 32,
              borderRadius: 20,
              border: '1px solid #eee'
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🤷</div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                "C est qui ce joueur ?"
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Quelqu un repond "moi !" mais tu connais pas son niveau. Mauvaise surprise sur le terrain.
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
                "Desole je peux plus"
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Annulation 2h avant. Tu dois tout relancer pour trouver un remplacant en urgence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
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
            PadelMatch simplifie tout
          </h2>
          <p style={{
            fontSize: 18,
            color: '#999',
            textAlign: 'center',
            marginBottom: 48,
            maxWidth: 600,
            margin: '0 auto 48px'
          }}>
            Tu gardes WhatsApp pour discuter. PadelMatch gere la logistique.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Liste claire</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Tu vois qui vient, qui est en attente. Plus besoin de recompter.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Profils visibles</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Chaque joueur a son niveau et son ambiance. Tu sais avec qui tu joues.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Score de fiabilite</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Les joueurs qui annulent souvent, ca se voit. Fini les mauvaises surprises.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Rappels auto</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Notification la veille a tout le monde. Plus besoin de relancer.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Lien a partager</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Un lien unique a coller sur WhatsApp. Les gens s inscrivent en 30 sec.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 28,
              borderRadius: 16
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Chat dedie</h3>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5 }}>
                Un chat par partie. Toutes les infos au meme endroit.
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
                background: '#e8f5e9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                margin: '0 auto 20px'
              }}>
                1
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Cree ta partie
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Club, date, heure, niveau recherche. En 30 secondes c est fait.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60,
                height: 60,
                background: '#e8f5e9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                margin: '0 auto 20px'
              }}>
                2
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Partage le lien
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Copie le lien et colle-le sur WhatsApp, Insta, ou envoie-le a tes potes.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60,
                height: 60,
                background: '#e8f5e9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                margin: '0 auto 20px'
              }}>
                3
              </div>
              <h3 style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 }}>
                Joue tranquille
              </h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                Tu sais qui vient, leur niveau, leur fiabilite. Plus de mauvaises surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profil public teaser */}
      <section style={{
        padding: '80px 40px',
        background: '#fafafa'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: '#dbeafe',
            color: '#1e40af',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 24
          }}>
            Bientot disponible
          </div>
          
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: 16
          }}>
            Ta carte de joueur
          </h2>
          <p style={{
            fontSize: 18,
            color: '#666',
            marginBottom: 32,
            lineHeight: 1.6
          }}>
            Un profil public a partager comme un Linktree. Mets-le dans ta bio Instagram, et montre qui tu es sur le terrain.
          </p>
          
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 32,
            maxWidth: 350,
            margin: '0 auto',
            border: '1px solid #eee',
            textAlign: 'center'
          }}>
            <div style={{
              width: 80,
              height: 80,
              background: '#f5f5f5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              margin: '0 auto 16px'
            }}>
              👤
            </div>
            <div style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>
              Franck
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              padelmatch.fr/j/franck
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                📈 Intermediaire
              </span>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>
                😎 Detente
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#2e7d32', fontWeight: '600' }}>
              ⭐ 98% fiable - 23 parties jouees
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
            Pret a simplifier tes parties ?
          </h2>
          <p style={{
            fontSize: 18,
            opacity: 0.9,
            marginBottom: 32
          }}>
            Cree ta premiere partie gratuitement. Ca prend 30 secondes.
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
            Creer ma partie
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