import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTodos } from "../../hooks/useTodos";
import { useGroups } from "../../hooks/useGroups";
import DashboardHeader from "../../components/DashboardHeader";
import StatsRow from "../../components/StatsRow";
import TaskList from "../../components/TaskList";
import FabMenu from "../../components/FabMenu";
import type { Todo } from "../../hooks/useTodos";

export default function Home() {
  const { todos, loading: todosLoading, addTodo, removeTodo, toggleComplete, loadTodos } = useTodos();
  const { groups, loading: groupsLoading, fetchGroups, addGroup } = useGroups();
  const { colors } = useTheme();
  const c = colors as any;


  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;


  const todosWithGroups: Todo[] = useMemo(() => {
    const groupList = Array.isArray(groups) ? groups : [];
    return todos.map(todo => {
      const possibleGroupId =
        (todo as any).group && typeof (todo as any).group === "object" && (todo as any).group.id
          ? (todo as any).group.id
          : typeof (todo as any).group === "string"
          ? (todo as any).group
          : (todo as any).groupId ?? null;

      const found = possibleGroupId ? groupList.find(g => g.id === possibleGroupId) : undefined;

      const finalGroup =
        (todo as any).group && typeof (todo as any).group === "object" && (todo as any).group.name
          ? (todo as any).group
          : found
          ? { id: found.id, name: found.name }
          : undefined;

      return { ...todo, group: finalGroup };
    });
  }, [todos, groups]);


  async function handleCreateTodo(payload: { title: string; description?: string; groupId?: string }) {
    await addTodo(payload);
    await loadTodos(); 
  }


  async function handleCreateGroup(payload: { name: string; description?: string; userEmails: string[] }) {
    try {
      await addGroup(payload);
      await fetchGroups();
    } catch (err) {
      throw err;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <DashboardHeader />
      <StatsRow total={total} completed={completed} pending={pending} completionRate={completionRate} />
      <TaskList
        todos={todosWithGroups}
        loading={todosLoading || groupsLoading}
        onDelete={removeTodo}
        onToggle={toggleComplete}
        onRefresh={loadTodos} 
      />
      {!groupsLoading && (
        <FabMenu onCreateTodo={handleCreateTodo} onCreateGroup={handleCreateGroup} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
