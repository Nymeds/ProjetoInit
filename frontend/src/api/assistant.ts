import { api } from './auth';

// Busca o historico da ELISA para manter memoria no frontend
export async function getAssistantHistory() {
  const res = await api.get('/assistant/history');
  return res.data;
}

// Envia mensagem para a ELISA e recebe a resposta do backend
export async function sendAssistantMessage(message: string) {
  const res = await api.post('/assistant/chat', { message });
  return res.data;
}
