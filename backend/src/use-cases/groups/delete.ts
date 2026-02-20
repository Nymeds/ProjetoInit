import type { GroupsRepository } from "../../repositories/groups-repository.js";

export interface DeleteGroupRequest {
  id: string;
  requesterUserId?: string;
}

export class DeleteGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({ id, requesterUserId }: DeleteGroupRequest) {
    if (!id.trim()) {
      throw new Error("ID do grupo e obrigatorio");
    }

    const existingGroup = await this.groupsRepository.findById(id);
    if (!existingGroup) {
      throw new Error("Grupo nao encontrado");
    }

    if (requesterUserId && this.groupsRepository.userHasPermission) {
      const canDelete = await this.groupsRepository.userHasPermission(id, requesterUserId, "MANAGE_WORKFLOW");
      if (!canDelete) {
        throw new Error("Nao autorizado para deletar o grupo");
      }
    }

    return this.groupsRepository.delete({ id });
  }
}

