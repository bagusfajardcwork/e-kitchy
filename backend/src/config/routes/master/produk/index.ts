import type {FastifyInstance} from "fastify";
import { db } from '../../../database'
import { resSukses, resError } from '../../../../utils/helperResponse'
import { getPagination, getMeta } from '../../../../utils/helperPagination';

// Fastify Plugin untuk rute index
export default async function index(server: FastifyInstance) {

  // [READ] GET /api/master/master/produk
  server.get('/', async (request: any, reply) => {
    try {
      // 1. Panggil helper untuk hitung offset
      const { currentPage, itemsPerPage, offset } = getPagination(request.query.page, request.query.limit)

      // 2. Query total data
      const [countResult]: any = await db.query('SELECT COUNT(*) as total FROM m_produk WHERE status_aktif = 1')
      const totalData = countResult[0].total

      // 3. Query data per halaman
      const [rows] = await db.query(
        'SELECT * FROM m_produk WHERE status_aktif = 1 ORDER BY id DESC LIMIT ? OFFSET ?',
        [itemsPerPage, offset]
      )

      // 4. Panggil helper untuk generate meta
      const meta = getMeta(totalData, currentPage, itemsPerPage)

      return resSukses(reply, 'Data berhasil diambil', rows, meta)
      // return resSukses(reply, 'Operasi berhasil dilakukan') // jika tidak ingin ada count nya
    } catch (error) {
      return resError(reply, 'Gagal mengambil data')
    }
  })

  // [READ DETAIL] GET /api/master/master/produk/:id
  server.get('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const [rows]: any = await db.query('SELECT * FROM m_produk WHERE id = ? AND status_aktif = 1', [id])

      if (rows.length === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
      return reply.send({ data: rows[0] })
    } catch (error) {
      return reply.status(500).send({ error: 'Gagal mengambil detail index' })
    }
  })

  // [CREATE] POST /api/master/produk
  server.post('/', async (request: any, reply) => {
    try {
      const { kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id } = request.body

      const [result]: any = await db.query(
        `INSERT INTO m_produk (kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id) VALUES (?, ?, ?, ?, ?, ?)`,
        [kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id]
      )

      // Response dikustomisasi dengan memanggil variabel ${nama}
      return reply.status(201).send({
        message: `Produk "${nama}" berhasil ditambahkan!`,
        data: {
          id: result.insertId,
          nama: nama // (Opsional) Mengirimkan kembali nama di objek data sangat berguna untuk Frontend
        }
      })

    } catch (error: any) {
      // Bonus: Kita juga bisa bikin pesan error-nya dinamis!
      if (error.code === 'ER_DUP_ENTRY') {
        const { kode_produk } = request.body
        return reply.status(400).send({ error: `Kode Produk "${kode_produk}" sudah terdaftar. Silakan gunakan kode lain.` })
      }

      return reply.status(500).send({ error: 'Gagal menyimpan produk' })
    }
  })

  // [UPDATE] PUT /api/master/produk/:id
  server.put('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const { kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id } = request.body
      const [result]: any = await db.query(
        `UPDATE m_produk SET kode_produk = ?, nama = ?, deskripsi = ?, harga = ?, gambar = ?, jenis_barang_id = ? WHERE id = ?`,
        [kode_produk, nama, deskripsi, harga, gambar, jenis_barang_id, id]
      )
      if (result.affectedRows === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
      return reply.send({ message: 'Produk berhasil diperbarui' })
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') return reply.status(400).send({ error: 'Kode Produk sudah digunakan.' })
      return reply.status(500).send({ error: 'Gagal memperbarui index' })
    }
  })

  // [DELETE] DELETE /api/master/produk/:id
  server.delete('/:id', async (request: any, reply) => {
    try {
      const { id } = request.params
      const [result]: any = await db.query('UPDATE m_produk SET status_aktif = 0 WHERE id = ?', [id])
      if (result.affectedRows === 0) return reply.status(404).send({ error: 'Produk tidak ditemukan' })
      return reply.send({ message: 'Produk berhasil dihapus' })
    } catch (error) {
      return reply.status(500).send({ error: 'Gagal menghapus index' })
    }
  })

  // [UPDATE] PUT /api/master/produk/complex-update/:id
  server.put('/complex-update/:id', async (request: any, reply) => {
    // 1. "Pinjam" satu koneksi khusus dari pool untuk transaksi ini
    const connection = await db.getConnection()

    try {
      const { id } = request.params
      const { nama, harga, diupdate_oleh } = request.body

      // 2. Mulai Transaksi! (Kunci sabuk pengaman)
      await connection.beginTransaction()

      // ==========================================
      // PROSES 1: Update ke tabel pertama (m_produk)
      // ==========================================
      const [resultProduk]: any = await connection.query(
        `UPDATE m_produk SET nama = ?, harga = ? WHERE id = ?`,
        [nama, harga, id]
      )

      if (resultProduk.affectedRows === 0) {
        // Jika produk tidak ketemu, batalkan transaksi dan lempar error
        throw new Error('PRODUK_NOT_FOUND')
      }

      // ==========================================
      // PROSES 2: Update/Insert ke tabel kedua (contoh: t_log_aktivitas)
      // ==========================================
      const catatan = `Mengubah nama menjadi ${nama} dan harga menjadi ${harga}`
      await connection.query(
        `INSERT INTO t_log_aktivitas (user_id, aksi, keterangan) VALUES (?, ?, ?)`,
        [diupdate_oleh, 'UPDATE_PRODUK', catatan]
      )

      // 3. Jika semua query di atas BERHASIL, simpan permanen (COMMIT)
      await connection.commit()

      return reply.send({ message: 'Produk dan Log berhasil diperbarui!' })

    } catch (error: any) {
      // 4. Jika ada SALAH SATU yang gagal, batalkan semuanya (ROLLBACK)
      await connection.rollback()

      server.log.error(error)

      if (error.message === 'PRODUK_NOT_FOUND') {
        return reply.status(404).send({ error: 'Produk tidak ditemukan' })
      }

      return reply.status(500).send({ error: 'Gagal memperbarui data. Semua perubahan dibatalkan.' })

    } finally {
      // 5. WAJIB: Kembalikan koneksi ke pool agar bisa dipakai oleh request lain
      // Jika ini lupa ditulis, servermu akan hang karena kehabisan koneksi!
      connection.release()
    }
  })
}