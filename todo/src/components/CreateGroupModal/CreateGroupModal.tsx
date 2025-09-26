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
  onSave?: (users: string[]) => void;
  validateUser?: (value: string) => boolean;
}

export default function CreateGroupModal({
  visible,
  onClose,
  onCreateGroup,
  onSave,
  validateUser,
}: Props) {
  const { colors } = useTheme();
  const { loading: userLoading, user } = useAuth();

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <CreateGroupForm
            onCreateGroup={onCreateGroup}
            onCancel={onClose}
            onSave={onSave}
            validateUser={validateUser}
            onSuccess={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 8,
    padding: 8,
    maxHeight: "80%",
    overflow: "hidden",
  },
});