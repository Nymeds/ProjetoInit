import { useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

type PendingJoin = { type: "todo" | "group"; id: string | number };
type ChatListener = (...args: any[]) => void;

const SOCKET_PORT = 3333;
const envUrl = (import.meta as any)?.env?.VITE_SOCKET_URL;
const SOCKET_URL = envUrl ?? `${location.protocol}//${location.hostname}:${SOCKET_PORT}`;

let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;
let activeSubscribers = 0;

// Mantem salas e listeners fora do hook para evitar conexoes duplicadas por componente.
const pendingJoins = new Map<string, PendingJoin>();
const listeners = new Map<string, Set<ChatListener>>();

function attachRegisteredListeners(socket: Socket) {
  listeners.forEach((callbacks, event) => {
    callbacks.forEach((callback) => socket.on(event, callback));
  });
}

function rejoinPendingRooms(socket: Socket) {
  pendingJoins.forEach((join) => {
    if (join.type === "todo") socket.emit("join_todo", join.id);
    else socket.emit("join_group", join.id);
  });
}

function connectSharedSocket(token: string): Socket {
  if (sharedSocket && sharedToken === token) return sharedSocket;

  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  const socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  attachRegisteredListeners(socket);
  socket.on("connect", () => rejoinPendingRooms(socket));

  sharedSocket = socket;
  sharedToken = token;
  return socket;
}

function disconnectSharedSocket() {
  if (!sharedSocket) return;
  sharedSocket.disconnect();
  sharedSocket = null;
  sharedToken = null;
}

export function useChat() {
  const { user, token } = useAuth();
<<<<<<< HEAD
=======
  const socketRef = useRef<Socket | null>(null);
  const lastConnectErrorAtRef = useRef(0);

  // key -> PendingJoin, key example: "todo:123" or "group:abc"
  const pendingJoinsRef = useRef<Map<string, PendingJoin>>(new Map());
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
>>>>>>> 65cc4b3add0c19874d94063392ab1c72b36b9ab1

  useEffect(() => {
    if (!user || !token) {
      disconnectSharedSocket();
      return;
    }

<<<<<<< HEAD
    activeSubscribers += 1;
    connectSharedSocket(token);
=======
    // Build socket URL robustly with env override
    const SOCKET_PORT = 3333;
    const envSocketUrl = (import.meta as any)?.env?.VITE_SOCKET_URL as string | undefined;
    const envApiUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
    const configuredBase = envSocketUrl ?? envApiUrl ?? `${location.protocol}//${location.hostname}:${SOCKET_PORT}`;
    const baseUrl = configuredBase.replace(/\/+$/, '');

    const s = io(baseUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
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
>>>>>>> 65cc4b3add0c19874d94063392ab1c72b36b9ab1

    s.on('connect_error', (err) => {
      const now = Date.now();
      if (now - lastConnectErrorAtRef.current < 4000) return;
      lastConnectErrorAtRef.current = now;
      console.warn('[socket] connect_error', {
        message: err?.message || 'unknown',
        url: baseUrl,
      });
    });

    s.on('disconnect', (reason) => {
      console.info('[socket] disconnected', { reason });
    });

    return () => {
<<<<<<< HEAD
      activeSubscribers = Math.max(0, activeSubscribers - 1);
      if (activeSubscribers === 0) disconnectSharedSocket();
=======
      s.off('connect');
      s.off('connect_error');
      s.off('disconnect');
      s.disconnect();
      socketRef.current = null;
>>>>>>> 65cc4b3add0c19874d94063392ab1c72b36b9ab1
    };
  }, [user, token]);

  const joinGroup = useCallback((groupId: string) => {
    const key = `group:${groupId}`;
    pendingJoins.set(key, { type: "group", id: groupId });
    if (sharedSocket?.connected) sharedSocket.emit("join_group", groupId);
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    const key = `group:${groupId}`;
    pendingJoins.delete(key);
    if (sharedSocket?.connected) sharedSocket.emit("leave_group", groupId);
  }, []);

  const joinTodo = useCallback((todoId: number) => {
    const key = `todo:${todoId}`;
    pendingJoins.set(key, { type: "todo", id: todoId });
    if (sharedSocket?.connected) sharedSocket.emit("join_todo", todoId);
  }, []);

  const leaveTodo = useCallback((todoId: number) => {
    const key = `todo:${todoId}`;
    pendingJoins.delete(key);
    if (sharedSocket?.connected) sharedSocket.emit("leave_todo", todoId);
  }, []);

  const sendGroupMessage = useCallback((groupId: string, content: string) => {
    if (!sharedSocket || !sharedSocket.connected) throw new Error("Socket not connected");
    sharedSocket.emit("group:send_message", { groupId, content });
  }, []);

  const sendTodoComment = useCallback((todoId: number, content: string) => {
    if (!sharedSocket || !sharedSocket.connected) throw new Error("Socket not connected");
    sharedSocket.emit("todo:send_comment", { todoId, content });
  }, []);

  const on = useCallback((event: string, callback: ChatListener) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);

    if (sharedSocket) sharedSocket.on(event, callback);

    return () => {
      const callbacks = listeners.get(event);
      callbacks?.delete(callback);
      if (callbacks && callbacks.size === 0) listeners.delete(event);
      sharedSocket?.off(event, callback);
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
  };
}
