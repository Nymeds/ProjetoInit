/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTodos } from "../hooks/useTodos";
import { useGroups } from "../hooks/useGroups";
import { useChat } from "../hooks/useChat";
import { DashboardHeader } from "../components/buildedComponents/DashboardHeader";
import { TaskList } from "../components/buildedComponents/TaskList";
import NewTaskModal from "../components/buildedComponents/NewTaskModal";
import NewUserGroupForm from "../components/buildedComponents/NewUserGroup";
import TaskDrawer from "../components/buildedComponents/TaskDrawer";
import ElisaAssistant from "../components/buildedComponents/ElisaAssistant";
import { GroupSidebar } from "../components/buildedComponents/GroupSidebar";
import { UserSettingsModal } from "../components/buildedComponents/UserSettingsModal";
import { FriendsSidebar } from "../components/buildedComponents/FriendsSidebar";
import { Text } from "../components/baseComponents/text";
import Card from "../components/baseComponents/card";
import { Button } from "../components/baseComponents/button";
import type { Todo } from "../types/types";
import { DashboardStats } from "../components/buildedComponents/DashboardStats";
import { moveTodo } from "../api/todos";
import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  parseDashboardLayoutMode,
  type DashboardLayoutMode,
} from "../types/dashboard-layout";

export function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { data: todos = [], isLoading: todosLoading } = useTodos({ enabled: !!user });
  const { data: groups = [] } = useGroups();
  const { joinGroup, leaveGroup, on } = useChat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [draggingTodo, setDraggingTodo] = useState<Todo | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [gridPinnedGroupIds, setGridPinnedGroupIds] = useState<string[]>([]);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>(() => {
    if (typeof window === "undefined") return "comfortable";
    return parseDashboardLayoutMode(window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY));
  });

  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [statsFilter, setStatsFilter] = useState<boolean | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const isComfortableLayout = layoutMode === "comfortable";
  const surfaceCardClass = isComfortableLayout
    ? "border border-border-primary/70 bg-background-secondary/80 shadow-[0_20px_42px_rgba(15,23,42,0.25)] backdrop-blur-sm"
    : "border border-border-primary bg-background-quaternary";

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const invalidateTodosAndGroups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    const groupIds = groups.map((group: any) => group.id).filter(Boolean);
    if (groupIds.length === 0) return;

    groupIds.forEach((groupId: string) => joinGroup(groupId));

    const offGroupMessage = on("group:message", () => {
      invalidateTodosAndGroups();
    });

    return () => {
      offGroupMessage();
      groupIds.forEach((groupId: string) => leaveGroup(groupId));
    };
  }, [user, groups, joinGroup, leaveGroup, on, invalidateTodosAndGroups]);

  const todosWithGroup = useMemo(() => {
    return todos.map((todo: any) => {
      const group = groups.find((item: any) => item.id === todo.groupId);
      return {
        ...todo,
        group: group ? { id: group.id, name: group.name } : undefined,
      } as Todo;
    });
  }, [todos, groups]);

  const todosGrouped = useMemo<Record<string, Todo[]>>(() => {
    const map: Record<string, Todo[]> = {};

    todosWithGroup.forEach((todo) => {
      const groupKey = todo.group?.id || "sem-grupo";
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(todo);
    });

    return map;
  }, [todosWithGroup]);

  const groupEntries = useMemo<Array<[string, Todo[]]>>(() => {
    const map = new Map<string, Todo[]>();

    Object.entries(todosGrouped).forEach(([id, list]) => {
      map.set(id, list);
    });

    gridPinnedGroupIds.forEach((id) => {
      if (!map.has(id)) map.set(id, []);
    });

    const ordered: Array<[string, Todo[]]> = [];
    const used = new Set<string>();

    groups.forEach((group: any) => {
      if (map.has(group.id)) {
        ordered.push([group.id, map.get(group.id) ?? []]);
        used.add(group.id);
      }
    });

    if (map.has("sem-grupo")) {
      ordered.push(["sem-grupo", map.get("sem-grupo") ?? []]);
      used.add("sem-grupo");
    }

    for (const [id, list] of map.entries()) {
      if (!used.has(id)) ordered.push([id, list]);
    }

    return ordered;
  }, [todosGrouped, gridPinnedGroupIds, groups]);

  const totalTasks = todosWithGroup.length;
  const completedTasks = todosWithGroup.filter((todo) => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    if (!selectedTodo) return;
    const found = todosWithGroup.find((todo) => todo.id === selectedTodo.id);
    if (!found) setSelectedTodo(null);
  }, [todosWithGroup, selectedTodo]);

  function triggerHighlight(filter: boolean | null) {
    setStatsFilter(filter);
    setHighlightCompleted(true);

    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightCompleted(false);
      setStatsFilter(null);
      highlightTimerRef.current = null;
    }, 3000);
  }

  function getGroupName(groupId: string) {
    if (groupId === "sem-grupo") return "Sem grupo";
    const group = groups.find((item: any) => item.id === groupId);
    return group?.name || "Grupo nao encontrado";
  }

  function toggleGroupPinned(groupId: string) {
    setGridPinnedGroupIds((prev) => (
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    ));
  }

  function handleDragStart(event: ReactDragEvent<HTMLDivElement>, todo: Todo) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(todo.id));
    setDraggingTodo(todo);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverGroupId !== groupId) setDragOverGroupId(groupId);
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    if (dragOverGroupId === groupId) setDragOverGroupId(null);
  }

  async function handleDrop(event: ReactDragEvent<HTMLDivElement>, groupId: string) {
    event.preventDefault();
    setDragOverGroupId(null);

    const idFromData = event.dataTransfer.getData("text/plain");
    const todo = draggingTodo || todosWithGroup.find((item) => String(item.id) === idFromData);
    if (!todo) return;

    const targetGroupId = groupId === "sem-grupo" ? null : groupId;
    const currentGroupId = todo.group?.id ?? null;
    if (currentGroupId === targetGroupId) return;

    try {
      await moveTodo(String(todo.id), targetGroupId, todo.title);
      invalidateTodosAndGroups();
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    } finally {
      setDraggingTodo(null);
    }
  }

  function handleLogout() {
    queryClient.clear();
    logout();
    navigate("/login");
  }

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-primary">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent-brand border-t-transparent" />
          <Text variant="heading-medium" className="text-heading">
            Carregando usuario...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-label">
      <div className="flex min-h-screen">
        {showSidebar ? (
          <div className="fixed left-0 top-0 hidden h-full w-64 flex-shrink-0 border-r border-border-primary bg-background-secondary/30 lg:flex">
            <div className="w-full p-1">
              <GroupSidebar
                onHide={() => setShowSidebar(false)}
                gridPinnedGroupIds={gridPinnedGroupIds}
                onToggleGroupPinned={toggleGroupPinned}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="fixed left-4 top-4 z-50 rounded-md bg-background-quaternary px-3 py-2 shadow-md lg:hidden"
            onClick={() => setShowSidebar(true)}
          >
            Mostrar grupos
          </button>
        )}

        <div className={`flex-1 transition-all duration-300 ${showSidebar ? "lg:ml-64" : ""}`}>
          <div className={`mx-auto px-4 py-6 sm:px-6 xl:px-8 ${isComfortableLayout ? "max-w-[1750px]" : "max-w-7xl"}`}>
            <div className={`grid grid-cols-1 gap-6 ${isComfortableLayout ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : "xl:grid-cols-[minmax(0,1fr)_20rem]"}`}>
              <div className={isComfortableLayout ? "space-y-6" : "space-y-8"}>
                <Card className={surfaceCardClass}>
                  <div className={isComfortableLayout ? "p-6 xl:p-8" : "p-6"}>
                    <DashboardHeader
                      user={user}
                      onLogout={handleLogout}
                      layoutMode={layoutMode}
                      onChangeLayout={setLayoutMode}
                      onSummaryClick={() => triggerHighlight(null)}
                      onToggleSidebar={() => setShowSidebar((current) => !current)}
                      onOpenProfileSettings={() => setIsUserSettingsOpen(true)}
                      statsContent={(
                        <DashboardStats
                          total={totalTasks}
                          completed={completedTasks}
                          pending={pendingTasks}
                          completionRate={completionRate}
                          onHighlight={triggerHighlight}
                          activeFilter={statsFilter}
                          isHighlightActive={highlightCompleted}
                        />
                      )}
                    />
                  </div>
                </Card>

                <Card className={surfaceCardClass}>
                  <div className={isComfortableLayout ? "p-6 xl:p-8" : "p-8"}>
                    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <Text variant="heading-medium" className="text-heading">
                          Suas tarefas
                        </Text>
                        <Text variant="paragraph-small" className="mt-1 text-accent-paragraph">
                          Gerencie suas atividades por grupo.
                        </Text>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => setIsCreateOpen(true)}
                          variant="primary"
                          className="flex items-center justify-center gap-2 px-4 py-2"
                        >
                          <Plus size={16} />
                          Nova tarefa
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setIsCreateGroupOpen(true)}
                          variant="primary"
                          className="flex items-center justify-center gap-2 px-4 py-2"
                        >
                          <Plus size={16} />
                          Novo grupo
                        </Button>
                      </div>
                    </div>

                    {totalTasks === 0 && (
                      <div className="py-12 text-center">
                        <div className="mx-auto max-w-md">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-brand/10">
                            <BarChart3 className="h-8 w-8 text-accent-brand" />
                          </div>
                          <Text variant="heading-small" className="mb-2 text-heading">
                            Voce ainda nao tem tarefas
                          </Text>
                          <Text variant="paragraph-medium" className="mb-6 text-accent-paragraph">
                            Crie sua primeira tarefa para comecar.
                          </Text>
                          <Button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            variant="primary"
                            className="px-6 py-3"
                          >
                            Criar primeira tarefa
                          </Button>
                        </div>
                      </div>
                    )}

                    {totalTasks > 0 && (
                      <div className="space-y-8">
                        {groupEntries.map(([groupId, groupTodos]) => (
                          <div
                            key={groupId}
                            className={`space-y-4 rounded-2xl p-3 transition-colors ${
                              dragOverGroupId === groupId ? "bg-accent-brand/10 ring-2 ring-accent-brand/40" : ""
                            }`}
                            onDragOver={(event) => handleDragOver(event, groupId)}
                            onDragLeave={(event) => handleDragLeave(event, groupId)}
                            onDrop={(event) => handleDrop(event, groupId)}
                          >
                            <div className="flex items-center gap-3 border-b border-border-primary/50 pb-2">
                              <Text variant="heading-small" className="font-semibold text-heading">
                                {getGroupName(groupId)}
                              </Text>
                              <span className="inline-flex items-center justify-center rounded-full bg-accent-brand/10 px-3 py-1 text-sm font-medium text-accent-brand">
                                {groupTodos.length} {groupTodos.length === 1 ? "tarefa" : "tarefas"}
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
                              layoutMode={layoutMode}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <aside className="h-fit xl:sticky xl:top-6">
                <FriendsSidebar
                  layoutMode={layoutMode}
                  onOpenSettings={() => setIsUserSettingsOpen(true)}
                />
              </aside>
            </div>
          </div>
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
        key={selectedTodo?.id ?? "task-drawer-closed"}
        open={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onCreated={invalidateTodosAndGroups}
        todo={selectedTodo}
      />

      <ElisaAssistant onAction={invalidateTodosAndGroups} />

      <UserSettingsModal open={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
    </div>
  );
}
