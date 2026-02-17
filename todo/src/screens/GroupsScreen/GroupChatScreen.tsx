import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { useNavigation, useRoute, useTheme, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getGroupMessages, postGroupMessage, type MessageResponseData } from "../../services/messages";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";
import type { GroupsStackParamList } from "../../navigation/GroupStack";

export default function GroupChatScreen() {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<GroupsStackParamList, "GroupChat">>();
  const navigation = useNavigation<NativeStackNavigationProp<GroupsStackParamList, "GroupChat">>();
  const { user } = useAuth();
  const { joinGroup, leaveGroup, sendGroupMessage, on } = useChat();

  const { groupId, groupName } = route.params;
  const [messages, setMessages] = useState<MessageResponseData[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const listRef = useRef<FlatList<MessageResponseData> | null>(null);

  useEffect(() => {
    if (!groupId) return;

    let mounted = true;

    async function load() {
      try {
        const response = await getGroupMessages(groupId);
        if (!mounted) return;
        setMessages(response.messages ?? []);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    joinGroup(groupId);

    const off = on("group:message", (message: MessageResponseData) => {
      if (message.groupId !== groupId) return;

      setMessages((previous) => {
        if (previous.some((item) => item.id === message.id)) return previous;
        return [...previous, message];
      });
    });

    return () => {
      mounted = false;
      off();
      leaveGroup(groupId);
    };
  }, [groupId, joinGroup, leaveGroup, on]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function handleSend() {
    if (!groupId) return;
    if (!text.trim()) return;

    const content = text.trim();
    setSending(true);

    try {
      try {
        sendGroupMessage(groupId, content);
        setMessages((previous) => [
          ...previous,
          {
            id: `tmp-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            kind: "GROUP",
            authorId: user?.id ?? "me",
            authorName: user?.name ?? "Voce",
            groupId,
          },
        ]);
      } catch {
        const response = await postGroupMessage(groupId, content);
        setMessages((previous) => [...previous, response.message]);
      }

      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { color: colors.text }]}>{groupName ?? "Chat do grupo"}</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isMe = item.authorId === user?.id || item.authorId === "me";
          return (
            <View style={[styles.messageRow, isMe ? styles.alignEnd : styles.alignStart]}>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isMe ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: isMe ? "#fff" : colors.text, fontWeight: "700", marginBottom: 4 }}>
                  {item.authorName ?? item.authorId}
                </Text>
                <Text style={{ color: isMe ? "#fff" : colors.text }}>{item.content}</Text>
                <Text style={{ color: isMe ? "#fff" : colors.text, opacity: 0.7, marginTop: 6, fontSize: 11 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={{ color: colors.text, opacity: 0.7 }}>Nenhuma mensagem ainda</Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.composer, { borderTopColor: colors.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor={colors.border}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={[styles.sendButton, { backgroundColor: colors.primary, opacity: sending || !text.trim() ? 0.6 : 1 }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  heading: { fontSize: 16, fontWeight: "700" },
  listContent: { padding: 12, paddingBottom: 20 },
  messageRow: { marginBottom: 10, flexDirection: "row" },
  alignEnd: { justifyContent: "flex-end" },
  alignStart: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  emptyWrap: {
    paddingTop: 20,
    alignItems: "center",
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
