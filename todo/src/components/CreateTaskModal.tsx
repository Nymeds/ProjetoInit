import React, { useState, useEffect } from "react";
import {
  Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { getGroups } from "../services/groups";

export interface Group {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description?: string; groupId?: string }) => Promise<void>;
}

export default function CreateTaskModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const data = await getGroups();
        if (mounted) setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar grupos:", err);
        if (mounted) setGroups([]);
      } finally {
        if (mounted) setLoadingGroups(false);
      }
    };

    fetchGroups();
    return () => {
      mounted = false;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
      setSelectedGroup(undefined);
      setGroups([]);
    }
  }, [visible]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoadingCreate(true);
    try {
      await onCreate({ title, description, groupId: selectedGroup });
     
      onClose();
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Adicionar Tarefa</Text>

          <TextInput
            placeholder="Título"
            placeholderTextColor={colors.border}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <TextInput
            placeholder="Descrição"
            placeholderTextColor={colors.border}
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecionar grupo:</Text>

          {loadingGroups ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView style={{ maxHeight: 150, marginVertical: 8 }}>
              <TouchableOpacity
                key="no-group"
                style={[
                  styles.groupOption,
                  {
                    backgroundColor: selectedGroup === undefined ? colors.primary : colors.card,
                    borderColor: selectedGroup === undefined ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedGroup(undefined)}
              >
                <Text style={{ color: selectedGroup === undefined ? "#fff" : colors.text, fontWeight: selectedGroup === undefined ? "700" : "400" }}>
                  Sem grupo
                </Text>
              </TouchableOpacity>

              {groups.map((g) => {
                const selected = selectedGroup === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.groupOption,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedGroup(g.id)}
                  >
                    <Text style={{ color: selected ? "#fff" : colors.text, fontWeight: selected ? "700" : "400" }}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={loadingCreate}>
              <Text style={{ color: colors.notification, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loadingCreate}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                {loadingCreate ? "Criando..." : "Adicionar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { width: "85%", padding: 20, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8, marginBottom: 4 },
  groupOption: { padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, justifyContent: "center" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
});
