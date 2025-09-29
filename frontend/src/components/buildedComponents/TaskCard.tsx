import { useState } from 'react';
import { CheckCircle, Clock, Calendar, Trash2 } from 'lucide-react';
import Card from '../baseComponents/card';
import { Text } from '../baseComponents/text';
import { Button } from '../baseComponents/button';
import { deleteTodo, updateTodo } from '../../api/todos';
import type { Todo } from '../../types/types';

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
      className={`cursor-pointer bg-background-secondary p-6 border border-border-primary hover:border-accent-brand transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Text variant="heading-small" className="text-heading flex-1 pr-3 leading-relaxed">
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
          <Text variant="paragraph-small" className="text-accent-span">
            {new Date(todo.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </div>

        {todo.description && (
          <Text variant="paragraph-small" className="text-accent-paragraph">
            {todo.description}
          </Text>
        )}

        {todo.group && (
          <Text variant="paragraph-small" className="text-accent-paragraph mt-1">
            Grupo: {todo.group.name}
          </Text>
        )}

        {error && <Text variant="paragraph-small" className="text-danger mt-2">{error}</Text>}

        <div className="flex gap-2 justify-end">
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

      </div>
    </Card>
  );
}
export function TaskCardFake({onClick}: TaskCardProps) {
  
     
  return (<>
    <Card onClick={onClick} className="cursor-pointer bg-background-secondary p-6 border border-border-primary hover:border-accent-brand transition-all duration-300 hover:scale-105 hover:shadow-lg">
       <div className="animate-pulse p-6 bg-background-tertiary rounded-2xl w-full h-40"></div>
      <div className="space-y-4">
        <Text variant="heading-small">{"Atividade 1"}</Text>
        <div>{<CheckCircle />}</div>
      </div>
    </Card>
    <Card onClick={onClick} className="cursor-pointer bg-background-secondary p-6 border border-border-primary hover:border-accent-brand transition-all duration-300 hover:scale-105 hover:shadow-lg">
       <div className="animate-pulse p-6 bg-background-tertiary rounded-2xl w-full h-40"></div>
      <div className="space-y-4">
        <Text variant="heading-small">{"Atividade 1"}</Text>
        <div>{<Clock />}</div>
      </div>
    </Card></>
  );
}