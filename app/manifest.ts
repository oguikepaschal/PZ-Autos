import type { MetadataRoute } from 'next'

// Public by design: the manifest is fetched before sign-in and carries no
// data, only brand and launch settings. scope stays "/" so the public /cars
// pages open inside the installed app rather than bouncing to the browser.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PZ Autos',
    short_name: 'PZ Autos',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#141414',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
