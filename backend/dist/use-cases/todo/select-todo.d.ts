import type { TodosRepository } from '../../repositories/todo-repository.js';
import type { Todo } from '@prisma/client';
interface SelectTodosUseCaseRequest {
    userId: string;
}
interface SelectTodosUseCaseResponse {
    todos: Todo[];
}
export declare class SelectTodosUseCase {
    private todosRepository;
    constructor(todosRepository: TodosRepository);
    execute({ userId }: SelectTodosUseCaseRequest): Promise<SelectTodosUseCaseResponse>;
}
export {};
