import React from "react";
import { Modal, View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import CreateGroupForm from "./CreateGroupForm";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (
    payload: { name: string; description?: string; userEmails: string[] }
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function CreateGroupModal({ visible, onClose, onCreateGroup }: Props) {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useAuth();

  if (userLoading) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  if (!user) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <CreateGroupForm
            onCreateGroup={onCreateGroup}
            onCancel={onClose}
            onSuccess={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
  },
  modal: { width: "90%", padding: 20, borderRadius: 12, maxHeight: "80%" },
});
