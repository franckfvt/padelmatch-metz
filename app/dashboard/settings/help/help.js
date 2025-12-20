'use client'

/**
 * ============================================
 * PAGE PARAMÈTRES - AIDE & SUPPORT
 * ============================================
 */

import { useState } from 'react'
import Link from 'next/link'

export default function HelpSettingsPage() {
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      id: 1,
      question: "Comment créer une partie ?",
      answer: "Clique sur le bouton vert \"+ Créer une partie\" depuis l'accueil ou la page Mes parties. Remplis les informations (date, lieu, niveau...) et partage le lien avec tes amis !"
    },
    {
      id: 2,
      question: "Comment inviter des joueurs ?",
      answer: "Sur chaque carte de partie, clique sur \"Inviter des joueurs\". Tu peux copier le lien de la partie, le partager via WhatsApp/SMS/Email, ou chercher directement des joueurs dans l'app."
    },
    {
      id: 3,
      question: "Comment modifier mon niveau ?",
      answer: "Va dans Moi → Mon profil → Modifier. Tu peux ajuster ton niveau de 1 à 10. Sois honnête, ça permet de trouver des joueurs compatibles !"
    },
    {
      id: 4,
      question: "Comment fonctionne le paiement ?",
      answer: "PadelMatch ne gère pas les paiements directement. Tu peux renseigner tes infos de paiement (Lydia, PayPal, RIB) pour que les autres joueurs puissent te payer facilement après la partie."
    },
    {
      id: 5,
      question: "C'est quoi le score de fiabilité ?",
      answer: "C'est un indicateur de ta participation aux parties. Si tu annules souvent ou ne te présentes pas, ton score baisse. Les joueurs fiables sont mis en avant !"
    },
    {
      id: 6,
      question: "Comment annuler ma participation ?",
      answer: "Va sur la page de la partie et clique sur \"Se désister\". Attention : annuler moins de 24h avant impacte ton score de fiabilité."
    },
    {
      id: 7,
      question: "Comment trouver des joueurs près de moi ?",
      answer: "Va dans l'onglet Communauté. Tu y trouveras des joueurs de ta ville et région. Tu peux aussi rejoindre les groupes WhatsApp/Facebook locaux depuis l'onglet Explorer."
    }
  ]

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

      {/* FAQ */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: '#64748b', 
          margin: 0, 
          padding: '16px 20px',
          textTransform: 'uppercase', 
          letterSpacing: 0.5,
          borderBottom: '1px solid #f1f5f9'
        }}>
          Questions fréquentes
        </h2>

        {faqs.map((faq, index) => (
          <div key={faq.id} style={{ borderBottom: index < faqs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <button
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 15, color: '#1a1a2e' }}>
                {faq.question}
              </span>
              <span style={{ 
                color: '#94a3b8', 
                fontSize: 18,
                transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▾
              </span>
            </button>
            {expandedFaq === faq.id && (
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

      {/* Contact */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Nous contacter
        </h2>

        <a 
          href="mailto:support@padelmatch.app"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: '#f8fafc',
            borderRadius: 12,
            marginBottom: 12
          }}>
            <span style={{ fontSize: 24 }}>📧</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>Email</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>support@padelmatch.app</div>
            </div>
          </div>
        </a>

        <a 
          href="https://instagram.com/padelmatch"
          target="_blank"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: '#f8fafc',
            borderRadius: 12
          }}>
            <span style={{ fontSize: 24 }}>📸</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>Instagram</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>@padelmatch</div>
            </div>
          </div>
        </a>
      </div>

      {/* Feedback */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        border: '1px solid #bbf7d0'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 32 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#166534', marginBottom: 4 }}>
              Une idée ? Un bug ?
            </div>
            <div style={{ fontSize: 14, color: '#15803d', marginBottom: 12 }}>
              Ton avis nous aide à améliorer l'app !
            </div>
            <a 
              href="mailto:feedback@padelmatch.app?subject=Feedback PadelMatch"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#22c55e',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Envoyer un feedback
            </a>
          </div>
        </div>
      </div>

      {/* Version */}
      <div style={{
        textAlign: 'center',
        padding: 20,
        color: '#94a3b8',
        fontSize: 13
      }}>
        <div>PadelMatch v1.0.0</div>
        <div style={{ marginTop: 4 }}>Made with 🎾 in France</div>
      </div>
    </div>
  )
}