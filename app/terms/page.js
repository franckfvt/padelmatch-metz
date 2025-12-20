'use client'

/**
 * ============================================
 * PAGE: Conditions d'utilisation
 * ============================================
 */

import Link from 'next/link'

export default function TermsPage() {
  const lastUpdated = '20 décembre 2024'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard/me" style={{ 
            color: '#64748b', 
            textDecoration: 'none', 
            fontSize: 14,
            display: 'flex',
            alignItems: 'center'
          }}>
            ← Retour
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
            Conditions d'utilisation
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            Dernière mise à jour : {lastUpdated}
          </p>

          <Section title="1. Acceptation des conditions">
            <p>
              En utilisant PadelMatch, vous acceptez les présentes conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
            </p>
          </Section>

          <Section title="2. Description du service">
            <p>
              PadelMatch est une application permettant aux joueurs de padel de :
            </p>
            <ul>
              <li>Organiser et rejoindre des parties de padel</li>
              <li>Trouver des partenaires de jeu</li>
              <li>Découvrir des clubs et communautés de padel</li>
              <li>Gérer leurs statistiques et leur profil</li>
            </ul>
          </Section>

          <Section title="3. Inscription et compte">
            <p>
              Pour utiliser PadelMatch, vous devez :
            </p>
            <ul>
              <li>Avoir au moins 16 ans</li>
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Maintenir la confidentialité de vos identifiants</li>
              <li>Nous informer de toute utilisation non autorisée de votre compte</li>
            </ul>
          </Section>

          <Section title="4. Règles de conduite">
            <p>
              En utilisant PadelMatch, vous vous engagez à :
            </p>
            <ul>
              <li>Respecter les autres utilisateurs</li>
              <li>Ne pas publier de contenu offensant, illégal ou inapproprié</li>
              <li>Honorer vos engagements (présence aux parties confirmées)</li>
              <li>Ne pas utiliser l'application à des fins commerciales non autorisées</li>
              <li>Ne pas tenter de pirater ou perturber le service</li>
            </ul>
          </Section>

          <Section title="5. Responsabilités">
            <p>
              PadelMatch est un outil de mise en relation. Nous ne sommes pas responsables :
            </p>
            <ul>
              <li>Des interactions entre utilisateurs</li>
              <li>Des blessures survenues lors des parties</li>
              <li>Des réservations de terrains (à régler directement avec les clubs)</li>
              <li>Du comportement des autres utilisateurs</li>
            </ul>
            <p>
              Nous vous recommandons de toujours vérifier les informations et de prendre 
              les précautions nécessaires lors de vos rencontres sportives.
            </p>
          </Section>

          <Section title="6. Propriété intellectuelle">
            <p>
              L'ensemble du contenu de PadelMatch (logo, design, code, textes) est protégé 
              par le droit d'auteur. Toute reproduction sans autorisation est interdite.
            </p>
          </Section>

          <Section title="7. Protection des données">
            <p>
              Nous collectons et traitons vos données personnelles conformément au RGPD. 
              Pour plus d'informations, consultez notre politique de confidentialité.
            </p>
            <p>
              Vos données sont utilisées pour :
            </p>
            <ul>
              <li>Fournir le service</li>
              <li>Améliorer l'application</li>
              <li>Vous envoyer des notifications (si autorisé)</li>
            </ul>
          </Section>

          <Section title="8. Modifications">
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. 
              Les modifications seront effectives dès leur publication. 
              En continuant à utiliser l'application, vous acceptez les nouvelles conditions.
            </p>
          </Section>

          <Section title="9. Résiliation">
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres. 
              Nous nous réservons le droit de suspendre ou supprimer tout compte ne 
              respectant pas ces conditions.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question concernant ces conditions, contactez-nous à :
            </p>
            <p>
              <a href="mailto:legal@padelmatch.app" style={{ color: '#3b82f6' }}>
                legal@padelmatch.app
              </a>
            </p>
          </Section>

          {/* Footer */}
          <div style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              PadelMatch - Joue, partage, progresse
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
        {children}
      </div>
      <style jsx>{`
        ul {
          margin: 8px 0;
          padding-left: 20px;
        }
        li {
          margin: 6px 0;
        }
        p {
          margin: 8px 0;
        }
      `}</style>
    </div>
  )
}