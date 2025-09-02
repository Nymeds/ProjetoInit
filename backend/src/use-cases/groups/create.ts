import type { GroupsRepository } from "@/repositories/groups-repository.js";

export interface CreateGroupRequest {
  name: string;
  description?: string;
  userEmails: string[]; 
}


export class CreateGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({ name, description, userEmails }: CreateGroupRequest) {
    if (!name.trim()) {
      throw new Error("Nome do grupo é obrigatório");
    }

 
    const existingGroup = await this.groupsRepository.findByName(name);
    if (existingGroup) {
      throw new Error("Já existe um grupo com esse nome");
    }

    const group = await this.groupsRepository.create({
      name,
      description: description ?? "",
      userEmails,
    });

    return group;
  }
}
