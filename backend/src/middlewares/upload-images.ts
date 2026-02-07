import type { FastifyRequest, FastifyReply } from 'fastify'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'

export async function uploadImage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const file = await request.file()

  if (!file) {
    return
  }

  const uploadDir = path.resolve('uploads')

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const extension = path.extname(file.filename)
  const filename = `${randomUUID()}${extension}`
  const filepath = path.join(uploadDir, filename)

  const buffer = await file.toBuffer()
  await fs.promises.writeFile(filepath, buffer)

  
  request.image = {
    filename,
    path: filepath,
    mimetype: file.mimetype,
    size: buffer.length,
  }
}
