import React, { useState, useEffect } from "react";
import { Modal, View, TextInput, TouchableOpacity, Text, ScrollView, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getGroups } from "../services/groups";
import clsx from "clsx";

export interface Group {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description?: string; groupId?: string }) => Promise<void>;
}

export default function CreateTaskModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

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
    return () => { mounted = false; };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
      setSelectedGroup(undefined);
      setGroups([]);
    }
  }, [visible]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setLoadingCreate(true);
    try {
      await onCreate({ title, description, groupId: selectedGroup });
      onClose();
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="w-11/12 p-5 rounded-lg" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-bold text-center mb-3" style={{ color: colors.text }}>Adicionar Tarefa</Text>

          <TextInput
            placeholder="Título"
            placeholderTextColor={colors.border}
            value={title}
            onChangeText={setTitle}
            className="border rounded-lg p-3 my-2"
            style={{ borderColor: colors.border, color: colors.text }}
          />

          <TextInput
            placeholder="Descrição"
            placeholderTextColor={colors.border}
            value={description}
            onChangeText={setDescription}
            className="border rounded-lg p-3 my-2"
            style={{ borderColor: colors.border, color: colors.text }}
          />

          <Text className="text-base font-semibold mt-2 mb-1" style={{ color: colors.text }}>Selecionar grupo:</Text>

          {loadingGroups ? (
            <ActivityIndicator size="small" color={colors.primary} className="my-2" />
          ) : (
            <ScrollView className="max-h-40 my-2">
              {/* Sem Grupo */}
              <TouchableOpacity
                onPress={() => setSelectedGroup(undefined)}
                className={clsx(
                  "p-3 rounded-md mb-2 border justify-center",
                  selectedGroup === undefined ? "border-primary bg-primary" : "border-gray-300 bg-white"
                )}
                style={{ backgroundColor: selectedGroup === undefined ? colors.primary : colors.card, borderColor: selectedGroup === undefined ? colors.primary : colors.border }}
              >
                <Text className={clsx(selectedGroup === undefined ? "text-white font-bold" : "text-black font-normal")} style={{ color: selectedGroup === undefined ? "#fff" : colors.text }}>
                  Sem grupo
                </Text>
              </TouchableOpacity>

              {/* Grupos */}
              {groups.map((g) => {
                const selected = selectedGroup === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setSelectedGroup(g.id)}
                    className={clsx(
                      "p-3 rounded-md mb-2 border justify-center",
                      selected ? "border-primary bg-primary" : "border-gray-300 bg-white"
                    )}
                    style={{ backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }}
                  >
                    <Text className={clsx(selected ? "text-white font-bold" : "text-black font-normal")} style={{ color: selected ? "#fff" : colors.text }}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Ações */}
          <View className="flex-row justify-between mt-4">
            <TouchableOpacity onPress={onClose} disabled={loadingCreate}>
              <Text className="font-semibold" style={{ color: colors.notification }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} disabled={loadingCreate}>
              <Text className="font-bold" style={{ color: colors.primary }}>
                {loadingCreate ? "Criando..." : "Adicionar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
