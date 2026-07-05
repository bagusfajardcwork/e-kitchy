import type {FastifyInstance} from "fastify";
import { db } from '../../../database'
import { resSukses, resError } from '../../../../utils/helperResponse'
import { getPagination, getMeta } from '../../../../utils/helperPagination';

// Fastify Plugin untuk rute index
export default async function index(server: FastifyInstance) {

  // [CREATE] POST /api/master/produk
  server.post('/', async (request: any, reply) => {
    const connection = await db.getConnection()

    try {
      const { deskripsi, jenisbarang_fk, keterangan, distributor_fk, harga, status_aktif } = request.body

      // ✅ Validasi 1: Field wajib
      if (!deskripsi || deskripsi.trim().length < 2) {
        return resError(reply, 'Deskripsi wajib diisi dan minimal 2 karakter!', 400)
      }

      if (!jenisbarang_fk) {
        return resError(reply, 'Jenis produk wajib dipilih!', 400)
      }

      // ✅ Validasi 2: Harga (jika ada)
      let hargaRounded = null
      if (harga !== null && harga !== undefined && harga !== '') {
        const hargaNumber = parseFloat(harga)

        if (isNaN(hargaNumber)) {
          return resError(reply, 'Harga harus berupa angka!', 400)
        }

        if (hargaNumber < 0) {
          return resError(reply, 'Harga tidak boleh negatif!', 400)
        }

        // ✅ Round ke 2 desimal - simpan di luar scope
        hargaRounded = Math.round(hargaNumber * 100) / 100
      }

      // ✅ Tambah validasi ini SEBELUM insert
      const [existing]: any = await connection.query(
        `SELECT id FROM m_produk 
               WHERE LOWER(deskripsi) = LOWER(?) 
                 AND jenisbarang_fk = ? 
                 AND status_aktif = 1`,
            [deskripsi.trim(), jenisbarang_fk]
        )

        if (existing.length > 0) {
          return resError(
            reply,
            `Produk "${deskripsi}" sudah ada di kategori ini!`,
            400
          )
        }

      await connection.beginTransaction()

      const [produkResult]: any = await connection.query(
        `INSERT INTO m_produk (deskripsi, jenisbarang_fk, keterangan, distributor_fk, status_aktif) 
       VALUES (?, ?, ?, ?, ?)`,
        [
          deskripsi.trim(),
          jenisbarang_fk,
          keterangan || null,
          distributor_fk || null,
          status_aktif ?? 1
        ]
      )

      const produkId = produkResult.insertId

      // ✅ Insert harga (jika ada) - pakai hargaRounded yang sudah divalidasi
      if (hargaRounded !== null) {
        await connection.query(
          `INSERT INTO m_harga (produk_fk, harga, status_aktif) 
         VALUES (?, ?, ?)`,
          [produkId, hargaRounded, status_aktif ?? 1]
        )
      }

      await connection.commit()

      return resSukses(
        reply,
        `Produk "${deskripsi}" berhasil dibuat`,
        {
          id: produkId,
          deskripsi,
          jenisbarang_fk,
          harga: hargaRounded
        },
        { affectedRows: produkResult.affectedRows },
        201
      )

    } catch (error: any) {
      await connection.rollback()
      console.error('Error creating produk:', error)

      if (error.code === 'ER_DUP_ENTRY') {
        return resError(reply, `Produk dengan nama yang sama sudah ada!`, 400)
      }

      return resError(reply, 'Gagal membuat produk: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

  // [BATCH CREATE] POST /api/master/produk/multiple_send
  server.post('/multiple_send', async (request: any, reply) => {
    const connection = await db.getConnection()
    let transactionStarted = false

    try {
      const { items } = request.body

      // ✅ Definisikan tipe results
      interface BatchResult {
        success: Array<{
          index: number
          id: number
          deskripsi: string
          jenisbarang_fk: number
          distributor_fk: number | null
          harga: number | null
          status_aktif: number
        }>
        failed: Array<{
          index: number
          deskripsi: string
          error: string
        }>
      }

      // ✅ Validasi input
      if (!Array.isArray(items)) {
        return resError(reply, 'Data harus berupa array!', 400)
      }

      if (items.length === 0) {
        return resError(reply, 'Array tidak boleh kosong!', 400)
      }

      if (items.length > 100) {
        return resError(reply, 'Maksimal 100 data per batch!', 400)
      }

      await connection.beginTransaction()
      transactionStarted = true

      const results: BatchResult = {
        success: [],
        failed: []
      }

      // ✅ Track duplikat dalam batch (deskripsi + jenisbarang_fk)
      const produkInBatch = new Set<string>()

      // Proses setiap item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { deskripsi, jenisbarang_fk, distributor_fk, harga, status_aktif } = item

        try {
          // ✅ Validasi 1: Deskripsi wajib
          if (!deskripsi || deskripsi.trim().length < 2) {
            results.failed.push({
              index: i,
              deskripsi: deskripsi || '(kosong)',
              error: 'Deskripsi wajib diisi dan minimal 2 karakter!'
            })
            continue
          }

          // ✅ Validasi 2: Jenis barang wajib
          if (!jenisbarang_fk) {
            results.failed.push({
              index: i,
              deskripsi,
              error: 'Jenis barang wajib dipilih!'
            })
            continue
          }

          // ✅ Validasi 3: Harga (jika ada)
          let hargaRounded: number | null = null
          if (harga !== null && harga !== undefined && harga !== '') {
            const hargaNumber = parseFloat(harga)

            if (isNaN(hargaNumber)) {
              results.failed.push({
                index: i,
                deskripsi,
                error: 'Harga harus berupa angka!'
              })
              continue
            }

            if (hargaNumber < 0) {
              results.failed.push({
                index: i,
                deskripsi,
                error: 'Harga tidak boleh negatif!'
              })
              continue
            }

            hargaRounded = Math.round(hargaNumber * 100) / 100
          }

          // ✅ Validasi 4: Cek duplikat IN BATCH
          const key = `${deskripsi.trim().toLowerCase()}_${jenisbarang_fk}`
          if (produkInBatch.has(key)) {
            results.failed.push({
              index: i,
              deskripsi,
              error: `Produk "${deskripsi}" duplikat dalam batch (jenis barang sama)!`
            })
            continue
          }

          // ✅ Validasi 5: Cek duplikat di DATABASE
          const [existing]: any = await connection.query(
            `SELECT id FROM m_produk 
           WHERE LOWER(deskripsi) = LOWER(?) 
             AND jenisbarang_fk = ? 
             AND status_aktif = 1`,
            [deskripsi.trim(), jenisbarang_fk]
          )

          if (existing.length > 0) {
            results.failed.push({
              index: i,
              deskripsi,
              error: `Produk "${deskripsi}" sudah ada di kategori ini!`
            })
            continue
          }

          // ✅ Insert ke m_produk
          const [produkResult]: any = await connection.query(
            `INSERT INTO m_produk (deskripsi, jenisbarang_fk, distributor_fk, status_aktif) 
           VALUES (?, ?, ?, ?)`,
            [
              deskripsi.trim(),
              jenisbarang_fk,
              distributor_fk || null,
              status_aktif ?? 1
            ]
          )

          const produkId = produkResult.insertId

          // ✅ Insert ke m_harga (jika ada)
          if (hargaRounded !== null) {
            await connection.query(
              `INSERT INTO m_harga (produk_fk, harga, status_aktif) 
             VALUES (?, ?, ?)`,
              [produkId, hargaRounded, status_aktif ?? 1]
            )
          }

          // ✅ Tambahkan ke set untuk cek duplikat
          produkInBatch.add(key)

          // ✅ Push ke success
          results.success.push({
            index: i,
            id: produkId,
            deskripsi: deskripsi.trim(),
            jenisbarang_fk,
            distributor_fk: distributor_fk || null,
            harga: hargaRounded,
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

      // ✅ Commit atau rollback
      if (results.success.length > 0) {
        await connection.commit()
      } else {
        await connection.rollback()
      }

      // ✅ Response berdasarkan skenario
      const totalSuccess = results.success.length
      const totalFailed = results.failed.length

      if (totalSuccess > 0 && totalFailed === 0) {
        // Semua sukses
        return resSukses(
          reply,
          `${totalSuccess} data produk berhasil dibuat`,
          results.success,
          { totalSuccess, totalFailed, totalProcessed: items.length },
          201
        )
      } else if (totalSuccess > 0 && totalFailed > 0) {
        // Sebagian sukses
        return resSukses(
          reply,
          `${totalSuccess} data berhasil, ${totalFailed} data gagal`,
          results,
          { totalSuccess, totalFailed, totalProcessed: items.length },
          200
        )
      } else {
        // Semua gagal
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
      if (transactionStarted) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error saat rollback:', rollbackError)
        }
      }
      console.error('Error batch insert produk:', error)
      return resError(reply, 'Gagal membuat produk: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

  // [READ ALL] GET /api/master/produk?page=1&limit=10&search=
  server.get('/', async (request: any, reply) => {
    try {
      // 1. Pagination
      const { currentPage, itemsPerPage, offset } = getPagination(
        request.query.page,
        request.query.limit
      )

      // 2. Ambil parameter search & filter
      const search = request.query.search?.trim() || ''
      const jenisbarang_fk = request.query.jenisbarang_fk || ''

      // 3. Build WHERE clause dinamis
      // let whereClause = 'WHERE p.status_aktif = 1'
      let whereClause = 'WHERE 1 = 1'
      const params: any[] = []

      // Filter search (deskripsi, keterangan, distributor_fk)
      if (search) {
        whereClause += ' AND (p.deskripsi LIKE ? OR p.keterangan LIKE ? OR p.distributor_fk LIKE ?)'
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      // Filter by jenisbarang_fk (jenis produk)
      if (jenisbarang_fk) {
        whereClause += ' AND p.jenisbarang_fk = ?'
        params.push(parseInt(jenisbarang_fk))
      }

      // 4. Count total data
      const [countResult]: any = await db.query(
        `SELECT COUNT(*) as total FROM m_produk p ${whereClause}`,
        params
      )
      const totalData = countResult[0].total

      // 5. Query data per halaman dengan JOIN
      const [rows] = await db.query(
        `SELECT 
         p.id,
         p.deskripsi,
         p.keterangan,
         p.distributor_fk,
         p.jenisbarang_fk,
         r.deskripsi AS referensi_nama,
         h.harga,
         p.status_aktif,
         p.created_at,
         p.updated_at
       FROM m_produk p
       LEFT JOIN m_referensi r ON p.jenisbarang_fk = r.id
       LEFT JOIN m_harga h ON p.id = h.produk_fk
       ${whereClause}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
        [...params, itemsPerPage, offset]
      )

      // 6. Generate meta pagination
      const meta = getMeta(totalData, currentPage, itemsPerPage)

      // 7. Response
      return resSukses(
        reply,
        totalData > 0
          ? `Ditemukan ${totalData} data produk`
          : 'Tidak ada data produk',
        rows,
        meta
      )

    } catch (error: any) {
      console.error('Error fetching produk:', error)
      return resError(reply, 'Gagal mengambil data produk', 500)
    }
  })

  // [READ BY ID] GET /api/master/produk/:id
  server.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params

      if (!id || isNaN(id)) {
        return resError(reply, 'ID produk tidak valid!', 400)
      }

      const [rows]: any = await db.query(
        `SELECT
        mprod.id,
        mprod.deskripsi,
        mprod.keterangan,
        mprod.gambar,
        mprod.status_aktif,
        mprod.jenisbarang_fk,
        refjb.deskripsi AS jenisbarang_label,
        mprod.distributor_fk,
        refdist.deskripsi AS distributor_label,
        mh.harga
      FROM m_produk mprod
      LEFT JOIN m_referensi refjb ON refjb.id = mprod.jenisbarang_fk AND refjb.jenis_referensi_fk = 3
      LEFT JOIN m_referensi refdist ON refdist.id = mprod.distributor_fk AND refdist.jenis_referensi_fk = 4
      LEFT JOIN m_harga mh ON mh.produk_fk = mprod.id
      WHERE mprod.id = ? 
      LIMIT 1`,
        [id]
      )

      // ✅ Cek apakah data ditemukan
      if (rows.length === 0) {
        return resError(reply, `Produk dengan ID ${id} tidak ditemukan`, 404)
      }

      return resSukses(reply, 'Data produk berhasil diambil', rows[0])

    } catch (error: any) {
      console.error('Error fetching produk by ID:', error)
      return resError(reply, 'Gagal mengambil detail produk', 500)
    }
  })

  // [UPDATE] PUT /api/master/produk/:id
  server.put('/:id', async (request: any, reply) => {
    const connection = await db.getConnection()

    try {
      const { id } = request.params
      const { deskripsi, jenisbarang_fk, keterangan, distributor_fk, harga, status_aktif } = request.body

      // ✅ Validasi 1: ID
      if (!id || isNaN(id)) {
        return resError(reply, 'ID produk tidak valid!', 400)
      }

      // ✅ Validasi 2: Field wajib
      if (!deskripsi || deskripsi.trim().length < 2) {
        return resError(reply, 'Deskripsi wajib diisi dan minimal 2 karakter!', 400)
      }

      if (!jenisbarang_fk) {
        return resError(reply, 'Jenis produk wajib dipilih!', 400)
      }

      // ✅ Validasi 3: Harga (jika ada)
      let hargaRounded = null
      if (harga !== null && harga !== undefined && harga !== '') {
        const hargaNumber = parseFloat(harga)

        if (isNaN(hargaNumber)) {
          return resError(reply, 'Harga harus berupa angka!', 400)
        }

        if (hargaNumber < 0) {
          return resError(reply, 'Harga tidak boleh negatif!', 400)
        }

        hargaRounded = Math.round(hargaNumber * 100) / 100
      }

      // ✅ Validasi 4: Cek apakah produk ada
      const [existingProduk]: any = await connection.query(
        'SELECT id FROM m_produk WHERE id = ?',
        [id]
      )

      if (existingProduk.length === 0) {
        return resError(reply, `Produk dengan ID ${id} tidak ditemukan`, 404)
      }

      // ✅ Validasi 5: Cek duplikat (EXCLUDE ID SENDIRI!)
      const [existing]: any = await connection.query(
        `SELECT id FROM m_produk 
       WHERE LOWER(deskripsi) = LOWER(?) 
         AND jenisbarang_fk = ? 
         AND id != ?`,
        [deskripsi.trim(), jenisbarang_fk, id]
      )

      if (existing.length > 0) {
        return resError(
          reply,
          `Produk "${deskripsi}" sudah ada di kategori ini!`,
          400
        )
      }

      await connection.beginTransaction()

      // ✅ Update m_produk
      const [produkResult]: any = await connection.query(
        `UPDATE m_produk 
       SET deskripsi = ?, 
           jenisbarang_fk = ?, 
           keterangan = ?, 
           distributor_fk = ?, 
           status_aktif = ?
       WHERE id = ?`,
        [
          deskripsi.trim(),
          jenisbarang_fk,
          keterangan || null,
          distributor_fk || null,
          status_aktif ?? 1,
          id
        ]
      )

      // ✅ Handle m_harga dengan 3 skenario
      if (hargaRounded !== null) {
        // Skenario 1 & 2: Ada harga baru
        // Cek apakah sudah ada record harga
        const [existingHarga]: any = await connection.query(
          'SELECT id FROM m_harga WHERE produk_fk = ?',
          [id]
        )

        if (existingHarga.length > 0) {
          // Skenario 1: Update harga yang sudah ada
          await connection.query(
            `UPDATE m_harga 
           SET harga = ?, status_aktif = ?
           WHERE produk_fk = ?`,
            [hargaRounded, status_aktif ?? 1, id]
          )
        } else {
          // Skenario 2: Insert harga baru
          await connection.query(
            `INSERT INTO m_harga (produk_fk, harga, status_aktif) 
           VALUES (?, ?, ?)`,
            [id, hargaRounded, status_aktif ?? 1]
          )
        }
      } else {
        // Skenario 3: Tidak ada harga → hapus record harga jika ada
        await connection.query(
          'DELETE FROM m_harga WHERE produk_fk = ?',
          [id]
        )
      }

      await connection.commit()

      return resSukses(
        reply,
        `Produk "${deskripsi}" berhasil diupdate`,
        {
          id: parseInt(id),
          deskripsi,
          jenisbarang_fk,
          harga: hargaRounded
        },
        { affectedRows: produkResult.affectedRows }
      )

    } catch (error: any) {
      await connection.rollback()
      console.error('Error updating produk:', error)

      if (error.code === 'ER_DUP_ENTRY') {
        return resError(reply, `Produk dengan nama yang sama sudah ada!`, 400)
      }

      return resError(reply, 'Gagal mengupdate produk: ' + error.message, 500)
    } finally {
      connection.release()
    }
  })

  // [DELETE] DELETE /api/master/produk/:id
  server.delete('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const [result]: any = await db.query('DELETE FROM m_produk  WHERE id = ?', [id])
      if (result.affectedRows === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
      return reply.send({ message: 'Produk berhasil dihapus' })
    } catch (error) {
      return reply.status(500).send({ error: 'Gagal menghapus index' })
    }
  })

}