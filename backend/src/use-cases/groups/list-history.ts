import type { GroupTaskHistoryWithRelations, GroupsRepository } from "../../repositories/groups-repository.js";

interface ListGroupHistoryRequest {
  groupId: string;
  userId: string;
  limit?: number;
}

interface ListGroupHistoryResponse {
  history: GroupTaskHistoryWithRelations[];
}

export class ListGroupHistoryUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({ groupId, userId, limit }: ListGroupHistoryRequest): Promise<ListGroupHistoryResponse> {
    const group = await this.groupsRepository.findById(groupId);
    if (!group) {
      throw new Error("Grupo nao encontrado");
    }

    const isMember = (group.members ?? []).some((member) => member.userId === userId);
    if (!isMember) {
      throw new Error("Nao autorizado para visualizar historico deste grupo");
    }

    if (this.groupsRepository.userHasPermission) {
      const canView = await this.groupsRepository.userHasPermission(groupId, userId, "VIEW_HISTORY");
      if (!canView) {
        throw new Error("Nao autorizado para visualizar historico deste grupo");
      }
    }

    if (!this.groupsRepository.listTaskHistory) {
      throw new Error("Repositorio nao suporta historico de grupo");
    }

    const history = await this.groupsRepository.listTaskHistory(groupId, limit);
    return { history };
  }
}
