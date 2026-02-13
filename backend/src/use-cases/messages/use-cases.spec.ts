import type { Message } from "../../repositories/messages-repository.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessagesRepository } from "../../repositories/messages-repository.js";
import { CreateGroupMessageUseCase } from "./create-for-group.js";
import { CreateTodoMessageUseCase } from "./create-for-todo.js";
import { DeleteTodoMessageUseCase } from "./delete-for-todo.js";
import { ListGroupMessagesUseCase } from "./list-by-group.js";
import { ListTodoMessagesUseCase } from "./list-by-todo.js";
import { UpdateTodoMessageUseCase } from "./update-for-todo.js";

// Factory de mensagem usada para gerar fixtures com defaults previsiveis.
function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "message-1",
    content: "Hello",
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    kind: "COMMENT",
    authorId: "user-1",
    authorName: "User Test",
    groupId: null,
    todoId: 1,
    ...overrides,
  };
}

// Mock completo do MessagesRepository para validar contratos de cada use-case.
function makeMessagesRepositoryMock() {
  const listByGroup = vi.fn<MessagesRepository["listByGroup"]>();
  const createForGroup = vi.fn<MessagesRepository["createForGroup"]>();
  const listByTodo = vi.fn<MessagesRepository["listByTodo"]>();
  const createForTodo = vi.fn<MessagesRepository["createForTodo"]>();
  const updateForTodo = vi.fn<MessagesRepository["updateForTodo"]>();
  const deleteMessage = vi.fn<MessagesRepository["delete"]>();

  const repository: MessagesRepository = {
    listByGroup,
    createForGroup,
    listByTodo,
    createForTodo,
    updateForTodo,
    delete: deleteMessage,
  };

  return {
    repository,
    listByGroup,
    createForGroup,
    listByTodo,
    createForTodo,
    updateForTodo,
    deleteMessage,
  };
}

describe("CreateGroupMessageUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar mensagem de grupo com conteudo limpo", async () => {
    // Arrange: repositorio responde com mensagem criada.
    const repo = makeMessagesRepositoryMock();
    const message = makeMessage({ groupId: "group-1", todoId: null, kind: "CHAT" });
    repo.createForGroup.mockResolvedValue(message);

    // Act: conteudo entra com espacos para validar trim.
    const useCase = new CreateGroupMessageUseCase(repo.repository);
    const result = await useCase.execute({
      groupId: "group-1",
      authorId: "user-1",
      content: "  hello group  ",
    });

    // Assert: use-case envia texto limpo para persistencia e retorna payload do repo.
    expect(repo.createForGroup).toHaveBeenCalledWith("group-1", "user-1", "hello group");
    expect(result).toEqual({ message });
  });

  it("deve falhar quando conteudo for vazio", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    const useCase = new CreateGroupMessageUseCase(repo.repository);

    // Assert: regra impede mensagem vazia antes de chamar repositorio.
    await expect(
      useCase.execute({
        groupId: "group-1",
        authorId: "user-1",
        content: "   ",
      }),
    ).rejects.toThrow("vazia");
  });
});

describe("CreateTodoMessageUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar comentario com kind padrao COMMENT", async () => {
    // Arrange: kind padrao esperado quando caller nao informa tipo.
    const repo = makeMessagesRepositoryMock();
    const message = makeMessage({ content: "new comment", kind: "COMMENT", todoId: 10 });
    repo.createForTodo.mockResolvedValue(message);

    // Act
    const useCase = new CreateTodoMessageUseCase(repo.repository);
    const result = await useCase.execute({
      todoId: 10,
      authorId: "user-1",
      content: "  new comment  ",
    });

    // Assert: trim aplicado e kind default COMMENT enviado ao repositorio.
    expect(repo.createForTodo).toHaveBeenCalledWith(10, "user-1", "new comment", "COMMENT");
    expect(result).toEqual({ message });
  });

  it("deve criar mensagem de chat quando kind for informado", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    const message = makeMessage({ content: "chat", kind: "CHAT", todoId: 10 });
    repo.createForTodo.mockResolvedValue(message);

    // Act: caller define kind CHAT explicitamente.
    const useCase = new CreateTodoMessageUseCase(repo.repository);
    await useCase.execute({
      todoId: 10,
      authorId: "user-1",
      content: "chat",
      kind: "CHAT",
    });

    // Assert: kind informado nao eh sobrescrito pelo default.
    expect(repo.createForTodo).toHaveBeenCalledWith(10, "user-1", "chat", "CHAT");
  });

  it("deve falhar quando comentario for vazio", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    const useCase = new CreateTodoMessageUseCase(repo.repository);

    // Assert: comentario vazio deve lançar erro de validacao.
    await expect(
      useCase.execute({
        todoId: 10,
        authorId: "user-1",
        content: "",
      }),
    ).rejects.toThrow("vazio");
  });
});

