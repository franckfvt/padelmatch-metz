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
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Container carte */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '50px',
            width: '100%',
            maxWidth: '1000px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '48px' }}>🎾</span>
              <span style={{ fontSize: '28px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                PADELMATCH
              </span>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '20px',
                color: '#fff',
              }}
            >
              ✅ {reliability}% fiable
            </div>
          </div>

          {/* Nom et badges */}
          <div style={{ marginBottom: '40px' }}>
            <h1
              style={{
                fontSize: '72px',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 20px',
                letterSpacing: '-2px',
              }}
            >
              {name}
            </h1>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span
                style={{
                  background: '#fbbf24',
                  color: '#1a1a1a',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '28px',
                  fontWeight: '700',
                }}
              >
                ⭐ {level}/10
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '28px',
                  fontWeight: '500',
                }}
              >
                🎾 {position}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '30px',
              paddingTop: '40px',
              borderTop: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                padding: '30px',
                borderRadius: '16px',
              }}
            >
              <span style={{ fontSize: '48px', fontWeight: '700', color: '#fff' }}>
                {matchesPlayed}
              </span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
                parties jouées
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                padding: '30px',
                borderRadius: '16px',
              }}
            >
              <span style={{ fontSize: '48px', fontWeight: '700', color: '#22c55e' }}>
                {winRate}%
              </span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
                victoires
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                background: streak > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                padding: '30px',
                borderRadius: '16px',
                border: streak > 0 ? '2px solid #fbbf24' : 'none',
              }}
            >
              <span style={{ fontSize: '48px', fontWeight: '700', color: '#fbbf24' }}>
                🔥 {streak}
              </span>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
                série en cours
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '40px',
              paddingTop: '30px',
              borderTop: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
              padelmatch.fr/player/{id.substring(0, 8)}...
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