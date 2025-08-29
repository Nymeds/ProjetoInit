import { TaskCard } from './TaskCard';
import { Button } from './button';
import { Text } from './text';
import { CheckCircle } from 'lucide-react';

interface TaskListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  todos: any[];
  isLoading: boolean;
}

export function TaskList({ todos, isLoading }: TaskListProps) {
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
        <Button className="bg-accent-brand hover:bg-accent-brand-light transition-colors px-6 py-3">
          Criar Primeira Tarefa
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {todos.map(todo => (
        <TaskCard key={todo.id} title={todo.title} completed={todo.completed} createdAt={todo.createdAt} />
      ))}
    </div>
  );
}
