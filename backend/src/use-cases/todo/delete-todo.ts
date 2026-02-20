import type { GroupsRepository } from "../../repositories/groups-repository.js";
import type { TodosRepository } from "../../repositories/todo-repository.js";

interface DeleteTodoUseCaseRequest {
  todoId: number;
  userId: string;
}

export class DeleteTodoUseCase {
  constructor(
    private todosRepository: TodosRepository,
    private groupsRepository?: GroupsRepository,
  ) {}

  async execute({ todoId, userId }: DeleteTodoUseCaseRequest): Promise<void> {
    const todo = await this.todosRepository.findById(todoId);

    if (!todo) {
      throw new Error("Tarefa nao encontrada");
    }

    if (todo.userId === userId) {
      await this.todosRepository.delete(todoId);
      return;
    }

    if (todo.groupId && this.groupsRepository?.userHasPermission) {
      const canRemove = await this.groupsRepository.userHasPermission(todo.groupId, userId, "REMOVE_TASK");
      if (canRemove) {
        await this.todosRepository.delete(todoId);
        return;
      }
    }

    throw new Error("Nao autorizado para deletar essa tarefa");
  }
}

