import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { CheckCircle, Trash2 } from "lucide-react-native";
import type { Todo } from "../hooks/useTodos";
import { useTheme } from "@react-navigation/native";
import { getGroups } from "../services/groups";

const completedColors = {
  light: "#d9f2e6",
  dark: "#040d18",
};

interface Props {
  todo: Todo;
  onDelete?: (id: string) => Promise<void> | void;
  onToggle?: (id: string) => Promise<void> | void;
  onPress?: () => void;
}

export default function TaskCard({ todo, onDelete, onToggle, onPress }: Props) {
  const { colors } = useTheme();
  const c = colors as any;

  const [completed, setCompleted] = useState(todo.completed);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [groupName, setGroupName] = useState("Sem grupo");
  const [loadingGroup, setLoadingGroup] = useState(true);

  // Atualiza status do todo
  useEffect(() => {
    setCompleted(todo.completed);
  }, [todo.completed]);

  // Buscar nome do grupo com base no groupId
  useEffect(() => {
    let mounted = true;
    const fetchGroup = async () => {
      if (!todo.groupId) {
        setGroupName("Sem grupo");
        setLoadingGroup(false);
        return;
      }

      setLoadingGroup(true);
      try {
        const groups = await getGroups();
        const group = Array.isArray(groups) ? groups.find(g => g.id === todo.groupId) : null;
        if (mounted) setGroupName(group?.name ?? "Sem grupo");
      } catch {
        if (mounted) setGroupName("Sem grupo");
      } finally {
        if (mounted) setLoadingGroup(false);
      }
    };

    fetchGroup();
    return () => { mounted = false; };
  }, [todo.groupId]);

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
    if (completed) return; // não deixa voltar para pendente

    try {
      setUpdating(true);
      setCompleted(true); // só marca como concluída
      await onToggle?.(todo.id);
    } catch {
      setCompleted(todo.completed);
    } finally {
      setUpdating(false);
    }
  };

  const isDark = c.background === "#040d18";
  const backgroundCompleted = completed
    ? isDark
      ? completedColors.dark
      : completedColors.light
    : c.card;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: backgroundCompleted, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Grupo */}
      <View style={[styles.groupBadge, { backgroundColor: c.primary + "33" }]}>
        {loadingGroup ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : (
          <Text style={[styles.groupText, { color: c.primary }]}>{groupName}</Text>
        )}
      </View>

      {/* Título */}
      <Text style={[styles.title, { color: c.text }, completed && styles.completedText]}>
        {todo.title}
      </Text>

      {/* Descrição */}
      {todo.description && (
        <Text style={[styles.description, { color: c.text }, completed && styles.completedText]} numberOfLines={3}>
          {todo.description}
        </Text>
      )}

      {/* Status */}
      <Text style={[styles.status, { color: completed ? "#28a745" : "#ffc107" }]}>
        {completed ? "✅ Concluída" : "⏳ Pendente"}
      </Text>

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={confirmDelete} disabled={deleting}>
          <Trash2 size={22} color={c.notification ?? c.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggle}
          disabled={updating || completed}
          style={{ marginLeft: 16, opacity: completed ? 0.4 : 1 }}
        >
          <CheckCircle size={22} color={completed ? "#28a745" : c.primary} />
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
