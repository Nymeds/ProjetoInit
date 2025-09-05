export class CreateGroupUseCase {
    constructor(groupsRepository, usersRepository) {
        this.groupsRepository = groupsRepository;
        this.usersRepository = usersRepository;
    }
    async execute({ name, description, userEmails }) {
        if (!name.trim()) {
            throw new Error("Nome do grupo é obrigatório");
        }
        const users = await Promise.all(userEmails.map(async (email) => {
            const user = await this.usersRepository.findByEmail(email);
            if (!user)
                throw new Error(`Usuário com email ${email} não encontrado`);
            return user;
        }));
        try {
            const group = await this.groupsRepository.create({
                name,
                description: description ?? "",
                userEmails,
            });
            return group;
        }
        catch (err) {
            if (err.code === "P2002" && err.meta?.target?.includes("name")) {
                throw new Error("Já existe um grupo com esse nome");
            }
            throw err;
        }
    }
}
