import type { UsersRepository } from '@/repositories/users-repository.js'
import { hash } from 'bcryptjs'

// Tipos para a requisição do caso de uso
interface RegisterUseCaseRequest {
  name: string
  email: string
  password: string
}

// Resposta do caso de uso (inferindo tipo do retorno de create)
interface RegisterUseCaseResponse {
  user: ReturnType<UsersRepository['create']> extends Promise<infer U> ? U : never
}

// Caso de uso de registro
export class RegisterUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    name,
    email,
    password,
  }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
    // Hash da senha
    const password_hash = await hash(password, 6)

    // Verifica se já existe usuário com o mesmo email
    const userWithSameEmail = await this.usersRepository.findByEmail(email)
    if (userWithSameEmail) {
      throw new Error('UserAlreadyExistsError')
    }

    // Cria o usuário
    const user = await this.usersRepository.create({
        name,
      email,
      password: password_hash,
    })

    return { user }
  }
}
