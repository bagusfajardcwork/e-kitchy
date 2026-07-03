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
      let whereClause = 'WHERE p.status_aktif = 1'
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
       LEFT JOIN m_harga h ON p.id = h.produk_fk AND h.status_aktif = 1
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

  //
  // // [READ DETAIL] GET /api/master/produk/:id
  // server.get('/:id', async (request: any, reply) => {
  //   try {
  //     const { id } = request.params
  //     const [rows]: any = await db.query('SELECT * FROM m_produk WHERE id = ? AND status_aktif = 1', [id])
  //
  //     if (rows.length === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
  //     return reply.send({ data: rows[0] })
  //   } catch (error) {
  //     return reply.status(500).send({ error: 'Gagal mengambil detail index' })
  //   }
  // })
  //
  // // [UPDATE] PUT /api/master/produk/:id
  // server.put('/:id', async (request: any, reply) => {
  //   try {
  //     const { id } = request.params
  //     const { kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id } = request.body
  //     const [result]: any = await db.query(
  //       `UPDATE m_produk SET kode_produk = ?, nama = ?, deskripsi = ?, harga = ?, gambar = ?, jenis_barang_id = ? WHERE id = ?`,
  //       [kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id, id]
  //     )
  //     if (result.affectedRows === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
  //     return reply.send({ message: 'Produk berhasil diperbarui' })
  //   } catch (error: any) {
  //     if (error.code === 'ER_DUP_ENTRY') return reply.status(400).send({ error: 'Kode Produk sudah digunakan.' })
  //     return reply.status(500).send({ error: 'Gagal memperbarui index' })
  //   }
  // })
  //
  // // [DELETE] DELETE /api/master/produk/:id
  // server.delete('/:id', async (request: any, reply) => {
  //   try {
  //     const { id } = request.params
  //     const [result]: any = await db.query('UPDATE m_produk SET status_aktif = 0 WHERE id = ?', [id])
  //     if (result.affectedRows === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
  //     return reply.send({ message: 'Produk berhasil dihapus' })
  //   } catch (error) {
  //     return reply.status(500).send({ error: 'Gagal menghapus index' })
  //   }
  // })
  //
  // // [UPDATE] PUT /api/master/produk/complex-update/:id
  // server.put('/complex-update/:id', async (request: any, reply) => {
  //   // 1. "Pinjam" satu koneksi khusus dari pool untuk transaksi ini
  //   const connection = await db.getConnection()
  //
  //   try {
  //     const { id } = request.params
  //     const { nama, harga, diupdate_oleh } = request.body
  //
  //     // 2. Mulai Transaksi! (Kunci sabuk pengaman)
  //     await connection.beginTransaction()
  //
  //     // ==========================================
  //     // PROSES 1: Update ke tabel pertama (m_produk)
  //     // ==========================================
  //     const [resultProduk]: any = await connection.query(
  //       `UPDATE m_produk SET nama = ?, harga = ? WHERE id = ?`,
  //       [nama, harga, id]
  //     )
  //
  //     if (resultProduk.affectedRows === 0) {
  //       // Jika produk tidak ketemu, batalkan transaksi dan lempar error
  //       throw new Error('PRODUK_NOT_FOUND')
  //     }
  //
  //     // ==========================================
  //     // PROSES 2: Update/Insert ke tabel kedua (contoh: t_log_aktivitas)
  //     // ==========================================
  //     const catatan = `Mengubah nama menjadi ${nama} dan harga menjadi ${harga}`
  //     await connection.query(
  //       `INSERT INTO t_log_aktivitas (user_id, aksi, keterangan) VALUES (?, ?, ?)`,
  //       [diupdate_oleh, 'UPDATE_PRODUK', catatan]
  //     )
  //
  //     // 3. Jika semua query di atas BERHASIL, simpan permanen (COMMIT)
  //     await connection.commit()
  //
  //     return reply.send({ message: 'Produk dan Log berhasil diperbarui!' })
  //
  //   } catch (error: any) {
  //     // 4. Jika ada SALAH SATU yang gagal, batalkan semuanya (ROLLBACK)
  //     await connection.rollback()
  //
  //     server.log.error(error)
  //
  //     if (error.message === 'PRODUK_NOT_FOUND') {
  //       return reply.status(404).send({ error: 'Produk tidak ditemukan' })
  //     }
  //
  //     return reply.status(500).send({ error: 'Gagal memperbarui data. Semua perubahan dibatalkan.' })
  //
  //   } finally {
  //     // 5. WAJIB: Kembalikan koneksi ke pool agar bisa dipakai oleh request lain
  //     // Jika ini lupa ditulis, servermu akan hang karena kehabisan koneksi!
  //     connection.release()
  //   }
  // })
}