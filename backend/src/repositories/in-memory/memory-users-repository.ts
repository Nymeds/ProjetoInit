import type { UsersRepository } from '../users-repository.js'
import { randomUUID } from 'crypto'

interface User {
  id: string
  name: string
  email: string
  password: string
}

export class InMemoryUsersRepository implements UsersRepository {
  private users: User[] = []

  // Buscar usuário por ID
  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id)
    return user ?? null
  }

  // Buscar usuário por email
  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email)
    return user ?? null
  }

  // Criar um novo usuário
  async create(data: { name: string; email: string; password: string }): Promise<User> {
    const user: User = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password,
    }

    this.users.push(user)
    return user
  }

  // Apagar usuário por ID
  async apagar(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id)
  }
}
