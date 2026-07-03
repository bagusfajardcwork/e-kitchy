import type { FastifyInstance } from 'fastify'
import { db } from '../../database'
import { resSukses, resError } from '../../../utils/helperResponse'
// import {getMeta, getPagination} from '../../../utils/helperPagination.ts';

export default async function index(server: FastifyInstance) {

  // [READ] GET /api/master/selectize/jenisbarang_fk
  server.get('/jenisbarang_fk', async (request: any, reply) => {
    try {

      const [rows] = await db.query(
       ` SELECT id as "value", deskripsi as "label" 
          FROM m_referensi WHERE status_aktif = 1 AND jenis_referensi_fk = 3`
      )

      const meta = {
        totalData: rows.length
      }

      return resSukses(reply, 'Data berhasil diambil', rows, meta)

    } catch (error) {
      return resError(reply, 'Gagal mengambil data', 500)
    }
  })

  // [READ] GET /api/master/selectize/distributor_fk
  server.get('/distributor_fk', async (request: any, reply) => {
    try {

      const [rows] = await db.query(
        ` SELECT id as "value", deskripsi as "label" 
          FROM m_referensi WHERE status_aktif = 1 AND jenis_referensi_fk = 4`
      )

      const meta = {
        totalData: rows.length
      }

      return resSukses(reply, 'Data berhasil diambil', rows, meta)

    } catch (error) {
      return resError(reply, 'Gagal mengambil data', 500)
    }
  })

}