'use client'

/**
 * ============================================
 * PAGE: Aide & Support - Version 2
 * ============================================
 * 
 * FAQ complète + Contact + Tutoriels
 * 
 * ============================================
 */

import { useState } from 'react'
import Link from 'next/link'

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
    {
      category: 'account',
      question: 'Comment modifier mon profil ?',
      answer: 'Va dans l\'onglet "Moi" puis clique sur le bouton "Modifier" en haut de la page. Tu pourras changer ta photo, ton nom, ta bio, ton niveau et tes préférences de jeu.'
    },
    {
      category: 'account',
      question: 'Comment changer mon mot de passe ?',
      answer: 'Va dans "Moi" → "Mon compte" → "Modifier mon mot de passe". Tu devras entrer un nouveau mot de passe et le confirmer.'
    },
    {
      category: 'account',
      question: 'Comment supprimer mon compte ?',
      answer: 'Va dans "Moi" → "Confidentialité" → "Supprimer mon compte". Attention, cette action est irréversible et supprimera toutes tes données.'
    },
    {
      category: 'account',
      question: 'Comment fonctionne le système de niveau ?',
      answer: 'Le niveau va de 1 (débutant) à 10 (expert). Il est auto-déclaré et t\'aide à trouver des joueurs de ton niveau. Sois honnête pour des parties équilibrées !'
    },
    {
      category: 'matches',
      question: 'Comment créer une partie ?',
      answer: 'Clique sur le bouton vert "+" en bas de l\'écran, ou va dans "Accueil" et clique sur "Créer une partie". Remplis les infos (date, heure, lieu, niveau) et partage-la !'
    },
    {
      category: 'matches',
      question: 'Comment rejoindre une partie ?',
      answer: 'Va dans "Explorer" pour voir les parties disponibles. Clique sur une partie qui t\'intéresse puis sur "Rejoindre". L\'organisateur recevra une notification.'
    },
    {
      category: 'matches',
      question: 'Comment annuler ma participation ?',
      answer: 'Va dans "Mes parties", trouve la partie en question et clique sur "Se désister". Pense à prévenir le plus tôt possible pour que quelqu\'un puisse prendre ta place.'
    },
    {
      category: 'matches',
      question: 'Comment inviter quelqu\'un à une partie ?',
      answer: 'Ouvre la partie et clique sur "Partager". Tu peux envoyer le lien par WhatsApp, SMS ou copier le lien pour le partager où tu veux.'
    },
    {
      category: 'matches',
      question: 'Comment fonctionne le paiement ?',
      answer: 'PadelMatch ne gère pas les paiements. Le prix affiché est indicatif. Le paiement se fait directement avec le club ou entre joueurs le jour de la partie.'
    },
    {
      category: 'community',
      question: 'Comment ajouter quelqu\'un en favori ?',
      answer: 'Va dans "Communauté", trouve le joueur et clique sur l\'étoile ⭐ à côté de son nom. Tu pourras retrouver tes favoris dans l\'onglet "Favoris".'
    },
    {
      category: 'community',
      question: 'Comment inviter des amis sur l\'app ?',
      answer: 'Va dans "Communauté" et clique sur "Inviter des amis". Tu peux partager ton lien de parrainage par WhatsApp, SMS ou email. Tu gagneras des badges !'
    },
    {
      category: 'community',
      question: 'Comment ajouter un groupe WhatsApp ?',
      answer: 'Va dans "Explorer" → "Groupes" → "Ajouter un groupe". Remplis les infos et colle le lien d\'invitation. Le groupe sera visible après vérification.'
    },
    {
      category: 'other',
      question: 'Comment fonctionnent les badges ?',
      answer: 'Les badges récompensent tes actions : jouer des parties, inviter des amis, être un membre fondateur, etc. Va dans "Moi" → "Mes Badges" pour voir ta progression.'
    },
    {
      category: 'other',
      question: 'L\'app est-elle gratuite ?',
      answer: 'Oui, PadelMatch est 100% gratuit ! Pas de frais cachés, pas d\'abonnement. On veut juste aider la communauté padel à grandir.'
    },
    {
      category: 'other',
      question: 'Comment proposer une idée ?',
      answer: 'Va dans "Accueil" en bas ou "Moi" → "Boîte à idées". Tu peux proposer des améliorations et voter pour les idées des autres utilisateurs.'
    },
    {
      category: 'other',
      question: 'J\'ai trouvé un bug, comment le signaler ?',
      answer: 'Envoie-nous un email à bugs@padelmatch.app avec une description du problème et si possible une capture d\'écran. On corrigera ça rapidement !'
    }
  ]

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/me" style={{ 
          color: '#64748b', 
          textDecoration: 'none', 
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 8
        }}>
          ← Retour
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          ❓ Aide & Support
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          Questions fréquentes et contact
        </p>
      </div>

      {/* Contact rapide */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #334155)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        color: '#fff'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>
          Besoin d'aide ?
        </h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>
          On répond généralement en moins de 24h
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="mailto:support@padelmatch.app"
            style={{
              padding: '10px 16px',
              background: '#fff',
              color: '#1a1a2e',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            ✉️ support@padelmatch.app
          </a>
          <a
            href="https://instagram.com/padelmatch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            📸 @padelmatch
          </a>
        </div>
      </div>

      {/* Catégories FAQ */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '8px 16px',
              background: activeCategory === cat.id ? '#1a1a2e' : '#fff',
              color: activeCategory === cat.id ? '#fff' : '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, padding: 20, paddingBottom: 0, color: '#1a1a2e' }}>
          📚 Questions fréquentes
        </h2>

        <div>
          {filteredFaqs.map((faq, index) => (
            <div key={index} style={{ borderTop: index > 0 ? '1px solid #f1f5f9' : 'none' }}>
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e', paddingRight: 16 }}>
                  {faq.question}
                </span>
                <span style={{
                  fontSize: 18,
                  color: '#94a3b8',
                  transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </span>
              </button>
              
              {openFaq === index && (
                <div style={{
                  padding: '0 20px 16px',
                  fontSize: 14,
                  color: '#64748b',
                  lineHeight: 1.6
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Liens utiles */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, padding: 20, paddingBottom: 0, color: '#1a1a2e' }}>
          🔗 Liens utiles
        </h2>

        <div>
          <LinkRow 
            icon="💡" 
            label="Boîte à idées" 
            description="Propose des améliorations"
            href="/dashboard/ideas" 
          />
          <LinkRow 
            icon="📄" 
            label="Conditions d'utilisation" 
            description="CGU et mentions légales"
            href="/terms" 
          />
          <LinkRow 
            icon="🔒" 
            label="Confidentialité" 
            description="Gestion de tes données"
            href="/dashboard/settings/privacy" 
          />
        </div>
      </div>

      {/* Feedback */}
      <div style={{
        background: '#f0fdf4',
        borderRadius: 16,
        padding: 20,
        border: '1px solid #bbf7d0',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💚</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#166534' }}>
          Tu aimes PadelMatch ?
        </h3>
        <p style={{ fontSize: 13, color: '#15803d', marginBottom: 16 }}>
          Aide-nous à grandir en invitant tes amis !
        </p>
        <Link
          href="/dashboard/community"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#22c55e',
            color: '#fff',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          Inviter des amis
        </Link>
      </div>

      {/* Version */}
      <div style={{
        textAlign: 'center',
        padding: '24px 0',
        color: '#94a3b8',
        fontSize: 12
      }}>
        PadelMatch v1.0.0
        <br />
        Made with 🎾 in France
      </div>
    </div>
  )
}

function LinkRow({ icon, label, description, href }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderTop: '1px solid #f1f5f9',
        cursor: 'pointer'
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{description}</div>
        </div>
        <span style={{ color: '#cbd5e1', fontSize: 16 }}>›</span>
      </div>
    </Link>
  )
}