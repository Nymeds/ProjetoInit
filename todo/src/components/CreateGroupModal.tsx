import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (
    payload: { name: string; description?: string; userEmails: string[] }
  ) => Promise<{ success: boolean; message?: string }>;
}

type FormData = {
  name: string;
  description?: string;
  emails: string[];
};

// esquema Yup
const schema = yup.object({
  name: yup.string().trim().required("Nome do grupo é obrigatório"),
  description: yup.string().optional(),
  emails: yup.array().of(yup.string().email("Email inválido")).optional(),
});

export default function CreateGroupModal({
  visible,
  onClose,
  onCreateGroup,
}: Props) {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { name: "", description: "", emails: [] },
  });

  // resetar quando abrir
  useEffect(() => {
    if (visible) {
      reset({ name: "", description: "", emails: [] });
      setBackendError(null);
      setInvalidEmails([]);
      setLoading(false);
    }
  }, [visible]);

  const extractEmailsFromString = (text: string) => {
    if (!text) return [];
    const re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    return text.match(re) ?? [];
  };

  // onSubmit agora tipado corretamente
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user?.email) {
      setBackendError("Usuário não carregado ainda");
      return;
    }

    setLoading(true);
    setBackendError(null);
    setInvalidEmails([]);

    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      userEmails: [user.email, ...(data.emails || []).filter((e) => e.trim() !== "")],
    };

    const result = await onCreateGroup(payload);

    if (result.success) {
      reset();
      onClose();
    } else {
      let backendMsg = result.message || "Erro ao criar grupo";

      if (/não encontrado/i.test(backendMsg) || /User not found/i.test(backendMsg)) {
        const found = extractEmailsFromString(backendMsg);
        setInvalidEmails(found);
        backendMsg = `Algum dos emails informados não pertence a um usuário cadastrado. ${found.join(", ")}`;
      } else if (/unique constraint failed/i.test(backendMsg) || /Já existe/i.test(backendMsg)) {
        backendMsg = "Já existe um grupo com esse nome";
      }

      setBackendError(backendMsg);
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

  const emails = watch("emails");

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Novo Grupo</Text>

          <ScrollView>
            {/* Nome do grupo */}
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Nome do grupo"
                  placeholderTextColor={colors.border}
                  value={value}
                  onChangeText={onChange}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.name ? colors.notification : colors.border,
                    },
                  ]}
                  editable={!loading}
                />
              )}
            />
            {errors.name && (
              <Text style={{ color: colors.notification }}>
                {errors.name.message}
              </Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Membros</Text>

            {/* Email do usuário logado */}
            <View style={styles.emailRow}>
              <TextInput
                value={user.email}
                editable={false}
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              />
            </View>

            {/* Outros emails */}
            {emails?.map((email, i) => {
              const isInvalid = invalidEmails.includes(email.trim());
              return (
                <View key={i} style={styles.emailRow}>
                  <Controller
                    control={control}
                    name={`emails.${i}`}
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        placeholder={`email${i + 1}@exemplo.com`}
                        placeholderTextColor={colors.border}
                        value={value}
                        onChangeText={onChange}
                        style={[
                          styles.input,
                          {
                            flex: 1,
                            color: colors.text,
                            borderColor:
                              isInvalid || errors.emails?.[i]
                                ? colors.notification
                                : colors.border,
                          },
                          isInvalid
                            ? { backgroundColor: `${colors.notification}22` }
                            : null,
                        ]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setValue("emails", emails.filter((_, idx) => idx !== i))
                    }
                    disabled={loading}
                  >
                    <Text style={{ color: colors.notification }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity
              onPress={() => setValue("emails", [...emails, ""])}
              disabled={loading}
            >
              <Text style={{ color: colors.primary, marginVertical: 6 }}>
                + Adicionar outro
              </Text>
            </TouchableOpacity>

            {/* Descrição */}
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="Descrição (opcional)"
                  placeholderTextColor={colors.border}
                  value={value}
                  onChangeText={onChange}
                  style={[
                    styles.input,
                    { height: 80, color: colors.text, borderColor: colors.border },
                  ]}
                  multiline
                  editable={!loading}
                />
              )}
            />

            {/* Erro vindo do backend */}
            {backendError && (
              <Text style={{ color: colors.notification, marginTop: 6 }}>
                {backendError}
              </Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => !loading && onClose()}
              disabled={loading}
            >
              <Text style={{ color: colors.notification }}>
                {loading ? "Aguarde..." : "Cancelar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                {loading ? "Criando..." : "Criar Grupo"}
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  modal: { width: "90%", padding: 20, borderRadius: 12, maxHeight: "80%" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  label: { marginTop: 10, marginBottom: 4, fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});
