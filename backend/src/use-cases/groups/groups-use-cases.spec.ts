import { describe, expect, it, vi } from 'vitest';
import type { Group } from '@prisma/client';
import type { GroupsRepository } from '../../repositories/groups-repository.js';
import type { UsersRepository } from '../../repositories/users-repository.js';
import { CreateGroupUseCase } from './create.js';
import { DeleteGroupUseCase } from './delete.js';
import { LeaveGroupUseCase } from './leave.js';
import { ListGroupsUseCase } from './list-groups.js';

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
  id: 'group-1',
  name: 'Equipe 1',
  description: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeGroupsRepository = (): GroupsRepository => ({
  delete: vi.fn(),
  findByName: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findManyByUser: vi.fn(),
  removeMember: vi.fn(),
  update: vi.fn(),
});

const makeUsersRepository = (): UsersRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  apagar: vi.fn(),
});

describe('Group use-cases', () => {
  it('create group validates minimum of members', async () => {
    const groupsRepository = makeGroupsRepository();
    const usersRepository = makeUsersRepository();

    const sut = new CreateGroupUseCase(groupsRepository, usersRepository);

    await expect(
      sut.execute({
        name: 'Equipe',
        userEmails: ['owner@email.com'],
      }),
    ).rejects.toThrow(/pelo menos 2 membros/);
  });

  it('create group validates duplicate emails', async () => {
    const groupsRepository = makeGroupsRepository();
    const usersRepository = makeUsersRepository();

    const sut = new CreateGroupUseCase(groupsRepository, usersRepository);

    await expect(
      sut.execute({
        name: 'Equipe',
        userEmails: ['a@email.com', 'A@email.com'],
      }),
    ).rejects.toThrow(/duplicados/);
  });

  it('create group maps users and passes normalized emails', async () => {
    const groupsRepository = makeGroupsRepository();
    const usersRepository = makeUsersRepository();
    const created = makeGroup({ name: 'Equipe' });

    vi.mocked(usersRepository.findByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'User',
      email: 'user@email.com',
      password: 'hash',
      role: 'MEMBER',
    } as any);
    vi.mocked(groupsRepository.create).mockResolvedValue(created);

    const sut = new CreateGroupUseCase(groupsRepository, usersRepository);

    const result = await sut.execute({
      name: 'Equipe',
      description: 'desc',
      userEmails: [' USER@email.com ', ' two@email.com '],
    });

    expect(usersRepository.findByEmail).toHaveBeenCalledWith('user@email.com');
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('two@email.com');
    expect(groupsRepository.create).toHaveBeenCalledWith({
      name: 'Equipe',
      description: 'desc',
      userEmails: ['user@email.com', 'two@email.com'],
    });
    expect(result).toEqual(created);
  });

  it('create group converts prisma unique-name error into domain error', async () => {
    const groupsRepository = makeGroupsRepository();
    const usersRepository = makeUsersRepository();

    vi.mocked(usersRepository.findByEmail).mockResolvedValue({
      id: 'user-1',
      name: 'User',
      email: 'user@email.com',
      password: 'hash',
      role: 'MEMBER',
    } as any);
    vi.mocked(groupsRepository.create).mockRejectedValue({
      code: 'P2002',
      meta: { target: ['name'] },
    });

    const sut = new CreateGroupUseCase(groupsRepository, usersRepository);

    await expect(
      sut.execute({
        name: 'Equipe',
        userEmails: ['user@email.com', 'two@email.com'],
      }),
    ).rejects.toThrow(/existe um grupo/);
  });

  it('delete group validates required id', async () => {
    const groupsRepository = makeGroupsRepository();

    const sut = new DeleteGroupUseCase(groupsRepository);

    await expect(sut.execute({ id: '  ' })).rejects.toThrow(/ID do grupo/);
  });

  it('delete group fails when group is missing', async () => {
    const groupsRepository = makeGroupsRepository();
    vi.mocked(groupsRepository.findById).mockResolvedValue(null);

    const sut = new DeleteGroupUseCase(groupsRepository);

    await expect(sut.execute({ id: 'missing' })).rejects.toThrow(/Grupo/);
  });

  it('delete group calls repository when group exists', async () => {
    const groupsRepository = makeGroupsRepository();
    const group = makeGroup();

    vi.mocked(groupsRepository.findById).mockResolvedValue(group);
    vi.mocked(groupsRepository.delete).mockResolvedValue(group);

    const sut = new DeleteGroupUseCase(groupsRepository);

    const result = await sut.execute({ id: 'group-1' });

    expect(groupsRepository.delete).toHaveBeenCalledWith({ id: 'group-1' });
    expect(result).toEqual(group);
  });

  it('leave group fails when group is not found', async () => {
    const groupsRepository = makeGroupsRepository();
    vi.mocked(groupsRepository.findById).mockResolvedValue(null);

    const sut = new LeaveGroupUseCase(groupsRepository);

    await expect(sut.execute({ groupId: 'missing', userId: 'user-1' })).rejects.toThrow(/Grupo/);
    expect(groupsRepository.removeMember).not.toHaveBeenCalled();
  });

  it('leave group removes user and returns message', async () => {
    const groupsRepository = makeGroupsRepository();
    vi.mocked(groupsRepository.findById).mockResolvedValue(makeGroup());

    const sut = new LeaveGroupUseCase(groupsRepository);

    const result = await sut.execute({ groupId: 'group-1', userId: 'user-1' });

    expect(groupsRepository.removeMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(result).toEqual({ message: 'Você saiu do grupo' });
  });

  it('list groups proxies repository result', async () => {
    const groupsRepository = makeGroupsRepository();
    const list = [makeGroup({ id: 'group-1' }), makeGroup({ id: 'group-2' })];
    vi.mocked(groupsRepository.findManyByUser).mockResolvedValue(list);

    const sut = new ListGroupsUseCase(groupsRepository);

    const result = await sut.execute('user-1');

    expect(groupsRepository.findManyByUser).toHaveBeenCalledWith('user-1');
    expect(result.groups).toEqual(list);
  });
});
