/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { useGroups } from '../hooks/useGroups';
import { DashboardHeader } from '../components/buildedComponents/DashboardHeader';
import { TaskList } from '../components/buildedComponents/TaskList';
import NewTaskModal from '../components/buildedComponents/NewTaskModal';
import NewUserGroupForm from '../components/buildedComponents/NewUserGroup';
import TaskDrawer from '../components/buildedComponents/TaskDrawer';
import { GroupSidebar } from '../components/buildedComponents/GroupSidebar';
import { BarChart3, Plus } from 'lucide-react';
import { Text } from '../components/baseComponents/text';
import Card from '../components/baseComponents/card';
import { Button } from '../components/baseComponents/button';
import type { Todo } from '../types/types';
import { DashboardStats } from '../components/buildedComponents/DashboardStats';

export function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: todos, isLoading: todosLoading } = useTodos({ enabled: !!user });
  const { data: groups = [] } = useGroups();

  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  function invalidateTodosAndGroups() {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  const todosWithGroup = useMemo(() => {
    if (!todos) return [];
    return todos.map((todo: any) => {
      const group = groups.find((g: any) => g.id === todo.groupId);
      return { ...todo, group: group || null };
    });
  }, [todos, groups]);

  const todosGrouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    todosWithGroup.forEach((todo: any) => {
      const groupKey = todo.group?.id || 'sem-grupo';
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(todo)
    });
    return map;
  }, [todosWithGroup]);

  const getGroupName = (groupId: string) => {
    if (groupId === 'sem-grupo') return 'Sem grupo';
    const group = groups.find((g: any) => g.id === groupId);
    return group?.name || 'Grupo não encontrado';
  };

  const totalTasks = todosWithGroup.length;
  const completedTasks = todosWithGroup.filter((todo: any) => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todostotalTasks= todosWithGroup;
  const todosCompleted = todosWithGroup.filter((todo: any) => todo.completed)
  const todospendingTasks = todosWithGroup.filter((todo: any) => todo.pending)
  const [highlightCompleted, setHighlightCompleted] = useState(false);
   const triggerHighlight = () => {
    setHighlightCompleted(true);
    
    setTimeout(() => {
      setHighlightCompleted(false);
    }, 3000); // 3 segundos
  };
  useEffect(() => {
    if (!selectedTodo) return;
    const found = todosWithGroup.find((t: any) => t.id === selectedTodo.id);
    if (!found) setSelectedTodo(null);
  }, [todosWithGroup, selectedTodo]);

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
      {showSidebar ? (
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed top-0 left-0 h-full bg-background-secondary/30 border-r border-border-primary">
          <div className="p-1">
            <GroupSidebar onHide={() => setShowSidebar(false)} />
          </div>
        </div>
      ) : (
        <button className="fixed top-4 left-4 z-50 bg-background-quaternary p-2 rounded-md shadow-md lg:hidden" onClick={() => setShowSidebar(true)}>
          Mostrar grupos
        </button>
      )}

      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <Card className="bg-background-quaternary border border-border-primary">
            <div className="p-6">
              <DashboardHeader user={user} onLogout={handleLogout} onToggleSidebar={() => setShowSidebar((s) => !s)} />
            </div>
          </Card>

          <Card className="bg-background-quaternary border border-border-primary">
            <div className="p-8">
              <div className="text-center mb-8">
                <Text variant="heading-medium" className="text-heading mb-2">Resumo das Atividades</Text>
                <Text variant="paragraph-medium" className="text-accent-paragraph">Acompanhe seu progresso e produtividade</Text>
              </div>
              <div>  
                  <DashboardStats 
                  total={totalTasks} 
                  completed={completedTasks} 
                  pending={pendingTasks} 
                  completionRate={completionRate} 
                  todosCompleted={todosCompleted} 
                  todosPending={todospendingTasks}
                  todostotalTasks={todostotalTasks}
                  onHighlight={triggerHighlight}/>
              </div>
            </div>
          </Card>

          <Card className="bg-background-quaternary border border-border-primary">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                  <Text variant="heading-medium" className="text-heading">Suas Tarefas</Text>
                  <Text variant="paragraph-small" className="text-accent-paragraph mt-1">Gerencie suas atividades por grupo</Text>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="flex items-center justify-center gap-2 px-4 py-2">
                    <Plus size={16} /> Nova Tarefa
                  </Button>
                  <Button onClick={() => setIsCreateGroupOpen(true)} variant="primary" className="flex items-center justify-center gap-2 px-4 py-2">
                    <Plus size={16} /> Novo Grupo
                  </Button>
                </div>
              </div>

              {totalTasks === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-accent-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-accent-brand" />
                    </div>
                    <Text variant="heading-small" className="text-heading mb-2">Você ainda não tem tarefas</Text>
                    <Text variant="paragraph-medium" className="text-accent-paragraph mb-6">Crie sua primeira tarefa para começar.</Text>
                    <Button onClick={() => setIsCreateOpen(true)} variant="primary" className="px-6 py-3">Criar primeira tarefa</Button>
                  </div>
                </div>
              )}

              {totalTasks > 0 && (
                <div className="space-y-8">
                  {Object.entries(todosGrouped).map(([groupId, groupTodos]) => (
                    <div key={groupId} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-border-primary/50">
                        <Text variant="heading-small" className="text-heading font-semibold">{getGroupName(groupId)}</Text>
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-accent-brand/10 text-accent-brand text-sm font-medium">
                          {groupTodos.length} {groupTodos.length === 1 ? 'tarefa' : 'tarefas'}
                        </span>
                      </div>

                      <TaskList
                        todos={groupTodos}
                        isLoading={todosLoading}
                        onDeleted={invalidateTodosAndGroups}
                        onUpdated={invalidateTodosAndGroups}
                        onSelect={(todo) => setSelectedTodo(todo)}
                        highlightCompleted={highlightCompleted}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <NewTaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={invalidateTodosAndGroups}
      />

      <NewUserGroupForm
        open={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreated={invalidateTodosAndGroups}
      />

      <TaskDrawer
        key={selectedTodo?.id ?? 'task-drawer-closed'}
        open={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onCreated={invalidateTodosAndGroups}
        todo={selectedTodo}
      />
    </div>
  );
}

