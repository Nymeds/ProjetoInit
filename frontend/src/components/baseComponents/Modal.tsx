import { type ReactNode, useEffect, useRef, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  draggable?: boolean; // permite arrastar quando true
  closeOnBackdrop?: boolean; // fecha ao clicar no backdrop
  fullScreenOnMobile?: boolean; // ocupa a tela em dispositivos pequenos
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
  draggable = false,
  closeOnBackdrop = true,
  fullScreenOnMobile = true,
}: ModalProps) {
  // Fecha o modal ao apertar ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // manage focus: save previously focused element, focus modal when opened, restore on close
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = containerRef.current;
    setTimeout(() => { el?.focus(); }, 0);
    return () => { prev?.focus?.(); };
  }, [open]);

  // Eventos de movimento quando arrastando
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      setPosition({ left: e.clientX - offsetRef.current.x, top: e.clientY - offsetRef.current.y });
    }

    function onUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  function startDrag(e: React.PointerEvent) {
    if (!draggable || !containerRef.current) return;
    const target = e.target as HTMLElement;
    // don't start drag if clicking interactive elements
    if (target.closest('button, [role="button"], input, textarea, a, select, label')) return;

    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPosition({ left: rect.left, top: rect.top });
    setDragging(true);
  }

  function resetPosition() {
    setPosition(null);
  }

  if (!open) return null;

  const positionStyle = position
    ? ({ position: "fixed", left: position.left, top: position.top, transform: "none", zIndex: 70 } as const)
    : {};

  // Layout responsivo: full-width em telas pequenas, limites maiores em telas grandes
  const responsiveBase = `w-full max-w-screen-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 sm:mx-0 ${fullScreenOnMobile ? 'h-full sm:h-auto' : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="presentation"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        tabIndex={-1}
        style={positionStyle}
        onClick={(e) => e.stopPropagation()}
        className={`
          bg-background-primary
          rounded-xl
          shadow-lg
          p-6
          relative
          transition-all duration-150 ease-out transform
          ${responsiveBase}
          ${className}
        `}
      >
        <div
          className={`flex items-start justify-between gap-4 ${draggable ? 'cursor-grab select-none' : ''}`}
          onPointerDown={draggable ? startDrag : undefined}
          onDoubleClick={draggable ? resetPosition : undefined}
          style={{ cursor: draggable ? (dragging ? 'grabbing' : 'grab') : undefined }}
        >
          {title ? (
            <h2
              id="modal-title"
              className="text-heading text-lg font-bold"
            >
              {title}
            </h2>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-label hover:text-accent-red bg-transparent p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              ✕
            </button>
          </div>
        </div>

        {description && (
          <p id="modal-desc" className="text-label text-sm mt-2 mb-4">
            {description}
          </p>
        )}

        <div className={`overflow-auto ${fullScreenOnMobile ? 'h-full sm:h-auto' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
