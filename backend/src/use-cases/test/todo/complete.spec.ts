
import { describe, it, expect, beforeEach } from 'vitest'
import { CompleteTodoUseCase } from '@/use-cases/todo/complete-todo.js'
import { CreateTodoUseCase } from '@/use-cases/todo/create-todo.js'
import { InMemoryTodosRepository } from '@/repositories/in-memory/memory-todo-repository.js'

describe('CompleteTodoUseCase', () => {
  let todosRepository: InMemoryTodosRepository

  beforeEach(() => {
    todosRepository = new InMemoryTodosRepository()
  })

  it('should mark a todo as completed', async () => {
    const createUseCase = new CreateTodoUseCase(todosRepository)
    const { todo } = await createUseCase.execute({ title: 'To Complete', userId: 'user1' })

    const completeUseCase = new CompleteTodoUseCase(todosRepository)
    const { todo: completed } = await completeUseCase.execute({ todoId: todo.id, userId: 'user1' })

    expect(completed.completed).toBe(true)
  })
})
