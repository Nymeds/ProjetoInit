import { PrismaTodosRepository } from '../../repositories/prisma/prisma-todo-repository.js';
import { DeleteTodoUseCase } from '../../use-cases/todo/delete-todo.js';
export async function deleteTodo(request, reply) {
    try {
        const userId = request.user.sub;
        const todoId = Number(request.params.id);
        const todosRepository = new PrismaTodosRepository();
        const deleteTodoUseCase = new DeleteTodoUseCase(todosRepository);
        await deleteTodoUseCase.execute({ todoId, userId });
        return reply.status(200).send({ message: 'Todo deleted successfully' });
    }
    catch (err) {
        return reply.status(400).send({ message: err.message || 'Error deleting todo' });
    }
}
