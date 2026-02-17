import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle, Trash2 } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import type { Todo } from "../hooks/useTodos";

const completedColors = {
  light: "#d9f2e6",
  dark: "#040d18",
};

interface Props {
  todo: Todo;
  onDelete?: (id: number | string) => Promise<unknown> | void;
  onToggle?: (id: number | string) => Promise<unknown> | void;
  onPress?: () => void;
}

export default function TaskCard({ todo, onDelete, onToggle, onPress }: Props) {
  const { colors } = useTheme();

  const [completed, setCompleted] = useState(Boolean(todo.completed));
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setCompleted(Boolean(todo.completed));
  }, [todo.completed]);

  const groupName = useMemo(() => {
    return todo.group?.name ?? "Sem grupo";
  }, [todo.group?.name]);

  const confirmDelete = () => {
    Alert.alert("Confirmar", "Deseja excluir esta tarefa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await onDelete?.(todo.id);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleToggle = async () => {
    if (completed) return;

    try {
      setUpdating(true);
      setCompleted(true);
      await onToggle?.(todo.id);
    } catch {
      setCompleted(Boolean(todo.completed));
    } finally {
      setUpdating(false);
    }
  };

  const isDark = colors.background === "#040d18";
  const backgroundCompleted = completed ? (isDark ? completedColors.dark : completedColors.light) : colors.card;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: backgroundCompleted, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.groupBadge, { backgroundColor: colors.primary + "33" }]}>
        {deleting || updating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.groupText, { color: colors.primary }]}>{groupName}</Text>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }, completed && styles.completedText]}>{todo.title}</Text>

      {todo.description && (
        <Text style={[styles.description, { color: colors.text }, completed && styles.completedText]} numberOfLines={3}>
          {todo.description}
        </Text>
      )}

      <Text style={[styles.status, { color: completed ? "#28a745" : "#ffc107" }]}>
        {completed ? "Concluida" : "Pendente"}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={confirmDelete} disabled={deleting}>
          <Trash2 size={22} color={colors.notification} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggle}
          disabled={updating || completed}
          style={{ marginLeft: 16, opacity: completed ? 0.4 : 1 }}
        >
          <CheckCircle size={22} color={completed ? "#28a745" : colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginVertical: 6 },
  completedText: { textDecorationLine: "line-through", opacity: 0.6 },
  groupBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  groupText: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "600" },
  description: { marginTop: 6, fontSize: 14 },
  status: { marginTop: 10, fontWeight: "500" },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
});
