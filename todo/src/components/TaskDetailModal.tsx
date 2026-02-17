import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import type { Todo } from "../hooks/useTodos";
import {
  deleteTodoComment,
  getTodoComments,
  postTodoComment,
  updateTodoComment,
  type MessageResponseData,
} from "../services/messages";
import type { MainDrawerParamList } from "../navigation/AppDrawer";

interface TaskDetailModalProps {
  visible: boolean;
  todo: Todo | null;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
}

export default function TaskDetailModal({ visible, todo, onClose, onUpdated }: TaskDetailModalProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<MainDrawerParamList>>();
  const { user } = useAuth();
  const { joinTodo, leaveTodo, sendTodoComment, on } = useChat();

  const [comments, setComments] = useState<MessageResponseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const todoId = useMemo(() => {
    if (!todo) return null;
    const numericId = Number(todo.id);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }, [todo]);

  useEffect(() => {
    if (!visible || !todoId) return;

    let mounted = true;
    setLoading(true);

    async function loadComments() {
      try {
        const response = await getTodoComments(todoId);
        if (!mounted) return;
        setComments(response.messages ?? []);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadComments();
    joinTodo(todoId);

    const offComment = on("todo:comment", (message: MessageResponseData) => {
      if (message.todoId !== todoId) return;

      setComments((previous) => {
        if (previous.some((item) => item.id === message.id)) return previous;

        const withoutOptimistic = previous.filter(
          (item) => !(item.id.startsWith("tmp-") && item.content === message.content && item.authorId === user?.id),
        );

        return [...withoutOptimistic, message];
      });
    });

    const offCommentUpdated = on("todo:comment_updated", (message: MessageResponseData) => {
      if (message.todoId !== todoId) return;
      setComments((previous) => previous.map((item) => (item.id === message.id ? message : item)));
    });

    const offCommentDeleted = on("todo:comment_deleted", (payload: { todoId: number; id: string }) => {
      if (payload.todoId !== todoId) return;
      setComments((previous) => previous.filter((item) => item.id !== payload.id));
    });

    return () => {
      mounted = false;
      offComment();
      offCommentUpdated();
      offCommentDeleted();
      leaveTodo(todoId);
    };
  }, [visible, todoId, joinTodo, leaveTodo, on, user?.id]);

  async function handleSendComment() {
    if (!todoId) return;
    if (!commentText.trim()) return;

    const content = commentText.trim();
    setSending(true);

    try {
      try {
        sendTodoComment(todoId, content);
        setComments((previous) => [
          ...previous,
          {
            id: `tmp-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            kind: "COMMENT",
            authorId: user?.id ?? "me",
            authorName: user?.name ?? "Voce",
            todoId,
          },
        ]);
      } catch {
        const response = await postTodoComment(todoId, content);
        setComments((previous) => [...previous, response.message]);
      }

      setCommentText("");
      await onUpdated?.();
    } finally {
      setSending(false);
    }
  }

  async function handleSaveEdit() {
    if (!todoId || !editingId || !editingText.trim()) return;

    const response = await updateTodoComment(todoId, editingId, editingText.trim());
    setComments((previous) => previous.map((item) => (item.id === editingId ? response.message : item)));
    setEditingId(null);
    setEditingText("");
  }

  async function handleDelete(commentId: string) {
    if (!todoId) return;
    await deleteTodoComment(todoId, commentId);
    setComments((previous) => previous.filter((item) => item.id !== commentId));
  }

  if (!todo) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.header, { borderBottomColor: colors.border }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {todo.title}
              </Text>
              <Text style={{ color: colors.text, opacity: 0.7 }}>{todo.group?.name ?? "Sem grupo"}</Text>
            </View>

            {todo.group?.id && (
              <TouchableOpacity
                onPress={() => navigation.navigate("GroupsStack", { screen: "GroupChat", params: { groupId: todo.group?.id, groupName: todo.group?.name } })}
                style={[styles.chatButton, { borderColor: colors.primary }]}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Chat</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.primary }}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentWrap}>
            <View style={[styles.section, { borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Descricao</Text>
              <Text style={{ color: colors.text, marginTop: 6 }}>{todo.description ?? "Sem descricao"}</Text>
            </View>

            <View style={[styles.section, { borderColor: colors.border, flex: 1 }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Comentarios</Text>

              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                renderItem={({ item }) => {
                  const isMine = item.authorId === user?.id;

                  return (
                    <View style={[styles.commentCard, { borderColor: colors.border }]}> 
                      <View style={styles.commentHeader}>
                        <Text style={{ color: colors.text, fontWeight: "700" }}>
                          {item.authorName ?? item.authorId}
                        </Text>
                        {isMine && !editingId && (
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingId(item.id);
                                setEditingText(item.content);
                              }}
                            >
                              <Text style={{ color: colors.primary }}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                              <Text style={{ color: colors.notification }}>Excluir</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {editingId === item.id ? (
                        <View style={{ gap: 8 }}>
                          <TextInput
                            value={editingText}
                            onChangeText={setEditingText}
                            multiline
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                          />
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingId(null);
                                setEditingText("");
                              }}
                            >
                              <Text style={{ color: colors.notification }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveEdit}>
                              <Text style={{ color: colors.primary, fontWeight: "700" }}>Salvar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={{ color: colors.text }}>{item.content}</Text>
                          <Text style={{ color: colors.text, opacity: 0.7, marginTop: 4, fontSize: 11 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  !loading ? (
                    <Text style={{ color: colors.text, opacity: 0.7 }}>Nenhum comentario ainda.</Text>
                  ) : null
                }
              />

              <View style={styles.composer}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escreva um comentario..."
                  placeholderTextColor={colors.border}
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={sending || !commentText.trim()}
                  style={[styles.sendButton, { backgroundColor: colors.primary, opacity: sending || !commentText.trim() ? 0.6 : 1 }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  panel: {
    maxHeight: "92%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    borderBottomWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  contentWrap: {
    padding: 12,
    gap: 10,
    flex: 1,
  },
  section: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  commentCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  composer: {
    gap: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chatButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

