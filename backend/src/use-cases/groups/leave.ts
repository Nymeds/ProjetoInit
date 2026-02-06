import type { GroupsRepository } from '../../repositories/groups-repository.js'

interface LeaveGroupRequest {
  groupId: string
  userId: string
}

export class LeaveGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({ groupId, userId }: LeaveGroupRequest) {
    // check group exists
    const group = await this.groupsRepository.findById(groupId)
    if (!group) throw new Error('Grupo não encontrado')

    // remove membership
    await this.groupsRepository.removeMember(groupId, userId)

    return { message: 'Você saiu do grupo' }
  }
}
