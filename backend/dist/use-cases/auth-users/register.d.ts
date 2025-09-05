import type { UsersRepository } from '../../repositories/users-repository.js';
interface RegisterUseCaseRequest {
    name: string;
    email: string;
    password: string;
}
interface RegisterUseCaseResponse {
    user: ReturnType<UsersRepository['create']> extends Promise<infer U> ? U : never;
}
export declare class RegisterUseCase {
    private usersRepository;
    constructor(usersRepository: UsersRepository);
    execute({ name, email, password, }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse>;
}
export {};
