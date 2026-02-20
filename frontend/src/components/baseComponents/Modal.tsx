import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  closeOnBackdrop?: boolean;
  fullScreenOnMobile?: boolean;
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
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const el = containerRef.current;
    window.setTimeout(() => el?.focus(), 0);
    return () => previous?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onMove(event: PointerEvent) {
      if (!dragging) return;
      setPosition({
        left: event.clientX - offsetRef.current.x,
        top: event.clientY - offsetRef.current.y,
      });
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
  }, [dragging, open]);

  function startDrag(event: React.PointerEvent) {
    if (!draggable || !containerRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, [role="button"], input, textarea, a, select, label')) return;

    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    const rect = containerRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setPosition({ left: rect.left, top: rect.top });
    setDragging(true);
  }

  function resetPosition() {
    setPosition(null);
  }

  if (!open || typeof document === "undefined") return null;

  const positionStyle = position
    ? ({ position: "fixed", left: position.left, top: position.top, transform: "none", zIndex: 130 } as const)
    : {};

  const responsiveBase = [
    "w-full max-w-screen-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-4 sm:mx-0",
    fullScreenOnMobile ? "h-[calc(100vh-1rem)] sm:h-auto" : "",
  ].join(" ");

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/60 py-2 sm:items-center sm:py-6"
      role="presentation"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-desc" : undefined}
        tabIndex={-1}
        style={positionStyle}
        onClick={(event) => event.stopPropagation()}
        className={`
          relative flex max-h-[calc(100vh-1rem)] flex-col rounded-xl bg-background-primary p-6 shadow-lg transition-all duration-150 ease-out transform sm:max-h-[calc(100vh-3rem)]
          ${responsiveBase}
          ${className}
        `}
      >
        <div
          className={`flex items-start justify-between gap-4 ${draggable ? "cursor-grab select-none" : ""}`}
          onPointerDown={draggable ? startDrag : undefined}
          onDoubleClick={draggable ? resetPosition : undefined}
          style={{ cursor: draggable ? (dragging ? "grabbing" : "grab") : undefined }}
        >
          {title ? (
            <h2 id="modal-title" className="text-heading text-lg font-bold">
              {title}
            </h2>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded p-2 text-label hover:text-accent-red focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            x
          </button>
        </div>

        {description && (
          <p id="modal-desc" className="mt-2 mb-4 text-sm text-label">
            {description}
          </p>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
