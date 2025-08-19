import { prisma } from '../utils/prismaClient.js'


export interface UsersRepository {
  findById(id: string): Promise<any | null>
  findByEmail(email: string): Promise<any | null>
  create(data: { name: string; email: string; password: string }): Promise<any>
  apagar(id: string): Promise<void>
}
