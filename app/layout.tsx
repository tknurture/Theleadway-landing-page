import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const GA_ID = 'G-0L3WWPRC4D';

export const metadata: Metadata = {
  metadataBase: new URL('https://theleadway.cz'),
  title: 'TheLeadway | Realitní a finanční poradenství',
  description: 'Realitní a finanční poradenství. Bezplatná konzultace, online kalkulačka splátky. Provádíme Vás celým procesem od A do Z.',
  icons: {
    icon: '/images/favicon-512.png',
    apple: '/images/favicon-512.png',
  },
  openGraph: {
    title: 'TheLeadway | Realitní a finanční poradenství',
    description: 'Realitní a finanční poradenství na míru. Bez stresu. Bezplatná konzultace.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Roboto+Slab:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  );
}
