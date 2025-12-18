import { createClient } from '@supabase/supabase-js'
import JoinMatchClient from './JoinMatchClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Générer les meta tags dynamiquement
export async function generateMetadata({ params }) {
  const matchId = params.matchId

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
    return {
      title: 'Partie introuvable - PadelMatch',
    }
  }

  // Compter les participants
  const { count: participantsCount } = await supabase
    .from('match_participants')
    .select('id', { count: 'exact' })
    .eq('match_id', matchId)

  const totalPlayers = 1 + (participantsCount || 0)
  const spotsLeft = match.spots_total - totalPlayers

  // Formater la date
  const date = new Date(match.match_date)
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = match.match_time?.slice(0, 5) || ''

  const levelLabels = {
    'less6months': '1-2',
    '6months2years': '3-4',
    '2to5years': '5-6',
    'more5years': '7+',
    'all': 'tous niveaux'
  }
  const level = match.level_required ? levelLabels[match.level_required] || match.level_required : 'tous niveaux'

  const title = `🎾 Cherche ${spotsLeft} joueur${spotsLeft > 1 ? 's' : ''} niveau ${level}`
  const description = `${dateStr} à ${timeStr} • ${match.clubs?.name} • Organisé par ${match.profiles?.name}`
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://padelmatch.fr'}/api/og/match/${matchId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: `Partie de padel - ${dateStr}`,
        },
      ],
      type: 'website',
      siteName: 'PadelMatch',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function JoinMatchPage({ params }) {
  return <JoinMatchClient matchId={params.matchId} />
}