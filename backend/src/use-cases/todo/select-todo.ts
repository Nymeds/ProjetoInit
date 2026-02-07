import type { TodosRepository, TodoWithImages } from '../../repositories/todo-repository.js'
interface SelectTodosUseCaseRequest {
  userId: string
}

interface SelectTodosUseCaseResponse {
   todos: TodoWithImages[]
}

export class SelectTodosUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ userId }: SelectTodosUseCaseRequest): Promise<SelectTodosUseCaseResponse> {
    
    const todos = await this.todosRepository.findAllVisibleForUser(userId)
    return { todos }
  }
}
