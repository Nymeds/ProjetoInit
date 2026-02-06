import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Text } from '../components/baseComponents/text';
import Card from '../components/baseComponents/card';
import { Button } from '../components/baseComponents/button';
import { getGroupMessages, postGroupMessage } from '../api/messages';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const { joinGroup, leaveGroup, sendGroupMessage, on } = useChat();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    async function load() {
      try {
        const res = await getGroupMessages(id as string);
        if (!mounted) return;
        setMessages(res.messages ?? []);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // join socket room
    joinGroup(id as string);

    const off = on('group:message', (msg: any) => {
      if (msg.groupId !== id) return;

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
      leaveGroup(id);
    };
  }, [id, joinGroup, leaveGroup, on, user]);

  useEffect(() => {
    // auto scroll to bottom when messages change
    const el = listRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 20);
  }, [messages]);

  async function handleSend() {
    if (!id) return;
    if (!text.trim()) return;
    setSending(true);
    const content = text.trim();

    try {
      try {
        sendGroupMessage(id, content);
        setMessages((s) => [...s, { id: `tmp-${Date.now()}`, content, authorName: 'Você', authorId: user?.id ?? 'me', createdAt: new Date().toISOString(), groupId: id, pending: true }]);
      } catch (err) {
        const res = await postGroupMessage(id, content);
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
    <div className="p-6 h-full min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>Voltar</Button>
          <Text variant="heading-medium">Chat do grupo</Text>
          <div className="ml-auto" />
        </div>

        <Card className="h-[70vh] flex flex-col">
          <div ref={listRef} className="p-4 overflow-auto flex-1 space-y-3 bg-background-primary/20">
            {loading && <Text variant="paragraph-small" className="text-accent-paragraph">Carregando mensagens...</Text>}
            {!loading && messages.length === 0 && <Text variant="paragraph-small" className="text-accent-paragraph">Nenhuma mensagem ainda</Text>}
            {messages.map((m) => {
              const isMe = m.authorId === user?.id || m.authorId === 'me' || m.authorName === 'Você';
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg ${isMe ? 'bg-primary-600 text-white' : 'bg-background-primary/40'} max-w-[80%]`}>
                    <div className="font-medium text-sm text-accent-paragraph">{m.authorName ?? m.authorId}</div>
                    <div className="whitespace-pre-wrap mt-1">{m.content}</div>
                    <div className="text-accent-span text-xs mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-border-primary">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva uma mensagem..." className="w-full p-2 rounded-md bg-background-primary border border-border-primary text-accent-paragraph" rows={3} />
            <div className="flex justify-end mt-2">
              <Button onClick={handleSend} disabled={sending || !text.trim()} variant="primary">Enviar</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
