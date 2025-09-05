import type { UsersRepository } from "../../repositories/users-repository.js";
interface GetUserProfileRequest {
    userId: string;
}
export declare class GetUserProfileUseCase {
    private usersRepository;
    constructor(usersRepository: UsersRepository);
    execute({ userId }: GetUserProfileRequest): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        groups: {
            id: any;
            name: any;
            description: any;
            roleInGroup: any;
        }[];
    }>;
}
export {};
