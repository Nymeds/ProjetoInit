export class UpdateTodoUseCase {
    constructor(todosRepository) {
        this.todosRepository = todosRepository;
    }
    async execute({ todoId, userId, title }) {
        const todo = await this.todosRepository.findById(todoId);
        if (!todo) {
            throw new Error('Todo not found');
        }
        if (todo.userId !== userId) {
            throw new Error('Unauthorized: cannot update this todo');
        }
        const updatedTodo = await this.todosRepository.update(todoId, { title });
        return { todo: updatedTodo };
    }
}
