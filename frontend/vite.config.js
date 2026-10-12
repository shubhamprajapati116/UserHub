import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'static-asset-cache-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith('.webp') || req.url.endsWith('.jpg') || req.url.endsWith('.png') || req.url.endsWith('.svg'))) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith('.webp') || req.url.endsWith('.jpg') || req.url.endsWith('.png') || req.url.endsWith('.svg'))) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
          next();
        });
      },
    },
  ],
})

