import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Plus, Users, CheckSquare } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import CreateTaskModal from "./CreateTaskModal";
import CreateGroupModal from "./CreateGroupModal";

interface Props {
  onCreateTodo: (payload: { title: string; description?: string; groupId?: string }) => Promise<void>;
  onCreateGroup: (payload: { name: string; description?: string; userEmails: string[] }) => Promise<void>;
}

export default function FabMenu({ onCreateTodo, onCreateGroup }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  // Wrapper para enviar sucesso/falha ao modal
  const createGroupWrapper = async (payload: { name: string; description?: string; userEmails: string[] }) => {
    try {
      await onCreateGroup(payload); // função do Home
      return { success: true } as const;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Erro ao criar grupo";

      if (/não encontrado/i.test(msg) || /User not found/i.test(msg)) {
        const found = msg.match(/\b[A-Za-z0-9._%+-]+@[^\s@]+\.[A-Za-z]{2,}\b/g) ?? [];
        return { success: false, message: msg, invalidEmails: found } as const;
      }

      return { success: false, message: msg } as const;
    }
  };

  return (
    <>
      <View style={styles.container}>
        {open && (
          <>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.primary }]}
              onPress={() => { setOpen(false); setGroupModalVisible(true); }}
            >
              <Users size={22} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.notification }]}
              onPress={() => { setOpen(false); setTaskModalVisible(true); }}
            >
              <CheckSquare size={22} color="white" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setOpen(!open)}
        >
          <Plus size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CreateTaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onCreate={onCreateTodo}
      />

      <CreateGroupModal
        visible={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
        onCreateGroup={createGroupWrapper}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 30, right: 30, alignItems: "center" },
  fab: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, justifyContent: "center", alignItems: "center", elevation: 5 },
  optionButton: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 15, elevation: 4 },
});
