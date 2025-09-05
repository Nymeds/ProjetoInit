import type { TodosRepository } from '../../repositories/todo-repository.js';
import type { Todo } from '@prisma/client';
interface CompleteTodoUseCaseRequest {
    todoId: number;
    userId: string;
}
interface CompleteTodoUseCaseResponse {
    todo: Todo;
}
export declare class CompleteTodoUseCase {
    private todosRepository;
    constructor(todosRepository: TodosRepository);
    execute({ todoId, userId }: CompleteTodoUseCaseRequest): Promise<CompleteTodoUseCaseResponse>;
}
export {};
