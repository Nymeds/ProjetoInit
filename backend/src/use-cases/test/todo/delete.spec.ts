import { describe, it, expect, beforeEach } from 'vitest'
import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { InMemoryTodosRepository } from '@/repositories/in-memory/memory-todo-repository.js'

describe('CreateTodoUseCase', () => {
  let todosRepository: InMemoryTodosRepository

  beforeEach(() => {
    todosRepository = new InMemoryTodosRepository()
  })

  it('should create a new todo', async () => {
    const createUseCase = new CreateTodoUseCase(todosRepository)
    const { todo } = await createUseCase.execute({ title: 'Test Todo', userId: 'user1' })

    expect(todo).toHaveProperty('id')
    expect(todo.title).toBe('Test Todo')
    expect(todo.completed).toBe(false)
  })
})