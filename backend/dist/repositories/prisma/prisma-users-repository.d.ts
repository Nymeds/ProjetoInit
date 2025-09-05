import type { UsersRepository } from '../users-repository.js';
export declare class PrismaUsersRepository implements UsersRepository {
    findById(id: string, options?: {
        includeGroups?: boolean;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    } | null>;
    findByEmail(email: string): Promise<{
        name: string;
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    } | null>;
    create(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        name: string;
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    apagar(id: string): Promise<void>;
}
