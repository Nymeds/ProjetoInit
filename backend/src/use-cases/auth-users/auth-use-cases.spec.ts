import { describe, expect, it, vi } from 'vitest';
import type { User } from '@prisma/client';
import { InvalidCredentials } from '../errors/invalid-credentials.js';

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-password'),
  compare: vi.fn(async (plain: string, hashed: string) => plain === 'secret' && hashed === 'stored-hash'),
}));

import { hash } from 'bcryptjs';
import type { UsersRepository } from '../../repositories/users-repository.js';
import { RegisterUseCase } from './register.js';
import { AuthenticateUseCase } from './authenticate.js';
import { GetUserProfileUseCase } from './get-user-profile.js';
import { DeleteUserUseCase } from './user-delete.js';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'User',
  email: 'user@email.com',
  password: 'stored-hash',
  role: 'MEMBER',
  ...overrides,
});

const makeRepository = (): UsersRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  apagar: vi.fn(),
});

describe('Auth use-cases', () => {
  it('register normalizes email and persists hashed password', async () => {
    const repository = makeRepository();
    const created = makeUser({ email: 'john@example.com' });

    vi.mocked(repository.findByEmail).mockResolvedValue(null);
    vi.mocked(repository.create).mockResolvedValue(created);

    const sut = new RegisterUseCase(repository);

    const result = await sut.execute({
      name: 'John',
      email: '  John@Example.com ',
      password: 'secret',
    });

    expect(hash).toHaveBeenCalledWith('secret', 6);
    expect(repository.findByEmail).toHaveBeenCalledWith('john@example.com');
    expect(repository.create).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      password: 'hashed-password',
    });
    expect(result.user).toEqual(created);
  });

  it('register rejects duplicated email', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(makeUser());

    const sut = new RegisterUseCase(repository);

    await expect(
      sut.execute({ name: 'John', email: 'user@email.com', password: 'secret' }),
    ).rejects.toThrow('UserAlreadyExistsError');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('authenticate throws InvalidCredentials when user does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(null);

    const sut = new AuthenticateUseCase(repository);

    await expect(sut.execute({ email: 'none@email.com', password: 'secret' })).rejects.toBeInstanceOf(
      InvalidCredentials,
    );
  });

  it('authenticate throws InvalidCredentials when password is wrong', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(makeUser({ password: 'stored-hash' }));

    const sut = new AuthenticateUseCase(repository);

    await expect(
      sut.execute({ email: ' user@email.com ', password: 'invalid' }),
    ).rejects.toBeInstanceOf(InvalidCredentials);
  });

  it('authenticate returns safe user shape on success', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findByEmail).mockResolvedValue(makeUser());

    const sut = new AuthenticateUseCase(repository);
    const result = await sut.execute({ email: ' USER@email.com ', password: 'secret' });

    expect(repository.findByEmail).toHaveBeenCalledWith('user@email.com');
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'User',
      email: 'user@email.com',
      role: 'MEMBER',
    });
  });

  it('get user profile returns mapped groups', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue({
      ...makeUser(),
      groups: [
        {
          roleInGroup: 'MEMBER',
          group: {
            id: 'group-1',
            name: 'Time A',
            description: 'desc',
          },
        },
      ],
    } as any);

    const sut = new GetUserProfileUseCase(repository);
    const result = await sut.execute({ userId: 'user-1' });

    expect(repository.findById).toHaveBeenCalledWith('user-1', { includeGroups: true });
    expect(result.groups).toEqual([
      {
        id: 'group-1',
        name: 'Time A',
        description: 'desc',
        roleInGroup: 'MEMBER',
      },
    ]);
  });

  it('get user profile throws when user does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const sut = new GetUserProfileUseCase(repository);

    await expect(sut.execute({ userId: 'unknown' })).rejects.toThrow(/Usu/);
  });

  it('delete user throws when target user is missing', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const sut = new DeleteUserUseCase(repository);

    await expect(sut.execute({ targetUserId: 'missing' })).rejects.toThrow(/Usuario/);
    expect(repository.apagar).not.toHaveBeenCalled();
  });

  it('delete user removes target when found', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeUser());

    const sut = new DeleteUserUseCase(repository);

    await sut.execute({ targetUserId: 'user-1' });
    expect(repository.apagar).toHaveBeenCalledWith('user-1');
  });
});
