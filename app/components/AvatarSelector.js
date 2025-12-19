'use client'

import { useState } from 'react'

/**
 * Avatars pré-définis style illustration padel
 * Le joueur choisit parmi ces options s'il n'a pas de photo
 */

// Configuration des avatars
const AVATAR_STYLES = [
  // Hommes
  { id: 'man-1', gender: 'man', skin: '#f5d0c5', hair: '#2c1810', shirt: '#2e7d32' },
  { id: 'man-2', gender: 'man', skin: '#e8beac', hair: '#1a1a1a', shirt: '#1e40af' },
  { id: 'man-3', gender: 'man', skin: '#d4a574', hair: '#2c1810', shirt: '#dc2626' },
  { id: 'man-4', gender: 'man', skin: '#8d5524', hair: '#1a1a1a', shirt: '#7c3aed' },
  { id: 'man-5', gender: 'man', skin: '#f5d0c5', hair: '#d4a574', shirt: '#ea580c' },
  { id: 'man-6', gender: 'man', skin: '#c68642', hair: '#1a1a1a', shirt: '#0891b2' },
  // Femmes
  { id: 'woman-1', gender: 'woman', skin: '#f5d0c5', hair: '#2c1810', shirt: '#ec4899' },
  { id: 'woman-2', gender: 'woman', skin: '#e8beac', hair: '#1a1a1a', shirt: '#2e7d32' },
  { id: 'woman-3', gender: 'woman', skin: '#d4a574', hair: '#8b4513', shirt: '#7c3aed' },
  { id: 'woman-4', gender: 'woman', skin: '#8d5524', hair: '#1a1a1a', shirt: '#dc2626' },
  { id: 'woman-5', gender: 'woman', skin: '#f5d0c5', hair: '#fbbf24', shirt: '#0891b2' },
  { id: 'woman-6', gender: 'woman', skin: '#c68642', hair: '#2c1810', shirt: '#ea580c' },
]

/**
 * Génère un SVG d'avatar
 */
export function generateAvatarSVG({ gender, skin, hair, shirt, size = 200 }) {
  if (gender === 'woman') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="200" height="200" rx="100" fill="#f5f5f5"/>
        
        <!-- Body / Shirt -->
        <ellipse cx="100" cy="195" rx="55" ry="45" fill="${shirt}"/>
        
        <!-- Neck -->
        <rect x="85" y="130" width="30" height="25" fill="${skin}"/>
        
        <!-- Face -->
        <ellipse cx="100" cy="95" rx="45" ry="50" fill="${skin}"/>
        
        <!-- Hair back -->
        <ellipse cx="100" cy="75" rx="48" ry="45" fill="${hair}"/>
        
        <!-- Hair front/bangs -->
        <path d="M55 80 Q60 50 100 45 Q140 50 145 80 Q140 65 100 60 Q60 65 55 80" fill="${hair}"/>
        
        <!-- Hair sides (long) -->
        <ellipse cx="58" cy="110" rx="12" ry="35" fill="${hair}"/>
        <ellipse cx="142" cy="110" rx="12" ry="35" fill="${hair}"/>
        
        <!-- Eyes -->
        <ellipse cx="80" cy="95" rx="6" ry="7" fill="#1a1a1a"/>
        <ellipse cx="120" cy="95" rx="6" ry="7" fill="#1a1a1a"/>
        <circle cx="82" cy="93" r="2" fill="#fff"/>
        <circle cx="122" cy="93" r="2" fill="#fff"/>
        
        <!-- Eyebrows -->
        <path d="M70 82 Q80 78 90 82" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M110 82 Q120 78 130 82" stroke="${hair}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        
        <!-- Nose -->
        <path d="M100 95 Q103 105 100 112" stroke="${skin}" stroke-width="3" fill="none" opacity="0.5"/>
        
        <!-- Smile -->
        <path d="M85 120 Q100 132 115 120" stroke="#c44" stroke-width="3" fill="none" stroke-linecap="round"/>
        
        <!-- Blush -->
        <ellipse cx="70" cy="115" rx="8" ry="5" fill="#ffb4b4" opacity="0.5"/>
        <ellipse cx="130" cy="115" rx="8" ry="5" fill="#ffb4b4" opacity="0.5"/>
        
        <!-- Padel racket -->
        <ellipse cx="160" cy="160" rx="18" ry="24" fill="#1a1a1a" transform="rotate(-20 160 160)"/>
        <ellipse cx="160" cy="160" rx="14" ry="20" fill="#fbbf24" transform="rotate(-20 160 160)"/>
        <rect x="155" y="178" width="8" height="20" rx="3" fill="#8b4513" transform="rotate(-20 159 188)"/>
      </svg>
    `
  }
  
  // Man
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="200" height="200" rx="100" fill="#f5f5f5"/>
      
      <!-- Body / Shirt -->
      <ellipse cx="100" cy="195" rx="55" ry="45" fill="${shirt}"/>
      
      <!-- Neck -->
      <rect x="82" y="130" width="36" height="25" fill="${skin}"/>
      
      <!-- Face -->
      <ellipse cx="100" cy="95" rx="45" ry="50" fill="${skin}"/>
      
      <!-- Hair -->
      <ellipse cx="100" cy="65" rx="42" ry="30" fill="${hair}"/>
      <path d="M58 75 Q60 55 100 50 Q140 55 142 75 Q135 60 100 55 Q65 60 58 75" fill="${hair}"/>
      
      <!-- Eyes -->
      <ellipse cx="80" cy="95" rx="6" ry="7" fill="#1a1a1a"/>
      <ellipse cx="120" cy="95" rx="6" ry="7" fill="#1a1a1a"/>
      <circle cx="82" cy="93" r="2" fill="#fff"/>
      <circle cx="122" cy="93" r="2" fill="#fff"/>
      
      <!-- Eyebrows -->
      <path d="M68 80 Q80 75 92 80" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M108 80 Q120 75 132 80" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
      
      <!-- Nose -->
      <path d="M100 95 Q105 108 100 115" stroke="${skin}" stroke-width="4" fill="none" opacity="0.5"/>
      
      <!-- Smile -->
      <path d="M85 122 Q100 134 115 122" stroke="#c44" stroke-width="3" fill="none" stroke-linecap="round"/>
      
      <!-- Padel racket -->
      <ellipse cx="160" cy="160" rx="18" ry="24" fill="#1a1a1a" transform="rotate(-20 160 160)"/>
      <ellipse cx="160" cy="160" rx="14" ry="20" fill="#fbbf24" transform="rotate(-20 160 160)"/>
      <rect x="155" y="178" width="8" height="20" rx="3" fill="#8b4513" transform="rotate(-20 159 188)"/>
    </svg>
  `
}

