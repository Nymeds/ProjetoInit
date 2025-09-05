export class DeleteTodoUseCase {
    constructor(todosRepository) {
        this.todosRepository = todosRepository;
    }
    async execute({ todoId, userId }) {
        const todo = await this.todosRepository.findById(todoId);
        if (!todo) {
            throw new Error('Todo not found');
        }
        if (todo.userId !== userId) {
            throw new Error('Unauthorized: cannot delete this todo');
        }
        await this.todosRepository.delete(todoId);
    }
}
