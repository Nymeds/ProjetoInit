import { api } from './auth';

export async function getGroupMessages(groupId: string) {
  const res = await api.get(`/groups/${groupId}/messages`);
  return res.data;
}

export async function postGroupMessage(groupId: string, content: string) {
  const res = await api.post(`/groups/${groupId}/messages`, { content });
  return res.data;
}

export async function getTodoComments(todoId: number) {
  const res = await api.get(`/todo/${todoId}/comments`);
  return res.data;
}

export async function postTodoComment(todoId: number, content: string) {
  const res = await api.post(`/todo/${todoId}/comments`, { content });
  return res.data;
}

export async function updateTodoComment(todoId: number, commentId: string, content: string) {
  const res = await api.put(`/todo/${todoId}/comments/${commentId}`, { content });
  return res.data;
}

export async function deleteTodoComment(todoId: number, commentId: string) {
  const res = await api.delete(`/todo/${todoId}/comments/${commentId}`);
  return res.data;
}

