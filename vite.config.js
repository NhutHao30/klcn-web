// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: './',
//   server: {
//     allowedHosts: 'all' // Cho phép tất cả các domain (bao gồm Ngrok) truy cập vào Vite Dev Server
//   },
// })

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    base: './',
    server: {
      allowedHosts: true, 
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/storage': {
          target: backendUrl,
          changeOrigin: true,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        },
        '/images': {
          target: backendUrl,
          changeOrigin: true,
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      }
    },
  }
})