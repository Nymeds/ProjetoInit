import type { TodosRepository } from '../../repositories/todo-repository.js'
import type { Todo } from '@prisma/client'

interface CompleteTodoUseCaseRequest {
  todoId: number
  userId: string
}

interface CompleteTodoUseCaseResponse {
  todo: Todo
}

export class CompleteTodoUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ todoId, userId }: CompleteTodoUseCaseRequest): Promise<CompleteTodoUseCaseResponse> {
    const todo = await this.todosRepository.findById(todoId)

    if (!todo) {
      throw new Error('Tarefa nao encontrada')
    }

    if (todo.userId !== userId) {
      throw new Error('Não autorizado para completar essa tarefa')
    }

    const updatedTodo = await this.todosRepository.update(todoId, { completed: true })

    return { todo: updatedTodo }
  }
}
