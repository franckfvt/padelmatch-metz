'use client'

/**
 * ============================================
 * PWA PROVIDER - JUNTO
 * ============================================
 * 
 * Gère :
 * - Enregistrement du Service Worker
 * - Prompt d'installation PWA
 * - Détection du mode standalone
 * - Updates du SW
 * 
 * Usage dans layout.js :
 * <PWAProvider>
 *   {children}
 * </PWAProvider>
 * 
 * ============================================
 */

import { createContext, useContext, useState, useEffect } from 'react'

const PWAContext = createContext({
  isInstalled: false,
  isStandalone: false,
  canInstall: false,
  installApp: () => {},
  updateAvailable: false,
  updateApp: () => {}
})

export function usePWA() {
  return useContext(PWAContext)
}

export function PWAProvider({ children }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    // Vérifier si en mode standalone (installé)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone // iOS
        || document.referrer.includes('android-app://')
      
      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }
    
    checkStandalone()
    
    // Écouter les changements de display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkStandalone)
    
    return () => mediaQuery.removeEventListener('change', checkStandalone)
  }, [])

  useEffect(() => {
    // Intercepter le prompt d'installation
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
      console.log('[PWA] Install prompt intercepté')
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Détecter quand l'app est installée
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      console.log('[PWA] App installée !')
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré:', registration.scope)
          
          // Vérifier les updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                setUpdateAvailable(true)
                setWaitingWorker(newWorker)
                console.log('[PWA] Nouvelle version disponible')
              }
            })
          })
        })
        .catch((error) => {
          console.error('[PWA] Erreur enregistrement SW:', error)
        })
      
      // Écouter les messages du SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          console.log('[PWA] Cache mis à jour')
        }
      })
    }
  }, [])

  // Déclencher l'installation
  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Pas de prompt disponible')
      return false
    }
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log('[PWA] Choix utilisateur:', outcome)
    
    setDeferredPrompt(null)
    setCanInstall(false)
    
    return outcome === 'accepted'
  }

  // Appliquer la mise à jour
  const updateApp = () => {
    if (!waitingWorker) return
    
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    setUpdateAvailable(false)
    window.location.reload()
  }

  return (
    <PWAContext.Provider value={{
      isInstalled,
      isStandalone,
      canInstall,
      installApp,
      updateAvailable,
      updateApp
    }}>
      {children}
    </PWAContext.Provider>
  )
}

/**
 * ============================================
 * COMPOSANT INSTALL BANNER
 * ============================================
 * 
 * Bannière pour inciter à installer l'app
 * À placer où tu veux dans ton app
 * 
 * ============================================
 */

export function InstallBanner({ onDismiss = () => {} }) {
  const { canInstall, installApp, isStandalone } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Vérifier si déjà dismissée
    const wasDismissed = localStorage.getItem('junto-install-dismissed')
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed)
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24)
      // Remontre après 7 jours
      if (daysSince < 7) {
        setDismissed(true)
      }
    }
  }, [])

  if (!canInstall || isStandalone || dismissed) return null

  const handleInstall = async () => {
    setInstalling(true)
    const success = await installApp()
    setInstalling(false)
    
    if (!success) {
      // L'utilisateur a refusé
      handleDismiss()
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('junto-install-dismissed', new Date().toISOString())
    onDismiss?.()
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: 16,
      right: 16,
      background: '#ffffff',
      borderRadius: 20,
      padding: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '2px solid #e5e7eb',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}>
      {/* Icon */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #ff5a5f 0%, #ff8a8d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0
      }}>
        🎾
      </div>
      
      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
          Installe Junto
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Accès rapide depuis ton écran d'accueil
        </div>
      </div>
      
      {/* Boutons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{
            width: 36,
            height: 36,
            background: '#f5f5f5',
            border: 'none',
            borderRadius: 10,
            fontSize: 18,
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            padding: '10px 18px',
            background: '#ff5a5f',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: installing ? 'wait' : 'pointer'
          }}
        >
          {installing ? '...' : 'Installer'}
        </button>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/**
 * ============================================
 * COMPOSANT UPDATE TOAST
 * ============================================
 * 
 * Toast pour notifier d'une mise à jour disponible
 * 
 * ============================================
 */

export function UpdateToast() {
  const { updateAvailable, updateApp } = usePWA()

  if (!updateAvailable) return null

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 16,
      right: 16,
      background: '#00b8a9',
      color: '#ffffff',
      borderRadius: 14,
      padding: 14,
      boxShadow: '0 4px 20px rgba(0, 184, 169, 0.3)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🆕</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Nouvelle version disponible !</span>
      </div>
      <button
        onClick={updateApp}
        style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Mettre à jour
      </button>
      
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}