import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  const playerId = params.id

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', playerId)
    .single()

  if (!profile) {
    return new Response('Player not found', { status: 404 })
  }

  const levelLabels = {
    'less6months': '1-2',
    '6months2years': '3-4',
    '2to5years': '5-6',
    'more5years': '7+'
  }

  const positionLabels = {
    'droite': 'Droite',
    'gauche': 'Gauche',
    'les_deux': 'D/G'
  }

  const level = profile.level || levelLabels[profile.experience] || '?'
  const position = positionLabels[profile.position] || ''
  const winRate = profile.matches_played > 0 
    ? Math.round((profile.matches_won || 0) / profile.matches_played * 100) 
    : 0
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
          backgroundColor: '#1a1a1a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 32,
            padding: '48px 64px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 32,
              fontSize: 24,
              color: '#2e7d32',
              fontWeight: 700,
            }}
          >
            🎾 PADELMATCH
          </div>

          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              marginBottom: 24,
              border: '4px solid #2e7d32',
            }}
          >
            👤
          </div>

          {/* Nom */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#1a1a1a',
              marginBottom: 16,
            }}
          >
            {profile.name}
          </div>

          {/* Niveau et Position */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                padding: '12px 24px',
                borderRadius: 50,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              ⭐ Niveau {level}
            </div>
            {position && (
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  padding: '12px 24px',
                  borderRadius: 50,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                🎾 {position}
              </div>
            )}
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              fontSize: 20,
              color: '#666',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏆</span>
              <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{profile.matches_played || 0}</span>
              <span>parties</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📈</span>
              <span style={{ fontWeight: 700, color: '#2e7d32' }}>{winRate}%</span>
              <span>wins</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✅</span>
              <span style={{ fontWeight: 700, color: '#2e7d32' }}>{reliability}%</span>
              <span>fiable</span>
            </div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 32,
            fontSize: 20,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          padelmatch.fr/j/{profile.name?.toLowerCase().replace(/\s+/g, '')}
        </div>
      </div>
    ),
    {
      width: 800,
      height: 600,
    }
  )
}