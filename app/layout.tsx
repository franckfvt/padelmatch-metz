import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Junto — Ensemble, on joue mieux",
  description: "L'app qui connecte les joueurs de padel. Crée ta partie, trouve tes partenaires, joue ensemble.",
  keywords: ["padel", "sport", "matchmaking", "joueurs", "parties", "junto"],
  authors: [{ name: "Junto" }],
  openGraph: {
    title: "Junto — Ensemble, on joue mieux",
    description: "L'app qui connecte les joueurs de padel.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff5a5f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Satoshi Font from Fontshare */}
        <link 
          rel="preconnect" 
          href="https://api.fontshare.com" 
          crossOrigin="anonymous"
        />
        <link 
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
