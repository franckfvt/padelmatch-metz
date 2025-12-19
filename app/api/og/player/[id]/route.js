import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Créer un client Supabase pour l'edge
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Génère une image Open Graph pour un profil joueur
 * URL: /api/og/player/[id]
 */
export async function GET(request, { params }) {
  const { id } = params

  // Récupérer le profil depuis Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, level, ambiance, reliability_score, avatar_url, position')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return new Response('Profil non trouvé', { status: 404 })
  }

  const { name, level, ambiance, reliability_score, avatar_url, position } = profile

  const ambianceLabels = {
    'loisir': { label: 'Détente', emoji: '😎' },
    'mix': { label: 'Équilibré', emoji: '⚡' },
    'compet': { label: 'Compétitif', emoji: '🏆' }
  }

  const positionLabels = {
    'left': 'Gauche',
    'right': 'Droite',
    'both': 'Les deux'
  }

  const amb = ambianceLabels[ambiance] || ambianceLabels.mix
  const reliability = reliability_score || 100

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Cercle décoratif */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,125,50,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Contenu principal */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '48px', marginRight: '16px' }}>🎾</span>
            <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: '2px' }}>
              PADELMATCH
            </span>
          </div>

          {/* Carte joueur */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              gap: '60px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: avatar_url 
                  ? `url(${avatar_url})` 
                  : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                color: '#fff',
                border: '4px solid rgba(255,255,255,0.2)',
              }}
            >
              {!avatar_url && (name?.charAt(0)?.toUpperCase() || '?')}
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Nom */}
              <h1
                style={{
                  fontSize: '72px',
                  fontWeight: '800',
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-2px',
                }}
              >
                {name || 'Joueur'}
              </h1>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Niveau */}
                <div
                  style={{
                    background: '#fbbf24',
                    color: '#1a1a1a',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '28px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  ⭐ {level || 5}/10
                </div>

                {/* Ambiance */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '28px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {amb.emoji} {amb.label}
                </div>

                {/* Fiabilité */}
                <div
                  style={{
                    background: reliability >= 90 ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                    color: reliability >= 90 ? '#4ade80' : '#fbbf24',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '28px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  ✓ {reliability}% fiable
                </div>

                {/* Position */}
                {position && positionLabels[position] && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.8)',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '24px',
                      fontWeight: '500',
                    }}
                  >
                    📍 {positionLabels[position]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
              paddingTop: '30px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
              padelmatch.fr
            </span>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>
              Trouve des joueurs de ton niveau
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}