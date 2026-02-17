import type { Group } from '@prisma/client'
import type { GroupsRepository } from '../../repositories/groups-repository.js'

interface UpdateGroupUseCaseRequest {
  groupId: string
  userId: string
  name?: string
  description?: string
  addUserEmails?: string[]
  removeUserIds?: string[]
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
    addUserEmails,
    removeUserIds,
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

    await this.groupsRepository.update(groupId, {
      name: nextName,
      description: description !== undefined ? (nextDescription || null) : undefined,
    })

    const emailsToAdd = (addUserEmails ?? [])
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)
    const uniqueEmailsToAdd = Array.from(new Set(emailsToAdd))

    if (uniqueEmailsToAdd.length > 0) {
      if (!this.groupsRepository.addMember) {
        throw new Error('Repositorio nao suporta adicao de membros')
      }

      for (const email of uniqueEmailsToAdd) {
        await this.groupsRepository.addMember(groupId, email)
      }
    }

    const usersToRemove = Array.from(new Set((removeUserIds ?? []).map((id) => id.trim()).filter(Boolean)))
    if (usersToRemove.length > 0) {
      for (const memberId of usersToRemove) {
        await this.groupsRepository.removeMember(groupId, memberId)
      }
    }

    const finalGroup = await this.groupsRepository.findById(groupId)
    if (!finalGroup) {
      throw new Error('Grupo nao encontrado')
    }

    return { group: finalGroup }
  }
}
