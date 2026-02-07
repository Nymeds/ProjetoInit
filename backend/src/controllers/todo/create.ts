import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { CreateTodoUseCase } from '../../use-cases/todo/create-todo.js'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { PrismaImageRepository } from '../../repositories/prisma/prisma-image-repository.js'

// helper para transformar stream em Buffer (caso precise)
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    title: z.string().min(1, 'Título obrigatório'),
    description: z.string().optional(),
    groupId: z.string().optional(),
  })

  // DEBUG — ver o content-type para confirmar multipart
  console.log('content-type:', request.headers['content-type'])

  // request.body vem do attachFieldsToBody
  const rawBody = request.body as any ?? {}
  console.log('RAW BODY KEYS:', Object.keys(rawBody))

  // Normaliza: se o campo veio como { value: 'x' }, pega .value
  const normalized: Record<string, any> = {}
  for (const key of Object.keys(rawBody)) {
    const val = rawBody[key]
    // fastify attaches fields as { value } and files as { file, filename, mimetype, ... }
    if (val && typeof val === 'object' && 'value' in val) {
      normalized[key] = val.value
    } else {
      normalized[key] = val
    }
  }

  console.log('NORMALIZED BODY:', normalized) // 📌 veja se title aparece aqui

  // agora valida com zod
  const { title, description, groupId } = schema.parse(normalized)
  const userId = (request.user as any).sub

  try {
    const todosRepository = new PrismaTodosRepository()
    const imageRepository = new PrismaImageRepository()
    const useCase = new CreateTodoUseCase(todosRepository)

    const { todo } = await useCase.execute({
      title,
      userId,
      description,
      groupId,
    })

    // tratar imagem (se houver)
    const imageField = rawBody.image // pode ser undefined
    if (imageField) {
      // caso o arquivo venha como objeto com .file (stream) e .filename
      const fileStream = imageField?.file
      const filename = imageField?.filename ?? `${randomUUID()}.bin`
      const mimetype = imageField?.mimetype ?? 'application/octet-stream'

      if (fileStream) {
        const buffer = await (fileStream.toBuffer?.() ?? streamToBuffer(fileStream))

        // salva em disco (ajuste o path conforme quiser)
        const uploadDir = path.resolve('uploads')
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
        const savedName = `${randomUUID()}${path.extname(filename) || '.bin'}`
        const filepath = path.join(uploadDir, savedName)
        await fs.promises.writeFile(filepath, buffer)

        // persiste no banco via ImageRepository
        await imageRepository.create({
          filename: savedName,
          path: `/uploads/${savedName}`,
          mimetype,
          size: buffer.length,
          todoId: todo.id,
          userId,
        })
      } else {
        // se attachFieldsToBody retornar outra forma (ex.: already-buffered)
        // tente lidar com isso aqui (omita ou log conforme necessário)
        console.log('imageField exists but no file stream:', imageField)
      }
    }

    return reply.status(201).send({ todo })
  } catch (err: any) {
    console.error('CREATE TODO ERROR:', err)
    return reply.status(400).send({
      message: err.message || 'Erro ao criar todo',
    })
  }
}
