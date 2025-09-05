import type { UsersRepository } from '../../repositories/users-repository.js';
interface AuthenticateUseCaseRequest {
    email: string;
    password: string;
}
interface AuthenticateUseCaseResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: "ADMIN" | "MEMBER";
    };
}
export declare class AuthenticateUseCase {
    private usersRepository;
    constructor(usersRepository: UsersRepository);
    execute({ email, password, }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse>;
}
export {};
