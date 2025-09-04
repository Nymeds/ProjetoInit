import type { Todo } from '@prisma/client'

export interface TodosRepository {
  findAllVisibleForUser(userId: string): Promise<Todo[]>
 
  create(data: { 
    title: string
    userId: string
     description?: string | undefined 
    groupId?: string | undefined 
  }): Promise<Todo>
  findById(id: number): Promise<Todo | null>
  findManyByUser(userId: string, groupId?: string): Promise<Todo[]>
  update(
    id: number, 
    data: { title?: string; completed?: boolean; description?: string; groupId?: string } 
  ): Promise<Todo>
  delete(id: number): Promise<void>
  
}
