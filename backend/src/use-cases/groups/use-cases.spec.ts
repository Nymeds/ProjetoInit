import type { Group, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GroupsRepository } from "../../repositories/groups-repository.js";
import type { UsersRepository } from "../../repositories/users-repository.js";
import { CreateGroupUseCase } from "./create.js";
import { DeleteGroupUseCase } from "./delete.js";
import { LeaveGroupUseCase } from "./leave.js";
import { ListGroupsUseCase } from "./list-groups.js";

// Factory de grupo para cenarios de teste com defaults consistentes.
function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "group-1",
    name: "Group Test",
    description: "Group Description",
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    ...overrides,
  };
}

// Factory de usuario usada para validar membership por email no create.
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "User Test",
    email: "user@test.com",
    password: "hashed",
    role: "MEMBER",
    ...overrides,
  };
}

// Mock do contrato GroupsRepository com spies individuais para asserts.
function makeGroupsRepositoryMock() {
  const deleteGroup = vi.fn<GroupsRepository["delete"]>();
  const findByName = vi.fn<GroupsRepository["findByName"]>();
  const create = vi.fn<GroupsRepository["create"]>();
  const findById = vi.fn<GroupsRepository["findById"]>();
  const findAll = vi.fn<GroupsRepository["findAll"]>();
  const findManyByUser = vi.fn<GroupsRepository["findManyByUser"]>();
  const removeMember = vi.fn<GroupsRepository["removeMember"]>();

  const repository: GroupsRepository = {
    delete: deleteGroup,
    findByName,
    create,
    findById,
    findAll,
    findManyByUser,
    removeMember,
  };

  return {
    repository,
    deleteGroup,
    findByName,
    create,
    findById,
    findAll,
    findManyByUser,
    removeMember,
  };
}

// Mock do UsersRepository porque CreateGroupUseCase valida emails existentes.
function makeUsersRepositoryMock() {
  const findById = vi.fn<UsersRepository["findById"]>();
  const findByEmail = vi.fn<UsersRepository["findByEmail"]>();
  const create = vi.fn<UsersRepository["create"]>();
  const apagar = vi.fn<UsersRepository["apagar"]>();

  const repository: UsersRepository = {
    findById,
    findByEmail,
    create,
    apagar,
  };

  return {
    repository,
    findById,
    findByEmail,
    create,
    apagar,
  };
}

describe("CreateGroupUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar grupo com emails normalizados", async () => {
    // Arrange: todos os emails consultados existem e create retorna grupo.
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();

    userRepo.findByEmail.mockResolvedValue(makeUser());
    groupRepo.create.mockResolvedValue(makeGroup());

    // Act: enviamos emails com espacos/caixa alta para validar normalizacao.
    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);
    const result = await useCase.execute({
      name: "New Group",
      userEmails: ["  USER1@TEST.COM ", "User2@test.com "],
    });

    // Assert:
    // 1) cada email eh consultado ja normalizado
    // 2) payload do create recebe lista limpa e sem duplicidade
    expect(userRepo.findByEmail).toHaveBeenNthCalledWith(1, "user1@test.com");
    expect(userRepo.findByEmail).toHaveBeenNthCalledWith(2, "user2@test.com");
    expect(groupRepo.create).toHaveBeenCalledWith({
      name: "New Group",
      description: "",
      userEmails: ["user1@test.com", "user2@test.com"],
    });
    expect(result.id).toBe("group-1");
  });

  it("deve falhar quando nome estiver vazio", async () => {
    // Arrange
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();
    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);

    // Assert: nome em branco deve ser bloqueado por regra de negocio.
    await expect(
      useCase.execute({
        name: "   ",
        userEmails: ["user1@test.com", "user2@test.com"],
      }),
    ).rejects.toThrow(/obrigat.rio/i);
  });

  it("deve falhar quando houver menos de dois membros", async () => {
    // Arrange
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();
    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);

    // Assert: grupo precisa de ao menos 2 membros.
    await expect(
      useCase.execute({
        name: "Group",
        userEmails: ["single@test.com"],
      }),
    ).rejects.toThrow("pelo menos 2");
  });

  it("deve falhar quando houver emails duplicados", async () => {
    // Arrange
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();
    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);

    // Assert: duplicidade eh rejeitada antes de tocar repositorio.
    await expect(
      useCase.execute({
        name: "Group",
        userEmails: [" DUP@test.com ", "dup@test.com"],
      }),
    ).rejects.toThrow("duplicados");
  });

  it("deve falhar quando um email nao existir", async () => {
    // Arrange: primeiro email existe, segundo nao existe.
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();
    userRepo.findByEmail.mockResolvedValueOnce(makeUser()).mockResolvedValueOnce(null);

    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);

    // Assert: qualquer email inexistente cancela a criacao do grupo.
    await expect(
      useCase.execute({
        name: "Group",
        userEmails: ["user1@test.com", "missing@test.com"],
      }),
    ).rejects.toThrow(/n.o encontrado/i);
  });

  it("deve mapear erro de nome duplicado do banco", async () => {
    // Arrange: simulamos erro P2002 do Prisma para campo name.
    const groupRepo = makeGroupsRepositoryMock();
    const userRepo = makeUsersRepositoryMock();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    groupRepo.create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["name"] },
    });

    const useCase = new CreateGroupUseCase(groupRepo.repository, userRepo.repository);

    // Assert: erro tecnico do banco eh traduzido para mensagem de negocio.
    await expect(
      useCase.execute({
        name: "Existing Group",
        userEmails: ["user1@test.com", "user2@test.com"],
      }),
    ).rejects.toThrow(/j. existe/i);
  });
});

