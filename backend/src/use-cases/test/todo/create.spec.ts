import { describe, it, expect, beforeEach } from 'vitest'
import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { InMemoryTodosRepository } from '@/repositories/in-memory/memory-todo-repository.js'
import { DeleteTodoUseCase } from '@/use-cases/todo/delete-todo.js'


describe('DeleteTodoUseCase', () => {
  let todosRepository: InMemoryTodosRepository

  beforeEach(() => {
    todosRepository = new InMemoryTodosRepository()
  })

  it('should delete a todo', async () => {
    const createUseCase = new CreateTodoUseCase(todosRepository)
    const { todo } = await createUseCase.execute({ title: 'To Delete', userId: 'user1' })

    const deleteUseCase = new DeleteTodoUseCase(todosRepository)
    await deleteUseCase.execute({ todoId: todo.id, userId: 'user1' })

    const found = await todosRepository.findById(todo.id)
    expect(found).toBeNull()
  })
})
