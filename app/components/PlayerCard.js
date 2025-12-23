'use client'

import { getBadgeById } from '@/app/lib/badges'
import { COLORS, FOUR_DOTS } from '@/app/lib/design-tokens'

export default function PlayerCard({ player, variant = 'mobile' }) {
  const positionConfig = { right: { emoji: '➡️', label: 'Droite' }, left: { emoji: '⬅️', label: 'Gauche' }, both: { emoji: '↔️', label: 'Polyvalent' } }
  const frequencyConfig = { intense: '4+/sem', often: '2-3x/sem', regular: '1x/sem', occasional: '1-2/mois' }
  const position = positionConfig[player?.position] || positionConfig.both
  const frequency = frequencyConfig[player?.frequency] || '2-3x/sem'
  const badge = player?.badge ? getBadgeById(player.badge) : null
  const city = player?.city || 'France'
  const initial = player?.name?.[0]?.toUpperCase() || '?'

  if (variant === 'share') {
    return (
      <div style={{ width: 400, height: 210, background: COLORS.ink, borderRadius: 24, overflow: 'hidden', fontFamily: "'Satoshi', sans-serif", display: 'flex', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber}, ${COLORS.teal})` }} />
        <div style={{ width: 140, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ border: `2px solid ${COLORS.primary}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center', background: `${COLORS.primary}15` }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.primary, lineHeight: 1 }}>{player?.level || '5'}</div>
            <div style={{ fontSize: 9, color: COLORS.primary, marginTop: 4, fontWeight: 700, letterSpacing: 1 }}>NIVEAU</div>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{position.emoji} {position.label}</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: player?.avatar_url ? `url(${player.avatar_url}) center/cover` : COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', border: `3px solid ${COLORS.primary}`, flexShrink: 0 }}>{!player?.avatar_url && initial}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{player?.name || 'Joueur'}</div>
              <div style={{ fontSize: 12, opacity: 0.6, color: '#fff', marginTop: 4 }}>📍 {city}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{badge?.emoji || '⚔️'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{badge?.label || 'Joueur'}</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{frequency}</div>
              <div style={{ fontSize: 8, opacity: 0.5, color: '#fff' }}>FRÉQUENCE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.5, color: '#fff' }}>junto</span>
            <div style={{ display: 'flex', gap: 3 }}>{FOUR_DOTS.colors.map((c, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: c, opacity: 0.5 }} />)}</div>
          </div>
        </div>
      </div>
    )
  }

  // MOBILE
  return (
    <div style={{ width: 280, background: COLORS.ink, borderRadius: 24, padding: 28, fontFamily: "'Satoshi', sans-serif", color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber}, ${COLORS.teal})` }} />
      <div style={{ width: 90, height: 90, borderRadius: 24, background: player?.avatar_url ? `url(${player.avatar_url}) center/cover` : COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, margin: '0 auto 18px', border: `4px solid ${COLORS.primary}` }}>{!player?.avatar_url && initial}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{player?.name || 'Joueur'}</div>
      <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 22 }}>📍 {city}</div>
      <div style={{ background: `${COLORS.primary}20`, border: `2px solid ${COLORS.primary}`, borderRadius: 18, padding: '18px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: COLORS.primary, lineHeight: 1 }}>{player?.level || '5'}</div>
        <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 6, fontWeight: 600 }}>NIVEAU</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{position.label}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Poste</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '12px 14px', borderRadius: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{frequency}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Fréquence</div>
        </div>
      </div>
      {badge && <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 18px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}><span style={{ fontSize: 18 }}>{badge.emoji}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{badge.label}</span></div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.4 }}>
        <span style={{ fontSize: 12 }}>junto</span>
        <div style={{ display: 'flex', gap: 3 }}>{FOUR_DOTS.colors.map((c, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />)}</div>
      </div>
    </div>
  )
}
