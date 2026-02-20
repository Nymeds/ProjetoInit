import { describe, expect, it, vi } from 'vitest';
import type { Todo } from '@prisma/client';
import type { TodosRepository, TodoWithImagesAndGroup } from '../../repositories/todo-repository.js';
import { CreateTodoUseCase } from './create-todo.js';
import { UpdateTodoUseCase } from './update-todo.js';
import { DeleteTodoUseCase } from './delete-todo.js';
import { SelectTodosUseCase } from './select-todo.js';
import { CompleteTodoUseCase } from './complete-todo.js';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  title: 'Task',
  description: null,
  completed: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  userId: 'user-1',
  groupId: null,
  ...overrides,
});

const makeRepository = (): TodosRepository => ({
  findAllVisibleForUser: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findManyByUser: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  isUserInGroup: vi.fn(),
});

describe('Todo use-cases', () => {
  it('create todo forwards payload to repository', async () => {
    const repository = makeRepository();
    const todo = makeTodo({ title: 'Nova tarefa' });
    vi.mocked(repository.create).mockResolvedValue(todo);
    vi.mocked(repository.isUserInGroup).mockResolvedValue(true);

    const sut = new CreateTodoUseCase(repository);
    const result = await sut.execute({
      title: 'Nova tarefa',
      userId: 'user-1',
      description: 'desc',
      groupId: 'group-1',
    });

    expect(repository.create).toHaveBeenCalledWith({
      title: 'Nova tarefa',
      userId: 'user-1',
      description: 'desc',
      groupId: 'group-1',
    });
    expect(result.todo).toEqual(todo);
  });

  it('update todo fails when todo does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const sut = new UpdateTodoUseCase(repository);

    await expect(sut.execute({ todoId: 999, userId: 'user-1', title: 'Novo' })).rejects.toThrow(/Tarefa/);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('update todo blocks move to group when user is not member', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeTodo({ userId: 'user-1' }));
    vi.mocked(repository.isUserInGroup).mockResolvedValue(false);

    const sut = new UpdateTodoUseCase(repository);

    await expect(
      sut.execute({ todoId: 1, userId: 'user-1', title: 'Novo', groupId: 'group-2' }),
    ).rejects.toThrow(/autorizado/);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('update todo blocks non-owner even if group is valid', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeTodo({ userId: 'owner-1' }));
    vi.mocked(repository.isUserInGroup).mockResolvedValue(true);

    const sut = new UpdateTodoUseCase(repository);

    await expect(
      sut.execute({ todoId: 1, userId: 'member-2', title: 'Novo', groupId: 'group-2' }),
    ).rejects.toThrow(/autorizado/);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('update todo succeeds for owner without group move', async () => {
    const repository = makeRepository();
    const current = makeTodo({ id: 8, userId: 'owner-1' });
    const updated = makeTodo({ id: 8, userId: 'owner-1', title: 'Atualizada' });

    vi.mocked(repository.findById).mockResolvedValue(current);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const sut = new UpdateTodoUseCase(repository);
    const result = await sut.execute({ todoId: 8, userId: 'owner-1', title: 'Atualizada' });

    expect(repository.isUserInGroup).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(8, { title: 'Atualizada', groupId: undefined });
    expect(result.todo).toEqual(updated);
  });

  it('delete todo fails when todo does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const sut = new DeleteTodoUseCase(repository);

    await expect(sut.execute({ todoId: 1, userId: 'user-2' })).rejects.toThrow(/Tarefa/);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('delete todo blocks non-owner', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeTodo({ userId: 'owner-1' }));

    const sut = new DeleteTodoUseCase(repository);

    await expect(sut.execute({ todoId: 1, userId: 'user-2' })).rejects.toThrow(/autorizado/);

    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('delete todo removes when requester is owner', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeTodo({ id: 10, userId: 'owner-1' }));

    const sut = new DeleteTodoUseCase(repository);

    await sut.execute({ todoId: 10, userId: 'owner-1' });

    expect(repository.delete).toHaveBeenCalledWith(10);
  });

  it('select todos returns visible list from repository', async () => {
    const repository = makeRepository();
    const visible: TodoWithImagesAndGroup[] = [
      {
        ...makeTodo({ id: 1 }),
        images: [],
        group: null,
      },
    ];
    vi.mocked(repository.findAllVisibleForUser).mockResolvedValue(visible);

    const sut = new SelectTodosUseCase(repository);
    const result = await sut.execute({ userId: 'user-1' });

    expect(repository.findAllVisibleForUser).toHaveBeenCalledWith('user-1');
    expect(result.todos).toEqual(visible);
  });

  it('complete todo fails when todo does not exist', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(null);

    const sut = new CompleteTodoUseCase(repository);

    await expect(sut.execute({ todoId: 1, userId: 'user-1' })).rejects.toThrow(/Tarefa/);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('complete todo blocks user outside owner/group', async () => {
    const repository = makeRepository();
    vi.mocked(repository.findById).mockResolvedValue(makeTodo({ userId: 'owner-1', groupId: 'group-1' }));
    vi.mocked(repository.isUserInGroup).mockResolvedValue(false);

    const sut = new CompleteTodoUseCase(repository);

    await expect(sut.execute({ todoId: 3, userId: 'outsider-1' })).rejects.toThrow(/autorizado/);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('complete todo allows owner without group', async () => {
    const repository = makeRepository();
    const todo = makeTodo({ id: 4, userId: 'owner-1', groupId: null, completed: false });
    const updated = makeTodo({ id: 4, userId: 'owner-1', groupId: null, completed: true });

    vi.mocked(repository.findById).mockResolvedValue(todo);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const sut = new CompleteTodoUseCase(repository);
    const result = await sut.execute({ todoId: 4, userId: 'owner-1' });

    expect(repository.isUserInGroup).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(4, {
      completed: true,
      groupId: undefined,
    });
    expect(result.todo.completed).toBe(true);
  });

  it('complete todo allows group member and marks as completed', async () => {
    const repository = makeRepository();
    const todo = makeTodo({ id: 3, userId: 'owner-1', groupId: 'group-1', completed: false });
    const updated = makeTodo({ ...todo, completed: true });

    vi.mocked(repository.findById).mockResolvedValue(todo);
    vi.mocked(repository.isUserInGroup).mockResolvedValue(true);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const sut = new CompleteTodoUseCase(repository);
    const result = await sut.execute({ todoId: 3, userId: 'member-2' });

    expect(repository.update).toHaveBeenCalledWith(3, {
      completed: true,
      groupId: 'group-1',
    });
    expect(result.todo.completed).toBe(true);
  });
});
