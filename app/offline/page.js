/**
 * ============================================
 * PAGE OFFLINE - JUNTO PWA
 * ============================================
 * 
 * Affichée quand l'utilisateur est hors ligne
 * et que la page n'est pas en cache
 * 
 * ============================================
 */

'use client'

export default function OfflinePage() {
  return (
    <div style={{
      fontFamily: "'Satoshi', -apple-system, sans-serif",
      background: '#fafafa',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 28,
        padding: 40,
        textAlign: 'center',
        maxWidth: 360,
        width: '100%',
        border: '2px solid #e5e7eb'
      }}>
        {/* Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: '#fff0f0',
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40
        }}>
          📡
        </div>
        
        {/* Titre */}
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 12px'
        }}>
          Pas de connexion
        </h1>
        
        {/* Message */}
        <p style={{
          fontSize: 15,
          color: '#6b7280',
          lineHeight: 1.6,
          margin: '0 0 32px'
        }}>
          On dirait que tu es hors ligne. Vérifie ta connexion internet et réessaie.
        </p>
        
        {/* Bouton retry */}
        <button
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            padding: 16,
            background: '#ff5a5f',
            color: '#ffffff',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(255, 90, 95, 0.25)'
          }}
        >
          🔄 Réessayer
        </button>
        
        {/* Tips */}
        <div style={{
          marginTop: 32,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 12,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
            💡 En attendant tu peux :
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.8
          }}>
            <li>Vérifier ton Wi-Fi ou tes données mobiles</li>
            <li>Activer puis désactiver le mode avion</li>
            <li>Te rapprocher d'une zone avec du réseau</li>
          </ul>
        </div>
        
        {/* Logo */}
        <div style={{
          marginTop: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af' }}>junto</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#ff5a5f', '#3d4f5f', '#ffb400', '#00b8a9'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.5 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}