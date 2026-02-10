 
import { useState, useRef, useEffect } from "react";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import Card from "../baseComponents/card";
import { deleteTodo } from "../../api/todos";
import type { Todo } from "../../types/types";

interface TaskInfoProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; 
  todo: Todo;
}

export default function TaskInfo({ open, onClose, todo, onCreated }: TaskInfoProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // animation / mount control
  const ANIM_MS = 180;
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setMounted(false);
      }, ANIM_MS);
      return () => clearTimeout(t);
    }
    return;
  }, [open]);

  function startClose() {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setMounted(false);
      onClose();
    }, ANIM_MS);
  }

  // inicia remoção (fecha com animação)
  async function handleDelete() {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTodo(todo.id.toString());
      onCreated?.();
      // animação de fechamento
      startClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Erro ao deletar tarefa");
    } finally {
      setDeleting(false);
    }
  }

  // Handlers de drag (mouse)
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    const rect = (e.target as HTMLElement).closest('.draggable-card')?.getBoundingClientRect();
    const startX = e.clientX - (rect?.left ?? (window.innerWidth / 2 - 300));
    const startY = e.clientY - (rect?.top ?? (window.innerHeight / 2 - 200));
    startRef.current.x = startX;
    startRef.current.y = startY;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    const x = e.clientX - startRef.current.x;
    const y = e.clientY - startRef.current.y;
    setPos({ x, y });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      handleMouseMove(e);
    }
    function onUp() {
      handleMouseUp();
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  if (!mounted) return null;

  // posição inicial centralizada
  const baseStyle: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, position: 'absolute' }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'absolute' };

  const animStyle: React.CSSProperties = {
    transition: `opacity ${ANIM_MS}ms ease, transform ${ANIM_MS}ms ease`,
    opacity: exiting ? 0 : 1,
    transform: exiting ? 'translateY(-8px) scale(.98)' : 'translateY(0) scale(1)',
  };

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)', transition: `opacity ${ANIM_MS}ms ease`, opacity: exiting ? 0 : 1 }} onMouseDown={(e) => { if (e.target === e.currentTarget) startClose(); }}>
      <Card className="draggable-card !bg-background-primary p-6 w-full max-w-lg rounded-2xl shadow-lg" style={{ ...baseStyle, ...animStyle }}>
        <div className="flex justify-between items-center mb-6 cursor-move" onMouseDown={handleMouseDown}>
          <Text variant="heading-medium" className="text-white">
            {todo.title}
          </Text>
          <button
            onClick={() => startClose()}
            className="text-accent-red font-bold hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <Text variant="paragraph-small" className="text-red-500 mb-4">
            {error}
          </Text>
        )}

        <div className="space-y-2 mb-6">
          <Text as="div" variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Descrição:</span>
            <div className="
              mt-1
              text-accent-paragraph
              whitespace-normal
              break-words
            ">
              {todo.description ?? "Sem descrição"}
            </div>
          </Text>

          <Text variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Grupo:</span> {todo.group?.name ?? "Sem grupo"}
          </Text>

          <Text variant="paragraph-small" className="text-gray-300">
            <span className="font-semibold">Criado em:</span>{" "}
            {new Date(todo.createdAt).toLocaleDateString("pt-BR")}
          </Text>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleDelete}
            variant="secondary"
            disabled={deleting}
            className="hover:bg-red-600"
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
          <Button onClick={() => startClose()} variant="primary">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
}
