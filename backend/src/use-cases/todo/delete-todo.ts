import type { TodosRepository } from '../../repositories/todo-repository.js'

interface DeleteTodoUseCaseRequest {
  todoId: number
  userId: string
}

export class DeleteTodoUseCase {
  constructor(private todosRepository: TodosRepository) {}

  async execute({ todoId, userId }: DeleteTodoUseCaseRequest): Promise<void> {
    
    const todo = await this.todosRepository.findById(todoId)

    if (!todo) {
      throw new Error('Tarefa nao encontrada')
    }

    if (todo.userId !== userId) {
      throw new Error('Não autorizado para deletar essa tarefa')
    }

    await this.todosRepository.delete(todoId)
  }
}
