import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getAssistantHistory, sendAssistantMessage } from '../../api/assistant';
import { Text } from '../baseComponents/text';
import { Button } from '../baseComponents/button';

type ElisaRole = 'USER' | 'ASSISTANT' | 'TOOL';

interface ElisaMessage {
  id: string;
  role: ElisaRole;
  content: string;
  createdAt: string;
}

interface ElisaAssistantProps {
  // Dispara um refresh de dados quando a ELISA cria algo
  onAction?: () => void;
}

export function ElisaAssistant({ onAction }: ElisaAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ElisaMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages = messages.filter((m) => m.role !== 'TOOL');

  // Carrega o historico quando o chat abre
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

  // Mantem o scroll no fim para ver a ultima mensagem
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, visibleMessages, loading]);

  // Permite fechar com ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');

    const optimisticId = `tmp-${Date.now()}`;
    setMessages((s) => [
      ...s,
      { id: optimisticId, role: 'USER', content: text, createdAt: new Date().toISOString() },
    ]);

    setLoading(true);
    try {
      const data = await sendAssistantMessage(text);
      if (data?.userMessage && data?.message) {
        setMessages((s) => [
          ...s.filter((m) => m.id !== optimisticId),
          data.userMessage,
          data.message,
        ]);
      } else if (data?.message) {
        // fallback: mantem a mensagem do usuario e adiciona a resposta
        setMessages((s) => [...s, data.message]);
      } else if (data?.reply) {
        setMessages((s) => [
          ...s.filter((m) => m.id !== optimisticId),
          { id: `assistant-${Date.now()}`, role: 'ASSISTANT', content: data.reply, createdAt: new Date().toISOString() },
        ]);
      }

      if (data?.actions?.length && onAction) onAction();
    } catch {
      setMessages((s) => [
        ...s,
        {
          id: `assistant-${Date.now()}`,
          role: 'ASSISTANT',
          content: 'Desculpe, tive um problema para responder agora.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia, Shift+Enter quebra linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Botao flutuante da ELISA */}
      <button
        className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-accent-brand text-white shadow-xl flex items-center justify-center hover:bg-accent-brand-dark transition-colors"
        onClick={() => setOpen((s) => !s)}
        aria-label="Abrir ELISA"
      >
        <MessageCircle size={22} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[70] w-[90vw] max-w-[420px] bg-background-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border-primary/50 bg-background-quaternary">
            <div>
              <Text variant="heading-small" className="text-heading">ELISA</Text>
              <Text variant="paragraph-small" className="text-accent-paragraph">Assistente virtual</Text>
            </div>
            <button className="p-2 rounded hover:bg-background-tertiary" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-auto p-4 space-y-3 bg-background-primary">
            {loadingHistory && (
              <Text variant="paragraph-small" className="text-accent-paragraph">Carregando historico...</Text>
            )}

            {!loadingHistory && visibleMessages.length === 0 && (
              <Text variant="paragraph-small" className="text-accent-paragraph">
                Comece dizendo o que voce precisa. Ex: "crie uma tarefa para pagar aluguel".
              </Text>
            )}

            {visibleMessages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'USER'
                    ? 'bg-accent-brand text-white'
                    : 'bg-background-quaternary border border-border-primary text-accent-paragraph'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-background-quaternary border border-border-primary text-accent-paragraph">
                  ELISA esta pensando...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border-primary/50 bg-background-quaternary">
            <textarea
              className="w-full resize-none rounded-md border border-border-primary bg-background-primary p-2 text-sm text-accent-paragraph focus:outline-none focus:ring-2 focus:ring-accent-brand/30"
              rows={2}
              placeholder="Escreva sua mensagem para a ELISA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="flex justify-end mt-2">
              <Button variant="primary" className="flex items-center gap-2" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send size={16} />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ElisaAssistant;
