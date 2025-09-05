import type { GroupsRepository } from "@/repositories/groups-repository.js";

export interface DeleteGroupRequest {
  id: string;
}

export class DeleteGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({ id }: DeleteGroupRequest) {
    if (!id.trim()) {
      throw new Error("ID do grupo é obrigatório");
    }

    const existingGroup = await this.groupsRepository.findById(id);
    if (!existingGroup) {
      throw new Error("Grupo não encontrado");
    }

    return this.groupsRepository.delete({ id });
  }
}
