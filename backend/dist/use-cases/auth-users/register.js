import { hash } from 'bcryptjs';
export class RegisterUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ name, email, password, }) {
        const password_hash = await hash(password, 6);
        const userWithSameEmail = await this.usersRepository.findByEmail(email);
        if (userWithSameEmail) {
            throw new Error('UserAlreadyExistsError');
        }
        const user = await this.usersRepository.create({
            name,
            email,
            password: password_hash,
        });
        return { user };
    }
}
