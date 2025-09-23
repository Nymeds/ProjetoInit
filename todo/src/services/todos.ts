import api from './api';

export async function getTodos() {
  const response = await api.get('/todo');
  return response.data;
}

export async function createTodo(payload: { title: string; description?: string; groupId?: string }) {
  const response = await api.post('/todo', payload);
  return response.data;
}

export async function deleteTodo(id: string) {
  const response = await api.delete(`/todo/${id}`);
  return response.data;
}

export async function completeTodo(id: string) {
  const response = await api.patch(`/todo/${id}/complete`);
  return response.data;
}
