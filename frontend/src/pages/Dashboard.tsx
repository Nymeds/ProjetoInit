/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useTodos } from '../hooks/useTodos';
import { useGroups } from '../hooks/useGroups';
import { useChat } from '../hooks/useChat';
import { DashboardHeader } from '../components/buildedComponents/DashboardHeader';
import { TaskList } from '../components/buildedComponents/TaskList';
import NewTaskModal from '../components/buildedComponents/NewTaskModal';
import NewUserGroupForm from '../components/buildedComponents/NewUserGroup';
import TaskDrawer from '../components/buildedComponents/TaskDrawer';
import ElisaAssistant from '../components/buildedComponents/ElisaAssistant';
import { GroupSidebar } from '../components/buildedComponents/GroupSidebar';
import { UserSettingsModal } from '../components/buildedComponents/UserSettingsModal';
import { BarChart3, Plus } from 'lucide-react';
import { Text } from '../components/baseComponents/text';
import Card from '../components/baseComponents/card';
import { Button } from '../components/baseComponents/button';
import type { Todo } from '../types/types';
import { DashboardStats } from '../components/buildedComponents/DashboardStats';
import { moveTodo } from '../api/todos';

export function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: todos, isLoading: todosLoading } = useTodos({ enabled: !!user });
  const { data: groups = [] } = useGroups();
  const { joinGroup, leaveGroup, on } = useChat();

  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [draggingTodo, setDraggingTodo] = useState<Todo | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [gridPinnedGroupIds, setGridPinnedGroupIds] = useState<string[]>([]);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  function invalidateTodosAndGroups() {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  useEffect(() => {
    if (!user) return;

    const groupIds = groups.map((g: any) => g.id).filter(Boolean);
    if (groupIds.length === 0) return;

    groupIds.forEach((groupId: string) => joinGroup(groupId));

    const offGroupMessage = on('group:message', () => {
      invalidateTodosAndGroups();
    });

    return () => {
      offGroupMessage();
      groupIds.forEach((groupId: string) => leaveGroup(groupId));
    };
  }, [user, groups, joinGroup, leaveGroup, on]);

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

  const groupEntries = useMemo(() => {
    const map = new Map<string, Todo[]>();
    Object.entries(todosGrouped).forEach(([id, list]) => {
      map.set(id, list as Todo[]);
    });
    gridPinnedGroupIds.forEach((id) => {
      if (!map.has(id)) map.set(id, []);
    });

    const ordered: Array<[string, Todo[]]> = [];
    const used = new Set<string>();

    groups.forEach((g: any) => {
      if (map.has(g.id)) {
        ordered.push([g.id, map.get(g.id)!]);
        used.add(g.id);
      }
    });

    if (map.has('sem-grupo')) {
      ordered.push(['sem-grupo', map.get('sem-grupo')!]);
      used.add('sem-grupo');
    }

    for (const [id, list] of map.entries()) {
      if (!used.has(id)) ordered.push([id, list]);
    }

    return ordered;
  }, [todosGrouped, gridPinnedGroupIds, groups]);

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
  const todospendingTasks = todosWithGroup.filter((todo: any) => todo.completed === false)
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [statsFilter, setStatsFilter] = useState<boolean | null>(null); // null = all, true = completed, false = pending
  const triggerHighlight = (filter: boolean | null) => {
  setStatsFilter(filter);
  setHighlightCompleted(true);
  
  setTimeout(() => {
    setHighlightCompleted(false);
    setStatsFilter(null);
  }, 3000);
};
  useEffect(() => {
    if (!selectedTodo) return;
    const found = todosWithGroup.find((t: any) => t.id === selectedTodo.id);
    if (!found) setSelectedTodo(null);
  }, [todosWithGroup, selectedTodo]);

  function toggleGroupPinned(id: string) {
    setGridPinnedGroupIds((prev) => (
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    ));
  }

  function handleDragStart(event: ReactDragEvent<HTMLDivElement>, todo: Todo) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(todo.id));
    setDraggingTodo(todo);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverGroupId !== groupId) setDragOverGroupId(groupId);
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    if (dragOverGroupId === groupId) setDragOverGroupId(null);
  }

  async function handleDrop(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    setDragOverGroupId(null);

    const idFromData = event.dataTransfer.getData('text/plain');
    const todo = draggingTodo || todosWithGroup.find((t: any) => String(t.id) === idFromData);
    if (!todo) return;

    const targetGroupId = groupId === 'sem-grupo' ? null : groupId;
    const currentGroupId = todo.group?.id ?? null;
    if (currentGroupId === targetGroupId) return;

    try {
      await moveTodo(String(todo.id), targetGroupId, todo.title);
      invalidateTodosAndGroups();
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
    } finally {
      setDraggingTodo(null);
    }
  }

  function handleLogout() {
    // Evita exibir dados em cache do usuario anterior apos novo login.
    queryClient.clear();
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
            <GroupSidebar
              onHide={() => setShowSidebar(false)}
              gridPinnedGroupIds={gridPinnedGroupIds}
              onToggleGroupPinned={toggleGroupPinned}
            />
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
              <DashboardHeader
                user={user}
                onLogout={handleLogout}
                onToggleSidebar={() => setShowSidebar((s) => !s)}
                onOpenProfileSettings={() => setIsUserSettingsOpen(true)}
              />
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
                  {groupEntries.map(([groupId, groupTodos]) => (
                    <div
                      key={groupId}
                      className={`space-y-4 rounded-2xl p-3 transition-colors ${
                        dragOverGroupId === groupId ? 'bg-accent-brand/10 ring-2 ring-accent-brand/40' : ''
                      }`}
                      onDragOver={(event) => handleDragOver(event, groupId)}
                      onDragLeave={(event) => handleDragLeave(event, groupId)}
                      onDrop={(event) => handleDrop(event, groupId)}
                    >
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
                      onDragStart={handleDragStart}
                      onSelect={(todo) => setSelectedTodo(todo)}
                      highlightCompleted={highlightCompleted}
                      statsFilter={statsFilter}
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
        onGoToAddFriends={() => {
          setIsCreateGroupOpen(false);
          setIsUserSettingsOpen(true);
        }}
      />

      <TaskDrawer
        key={selectedTodo?.id ?? 'task-drawer-closed'}
        open={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onCreated={invalidateTodosAndGroups}
        todo={selectedTodo}
      />

      {/* ELISA: botao flutuante no dashboard */}
      <ElisaAssistant onAction={invalidateTodosAndGroups} />

      <UserSettingsModal open={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
    </div>
  );
}

