import type { FastifyInstance } from 'fastify'
import { db } from '../../../database'
import { resSukses, resError } from '../../../../utils/helperResponse'
import {getMeta, getPagination} from "../../../../utils/helperPagination.ts"

export default async function index(server: FastifyInstance) {

  // [CREATE] POST /api/master/referensi/multiple_send -> untuk kirim data array
  server.post('/multiple_send', async (request: any, reply) => {
    const connection = await db.getConnection()
    let transactionStarted = false

    try {
      const { items } = request.body

      // ✅ Definisikan tipe results (pindah ke luar untuk reusability)
      interface BatchResult {
        success: Array<{
          index: number
          id: number
          jenis_referensi_fk: number
          deskripsi: string
          status_aktif: number
        }>
        failed: Array<{
          index: number
          deskripsi: string
          error: string
        }>
      }

      // Validasi input
      if (!Array.isArray(items)) {
        return resError(reply, 'Data harus berupa array!', 400)
      }

      if (items.length === 0) {
        return resError(reply, 'Array tidak boleh kosong!', 400)
      }

      // ✅ Batas maksimal batch (mencegah overload)
      if (items.length > 100) {
        return resError(reply, 'Maksimal 100 data per batch!', 400)
      }

      await connection.beginTransaction()
      transactionStarted = true

      const results: BatchResult = {
        success: [],
        failed: []
      }

      // ✅ Track deskripsi yang sudah diproses dalam batch (untuk cek duplikat in-memory)
      const deskripsiInBatch = new Set<string>()

      // Proses setiap item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { jenis_referensi_fk, deskripsi, status_aktif } = item

        try {
          // Validasi 1: Deskripsi
          if (!deskripsi || deskripsi.trim().length < 2) {
            results.failed.push({
              index: i,
              deskripsi: deskripsi || '(kosong)',
              error: 'Deskripsi wajib diisi dan minimal 2 karakter!'
            })
            continue
          }

          // Validasi 2: Jenis Referensi
          if (!jenis_referensi_fk) {
            results.failed.push({
              index: i,
              deskripsi,
              error: 'ID Jenis Referensi kosong!'
            })
            continue
          }

          // ✅ Validasi 3: Cek duplikat IN BATCH (in-memory)
          const deskripsiLower = deskripsi.trim().toLowerCase()
          if (deskripsiInBatch.has(deskripsiLower)) {
            results.failed.push({
              index: i,
              deskripsi,
              error: `Referensi "${deskripsi}" duplikat dalam batch!`
            })
            continue
          }

          // Validasi 4: Cek duplikat di DATABASE
          const [existing]: any = await connection.query(
            `SELECT id FROM m_referensi WHERE LOWER(deskripsi) = LOWER(?)`,
            [deskripsi]
          )

          if (existing.length > 0) {
            results.failed.push({
              index: i,
              deskripsi,
              error: `Referensi "${deskripsi}" sudah terdaftar di database!`
            })
            continue
          }

          // Insert data
          const [result]: any = await connection.query(
            `INSERT INTO m_referensi (jenis_referensi_fk, deskripsi, status_aktif) 
           VALUES (?, ?, ?)`,
            [jenis_referensi_fk, deskripsi.trim(), status_aktif ?? 1]
          )

          // ✅ Tambahkan ke set untuk cek duplikat batch berikutnya
          deskripsiInBatch.add(deskripsiLower)

          results.success.push({
            index: i,
            id: result.insertId,
            deskripsi: deskripsi.trim(),
            jenis_referensi_fk: jenis_referensi_fk,
            status_aktif: status_aktif ?? 1
          })

        } catch (error: any) {
          console.error(`Error pada item index ${i}:`, error)
          results.failed.push({
            index: i,
            deskripsi: deskripsi || '(error)',
            error: error.message || 'Gagal insert data'
          })
        }
      }

      // ✅ Commit atau rollback berdasarkan hasil
      if (results.success.length > 0) {
        await connection.commit()
      } else {
        await connection.rollback()
      }

      // ✅ Response berdasarkan skenario
      const totalSuccess = results.success.length
      const totalFailed = results.failed.length

      if (totalSuccess > 0 && totalFailed === 0) {
        // ✅ Semua sukses
        return resSukses(
          reply,
          `${totalSuccess} data referensi berhasil dibuat`,
          results.success,
          { totalSuccess, totalFailed, totalProcessed: items.length },
          201
        )
      } else if (totalSuccess > 0 && totalFailed > 0) {
        // ✅ Sebagian sukses
        return resSukses(
          reply,
          `${totalSuccess} data berhasil, ${totalFailed} data gagal`,
          results,
          { totalSuccess, totalFailed, totalProcessed: items.length },
          200  // ← Ganti 207 ke 200 (lebih umum untuk REST API)
        )
      } else {
        // ✅ Semua gagal - gabungkan results ke dalam message
        const failedMessages = results.failed
          .map(f => `Index ${f.index}: ${f.error}`)
          .join('; ')

        return resError(
          reply,
          `Semua ${totalFailed} data gagal dibuat. Detail: ${failedMessages}`,
          400
        )
      }

    } catch (error: any) {
      // ✅ Safe rollback dengan try-catch
      if (transactionStarted) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error saat rollback:', rollbackError)
        }
      }
      console.error('Error batch insert:', error)
      return resError(reply, 'Gagal membuat referensi: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

  // [READ BY ID JENIS REFERENSI WITH PAGINATION] GET /api/master/referensi/jenisref/:id?page=1&limit=10
  server.get('/jenisref/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // ✅ Ambil parameter pagination
      const { currentPage, itemsPerPage, offset } = getPagination(
        request.query.page,
        request.query.limit
      )

      // Validasi ID
      if (!id || isNaN(id)) {
        return resError(reply, 'ID jenis referensi tidak valid!', 400)
      }

      // ✅ Cek apakah jenis referensi ada
      const [jenisRef]: any = await db.query(
        'SELECT id, deskripsi FROM m_jenis_referensi WHERE id = ?',
        [id]
      )

      if (jenisRef.length === 0) {
        return resError(reply, `Jenis referensi dengan ID ${id} tidak ditemukan`, 404)
      }

      // ✅ Build WHERE clause
      let whereClause = 'WHERE jenis_referensi_fk = ?'
      const params: any[] = [id]

      // ✅ Optional: Tambahkan search jika ada
      const search = request.query.search?.trim() || ''
      if (search) {
        whereClause += ' AND (deskripsi LIKE ? OR singkatan LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      // ✅ Count total data (dengan filter jenis_referensi_fk)
      const [countResult]: any = await db.query(
        `SELECT COUNT(*) as total FROM m_referensi ${whereClause}`,
        params
      )
      const totalData = countResult[0].total

      // ✅ Get data per halaman dengan LIMIT & OFFSET
      const [rows]: any = await db.query(
        `SELECT id, jenis_referensi_fk, deskripsi, status_aktif 
       FROM m_referensi 
       ${whereClause} 
       ORDER BY deskripsi ASC 
       LIMIT ? OFFSET ?`,
        [...params, itemsPerPage, offset]
      )

      // ✅ Generate meta pagination
      const meta = getMeta(totalData, currentPage, itemsPerPage)

      // ✅ Conditional response
      if (rows.length > 0) {
        return resSukses(
          reply,
          `Ditemukan ${totalData} data referensi untuk "${jenisRef[0].deskripsi}"`,
          rows,
          {
            ...meta,
            jenis_referensi: {
              id: jenisRef[0].id,
              deskripsi: jenisRef[0].deskripsi
            }
          }
        )
      } else {
        return resSukses(
          reply,
          `Belum ada data referensi untuk "${jenisRef[0].deskripsi}"`,
          rows,
          null
        )
      }

    } catch (error: any) {
      return resError(reply, 'Gagal mengambil data', 500)
    }
  })

  // [READ BY ID] GET /api/master/referensi/:id
  server.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // Validasi ID
      if (!id || isNaN(id)) {
        return resError(reply, 'ID tidak valid!', 400)
      }

      // Query untuk ambil data berdasarkan ID
      const [rows]: any = await db.query(
        'SELECT id, deskripsi, jenis_referensi_fk, status_aktif FROM m_referensi WHERE id = ?',
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

  // [UPDATE] PUT /api/master/referensi/:id
  server.put('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const { jenis_referensi_fk, deskripsi, status_aktif } = request.body

      // ✅ Validasi
      if (!id || isNaN(id)) {
        return resError(reply, 'ID tidak valid!', 400)
      }

      if (!jenis_referensi_fk) {
        return resError(reply, 'ID Jenis referensi tidak ditemukan!', 400)
      }

      if (!deskripsi) {
        return resError(reply, 'Deskripsi wajib diisi!', 400)
      }

      if (deskripsi.trim().length < 2) {
        return resError(reply, 'Deskripsi minimal 2 karakter!', 400)
      }

      const [existing]: any = await db.query(
        'SELECT id FROM m_referensi WHERE id = ?',
        [id]
      )

      if (existing.length === 0) {
        return resError(reply, `Data dengan ID ${id} tidak ditemukan`, 404)
      }

      // ✅ Validasi Cek duplikat (EXCLUDE ID SENDIRI!)
      const [duplicate]: any = await db.query(
        `SELECT id FROM m_referensi 
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
        `UPDATE m_referensi 
       SET deskripsi = ?, status_aktif = ? 
       WHERE id = ?`,
        [deskripsi, status_aktif ?? 1, id]
      )

      return resSukses(
        reply,
        `Referensi "${deskripsi}" berhasil diupdate`,
        {
          id: parseInt(id),
          deskripsi,
          status_aktif: status_aktif ?? 1
        },
        { affectedRows: result.affectedRows },
        200
      )

    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return resError(reply, 'Deskripsi sudah ada!', 400)
      }

      return resError(reply, 'Gagal mengupdate referensi', 500)
    }
  })

  // [DELETE] DELETE /api/master/referensi/:id
  server.delete('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      // Cek apakah data ada
      const [existing]: any = await db.query(
        'SELECT id FROM m_referensi WHERE id = ?',
        [id]
      )

      if (existing.length === 0) {
        return resError(reply, `Data dengan ID ${id} tidak ditemukan`, 404)
      }

      const [result]: any = await db.query(
        'DELETE FROM m_referensi WHERE id = ?',
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