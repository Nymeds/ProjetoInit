import { useEffect, useRef, useState } from 'react';
import { Modal } from '../baseComponents/Modal';
import { Text } from '../baseComponents/text';
import { Button } from '../baseComponents/button';
import { getGroupMessages, postGroupMessage } from '../../api/messages';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

export function GroupChatModal({ open, onClose, groupId }: { open: boolean; onClose: () => void; groupId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const { joinGroup, leaveGroup, sendGroupMessage, on } = useChat();

  useEffect(() => {
    if (!open || !groupId) return;
    let mounted = true;
    setLoading(true);

    async function load() {
      try {
        const res = await getGroupMessages(groupId);
        if (!mounted) return;
        setMessages(res.messages ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    joinGroup(groupId);
    const off = on('group:message', (msg: any) => {
      if (msg.groupId !== groupId) return;

      setMessages((prev) => {
        const tmpIdx = prev.findIndex(
          (m) =>
            typeof m.id === 'string' &&
            m.id.startsWith('tmp-') &&
            m.content === msg.content &&
            (m.authorId === user?.id || m.authorId === 'me' || m.authorName === 'Você')
        );
        if (tmpIdx !== -1) {
          const copy = [...prev];
          copy[tmpIdx] = msg;
          return copy;
        }

        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      mounted = false;
      off();
      leaveGroup(groupId);
    };
  }, [open, groupId, joinGroup, leaveGroup, on, user]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setTimeout(() => { el.scrollTop = el.scrollHeight; }, 20);
  }, [messages]);

  async function handleSend() {
    if (!groupId) return;
    if (!text.trim()) return;
    setSending(true);
    const content = text.trim();

    try {
      try {
        sendGroupMessage(groupId, content);
        setMessages((s) => [...s, { id: `tmp-${Date.now()}`, content, authorName: 'Você', createdAt: new Date().toISOString(), groupId }]);
      } catch (err) {
        const res = await postGroupMessage(groupId, content);
        setMessages((s) => [...s, res.message]);
      }
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Chat do grupo" className="max-w-[1400px] w-[95vw] min-w-[720px]" draggable fullScreenOnMobile>
      <div className="flex flex-col gap-3 h-[70vh] sm:h-[75vh] md:h-[80vh]">
        <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-3 bg-background-primary/10 rounded-md max-h-[55vh] sm:max-h-[65vh] md:max-h-[70vh]">
          {loading && <Text variant="paragraph-small" className="text-accent-paragraph">Carregando...</Text>}
          {!loading && messages.length === 0 && <Text variant="paragraph-small" className="text-accent-paragraph">Nenhuma mensagem</Text>}
          {messages.map((m) => {
  const isMe =
    m.authorId === user?.id ||
    m.authorId === 'me' ||
    m.authorName === 'Você';

  return (
    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          p-3 rounded-lg border shadow-sm backdrop-blur-sm
          max-w-[95%] md:max-w-[85%] lg:max-w-[70%]
          ${isMe
            ? 'ml-auto text-white bg-[var(--color-accent-brand)] border-transparent'
            : 'text-accent-paragraph bg-[var(--card-bg)] border-[var(--glass-border)]'
          }
        `}
      >
        <div className="text-sm font-medium opacity-80">
          {m.authorName ?? m.authorId}
        </div>

        <div className="whitespace-pre-wrap mt-1">
          {m.content}
        </div>

        <div className="text-xs opacity-60 mt-1">
          {m.createdAt
            ? new Date(m.createdAt).toLocaleString()
            : ''}
        </div>
      </div>
    </div>
  );
})}

        </div>

        <div className="flex-shrink-0">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full p-3 rounded-md bg-background-primary border border-border-primary resize-y" placeholder="Escreva uma mensagem..." />
          <div className="flex justify-end mt-2">
            <Button onClick={handleSend} disabled={sending || !text.trim()} variant="primary">Enviar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
