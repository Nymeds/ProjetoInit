import type { Image, Todo } from '@prisma/client';

export type TodoWithImagesAndGroup = Todo & {
  images: Image[];
  group: { id: string; name: string } | null;
};

export interface TodosRepository {
  findAllVisibleForUser(userId: string): Promise<TodoWithImagesAndGroup[]>;

  create(data: { 
    title: string;
    userId: string;
    description?: string;
    images?: string;
    groupId?: string;
  }): Promise<Todo>;

  findById(id: number): Promise<Todo | null>;
  findManyByUser(userId: string, groupId?: string): Promise<Todo[]>;

  update(
    id: number, 
    data: { title?: string; completed?: boolean; description?: string; groupId?: string | null } 
  ): Promise<Todo>;

  delete(id: number): Promise<void>;


  isUserInGroup(userId: string, groupId: string): Promise<boolean>;
}
