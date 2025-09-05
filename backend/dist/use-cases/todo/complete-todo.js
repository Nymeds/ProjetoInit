export class CompleteTodoUseCase {
    constructor(todosRepository) {
        this.todosRepository = todosRepository;
    }
    async execute({ todoId, userId }) {
        const todo = await this.todosRepository.findById(todoId);
        if (!todo) {
            throw new Error('Todo not found');
        }
        if (todo.userId !== userId) {
            throw new Error('Unauthorized: cannot complete this todo');
        }
        const updatedTodo = await this.todosRepository.update(todoId, { completed: true });
        return { todo: updatedTodo };
    }
}
