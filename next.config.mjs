import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: 'output: export' removed — static export disables Next.js rewrites/middleware.
  // The app runs as a full Vercel server deployment (PWA) to enable the /yt-api/ proxy rewrites.
  async rewrites() {
    return [
      // Proxy InnerTube API calls through Vercel to bypass CORS (used by youtubei.js)
      {
        source: '/yt-api/:path*',
        destination: 'https://www.youtube.com/youtubei/v1/:path*',
      },
      // Proxy youtube.com pages (player JS, etc.)
      {
        source: '/yt-www/:path*',
        destination: 'https://www.youtube.com/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);