/**
 * Composant Avatar (affichage)
 */
export function Avatar({ 
  avatarId, 
  avatarUrl, 
  name = '',
  size = 60 
}) {
  // Si photo uploadée, l'utiliser
  if (avatarUrl && !avatarUrl.includes('avatar-')) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    )
  }

  // Si avatar sélectionné
  if (avatarId) {
    const avatar = AVATAR_STYLES.find(a => a.id === avatarId)
    if (avatar) {
      const svg = generateAvatarSVG({ ...avatar, size })
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )
    }
  }

  // Avatar par défaut basé sur le nom
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#e5e5e5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: '600',
      color: '#666'
    }}>
      {initial}
    </div>
  )
}

/**
 * Sélecteur d'avatar
 */
export default function AvatarSelector({ 
  selectedId, 
  onSelect,
  currentPhotoUrl
}) {
  const [tab, setTab] = useState('avatars') // 'avatars' ou 'photo'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #eee'
    }}>
      <h3 style={{ fontSize: 16, fontWeight: '600', margin: '0 0 16px' }}>
        📸 Photo de profil
      </h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab('avatars')}
          style={{
            flex: 1,
            padding: '10px',
            background: tab === 'avatars' ? '#2e7d32' : '#f5f5f5',
            color: tab === 'avatars' ? '#fff' : '#666',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🎨 Choisir un avatar
        </button>
        <button
          onClick={() => setTab('photo')}
          style={{
            flex: 1,
            padding: '10px',
            background: tab === 'photo' ? '#2e7d32' : '#f5f5f5',
            color: tab === 'photo' ? '#fff' : '#666',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📷 Ma photo
        </button>
      </div>

      {tab === 'avatars' && (
        <>
          {/* Hommes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Style masculin
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_STYLES.filter(a => a.gender === 'man').map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => onSelect(avatar.id)}
                  style={{
                    padding: 4,
                    border: selectedId === avatar.id ? '3px solid #2e7d32' : '3px solid transparent',
                    borderRadius: '50%',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: generateAvatarSVG({ ...avatar, size: 50 }) 
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Femmes */}
          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Style féminin
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_STYLES.filter(a => a.gender === 'woman').map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => onSelect(avatar.id)}
                  style={{
                    padding: 4,
                    border: selectedId === avatar.id ? '3px solid #2e7d32' : '3px solid transparent',
                    borderRadius: '50%',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: generateAvatarSVG({ ...avatar, size: 50 }) 
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'photo' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Ma photo"
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 16
              }}
            />
          ) : (
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#f5f5f5',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#ccc'
            }}>
              📷
            </div>
          )}
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Tu peux uploader ta propre photo dans les paramètres du profil
          </p>
        </div>
      )}
    </div>
  )
}

// Export des styles pour utilisation externe
export { AVATAR_STYLES }