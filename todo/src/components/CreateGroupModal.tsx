import React, { useEffect, useState } from "react";
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (payload: { name: string; description?: string; userEmails: string[] }) => Promise<{ success: boolean; message?: string }>;
}

export default function CreateGroupModal({ visible, onClose, onCreateGroup }: Props) {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [otherEmails, setOtherEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setGroupName("");
      setDescription("");
      setOtherEmails([]);
      setError(null);
      setInvalidEmails([]);
      setLoading(false);
    }
  }, [visible]);

  const extractEmailsFromString = (text: string) => {
    if (!text) return [];
    const re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    return text.match(re) ?? [];
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) { 
      setError("Nome do grupo é obrigatório"); 
      return; 
    }
    if (!user?.email) { 
      setError("Usuário não carregado ainda"); 
      return; 
    }

    setLoading(true);
    setError(null);
    setInvalidEmails([]);

    const payload = {
      name: groupName.trim(),
      description: description.trim() || undefined,
      userEmails: [user.email, ...otherEmails.filter((e) => e.trim() !== "")],
    };

    const result = await onCreateGroup(payload);

    if (result.success) {
      setGroupName("");
      setDescription("");
      setOtherEmails([]);
      onClose(); // fecha modal só no sucesso
    } else {
      let backendMsg = result.message || "Erro ao criar grupo";

      if (/não encontrado/i.test(backendMsg) || /User not found/i.test(backendMsg)) {
        const found = extractEmailsFromString(backendMsg);
        setInvalidEmails(found);
        backendMsg = `Algum dos emails informados não pertence a um usuário cadastrado. ${found.join(", ")}`;
      } else if (/unique constraint failed/i.test(backendMsg) || /Já existe/i.test(backendMsg)) {
        backendMsg = "Já existe um grupo com esse nome";
      }

      setError(backendMsg);
    }

    setLoading(false);
  };

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

  const hasError = !!error || invalidEmails.length > 0;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Novo Grupo</Text>

          <ScrollView>
            <TextInput
              placeholder="Nome do grupo"
              placeholderTextColor={colors.border}
              value={groupName}
              onChangeText={setGroupName}
              style={[styles.input, { color: colors.text, borderColor: error === "Nome do grupo é obrigatório" ? colors.notification : colors.border }]}
              editable={!loading}
            />

            <Text style={[styles.label, { color: colors.text }]}>Membros</Text>

            <View style={styles.emailRow}>
              <TextInput value={user.email} editable={false} style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
            </View>

            {otherEmails.map((email, i) => {
              const isInvalid = invalidEmails.includes(email.trim());
              return (
                <View key={i} style={styles.emailRow}>
                  <TextInput
                    placeholder={`email${i + 1}@exemplo.com`}
                    placeholderTextColor={colors.border}
                    value={email}
                    onChangeText={(val) => {
                      const copy = [...otherEmails];
                      copy[i] = val;
                      setOtherEmails(copy);
                    }}
                    style={[styles.input, { flex: 1, color: colors.text, borderColor: isInvalid ? colors.notification : colors.border }, isInvalid ? { backgroundColor: `${colors.notification}22` } : null]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setOtherEmails((prev) => prev.filter((_, idx) => idx !== i))} disabled={loading}>
                    <Text style={{ color: colors.notification }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => setOtherEmails((prev) => [...prev, ""])} disabled={loading}>
              <Text style={{ color: colors.primary, marginVertical: 6 }}>+ Adicionar outro</Text>
            </TouchableOpacity>

            <TextInput
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.border}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80, color: colors.text, borderColor: colors.border }]}
              multiline
              editable={!loading}
            />

            {error && <Text style={{ color: colors.notification, marginTop: 6 }}>{error}</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => !loading && onClose()} disabled={loading}>
              <Text style={{ color: colors.notification }}>{loading ? "Aguarde..." : "Cancelar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} disabled={loading || hasError}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>{loading ? "Criando..." : "Criar Grupo"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { width: "90%", padding: 20, borderRadius: 12, maxHeight: "80%" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  label: { marginTop: 10, marginBottom: 4, fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
});
