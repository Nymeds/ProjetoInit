import { BarChart3, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { StatsCard } from "./StatsCard";

interface DashboardStatsProps {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  onHighlight: (filter: boolean | null) => void;
  activeFilter: boolean | null;
  isHighlightActive: boolean;
}

export function DashboardStats({
  total,
  completed,
  pending,
  completionRate,
  onHighlight,
  activeFilter,
  isHighlightActive,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total de Tarefas"
        value={total}
        icon={BarChart3}
        isActive={isHighlightActive && activeFilter === null}
        onClick={() => onHighlight(null)}
      />

      <StatsCard
        title="Concluidas"
        value={completed}
        icon={CheckCircle}
        color="accent-brand"
        isActive={isHighlightActive && activeFilter === true}
        onClick={() => onHighlight(true)}
      />

      <StatsCard
        title="Pendentes"
        value={pending}
        icon={Clock}
        color="accent-red"
        isActive={isHighlightActive && activeFilter === false}
        onClick={() => onHighlight(false)}
      />

      <StatsCard
        title="Taxa de Conclusao"
        value={`${completionRate}%`}
        icon={TrendingUp}
        color="accent-brand-light"
      />
    </div>
  );
}
