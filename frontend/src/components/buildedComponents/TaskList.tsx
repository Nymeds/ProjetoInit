import { TaskCard } from './TaskCard';
import type { DragEvent as ReactDragEvent } from 'react';
import { Text } from '../baseComponents/text';
import { CheckCircle } from 'lucide-react';
import type { Todo } from '../../types/types';

interface TaskListProps {
  todos?: Todo[];
  isLoading?: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onDragStart?: (event: ReactDragEvent<HTMLDivElement>, todo: Todo) => void;
  onSelect?: (todo: Todo) => void;
  highlightCompleted?: boolean;
  statsFilter?: boolean | null; // null = todos, true = completos, false = pendentes
}

export function TaskList({ 
  todos, 
  isLoading, 
  onDeleted,
  onUpdated,
  onDragStart, 
  onSelect, 
  highlightCompleted = false,
  statsFilter = null
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 border-4 border-accent-brand border-t-transparent rounded-full animate-spin"></div>
        <Text variant="paragraph-medium" className="text-accent-paragraph">
          Carregando suas tarefas...
        </Text>
      </div>
    );
  }

  if (!todos?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="w-24 h-24 bg-background-tertiary rounded-full flex items-center justify-center border-2 border-border-primary">
          <CheckCircle className="w-12 h-12 text-accent-span" />
        </div>
        <div className="text-center space-y-3">
          <Text variant="heading-small" className="text-heading">
            Nenhuma tarefa encontrada
          </Text>
          <Text variant="paragraph-medium" className="text-accent-paragraph">
            Que tal começar criando sua primeira tarefa?
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {todos.map((todo) => {
        // Lógica de highlight:
        // - Se highlightCompleted está false, não destaca nada
        // - Se statsFilter é null, destaca todos
        // - Se statsFilter é true, destaca apenas completos
        // - Se statsFilter é false, destaca apenas pendentes
        const shouldHighlight = highlightCompleted && (
          statsFilter === null || 
          todo.completed === statsFilter
        );

        return (
          <TaskCard
            key={todo.id}
            todo={todo}
            onDeleted={onDeleted}
            onUpdated={onUpdated}
            onDragStart={onDragStart}
            onClick={() => onSelect?.(todo)}
            isHighlighted={shouldHighlight}
          />
        );
      })}
    </div>
  );
}
