import type { TodosRepository } from '../../repositories/todo-repository.js';
import type { Todo } from '@prisma/client';
interface UpdateTodoUseCaseRequest {
    todoId: number;
    userId: string;
    title: string;
}
interface UpdateTodoUseCaseResponse {
    todo: Todo;
}
export declare class UpdateTodoUseCase {
    private todosRepository;
    constructor(todosRepository: TodosRepository);
    execute({ todoId, userId, title }: UpdateTodoUseCaseRequest): Promise<UpdateTodoUseCaseResponse>;
}
export {};
