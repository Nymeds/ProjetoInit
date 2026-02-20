import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { CreateTodoUseCase } from '../../use-cases/todo/create-todo.js'
import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js'
import { PrismaGroupsRepository } from '../../repositories/prisma/prisma-groups-repository.js'
import { prisma } from '../../utils/prismaClient.js'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const schema = z.object({
    title: z.string(),
    description: z.string().optional(),
    groupId: z.string().optional(),
  })

  const body = (request.body ?? {}) as Record<string, unknown>
  const valueOf = (value: unknown) => {
    if (value && typeof value === 'object' && 'value' in (value as any)) {
      return (value as { value: unknown }).value
    }
    return value
  }

  const { title, groupId, description } = schema.parse({
    title: valueOf(body.title),
    description: valueOf(body.description),
    groupId: valueOf(body.groupId),
  })
  const userId = (request.user as any).sub
  const protocol = (request.headers['x-forwarded-proto'] as string) || request.protocol
  const host = (request.headers['x-forwarded-host'] as string) || request.headers.host
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3333'

  try {
    const repository = new PrismaTodosRepository()
    const groupsRepository = new PrismaGroupsRepository()
    const useCase = new CreateTodoUseCase(repository, groupsRepository)

    const { todo } = await useCase.execute({ title, userId, description, groupId , })

    if (request.image) {
      await prisma.image.create({
        data: {
          filename: request.image.filename,
          path: request.image.path,
          mimetype: request.image.mimetype,
          size: request.image.size,
          todoId: todo.id,
          userId,
        },
      })
    }

    const todoWithImages = await prisma.todo.findUnique({
      where: { id: todo.id },
      include: { images: true },
    })

    return reply.status(201).send({
      todo: todoWithImages
        ? {
            ...todoWithImages,
            images: todoWithImages.images.map((image) => ({
              ...image,
              url: `${baseUrl}/uploads/${image.filename}`,
            })),
          }
        : todo,
    })
  } catch (err: any) {
    return reply.status(400).send({ message: err.message || 'Erro ao criar todo' })
  }
}
