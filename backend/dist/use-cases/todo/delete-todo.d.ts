import type { TodosRepository } from '../../repositories/todo-repository.js';
interface DeleteTodoUseCaseRequest {
    todoId: number;
    userId: string;
}
export declare class DeleteTodoUseCase {
    private todosRepository;
    constructor(todosRepository: TodosRepository);
    execute({ todoId, userId }: DeleteTodoUseCaseRequest): Promise<void>;
}
export {};
