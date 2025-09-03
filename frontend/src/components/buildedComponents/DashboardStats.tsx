import { StatsCard } from './StatsCard';
import { BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export function DashboardStats({ total, completed, pending, completionRate }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      <StatsCard title="Total de Tarefas" value={total} icon={BarChart3} />
      <StatsCard title="Concluídas" value={completed} icon={CheckCircle} color="accent-brand" />
      <StatsCard title="Pendentes" value={pending} icon={Clock} color="accent-red" />
      <StatsCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="accent-brand-light" />
    </div>
  );
}
