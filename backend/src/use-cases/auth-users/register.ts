import type { UsersRepository } from '../../repositories/users-repository.js'
import { hash } from 'bcryptjs'


interface RegisterUseCaseRequest {
  name: string
  email: string
  password: string
}


interface RegisterUseCaseResponse {
  user: ReturnType<UsersRepository['create']> extends Promise<infer U> ? U : never
}


export class RegisterUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    name,
    email,
    password,
  }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
    
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)
    if (userWithSameEmail) {
      throw new Error('UserAlreadyExistsError')
    }

 
    const user = await this.usersRepository.create({
        name,
      email,
      password: password_hash,
    })

    return { user }
  }
}
