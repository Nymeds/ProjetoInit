import type { TodosRepository } from '@/repositories/todo-repository.js'
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
      throw new Error('Todo not found')
    }


    if (todo.userId !== userId) {
      throw new Error('Unauthorized: cannot update this todo')
    }

    const updatedTodo = await this.todosRepository.update(todoId, { title })

    return { todo: updatedTodo }
  }
}
