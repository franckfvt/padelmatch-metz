import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  const matchId = params.id

  // Récupérer la partie
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      clubs (name),
      profiles!matches_organizer_id_fkey (name)
    `)
    .eq('id', matchId)
    .single()

  if (!match) {
    return new Response('Match not found', { status: 404 })
  }

  // Compter les participants
  const { count: participantsCount } = await supabase
    .from('match_participants')
    .select('id', { count: 'exact' })
    .eq('match_id', matchId)

  const totalPlayers = 1 + (participantsCount || 0)
  const spotsLeft = match.spots_total - totalPlayers

  const levelLabels = {
    'less6months': '1-2',
    '6months2years': '3-4',
    '2to5years': '5-6',
    'more5years': '7+',
    'all': 'Tous'
  }

  const ambianceEmojis = {
    'loisir': '😎',
    'mix': '⚡',
    'compet': '🏆'
  }

  const level = match.level_required ? levelLabels[match.level_required] || match.level_required : 'Tous'
  const pricePerPerson = match.price_total ? Math.round(match.price_total / 100 / match.spots_total) : 0

  // Formater la date
  const date = new Date(match.match_date)
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = match.match_time?.slice(0, 5) || ''

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
          backgroundColor: '#2e7d32',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: 32,
            padding: '40px 56px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            minWidth: 600,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 20,
                color: '#2e7d32',
                fontWeight: 700,
              }}
            >
              🎾 PADELMATCH
            </div>
            <div
              style={{
                backgroundColor: spotsLeft > 0 ? '#e8f5e9' : '#fef3c7',
                color: spotsLeft > 0 ? '#2e7d32' : '#92400e',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {spotsLeft > 0 ? `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}` : 'COMPLET'}
            </div>
          </div>

          {/* Titre */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#1a1a1a',
              marginBottom: 24,
            }}
          >
            {match.spots_available > 0 
              ? `Cherche ${match.spots_available} joueur${match.spots_available > 1 ? 's' : ''}`
              : 'Partie de padel'
            }
          </div>

          {/* Infos principales */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
              <span>📅</span>
              <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{dateStr}</span>
              <span style={{ 
                backgroundColor: '#2e7d32', 
                color: '#fff', 
                padding: '6px 16px', 
                borderRadius: 12,
                fontWeight: 700 
              }}>
                {timeStr}
              </span>
            </div>

            {/* Lieu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
              <span>📍</span>
              <span style={{ color: '#666' }}>{match.clubs?.name}</span>
            </div>

            {/* Niveau */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
              <span>⭐</span>
              <span style={{ color: '#666' }}>Niveau {level}</span>
              {match.ambiance && (
                <span style={{ marginLeft: 16 }}>
                  {ambianceEmojis[match.ambiance]}
                </span>
              )}
            </div>

            {/* Prix */}
            {pricePerPerson > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24 }}>
                <span>💰</span>
                <span style={{ color: '#666' }}>{pricePerPerson}€ / personne</span>
              </div>
            )}
          </div>

          {/* Organisateur */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              backgroundColor: '#f5f5f5',
              borderRadius: 16,
              fontSize: 18,
            }}
          >
            <span>👤</span>
            <span style={{ color: '#666' }}>Organisé par</span>
            <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{match.profiles?.name}</span>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
          }}
        >
          👆 Clique pour t'inscrire
        </div>
      </div>
    ),
    {
      width: 800,
      height: 600,
    }
  )
}