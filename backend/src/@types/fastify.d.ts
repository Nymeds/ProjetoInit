import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    image?: {
      filename: string
      path: string
      mimetype: string
      size: number
    }
  }
}
