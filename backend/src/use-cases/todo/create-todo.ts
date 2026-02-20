import type { Todo } from "@prisma/client";
import type { GroupsRepository } from "../../repositories/groups-repository.js";
import type { TodosRepository } from "../../repositories/todo-repository.js";

interface CreateTodoUseCaseRequest {
  title: string;
  userId: string;
  description?: string | undefined;
  groupId?: string | undefined;
}

interface CreateTodoUseCaseResponse {
  todo: Todo;
}

export class CreateTodoUseCase {
  constructor(
    private todosRepository: TodosRepository,
    private groupsRepository?: GroupsRepository,
  ) {}

  async execute({ title, userId, description, groupId }: CreateTodoUseCaseRequest): Promise<CreateTodoUseCaseResponse> {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) {
      throw new Error("Titulo da tarefa e obrigatorio");
    }

    if (groupId) {
      const isGroupMember = await this.todosRepository.isUserInGroup(userId, groupId);
      if (!isGroupMember) {
        throw new Error("Nao autorizado para criar tarefa nesse grupo");
      }
    }

    const todo = await this.todosRepository.create({
      title: cleanedTitle,
      userId,
      description,
      groupId,
    });

    if (groupId && this.groupsRepository?.recordTaskHistory) {
      const workflow = this.groupsRepository.getWorkflowContext
        ? await this.groupsRepository.getWorkflowContext(groupId)
        : null;

      await this.groupsRepository.recordTaskHistory({
        action: "TASK_CREATED",
        actorId: userId,
        todoId: todo.id,
        taskTitleSnapshot: todo.title,
        groupId,
        fromGroupId: groupId,
        toGroupId: groupId,
        scopeParentGroupId: workflow?.parentGroupId ?? null,
      });
    }

    return { todo };
  }
}

