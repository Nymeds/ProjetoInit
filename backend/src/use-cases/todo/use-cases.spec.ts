import type { Todo } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TodosRepository } from "../../repositories/todo-repository.js";
import { CompleteTodoUseCase } from "./complete-todo.js";
import { CreateTodoUseCase } from "./create-todo.js";
import { DeleteTodoUseCase } from "./delete-todo.js";
import { SelectTodosUseCase } from "./select-todo.js";
import { UpdateTodoUseCase } from "./update-todo.js";

// Factory de Todo padrao para evitar repeticao e deixar claro o estado inicial.
function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 1,
    title: "Test Todo",
    description: null,
    completed: false,
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    userId: "user-1",
    groupId: null,
    ...overrides,
  };
}

// Mock tipado do contrato de repositorio usado pelos use-cases de tarefa.
// Cada metodo eh exposto para facilitar assert por chamada.
function makeTodosRepositoryMock() {
  const findAllVisibleForUser = vi.fn<TodosRepository["findAllVisibleForUser"]>();
  const create = vi.fn<TodosRepository["create"]>();
  const findById = vi.fn<TodosRepository["findById"]>();
  const findManyByUser = vi.fn<TodosRepository["findManyByUser"]>();
  const update = vi.fn<TodosRepository["update"]>();
  const deleteTodo = vi.fn<TodosRepository["delete"]>();
  const isUserInGroup = vi.fn<TodosRepository["isUserInGroup"]>();

  const repository: TodosRepository = {
    findAllVisibleForUser,
    create,
    findById,
    findManyByUser,
    update,
    delete: deleteTodo,
    isUserInGroup,
  };

  return {
    repository,
    findAllVisibleForUser,
    create,
    findById,
    findManyByUser,
    update,
    deleteTodo,
    isUserInGroup,
  };
}

describe("CreateTodoUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar tarefa", async () => {
    // Arrange: definimos o retorno do repositorio para simular criacao bem sucedida.
    const repo = makeTodosRepositoryMock();
    const todo = makeTodo({
      id: 10,
      title: "Create task",
      userId: "user-1",
      description: "Desc",
      groupId: "group-1",
    });

    repo.create.mockResolvedValue(todo);

    // Act: executamos o caso de uso com o payload que o controller enviaria.
    const useCase = new CreateTodoUseCase(repo.repository);
    const result = await useCase.execute({
      title: "Create task",
      userId: "user-1",
      description: "Desc",
      groupId: "group-1",
    });

    // Assert: validamos o payload enviado para persistencia e o retorno final.
    expect(repo.create).toHaveBeenCalledWith({
      title: "Create task",
      userId: "user-1",
      description: "Desc",
      groupId: "group-1",
    });
    expect(result).toEqual({ todo });
  });
});

describe("DeleteTodoUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve deletar tarefa do proprio usuario", async () => {
    // Arrange: tarefa existe e pertence ao mesmo usuario que solicitou a exclusao.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 20, userId: "owner-1" }));
    repo.deleteTodo.mockResolvedValue();

    // Act
    const useCase = new DeleteTodoUseCase(repo.repository);
    await useCase.execute({
      todoId: 20,
      userId: "owner-1",
    });

    // Assert: primeiro consulta a tarefa, depois executa delete com o id.
    expect(repo.findById).toHaveBeenCalledWith(20);
    expect(repo.deleteTodo).toHaveBeenCalledWith(20);
  });

  it("deve falhar quando tarefa nao existe", async () => {
    // Arrange: repositorio informa que o id nao existe.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(null);

    const useCase = new DeleteTodoUseCase(repo.repository);

    // Assert: o caso de uso deve interromper com erro de nao encontrado.
    await expect(
      useCase.execute({
        todoId: 20,
        userId: "owner-1",
      }),
    ).rejects.toThrow(/n.o encontrada/i);
  });

  it("deve falhar quando usuario nao e dono", async () => {
    // Arrange: a tarefa existe, mas pertence a outro usuario.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 20, userId: "owner-1" }));

    const useCase = new DeleteTodoUseCase(repo.repository);

    // Assert: nao deve deletar quando o solicitante nao eh o owner.
    await expect(
      useCase.execute({
        todoId: 20,
        userId: "other-user",
      }),
    ).rejects.toThrow("autorizado");
    expect(repo.deleteTodo).not.toHaveBeenCalled();
  });
});

describe("SelectTodosUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar tarefas visiveis por usuario", async () => {
    // Arrange: simulamos duas tarefas visiveis para o usuario.
    const repo = makeTodosRepositoryMock();
    repo.findAllVisibleForUser.mockResolvedValue([
      makeTodo({ id: 1 }),
      makeTodo({ id: 2 }),
    ]);

    // Act
    const useCase = new SelectTodosUseCase(repo.repository);
    const result = await useCase.execute({ userId: "user-1" });

    // Assert: use-case delega a busca para o metodo de visibilidade.
    expect(repo.findAllVisibleForUser).toHaveBeenCalledWith("user-1");
    expect(result.todos).toHaveLength(2);
  });
});

