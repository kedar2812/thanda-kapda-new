import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const site = (p: string) => fileURLToPath(new URL(`../../site/src/${p}`, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The website's content model and icons, shared so the editor always matches the site.
      '@site/content': site('content'),
      '@site/icons': site('components/ui/Icons.tsx'),
    },
    // Shared files sit outside this folder; make them use this app's React, not a second copy.
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5174,
    fs: { allow: ['..', '../../site/src/content', '../../site/src/components/ui'] },
    proxy: { '/api': 'http://127.0.0.1:8081', '/live': 'http://127.0.0.1:8081' },
  },
})
