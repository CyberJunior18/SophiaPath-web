import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/courses': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass: (req, res) => {
          if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
            return '/index.html';
          }
        }
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/audit': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
