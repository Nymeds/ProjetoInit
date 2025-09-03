import { Button } from '../baseComponents/button';
import { Plus } from 'lucide-react';

interface DashboardActionsProps {
  onCreateTask: () => void;
  onCreateGroup: () => void;
}

export function DashboardActions({ onCreateTask, onCreateGroup }: DashboardActionsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <Button onClick={onCreateTask} variant="primary" className="flex items-center gap-2">
        <Plus size={16} /> Nova Tarefa
      </Button>
      <Button onClick={onCreateGroup} variant="primary" className="flex items-center gap-2">
        <Plus size={16} /> Novo Grupo
      </Button>
    </div>
  );
}
