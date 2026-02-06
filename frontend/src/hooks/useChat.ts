import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

type PendingJoin = { type: 'todo' | 'group'; id: string | number };

export function useChat() {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // key -> PendingJoin, key example: "todo:123" or "group:abc"
  const pendingJoinsRef = useRef<Map<string, PendingJoin>>(new Map());
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  useEffect(() => {
    if (!user || !token) return;
    if (socketRef.current) return;

    // Build socket URL robustly with env override
    const SOCKET_PORT = 3333;
    const envUrl = (import.meta as any)?.env?.VITE_SOCKET_URL;
    const baseUrl = envUrl ?? `${location.protocol}//${location.hostname}:${SOCKET_PORT}`;

    const s = io(baseUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket'],
    });

    socketRef.current = s;

    // Attach previously registered listeners (if any)
    listenersRef.current.forEach((set, event) => {
      set.forEach((cb) => s.on(event, cb));
    });

    s.on('connect', () => {
      // Re-emit pending joins reliably
      pendingJoinsRef.current.forEach((pj) => {
        if (pj.type === 'todo') s.emit('join_todo', pj.id);
        else s.emit('join_group', pj.id);
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  const joinGroup = useCallback((groupId: string) => {
    const key = `group:${groupId}`;
    pendingJoinsRef.current.set(key, { type: 'group', id: groupId });
    if (socketRef.current?.connected) socketRef.current.emit('join_group', groupId);
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    const key = `group:${groupId}`;
    pendingJoinsRef.current.delete(key);
    if (socketRef.current?.connected) socketRef.current.emit('leave_group', groupId);
  }, []);

  const joinTodo = useCallback((todoId: number) => {
    const key = `todo:${todoId}`;
    pendingJoinsRef.current.set(key, { type: 'todo', id: todoId });
    if (socketRef.current?.connected) socketRef.current.emit('join_todo', todoId);
  }, []);

  const leaveTodo = useCallback((todoId: number) => {
    const key = `todo:${todoId}`;
    pendingJoinsRef.current.delete(key);
    if (socketRef.current?.connected) socketRef.current.emit('leave_todo', todoId);
  }, []);

  const sendGroupMessage = useCallback((groupId: string, content: string) => {
    if (!socketRef.current || !socketRef.current.connected) throw new Error('Socket not connected');
    socketRef.current.emit('group:send_message', { groupId, content });
  }, []);

  const sendTodoComment = useCallback((todoId: number, content: string) => {
    if (!socketRef.current || !socketRef.current.connected) throw new Error('Socket not connected');
    socketRef.current.emit('todo:send_comment', { todoId, content });
  }, []);


  const on = useCallback((event: string, cb: (...args: any[]) => void) => {
    if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set());
    listenersRef.current.get(event)!.add(cb);

    if (socketRef.current) socketRef.current.on(event, cb);

    return () => {
      listenersRef.current.get(event)?.delete(cb);
      socketRef.current?.off(event, cb);
    };
  }, []);

  return {
    joinGroup,
    leaveGroup,
    joinTodo,
    leaveTodo,
    sendGroupMessage,
    sendTodoComment,
    on,
    socketRef,
  };
}
