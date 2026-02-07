import { prisma } from '../../utils/prismaClient.js'
import type { Image } from '@prisma/client'

export class PrismaImageRepository {
  async create(data: {
    filename: string
    path: string
    mimetype: string
    size: number
    todoId?: number
    userId?: string
    groupId?: string
    messageId?: string
  }): Promise<Image> {
    return prisma.image.create({
      data,
    })
  }
}
