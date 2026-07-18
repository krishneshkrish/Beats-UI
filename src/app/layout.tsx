import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioProvider } from '@/context/AudioContext';

export const metadata: Metadata = {
  title: 'Beats — Premium AI Music PWA',
  description: 'A minimalist luxury music experience designed with Liquid Glass UI.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Beats',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script async src="https://cdn.jsdelivr.net/npm/pwacompat" crossOrigin="anonymous"></script>
      </head>
      <body className="antialiased bg-black">
        <AuthProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
