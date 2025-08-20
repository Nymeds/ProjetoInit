import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthenticateUseCase } from '@/use-cases/auth-users/authenticate.js'
import { InvalidCredentials } from '@/use-cases/errors/invalid-credentials.js'
import { compare } from 'bcryptjs'

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}))

describe('AuthenticateUseCase', () => {
  let usersRepository: any
  let sut: AuthenticateUseCase

  beforeEach(() => {
    usersRepository = {
      findByEmail: vi.fn(),
    }
    sut = new AuthenticateUseCase(usersRepository)
  })

  it('should authenticate a user with correct credentials', async () => {
    const user = { id: '1', name: 'John', email: 'john@example.com', password: 'hashed' }
    usersRepository.findByEmail.mockResolvedValue(user)
    ;(compare as any).mockResolvedValue(true)

    const result = await sut.execute({ email: 'john@example.com', password: '123456' })

    expect(result.user).toEqual(user)
  })

  it('should throw InvalidCredentials if user not found', async () => {
    usersRepository.findByEmail.mockResolvedValue(null)

    await expect(sut.execute({ email: 'test@example.com', password: '123' }))
      .rejects
      .toBeInstanceOf(InvalidCredentials)
  })

  it('should throw InvalidCredentials if password does not match', async () => {
    const user = { id: '1', name: 'John', email: 'john@example.com', password: 'hashed' }
    usersRepository.findByEmail.mockResolvedValue(user)
    ;(compare as any).mockResolvedValue(false)

    await expect(sut.execute({ email: 'john@example.com', password: 'wrong' }))
      .rejects
      .toBeInstanceOf(InvalidCredentials)
  })
})
