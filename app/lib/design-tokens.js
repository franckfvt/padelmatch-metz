/**
 * ============================================
 * DESIGN TOKENS - JUNTO
 * ============================================
 * 
 * Brand Guidelines v1.0
 * Palette: Urbain Sport
 * Typography: Satoshi
 * 
 * Usage:
 * import { COLORS, RADIUS, SHADOWS, ANIMATIONS } from '@/app/lib/design-tokens'
 * 
 * ============================================
 */

// ============================================
// COULEURS - PALETTE URBAIN SPORT
// ============================================
export const COLORS = {
  // PRIMARY - Junto Coral (Joueur 1 - Toi)
  primary: '#ff5a5f',
  primaryDark: '#e54549',
  primarySoft: '#fff0f0',
  primaryGlow: 'rgba(255, 90, 95, 0.25)',
  
  // SECONDARY - Slate (Joueur 2 - Partenaire)
  secondary: '#3d4f5f',
  secondaryDark: '#2d3a47',
  secondarySoft: '#f0f3f5',
  
  // ACCENT 1 - Amber (Joueur 3 - Rival)
  amber: '#ffb400',
  amberDark: '#cc9000',
  amberSoft: '#fff8e5',
  
  // ACCENT 2 - Teal (Joueur 4 - Quatrième)
  teal: '#00b8a9',
  tealDark: '#009387',
  tealSoft: '#e5f9f7',
  
  // BACKGROUNDS
  bg: '#fafafa',
  bgSoft: '#f5f5f5',
  card: '#ffffff',
  
  // TEXT
  ink: '#1a1a1a',
  dark: '#2d2d2d',
  gray: '#6b7280',
  muted: '#9ca3af',
  
  // BORDERS
  border: '#e5e7eb',
  borderLight: '#f1f5f9',
  
  // STATES
  success: '#00b8a9',  // Teal
  successSoft: '#e5f9f7',
  danger: '#ff5a5f',   // Junto Coral
  dangerSoft: '#fff0f0',
  warning: '#ffb400',  // Amber
  warningSoft: '#fff8e5',
  warningLight: '#fff8e5', // Legacy alias
  info: '#3d4f5f',     // Slate
  infoSoft: '#f0f3f5',
  
  // WHITE
  white: '#ffffff',
  
  // LEGACY COMPATIBILITY (à migrer progressivement)
  accent: '#ff5a5f',
  accentLight: '#fff0f0',
  accentDark: '#e54549',
  accentText: '#cc4548', // Legacy
  text: '#1a1a1a',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  
  // 4 JOUEURS - Couleurs des dots
  player1: '#ff5a5f',  // Coral - Toi
  player2: '#3d4f5f',  // Slate - Partenaire
  player3: '#ffb400',  // Amber - Rival
  player4: '#00b8a9',  // Teal - Quatrième
  
  // Avatars (palette pour les joueurs)
  avatars: ['#ff5a5f', '#3d4f5f', '#ffb400', '#00b8a9', '#a855f7', '#ec4899', '#06b6d4', '#14b8a6']
}

// ============================================
// LES 4 POINTS - BRAND DNA
// ============================================
export const FOUR_DOTS = {
  colors: [COLORS.player1, COLORS.player2, COLORS.player3, COLORS.player4],
  labels: ['Toi', 'Partenaire', 'Rival', 'Quatrième'],
  size: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  gap: {
    xs: 3,
    sm: 4,
    md: 6,
    lg: 8
  }
}

// ============================================
// RAYONS DE BORDURE
// ============================================
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,  // Pour les boutons pill
  full: 9999  // Rond parfait
}

// ============================================
// OMBRES
// ============================================
export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  xl: '0 12px 32px rgba(0,0,0,0.15)',
  
  // Glow colorés (pour boutons au hover)
  primaryGlow: '0 12px 24px rgba(255, 90, 95, 0.25)',
  tealGlow: '0 12px 24px rgba(0, 184, 169, 0.25)',
  slateGlow: '0 12px 24px rgba(61, 79, 95, 0.25)',
  
  // Card hover
  cardHover: '0 20px 40px rgba(0,0,0,0.08)'
}

// ============================================
// ESPACEMENTS
// ============================================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
}

