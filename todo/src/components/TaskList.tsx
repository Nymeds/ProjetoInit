import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { RefreshCw } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import TaskCard from "./TaskCard";
import type { Todo } from "../hooks/useTodos";

interface Props {
  todos?: Todo[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onDelete?: (id: number | string) => Promise<unknown> | void;
  onToggle?: (id: number | string) => Promise<unknown> | void;
  onSelect?: (todo: Todo) => void;
}

export default function TaskList({ todos, loading, onRefresh, onDelete, onToggle, onSelect }: Props) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (!onRefresh) return;

    setRefreshing(true);

    const timeout = new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));

    try {
      await Promise.race([Promise.resolve(onRefresh()), timeout]);
    } catch (err) {
      console.error("Erro no refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Suas tarefas</Text>
        {onRefresh && (
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={refreshing || loading}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      )}

      {!loading && !todos?.length && (
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Text style={{ color: colors.text }}>Nenhuma tarefa encontrada</Text>
        </View>
      )}

      <FlatList
        data={todos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TaskCard
            todo={item}
            onDelete={onDelete}
            onToggle={onToggle}
            onPress={() => onSelect?.(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});
