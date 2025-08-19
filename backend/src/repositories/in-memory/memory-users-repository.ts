import type { UsersRepository } from '../users-repository.js';
import { randomUUID } from 'crypto';

interface User {
  id: string;
  email: string;
  password: string;
}

export class InMemoryUsersRepository implements UsersRepository {
  private users: User[] = [];

  async findById(id: string) {
    const user = this.users.find((u) => u.id === id);
    return user ?? null;
  }

  async findByEmail(email: string) {
    const user = this.users.find((u) => u.email === email);
    return user ?? null;
  }

  async create(data: { email: string; password: string }) {
    const user: User = {
      id: randomUUID(),
      email: data.email,
      password: data.password,
    };
    this.users.push(user);
    return user;
  }

  async apagar(id: string) {
    this.users = this.users.filter((u) => u.id !== id);
  }
}
