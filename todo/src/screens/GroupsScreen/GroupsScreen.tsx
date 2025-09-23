import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useTheme, useNavigation } from "@react-navigation/native";
import { useGroups } from "../../hooks/useGroups";
import CreateGroupModal from "../../components/CreateGroupModal";
import { Trash2 } from "lucide-react-native";

function initials(name = "") {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const avatarColors = [
  "#66eae1",
  "#667eea",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
];

function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

export default function GroupsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { groups, loading, fetchGroups, addGroup } = useGroups();

  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  async function handleCreateGroup(payload: { name: string; description?: string; userEmails: string[] }) {
    await addGroup(payload);
    setIsModalOpen(false);
  }

  function confirmDeleteGroup(group: { id: string; name: string }) {
    Alert.alert("Deletar grupo", `Deseja deletar "${group.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            // chame aqui o serviço real de delete (ex: await deleteGroup(group.id))
            // depois faça fetchGroups() para atualizar a lista
            await fetchGroups(); // placeholder: troca por delete + refetch
          } catch (err) {
            console.error("Erro ao deletar grupo:", err);
            Alert.alert("Erro", "Não foi possível deletar o grupo");
          }
        },
      },
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await fetchGroups();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={{ color: colors.primary }}>Voltar</Text>
                </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.text }]}>Grupos</Text>
        <TouchableOpacity
          style={[styles.createBtn, { borderColor: colors.border }]}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={{ color: colors.primary, fontWeight: "600" }}>Criar Grupo</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar grupos..."
          placeholderTextColor={colors.border}
          style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>Você ainda não participa de nenhum grupo.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("GroupDetail", { group: item })}
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}>
                <Text style={styles.avatarText}>{initials(item.name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.text, opacity: 0.7, marginTop: 4 }}>
                  {item.members?.length ?? 0} {item.members?.length === 1 ? "membro" : "membros"}
                </Text>
                {item.description ? (
                  <Text style={{ color: colors.text, opacity: 0.7, marginTop: 6 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View style={styles.rightActions}>
                <TouchableOpacity onPress={() => confirmDeleteGroup(item)} style={{ padding: 8 }}>
                  <Trash2 size={18} color={colors.notification ?? colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Create Group Modal */}
      <CreateGroupModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} onCreateGroup={handleCreateGroup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 20, fontWeight: "700" },
  createBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderRadius: 10, padding: 10 },
  empty: { margin: 16, padding: 20, borderWidth: 1, borderRadius: 10, alignItems: "center" },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700" },
  groupName: { fontSize: 16, fontWeight: "700" },
  rightActions: { marginLeft: 8 },
});
