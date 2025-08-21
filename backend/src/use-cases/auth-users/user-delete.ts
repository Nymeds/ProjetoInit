import type { UsersRepository } from '@/repositories/users-repository.js'

interface DeleteUserUseCaseRequest {
  targetUserId: string
}

export class DeleteUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ targetUserId }: DeleteUserUseCaseRequest): Promise<void> {
    const user = await this.usersRepository.findById(targetUserId)
    if (!user) {
      throw new Error('User not found')
    }

    await this.usersRepository.apagar(targetUserId)
  }
}
