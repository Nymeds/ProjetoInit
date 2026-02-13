import type { User } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRepository } from "../../repositories/users-repository.js";
import { InvalidCredentials } from "../errors/invalid-credentials.js";
import { AuthenticateUseCase } from "./authenticate.js";
import { DeleteUserUseCase } from "./user-delete.js";
import { GetUserProfileUseCase } from "./get-user-profile.js";
import { RegisterUseCase } from "./register.js";

// Factory de usuario para manter dados previsiveis em todos os cenarios.
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "User Test",
    email: "user@test.com",
    password: "hashed-password",
    role: "MEMBER",
    ...overrides,
  };
}

// Mock tipado do repositorio de usuarios.
// Mantemos referencias aos spies para verificar chamadas e payloads.
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

describe("InvalidCredentials", () => {
  it("deve estender Error", () => {
    // Garantimos que a excecao customizada preserva contrato padrao de erro.
    const error = new InvalidCredentials();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Usuario");
  });
});

describe("AuthenticateUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve autenticar usuario com email normalizado", async () => {
    // Arrange: usuario existe e senha informada confere com o hash salvo.
    const { repository, findByEmail } = makeUsersRepositoryMock();
    const passwordHash = await hash("123456", 6);
    const user = makeUser({
      email: "user@test.com",
      password: passwordHash,
      role: "ADMIN",
    });

    findByEmail.mockResolvedValue(user);

    // Act: envia email com espacos e caixa alta para validar normalizacao.
    const useCase = new AuthenticateUseCase(repository);
    const result = await useCase.execute({
      email: "  USER@TEST.COM ",
      password: "123456",
    });

    // Assert: busca ocorre com email normalizado e retorno nao expoe senha.
    expect(findByEmail).toHaveBeenCalledWith("user@test.com");
    expect(result).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  it("deve falhar quando usuario nao existe", async () => {
    // Arrange: repositorio nao encontrou email.
    const { repository, findByEmail } = makeUsersRepositoryMock();
    findByEmail.mockResolvedValue(null);

    const useCase = new AuthenticateUseCase(repository);

    // Assert: autenticacao sem usuario deve lançar InvalidCredentials.
    await expect(
      useCase.execute({
        email: "missing@test.com",
        password: "123456",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
  });

  it("deve falhar quando senha estiver incorreta", async () => {
    // Arrange: email existe, mas senha enviada nao bate com hash armazenado.
    const { repository, findByEmail } = makeUsersRepositoryMock();
    const passwordHash = await hash("123456", 6);
    findByEmail.mockResolvedValue(
      makeUser({
        password: passwordHash,
      }),
    );

    const useCase = new AuthenticateUseCase(repository);

    // Assert: erro de credencial invalida protege contra senha incorreta.
    await expect(
      useCase.execute({
        email: "user@test.com",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
  });
});

describe("RegisterUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve cadastrar usuario com senha criptografada e email normalizado", async () => {
    // Arrange: email ainda nao existe e create devolve o usuario persistido.
    const { repository, findByEmail, create } = makeUsersRepositoryMock();
    findByEmail.mockResolvedValue(null);
    create.mockImplementation(async (data) =>
      makeUser({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    );

    // Act
    const useCase = new RegisterUseCase(repository);
    const result = await useCase.execute({
      name: "New User",
      email: "  NEW@TEST.COM ",
      password: "123456",
    });

    // Assert:
    // 1) busca usa email normalizado
    // 2) senha enviada para create nao eh texto puro
    // 3) hash realmente representa a senha original
    expect(findByEmail).toHaveBeenCalledWith("new@test.com");
    expect(create).toHaveBeenCalledTimes(1);

    const createPayload = create.mock.calls[0]?.[0];
    expect(createPayload?.email).toBe("new@test.com");
    expect(createPayload?.password).not.toBe("123456");
    expect(await compare("123456", String(createPayload?.password))).toBe(true);
    expect(result.user.email).toBe("new@test.com");
  });

  it("deve bloquear cadastro com email existente", async () => {
    // Arrange: simulamos colisao de email.
    const { repository, findByEmail } = makeUsersRepositoryMock();
    findByEmail.mockResolvedValue(makeUser());

    const useCase = new RegisterUseCase(repository);

    // Assert: regra de unicidade interrompe antes da criacao.
    await expect(
      useCase.execute({
        name: "New User",
        email: "user@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("UserAlreadyExistsError");
  });
});

describe("GetUserProfileUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar perfil com grupos mapeados", async () => {
    // Arrange: usuario com membership para validar mapeamento de grupos.
    const { repository, findById } = makeUsersRepositoryMock();
    findById.mockResolvedValue({
      ...makeUser(),
      groups: [
        {
          roleInGroup: "MEMBER",
          group: {
            id: "group-1",
            name: "Group 1",
            description: "Desc",
          },
        },
      ],
    });

    // Act
    const useCase = new GetUserProfileUseCase(repository);
    const result = await useCase.execute({ userId: "user-1" });

    // Assert: inclui grupos no findById e devolve payload simplificado para o caller.
    expect(findById).toHaveBeenCalledWith("user-1", { includeGroups: true });
    expect(result).toEqual({
      id: "user-1",
      name: "User Test",
      email: "user@test.com",
      role: "MEMBER",
      groups: [
        {
          id: "group-1",
          name: "Group 1",
          description: "Desc",
          roleInGroup: "MEMBER",
        },
      ],
    });
  });

  it("deve falhar quando usuario nao existir", async () => {
    // Arrange: id sem registro.
    const { repository, findById } = makeUsersRepositoryMock();
    findById.mockResolvedValue(null);

    const useCase = new GetUserProfileUseCase(repository);

    // Assert: perfil inexistente deve retornar erro de negocio.
    await expect(useCase.execute({ userId: "missing" })).rejects.toThrow(/n.o encontrado/i);
  });
});

describe("DeleteUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve deletar usuario existente", async () => {
    // Arrange: usuario alvo existe e pode ser apagado.
    const { repository, findById, apagar } = makeUsersRepositoryMock();
    findById.mockResolvedValue(makeUser({ id: "user-2" }));
    apagar.mockResolvedValue();

    // Act
    const useCase = new DeleteUserUseCase(repository);
    await useCase.execute({ targetUserId: "user-2" });

    // Assert: fluxo correto eh buscar primeiro e apagar depois.
    expect(findById).toHaveBeenCalledWith("user-2");
    expect(apagar).toHaveBeenCalledWith("user-2");
  });

  it("deve falhar ao tentar deletar usuario inexistente", async () => {
    // Arrange: alvo nao encontrado.
    const { repository, findById, apagar } = makeUsersRepositoryMock();
    findById.mockResolvedValue(null);

    const useCase = new DeleteUserUseCase(repository);

    // Assert: sem usuario, nao deve chamar apagar.
    await expect(useCase.execute({ targetUserId: "missing" })).rejects.toThrow("nao encontrado");
    expect(apagar).not.toHaveBeenCalled();
  });
});
