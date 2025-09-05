export class DeleteGroupUseCase {
    constructor(groupsRepository) {
        this.groupsRepository = groupsRepository;
    }
    async execute({ id }) {
        if (!id.trim()) {
            throw new Error("ID do grupo é obrigatório");
        }
        const existingGroup = await this.groupsRepository.findById(id);
        if (!existingGroup) {
            throw new Error("Grupo não encontrado");
        }
        return this.groupsRepository.delete({ id });
    }
}
