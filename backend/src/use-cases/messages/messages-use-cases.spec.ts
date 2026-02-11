import { describe, expect, it, vi } from 'vitest';
import type { Message, MessagesRepository } from '../../repositories/messages-repository.js';
import { CreateGroupMessageUseCase } from './create-for-group.js';
import { CreateTodoMessageUseCase } from './create-for-todo.js';
import { ListGroupMessagesUseCase } from './list-by-group.js';
import { ListTodoMessagesUseCase } from './list-by-todo.js';
import { UpdateTodoMessageUseCase } from './update-for-todo.js';
import { DeleteTodoMessageUseCase } from './delete-for-todo.js';

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  content: 'Hello',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  kind: 'COMMENT',
  authorId: 'user-1',
  authorName: 'User',
  groupId: null,
  todoId: 1,
  ...overrides,
});

const makeRepository = (): MessagesRepository => ({
  listByGroup: vi.fn(),
  createForGroup: vi.fn(),
  listByTodo: vi.fn(),
  createForTodo: vi.fn(),
  updateForTodo: vi.fn(),
  delete: vi.fn(),
});

describe('Message use-cases', () => {
  it('create group message rejects blank content', async () => {
    const repository = makeRepository();
    const sut = new CreateGroupMessageUseCase(repository);

    await expect(sut.execute({ groupId: 'group-1', authorId: 'user-1', content: '   ' })).rejects.toThrow(
      /Mensagem vazia/,
    );
  });

  it('create group message trims and stores content', async () => {
    const repository = makeRepository();
    const created = makeMessage({ groupId: 'group-1', todoId: null, kind: 'GROUP' });
    vi.mocked(repository.createForGroup).mockResolvedValue(created);

    const sut = new CreateGroupMessageUseCase(repository);
    const result = await sut.execute({ groupId: 'group-1', authorId: 'user-1', content: '  oi  ' });

    expect(repository.createForGroup).toHaveBeenCalledWith('group-1', 'user-1', 'oi');
    expect(result.message).toEqual(created);
  });

  it('create todo message uses COMMENT as default kind', async () => {
    const repository = makeRepository();
    const created = makeMessage({ kind: 'COMMENT', todoId: 10 });
    vi.mocked(repository.createForTodo).mockResolvedValue(created);

    const sut = new CreateTodoMessageUseCase(repository);
    const result = await sut.execute({ todoId: 10, authorId: 'user-1', content: '  texto  ' });

    expect(repository.createForTodo).toHaveBeenCalledWith(10, 'user-1', 'texto', 'COMMENT');
    expect(result.message).toEqual(created);
  });

  it('create todo message supports CHAT kind', async () => {
    const repository = makeRepository();
    const created = makeMessage({ kind: 'CHAT', todoId: 10 });
    vi.mocked(repository.createForTodo).mockResolvedValue(created);

    const sut = new CreateTodoMessageUseCase(repository);
    await sut.execute({ todoId: 10, authorId: 'user-1', content: 'msg', kind: 'CHAT' });

    expect(repository.createForTodo).toHaveBeenCalledWith(10, 'user-1', 'msg', 'CHAT');
  });

  it('list group messages proxies repository response', async () => {
    const repository = makeRepository();
    const messages = [makeMessage({ id: 'm1', groupId: 'group-1', todoId: null, kind: 'GROUP' })];
    vi.mocked(repository.listByGroup).mockResolvedValue(messages);

    const sut = new ListGroupMessagesUseCase(repository);
    const result = await sut.execute('group-1');

    expect(repository.listByGroup).toHaveBeenCalledWith('group-1');
    expect(result.messages).toEqual(messages);
  });

  it('list todo messages defaults to COMMENT kind', async () => {
    const repository = makeRepository();
    vi.mocked(repository.listByTodo).mockResolvedValue([makeMessage({ kind: 'COMMENT' })]);

    const sut = new ListTodoMessagesUseCase(repository);
    await sut.execute(55);

    expect(repository.listByTodo).toHaveBeenCalledWith(55, 'COMMENT');
  });

  it('update todo message rejects blank content', async () => {
    const repository = makeRepository();
    const sut = new UpdateTodoMessageUseCase(repository);

    await expect(
      sut.execute({ commentId: 'comment-1', authorId: 'user-1', content: '' }),
    ).rejects.toThrow(/Coment/);
    expect(repository.updateForTodo).not.toHaveBeenCalled();
  });

  it('update todo message trims and persists content', async () => {
    const repository = makeRepository();
    const updated = makeMessage({ id: 'comment-1', content: 'novo' });
    vi.mocked(repository.updateForTodo).mockResolvedValue(updated);

    const sut = new UpdateTodoMessageUseCase(repository);
    const result = await sut.execute({ commentId: 'comment-1', authorId: 'user-1', content: '  novo  ' });

    expect(repository.updateForTodo).toHaveBeenCalledWith('comment-1', 'user-1', 'novo');
    expect(result.message).toEqual(updated);
  });

  it('delete todo message delegates to repository', async () => {
    const repository = makeRepository();
    vi.mocked(repository.delete).mockResolvedValue();

    const sut = new DeleteTodoMessageUseCase(repository);
    const result = await sut.execute({ commentId: 'comment-1', authorId: 'user-1' });

    expect(repository.delete).toHaveBeenCalledWith('comment-1', 'user-1');
    expect(result).toEqual({});
  });
});
