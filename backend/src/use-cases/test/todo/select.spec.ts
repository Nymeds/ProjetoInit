
import { describe, it, expect, beforeEach } from 'vitest'
import { SelectTodosUseCase } from '@/use-cases/todo/select-todo.js'
import { CreateTodoUseCase } from '@/use-cases/todo/create.js'
import { InMemoryTodosRepository } from '@/repositories/in-memory/memory-todo-repository.js'

describe('SelectTodosUseCase', () => {
  let todosRepository: InMemoryTodosRepository

  beforeEach(() => {
    todosRepository = new InMemoryTodosRepository()
  })

  it('should return all todos for a specific user', async () => {
    const createUseCase = new CreateTodoUseCase(todosRepository)
    await createUseCase.execute({ title: 'Todo 1', userId: 'user1' })
    await createUseCase.execute({ title: 'Todo 2', userId: 'user2' })
    await createUseCase.execute({ title: 'Todo 3', userId: 'user1' })

    const selectUseCase = new SelectTodosUseCase(todosRepository)
    const { todos } = await selectUseCase.execute({ userId: 'user1' })

    expect(todos).toHaveLength(2)
    expect(todos.every((t) => t.userId === 'user1')).toBe(true)
  })
})
