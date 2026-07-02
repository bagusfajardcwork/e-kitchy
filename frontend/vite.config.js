import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseUrl = mode === 'production' ? env.BASE_URL : ''

  return {
    server: {
      host: env.APP_HOST || 'localhost',
      port: 5173, // Tambahkan port eksplisit

      // 🚀 TAMBAHKAN PROXY INI (Sangat Penting untuk Development!)
      proxy: {
        '/api': {
          target: env.VITE_BASE_API || 'http://localhost:3999',
          changeOrigin: true,
          secure: false,
          // rewrite: (path) => path.replace(/^\/api/, '') // Hapus komentar jika backend TIDAK punya prefix /api
        }
      }
    },
    base: baseUrl,
    plugins: [
      vue(),
      Components({
        resolvers: [BootstrapVueNextResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})