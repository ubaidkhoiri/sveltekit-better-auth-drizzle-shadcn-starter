// Target browser floor: iOS 16 / Safari 16 / Chrome 107 / Edge 107 / Firefox 104
// (= Baseline Widely Available generasi Vite 7). Vite hanya mentransformasi
// SINTAKS, bukan polyfill API — aturan pemakaian fitur CSS/JS di sekitar floor
// ini ada di AGENTS.md.
// plugin-legacy TIDAK dipakai: Safari 16 sudah native ESM + dynamic import, dan
// format output SystemJS sudah dihapus di rolldown-vite (tidak bisa dibuat lagi).
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		target: ['chrome107', 'edge107', 'firefox104', 'safari16']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ runtime: 'nodejs22.x' })
		}),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'robots.txt'],
			manifest: {
				name: 'SvelteKit Better Auth Starter',
				short_name: 'Starter',
				description: 'Mobile-first PWA boilerplate: SvelteKit + Better Auth + Drizzle',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait',
				background_color: '#0f172a',
				theme_color: '#0f172a',
				icons: [
					{ src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: '/icons/pwa-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
				navigateFallback: '/',
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.origin === self.location.origin,
						handler: 'CacheFirst',
						options: {
							cacheName: 'local-assets-v1',
							expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
							cacheableResponse: { statuses: [200] }
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-v1',
							expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
			}
		})
	]
});
