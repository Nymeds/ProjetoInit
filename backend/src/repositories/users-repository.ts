import { Prisma, type User as PrismaUser } from '@prisma/client'

export interface UsersRepository {
  findById(
    id: string,
    options?: { includeGroups?: boolean } // nova opção
  ): Promise<(PrismaUser & { groups?: any[] }) | null>

  findByEmail(email: string): Promise<PrismaUser | null>
  create(data: Prisma.UserCreateInput): Promise<PrismaUser>
  apagar(id: string): Promise<void>
   updateResetToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<void>;
  findByResetToken( email : string,token: string): Promise<PrismaUser | null>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
}
