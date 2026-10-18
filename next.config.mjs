const isDev = process.env.NODE_ENV !== 'production';

// Next.js injects inline bootstrap scripts, and the UI relies on inline styles,
// so 'unsafe-inline' is required for script/style without nonce-based rendering.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  compiler: {
    styledComponents: true,
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/pages/work.html', destination: '/work', permanent: true },
      { source: '/pages/writing.html', destination: '/writing', permanent: true },
      { source: '/pages/experiments.html', destination: '/experiments', permanent: true },
      { source: '/pages/about.html', destination: '/about', permanent: true },
      { source: '/pages/contact.html', destination: '/contact', permanent: true },
      { source: '/pages/project.html', destination: '/work', permanent: false },
      { source: '/pages/article.html', destination: '/writing', permanent: false },
    ];
  },
};

export default nextConfig;
