import { type ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  // Fecha o modal ao apertar ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background-primary rounded-xl shadow-lg w-full max-w-md p-6 relative">
        {title && <h2 className="text-heading text-lg font-bold mb-2">{title}</h2>}
        {description && <p className="text-label text-sm mb-4">{description}</p>}
        <div className="space-x-2 flex justify-end">{children}</div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-label hover:text-accent-red"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
