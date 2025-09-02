import { useState } from 'react';
import type { Group } from '../../types/types'; 
import { createTodo } from '../../api/todos'; 
interface Props {
  groups: Group[];
  selectedGroup?: string;
  onGroupChange: (groupId?: string) => void;
  onCreated: () => void;
  onCancel: () => void;
}

export default function NewTaskForm({ groups, selectedGroup, onGroupChange, onCreated, onCancel }: Props) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTodo({ title, groupId: selectedGroup });
      onCreated();
      setTitle('');
    } catch (err) {
      console.error('Erro ao criar tarefa', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Título da tarefa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 rounded border"
        required
      />

      <select
        value={selectedGroup || ''}
        onChange={(e) => onGroupChange(e.target.value || undefined)}
        className="w-full p-2 rounded border"
      >
        <option value="">Selecione um grupo (opcional)</option>
        {(groups || []).map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>


      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-500 text-white">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
          Criar
        </button>
      </div>
    </form>
  );
}
