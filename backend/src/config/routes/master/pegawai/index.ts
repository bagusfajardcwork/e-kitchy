import type { FastifyInstance } from 'fastify'
import { db } from '../../../database'
import { resSukses, resError } from '../../../../utils/helperResponse'
import bcrypt from 'bcrypt'
import {getMeta, getPagination} from "../../../../utils/helperPagination.ts";

export default async function index(server: FastifyInstance) {

  // [CREATE] POST /api/master/pegawai
  server.post('/', async (request: any, reply) => {
    const connection = await db.getConnection()

    try {
      const { nama, username, password, grup_akses } = request.body

      // ✅ Validasi 1: Field wajib
      if (!nama || nama.trim().length < 2) {
        return resError(reply, 'Nama pegawai wajib diisi!', 400)
      }
      if (!username || username.trim().length < 3) {
        return resError(reply, 'Username wajib diisi dan minimal 3 karakter!', 400)
      }
      if (!password || password.length < 6) {
        return resError(reply, 'Password wajib diisi dan minimal 6 karakter!', 400)
      }
      if (!Array.isArray(grup_akses) || grup_akses.length === 0) {
        return resError(reply, 'Minimal 1 grup akses harus dipilih!', 400)
      }

      // ✅ Validasi 2: Cek username duplikat
      const [existingUser]: any = await connection.query(
        'SELECT id FROM m_pegawai WHERE username = ?',
        [username.trim()]
      )
      if (existingUser.length > 0) {
        return resError(reply, `Username "${username}" sudah digunakan!`, 400)
      }

      // ✅ Hash password
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      await connection.beginTransaction()

      // 1. Insert ke m_pegawai
      const [pegawaiResult]: any = await connection.query(
        `INSERT INTO m_pegawai (nama, username, password, status_aktif) 
       VALUES (?, ?, ?, 1)`,
        [nama.trim(), username.trim(), hashedPassword]
      )
      const pegawaiId = pegawaiResult.insertId

      // 2. Insert ke m_pegawai_grup_akses (Many-to-Many)
      const grupValues = grup_akses.map((grupId: number) => [pegawaiId, grupId])

      await connection.query(
        `INSERT INTO m_pegawai_grup_akses (pegawai_fk, grup_akses_fk) 
       VALUES ?`,
        [grupValues]
      )

      await connection.commit()

      return resSukses(
        reply,
        `Pegawai "${nama}" berhasil dibuat`,
        { id: pegawaiId, nama, username, grup_akses },
        { affectedRows: 1 },
        201
      )

    } catch (error: any) {
      await connection.rollback()
      console.error('Error creating pegawai:', error)
      return resError(reply, 'Gagal membuat pegawai: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

  // [READ] GET /api/master/pegawai?page=1&limit=10&search=namaparameter
  server.get('/', async (request: any, reply) => {
    try {
      const { currentPage, itemsPerPage, offset } = getPagination(request.query.page, request.query.limit)
      const search = request.query.search?.trim() || ''

      let whereClause = 'WHERE p.status_aktif = 1'
      const params: any[] = []

      if (search) {
        whereClause += ' AND (p.nama LIKE ? OR p.username LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      // 1. Count total data
      const [countResult]: any = await db.query(
        `SELECT COUNT(DISTINCT p.id) as total FROM m_pegawai p ${whereClause}`,
        params
      )
      const totalData = countResult[0].total

      // 2. Query data dengan GROUP_CONCAT untuk grup akses
      const [rows] = await db.query(
        `SELECT 
         p.id, p.nama, p.username, p.status_aktif, p.created_at,
         COALESCE(GROUP_CONCAT(g.id), '') as grup_ids,
         COALESCE(GROUP_CONCAT(g.nama_grup), '') as grup_names
       FROM m_pegawai p
       LEFT JOIN m_pegawai_grup_akses pg ON p.id = pg.pegawai_fk
       LEFT JOIN m_grup_akses g ON pg.grup_akses_fk = g.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
        [...params, itemsPerPage, offset]
      )

      // 3. Format hasil query agar grup_ids menjadi Array of Number
      const formattedRows = rows.map((row: any) => ({
        ...row,
        grup_akses_ids: row.grup_ids ? row.grup_ids.split(',').map(Number) : [],
        grup_akses_names: row.grup_names ? row.grup_names.split(',') : []
      }))

      const meta = getMeta(totalData, currentPage, itemsPerPage)

      return resSukses(reply, 'Data pegawai berhasil diambil', formattedRows, meta)

    } catch (error: any) {
      console.error('Error fetching pegawai:', error)
      return resError(reply, 'Gagal mengambil data pegawai', 500)
    }
  })

  // [READ BY ID] GET /api/master/pegawai/:id
  server.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // ✅ Validasi ID
      if (!id || isNaN(id)) {
        return resError(reply, 'ID pegawai tidak valid!', 400)
      }

      // ✅ Query menggunakan LEFT JOIN dan GROUP_CONCAT
      const [rows]: any = await db.query(
        `SELECT 
         p.id, 
         p.nama, 
         p.username, 
         p.status_aktif,
         COALESCE(GROUP_CONCAT(pg.grup_akses_fk), '') as grup_ids,
         COALESCE(GROUP_CONCAT(g.nama_grup), '') as grup_names
       FROM m_pegawai p
       LEFT JOIN m_pegawai_grup_akses pg ON p.id = pg.pegawai_fk
       LEFT JOIN m_grup_akses g ON pg.grup_akses_fk = g.id
       WHERE p.id = ?
       GROUP BY p.id`,
        [id]
      )

      // ✅ Cek apakah data ditemukan
      if (rows.length === 0) {
        return resError(reply, `Pegawai dengan ID ${id} tidak ditemukan`, 404)
      }

      const row = rows[0]

      // ✅ Format string grup_ids menjadi Array of Number
      // Contoh: "1,3" menjadi [1, 3]
      const formattedData = {
        id: row.id,
        nama: row.nama,
        username: row.username,
        status_aktif: row.status_aktif,
        grup_akses_ids: row.grup_ids ? row.grup_ids.split(',').map(Number) : [],
        grup_akses_names: row.grup_names ? row.grup_names.split(',') : []
      }

      // ⚠️ CATATAN: Password (hash) TIDAK dikirim ke frontend demi keamanan!
      // Saat edit, frontend hanya perlu mengirim password baru jika user ingin menggantinya.

      return resSukses(reply, 'Data pegawai berhasil diambil', formattedData)

    } catch (error: any) {
      console.error('Error fetching pegawai by ID:', error)
      return resError(reply, 'Gagal mengambil detail pegawai', 500)
    }
  })

  // [UPDATE] PUT /api/master/pegawai/:id
  server.put('/:id', async (request: any, reply) => {
    const connection = await db.getConnection()

    try {
      const { id } = request.params
      const { nama, username, password, grup_akses } = request.body

      if (!id || isNaN(id)) return resError(reply, 'ID tidak valid!', 400)
      if (!nama || nama.trim().length < 2) return resError(reply, 'Nama wajib diisi!', 400)
      if (!username || username.trim().length < 3) return resError(reply, 'Username wajib diisi!', 400)
      if (!Array.isArray(grup_akses) || grup_akses.length === 0) {
        return resError(reply, 'Minimal 1 grup akses harus dipilih!', 400)
      }

      await connection.beginTransaction()

      // 1. Cek apakah pegawai ada
      const [existing]: any = await connection.query('SELECT id, username FROM m_pegawai WHERE id = ?', [id])
      if (existing.length === 0) return resError(reply, 'Pegawai tidak ditemukan', 404)

      // 2. Cek username duplikat (exclude ID sendiri)
      const [dupUser]: any = await connection.query(
        'SELECT id FROM m_pegawai WHERE username = ? AND id != ?',
        [username.trim(), id]
      )
      if (dupUser.length > 0) return resError(reply, `Username "${username}" sudah digunakan!`, 400)

      // 3. Update m_pegawai
      let queryParams: any[] = [nama.trim(), username.trim()]
      let queryStr = `UPDATE m_pegawai SET nama = ?, username = ?`

      // Jika password diisi, update passwordnya
      if (password && password.length >= 6) {
        const hashedPassword = await bcrypt.hash(password, 10)
        queryStr += `, password = ?`
        queryParams.push(hashedPassword)
      }

      queryStr += ` WHERE id = ?`
      queryParams.push(id)

      await connection.query(queryStr, queryParams)

      // 4. Hapus grup akses lama, lalu insert yang baru
      await connection.query('DELETE FROM m_pegawai_grup_akses WHERE pegawai_fk = ?', [id])

      if (grup_akses.length > 0) {
        const grupValues = grup_akses.map((grupId: number) => [id, grupId])
        await connection.query(
          `INSERT INTO m_pegawai_grup_akses (pegawai_fk, grup_akses_fk) VALUES ?`,
          [grupValues]
        )
      }

      await connection.commit()

      return resSukses(reply, `Pegawai "${nama}" berhasil diupdate`, { id: parseInt(id), nama, username, grup_akses })

    } catch (error: any) {
      await connection.rollback()
      console.error('Error updating pegawai:', error)
      return resError(reply, 'Gagal mengupdate pegawai: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

}