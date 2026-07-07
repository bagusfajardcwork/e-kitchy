import type {FastifyRequest, FastifyReply} from 'fastify'
import jwt from 'jsonwebtoken'

// Interface untuk data user di token
export interface UserPayload {
  id: number
  username: string
  nama: string
  roles: string[]
}

// Extend FastifyRequest agar TypeScript kenal property 'user'
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload
  }
}

// Middleware untuk memverifikasi Token
export const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'Token tidak ditemukan atau format salah!'
      })
    }

    const token = authHeader.split(' ')[1]

    // Verifikasi token menggunakan JWT_SECRET dari .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload

    // Simpan data user ke request
    request.user = decoded

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({
        success: false,
        error: 'Token telah kedaluwarsa, silakan login ulang!'
      })
    }
    return reply.status(401).send({
      success: false,
      error: 'Token tidak valid!'
    })
  }
}