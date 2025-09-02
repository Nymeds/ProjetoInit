import type { Group } from '@prisma/client';

export interface CreateGroupParams {
  name: string;
  description?: string | null;
   userEmails: string[]
}

export interface GroupsRepository {
  findByName(name: string): unknown;
  create(data: CreateGroupParams): Promise<Group>;
  findById(id: string): Promise<Group | null>;
  findAll(): Promise<Group[]>;
  findManyByUser(userId: string): Promise<Group[]>;
}
