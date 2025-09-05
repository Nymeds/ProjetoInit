import type { TodosRepository } from '../../repositories/todo-repository.js';
import type { Todo } from '@prisma/client';
interface CreateTodoUseCaseRequest {
    title: string;
    userId: string;
    description?: string | undefined;
    groupId?: string | undefined;
}
interface CreateTodoUseCaseResponse {
    todo: Todo;
}
export declare class CreateTodoUseCase {
    private todosRepository;
    constructor(todosRepository: TodosRepository);
    execute({ title, userId, description, groupId }: CreateTodoUseCaseRequest): Promise<CreateTodoUseCaseResponse>;
}
export {};
