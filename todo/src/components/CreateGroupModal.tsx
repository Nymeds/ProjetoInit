import React, { useEffect } from "react";
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (payload: { name: string; description?: string; userEmails: string[] }) => Promise<{ success: boolean; message?: string }>;
}

interface FormData {
  name: string;
  description: string;
  emails: { value: string }[];
}

const schema = yup.object({
  name: yup.string().required("Nome do grupo é obrigatório").trim(),
  description: yup.string().trim(),
  emails: yup.array().of(
    yup.object({ value: yup.string().email("Email inválido") })
  ).default([{ value: "" }])
});

const useGroupForm = (user: any, onCreateGroup: Props['onCreateGroup'], onClose: Props['onClose']) => {
  const [invalidEmails, setInvalidEmails] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      emails: [{ value: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails"
  });

  const extractEmailsFromString = (text: string) => 
    text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) ?? [];

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!user?.email) {
      setApiError("Usuário não carregado ainda");
      return;
    }
    
    setLoading(true);
    setApiError(null);
    setInvalidEmails([]);

    const validEmails = data.emails.map(e => e.value.trim()).filter(Boolean);
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      userEmails: [user.email, ...validEmails]
    };

    console.log("Enviando payload:", payload); // Debug

    try {
      const result = await onCreateGroup(payload);
      console.log("Resultado recebido:", result); // Debug

      if (result.success) {
        console.log("Sucesso! Fechando modal..."); // Debug
        reset();
        onClose();
      } else {
        console.log("Erro! Processando mensagem..."); // Debug
        let msg = result.message || "Erro ao criar grupo";
        
        if (/não encontrado|User not found/i.test(msg)) {
          const found = extractEmailsFromString(msg);
          console.log("Emails inválidos encontrados:", found); // Debug
          setInvalidEmails(found);
          msg = `Emails não cadastrados: ${found.join(", ")}`;
        } else if (/unique constraint|Já existe/i.test(msg)) {
          msg = "Já existe um grupo com esse nome";
        }
        
        setApiError(msg);
        console.log("Erro definido:", msg); // Debug
      }
    } catch (error) {
      console.log("Erro no catch:", error); 
      setApiError("Erro inesperado ao criar grupo");
    }
    setLoading(false);
  });

  const handleEmailChange = (index: number, value: string) => {
    const currentEmail = form.getValues(`emails.${index}.value`);
    form.setValue(`emails.${index}.value`, value);
    if (invalidEmails.includes(currentEmail?.trim())) {
      setInvalidEmails(prev => prev.filter(email => email !== currentEmail?.trim()));
      if (apiError && /não cadastrados|não encontrado/i.test(apiError)) {
        setApiError(null);
      }
    }
  };
  const removeEmail = (index: number) => {
    const emailToRemove = form.getValues(`emails.${index}.value`)?.trim();
    remove(index);
    
    if (emailToRemove && invalidEmails.includes(emailToRemove)) {
      setInvalidEmails(prev => prev.filter(email => email !== emailToRemove));
    }
  };
  const reset = () => {
    form.reset();
    setInvalidEmails([]);
    setApiError(null);
    setLoading(false);
  };
  return {
    form,
    fields,
    append,
    removeEmail,
    handleSubmit,
    handleEmailChange,
    loading,
    apiError,
    invalidEmails,
    reset
  };
};
export default function CreateGroupModal({ visible, onClose, onCreateGroup }: Props) {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useAuth();
  const {
    form,
    fields,
    append,
    removeEmail,
    handleSubmit,
    handleEmailChange,
    loading,
    apiError,
    invalidEmails,
    reset
  } = useGroupForm(user, onCreateGroup, onClose);
  useEffect(() => {
    if (visible) {
      console.log("Modal aberto, resetando form..."); 
      reset();
    }
  }, [visible]);
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
  const hasFormErrors = Object.keys(form.formState.errors).length > 0;
  const hasApiError = !!apiError;
  const hasInvalidEmails = invalidEmails.length > 0;
  const hasErrors = hasFormErrors || hasApiError || hasInvalidEmails;

  console.log("Estado atual:", {
    hasFormErrors,
    hasApiError: hasApiError ? apiError : false,
    hasInvalidEmails: hasInvalidEmails ? invalidEmails : false,
    hasErrors,
    formValid: form.formState.isValid
  });
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Novo Grupo</Text>

          <ScrollView>
            <Controller
              name="name"
              control={form.control}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <TextInput
                  placeholder="Nome do grupo"
                  placeholderTextColor={colors.border}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: error ? colors.notification : colors.border }
                  ]}
                  editable={!loading}
                />
              )}
            />
            <Text style={[styles.label, { color: colors.text }]}>Membros</Text>
            <TextInput 
              value={user.email} 
              editable={false} 
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
            />
            {fields.map((field, index) => {
              const emailValue = form.watch(`emails.${index}.value`);
              const isInvalid = invalidEmails.includes(emailValue?.trim());
              return (
                <View key={field.id} style={styles.emailRow}>
                  <Controller
                    name={`emails.${index}.value`}
                    control={form.control}
                    render={({ field: { value } }) => (
                      <TextInput
                        placeholder={`email${index + 1}@exemplo.com`}
                        placeholderTextColor={colors.border}
                        value={value}
                        onChangeText={(val) => handleEmailChange(index, val)}
                        style={[
                          styles.input,
                          { flex: 1, color: colors.text, borderColor: isInvalid ? colors.notification : colors.border },
                          isInvalid && { backgroundColor: `${colors.notification}22` }
                        ]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    )}
                  />
                  <TouchableOpacity onPress={() => removeEmail(index)} disabled={loading}>
                    <Text style={{ color: colors.notification }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity onPress={() => append({ value: "" })} disabled={loading}>
              <Text style={{ color: colors.primary, marginVertical: 6 }}>+ Adicionar outro</Text>
            </TouchableOpacity>
            <Controller
              name="description"
              control={form.control}
              render={({ field: { onChange, value } }) => (
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
            {form.formState.errors.name && (
              <Text style={{ color: colors.notification, marginTop: 6 }}>
                {form.formState.errors.name.message}
              </Text>
            )}
            {apiError && (
              <Text style={{ color: colors.notification, marginTop: 6 }}>{apiError}</Text>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => !loading && onClose()} disabled={loading}>
              <Text style={{ color: colors.notification }}>{loading ? "Aguarde..." : "Cancelar"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} disabled={loading || hasErrors}>
              <Text style={{ 
                color: (loading || hasErrors) ? colors.border : colors.primary, 
                fontWeight: "bold" 
              }}>
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
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modal: { width: "90%", padding: 20, borderRadius: 12, maxHeight: "80%" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  label: { marginTop: 10, marginBottom: 4, fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
});