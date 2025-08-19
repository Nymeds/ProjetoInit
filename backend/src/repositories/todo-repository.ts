import type { Task } from '../../generated/prisma.'

export interface TasksRepository {
  create(data: { title: string; description?: string; userId: string }): Promise<Task>
  findById(id: string): Promise<Task | null>
  findManyByUser(userId: string): Promise<Task[]>
  update(id: string, data: { title?: string; description?: string; completed?: boolean }): Promise<Task>
  delete(id: string): Promise<void>
}
