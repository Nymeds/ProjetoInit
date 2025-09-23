import type { TodosRepository } from '../../repositories/todo-repository.js'
import type { Todo } from '@prisma/client'

interface UpdateTodoUseCaseRequest {
  todoId: number
  userId: string
  title: string
}

interface UpdateTodoUseCaseResponse {
  todo: Todo
}

export class UpdateTodoUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ todoId, userId, title }: UpdateTodoUseCaseRequest): Promise<UpdateTodoUseCaseResponse> {
    
    const todo = await this.todosRepository.findById(todoId)

    if (!todo) {
      throw new Error('Tarefa nao encontrada')
    }


    if (todo.userId !== userId) {
      throw new Error('Não autorizado para atualizar essa tarefa')
    }

    const updatedTodo = await this.todosRepository.update(todoId, { title })

    return { todo: updatedTodo }
  }
}
