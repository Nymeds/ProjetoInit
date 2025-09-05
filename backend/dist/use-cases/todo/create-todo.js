export class CreateTodoUseCase {
    constructor(todosRepository) {
        this.todosRepository = todosRepository;
    }
    async execute({ title, userId, description, groupId }) {
        const todo = await this.todosRepository.create({ title, userId, description, groupId });
        return { todo };
    }
}
