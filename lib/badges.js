/**
 * ============================================
 * BADGES JOUEUR - PADELMATCH
 * ============================================
 * 
 * Limite: 11 caractères max
 * 
 * ============================================
 */

export const PLAYER_BADGES = [
  // 🎮 Style de jeu
  { id: 'attaquant', emoji: '⚔️', label: 'Attaquant', category: 'style' },
  { id: 'muriste', emoji: '🧱', label: 'Muriste', category: 'style' },
  { id: 'defenseur', emoji: '🛡️', label: 'Défenseur', category: 'style' },
  { id: 'sniper', emoji: '🎯', label: 'Sniper', category: 'style' },
  { id: 'tornado', emoji: '🌪️', label: 'Tornado', category: 'style' },
  { id: 'stratege', emoji: '🧠', label: 'Stratège', category: 'style' },
  { id: 'eclair', emoji: '⚡', label: 'Éclair', category: 'style' },
  { id: 'polyvalent', emoji: '🎭', label: 'Polyvalent', category: 'style' },
  { id: 'lobeur', emoji: '🎾', label: 'Lobeur', category: 'style' },
  { id: 'sprinteur', emoji: '💨', label: 'Sprinteur', category: 'style' },

  // 😎 Personnalité
  { id: 'festif', emoji: '🎉', label: 'Festif', category: 'personnalite' },
  { id: 'competitif', emoji: '😤', label: 'Compétitif', category: 'personnalite' },
  { id: 'zen', emoji: '🧘', label: 'Zen', category: 'personnalite' },
  { id: 'intense', emoji: '🔥', label: 'Intense', category: 'personnalite' },
  { id: 'rigolo', emoji: '😂', label: 'Rigolo', category: 'personnalite' },
  { id: 'teamplayer', emoji: '🤝', label: 'Team Player', category: 'personnalite' },
  { id: 'leader', emoji: '👑', label: 'Leader', category: 'personnalite' },
  { id: 'solitaire', emoji: '🐺', label: 'Solitaire', category: 'personnalite' },
  { id: 'bavard', emoji: '🎤', label: 'Bavard', category: 'personnalite' },
  { id: 'silencieux', emoji: '🤫', label: 'Silencieux', category: 'personnalite' },

  // 🤪 Fun
  { id: 'pizza', emoji: '🍕', label: 'Team Pizza', category: 'fun' },
  { id: 'flemmard', emoji: '🦥', label: 'Flemmard', category: 'fun' },
  { id: 'chanceux', emoji: '🎰', label: 'Chanceux', category: 'fun' },
  { id: 'tranquille', emoji: '🐢', label: 'Tranquille', category: 'fun' },
  { id: 'cafe', emoji: '☕', label: 'Café Addict', category: 'fun' },
  { id: 'oups', emoji: '🙈', label: 'Oups!', category: 'fun' },
  { id: 'showman', emoji: '🎪', label: 'Showman', category: 'fun' },
  { id: 'supersub', emoji: '🦸', label: 'Super Sub', category: 'fun' },
  { id: 'monsieurlob', emoji: '🎲', label: 'Mr Lob', category: 'fun' },
  { id: 'aimant', emoji: '🧲', label: 'Aimant', category: 'fun' },

  // 📈 Expérience
  { id: 'debutant', emoji: '🐣', label: 'Débutant', category: 'experience' },
  { id: 'apprenti', emoji: '📚', label: 'Apprenti', category: 'experience' },
  { id: 'diplome', emoji: '🎓', label: 'Diplômé', category: 'experience' },
  { id: 'progression', emoji: '🏋️', label: 'Progression', category: 'experience' },
  { id: 'veteran', emoji: '🧓', label: 'Vétéran', category: 'experience' },
  { id: 'risingstar', emoji: '🌟', label: 'Rising Star', category: 'experience' },

  // 📅 Disponibilité
  { id: 'levetot', emoji: '🌅', label: 'Lève-Tôt', category: 'dispo' },
  { id: 'noctambule', emoji: '🌙', label: 'Noctambule', category: 'dispo' },
  { id: 'weekend', emoji: '📆', label: 'Week-end', category: 'dispo' },
  { id: 'toujoursdispo', emoji: '🔄', label: 'Dispo 24/7', category: 'dispo' },
  { id: 'lastminute', emoji: '⏰', label: 'Last Minute', category: 'dispo' },
  { id: 'planificateur', emoji: '🗓️', label: 'Planifié', category: 'dispo' },
]

export const BADGE_CATEGORIES = [
  { id: 'style', label: '🎮 Style de jeu' },
  { id: 'personnalite', label: '😎 Personnalité' },
  { id: 'fun', label: '🤪 Fun' },
  { id: 'experience', label: '📈 Expérience' },
  { id: 'dispo', label: '📅 Disponibilité' },
]

export function getBadgeById(id) {
  return PLAYER_BADGES.find(b => b.id === id) || null
}

export function getBadgesByCategory(categoryId) {
  return PLAYER_BADGES.filter(b => b.category === categoryId)
}