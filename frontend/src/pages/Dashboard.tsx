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
import TaskInfo from '../components/buildedComponents/TaskInfo';
import { GroupSidebar } from '../components/buildedComponents/GroupSidebar';
import { BarChart3, CheckCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { Text } from '../components/baseComponents/text';
import Card from '../components/baseComponents/card';
import { Button } from '../components/baseComponents/button';
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
    return todos.map((todo: any) => {
      const group = groups.find((g: any) => g.id === todo.groupId);
      return {
        ...todo,
        group: group || null
      };
    });
  }, [todos, groups]);

  // Agrupa tarefas por grupo - CORRIGIDO
  const todosGrouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    
    todosWithGroup.forEach((todo: any) => {
      // Use o ID do grupo se existir, senão use 'sem-grupo'
      const groupKey = todo.group?.id || 'sem-grupo';
      
      if (!map[groupKey]) {
        map[groupKey] = [];
      }
      map[groupKey].push(todo);
    });
    
    return map;
  }, [todosWithGroup]);

  // Função para obter o nome do grupo - CORRIGIDA
  const getGroupName = (groupId: string) => {
    if (groupId === 'sem-grupo') {
      return 'Sem grupo';
    }
    const group = groups.find((g: any) => g.id === groupId);
    return group?.name || 'Grupo não encontrado';
  };

  // Estatísticas gerais
  const totalTasks = todosWithGroup.length;
  const completedTasks = todosWithGroup.filter((todo: any) => todo.completed).length;
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
   <div className="min-h-screen flex bg-background-primary text-label font-sans">
  {/* Sidebar fixa */}
  <div className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed top-0 left-0 h-full bg-background-secondary/30 border-r border-border-primary">
    <div className="p-1">
      <GroupSidebar />
    </div>
  </div>

  {/* Conteúdo principal */}
  <div className="flex-1 lg:ml-64">
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* Header Card */}
      <Card className="bg-background-quaternary border border-border-primary">
        <div className="p-6">
          <DashboardHeader user={user} onLogout={handleLogout} />
        </div>
      </Card>

      {/* Seção Resumo */}
      <Card className="bg-background-quaternary border border-border-primary">
        <div className="p-8">
          {/* Título da seção */}
          <div className="text-center mb-8">
            <Text variant="heading-medium" className="text-heading mb-2">
              Resumo das Atividades
            </Text>
            <Text variant="paragraph-medium" className="text-accent-paragraph">
              Acompanhe seu progresso e produtividade
            </Text>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total de Tarefas" 
              value={totalTasks} 
              icon={BarChart3} 
            />
            <StatsCard 
              title="Concluídas" 
              value={completedTasks} 
              icon={CheckCircle} 
              color="accent-brand" 
            />
            <StatsCard 
              title="Pendentes" 
              value={pendingTasks} 
              icon={Clock} 
              color="accent-red" 
            />
            <StatsCard 
              title="Taxa de Conclusão" 
              value={`${completionRate}%`} 
              icon={TrendingUp} 
              color="accent-brand-light" 
            />
          </div>
        </div>
      </Card>

      {/* Seção Tarefas */}
      <Card className="bg-background-quaternary border border-border-primary">
        <div className="p-8">
          {/* Header da seção tarefas */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <Text variant="heading-medium" className="text-heading">
                Suas Tarefas
              </Text>
              <Text variant="paragraph-small" className="text-accent-paragraph mt-1">
                Gerencie suas atividades por grupo
              </Text>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                variant="primary" 
                className="flex items-center justify-center gap-2 px-4 py-2"
              >
                <Plus size={16} /> Nova Tarefa
              </Button>
              <Button 
                onClick={() => setIsCreateGroupOpen(true)} 
                variant="primary" 
                className="flex items-center justify-center gap-2 px-4 py-2"
              >
                <Plus size={16} /> Novo Grupo
              </Button>
            </div>
          </div>

          {/* Estado vazio */}
          {totalTasks === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-accent-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-accent-brand" />
                </div>
                <Text variant="heading-small" className="text-heading mb-2">
                  Você ainda não tem tarefas
                </Text>
                <Text variant="paragraph-medium" className="text-accent-paragraph mb-6">
                  Crie sua primeira tarefa para começar a organizar suas atividades.
                </Text>
                <Button 
                  onClick={() => setIsCreateOpen(true)} 
                  variant="primary"
                  className="px-6 py-3"
                >
                  Criar primeira tarefa
                </Button>
              </div>
            </div>
          )}

          {/* Lista de tarefas agrupadas*/}
          {totalTasks > 0 && (
            <div className="space-y-8">
              {Object.entries(todosGrouped).map(([groupId, groupTodos]) => {
                const groupName = getGroupName(groupId);
                return (
                  <div key={groupId} className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-border-primary/50">
                      <Text variant="heading-small" className="text-heading font-semibold">
                        {groupName}
                      </Text>
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-accent-brand/10 text-accent-brand text-sm font-medium">
                        {groupTodos.length} {groupTodos.length === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                    </div>
                    
                    <TaskList
                      todos={groupTodos}
                      isLoading={todosLoading}
                      onDeleted={() => { refetch?.(); refetchGroups?.(); }}
                      onUpdated={() => { refetch?.(); refetchGroups?.(); }}
                      onSelect={(todo) => setSelectedTodo(todo)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  </div>

  {/* Modais */}
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
</div>
  );
}