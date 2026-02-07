import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import Card from '../baseComponents/card';
import { Text } from '../baseComponents/text';
import { Button } from '../baseComponents/button';
import { deleteTodo, updateTodo } from '../../api/todos';
import type { Todo } from '../../types/types';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

interface TaskCardProps {
  todo: Todo;
  onDeleted?: () => void;
  className?: string;
  onClick?: () => void; 
  onUpdated?: () => void;
  laceholder?: boolean;
}

export function TaskCard({ todo, onDeleted,onUpdated, className = '', onClick }: TaskCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const resolveImageUrl = (url: string) => (url.startsWith('http') ? url : `${API_BASE}${url}`);
  const coverImage = todo.images?.[0];

  const descRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    function check() {
      const el = descRef.current;
      if (!el) return;
      // content element is the first child inside wrapper
      const content = el.firstElementChild as HTMLElement | null;
      if (!content) return;
      const overflowing = content.scrollHeight > el.clientHeight + 1;
      setIsOverflowing(overflowing);
    }

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [todo.description]);

  async function handleDelete() {
    if (!window.confirm('Deseja realmente excluir esta tarefa?')) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTodo(todo.id.toString()); 
      onDeleted?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar tarefa');
    } finally {
      setDeleting(false);
    }
  }
  async function handleUpdate() {
  
    setUpdating(true);
    setError(null);
    try {
      await updateTodo(todo.id.toString()); 
      onUpdated?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || `Erro ao marcar como concluida a tarefa ${todo.title}`);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card
      onClick={onClick}
      bodyClassName="flex flex-col flex-1 overflow-hidden"
      className={`cursor-pointer bg-background-secondary p-6 border border-border-primary hover:border-accent-brand transition-all duration-300 hover:scale-105 hover:shadow-lg ${className} flex flex-col`}
    >
      {/* body limited to max height with internal scroll so each card keeps its independent size */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: 320 }}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <Text variant="heading-small" className="text-heading flex-1 pr-3 leading-relaxed truncate">
                {todo.title}
              </Text>
              <div className="flex-shrink-0">
                {todo.completed ? (
                  <CheckCircle className="w-6 h-6 text-accent-brand" />
                ) : (
                  <Clock className="w-6 h-6 text-accent-red" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                todo.completed 
                  ? "bg-accent-brand/20 text-accent-brand border border-accent-brand/30" 
                  : "bg-accent-red/20 text-accent-red border border-accent-red/30"
              }`}>
                {todo.completed ? "✅ Concluída" : "⏳ Pendente"}
              </span>
            </div>

            <div className="flex items-center pt-3 border-t border-border-primary space-x-2">
              <Calendar className="w-4 h-4 text-accent-span" />
              <Text variant="paragraph-small" className="text-accent-span ">
                {new Date(todo.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </div>

            {coverImage && (
              <div className="mt-2">
                <img
                  src={resolveImageUrl(coverImage.url)}
                  alt={`Imagem da tarefa ${todo.title}`}
                  className="max-h-40 w-full rounded border border-border-primary object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {todo.description && (
              <div className="mt-1">
                <div ref={(el) => { descRef.current = el; }} className="overflow-hidden">
                  <Text as="div" variant="paragraph-small" className="text-accent-paragraph line-clamp-4 max-h-28 overflow-hidden whitespace-pre-wrap break-words">
                    {todo.description}
                  </Text>
                </div>

                {/* Ler mais caso seja grande - calculado em runtime */}
                {isOverflowing && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                      }}
                      className="text-sm px-2 py-1"
                    >
                      Ler mais
                    </Button>
                  </div>
                )}
              </div>
            )}

            {todo.group && (
              <Text variant="paragraph-small" className="text-accent-paragraph mt-1">
                Grupo: {todo.group.name}
              </Text>
            )}

            {error && <Text variant="paragraph-small" className="text-danger mt-2">{error}</Text>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              variant="danger"
              disabled={deleting}
            >
              <Trash2 size={14} />
            </Button>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdate();
              }}
              variant="primary"
              disabled={updating}
            >
              <CheckCircle size={14} />
            </Button>
          </div>

    </Card>
  );
}
