import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider, InstallBanner, UpdateToast } from '@/app/components/pwa-provider'


export const metadata = {
  title: '2×2 - Le padel entre amis',
  description: 'Organise tes parties de padel en 30 secondes. Crée, partage, joue.',
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '2×2',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '2×2 - Le padel entre amis',
    description: 'Organise tes parties de padel en 30 secondes',
    siteName: '2×2',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2×2 - Le padel entre amis',
    description: 'Organise tes parties de padel en 30 secondes',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="2×2" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
        
        {/* iOS Splash Screens */}
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
          
          {/* Composants PWA */}
          <InstallBanner />
          <UpdateToast />
        </PWAProvider>
      </body>
    </html>
  )
}