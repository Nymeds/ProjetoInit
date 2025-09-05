import type { Todo } from '@prisma/client';
import type { TodosRepository } from '../todo-repository.js';
export declare class PrismaTodosRepository implements TodosRepository {
    create(data: {
        title: string;
        userId: string;
        description?: string;
        groupId?: string;
    }): Promise<Todo>;
    findById(id: number): Promise<Todo | null>;
    findManyByUser(userId: string, groupId?: string): Promise<Todo[]>;
    update(id: number, data: {
        title?: string;
        completed?: boolean;
        groupId?: string;
    }): Promise<Todo>;
    delete(id: number): Promise<void>;
    findAllVisibleForUser(userId: string): Promise<Todo[]>;
}
