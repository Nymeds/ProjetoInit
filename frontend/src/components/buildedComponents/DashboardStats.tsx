import type { Todo } from '../../types/types';
import { StatsCard } from './StatsCard';
import { BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  todosCompleted: Todo[];
  todosPending: Todo[];
  todostotalTasks: Todo[];
  onHighlight: (filter: boolean | null) => void;
}

export function DashboardStats({ 
  total, 
  completed, 
  pending, 
  completionRate, 
  todosCompleted,
  todosPending,
  todostotalTasks,
  onHighlight
}: DashboardStatsProps) {
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard 
        title="Total de Tarefas" 
        value={total} 
        icon={BarChart3}
        onClick={() => {
          onHighlight(null); // null = mostrar todas
        }}
      />
      <StatsCard 
        title="Concluídas" 
        value={completed} 
        icon={CheckCircle} 
        color="accent-brand"
        onClick={() => {
          onHighlight(true); // true = mostrar completas
        }}
      />
      <StatsCard 
        title="Pendentes" 
        value={pending} 
        icon={Clock} 
        color="accent-red"
        onClick={() => {
          onHighlight(false); // false = mostrar pendentes
        }}
      />
      <StatsCard 
        title="Taxa de Conclusão" 
        value={`${completionRate}%`} 
        icon={TrendingUp} 
        color="accent-brand-light" 
      />
    </div>
  );
}