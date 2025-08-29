
import NewTaskForm from '../buildedComponents/NewTaskForm';

export default function NewTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <NewTaskForm
          onCreated={() => {
            onCreated?.();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}