describe("DeleteTodoMessageUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve deletar comentario e retornar objeto vazio", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    repo.deleteMessage.mockResolvedValue();

    // Act
    const useCase = new DeleteTodoMessageUseCase(repo.repository);
    const result = await useCase.execute({
      commentId: "comment-1",
      authorId: "user-1",
    });

    // Assert: apenas delega delete e responde objeto vazio.
    expect(repo.deleteMessage).toHaveBeenCalledWith("comment-1", "user-1");
    expect(result).toEqual({});
  });
});

describe("ListGroupMessagesUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar mensagens de grupo", async () => {
    // Arrange: repositorio devolve duas mensagens para o groupId.
    const repo = makeMessagesRepositoryMock();
    repo.listByGroup.mockResolvedValue([
      makeMessage({ id: "m1", groupId: "group-1", todoId: null }),
      makeMessage({ id: "m2", groupId: "group-1", todoId: null }),
    ]);

    // Act
    const useCase = new ListGroupMessagesUseCase(repo.repository);
    const result = await useCase.execute("group-1");

    // Assert: consulta com id correto e retorno preservado.
    expect(repo.listByGroup).toHaveBeenCalledWith("group-1");
    expect(result.messages).toHaveLength(2);
  });
});

describe("ListTodoMessagesUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar comentarios por padrao", async () => {
    // Arrange: kind default deve ser COMMENT.
    const repo = makeMessagesRepositoryMock();
    repo.listByTodo.mockResolvedValue([makeMessage({ todoId: 9, kind: "COMMENT" })]);

    // Act
    const useCase = new ListTodoMessagesUseCase(repo.repository);
    const result = await useCase.execute(9);

    // Assert
    expect(repo.listByTodo).toHaveBeenCalledWith(9, "COMMENT");
    expect(result.messages).toHaveLength(1);
  });

  it("deve listar mensagens de chat quando kind for CHAT", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    repo.listByTodo.mockResolvedValue([makeMessage({ todoId: 9, kind: "CHAT" })]);

    // Act
    const useCase = new ListTodoMessagesUseCase(repo.repository);
    await useCase.execute(9, "CHAT");

    // Assert: kind propagado sem alteracoes.
    expect(repo.listByTodo).toHaveBeenCalledWith(9, "CHAT");
  });
});

describe("UpdateTodoMessageUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve atualizar comentario com conteudo limpo", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    const updatedMessage = makeMessage({ id: "comment-1", content: "updated" });
    repo.updateForTodo.mockResolvedValue(updatedMessage);

    // Act
    const useCase = new UpdateTodoMessageUseCase(repo.repository);
    const result = await useCase.execute({
      commentId: "comment-1",
      authorId: "user-1",
      content: "  updated  ",
    });

    // Assert: trim + delegacao correta para update de comentario.
    expect(repo.updateForTodo).toHaveBeenCalledWith("comment-1", "user-1", "updated");
    expect(result).toEqual({ message: updatedMessage });
  });

  it("deve falhar quando comentario estiver vazio", async () => {
    // Arrange
    const repo = makeMessagesRepositoryMock();
    const useCase = new UpdateTodoMessageUseCase(repo.repository);

    // Assert: sem conteudo valido, nao tenta atualizar no repositorio.
    await expect(
      useCase.execute({
        commentId: "comment-1",
        authorId: "user-1",
        content: "   ",
      }),
    ).rejects.toThrow("vazio");
  });
});
