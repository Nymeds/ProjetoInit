import type { Todo } from "@prisma/client";
import type { GroupPermission, GroupsRepository } from "../../repositories/groups-repository.js";
import type { TodosRepository } from "../../repositories/todo-repository.js";

interface UpdateTodoUseCaseRequest {
  todoId: number;
  userId: string;
  title?: string;
  groupId?: string | null;
}

interface UpdateTodoUseCaseResponse {
  todo: Todo;
}

export class UpdateTodoUseCase {
  constructor(
    private todosRepository: TodosRepository,
    private groupsRepository?: GroupsRepository,
  ) {}

  private async hasGroupPermission(groupId: string, userId: string, permission: GroupPermission) {
    if (!this.groupsRepository?.userHasPermission) {
      return this.todosRepository.isUserInGroup(userId, groupId);
    }
    return this.groupsRepository.userHasPermission(groupId, userId, permission);
  }

  async execute({ todoId, userId, title, groupId }: UpdateTodoUseCaseRequest): Promise<UpdateTodoUseCaseResponse> {
    const todo = await this.todosRepository.findById(todoId);
    if (!todo) {
      throw new Error("Tarefa nao encontrada");
    }

    const currentGroupId = todo.groupId ?? null;
    const targetGroupId = groupId === undefined ? currentGroupId : groupId;
    const isGroupMove = groupId !== undefined && targetGroupId !== currentGroupId;

    const nextTitle = title?.trim() || todo.title;
    if (!nextTitle) {
      throw new Error("Titulo da tarefa e obrigatorio");
    }

    if (todo.userId !== userId && nextTitle !== todo.title) {
      throw new Error("Nao autorizado para editar o titulo dessa tarefa");
    }

    if (targetGroupId) {
      const isDestinationMember = await this.todosRepository.isUserInGroup(userId, targetGroupId);
      if (!isDestinationMember) {
        throw new Error("Nao autorizado para mover essa tarefa para esse grupo");
      }
    }

    let scopeWorkflow = currentGroupId && this.groupsRepository?.getWorkflowContext
      ? await this.groupsRepository.getWorkflowContext(currentGroupId)
      : null;
    let movedOutsideParentName: string | null = null;

    if (isGroupMove) {
      if (currentGroupId) {
        const canMove = await this.hasGroupPermission(currentGroupId, userId, "MOVE_TASK");
        if (!canMove) {
          throw new Error("Nao autorizado para mover essa tarefa");
        }
      } else if (todo.userId !== userId) {
        throw new Error("Nao autorizado para mover essa tarefa");
      }

      if (targetGroupId === null && currentGroupId) {
        const canMoveToNoGroup = await this.hasGroupPermission(currentGroupId, userId, "MOVE_TASK_TO_NO_GROUP");
        if (!canMoveToNoGroup) {
          throw new Error("Apenas admins podem mover tarefas para sem grupo");
        }
      }

      if (currentGroupId && targetGroupId && scopeWorkflow?.parentGroupId && scopeWorkflow.relatedGroupIds.length > 0) {
        const destinationWithinParent = scopeWorkflow.relatedGroupIds.includes(targetGroupId);
        if (!destinationWithinParent) {
          const canBypassWorkflow = await this.hasGroupPermission(currentGroupId, userId, "MANAGE_WORKFLOW");
          if (!canBypassWorkflow) {
            throw new Error("Tarefas desse fluxo so podem ser movidas entre subgrupos do mesmo grupo pai");
          }

          movedOutsideParentName = scopeWorkflow.parentGroupName || null;
        }
      }
    } else {
      scopeWorkflow = targetGroupId && this.groupsRepository?.getWorkflowContext
        ? await this.groupsRepository.getWorkflowContext(targetGroupId)
        : scopeWorkflow;
    }

    if (todo.userId !== userId && !currentGroupId) {
      throw new Error("Nao autorizado para atualizar essa tarefa");
    }

    const updatedTodo = await this.todosRepository.update(todoId, {
      title: nextTitle,
      groupId: groupId === undefined ? undefined : targetGroupId,
    });

    if (isGroupMove && this.groupsRepository?.recordTaskHistory) {
      const historyGroupId = currentGroupId ?? targetGroupId;
      if (historyGroupId) {
        const destinationWorkflow = targetGroupId && this.groupsRepository?.getWorkflowContext
          ? await this.groupsRepository.getWorkflowContext(targetGroupId)
          : null;

        await this.groupsRepository.recordTaskHistory({
          action: "TASK_MOVED",
          actorId: userId,
          todoId: updatedTodo.id,
          taskTitleSnapshot: updatedTodo.title,
          groupId: historyGroupId,
          fromGroupId: currentGroupId,
          toGroupId: targetGroupId,
          scopeParentGroupId: scopeWorkflow?.parentGroupId ?? destinationWorkflow?.parentGroupId ?? null,
          movedOutsideParentName,
        });
      }
    }

    return { todo: updatedTodo };
  }
}
