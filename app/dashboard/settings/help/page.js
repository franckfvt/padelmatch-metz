'use client'

/**
 * ============================================
 * PAGE: Aide & Support - 2×2 BRAND
 * ============================================
 */

import { useState } from 'react'
import Link from 'next/link'

const COLORS = {
  p1: '#ff5a5f', p2: '#ffb400', p3: '#00b8a9', p4: '#7c5cff',
  p3Soft: '#e5f9f7',
  ink: '#1a1a1a', gray: '#6b7280', muted: '#9ca3af',
  bg: '#fafafa', bgSoft: '#f5f5f5', card: '#ffffff', border: '#e5e7eb', white: '#ffffff',
}

const PLAYER_COLORS = [COLORS.p1, COLORS.p2, COLORS.p3, COLORS.p4]

function LinkRow({ icon, label, description, href }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderTop: `1px solid ${COLORS.bgSoft}`, cursor: 'pointer' }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 14, color: COLORS.ink }}>{label}</div>
          <div style={{ fontSize: 12, color: COLORS.gray }}>{description}</div>
        </div>
        <span style={{ color: COLORS.muted, fontSize: 16 }}>›</span>
      </div>
    </Link>
  )
}

export default function HelpSettingsPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'account', label: '👤 Compte' },
    { id: 'matches', label: '🎾 Parties' },
    { id: 'community', label: '👥 Communauté' },
    { id: 'other', label: '❓ Autre' }
  ]

  const faqs = [
    { category: 'account', question: 'Comment modifier mon profil ?', answer: 'Va dans l\'onglet "Moi" puis clique sur "Modifier" en haut de la page. Tu pourras changer ta photo, ton nom, ta bio, ton niveau et tes préférences.' },
    { category: 'account', question: 'Comment changer mon mot de passe ?', answer: 'Va dans "Moi" → "Mon compte" → "Modifier mon mot de passe". Entre un nouveau mot de passe et confirme-le.' },
    { category: 'account', question: 'Comment supprimer mon compte ?', answer: 'Va dans "Moi" → "Confidentialité" → "Supprimer mon compte". Attention, cette action est irréversible.' },
    { category: 'account', question: 'Comment fonctionne le système de niveau ?', answer: 'Le niveau va de 1 (débutant) à 10 (expert). Il est auto-déclaré et t\'aide à trouver des joueurs de ton niveau. Sois honnête !' },
    { category: 'matches', question: 'Comment créer une partie ?', answer: 'Clique sur le bouton "+" en bas de l\'écran, ou va dans "Parties" et clique sur "Créer une partie". Remplis les infos et partage-la !' },
    { category: 'matches', question: 'Comment rejoindre une partie ?', answer: 'Va dans "Parties" pour voir les parties disponibles. Clique sur une partie puis sur "Rejoindre".' },
    { category: 'matches', question: 'Comment annuler ma participation ?', answer: 'Va dans "Mes parties", trouve la partie et clique sur "Se désister". Préviens le plus tôt possible !' },
    { category: 'matches', question: 'Comment inviter quelqu\'un à une partie ?', answer: 'Ouvre la partie et clique sur "Partager". Tu peux envoyer le lien par WhatsApp, SMS ou copier le lien.' },
    { category: 'matches', question: 'Comment fonctionne le paiement ?', answer: '2×2 ne gère pas les paiements. Le prix affiché est indicatif. Le paiement se fait directement avec le club ou entre joueurs.' },
    { category: 'community', question: 'Comment ajouter quelqu\'un en favori ?', answer: 'Va dans "Joueurs", trouve le joueur et clique sur l\'étoile ⭐. Tu retrouveras tes favoris dans l\'onglet dédié.' },
    { category: 'community', question: 'Comment inviter des amis sur l\'app ?', answer: 'Va dans ton profil et clique sur "Inviter des amis". Partage ton lien de parrainage par WhatsApp, SMS ou email.' },
    { category: 'other', question: 'Comment fonctionnent les badges ?', answer: 'Les badges récompensent tes actions : jouer des parties, inviter des amis, être membre fondateur, etc.' },
    { category: 'other', question: 'L\'app est-elle gratuite ?', answer: 'Oui, 2×2 est 100% gratuit ! Pas de frais cachés, pas d\'abonnement.' },
    { category: 'other', question: 'Comment proposer une idée ?', answer: 'Va dans "Moi" → "Boîte à idées". Tu peux proposer des améliorations et voter pour les idées des autres.' },
    { category: 'other', question: 'J\'ai trouvé un bug, comment le signaler ?', answer: 'Envoie-nous un email à bugs@2x2.app avec une description du problème et si possible une capture d\'écran.' }
  ]

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter(f => f.category === activeCategory)

  return (
    <div style={{ fontFamily: "'Satoshi', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ color: COLORS.gray, textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.ink }}>❓ Aide & Support</h1>
        <p style={{ color: COLORS.gray, margin: '4px 0 0', fontSize: 14 }}>Questions fréquentes et contact</p>
      </div>

      {/* Contact rapide */}
      <div style={{ background: COLORS.ink, borderRadius: 16, padding: 20, marginBottom: 24, color: COLORS.white }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Besoin d'aide ?</h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>On répond généralement en moins de 24h</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="mailto:support@2x2.app" style={{ padding: '10px 16px', background: COLORS.white, color: COLORS.ink, borderRadius: 100, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ✉️ support@2x2.app
          </a>
          <a href="https://instagram.com/2x2padel" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', color: COLORS.white, borderRadius: 100, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            📸 @2x2padel
          </a>
        </div>
      </div>

      {/* Catégories FAQ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '8px 16px', background: activeCategory === cat.id ? COLORS.ink : COLORS.white, color: activeCategory === cat.id ? COLORS.white : COLORS.gray, border: `1px solid ${COLORS.border}`, borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: COLORS.card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, padding: 20, paddingBottom: 0, color: COLORS.ink }}>📚 Questions fréquentes</h2>
        <div>
          {filteredFaqs.map((faq, index) => (
            <div key={index} style={{ borderTop: index > 0 ? `1px solid ${COLORS.bgSoft}` : 'none' }}>
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ fontWeight: 500, fontSize: 14, color: COLORS.ink, paddingRight: 16 }}>{faq.question}</span>
                <span style={{ fontSize: 14, color: COLORS.muted, transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {openFaq === index && (
                <div style={{ padding: '0 20px 16px', fontSize: 14, color: COLORS.gray, lineHeight: 1.6 }}>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Liens utiles */}
      <div style={{ background: COLORS.card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, padding: 20, paddingBottom: 0, color: COLORS.ink }}>🔗 Liens utiles</h2>
        <div>
          <LinkRow icon="💡" label="Boîte à idées" description="Propose des améliorations" href="/dashboard/ideas" />
          <LinkRow icon="📄" label="Conditions d'utilisation" description="CGU et mentions légales" href="/terms" />
          <LinkRow icon="🔒" label="Confidentialité" description="Gestion de tes données" href="/dashboard/settings/privacy" />
        </div>
      </div>

      {/* Feedback */}
      <div style={{ background: COLORS.p3Soft, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.p3}30`, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💚</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: COLORS.p3 }}>Tu aimes 2×2 ?</h3>
        <p style={{ fontSize: 13, color: COLORS.ink, marginBottom: 16, opacity: 0.8 }}>Aide-nous à grandir en invitant tes amis !</p>
        <Link href="/dashboard/joueurs" style={{ display: 'inline-block', padding: '12px 24px', background: COLORS.p3, color: COLORS.white, borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Inviter des amis
        </Link>
      </div>

      {/* Version */}
      <div style={{ textAlign: 'center', padding: '24px 0', color: COLORS.muted, fontSize: 12 }}>
        2×2 v1.0.0<br />
        Made with 🎾 in France
      </div>
    </div>
  )
}