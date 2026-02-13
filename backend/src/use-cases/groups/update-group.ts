import type { Group } from '@prisma/client'
import type { GroupsRepository } from '../../repositories/groups-repository.js'

interface UpdateGroupUseCaseRequest {
  groupId: string
  userId: string
  name?: string
  description?: string
}

interface UpdateGroupUseCaseResponse {
  group: Group
}

export class UpdateGroupUseCase {
  constructor(private groupsRepository: GroupsRepository) {}

  async execute({
    groupId,
    userId,
    name,
    description,
  }: UpdateGroupUseCaseRequest): Promise<UpdateGroupUseCaseResponse> {
    const group = await this.groupsRepository.findById(groupId)

    if (!group) {
      throw new Error('Grupo nao encontrado')
    }

    const isMember = (group as any).members?.some((member: any) => member.userId === userId)
    if (!isMember) {
      throw new Error('Nao autorizado para atualizar este grupo')
    }

    const nextName = name?.trim()
    const nextDescription = description?.trim()

    if (name !== undefined && !nextName) {
      throw new Error('Nome do grupo e obrigatorio')
    }

    if (nextName && nextName !== group.name) {
      const duplicated = await this.groupsRepository.findByName(nextName)
      if (duplicated && duplicated.id !== groupId) {
        throw new Error('Ja existe um grupo com esse nome')
      }
    }

    const updatedGroup = await this.groupsRepository.update(groupId, {
      name: nextName,
      description: description !== undefined ? (nextDescription || null) : undefined,
    })

    return { group: updatedGroup }
  }
}
