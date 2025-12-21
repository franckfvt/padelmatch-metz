/**
 * ============================================
 * DESIGN TOKENS - PADELMATCH
 * ============================================
 * 
 * Palette de couleurs et constantes de design
 * à importer dans toutes les pages pour garantir
 * la cohérence visuelle.
 * 
 * Usage:
 * import { COLORS, RADIUS, SHADOWS } from '@/app/lib/design-tokens'
 * 
 * ============================================
 */

// ============================================
// COULEURS
// ============================================
export const COLORS = {
  // Fond
  bg: '#f8fafc',           // Fond principal (gris très clair)
  card: '#ffffff',         // Fond des cartes
  cardDark: '#1e293b',     // Fond sombre (carte joueur, header match)
  
  // Texte
  text: '#1a1a2e',         // Texte principal (quasi noir)
  textMuted: '#64748b',    // Texte secondaire (gris)
  textLight: '#94a3b8',    // Texte tertiaire (gris clair)
  textOnDark: '#ffffff',   // Texte sur fond sombre
  
  // Accent (vert PadelMatch)
  accent: '#22c55e',       // Vert principal
  accentLight: '#dcfce7',  // Vert très clair (fond)
  accentDark: '#16a34a',   // Vert foncé (hover)
  accentText: '#166534',   // Vert texte
  
  // Bordures
  border: '#e2e8f0',       // Bordure standard
  borderLight: '#f1f5f9',  // Bordure légère
  
  // États
  danger: '#ef4444',       // Rouge erreur
  dangerLight: '#fee2e2',  // Rouge clair fond
  warning: '#f59e0b',      // Orange warning
  warningLight: '#fef3c7', // Orange clair fond
  info: '#3b82f6',         // Bleu info
  infoLight: '#dbeafe',    // Bleu clair fond
  
  // Équipes
  teamA: '#3b82f6',        // Bleu équipe A
  teamB: '#f97316',        // Orange équipe B
  
  // Avatars (palette pour les joueurs sans photo)
  avatars: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']
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
  full: 9999  // Rond parfait
}

// ============================================
// OMBRES
// ============================================
export const SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  xl: '0 12px 32px rgba(0,0,0,0.15)'
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
// BREAKPOINTS
// ============================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
}

// ============================================
// HELPER: Couleur d'avatar basée sur le nom
// ============================================
export function getAvatarColor(name) {
  const charCode = name?.[0]?.charCodeAt(0) || 0
  return COLORS.avatars[charCode % COLORS.avatars.length]
}

// ============================================
// LABELS CONSTANTS
// ============================================
export const AMBIANCE_CONFIG = {
  loisir: { emoji: '😎', label: 'Détente', color: COLORS.accent },
  mix: { emoji: '⚡', label: 'Équilibré', color: COLORS.info },
  compet: { emoji: '🏆', label: 'Compétitif', color: COLORS.warning }
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