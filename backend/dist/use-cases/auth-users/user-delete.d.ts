import type { UsersRepository } from '../../repositories/users-repository.js';
interface DeleteUserUseCaseRequest {
    targetUserId: string;
}
export declare class DeleteUserUseCase {
    private usersRepository;
    constructor(usersRepository: UsersRepository);
    execute({ targetUserId }: DeleteUserUseCaseRequest): Promise<void>;
}
export {};