describe("UpdateTodoUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve atualizar tarefa quando usuario e dono", async () => {
    // Arrange: tarefa existe e pertence ao usuario solicitante.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 33, userId: "owner-1", groupId: null }));
    repo.update.mockResolvedValue(makeTodo({ id: 33, userId: "owner-1", title: "Updated" }));

    // Act
    const useCase = new UpdateTodoUseCase(repo.repository);
    const result = await useCase.execute({
      todoId: 33,
      userId: "owner-1",
      title: "Updated",
      groupId: null,
    });

    // Assert: persistencia recebe apenas os campos de update esperados.
    expect(repo.update).toHaveBeenCalledWith(33, {
      title: "Updated",
      groupId: null,
    });
    expect(result.todo.title).toBe("Updated");
  });

  it("deve falhar quando tarefa nao existir", async () => {
    // Arrange: id inexistente.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(null);

    const useCase = new UpdateTodoUseCase(repo.repository);

    // Assert: sem tarefa nao ha update.
    await expect(
      useCase.execute({
        todoId: 33,
        userId: "owner-1",
      }),
    ).rejects.toThrow("nao encontrada");
  });

  it("deve falhar quando usuario nao pertence ao grupo destino", async () => {
    // Arrange: tarefa existe, mas o usuario nao eh membro do grupo de destino.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 33, userId: "owner-1", groupId: null }));
    repo.isUserInGroup.mockResolvedValue(false);

    // Act + Assert: deve barrar a mudanca de grupo antes de atualizar.
    const useCase = new UpdateTodoUseCase(repo.repository);

    await expect(
      useCase.execute({
        todoId: 33,
        userId: "owner-1",
        groupId: "group-9",
      }),
    ).rejects.toThrow("autorizado para mover");

    expect(repo.isUserInGroup).toHaveBeenCalledWith("owner-1", "group-9");
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("deve falhar quando usuario nao for dono", async () => {
    // Arrange: validacao de ownership falha.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 33, userId: "owner-1" }));

    const useCase = new UpdateTodoUseCase(repo.repository);

    // Assert: mesmo sem mudanca de grupo, owner eh obrigatorio para atualizar.
    await expect(
      useCase.execute({
        todoId: 33,
        userId: "other-user",
      }),
    ).rejects.toThrow("autorizado para atualizar");
  });
});

describe("CompleteTodoUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve completar tarefa quando usuario for dono", async () => {
    // Arrange: owner pode completar direto, mesmo sem grupo.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 44, userId: "owner-1", groupId: null }));
    repo.update.mockResolvedValue(makeTodo({ id: 44, userId: "owner-1", completed: true }));

    // Act
    const useCase = new CompleteTodoUseCase(repo.repository);
    const result = await useCase.execute({
      todoId: 44,
      userId: "owner-1",
    });

    // Assert: completa=true e groupId preservado como undefined quando nao ha grupo.
    expect(repo.update).toHaveBeenCalledWith(44, {
      completed: true,
      groupId: undefined,
    });
    expect(result.todo.completed).toBe(true);
  });

  it("deve completar tarefa quando usuario for membro do grupo", async () => {
    // Arrange: usuario nao eh dono, mas eh membro do grupo vinculado a tarefa.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 55, userId: "owner-1", groupId: "group-1" }));
    repo.isUserInGroup.mockResolvedValue(true);
    repo.update.mockResolvedValue(
      makeTodo({
        id: 55,
        userId: "owner-1",
        groupId: "group-1",
        completed: true,
      }),
    );

    // Act
    const useCase = new CompleteTodoUseCase(repo.repository);
    const result = await useCase.execute({
      todoId: 55,
      userId: "member-2",
    });

    // Assert: autorizacao por membership e update de conclusao.
    expect(repo.isUserInGroup).toHaveBeenCalledWith("member-2", "group-1");
    expect(repo.update).toHaveBeenCalledWith(55, {
      completed: true,
      groupId: "group-1",
    });
    expect(result.todo.completed).toBe(true);
  });

  it("deve falhar quando tarefa nao existir", async () => {
    // Arrange: id inexistente.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(null);

    const useCase = new CompleteTodoUseCase(repo.repository);

    // Assert: regra de negocio retorna erro antes de qualquer update.
    await expect(
      useCase.execute({
        todoId: 44,
        userId: "owner-1",
      }),
    ).rejects.toThrow(/n.o encontrada/i);
  });

  it("deve falhar quando usuario nao for dono nem membro", async () => {
    // Arrange: existe tarefa em grupo, mas usuario nao tem vinculo com ela.
    const repo = makeTodosRepositoryMock();
    repo.findById.mockResolvedValue(makeTodo({ id: 55, userId: "owner-1", groupId: "group-1" }));
    repo.isUserInGroup.mockResolvedValue(false);

    // Assert: sem owner e sem membership, nao pode completar.
    const useCase = new CompleteTodoUseCase(repo.repository);

    await expect(
      useCase.execute({
        todoId: 55,
        userId: "outsider",
      }),
    ).rejects.toThrow("autorizado para completar");
    expect(repo.update).not.toHaveBeenCalled();
  });
});
