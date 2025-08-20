// tests/register-use-case.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterUseCase } from '@/use-cases/auth-users/register.js'
import { hash } from 'bcryptjs'

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
}))

describe('RegisterUseCase', () => {
  let usersRepository: any
  let sut: RegisterUseCase

  beforeEach(() => {
    usersRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    }
    sut = new RegisterUseCase(usersRepository)
  })

  it('should register a new user', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)
    ;(hash as any).mockResolvedValue('hashedPassword')
    const createdUser = { id: '1', name: 'John', email: 'john@example.com', password: 'hashedPassword' }
    usersRepository.create.mockResolvedValue(createdUser)

    const result = await sut.execute({ name: 'John', email: 'john@example.com', password: '123456' })

    expect(result.user).toEqual(createdUser)
    expect(usersRepository.create).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      password: 'hashedPassword',
    })
  })

  it('should throw error if user with same email exists', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: '1', email: 'john@example.com' })

    await expect(sut.execute({ name: 'John', email: 'john@example.com', password: '123456' }))
      .rejects
      .toThrow('UserAlreadyExistsError')
  })
})
