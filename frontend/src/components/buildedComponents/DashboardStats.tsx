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
  onHighlight: () => void;
}

export function DashboardStats({ 
  total, 
  completed, 
  pending, 
  completionRate, 
  onHighlight
}: DashboardStatsProps) {
  
  const handleCompletedClick = () => {
    onHighlight();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard title="Total de Tarefas" value={total} icon={BarChart3} />
      <StatsCard 
        title="Concluídas" 
        value={completed} 
        icon={CheckCircle} 
        color="accent-brand"
        onClick={handleCompletedClick}
      />
      <StatsCard title="Pendentes" 
      value={pending} 
      icon={Clock} 
      color="accent-red"
      onClick={handleCompletedClick}
      />
      <StatsCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="accent-brand-light" />
    </div>
  );
}