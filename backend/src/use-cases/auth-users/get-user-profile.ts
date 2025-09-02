import type { UsersRepository } from "@/repositories/users-repository.js";

interface GetUserProfileRequest {
  userId: string;
}

export class GetUserProfileUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({ userId }: GetUserProfileRequest) {
    const user = await this.usersRepository.findById(userId, { includeGroups: true });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const groups = user.groups?.map(ug => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      roleInGroup: ug.roleInGroup,
    })) || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      groups,
    };
  }
}
