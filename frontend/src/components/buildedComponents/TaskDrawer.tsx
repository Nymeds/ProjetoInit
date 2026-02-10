import { useEffect, useState, useRef } from 'react';
import { GroupChatModal } from './GroupChatModal';
import { Button } from '../baseComponents/button';
import { Text } from '../baseComponents/text';
import Card from '../baseComponents/card';
import type { Todo } from '../../types/types';
import { getTodoComments, postTodoComment, updateTodoComment, deleteTodoComment } from '../../api/messages';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  todo: Todo | null;
  onCreated?: () => void;
}

export function TaskDrawer({ open, onClose, todo, onCreated }: TaskDrawerProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { joinTodo, leaveTodo, sendTodoComment, on } = useChat();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // draggable modal state (declared before early return to preserve hook order)
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resolveImageUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);

  useEffect(() => {
    if (!open || !todo) return;
    const t = todo;
    setText('');
    setComments([]);

    async function load() {
      try {
        const c = await getTodoComments(t.id);
        setComments(c.messages ?? []);
      } catch (err) {
        // ignore for now
      }

      // join socket room for todo comments
      joinTodo(t.id);

      // subscribe socket events
      const offTodoComment = on('todo:comment', (msg: any) => {
        if (msg.todoId !== t.id) return;
        setComments((s) => {
          // ignore duplicates by id
          if (s.some((x) => x.id === msg.id)) return s;
          // remove optimistic placeholder that matches content and author 'you'
          const filtered = s.filter((x) => !(x.id && typeof x.id === 'string' && x.id.startsWith('tmp-') && x.content === msg.content && x.authorId === 'you'));
          return [...filtered, msg];
        });
      });

      const offTodoCommentUpdated = on('todo:comment_updated', (msg: any) => {
        if (msg.todoId !== t.id) return;
        setComments((s) => s.map((x) => (x.id === msg.id ? msg : x)));
      });

      const offTodoCommentDeleted = on('todo:comment_deleted', (payload: any) => {
        if (payload.todoId !== t.id) return;
        setComments((s) => s.filter((x) => x.id !== payload.id));
      });

      return () => {
        offTodoComment();
        offTodoCommentUpdated();
        offTodoCommentDeleted();
        leaveTodo(t.id);
      };
    }

    load();
  }, [open, todo, joinTodo, leaveTodo, on]);

  async function handleSend() {
    if (!todo) return;
    if (!text.trim()) return;
    setSending(true);

    const content = text.trim();

    try {
      // prefer realtime if available
      try {
        sendTodoComment(todo.id, content);
        // optimistic append
        setComments((s) => [...s, { id: `tmp-${Date.now()}`, content, authorId: 'you', authorName: 'Você', createdAt: new Date().toISOString(), todoId: todo.id }]);
      } catch (err) {
        const res = await postTodoComment(todo.id, content);
        setComments((s) => {
          // avoid duplicate by id
          if (s.some((x) => x.id === res.message.id)) return s;
          const filtered = s.filter((x) => !(x.id && typeof x.id === 'string' && x.id.startsWith('tmp-') && x.content === res.message.content && x.authorId === 'you'));
          return [...filtered, res.message];
        });
      }

      setText('');
      onCreated?.();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleEditStart(c: any) {
    setEditingId(c.id);
    setEditingText(c.content);
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditingText('');
  }

  async function handleEditSave() {
    if (!todo || !editingId) return;
    if (!editingText.trim()) return;

    try {
      const res = await updateTodoComment(todo.id, editingId, editingText.trim());
      // optimistic local replace (server will also emit)
      setComments((s) => s.map((x) => (x.id === editingId ? res.message : x)));
      setEditingId(null);
      setEditingText('');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(commentId: string) {
    if (!todo) return;
    if (!confirm('Excluir comentário?')) return;

    try {
      await deleteTodoComment(todo.id, commentId);
      setComments((s) => s.filter((x) => x.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }

    function onUp() {
      setIsDragging(false);
      dragStartRef.current = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  // touch support
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!isDragging || !dragStartRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - dragStartRef.current.x;
      const dy = t.clientY - dragStartRef.current.y;
      setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      dragStartRef.current = { x: t.clientX, y: t.clientY };
    }

    function onTouchEnd() {
      setIsDragging(false);
      dragStartRef.current = null;
    }

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartRef.current = { x: clientX, y: clientY };
  }

  function stopClickOutside() {
    // clicking on backdrop closes the modal
    onClose();
  }

  if (!open || !todo) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={stopClickOutside} />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-screen-sm sm:max-w-[960px] max-h-[90vh] bg-background-primary border border-border-primary shadow-2xl rounded-lg overflow-hidden mx-4 sm:mx-0`}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {/* Header / drag handle */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className={`p-4 bg-background-secondary border-b border-border-primary/30 flex items-center gap-4 cursor-${isDragging ? 'grabbing' : 'grab'}`}
          style={{ userSelect: 'none' }}
        >
          <div className="flex-1">
            <Text variant="heading-medium" className="text-heading">{todo.title}</Text>
            <Text variant="paragraph-small" className="text-accent-paragraph">{todo.group?.name ?? 'Sem grupo'}</Text>
          </div>
          <div className="flex items-center gap-2">
            {todo.group?.id && (
            <Button variant="primary" onClick={() => { if (todo.group?.id) setChatOpen(true); else alert('Tarefa sem grupo'); }}>Chat</Button>
             )}
            <Button variant="primary" onClick={onClose}>Fechar</Button>
          </div>
        </div>

        <div className="p-6 overflow-auto grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4 min-w-0">
            <Card className="bg-background-quaternary">
              <div className="p-4">
                <Text variant="heading-small" className="text-heading mb-2">Descriçã oo</Text>
                <div className="  text-accent-paragraph
                                  whitespace-pre-wrap
                                  break-words
                                  max-h-60
                                  overflow-y-auto
                                  pr-2">{todo.description ?? 'Sem descrição'}</div>
                {(todo.images?.length ?? 0) > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {todo.images?.map((image) => (
                      <div key={image.id} className="rounded border border-border-primary bg-background-primary/40 p-2">
                        <img
                          src={resolveImageUrl(image.url)}
                          alt={`Imagem da tarefa ${todo.title}`}
                          className="max-h-56 w-full rounded object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-background-quaternary">
              <div className="p-4">
                <Text variant="heading-small" className="text-heading mb-2">Detalhes</Text>
                <div className="text-accent-paragraph">Criado em: {new Date(todo.createdAt).toLocaleString('pt-BR')}</div>
                {/* anexos, membros, etiquetas etc */}
              </div>
            </Card>
          </div>

          <div>
            <Card className="bg-background-quaternary h-full flex flex-col">
              <div className="p-4 border-b border-border-primary/20">
                <Text variant="heading-small">Comentários</Text>
              </div>

              <div className="p-4 overflow-auto flex-1 space-y-3">
                {comments.length === 0 && <Text variant="paragraph-small" className="text-accent-paragraph">Nenhum comentário</Text>}
                {comments.map((c) => (
                  <div key={c.id} className="p-2 bg-background-primary/20 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-accent-paragraph text-sm font-medium">{c.authorName ?? c.authorId}</div>
                      <div className="flex items-top gap-2 ">
                        {c.authorId === user?.id && !editingId && (
                          <>
                            <Button variant="primary" className="px-2 py-1 text-xs" onClick={() => handleEditStart(c)}>Editar</Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleDelete(c.id)}>Excluir</Button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === c.id ? (
                      <div className="mt-2">
                        <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full p-2 rounded-md bg-background-primary border border-border-primary text-accent-paragraph" rows={3} />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button variant="ghost" onClick={handleEditCancel}>Cancelar</Button>
                          <Button variant="primary" onClick={handleEditSave}>Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-accent-paragraph text-sm whitespace-pre-wrap">{c.content}</div>
                        <div className="text-accent-span text-xs mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border-primary">
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'Escreva um comentário...'} className="w-full p-2 rounded-md bg-background-primary border border-border-primary text-accent-paragraph" rows={3} />
                <div className="flex justify-end mt-2">
                  <Button onClick={handleSend} disabled={sending || !text.trim()} variant="primary">Enviar</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {todo && todo.group?.id && (
        <GroupChatModal open={chatOpen} onClose={() => setChatOpen(false)} groupId={todo.group.id} />
      )}

    </div>
  );
}

// Garantir que haja uma exportação default explícita (HMR/ESM compatibilidade)
export default TaskDrawer;
