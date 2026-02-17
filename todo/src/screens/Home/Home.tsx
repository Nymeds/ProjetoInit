import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useGroups } from "../../hooks/useGroups";
import { useTodos, type Todo } from "../../hooks/useTodos";
import DashboardHeader from "../../components/DashboardHeader";
import ElisaAssistant from "../../components/ElisaAssistant";
import FabMenu from "../../components/FabMenu";
import StatsRow from "../../components/StatsRow";
import TaskDetailModal from "../../components/TaskDetailModal";
import TaskList from "../../components/TaskList";

export default function Home() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const { todos, loading: todosLoading, addTodo, removeTodo, toggleComplete, loadTodos } = useTodos({
    enabled: !!user,
  });

  const { groups, loading: groupsLoading, fetchGroups, addGroup } = useGroups({
    enabled: !!user,
  });

  const todosWithGroups: Todo[] = useMemo(() => {
    return todos.map((todo) => {
      const group = groups.find((item) => item.id === (todo.groupId ?? todo.group?.id));
      return {
        ...todo,
        group: group ? { id: group.id, name: group.name } : todo.group ?? null,
      };
    });
  }, [groups, todos]);

  const total = todosWithGroups.length;
  const completed = todosWithGroups.filter((todo) => Boolean(todo.completed)).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleCreateTodo(payload: { title: string; description?: string; groupId?: string }) {
    await addTodo(payload);
  }

  async function handleCreateGroup(payload: { name: string; description?: string; userEmails: string[] }) {
    await addGroup(payload);
  }

  async function refreshAll() {
    await Promise.all([loadTodos(), fetchGroups()]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DashboardHeader />

      <StatsRow total={total} completed={completed} pending={pending} completionRate={completionRate} />

      <TaskList
        todos={todosWithGroups}
        loading={todosLoading || groupsLoading}
        onDelete={removeTodo}
        onToggle={toggleComplete}
        onRefresh={refreshAll}
        onSelect={(todo) => setSelectedTodo(todo)}
      />

      {!groupsLoading && (
        <FabMenu onCreateTodo={handleCreateTodo} onCreateGroup={handleCreateGroup} />
      )}

      <TaskDetailModal
        visible={!!selectedTodo}
        todo={selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onUpdated={refreshAll}
      />

      <ElisaAssistant onAction={refreshAll} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
