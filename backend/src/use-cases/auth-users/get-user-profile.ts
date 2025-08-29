import type { UsersRepository } from "@/repositories/users-repository.js";

interface GetUserProfileRequest {
  userId: string;
}

export class GetUserProfileUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ userId }: GetUserProfileRequest) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
