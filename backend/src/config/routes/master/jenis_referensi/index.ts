import type { FastifyInstance } from 'fastify'
import { db } from '../../../database'
import { resSukses, resError } from '../../../../utils/helperResponse'
import {getMeta, getPagination} from "../../../../utils/helperPagination.ts";

// C R U D jenis_referensi

export default async function index(server: FastifyInstance) {

  // [CREATE] POST /api/master/jenis_referensi
  server.post('/', async (request: any, reply) => {
    try {
      const { deskripsi, singkatan, status_aktif } = request.body

      // ✅ Validasi 1: Deskripsi wajib diisi
      if (!deskripsi) {
        return resError(reply, 'Deskripsi wajib diisi!', 400)
      }

      // ✅ Validasi 2: Minimal 2 karakter
      if (deskripsi.trim().length < 2) {
        return resError(reply, 'Deskripsi minimal 2 karakter!', 400)
      }

      // ✅ Validasi 3: Cek Duplikat
      const [existing]: any = await db.query(
        `SELECT id FROM m_jenis_referensi WHERE LOWER(deskripsi) = LOWER(?)`,
        [deskripsi]
      )

      if (existing.length > 0) {
        return resError(
          reply,
          `Jenis Referensi dengan deskripsi "${deskripsi}" sudah terdaftar!`,
          400
        )
      }

      // Insert data - ✅ Tambahkan status_aktif
      const [result]: any = await db.query(
        `INSERT INTO m_jenis_referensi (deskripsi, singkatan, status_aktif) 
       VALUES (?, ?, ?)`,
        [deskripsi, singkatan || null, status_aktif ?? 1]
      )

      return resSukses(
        reply,
        `Referensi "${deskripsi}" berhasil dibuat`,
        {
          id: result.insertId,
          deskripsi,
          singkatan: singkatan || null,
          status_aktif: status_aktif ?? 1
        },
        { affectedRows: result.affectedRows },
        201
      )

    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return resError(reply, `Deskripsi sudah ada!`, 400)
      }

      return resError(reply, 'Gagal membuat referensi', 500)
    }
  })

  // [READ] GET /api/master/jenis_referensi
  server.get('/', async (request: any, reply) => {
    try {
      const { currentPage, itemsPerPage, offset } = getPagination(
        request.query.page,
        request.query.limit
      )

      // ✅ Ambil parameter search
      const search = request.query.search?.trim() || ''

      // ✅ Build WHERE clause dinamis
      // let whereClause = 'WHERE status_aktif = 1'
      let whereClause = 'WHERE 1 = 1'
      const params: any[] = []

      if (search) {
        whereClause += ' AND (deskripsi LIKE ? OR singkatan LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      // Count total
      const [countResult]: any = await db.query(
        `SELECT COUNT(*) as total FROM m_jenis_referensi ${whereClause}`,
        params
      )
      const totalData = countResult[0].total

      // Get data dengan LIMIT & OFFSET
      const [rows] = await db.query(
        `SELECT * FROM m_jenis_referensi 
       ${whereClause} 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
        [...params, itemsPerPage, offset]
      )

      const meta = getMeta(totalData, currentPage, itemsPerPage)

      return resSukses(reply, 'Data berhasil diambil', rows, meta)

    } catch (error) {
      return resError(reply, 'Gagal mengambil data', 500)
    }
  })

  // [READ BY ID] GET /api/master/jenis-referensi/:id
  server.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // Validasi ID
      if (!id || isNaN(id)) {
        return resError(reply, 'ID tidak valid!', 400)
      }

      // Query untuk ambil data berdasarkan ID
      const [rows]: any = await db.query(
        'SELECT id, deskripsi, singkatan, status_aktif FROM m_jenis_referensi WHERE id = ?',
        [id]
      )

      // Cek apakah data ditemukan
      if (rows.length === 0) {
        return resError(reply, `Data dengan ID ${id} tidak ditemukan`, 404)
      }

      // Return data (ambil index 0 karena hanya 1 row)
      return resSukses(reply, 'Data berhasil diambil', rows[0])

    } catch (error: any) {
      return resError(reply, 'Gagal mengambil data', 500)
    }
  })

  // [UPDATE] PUT /api/master/jenis_referensi/:id
  server.put('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const { deskripsi, singkatan, status_aktif } = request.body

      // ✅ Validasi 1: ID valid
      if (!id || isNaN(id)) {
        return resError(reply, 'ID tidak valid!', 400)
      }

      // ✅ Validasi 2: Deskripsi wajib diisi
      if (!deskripsi) {
        return resError(reply, 'Deskripsi wajib diisi!', 400)
      }

      // ✅ Validasi 3: Minimal 2 karakter
      if (deskripsi.trim().length < 2) {
        return resError(reply, 'Deskripsi minimal 2 karakter!', 400)
      }

      // ✅ Validasi 4: Cek apakah data dengan ID tersebut ada
      const [existing]: any = await db.query(
        'SELECT id FROM m_jenis_referensi WHERE id = ?',
        [id]
      )

      if (existing.length === 0) {
        return resError(reply, `Data dengan ID ${id} tidak ditemukan`, 404)
      }

      // ✅ Validasi 5: Cek duplikat (EXCLUDE ID SENDIRI!)
      const [duplicate]: any = await db.query(
        `SELECT id FROM m_jenis_referensi 
       WHERE LOWER(deskripsi) = LOWER(?) AND id != ?`,
        [deskripsi, id]
      )

      if (duplicate.length > 0) {
        return resError(
          reply,
          `Referensi dengan deskripsi "${deskripsi}" sudah terdaftar!`,
          400
        )
      }

      // ✅ Update data
      const [result]: any = await db.query(
        `UPDATE m_jenis_referensi 
       SET deskripsi = ?, singkatan = ?, status_aktif = ? 
       WHERE id = ?`,
        [deskripsi, singkatan || null, status_aktif ?? 1, id]
      )

      return resSukses(
        reply,
        `Referensi "${deskripsi}" berhasil diupdate`,
        {
          id: parseInt(id),
          deskripsi,
          singkatan: singkatan || null,
          status_aktif: status_aktif ?? 1
        },
        { affectedRows: result.affectedRows },
        200
      )

    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return resError(reply, 'Deskripsi sudah ada!', 400)
      }

      return resError(reply, 'Gagal mengupdate jenis referensi', 500)
    }
  })

  // [DELETE] DELETE /api/master/jenis_referensi/:id
  server.delete('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // Cek apakah data ada
      const [existing]: any = await db.query(
        'SELECT id FROM m_jenis_referensi WHERE id = ?',
        [id]
      )

      if (existing.length === 0) {
        return resError(reply, `Data dengan ID ${id} tidak ditemukan`, 404)
      }

      // Soft delete (update status_aktif = 0)
      const [result]: any = await db.query(
        'UPDATE m_jenis_referensi SET status_aktif = 0 WHERE id = ?',
        [id]
      )

      return resSukses(
        reply,
        'Data berhasil dihapus',
        null,
        { affectedRows: result.affectedRows }
      )

    } catch (error: any) {
      return resError(reply, 'Gagal menghapus referensi', 500)
    }
  })

}