import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Génère une image Open Graph pour une partie
 * URL: /api/og/match/[id]
 */
export async function GET(request, { params }) {
  const { id } = params

  // Récupérer la partie depuis Supabase
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      clubs (name),
      profiles (name)
    `)
    .eq('id', id)
    .single()

  if (error || !match) {
    return new Response('Partie non trouvée', { status: 404 })
  }

  const {
    match_date,
    match_time,
    spots_available,
    level_min,
    level_max,
    ambiance,
    price_per_person,
    clubs,
    profiles
  } = match

  const club = clubs?.name || 'Club de Padel'
  const organizer = profiles?.name || 'Organisateur'

  // Formater la date
  let formattedDate = 'Date à confirmer'
  if (match_date) {
    const d = new Date(match_date)
    formattedDate = d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
  }

  const ambianceStyles = {
    'loisir': { label: 'Détente', emoji: '😎', color: '#22c55e' },
    'mix': { label: 'Équilibré', emoji: '⚡', color: '#3b82f6' },
    'compet': { label: 'Compétitif', emoji: '🏆', color: '#f59e0b' }
  }

  const amb = ambianceStyles[ambiance] || ambianceStyles.mix

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '50px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Cercle décoratif */}
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${amb.color}30 0%, transparent 70%)`,
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>🎾</span>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: '2px' }}>
              PADELMATCH
            </span>
          </div>
          <div
            style={{
              background: amb.color,
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {amb.emoji} {amb.label}
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ display: 'flex', flex: 1, gap: '50px' }}>
          {/* Colonne gauche - Date/Heure */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              padding: '40px 50px',
              minWidth: '280px',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '10px' }}>📅</div>
            <div style={{ fontSize: '28px', color: '#fff', fontWeight: '700', textAlign: 'center' }}>
              {formattedDate}
            </div>
            {match_time && (
              <div style={{ fontSize: '48px', color: amb.color, fontWeight: '800', marginTop: '10px' }}>
                {match_time.slice(0, 5)}
              </div>
            )}
          </div>

          {/* Colonne droite - Détails */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: '25px' }}>
            {/* Club */}
            <div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                📍 Lieu
              </div>
              <div style={{ fontSize: '36px', color: '#fff', fontWeight: '700' }}>
                {club}
              </div>
            </div>

            {/* Places */}
            <div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                👥 Places
              </div>
              <div style={{ fontSize: '32px', color: '#fff', fontWeight: '700' }}>
                {spots_available} joueur{spots_available > 1 ? 's' : ''} recherché{spots_available > 1 ? 's' : ''}
              </div>
            </div>

            {/* Niveau */}
            <div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                ⭐ Niveau
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: '#fbbf24',
                    color: '#1a1a1a',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontSize: '28px',
                    fontWeight: '700',
                  }}
                >
                  {level_min || 1} → {level_max || 10}
                </div>
                <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>
                  /10
                </span>
              </div>
            </div>

            {/* Prix si présent */}
            {price_per_person && (
              <div>
                <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                  💰 Prix
                </div>
                <div style={{ fontSize: '28px', color: '#4ade80', fontWeight: '700' }}>
                  {price_per_person}€ / personne
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
            paddingTop: '25px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#fff',
                fontWeight: '700',
              }}
            >
              {organizer.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>
              Organisé par <span style={{ color: '#fff', fontWeight: '600' }}>{organizer}</span>
            </span>
          </div>
          <div
            style={{
              background: amb.color,
              color: '#fff',
              padding: '15px 30px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: '700',
            }}
          >
            S'inscrire →
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