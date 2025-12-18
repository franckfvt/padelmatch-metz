import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  const { id } = params

  // Récupérer le match avec les détails
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      clubs (id, name),
      profiles!matches_organizer_id_fkey (id, name, level),
      match_participants (
        user_id,
        team,
        profiles (id, name, level)
      )
    `)
    .eq('id', id)
    .single()

  if (!match || match.status !== 'completed') {
    return new Response('Match not found or not completed', { status: 404 })
  }

  const clubName = match.clubs?.name || 'Padel'
  const matchDate = new Date(match.match_date).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long' 
  })
  
  // Construire les équipes
  const teamA = match.match_participants?.filter(p => p.team === 'A').map(p => p.profiles?.name) || []
  const teamB = match.match_participants?.filter(p => p.team === 'B').map(p => p.profiles?.name) || []
  
  // Ajouter l'orga dans son équipe
  if (match.organizer_team === 'A') teamA.unshift(match.profiles?.name)
  if (match.organizer_team === 'B') teamB.unshift(match.profiles?.name)
  
  const winner = match.winner
  const winnerNames = winner === 'A' ? teamA : teamB
  const loserNames = winner === 'A' ? teamB : teamA
  
  // Score
  const scores = []
  if (match.score_set1_a !== null) scores.push(`${match.score_set1_a}-${match.score_set1_b}`)
  if (match.score_set2_a !== null) scores.push(`${match.score_set2_a}-${match.score_set2_b}`)
  if (match.score_set3_a !== null) scores.push(`${match.score_set3_a}-${match.score_set3_b}`)
  const scoreText = scores.length > 0 ? scores.join(' / ') : 'Victoire'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
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
          <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
            {matchDate}
          </div>
        </div>

        {/* Trophée central */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div style={{ fontSize: '120px', marginBottom: '20px' }}>🏆</div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: '800',
              color: '#fbbf24',
              marginBottom: '30px',
              textAlign: 'center',
            }}
          >
            VICTOIRE !
          </div>

          {/* Gagnants */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {winnerNames.map((name, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(251,191,36,0.2)',
                  border: '2px solid #fbbf24',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                {name || 'Joueur'}
              </div>
            ))}
          </div>

          {/* Score */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#22c55e',
              marginBottom: '20px',
            }}
          >
            {scoreText}
          </div>

          {/* VS */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '20px',
            }}
          >
            contre
          </div>

          {/* Perdants */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            {loserNames.map((name, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {name || 'Joueur'}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '30px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)' }}>
            📍 {clubName}
          </div>
          <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.4)' }}>
            padelmatch.fr
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