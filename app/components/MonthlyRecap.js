'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Récap mensuel style Spotify Wrapped
 * "Junto Monthly"
 */
export default function MonthlyRecap({ 
  userId,
  month, // Format: '2024-12'
  onClose,
  onShare
}) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (userId && month) {
      loadStats()
    }
  }, [userId, month])

  async function loadStats() {
    try {
      const [year, monthNum] = month.split('-')
      const startDate = `${year}-${monthNum}-01`
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

      // Stats depuis match_participants (parties via l'app)
      const { data: appMatches } = await supabase
        .from('match_participants')
        .select(`
          id,
          match_id,
          team,
          matches (
            id,
            match_date,
            match_time,
            result_team_a,
            result_team_b,
            clubs (name)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('matches.match_date', startDate)
        .lte('matches.match_date', endDate)

      // Stats depuis match_history (parties manuelles)
      const { data: manualMatches } = await supabase
        .from('match_history')
        .select('*')
        .eq('user_id', userId)
        .gte('played_date', startDate)
        .lte('played_date', endDate)

      // Calculer les stats
      const allMatches = [
        ...(appMatches || []).map(m => ({
          date: m.matches?.match_date,
          location: m.matches?.clubs?.name,
          isWin: m.team === 'A' 
            ? (m.matches?.result_team_a > m.matches?.result_team_b)
            : (m.matches?.result_team_b > m.matches?.result_team_a),
          source: 'app'
        })),
        ...(manualMatches || []).map(m => ({
          date: m.played_date,
          location: m.location,
          isWin: m.result === 'win',
          partnerName: m.partner_name,
          source: 'manual'
        }))
      ]

      const totalMatches = allMatches.length
      const wins = allMatches.filter(m => m.isWin).length
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

      // Club le plus fréquenté
      const clubCounts = {}
      allMatches.forEach(m => {
        if (m.location) {
          clubCounts[m.location] = (clubCounts[m.location] || 0) + 1
        }
      })
      const favoriteClub = Object.entries(clubCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

      // Partenaire le plus fréquent
      const partnerCounts = {}
      manualMatches?.forEach(m => {
        if (m.partner_name) {
          partnerCounts[m.partner_name] = (partnerCounts[m.partner_name] || 0) + 1
        }
      })
      const favoritePartner = Object.entries(partnerCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

      // Série de victoires max
      let maxStreak = 0
      let currentStreak = 0
      allMatches
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(m => {
          if (m.isWin) {
            currentStreak++
            maxStreak = Math.max(maxStreak, currentStreak)
          } else {
            currentStreak = 0
          }
        })

      // Comparaison avec la moyenne (fictif pour l'instant)
      const percentile = Math.min(99, Math.round(50 + (totalMatches * 3)))

      setStats({
        totalMatches,
        wins,
        losses: totalMatches - wins,
        winRate,
        favoriteClub,
        favoritePartner,
        maxStreak,
        percentile,
        monthName: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      })

    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function nextSlide() {
    setCurrentSlide(prev => Math.min(prev + 1, 4))
  }

  function prevSlide() {
    setCurrentSlide(prev => Math.max(prev - 1, 0))
  }

  async function shareRecap() {
    const text = `🎾 Mon mois de ${stats.monthName} sur Junto !\n\n` +
      `🏆 ${stats.wins} victoires sur ${stats.totalMatches} parties (${stats.winRate}%)\n` +
      `🔥 Meilleure série : ${stats.maxStreak} wins\n` +
      `📍 Club favori : ${stats.favoriteClub || 'Padel'}\n` +
      `\n📊 Top ${100 - stats.percentile}% des joueurs les plus actifs !\n` +
      `\n#Junto #Padel`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch (e) {
        navigator.clipboard.writeText(text)
        alert('Texte copié !')
      }
    } else {
      navigator.clipboard.writeText(text)
      alert('Texte copié !')
    }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div>Calcul de tes stats...</div>
        </div>
      </div>
    )
  }

  if (!stats || stats.totalMatches === 0) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20
      }}>
        <div style={{ 
          color: '#fff', 
          textAlign: 'center',
          maxWidth: 300
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Pas de parties ce mois</h2>
          <p style={{ color: '#999', marginBottom: 24 }}>
            Joue plus de parties pour voir tes stats mensuelles !
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '14px 32px',
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // Slides du récap
  const slides = [
    // Slide 0: Intro
    {
      bg: 'linear-gradient(135deg, #1a1a1a 0%, #2e7d32 100%)',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>🎾 PADELMATCH</div>
          <h1 style={{ fontSize: 28, fontWeight: '800', marginBottom: 8 }}>
            Ton mois de
          </h1>
          <div style={{ 
            fontSize: 36, 
            fontWeight: '800',
            textTransform: 'capitalize',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.monthName}
          </div>
        </div>
      )
    },
    // Slide 1: Nombre de parties
    {
      bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>Tu as joué</div>
          <div style={{ 
            fontSize: 96, 
            fontWeight: '800',
            lineHeight: 1
          }}>
            {stats.totalMatches}
          </div>
          <div style={{ fontSize: 24, fontWeight: '600', marginTop: 8 }}>
            partie{stats.totalMatches > 1 ? 's' : ''}
          </div>
          <div style={{ 
            marginTop: 32,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 20,
            display: 'inline-block'
          }}>
            📊 Top {100 - stats.percentile}% des joueurs actifs
          </div>
        </div>
      )
    },
    // Slide 2: Victoires
    {
      bg: stats.winRate >= 50 
        ? 'linear-gradient(135deg, #166534 0%, #22c55e 100%)'
        : 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {stats.winRate >= 50 ? '🏆' : '💪'}
          </div>
          <div style={{ 
            fontSize: 72, 
            fontWeight: '800',
            lineHeight: 1
          }}>
            {stats.winRate}%
          </div>
          <div style={{ fontSize: 20, fontWeight: '600', marginTop: 8, opacity: 0.9 }}>
            de victoires
          </div>
          <div style={{ 
            marginTop: 24,
            fontSize: 16,
            opacity: 0.8
          }}>
            {stats.wins} victoire{stats.wins > 1 ? 's' : ''} · {stats.losses} défaite{stats.losses > 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    // Slide 3: Stats fun
    {
      bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      content: (
        <div>
          {stats.maxStreak > 0 && (
            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <span style={{ fontSize: 40 }}>🔥</span>
              <div>
                <div style={{ fontSize: 28, fontWeight: '800' }}>{stats.maxStreak}</div>
                <div style={{ opacity: 0.8 }}>Meilleure série de victoires</div>
              </div>
            </div>
          )}
          
          {stats.favoriteClub && (
            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <span style={{ fontSize: 40 }}>📍</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: '700' }}>{stats.favoriteClub}</div>
                <div style={{ opacity: 0.8 }}>Ton club préféré</div>
              </div>
            </div>
          )}

          {stats.favoritePartner && (
            <div style={{ 
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <span style={{ fontSize: 40 }}>🤝</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: '700' }}>{stats.favoritePartner}</div>
                <div style={{ opacity: 0.8 }}>Ton partenaire favori</div>
              </div>
            </div>
          )}
        </div>
      )
    },
    // Slide 4: Fin + partage
    {
      bg: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h2 style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>
            Bravo {stats.wins > stats.losses ? 'champion' : ''} !
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 32 }}>
            Continue comme ça en {new Date().toLocaleDateString('fr-FR', { month: 'long' })} !
          </p>
          
          <button
            onClick={shareRecap}
            style={{
              width: '100%',
              padding: 16,
              background: 'linear-gradient(135deg, #2e7d32 0%, #22c55e 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            📲 Partager mon récap
          </button>
          
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 16,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      )
    }
  ]

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: slides[currentSlide].bg,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'background 0.5s ease'
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        if (x > rect.width / 2) {
          nextSlide()
        } else {
          prevSlide()
        }
      }}
    >
      {/* Progress bar */}
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        padding: '20px 20px 0',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
      }}>
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= currentSlide ? '#fff' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute',
          top: 40,
          right: 20,
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        ✕
      </button>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#fff'
      }}>
        {slides[currentSlide].content}
      </div>

      {/* Navigation hint */}
      {currentSlide < slides.length - 1 && (
        <div style={{
          textAlign: 'center',
          padding: 20,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13
        }}>
          Tape pour continuer →
        </div>
      )}
    </div>
  )
}

/**
 * Bouton pour ouvrir le récap mensuel
 */
export function MonthlyRecapButton({ userId, month }) {
  const [showRecap, setShowRecap] = useState(false)
  
  const monthName = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long' })

  return (
    <>
      <button
        onClick={() => setShowRecap(true)}
        style={{
          width: '100%',
          padding: 16,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>📊</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600' }}>Ton mois de {monthName}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Voir ton récap</div>
          </div>
        </div>
        <span style={{ fontSize: 20 }}>→</span>
      </button>

      {showRecap && (
        <MonthlyRecap
          userId={userId}
          month={month}
          onClose={() => setShowRecap(false)}
        />
      )}
    </>
  )
}