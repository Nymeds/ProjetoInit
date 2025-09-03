import type { GroupsRepository } from "@/repositories/groups-repository.js";
import type { UsersRepository } from "@/repositories/users-repository.js";

export interface CreateGroupRequest {
  name: string;
  description?: string;
  userEmails: string[]; 
}
export class CreateGroupUseCase {
  constructor(
    private groupsRepository: GroupsRepository,
    private usersRepository: UsersRepository
  ) {}

  async execute({ name, description, userEmails }: CreateGroupRequest) {
    if (!name.trim()) {
      throw new Error("Nome do grupo é obrigatório");
    }

    const users = await Promise.all(
      userEmails.map(async (email) => {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) throw new Error(`Usuário com email ${email} não encontrado`);
        return user;
      })
    );

    try {
      const group = await this.groupsRepository.create({
        name,
        description: description ?? "",
        userEmails,
      });

      return group;
    } catch (err: any) {
      
      if (err.code === "P2002" && err.meta?.target?.includes("name")) {
        throw new Error("Já existe um grupo com esse nome");
      }
      throw err;
    }
  }
}

