/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, ChevronDown, ChevronRight, Plus } from "lucide-react";
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
import { Modal } from "../components/baseComponents/Modal";
import type { Todo } from "../types/types";
import { DashboardStats } from "../components/buildedComponents/DashboardStats";
import { moveTodo } from "../api/todos";

const MOVE_CONFIRMATION_STORAGE_KEY = "dashboard:skip-move-confirmation";
const PINNED_GROUPS_STORAGE_KEY = "dashboard:grid-pinned-group-ids";
const MINIMIZED_GROUPS_STORAGE_KEY = "dashboard:minimized-group-ids";

function readStoredStringArray(storageKey: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

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
  const [gridPinnedGroupIds, setGridPinnedGroupIds] = useState<string[]>(() => readStoredStringArray(PINNED_GROUPS_STORAGE_KEY));
  const [minimizedGroupIds, setMinimizedGroupIds] = useState<string[]>(() => readStoredStringArray(MINIMIZED_GROUPS_STORAGE_KEY));
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ todo: Todo; targetGroupId: string | null } | null>(null);
  const [isConfirmingMove, setIsConfirmingMove] = useState(false);
  const [skipMoveConfirmation, setSkipMoveConfirmation] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MOVE_CONFIRMATION_STORAGE_KEY) === "1";
  });
  const [dontAskMoveAgain, setDontAskMoveAgain] = useState(false);

  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [statsFilter, setStatsFilter] = useState<boolean | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const layoutMode = "comfortable";
  const surfaceCardClass = "border border-border-primary/70 bg-background-secondary/80 shadow-[0_20px_42px_rgba(15,23,42,0.25)] backdrop-blur-sm";

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PINNED_GROUPS_STORAGE_KEY, JSON.stringify(gridPinnedGroupIds));
  }, [gridPinnedGroupIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MINIMIZED_GROUPS_STORAGE_KEY, JSON.stringify(minimizedGroupIds));
  }, [minimizedGroupIds]);

  useEffect(() => {
    const validGroupIds = new Set(groups.map((group: any) => String(group.id)));

    setGridPinnedGroupIds((previous) => {
      const filtered = previous.filter((groupId) => validGroupIds.has(groupId));
      return filtered.length === previous.length ? previous : filtered;
    });

    setMinimizedGroupIds((previous) => {
      const filtered = previous.filter((groupId) => groupId === "sem-grupo" || validGroupIds.has(groupId));
      return filtered.length === previous.length ? previous : filtered;
    });
  }, [groups]);

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

    const shouldRenderNoGroupArea = todosWithGroup.length > 0 || groups.length > 0 || gridPinnedGroupIds.length > 0;
    if (shouldRenderNoGroupArea && !map.has("sem-grupo")) {
      map.set("sem-grupo", []);
    }

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
  }, [todosGrouped, gridPinnedGroupIds, groups, todosWithGroup.length]);

  const groupsById = useMemo(() => {
    const map = new Map<string, any>();
    groups.forEach((group: any) => map.set(group.id, group));
    return map;
  }, [groups]);

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
    if (groupId === "sem-grupo") return "Sem tarefas";
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

  function toggleGroupMinimized(groupId: string) {
    setMinimizedGroupIds((prev) => (
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

    const sourceGroup = currentGroupId ? groupsById.get(currentGroupId) : null;
    const sourceIsPrivateTask = currentGroupId === null;
    const sourceIsOutsideEcosystem = Boolean(
      sourceGroup
      && !sourceGroup.parentGroupId
      && (sourceGroup.childGroups?.length ?? 0) === 0,
    );

    const shouldConfirmMove = targetGroupId !== null && (sourceIsPrivateTask || sourceIsOutsideEcosystem);

    if (shouldConfirmMove && !skipMoveConfirmation) {
      setPendingMove({ todo, targetGroupId });
      setDraggingTodo(null);
      return;
    }

    try {
      await moveTodo(String(todo.id), targetGroupId, todo.title);
      invalidateTodosAndGroups();
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    } finally {
      setDraggingTodo(null);
    }
  }

  async function confirmPendingMove() {
    if (!pendingMove) return;

    try {
      setIsConfirmingMove(true);
      await moveTodo(String(pendingMove.todo.id), pendingMove.targetGroupId, pendingMove.todo.title);
      invalidateTodosAndGroups();

      if (dontAskMoveAgain && typeof window !== "undefined") {
        window.localStorage.setItem(MOVE_CONFIRMATION_STORAGE_KEY, "1");
        setSkipMoveConfirmation(true);
      }

      setPendingMove(null);
      setDontAskMoveAgain(false);
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
    } finally {
      setIsConfirmingMove(false);
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
          <div className="mx-auto max-w-[1750px] px-4 py-6 sm:px-6 xl:px-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-6">
                <Card className={surfaceCardClass}>
                  <div className="p-6 xl:p-8">
                    <DashboardHeader
                      user={user}
                      onLogout={handleLogout}
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
                  <div className="p-6 xl:p-8">
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

                    {totalTasks === 0 && groupEntries.length === 0 && (
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

                    {groupEntries.length > 0 && (
                      <div className="space-y-8">
                        {groupEntries.map(([groupId, groupTodos]) => {
                          const isGroupMinimized = minimizedGroupIds.includes(groupId);

                          return (
                            <div
                              key={groupId}
                              className={`rounded-2xl p-3 transition-colors ${
                                dragOverGroupId === groupId ? "bg-accent-brand/10 ring-2 ring-accent-brand/40" : ""
                              } ${isGroupMinimized ? "" : "space-y-4"}`}
                              onDragOver={(event) => handleDragOver(event, groupId)}
                              onDragLeave={(event) => handleDragLeave(event, groupId)}
                              onDrop={(event) => handleDrop(event, groupId)}
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-border-primary/50 pb-2">
                                <button
                                  type="button"
                                  onClick={() => toggleGroupMinimized(groupId)}
                                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-background-secondary/40"
                                  aria-expanded={!isGroupMinimized}
                                  aria-label={`${isGroupMinimized ? "Expandir" : "Minimizar"} ${getGroupName(groupId)}`}
                                >
                                  {isGroupMinimized ? (
                                    <ChevronRight className="h-4 w-4 text-accent-paragraph" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-accent-paragraph" />
                                  )}
                                  <Text variant="heading-small" className="font-semibold text-heading">
                                    {getGroupName(groupId)}
                                  </Text>
                                </button>
                                <span className="inline-flex items-center justify-center rounded-full bg-accent-brand/10 px-3 py-1 text-sm font-medium text-accent-brand">
                                  {groupTodos.length} {groupTodos.length === 1 ? "tarefa" : "tarefas"}
                                </span>
                              </div>

                              {isGroupMinimized ? (
                                <Text variant="paragraph-small" className="pt-2 text-accent-paragraph">
                                  Grupo minimizado. Clique para expandir.
                                </Text>
                              ) : (
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
                              )}
                            </div>
                          );
                        })}
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

      <Modal
        open={!!pendingMove}
        onClose={() => {
          if (isConfirmingMove) return;
          setPendingMove(null);
          setDontAskMoveAgain(false);
        }}
        title="Confirmar movimentacao"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <Text variant="paragraph-medium" className="text-accent-paragraph">
            Esta tarefa esta fora do ecossistema de grupos pai/filhos (ou esta sem grupo). Confirma mover mesmo assim?
          </Text>

          {pendingMove && (
            <div className="rounded-lg border border-border-primary/60 bg-background-secondary/60 p-3">
              <Text variant="label-small" className="text-heading">
                Tarefa: {pendingMove.todo.title}
              </Text>
              <Text variant="paragraph-small" className="text-accent-paragraph">
                Destino: {pendingMove.targetGroupId ? getGroupName(pendingMove.targetGroupId) : "Sem tarefas"}
              </Text>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-accent-paragraph">
            <input
              type="checkbox"
              checked={dontAskMoveAgain}
              onChange={(event) => setDontAskMoveAgain(event.target.checked)}
              disabled={isConfirmingMove}
            />
            Nao perguntar novamente
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPendingMove(null);
                setDontAskMoveAgain(false);
              }}
              disabled={isConfirmingMove}
            >
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={confirmPendingMove} disabled={isConfirmingMove}>
              {isConfirmingMove ? "Movendo..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
