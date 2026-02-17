import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Controller, SubmitHandler, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";

export type FormData = {
  name: string;
  description?: string;
  emails: string[];
};

interface Props {
  onCreateGroup: (payload: { name: string; description?: string; userEmails: string[] }) => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

const schema = yup.object({
  name: yup.string().trim().required("Nome do grupo e obrigatorio"),
  description: yup.string().optional(),
  emails: yup.array().of(yup.string().email("Email invalido")).optional(),
});

export default function CreateGroupForm({ onCreateGroup, onCancel, onSuccess }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as Resolver<FormData>,
    defaultValues: { name: "", description: "", emails: [] },
  });

  const emails = watch("emails");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!user?.email) {
      setBackendError("Usuario nao carregado ainda");
      return;
    }

    setLoading(true);
    setBackendError(null);

    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        userEmails: [
          user.email,
          ...(data.emails || [])
            .map((email) => email.trim())
            .filter((email) => email !== ""),
        ],
      };

      await onCreateGroup(payload);
      reset();
      onSuccess?.();
    } catch (error) {
      setBackendError(getApiErrorMessage(error, "Erro ao criar grupo"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <Text style={[styles.title, { color: colors.text }]}>Novo Grupo</Text>

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
              { color: colors.text, borderColor: errors.name ? colors.notification : colors.border },
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

      {emails?.map((email, index) => (
        <View key={index} style={styles.emailRow}>
          <Controller
            control={control}
            name={`emails.${index}`}
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder={`email${index + 1}@exemplo.com`}
                placeholderTextColor={colors.border}
                value={value}
                onChangeText={onChange}
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: colors.text,
                    borderColor: errors.emails?.[index] ? colors.notification : colors.border,
                  },
                ]}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            )}
          />

          <TouchableOpacity
            onPress={() => setValue("emails", emails.filter((_, current) => current !== index))}
            disabled={loading}
          >
            <Text style={{ color: colors.notification }}>x</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={() => setValue("emails", [...emails, ""])} disabled={loading}>
        <Text style={{ color: colors.primary, marginVertical: 6 }}>+ Adicionar outro</Text>
      </TouchableOpacity>

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <TextInput
            placeholder="Descricao (opcional)"
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

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => !loading && onCancel()} disabled={loading}>
          <Text style={{ color: colors.notification }}>{loading ? "Aguarde..." : "Cancelar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading}>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {loading ? "Criando..." : "Criar Grupo"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  label: { marginTop: 10, marginBottom: 4, fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
});