describe("DeleteGroupUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve deletar grupo existente", async () => {
    // Arrange: grupo existe e delete retorna entidade removida.
    const groupRepo = makeGroupsRepositoryMock();
    groupRepo.findById.mockResolvedValue(makeGroup({ id: "group-2" }));
    groupRepo.deleteGroup.mockResolvedValue(makeGroup({ id: "group-2" }));

    // Act
    const useCase = new DeleteGroupUseCase(groupRepo.repository);
    const result = await useCase.execute({ id: "group-2" });

    // Assert: primeiro valida existencia e depois executa delete.
    expect(groupRepo.findById).toHaveBeenCalledWith("group-2");
    expect(groupRepo.deleteGroup).toHaveBeenCalledWith({ id: "group-2" });
    expect(result.id).toBe("group-2");
  });

  it("deve falhar com id vazio", async () => {
    // Arrange
    const groupRepo = makeGroupsRepositoryMock();
    const useCase = new DeleteGroupUseCase(groupRepo.repository);

    // Assert: id obrigatorio.
    await expect(useCase.execute({ id: "   " })).rejects.toThrow(/obrigat.rio/i);
  });

  it("deve falhar quando grupo nao existe", async () => {
    // Arrange: findById retorna null.
    const groupRepo = makeGroupsRepositoryMock();
    groupRepo.findById.mockResolvedValue(null);

    const useCase = new DeleteGroupUseCase(groupRepo.repository);

    // Assert: sem grupo encontrado, delete nao pode ser chamado.
    await expect(useCase.execute({ id: "missing" })).rejects.toThrow(/n.o encontrado/i);
    expect(groupRepo.deleteGroup).not.toHaveBeenCalled();
  });
});

describe("LeaveGroupUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve remover usuario do grupo existente", async () => {
    // Arrange: grupo existe e removeMember conclui sem erro.
    const groupRepo = makeGroupsRepositoryMock();
    groupRepo.findById.mockResolvedValue(makeGroup({ id: "group-3" }));
    groupRepo.removeMember.mockResolvedValue();

    // Act
    const useCase = new LeaveGroupUseCase(groupRepo.repository);
    const result = await useCase.execute({
      groupId: "group-3",
      userId: "user-9",
    });

    // Assert: valida consulta do grupo, remocao e mensagem final de sucesso.
    expect(groupRepo.findById).toHaveBeenCalledWith("group-3");
    expect(groupRepo.removeMember).toHaveBeenCalledWith("group-3", "user-9");
    expect(result).toEqual({ message: "Você saiu do grupo" });
  });

  it("deve falhar quando grupo nao existe", async () => {
    // Arrange: groupId invalido.
    const groupRepo = makeGroupsRepositoryMock();
    groupRepo.findById.mockResolvedValue(null);

    const useCase = new LeaveGroupUseCase(groupRepo.repository);

    // Assert: nao remove membro de grupo inexistente.
    await expect(
      useCase.execute({
        groupId: "missing",
        userId: "user-1",
      }),
    ).rejects.toThrow(/n.o encontrado/i);
  });
});

describe("ListGroupsUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar grupos do usuario", async () => {
    // Arrange: repositorio devolve dois grupos vinculados ao usuario.
    const groupRepo = makeGroupsRepositoryMock();
    groupRepo.findManyByUser.mockResolvedValue([makeGroup(), makeGroup({ id: "group-2" })]);

    // Act
    const useCase = new ListGroupsUseCase(groupRepo.repository);
    const result = await useCase.execute("user-1");

    // Assert: use-case apenas delega e retorna o resultado.
    expect(groupRepo.findManyByUser).toHaveBeenCalledWith("user-1");
    expect(result.groups).toHaveLength(2);
  });
});
