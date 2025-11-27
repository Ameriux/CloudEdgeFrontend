import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api-internal': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-internal/, '')
      },
      '/api-external': {
        target: 'http://192.168.104.4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-external/, '')
      },
      '/api-gateway': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gateway/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})