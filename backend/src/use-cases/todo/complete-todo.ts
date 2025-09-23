import type { TodosRepository } from '../../repositories/todo-repository.js';
import type { Todo } from '@prisma/client';

interface CompleteTodoUseCaseRequest {
  todoId: number;
  userId: string;
}

interface CompleteTodoUseCaseResponse {
  todo: Todo;
}

export class CompleteTodoUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ todoId, userId }: CompleteTodoUseCaseRequest): Promise<CompleteTodoUseCaseResponse> {
    const todo = await this.todosRepository.findById(todoId);

    if (!todo) {
      throw new Error('Tarefa não encontrada');
    }

    
    const isOwner = todo.userId === userId;
    const isGroupMember = todo.groupId
      ? await this.todosRepository.isUserInGroup(userId, todo.groupId)
      : false;

    if (!isOwner && !isGroupMember) {
      throw new Error('Não autorizado para completar essa tarefa');
    }

   
    const updatedTodo = await this.todosRepository.update(todoId, {
      completed: true,
      groupId: todo.groupId ?? undefined, 
    });

    return { todo: updatedTodo };
  }
}