// ============================================
// TYPOGRAPHIE - SATOSHI
// ============================================
export const TYPOGRAPHY = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  
  // Weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  
  // Scale
  sizes: {
    h1: { size: 56, weight: 700, letterSpacing: -2, lineHeight: 1.1 },
    h2: { size: 40, weight: 700, letterSpacing: -1, lineHeight: 1.2 },
    h3: { size: 28, weight: 700, letterSpacing: 0, lineHeight: 1.3 },
    h4: { size: 20, weight: 600, letterSpacing: 0, lineHeight: 1.4 },
    body: { size: 16, weight: 400, letterSpacing: 0, lineHeight: 1.6 },
    small: { size: 14, weight: 400, letterSpacing: 0, lineHeight: 1.5 },
    tiny: { size: 12, weight: 500, letterSpacing: 0.5, lineHeight: 1.4 }
  }
}

// ============================================
// ANIMATIONS
// ============================================
export const ANIMATIONS = {
  // Breathing pour les 4 dots
  breathing: {
    duration: '3s',
    timing: 'ease-in-out',
    keyframes: `
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
    `
  },
  
  // Spring pour les interactions
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Durées
  durations: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.4s'
  },
  
  // Hover lift
  hoverLift: {
    transform: 'translateY(-4px)',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
}

// ============================================
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
}

// ============================================
// HELPERS
// ============================================

// Couleur d'avatar basée sur le nom
export function getAvatarColor(name) {
  const charCode = name?.[0]?.charCodeAt(0) || 0
  return COLORS.avatars[charCode % COLORS.avatars.length]
}

// Couleur de joueur par index (0-3)
export function getPlayerColor(index) {
  return FOUR_DOTS.colors[index % 4]
}

// ============================================
// CONFIGS
// ============================================
export const AMBIANCE_CONFIG = {
  loisir: { emoji: '😎', label: 'Détente', color: COLORS.teal },
  mix: { emoji: '⚡', label: 'Équilibré', color: COLORS.secondary },
  compet: { emoji: '🏆', label: 'Compétitif', color: COLORS.amber }
}

export const POSITION_CONFIG = {
  left: { emoji: '⬅️', label: 'Gauche' },
  right: { emoji: '➡️', label: 'Droite' },
  both: { emoji: '↔️', label: 'Polyvalent' }
}

export const FREQUENCY_CONFIG = {
  occasional: { emoji: '🗓️', label: '1-2x/mois' },
  regular: { emoji: '📅', label: '1x/sem' },
  often: { emoji: '🔥', label: '2-3x/sem' },
  intense: { emoji: '⚡', label: '4x+/sem' }
}

// ============================================
// COMPOSANTS PRÉ-DÉFINIS
// ============================================
export const BUTTON_STYLES = {
  primary: {
    background: COLORS.primary,
    color: COLORS.white,
    padding: '16px 32px',
    borderRadius: RADIUS.pill,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    transition: ANIMATIONS.hoverLift.transition,
  },
  secondary: {
    background: COLORS.secondary,
    color: COLORS.white,
    padding: '16px 32px',
    borderRadius: RADIUS.pill,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer'
  },
  outline: {
    background: 'transparent',
    color: COLORS.dark,
    padding: '14px 30px',
    borderRadius: RADIUS.pill,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: 15,
    border: `2px solid ${COLORS.border}`,
    cursor: 'pointer'
  },
  teal: {
    background: COLORS.teal,
    color: COLORS.white,
    padding: '16px 32px',
    borderRadius: RADIUS.pill,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer'
  }
}

export const CARD_STYLES = {
  session: {
    background: COLORS.card,
    borderRadius: RADIUS.xxl,
    border: `2px solid ${COLORS.border}`,
    overflow: 'hidden',
    transition: 'all 0.4s ease',
  },
  accentBar: {
    height: 4,
    background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.amber})`
  }
}

export const BADGE_STYLES = {
  available: {
    background: COLORS.teal,
    color: COLORS.white,
    padding: '8px 14px',
    borderRadius: RADIUS.md,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold
  },
  full: {
    background: COLORS.bgSoft,
    color: COLORS.gray,
    padding: '8px 14px',
    borderRadius: RADIUS.md,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weights.bold
  }
}
