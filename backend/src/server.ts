import fastify from 'fastify'
import cors from '@fastify/cors'

// 1. Import rute / routes
import produk from './config/routes/master/produk'
import referensi from './config/routes/master/referensi'
import jenis_referensi from './config/routes/master/jenis_referensi'

const server = fastify({ logger: true })

// Daftarkan CORS
// await server.register(cors, { origin: '*' })
await server.register(cors, {
  origin: '*',  // Atau spesifik: 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ✅ TAMBAHKAN INI
  allowedHeaders: ['Content-Type', 'Authorization'], // ✅ TAMBAHKAN INI
  credentials: true
})
// 2. Daftarkan Rute Produk dengan Prefix

// welcome
server.get('/api', async (request, reply) => {
  return {
    message: 'Selamat datang di API e-kitchy!',
    version: '1.0.0',
    status: 'online'
  }
})

// MASTER
// produk
server.register(produk, { prefix: '/api/master/produk' })
// jenis_referensi
server.register(jenis_referensi, { prefix: '/api/master/jenis_referensi' })
// referensi
server.register(referensi, { prefix: '/api/master/referensi' })

// 3. Start Server
const start = async () => {
  try {
    await server.listen({ port: 3999, host: '0.0.0.0' })
    console.log('🚀 Server API Fastify siap dan berjalan di http://localhost:3999/api')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()