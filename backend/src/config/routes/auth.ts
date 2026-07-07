import type {FastifyInstance} from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../database' // Sesuaikan path import database Anda
import { resSukses, resError } from '../../utils/helperResponse' // Sesuaikan path utils Anda
import { verifyToken } from '../../middleware/auth' // Import middleware yang baru dibuat

export default async function authRoutes(server: FastifyInstance) {

  // [LOGIN] POST /api/auth/login
  server.post('/login', async (request: any, reply) => {
    try {
      const { username, password } = request.body

      if (!username || !password) {
        return resError(reply, 'Username dan password wajib diisi!', 400)
      }

      // 1. Cari user
      const [users]: any = await db.query(
        'SELECT * FROM m_pegawai WHERE username = ?',
        [username.trim()]
      )

      if (users.length === 0) {
        return resError(reply, 'Username atau password salah!', 401)
      }

      const user = users[0]

      // 2. Cek status aktif
      if (user.status_aktif !== 1) {
        return resError(reply, 'Akun Anda telah dinonaktifkan. Hubungi administrator!', 403)
      }

      // 3. Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return resError(reply, 'Username atau password salah!', 401)
      }

      // 4. Ambil roles/grup akses
      const [roles]: any = await db.query(
        `SELECT g.id, g.nama_grup 
         FROM m_grup_akses g
         INNER JOIN m_pegawai_grup_akses pg ON g.id = pg.grup_akses_fk
         WHERE pg.pegawai_fk = ?`,
        [user.id]
      )

      // 5. Generate Token
      const payload = {
        id: user.id,
        username: user.username,
        nama: user.nama,
        roles: roles.map((r: any) => r.nama_grup)
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      })

      // 6. Kirim response
      return resSukses(reply, 'Login berhasil!', {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          username: user.username,
          roles: payload.roles
        }
      })

    } catch (error: any) {
      console.error('Login error:', error)
      return resError(reply, 'Terjadi kesalahan saat login', 500)
    }
  })

  // [GET ME] GET /api/auth/me (Diproteksi)
  server.get('/me', { preHandler: verifyToken }, async (request: any, reply) => {
    try {
      const userId = request.user?.id

      const [users]: any = await db.query(
        'SELECT id, nama, username, status_aktif FROM m_pegawai WHERE id = ?',
        [userId]
      )

      if (users.length === 0) {
        return resError(reply, 'User tidak ditemukan', 404)
      }

      // ✅ Ambil roles dengan ID dan Nama
      const [roles]: any = await db.query(
        `SELECT g.id, g.nama_grup 
       FROM m_grup_akses g
       INNER JOIN m_pegawai_grup_akses pg ON g.id = pg.grup_akses_fk
       WHERE pg.pegawai_fk = ?`,
        [userId]
      )

      return resSukses(reply, 'Data user berhasil diambil', {
        ...users[0],
        roles: roles, // ✅ Return array of object: [{id: 1, nama_grup: "Super Admin"}, ...]
        role_ids: roles.map((r: any) => r.id), // ✅ Helper: [1, 2]
        role_names: roles.map((r: any) => r.nama_grup) // ✅ Helper: ["Super Admin", "Kasir"]
      })

    } catch (error: any) {
      console.error('Get me error:', error)
      return resError(reply, 'Gagal mengambil data user', 500)
    }
  })

  // ✅ [LOGOUT] POST /api/auth/logout
  // Kita proteksi route ini, karena hanya user yang login yang bisa logout
  server.post('/logout', { preHandler: verifyToken }, async (request: any, reply) => {
    try {
      // Catatan: Karena kita pakai JWT standar (stateless),
      // kita tidak bisa "menghapus" token di server secara langsung.
      // Token akan tetap valid sampai waktu expired-nya habis (misal 8 jam).
      // Tugas backend hanya memberi konfirmasi, dan Frontend yang akan menghapus tokennya.

      // (Opsional) Jika nanti Anda pakai Redis/Database untuk Blacklist Token,
      // Anda bisa simpan token ini ke daftar hitam di sini.

      return resSukses(reply, 'Logout berhasil! Silakan login kembali.')
    } catch (error: any) {
      console.error('Logout error:', error)
      return resError(reply, 'Gagal melakukan logout', 500)
    }
  })
}