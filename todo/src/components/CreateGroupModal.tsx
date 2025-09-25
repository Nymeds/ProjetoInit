import React, { useEffect } from "react";
import { Modal, View, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (payload: {
    name: string;
    description?: string;
    userEmails: string[];
  }) => Promise<void>;
}

interface EmailField {
  value?: string;
}

interface FormData {
  name: string;
  description?: string;
  otherEmails?: EmailField[];
}

// Yup Schema
const schema: yup.ObjectSchema<FormData> = yup.object({
  name: yup.string().required("Nome do grupo é obrigatório"),
  description: yup.string().transform((value) => (value === "" ? undefined : value)).notRequired(),
  otherEmails: yup
    .array(
      yup.object({
        value: yup.string().email("E-mail inválido").transform((value) => (value === "" ? undefined : value)).notRequired(),
      })
    )
    .notRequired(),
});

export default function CreateGroupModal({ visible, onClose, onCreateGroup }: Props) {
  const { colors } = useTheme();
  const { user, loading: userLoading } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { name: "", description: "", otherEmails: [] },
  });

  useEffect(() => {
    if (visible) reset({ name: "", description: "", otherEmails: [] });
  }, [visible]);

  if (userLoading) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/40">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  if (!user) return null;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const emails = [user.email, ...(data.otherEmails?.map((e) => e.value || "") || [])].filter(Boolean);

    try {
      await onCreateGroup({
        name: data.name.trim(),
        description: data.description?.trim(),
        userEmails: emails,
      });
      onClose();
      reset();
    } catch (err: any) {
      const backendMsg = err?.message || "Erro ao criar grupo";
      if (/não encontrado/i.test(backendMsg) || /User not found/i.test(backendMsg)) {
        setError("otherEmails", { message: backendMsg });
      } else if (/unique constraint failed/i.test(backendMsg) || /Já existe/i.test(backendMsg)) {
        setError("name", { message: "Já existe um grupo com esse nome" });
      } else {
        setError("name", { message: backendMsg });
      }
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/40">
        <View
          className="w-[90%] p-5 rounded-lg max-h-[80%]"
          style={{ backgroundColor: colors.card }}
        >
          <Text className="text-xl font-bold text-center mb-3" style={{ color: colors.text }}>
            Novo Grupo
          </Text>

          <ScrollView>
            {/* Nome do grupo */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="Nome do grupo"
                    placeholderTextColor={colors.border}
                    value={value}
                    onChangeText={onChange}
                    className={clsx(
                      "border rounded-md p-3 my-2",
                      errors.name ? "border-red-500" : "border-gray-300"
                    )}
                    style={{ color: colors.text }}
                  />
                  {errors.name && <Text className="text-red-500">{errors.name.message}</Text>}
                </>
              )}
            />

            {/* E-mail do usuário */}
            <Text className="mt-2 mb-1 font-semibold" style={{ color: colors.text }}>
              Membros
            </Text>
            <TextInput
              value={user.email}
              editable={false}
              className="border rounded-md p-3 my-2"
              style={{ color: colors.text, backgroundColor: colors.background, borderColor: colors.border }}
            />

            {/* Outros e-mails */}
            <Controller
              control={control}
              name="otherEmails"
              render={({ field: { value, onChange } }) => (
                <>
                  {(value || []).map((emailObj, i) => (
                    <View key={i} className="flex-row items-center gap-2 my-1">
                      <TextInput
                        placeholder={`email${i + 1}@exemplo.com`}
                        placeholderTextColor={colors.border}
                        value={emailObj.value}
                        onChangeText={(text) => {
                          const copy = [...value];
                          copy[i].value = text;
                          onChange(copy);
                        }}
                        className={clsx(
                          "flex-1 border rounded-md p-3",
                          errors.otherEmails ? "border-red-500" : "border-gray-300"
                        )}
                        style={{ color: colors.text }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const copy = [...value];
                          copy.splice(i, 1);
                          onChange(copy);
                        }}
                      >
                        <Text className="text-red-500">✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity onPress={() => onChange([...(value || []), { value: "" }])}>
                    <Text className="text-blue-500 my-1">+ Adicionar outro</Text>
                  </TouchableOpacity>
                  {errors.otherEmails && <Text className="text-red-500">{errors.otherEmails.message}</Text>}
                </>
              )}
            />

            {/* Descrição */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Descrição (opcional)"
                  placeholderTextColor={colors.border}
                  value={value}
                  onChangeText={onChange}
                  className="border rounded-md p-3 my-2 h-20"
                  style={{ color: colors.text, borderColor: colors.border }}
                  multiline
                />
              )}
            />
          </ScrollView>

          {/* Ações */}
          <View className="flex-row justify-between mt-4">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-red-500 font-semibold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit(onSubmit)}>
              <Text className="text-blue-500 font-bold">
                {isSubmitting ? "Criando..." : "Criar Grupo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
