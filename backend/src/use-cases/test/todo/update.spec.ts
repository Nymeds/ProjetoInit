
import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateTodoUseCase } from '@/use-cases/todo/update-todo.js'
import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { InMemoryTodosRepository } from '@/repositories/in-memory/memory-todo-repository.js'

describe('UpdateTodoUseCase', () => {
  let todosRepository: InMemoryTodosRepository

  beforeEach(() => {
    todosRepository = new InMemoryTodosRepository()
  })

  it('should update the title of a todo', async () => {
    const createUseCase = new CreateTodoUseCase(todosRepository)
    const { todo } = await createUseCase.execute({ title: 'Old Title', userId: 'user1' })

    const updateUseCase = new UpdateTodoUseCase(todosRepository)
    const { todo: updated } = await updateUseCase.execute({
      todoId: todo.id,
      userId: 'user1',
      title: 'New Title',
    })

    expect(updated.title).toBe('New Title')
  })
})
