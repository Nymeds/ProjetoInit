import { InvalidCredentials } from '../../use-cases/errors/invalid-credentials.js';
import { compare } from 'bcryptjs';
export class AuthenticateUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ email, password, }) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            throw new InvalidCredentials();
        }
        const doestPasswordMatches = await compare(password, user.password);
        if (!doestPasswordMatches) {
            throw new InvalidCredentials();
        }
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}
