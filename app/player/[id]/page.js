import { createClient } from '@supabase/supabase-js'
import PublicProfileClient from './PublicProfileClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Générer les meta tags dynamiquement
export async function generateMetadata({ params }) {
  const playerId = params.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', playerId)
    .single()

  if (!profile) {
    return {
      title: 'Joueur introuvable - PadelMatch',
    }
  }

  const levelLabels = {
    'less6months': '1-2',
    '6months2years': '3-4', 
    '2to5years': '5-6',
    'more5years': '7+'
  }

  const level = profile.level || levelLabels[profile.experience] || '?'
  const winRate = profile.matches_played > 0 
    ? Math.round((profile.matches_won || 0) / profile.matches_played * 100) 
    : 0
  const reliability = profile.reliability_score || 100

  const title = `${profile.name} - Niveau ${level} | PadelMatch`
  const description = `Joueur de padel • ${profile.matches_played || 0} parties • ${winRate}% wins • ${reliability}% fiable`
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://padelmatch.fr'}/api/og/player/${playerId}`

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
          alt: `Profil de ${profile.name}`,
        },
      ],
      type: 'profile',
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

export default function PublicProfilePage() {
  return <PublicProfileClient />
}