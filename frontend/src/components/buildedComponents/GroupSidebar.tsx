/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useGroups } from "../../hooks/useGroups";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import { Trash2, Search, Users, Folder } from "lucide-react";
import { Modal } from "../baseComponents/Modal";
import { deleteGroup } from "../../api/groups";
import { GroupChatModal } from "./GroupChatModal";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Cores para os avatares dos grupos
const avatarColors = [
  "linear-gradient(135deg, #1ccfc3 0%, #66eae1 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
];

function getAvatarColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

export function GroupSidebar({
  onHide,
  gridPinnedGroupIds = [],
  onToggleGroupPinned,
}: {
  onHide?: () => void;
  gridPinnedGroupIds?: string[];
  onToggleGroupPinned?: (groupId: string) => void;
}) {
  const { data: groups = [], refetch, isLoading } = useGroups();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");
  const [groupToDelete, setGroupToDelete] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatModalGroup, setChatModalGroup] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g: any) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedGroupId((prev) => (prev === id ? null : id));
  }

  async function handleDeleteGroup(id: string) {
    try {
      await deleteGroup(id)
      setIsModalOpen(false);
      setGroupToDelete(null);
      setErrorMsg(null);
      refetch?.();
      if (expandedGroupId === id) setExpandedGroupId(null);
    } catch (err: any) {
      console.error("Erro ao deletar grupo:", err?.message ?? err);
      setErrorMsg(err?.message || 'Erro ao deletar grupo');
    }
  }

  function openDeleteModal(group: any) {
    setGroupToDelete(group);
    setIsModalOpen(true);
  }

  function closeDeleteModal() {
    setGroupToDelete(null);
    setIsModalOpen(false);
  }

  // loading
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-brand/20 flex items-center justify-center">
              <Folder className="w-4 h-4 text-accent-brand " />
            </div>
            <div>
              <Text variant="heading-small" className="text-heading">Grupos</Text>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">
              <div className="w-6 h-6 bg-accent-brand/30 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // estado vazio
  if (groups.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-brand/20 flex items-center justify-center">
              <Folder className="w-4 h-4 text-accent-brand" />
            </div>
            <div>
              <Text variant="heading-small" className="text-heading">Grupos</Text>
            </div>
          </div>

          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 rounded-full bg-background-tertiary/50 flex items-center justify-center mx-auto mb-4 border border-border-primary">
              <Users className="w-6 h-6 text-accent-paragraph" />
            </div>
            <Text variant="paragraph-small" className="text-accent-paragraph">
              Você ainda não participa de nenhum grupo.
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-gradient-to-b from-background-secondary/80 to-background-tertiary/60 backdrop-blur-sm">
        {/* Header com gradiente */}
        <div className="p-5 border-b border-border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-brand to-accent-brand-light flex items-center justify-center shadow-lg">
              <Folder className="w-4 h-4 text-white" />
            </div>
            <div>
              <Text variant="heading-small" className="text-heading font-semibold">Grupos</Text>
              <Text variant="paragraph-small" className="text-accent-paragraph/80 text-xs">
                Organize suas tarefas por times
              </Text>
            </div>
            {onHide && (
              <div className="ml-auto">
                <Button variant="ghost" onClick={onHide} className="p-2">Fechar</Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search size={16} className="text-accent-paragraph/60" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar grupos..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-primary/50 border border-border-primary/50 text-label placeholder:text-accent-paragraph/60 focus:outline-none focus:ring-2 focus:ring-accent-brand/30 focus:border-accent-brand/50 transition-all backdrop-blur-sm"
              aria-label="Buscar grupos"
            />
          </div>
        </div>

        {/* Lista desktop com scroll customizado */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-4 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-accent-brand/20 [&::-webkit-scrollbar-thumb]:rounded-sm hover:[&::-webkit-scrollbar-thumb]:bg-accent-brand/40">
            {filtered.map((group: any, index: number) => (
              <div key={group.id} className="space-y-2">
                <div
                  onClick={() => toggleExpand(group.id)}
                  role="button"
                  tabIndex={0}
                  className="group relative p-3 rounded-xl hover:bg-background-primary/40 transition-all duration-200 border border-transparent hover:border-border-primary/30 backdrop-blur-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar  */}
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold shadow-lg ring-2 ring-white/10"
                      style={{ background: getAvatarColor(index) }}
                    >
                      <span className="text-sm">{initials(group.name)}</span>
                    </div>

                    {/* Info do grupo */}
                    <div className="flex-1 min-w-0">
                      <Text variant="label-small" className="truncate text-heading font-medium">
                        {group.name}
                      </Text>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-accent-paragraph/60" />
                        <Text variant="paragraph-small" className="text-accent-paragraph/80">
                          {group.members?.length ?? 0} {group.members?.length === 1 ? 'membro' : 'membros'}
                        </Text>
                      </div>
                    </div>

                    {/* Botão delete com hover melhorado */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal(group); }}
                        variant="ghost"
                        title={`Deletar ${group.name}`}
                        className="p-2 hover:bg-accent-red/20 hover:text-accent-red rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Indicador de atividade */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-accent-brand rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {expandedGroupId === group.id && (
                  <div className="p-3 bg-background-primary/40 rounded-md border border-border-primary/20">
                    <div className="mb-2">
                      <Text variant="paragraph-small" className="font-semibold">Descrição</Text>
                      <Text variant="paragraph-small" className="text-accent-paragraph">{group.description ?? 'Sem descrição'}</Text>
                      <label className="mt-3 inline-flex items-center gap-2 text-sm text-accent-paragraph">
                        <input
                          type="checkbox"
                          checked={gridPinnedGroupIds.includes(group.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleGroupPinned?.(group.id);
                          }}
                        />
                        Mostrar grupo na grid
                      </label>
                    </div>

                    <div>
                      <Text variant="paragraph-small" className="font-semibold mb-1">Membros</Text>
                      <div className="space-y-2">
                        {group.members?.map((m: any) => (
                          <div key={m.user.id} className="flex items-center justify-between p-2 rounded border border-border-primary/10">
                            <div>
                              <Text variant="label-small" className="font-medium bg-background-tertiary px-2 py-1 rounded-full">{m.user.name ?? 'Usuário'}</Text>
                              <Text variant="paragraph-small" className="text-accent-paragraph mt-1">{m.user.email}</Text>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex gap-1 justify-end">
                        {/* Leave group (current user) - mostra só se for membro */}
                        {group.members?.some((m: any) => m.user.id === user?.id) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!window.confirm('Tem certeza que deseja sair deste grupo?')) return;
                              // call API
                              import('../../api/groups').then(({ leaveGroup }) => {
                                leaveGroup(group.id).then(() => {
                                  refetch?.();
                                  setExpandedGroupId(null);
                                }).catch((err) => setErrorMsg(err.message || 'Erro ao sair do grupo'));
                              });
                            }}
                          >
                            Sair do grupo
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setChatModalGroup(group); }}
                        >
                          Abrir chat
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(group); }}
                        >
                          Apagar grupo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile chips melhorados */}
        <div className="md:hidden p-4 border-t border-border-primary/30">
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-accent-brand/20 [&::-webkit-scrollbar-thumb]:rounded-sm">
            {filtered.map((group: any, index: number) => (
              <div
                key={group.id}
                onClick={() => toggleExpand(group.id)}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-background-primary/50 border border-border-primary/50 backdrop-blur-sm cursor-pointer"
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" 
                  style={{ background: getAvatarColor(index) }}
                >
                  <Text variant="paragraph-small" className="text-white font-bold text-xs">
                    {initials(group.name)}
                  </Text>
                </div>

                <Text variant="paragraph-small" className="truncate max-w-[120px] text-heading font-medium">
                  {group.name}
                </Text>

                <Button 
                  onClick={(e) => { e.stopPropagation(); openDeleteModal(group); }} 
                  variant="ghost" 
                  className="p-1 hover:bg-accent-red/20 hover:text-accent-red rounded-md"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal melhorado */}
      {groupToDelete && (
        <Modal
          open={isModalOpen}
          onClose={closeDeleteModal}
          title="Deletar Grupo"
          description={`Tem certeza que deseja deletar o grupo "${groupToDelete.name}"? Essa ação não pode ser desfeita.`}
        >
          {errorMsg && <Text variant="paragraph-small" className="text-red-500 mb-4">{errorMsg}</Text>}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={closeDeleteModal}
              className="px-4 py-2"
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteGroup(groupToDelete.id)}
              className="px-4 py-2 bg-accent-red hover:bg-accent-red/90"
            >
              Deletar
            </Button>
          </div>
        </Modal>
      )}

      {/* Group chat modal */}
      {chatModalGroup && (
        <GroupChatModal open={!!chatModalGroup} onClose={() => setChatModalGroup(null)} groupId={chatModalGroup?.id} />
      )}

    </>
  );
}
