import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  const { id } = params

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    return new Response('Profile not found', { status: 404 })
  }

  const name = profile.name || 'Joueur'
  const level = profile.level || '?'
  const position = profile.position === 'left' ? 'Gauche' : profile.position === 'right' ? 'Droite' : 'Les deux'
  const matchesPlayed = profile.matches_played || 0
  const winRate = profile.matches_played > 0 
    ? Math.round((profile.matches_won / profile.matches_played) * 100) 
    : 0
  const streak = profile.current_streak || 0
  const reliability = profile.reliability_score || 100

  // Format carré pour stories Instagram/Facebook (1080x1080)
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
        }}
      >
        {/* Cadre de la carte */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            borderRadius: '40px',
            padding: '50px',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '56px' }}>🎾</span>
              <span style={{ fontSize: '32px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: '2px' }}>
                PADELMATCH
              </span>
            </div>
          </div>

          {/* Nom */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1
              style={{
                fontSize: '84px',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 30px',
                letterSpacing: '-2px',
                lineHeight: 1,
              }}
            >
              {name}
            </h1>
            
            {/* Badges niveau et position */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '50px' }}>
              <span
                style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  fontSize: '36px',
                  fontWeight: '800',
                }}
              >
                ⭐ {level}/10
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  fontSize: '36px',
                  fontWeight: '600',
                }}
              >
                🎾 {position}
              </span>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '30px 20px',
                  borderRadius: '20px',
                }}
              >
                <span style={{ fontSize: '52px', fontWeight: '700', color: '#fff' }}>
                  {matchesPlayed}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                  parties
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '30px 20px',
                  borderRadius: '20px',
                }}
              >
                <span style={{ fontSize: '52px', fontWeight: '700', color: '#22c55e' }}>
                  {winRate}%
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                  wins
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  background: streak > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
                  padding: '30px 20px',
                  borderRadius: '20px',
                  border: streak > 0 ? '2px solid rgba(251,191,36,0.5)' : 'none',
                }}
              >
                <span style={{ fontSize: '52px', fontWeight: '700', color: '#fbbf24' }}>
                  🔥{streak}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                  série
                </span>
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
            <span
              style={{
                background: reliability >= 90 ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                color: reliability >= 90 ? '#22c55e' : '#fbbf24',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '22px',
                fontWeight: '600',
              }}
            >
              ✅ {reliability}% fiable
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  )
}