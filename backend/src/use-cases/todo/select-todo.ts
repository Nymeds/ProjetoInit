import type { TodosRepository } from '../../repositories/todo-repository.js'
import type { TodoWithImagesAndGroup } from '../../repositories/todo-repository.js'

interface SelectTodosUseCaseRequest {
  userId: string
}

interface SelectTodosUseCaseResponse {
  todos: TodoWithImagesAndGroup[]
}

export class SelectTodosUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ userId }: SelectTodosUseCaseRequest): Promise<SelectTodosUseCaseResponse> {
    
    const todos = await this.todosRepository.findAllVisibleForUser(userId)
    return { todos }
  }
}
