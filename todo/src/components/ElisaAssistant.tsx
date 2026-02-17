import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MessageCircle, X } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import { getAssistantHistory, sendAssistantMessage, type AssistantMessage } from "../services/assistant";

interface ElisaAssistantProps {
  onAction?: () => void;
}

export default function ElisaAssistant({ onAction }: ElisaAssistantProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const listRef = useRef<FlatList<AssistantMessage> | null>(null);
  const visibleMessages = messages.filter((message) => message.role !== "TOOL");

  useEffect(() => {
    if (!open) return;

    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const data = await getAssistantHistory();
        setMessages(data.messages ?? []);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollToEnd({ animated: true });
  }, [open, visibleMessages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");
    const optimisticId = `tmp-${Date.now()}`;

    setMessages((state) => [
      ...state,
      { id: optimisticId, role: "USER", content: text, createdAt: new Date().toISOString() },
    ]);

    setLoading(true);

    try {
      const data = await sendAssistantMessage(text);

      if (data?.userMessage && data?.message) {
        setMessages((state) => [...state.filter((item) => item.id !== optimisticId), data.userMessage, data.message]);
      } else if (data?.message) {
        setMessages((state) => [...state, data.message]);
      } else if (data?.reply) {
        setMessages((state) => [
          ...state.filter((item) => item.id !== optimisticId),
          {
            id: `assistant-${Date.now()}`,
            role: "ASSISTANT",
            content: data.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      if (data?.actions?.length && onAction) onAction();
    } catch {
      setMessages((state) => [
        ...state,
        {
          id: `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: "Desculpe, tive um problema para responder agora.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.floatButton, { backgroundColor: colors.primary }]}
        onPress={() => setOpen((state) => !state)}
      >
        <MessageCircle size={22} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.header, { borderBottomColor: colors.border }]}> 
              <View>
                <Text style={[styles.title, { color: colors.text }]}>ELISA</Text>
                <Text style={{ color: colors.text, opacity: 0.7 }}>Assistente virtual</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={listRef}
              data={visibleMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messages}
              renderItem={({ item }) => {
                const isUser = item.role === "USER";
                return (
                  <View style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}>
                    <View
                      style={[
                        styles.bubble,
                        {
                          backgroundColor: isUser ? colors.primary : colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: isUser ? "#fff" : colors.text }}>{item.content}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                !loadingHistory ? (
                  <Text style={{ color: colors.text, opacity: 0.7 }}>
                    Comece dizendo o que voce precisa. Ex: criar tarefa para pagar aluguel.
                  </Text>
                ) : null
              }
            />

            <View style={[styles.composer, { borderTopColor: colors.border }]}> 
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Escreva sua mensagem para a ELISA..."
                placeholderTextColor={colors.border}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary, opacity: !input.trim() || loading ? 0.6 : 1 }]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{loading ? "Enviando..." : "Enviar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatButton: {
    position: "absolute",
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    maxHeight: "85%",
  },
  header: {
    borderBottomWidth: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700" },
  messages: { padding: 12, gap: 8 },
  messageRow: { flexDirection: "row" },
  alignEnd: { justifyContent: "flex-end" },
  alignStart: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  composer: {
    borderTopWidth: 1,
    padding: 10,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
});
