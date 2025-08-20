import type { TodosRepository } from '@/repositories/todo-repository.js'
import type { Todo } from '@prisma/client'

interface InMemoryTodo extends Todo {}

export class InMemoryTodosRepository implements TodosRepository {
  public todos: InMemoryTodo[] = []

  async findById(id: number): Promise<Todo | null> {
    return this.todos.find((t) => t.id === id) ?? null
  }

  async findManyByUser(userId: string): Promise<Todo[]> {
    return this.todos.filter((t) => t.userId === userId)
  }

  async create(data: { title: string; userId: string }): Promise<Todo> {
    const todo: Todo = {
      id: Math.floor(Math.random() * 1000000),
      title: data.title,
      completed: false,
      userId: data.userId,
      createdAt: new Date(),
    }
    this.todos.push(todo)
    return todo
  }

  async update(todoId: number, data: { title?: string; completed?: boolean }): Promise<Todo> {
    const index = this.todos.findIndex((t) => t.id === todoId)
    if (index === -1) throw new Error('Todo not found')

    const oldTodo = this.todos[index]!
    const updated: Todo = {
      ...oldTodo,
      title: data.title ?? oldTodo.title,
      completed: data.completed ?? oldTodo.completed,
      createdAt: oldTodo.createdAt,
      userId: oldTodo.userId,
      id: oldTodo.id,
    }

    this.todos[index] = updated
    return updated
  }

  async delete(id: number): Promise<void> {
    const index = this.todos.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error('Todo not found')
    }
    this.todos.splice(index, 1)
  }
}
