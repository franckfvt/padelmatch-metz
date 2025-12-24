import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider, InstallBanner, UpdateToast } from '@/app/components/pwa-provider'


export const metadata = {
  title: 'Junto - Padel entre potes',
  description: 'Organise des parties de padel avec tes potes en quelques clics',
  manifest: '/manifest.json',
  themeColor: '#ff5a5f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Junto',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Junto - Padel entre potes',
    description: 'Organise des parties de padel avec tes potes',
    siteName: 'Junto',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ff5a5f',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff5a5f" />
        
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Junto" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
        
        {/* iOS Splash Screens (optionnel mais recommandé) */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png" 
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1284x2778.png" 
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        
        {/* Fonts */}
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PWAProvider>
          {children}
          
          {/* Composants PWA optionnels */}
          <InstallBanner />
          <UpdateToast />
        </PWAProvider>
      </body>
    </html>
  )
}
