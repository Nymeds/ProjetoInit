import { useEffect } from 'react';
import type { Todo } from '../../types/types';
import { StatsCard } from './StatsCard';
import { BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  todosCompleted : Todo[];
}

export function DashboardStats({ total, completed, pending, completionRate , todosCompleted }: DashboardStatsProps) {
 useEffect(() => {
    console.log('DashboardStats recebeu:', todosCompleted);
  }, [todosCompleted]);
  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
       <StatsCard title="Total de Tarefas" value={total} icon={BarChart3} onClick={() => {console.log('Tarefas concluídas:', todosCompleted);}} />
       <StatsCard title="Concluídas" value={completed} icon={CheckCircle} color="accent-brand" />
       <StatsCard title="Pendentes" value={pending} icon={Clock} color="accent-red" />
       <StatsCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="accent-brand-light" />
   </div>
  );
}
