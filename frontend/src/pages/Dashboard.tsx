/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { useGroups } from '../hooks/useGroups';
import { DashboardHeader } from '../components/buildedComponents/DashboardHeader';
import { StatsCard } from '../components/buildedComponents/StatsCard';
import { TaskList } from '../components/buildedComponents/TaskList';
import NewTaskModal from '../components/buildedComponents/NewTaskModal';
import NewUserGroupForm from '../components/buildedComponents/NewUserGroup';
import { BarChart3, CheckCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { Text } from '../components/baseComponents/text';
import Card from '../components/baseComponents/card';
import { Button } from '../components/baseComponents/button';
import TaskInfo from '../components/buildedComponents/TaskInfo';
import type { Todo } from '../types/types';

export function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: todos, isLoading: todosLoading, refetch } = useTodos({ enabled: !!user });
  const { data: groups = [], refetch: refetchGroups } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  // Mapeia os todos para incluir o grupo completo
  const todosWithGroup = useMemo(() => {
    if (!todos) return [];
    return todos.map((todo: { group: any; groupId: string; }) => ({
      ...todo,
      group: todo.group ?? groups.find(g => g.id === todo.groupId) ?? null
    }));
  }, [todos, groups]);

  // Agrupa tarefas por grupo
  const todosGrouped = useMemo(() => {
    const map: Record<string, typeof todosWithGroup> = {};
    todosWithGroup.forEach((todo: { group: { id: string; }; }) => {
      const groupId = todo.group?.id ?? 'sem-grupo';
      if (!map[groupId]) map[groupId] = [];
      map[groupId].push(todo);
    });
    return map;
  }, [todosWithGroup]);

  // Estatísticas gerais
  const totalTasks = todosWithGroup.length;
  const completedTasks = todosWithGroup.filter((todo: { completed: any; }) => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-accent-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <Text variant="heading-medium" className="text-heading">Carregando usuário...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-label font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-12 lg:py-12">
        <Card className="bg-background-quaternary p-6 border-b-2 border-border-primary">
          <DashboardHeader user={user} onLogout={handleLogout} />

          <div className="mb-16 text-center">
            <Text variant="heading-medium" className="text-heading mb-3">Resumo das Atividades</Text>
            <Text variant="paragraph-medium" className="text-accent-paragraph">
              Acompanhe seu progresso e produtividade
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <StatsCard title="Total de Tarefas" value={totalTasks} icon={BarChart3} />
            <StatsCard title="Concluídas" value={completedTasks} icon={CheckCircle} color="accent-brand" />
            <StatsCard title="Pendentes" value={pendingTasks} icon={Clock} color="accent-red" />
            <StatsCard title="Taxa de Conclusão" value={`${completionRate}%`} icon={TrendingUp} color="accent-brand-light" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <Text variant="heading-medium" className="text-heading mb-2">Suas Tarefas</Text>
            <div className="flex flex-col md:flex-row gap-2">
              <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="flex items-center gap-2">
                <Plus size={16} /> Nova Tarefa
              </Button>
              <Button onClick={() => setIsCreateGroupOpen(true)} variant="primary" className="flex items-center gap-2">
                <Plus size={16} /> Novo Grupo
              </Button>
            </div>
          </div>

          {totalTasks === 0 && (
            <Card className="p-8 text-center" floating>
              <Text variant="heading-small" className="mb-2">Você ainda não tem tarefas</Text>
              <Text variant="paragraph-small" className="text-accent-paragraph mb-4">
                Crie sua primeira tarefa para começar a organizar suas atividades.
              </Text>
              <div className="flex justify-center">
                <Button onClick={() => setIsCreateOpen(true)} variant="primary">Criar primeira tarefa</Button>
              </div>
            </Card>
          )}

          {/* Agrupamento visual por grupo */}
          {Object.entries(todosGrouped).map(([groupId, groupTodos]) => {
            const groupName = groups.find(g => g.id === groupId)?.name ?? "Sem grupo";
            return (
              <div key={groupId} className="mb-8">
                <Text variant="heading-small" className="text-heading mb-4">
                  {groupName} ({groupTodos.length})
                </Text>
                <TaskList todos={groupTodos} isLoading={todosLoading} onDeleted={() => { refetch?.(); refetchGroups?.(); }} onUpdated={() => { refetch?.(); refetchGroups?.(); }}  onSelect={(todo) => setSelectedTodo(todo)}/>
              </div>
            );
          })}

          <NewTaskModal
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={() => { refetch?.(); refetchGroups?.(); }}
          />
          <NewUserGroupForm
            open={isCreateGroupOpen}
            onClose={() => setIsCreateGroupOpen(false)}
            onCreated={() => { refetch?.(); refetchGroups?.(); }}
          />
          <TaskInfo
            open={!!selectedTodo}
            onClose={() => setSelectedTodo(null)}
            onCreated={() => { refetch?.(); refetchGroups?.(); }}
            todo={selectedTodo!}
          />
        </Card>
      </div>
    </div>
  );
}
