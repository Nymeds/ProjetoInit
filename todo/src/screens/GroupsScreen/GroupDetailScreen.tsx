import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, useTheme, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TaskCard from "../../components/TaskCard";
import { useTodos } from "../../hooks/useTodos";
import type { GroupsStackParamList } from "../../navigation/GroupStack";

export default function GroupDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<GroupsStackParamList, "GroupDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<GroupsStackParamList, "GroupDetail">>();
  const { todos, loading, loadTodos, removeTodo, toggleComplete } = useTodos();

  const group = route.params?.group;
  const groupId = group?.id;

  const groupTodos = useMemo(() => {
    return todos.filter((todo) => {
      const todoGroupId = todo.groupId ?? todo.group?.id;
      return todoGroupId === groupId;
    });
  }, [todos, groupId]);

  if (!group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Grupo nao encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("GroupChat", { groupId: group.id, groupName: group.name })}
        >
          <Text style={{ color: colors.primary }}>Chat</Text>
        </TouchableOpacity>
      </View>

      {group.description && (
        <View style={[styles.section, { borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Descricao</Text>
          <Text style={{ color: colors.text, marginTop: 6 }}>{group.description}</Text>
        </View>
      )}

      <View style={[styles.section, { borderColor: colors.border }]}> 
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Membros</Text>
          <Text style={{ color: colors.text, opacity: 0.7 }}>
            {group.members?.length ?? 0} {group.members?.length === 1 ? "membro" : "membros"}
          </Text>
        </View>

        <FlatList
          data={group.members ?? []}
          keyExtractor={(member) => member.user.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <View style={[styles.member, { borderColor: colors.border }]}> 
              <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}> 
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {item.user.name
                    ? item.user.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "?"}
                </Text>
              </View>
              <Text style={{ color: colors.text, marginTop: 6, fontWeight: "600" }}>{item.user.name}</Text>
              <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12 }}>{item.user.email}</Text>
            </View>
          )}
        />
      </View>

      <View style={[styles.section, { borderColor: colors.border, flex: 1 }]}> 
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarefas</Text>
          <Text style={{ color: colors.text, opacity: 0.7 }}>{groupTodos.length}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groupTodos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTodos} />}
            renderItem={({ item }) => (
              <TaskCard
                todo={item}
                onDelete={removeTodo}
                onToggle={toggleComplete}
              />
            )}
            ListEmptyComponent={
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.text, opacity: 0.8 }}>Nenhuma tarefa neste grupo.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 18, fontWeight: "700" },
  section: { padding: 12, borderWidth: 1, borderRadius: 10, marginHorizontal: 12, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  member: { width: 140, marginRight: 12, padding: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
});
