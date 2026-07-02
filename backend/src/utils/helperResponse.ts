import type { FastifyReply } from 'fastify'

export const resSukses = (
  reply: FastifyReply,
  message: string,
  data: any = null,
  meta: any = null,
  statusCode = 200
) => {
  return reply.status(statusCode).send({
    success: true,
    message,
    data,
    meta // Sekarang meta akan menampung info paging
  })
}

export const resError = (reply: FastifyReply, message: string, statusCode = 500) => {
  return reply.status(statusCode).send({
    success: false,
    error: message
  })
}