import type { TodosRepository } from '@/repositories/todo-repository.js'
import type { Todo } from '@prisma/client'

interface SelectTodosUseCaseRequest {
  userId: string
}

interface SelectTodosUseCaseResponse {
  todos: Todo[]
}

export class SelectTodosUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ userId }: SelectTodosUseCaseRequest): Promise<SelectTodosUseCaseResponse> {
    const todos = await this.todosRepository.findManyByUser(userId)
    return { todos }
  }
}
