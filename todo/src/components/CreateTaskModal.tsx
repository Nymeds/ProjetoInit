import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getGroups } from "../services/groups";

export interface Group {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    description?: string;
    groupId?: string;
  }) => Promise<void>;
}


const schema = yup.object({
  title: yup
    .string()
    .required("O título é obrigatório")
    .min(3, "Mínimo de 3 caracteres"),
  description: yup.string().optional(),
  groupId: yup.string().optional(),
});

export type TaskFormData = yup.InferType<typeof schema>;
type TaskFormValues = {
  title: string;
  description?: string;
  groupId?: string;
};

export default function CreateTaskModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: yupResolver(schema) as Resolver<TaskFormValues>,
    defaultValues: { title: "", description: "", groupId: undefined },
  });


  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const data = await getGroups();
        if (mounted) setGroups(Array.isArray(data) ? data : []);
      } catch {
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

  // 🔄 Resetar formulário quando fechar
  useEffect(() => {
    if (!visible) {
      reset();
      setGroups([]);
    }
  }, [visible, reset]);

  // ✅ Submit
  const handleAdd = async (data: TaskFormValues) => {
    await onCreate({
      title: data.title,
      description: data.description,
      groupId: data.groupId,
    });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay]}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Adicionar Tarefa
          </Text>

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="Título"
                placeholderTextColor={colors.border}
                value={value}
                onChangeText={onChange}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            )}
          />
          {errors.title && (
            <Text style={{ color: "red" }}>{errors.title.message}</Text>
          )}

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="Descrição"
                placeholderTextColor={colors.border}
                value={value}
                onChangeText={onChange}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            )}
          />

          <Text style={[styles.subtitle, { color: colors.text }]}>
            Selecionar grupo:
          </Text>

          {loadingGroups ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 8 }}
            />
          ) : (
            <Controller
              control={control}
              name="groupId"
              render={({ field: { value, onChange } }) => (
                <ScrollView style={{ maxHeight: 160, marginVertical: 8 }}>
                  {/* Sem grupo */}
                  <TouchableOpacity
                    onPress={() => onChange(undefined)}
                    style={[
                      styles.groupButton,
                      {
                        backgroundColor:
                          value === undefined ? colors.primary : colors.card,
                        borderColor:
                          value === undefined ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: value === undefined ? "#fff" : colors.text,
                        fontWeight: value === undefined ? "bold" : "normal",
                      }}
                    >
                      Sem grupo
                    </Text>
                  </TouchableOpacity>

                  {/* Grupos */}
                  {groups.map((g) => {
                    const selected = value === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => onChange(g.id)}
                        style={[
                          styles.groupButton,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.card,
                            borderColor: selected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: selected ? "#fff" : colors.text,
                            fontWeight: selected ? "bold" : "normal",
                          }}
                        >
                          {g.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            />
          )}

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Text style={{ color: colors.notification, fontWeight: "600" }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit(handleAdd)}
              disabled={isSubmitting}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                {isSubmitting ? "Criando..." : "Adicionar"}
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
  modal: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  groupButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});
