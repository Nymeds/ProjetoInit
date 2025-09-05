import type { TodosRepository } from '../../repositories/todo-repository.js'
import type { Todo } from '@prisma/client'

interface CreateTodoUseCaseRequest {
  title: string
  userId: string
  description?: string | undefined
  groupId?: string  | undefined
}

interface CreateTodoUseCaseResponse {
  todo: Todo
}

export class CreateTodoUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ title, userId,description, groupId }: CreateTodoUseCaseRequest): Promise<CreateTodoUseCaseResponse> {
    const todo = await this.todosRepository.create({ title, userId, description , groupId })
    return { todo }
  }
}
