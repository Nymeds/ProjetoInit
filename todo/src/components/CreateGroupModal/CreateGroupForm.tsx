import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

type FormData = {
  name: string;
  description?: string;
  emails: string[];
};

const schema = yup.object({
  name: yup.string().trim().required("Nome do grupo é obrigatório"),
  description: yup.string().optional(),
  emails: yup.array().of(yup.string().email("Email inválido")).optional(),
});

interface Props {
  onCreateGroup: (
    payload: { name: string; description?: string; userEmails: string[] }
  ) => Promise<{ success: boolean; message?: string }>;
  onCancel: () => void;
  onSave?: (users: string[]) => void;
  validateUser?: (value: string) => boolean;
  onSuccess?: () => void;
}

export default function CreateGroupForm({
  onCreateGroup,
  onCancel,
  onSave,
  validateUser,
  onSuccess,
}: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    // @ts-ignore
    resolver: yupResolver(schema),
    defaultValues: { name: "", description: "", emails: [] },
  });

  useEffect(() => {
    reset({ name: "", description: "", emails: [] });
    setBackendError(null);
    setInvalidEmails([]);
    setLoading(false);
  }, []);

  const extractEmailsFromString = (text: string) =>
    (!text ? [] : text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) ?? []);

  const defaultValidate = (v: string) => {
    if (!v) return false;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRe.test(v) || v.trim().length > 0;
  };

  const isValid = (v: string) => (validateUser ? validateUser(v) : defaultValidate(v));

  const handleAdd = () => {
    setError(null);
    if (!isValid(input)) {
      setError("Usuário inválido. Informe um e-mail ou nome válido.");
      return;
    }
    if (users.includes(input.trim())) {
      setError("Usuário já adicionado.");
      return;
    }
    setUsers((s) => [...s, input.trim()]);
    setInput("");
  };

  const removeUser = (u: string) => setUsers((s) => s.filter((x) => x !== u));

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
      setUsers([]);
      if (onSave) onSave(users);
      if (onSuccess) onSuccess();
    } else {
      let backendMsg = result.message || "Erro ao criar grupo";

      if (/não encontrado/i.test(backendMsg) || /User not found/i.test(backendMsg)) {
        const found = extractEmailsFromString(backendMsg);
        setInvalidEmails(found);
        backendMsg = `Algum dos emails informados não pertence a um usuário cadastrado. ${found.join(
          ", "
        )}`;
      } else if (/unique constraint failed/i.test(backendMsg) || /Já existe/i.test(backendMsg)) {
        backendMsg = "Já existe um grupo com esse nome";
      }

      setBackendError(backendMsg);
    }

    setLoading(false);
  };

  const emails = watch("emails");

  return (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>Novo Grupo</Text>

      <View style={styles.row}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Email ou nome do usuário"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={users}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Text style={{ color: colors.text }}>{item}</Text>
            <TouchableOpacity onPress={() => removeUser(item)}>
              <Text style={styles.remove}>Remover</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: "100%", marginTop: 8 }}
        ListEmptyComponent={<Text style={styles.listEmpty}>Nenhum usuário adicionado</Text>}
      />

      <ScrollView>
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
        {errors.name && <Text style={{ color: colors.notification }}>{errors.name.message}</Text>}

        <Text style={[styles.label, { color: colors.text }]}>Membros</Text>

        <View style={styles.emailRow}>
          <TextInput
            value={user?.email ?? ""}
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

        {emails?.map((email, i) => {
          const isInvalid = invalidEmails.includes(email?.trim() ?? "");
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
                        borderColor: isInvalid || errors.emails?.[i] ? colors.notification : colors.border,
                      },
                      isInvalid ? { backgroundColor: `${colors.notification}22` } : null,
                    ]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setValue("emails", emails.filter((_, idx) => idx !== i))} disabled={loading}>
                <Text style={{ color: colors.notification }}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity onPress={() => setValue("emails", [...emails, ""])} disabled={loading}>
          <Text style={{ color: colors.primary, marginVertical: 6 }}>+ Adicionar outro</Text>
        </TouchableOpacity>
        
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="Descrição (opcional)"
              placeholderTextColor={colors.border}
              value={value}
              onChangeText={onChange}
              style={[styles.input, { height: 80, color: colors.text, borderColor: colors.border }]}
              multiline
              editable={!loading}
            />
          )}
        />

        {backendError && <Text style={{ color: colors.notification, marginTop: 6 }}>{backendError}</Text>}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => !loading && onCancel()} disabled={loading}>
          <Text style={{ color: colors.notification }}>{loading ? "Aguarde..." : "Cancelar"}</Text>
        </TouchableOpacity>
      
        <TouchableOpacity onPress={handleSubmit(
          // @ts-ignore
          onSubmit)} disabled={loading}>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>{loading ? "Criando..." : "Criar Grupo"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
    backgroundColor: "transparent",
  },
  addBtn: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#2f95dc", borderRadius: 6, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "#fff", fontWeight: "600" },
  error: { color: "red", marginTop: 8 },
  userRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f2f2f2", alignItems: "center" },
  remove: { color: "#c00", paddingHorizontal: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 12 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: "600" },
  emailRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  listEmpty: { color: "#666", paddingVertical: 12, textAlign: "center" },
});