import type { GroupsRepository } from "../../repositories/groups-repository.js";
import type { UsersRepository } from "../../repositories/users-repository.js";

export interface CreateGroupRequest {
  name: string;
  description?: string;
  userEmails: string[];
  creatorUserId?: string;
}

export class CreateGroupUseCase {
  constructor(
    private groupsRepository: GroupsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({ name, description, userEmails, creatorUserId }: CreateGroupRequest) {
    if (!name.trim()) {
      throw new Error("Nome do grupo e obrigatorio");
    }

    const cleaned = userEmails.map((email) => email.trim().toLowerCase()).filter((email) => email !== "");
    const normalized = new Set(cleaned);

    if (normalized.size !== cleaned.length) {
      throw new Error("Emails duplicados nao sao permitidos");
    }

    if (creatorUserId) {
      const creator = await this.usersRepository.findById(creatorUserId);
      if (!creator) {
        throw new Error("Criador do grupo nao encontrado");
      }
      normalized.add(creator.email.trim().toLowerCase());
    }

    if (normalized.size < 2) {
      throw new Error("O grupo precisa ter pelo menos 2 membros");
    }

    for (const email of normalized) {
      const user = await this.usersRepository.findByEmail(email);
      if (!user) {
        throw new Error(`Usuario com email ${email} nao encontrado`);
      }
    }

    try {
      return await this.groupsRepository.create({
        name: name.trim(),
        description: description?.trim() || "",
        userEmails: Array.from(normalized),
        creatorUserId,
      });
    } catch (err: any) {
      if (err.code === "P2002" && err.meta?.target?.includes("name")) {
        throw new Error("Ja existe um grupo com esse nome");
      }
      throw err;
    }
  }
}
