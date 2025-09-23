import { View, FlatList, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from "react-native";
import TaskCard from "./TaskCard";
import type { Todo } from "../hooks/useTodos";
import { useTheme } from "@react-navigation/native";
import { RefreshCw } from "lucide-react-native";
import { useState } from "react";

interface Props {
  todos?: Todo[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onToggle?: (id: string) => Promise<void> | void;
  onSelect?: (todo: Todo) => void;
}

export default function TaskList({ todos, loading, onRefresh, onDelete, onToggle, onSelect }: Props) {
  const { colors } = useTheme();
  const c = colors as any;
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (!onRefresh) return;

    setRefreshing(true);

    
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => resolve(), 5000)
    );

    try {
      await Promise.race([onRefresh(), timeout]);
    } catch (err) {
      console.error("Erro no refresh:", err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Cabeçalho com título e refresh */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Suas tarefas</Text>
        {onRefresh && (
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={refreshing || loading}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <RefreshCw size={20} color={c.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Loading inicial */}
      {loading && !refreshing && (
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 20 }} />
      )}

      {/* Nenhuma tarefa */}
      {!loading && !todos?.length && (
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Text style={{ color: c.text }}>Nenhuma tarefa encontrada</Text>
        </View>
      )}

      {/* Lista de tarefas */}
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
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
