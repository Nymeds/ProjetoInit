import { Prisma, type User as PrismaUser } from '@prisma/client'

export interface UsersRepository {
  findById(
    id: string,
    options?: { includeGroups?: boolean } // nova opção
  ): Promise<(PrismaUser & { groups?: any[] }) | null>

  findByEmail(email: string): Promise<PrismaUser | null>
  create(data: Prisma.UserCreateInput): Promise<PrismaUser>
  apagar(id: string): Promise<void>
}
