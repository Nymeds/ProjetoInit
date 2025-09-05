export class SelectTodosUseCase {
    constructor(todosRepository) {
        this.todosRepository = todosRepository;
    }
    async execute({ userId }) {
        const todos = await this.todosRepository.findAllVisibleForUser(userId);
        return { todos };
    }
}
