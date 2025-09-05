export class DeleteUserUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ targetUserId }) {
        const user = await this.usersRepository.findById(targetUserId);
        if (!user) {
            throw new Error('User not found');
        }
        await this.usersRepository.apagar(targetUserId);
    }
}
