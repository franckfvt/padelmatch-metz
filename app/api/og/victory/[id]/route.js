import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Génère une image Open Graph pour une carte de victoire
 * URL: /api/og/victory/[id]
 * 
 * Note: [id] peut être soit l'ID d'une partie (match_history) 
 * soit passé avec des query params pour plus de flexibilité
 */
export async function GET(request, { params }) {
  const { id } = params
  const { searchParams } = new URL(request.url)

  let player, partner, score, date, club, streak, totalWins

  // Si l'ID est "custom", utiliser les query params
  if (id === 'custom') {
    player = searchParams.get('player') || 'Joueur'
    partner = searchParams.get('partner')
    score = searchParams.get('score')
    date = searchParams.get('date') || ''
    club = searchParams.get('club') || ''
    streak = parseInt(searchParams.get('streak') || '0')
    totalWins = searchParams.get('totalWins')
  } else {
    // Sinon, récupérer depuis match_history
    const { data: match, error } = await supabase
      .from('match_history')
      .select(`
        *,
        profiles (name)
      `)
      .eq('id', id)
      .single()

    if (error || !match) {
      return new Response('Victoire non trouvée', { status: 404 })
    }

    // Récupérer le nom du joueur
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', match.user_id)
      .single()

    player = profile?.name || 'Joueur'
    partner = match.partner_name
    score = match.score_us
    date = match.played_date
    club = match.location

    // Calculer la série de victoires
    const { data: recentMatches } = await supabase
      .from('match_history')
      .select('result')
      .eq('user_id', match.user_id)
      .order('played_date', { ascending: false })
      .limit(10)

    streak = 0
    if (recentMatches) {
      for (const m of recentMatches) {
        if (m.result === 'win') streak++
        else break
      }
    }

    // Total des victoires
    const { count } = await supabase
      .from('match_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', match.user_id)
      .eq('result', 'win')

    totalWins = count
  }

  // Formater la date
  let formattedDate = ''
  if (date) {
    const d = new Date(date)
    formattedDate = d.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #14532d 50%, #1a1a1a 100%)',
          padding: '50px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Confettis / Particules */}
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '100px',
            fontSize: '60px',
            opacity: 0.3,
            transform: 'rotate(-15deg)',
          }}
        >
          🎉
        </div>
        <div
          style={{
            position: 'absolute',
            top: '150px',
            right: '150px',
            fontSize: '50px',
            opacity: 0.3,
            transform: 'rotate(20deg)',
          }}
        >
          ⭐
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '200px',
            fontSize: '40px',
            opacity: 0.2,
            transform: 'rotate(-10deg)',
          }}
        >
          🏆
        </div>

        {/* Cercle lumineux */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 60%)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🎾</span>
            <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: '2px' }}>
              PADELMATCH
            </span>
          </div>
        </div>

        {/* Badge VICTOIRE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1a1a1a',
              padding: '16px 40px',
              borderRadius: '50px',
              fontSize: '32px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(251,191,36,0.3)',
            }}
          >
            🏆 VICTOIRE
          </div>
        </div>

        {/* Score si présent */}
        {score && (
          <div
            style={{
              fontSize: '80px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '20px',
              letterSpacing: '-2px',
            }}
          >
            {score}
          </div>
        )}

        {/* Joueurs */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '20px',
          }}
        >
          {player}
          {partner && (
            <span style={{ color: 'rgba(255,255,255,0.7)' }}> & {partner}</span>
          )}
        </div>

        {/* Infos */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
          {club && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📍</span>
              <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)' }}>{club}</span>
            </div>
          )}
          {formattedDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📅</span>
              <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.7)' }}>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Série de victoires */}
        {streak > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(239,68,68,0.2)',
              padding: '16px 24px',
              borderRadius: '16px',
              marginBottom: '20px',
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ fontSize: '32px' }}>🔥</span>
            <span style={{ fontSize: '24px', color: '#fca5a5', fontWeight: '700' }}>
              Série de {streak} victoires !
            </span>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '25px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.4)' }}>
            padelmatch.fr
          </span>
          {totalWins && (
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>
              🏆 {totalWins} victoires cette saison
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}