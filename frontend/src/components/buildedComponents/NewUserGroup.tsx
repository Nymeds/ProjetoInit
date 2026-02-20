/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users, Network, History } from "lucide-react";
import { Modal } from "../baseComponents/Modal";
import { Button } from "../baseComponents/button";
import { Text } from "../baseComponents/text";
import {
  createGroup,
  getGroupHistory,
  updateGroup,
  type GroupHistoryEvent,
  type GroupPermission,
  type GroupRolePayload,
  type GroupResponse,
  type UpdateGroupData,
} from "../../api/groups";
import { listFriends } from "../../api/friends";
import { useAuth } from "../../hooks/useAuth";
import { useGroups } from "../../hooks/useGroups";

interface FriendItem {
  id: string;
  name: string;
  email: string;
}

interface RoleDraft {
  id?: string;
  name: string;
  permissions: GroupPermission[];
  isDefault?: boolean;
  isSystem?: boolean;
}

type EditTab = "members" | "roles" | "workflow" | "history";

interface NewUserGroupFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onGoToAddFriends?: () => void;
  mode?: "create" | "edit";
  groupToEdit?: GroupResponse | null;
}

const ALL_PERMISSIONS: Array<{ key: GroupPermission; label: string }> = [
  { key: "MANAGE_MEMBERS", label: "Gerenciar membros" },
  { key: "MANAGE_ROLES", label: "Gerenciar cargos" },
  { key: "MANAGE_WORKFLOW", label: "Gerenciar fluxo" },
  { key: "MOVE_TASK", label: "Mover tarefas" },
  { key: "MOVE_TASK_TO_NO_GROUP", label: "Mover para sem grupo" },
  { key: "REMOVE_TASK", label: "Remover tarefas" },
  { key: "VIEW_HISTORY", label: "Ver historico" },
];

const sectionClassName = "rounded-2xl border border-border-primary/60 bg-background-secondary/40 p-4 shadow-sm";
const MAX_ROLE_NAME_LENGTH = 10;

function normalizePermissionList(permissions: GroupPermission[]): GroupPermission[] {
  return Array.from(new Set(permissions)).sort();
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export default function NewUserGroupForm({
  open,
  onClose,
  onCreated,
  onGoToAddFriends,
  mode = "create",
  groupToEdit = null,
}: NewUserGroupFormProps) {
  const { user } = useAuth();
  const { data: allGroups = [] } = useGroups({ enabled: open && mode === "edit" });
  const isEditMode = mode === "edit" && !!groupToEdit;

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [removeUserIds, setRemoveUserIds] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleDraft[]>([]);
  const [removeRoleIds, setRemoveRoleIds] = useState<string[]>([]);
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string | null>>({});
  const [relatedGroupIds, setRelatedGroupIds] = useState<string[]>([]);
  const [history, setHistory] = useState<GroupHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<EditTab>("members");

  const existingMemberIds = useMemo(() => {
    return new Set((groupToEdit?.members ?? []).map((member) => member.userId));
  }, [groupToEdit]);

  const currentUserMembership = useMemo(() => {
    if (!isEditMode || !user?.id) return null;
    return (groupToEdit?.members ?? []).find((member) => member.userId === user.id) ?? null;
  }, [groupToEdit, isEditMode, user?.id]);

  const currentUserPermissionSet = useMemo(() => {
    return new Set((currentUserMembership?.groupRole?.permissions ?? []).map((item) => item.permission));
  }, [currentUserMembership]);

  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUserMembership) return false;
    const normalizedRoleName = currentUserMembership.groupRole?.name?.trim().toLowerCase();
    return currentUserMembership.roleInGroup === "ADMIN" || normalizedRoleName === "admin";
  }, [currentUserMembership]);

  const canManageMembers = !isEditMode || isCurrentUserAdmin || currentUserPermissionSet.has("MANAGE_MEMBERS");
  const canManageRoles = !isEditMode || isCurrentUserAdmin || currentUserPermissionSet.has("MANAGE_ROLES");
  const canManageWorkflow = !isEditMode || isCurrentUserAdmin || currentUserPermissionSet.has("MANAGE_WORKFLOW");
  const canViewHistory = !isEditMode || isCurrentUserAdmin || currentUserPermissionSet.has("VIEW_HISTORY");
  const canEditGroupCore = !isEditMode || canManageWorkflow;
  const canManageAnyEdit = canManageMembers || canManageRoles || canManageWorkflow;

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && groupToEdit) {
      setGroupName(groupToEdit.name ?? "");
      setDescription(groupToEdit.description ?? "");
      setRelatedGroupIds((groupToEdit.childGroups ?? []).map((child) => child.id));

      const roleDrafts = (groupToEdit.roles ?? []).map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((item) => item.permission),
        isDefault: role.isDefault,
        isSystem: role.isSystem,
      }));
      setRoles(roleDrafts);

      const roleMap: Record<string, string | null> = {};
      (groupToEdit.members ?? []).forEach((member) => {
        roleMap[member.userId] = member.groupRoleId ?? null;
      });
      setMemberRoleMap(roleMap);

      if (canViewHistory) {
        setHistoryLoading(true);
        getGroupHistory(groupToEdit.id)
          .then((items) => setHistory(items))
          .catch(() => setHistory([]))
          .finally(() => setHistoryLoading(false));
      } else {
        setHistory([]);
        setHistoryLoading(false);
      }
    } else {
      setGroupName("");
      setDescription("");
      setRoles([]);
      setMemberRoleMap({});
      setRelatedGroupIds([]);
      setHistory([]);
    }

    setSelectedFriendIds([]);
    setRemoveUserIds([]);
    setRemoveRoleIds([]);
    setError(null);
    setActiveTab("members");

    listFriends()
      .then((data) => {
        setFriends(data.friends.map((friend) => ({ id: friend.id, name: friend.name, email: friend.email })));
      })
      .catch(() => setFriends([]));
  }, [open, mode, groupToEdit, canViewHistory]);

  if (!open) return null;

  const availableRelatedGroups = allGroups.filter((group) => group.id !== groupToEdit?.id);

  function toggleFriendSelection(friendId: string) {
    if (isEditMode && !canManageMembers) return;
    setSelectedFriendIds((prev) => (
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    ));
  }

  function toggleRemoveUser(userId: string) {
    if (!canManageMembers) return;
    setRemoveUserIds((prev) => (
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    ));
  }

  function toggleRelatedGroup(groupId: string) {
    if (!canManageWorkflow) return;
    setRelatedGroupIds((prev) => (
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    ));
  }

  function updateRoleName(index: number, value: string) {
    if (!canManageRoles) return;
    setRoles((prev) => prev.map((role, roleIndex) => (
      roleIndex === index ? { ...role, name: value } : role
    )));
  }

  function toggleRolePermission(index: number, permission: GroupPermission) {
    if (!canManageRoles) return;
    setRoles((prev) => prev.map((role, roleIndex) => {
      if (roleIndex !== index) return role;

      const hasPermission = role.permissions.includes(permission);
      return {
        ...role,
        permissions: hasPermission
          ? role.permissions.filter((item) => item !== permission)
          : [...role.permissions, permission],
      };
    }));
  }

  function setDefaultRole(index: number) {
    if (!canManageRoles) return;
    setRoles((prev) => prev.map((role, roleIndex) => ({
      ...role,
      isDefault: roleIndex === index,
    })));
  }

  function validateRoleDraft(role: RoleDraft): string {
    const roleName = role.name.trim();
    if (!roleName) {
      throw new Error("Todo cargo precisa ter nome");
    }

    if (roleName.length > MAX_ROLE_NAME_LENGTH) {
      throw new Error(`Nome do cargo deve ter no maximo ${MAX_ROLE_NAME_LENGTH} caracteres`);
    }

    if (role.permissions.length === 0) {
      throw new Error(`O cargo "${roleName}" precisa ter ao menos uma permissao`);
    }

    return roleName;
  }

  function addNewRole() {
    if (!canManageRoles) return;
    setRoles((prev) => [
      ...prev,
      {
        id: `tmp:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: "",
        permissions: ["MOVE_TASK"],
        isDefault: false,
      },
    ]);
  }

  function removeRole(index: number) {
    if (!canManageRoles) return;
    setRoles((prev) => {
      const role = prev[index];
      if (!role) return prev;
      if (role.isSystem) return prev;

      if (role.id && !role.id.startsWith("tmp:")) {
        setRemoveRoleIds((current) => (current.includes(role.id!) ? current : [...current, role.id!]));
      }

      const updated = prev.filter((_, roleIndex) => roleIndex !== index);
      if (!updated.some((item) => item.isDefault) && updated.length > 0) {
        updated[0] = { ...updated[0], isDefault: true };
      }
      return updated;
    });
  }

  function updateMemberRole(userId: string, roleId: string | null) {
    if (!canManageRoles) return;
    setMemberRoleMap((prev) => ({
      ...prev,
      [userId]: roleId,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!groupName.trim()) {
      setError("Nome do grupo e obrigatorio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedFriends = friends.filter((friend) => selectedFriendIds.includes(friend.id));
      const selectedFriendEmails = selectedFriends.map((friend) => friend.email.toLowerCase());

      if (mode === "edit") {
        if (!groupToEdit?.id) throw new Error("Grupo invalido para edicao");

        const payload: UpdateGroupData = {};

        if (canManageWorkflow) {
          const originalName = (groupToEdit.name ?? "").trim();
          const nextName = groupName.trim();
          if (nextName !== originalName) {
            payload.name = groupName;
          }

          const originalDescription = (groupToEdit.description ?? "").trim();
          const nextDescription = description.trim();
          if (nextDescription !== originalDescription) {
            payload.description = description;
          }

          const originalRelatedGroupIds = Array.from(new Set((groupToEdit.childGroups ?? []).map((child) => child.id))).sort();
          const nextRelatedGroupIds = Array.from(new Set(relatedGroupIds)).sort();
          if (!areStringArraysEqual(originalRelatedGroupIds, nextRelatedGroupIds)) {
            payload.relatedGroupIds = relatedGroupIds;
          }
        }

        if (canManageMembers) {
          const addUserEmails = selectedFriendEmails.filter((email) => {
            const exists = (groupToEdit.members ?? []).some((member) => member.user.email.toLowerCase() === email);
            return !exists;
          });

          if (addUserEmails.length > 0) {
            payload.addUserEmails = addUserEmails;
          }

          const normalizedRemoveUserIds = Array.from(
            new Set(removeUserIds.map((id) => id.trim()).filter((id) => id.length > 0)),
          );
          if (normalizedRemoveUserIds.length > 0) {
            payload.removeUserIds = normalizedRemoveUserIds;
          }
        }

        if (canManageRoles) {
          const currentRoleMap = new Map(
            (groupToEdit.members ?? []).map((member) => [member.userId, member.groupRoleId ?? null]),
          );

          const memberRoleChanges = Object.entries(memberRoleMap)
            .filter(([memberId, roleId]) => currentRoleMap.get(memberId) !== roleId)
            .map(([memberId, roleId]) => ({
              userId: memberId,
              roleId,
            }));

          if (memberRoleChanges.length > 0) {
            payload.memberRoleChanges = memberRoleChanges;
          }

          const existingRolesById = new Map(
            (groupToEdit.roles ?? []).map((role) => [
              role.id,
              {
                name: role.name.trim(),
                permissions: normalizePermissionList(role.permissions.map((item) => item.permission)),
                isDefault: Boolean(role.isDefault),
              },
            ]),
          );

          const rolesToUpsert: GroupRolePayload[] = [];
          for (const role of roles) {
            const roleId = role.id;
            const normalizedPermissions = normalizePermissionList(role.permissions);
            const isNewRole = !roleId || roleId.startsWith("tmp:");

            if (isNewRole) {
              const roleName = validateRoleDraft(role);
              rolesToUpsert.push({
                ...(roleId ? { clientKey: roleId } : {}),
                name: roleName,
                permissions: role.permissions,
                isDefault: role.isDefault,
              });
              continue;
            }

            const existingRole = existingRolesById.get(roleId);
            if (!existingRole) {
              const roleName = validateRoleDraft(role);
              rolesToUpsert.push({
                id: roleId,
                name: roleName,
                permissions: role.permissions,
                isDefault: role.isDefault,
              });
              continue;
            }

            const roleName = role.name.trim();
            const isChanged = roleName !== existingRole.name
              || Boolean(role.isDefault) !== existingRole.isDefault
              || !areStringArraysEqual(normalizedPermissions, existingRole.permissions);

            if (isChanged) {
              const validatedRoleName = validateRoleDraft(role);
              rolesToUpsert.push({
                id: roleId,
                name: validatedRoleName,
                permissions: role.permissions,
                isDefault: role.isDefault,
              });
            }
          }

          if (rolesToUpsert.length > 0) {
            payload.upsertRoles = rolesToUpsert;
          }

          const normalizedRemoveRoleIds = Array.from(
            new Set(removeRoleIds.map((id) => id.trim()).filter((id) => id.length > 0)),
          );
          if (normalizedRemoveRoleIds.length > 0) {
            payload.removeRoleIds = normalizedRemoveRoleIds;
          }
        }

        if (Object.keys(payload).length === 0) {
          throw new Error(
            canManageAnyEdit
              ? "Nenhuma alteracao detectada para salvar"
              : "Voce nao tem permissao para alterar este grupo",
          );
        }

        await updateGroup(groupToEdit.id, payload);
      } else {
        const creatorEmail = user?.email?.trim().toLowerCase();
        const userEmails = Array.from(
          new Set([...(creatorEmail ? [creatorEmail] : []), ...selectedFriendEmails]),
        );

        if (userEmails.length < 2) {
          setError("Adicione pelo menos um amigo para criar o grupo");
          setLoading(false);
          return;
        }

        await createGroup({
          name: groupName,
          description,
          userEmails,
        });
      }

      onCreated?.();
      onClose();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message
        || err?.response?.data
        || err?.message
        || "Erro desconhecido";
      setError(String(backendMsg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Configuracoes do Grupo" : "Novo Grupo"}
      className="max-w-[1220px] w-[95vw]"
      fullScreenOnMobile
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-accent-brand/20 bg-gradient-to-r from-accent-brand/10 via-background-secondary/50 to-background-secondary/20 p-4">
          <Text variant="heading-small" className="text-heading">
            {mode === "edit" ? groupName || "Editar grupo" : "Crie um grupo"}
          </Text>
          <Text variant="paragraph-small" className="mt-1 text-accent-paragraph">
            Defina membros, cargos personalizados e fluxo entre subgrupos.
          </Text>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={sectionClassName}>
            <Text variant="label-small" className="text-heading">Nome do grupo</Text>
            <input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Empresa Init"
              disabled={isEditMode && !canEditGroupCore}
              className="mt-2 w-full rounded-xl border border-border-primary bg-background-secondary p-2.5 focus:outline-none focus:ring-2 focus:ring-accent-brand"
            />
          </div>

          <div className={sectionClassName}>
            <Text variant="label-small" className="text-heading">Descricao</Text>
            <textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o grupo"
              disabled={isEditMode && !canEditGroupCore}
              className="mt-2 w-full rounded-xl border border-border-primary bg-background-secondary p-2.5 focus:outline-none focus:ring-2 focus:ring-accent-brand"
              rows={3}
            />
          </div>
        </div>

        {isEditMode && (
          <>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border-primary/60 bg-background-secondary/30 p-2">
              {[
                { id: "members" as const, label: "Membros", icon: Users },
                { id: "roles" as const, label: "Cargos", icon: ShieldCheck },
                { id: "workflow" as const, label: "Fluxo", icon: Network },
                { id: "history" as const, label: "Historico", icon: History, disabled: !canViewHistory },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                const disabled = Boolean(tab.disabled);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      setActiveTab(tab.id);
                    }}
                    disabled={disabled}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent-brand/20 text-accent-brand border border-accent-brand/30"
                        : "text-accent-paragraph hover:bg-background-secondary"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "members" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className={sectionClassName}>
                  <Text variant="label-small" className="text-heading">Membros atuais</Text>
                  <div className="mt-2 max-h-64 space-y-2 overflow-auto">
                    {(groupToEdit.members ?? []).map((member) => (
                      <div key={member.userId} className="rounded-xl border border-border-primary/60 bg-background-primary/30 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <Text variant="label-small" className="text-heading">
                              {member.user.name}
                            </Text>
                            <Text variant="paragraph-small" className="text-accent-paragraph">
                              {member.user.email}
                            </Text>
                          </div>

                          <label className="inline-flex items-center gap-2 text-xs text-accent-paragraph">
                            <input
                              type="checkbox"
                              checked={removeUserIds.includes(member.userId)}
                              disabled={member.userId === user?.id || !canManageMembers}
                              onChange={() => toggleRemoveUser(member.userId)}
                            />
                            Remover
                          </label>
                        </div>

                        <div className="mt-2">
                          <Text variant="paragraph-small" className="text-accent-paragraph">Cargo</Text>
                          <select
                            value={memberRoleMap[member.userId] ?? ""}
                            onChange={(e) => updateMemberRole(member.userId, e.target.value || null)}
                            disabled={!canManageRoles}
                            className="mt-1 w-full rounded-lg border border-border-primary bg-background-secondary p-2 text-sm"
                          >
                            <option value="">Padrao do grupo</option>
                            {roles.map((role, roleIndex) => {
                              const value = role.id ?? `tmp-role-${roleIndex}`;
                              return (
                                <option key={value} value={value}>
                                  {role.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={sectionClassName}>
                  <Text variant="label-small" className="text-heading">Adicionar amigos</Text>
                  <div className="mt-2 max-h-64 space-y-2 overflow-auto">
                    {friends.length === 0 && (
                      <div className="rounded-xl border border-border-primary/50 bg-background-primary/30 p-3">
                        <Text variant="paragraph-small" className="text-accent-paragraph">
                          Voce ainda nao tem amigos aceitos.
                        </Text>
                        {onGoToAddFriends && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mt-2"
                            onClick={onGoToAddFriends}
                          >
                            Adicionar amigos
                          </Button>
                        )}
                      </div>
                    )}

                    {friends.map((friend) => {
                      const alreadyInGroup = existingMemberIds.has(friend.id);
                      return (
                        <label key={friend.id} className="flex items-center gap-2 rounded-lg border border-border-primary/40 bg-background-primary/30 p-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedFriendIds.includes(friend.id)}
                            disabled={alreadyInGroup || !canManageMembers}
                            onChange={() => toggleFriendSelection(friend.id)}
                          />
                          <span className="flex-1">{friend.name} ({friend.email})</span>
                          {alreadyInGroup && <span className="text-xs text-accent-paragraph">ja no grupo</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "roles" && (
              <div className={sectionClassName}>
                <div className="flex items-center justify-between gap-2">
                  <Text variant="label-small" className="text-heading">Cargos personalizados</Text>
                  <Button type="button" variant="secondary" size="sm" onClick={addNewRole} disabled={!canManageRoles}>
                    Novo cargo
                  </Button>
                </div>
                {!canManageRoles && (
                  <Text variant="paragraph-small" className="mt-2 text-accent-paragraph">
                    Seu cargo atual nao pode criar, editar ou remover cargos.
                  </Text>
                )}

                <div className="mt-3 max-h-[60vh] space-y-3 overflow-auto">
                  {roles.map((role, roleIndex) => (
                    <div key={role.id ?? `${role.name}-${roleIndex}`} className="rounded-xl border border-border-primary/60 bg-background-primary/30 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={role.name}
                          onChange={(e) => updateRoleName(roleIndex, e.target.value)}
                          disabled={!canManageRoles || (role.isSystem && role.name.toLowerCase() === "admin")}
                          maxLength={MAX_ROLE_NAME_LENGTH}
                          placeholder={`Nome do cargo (max ${MAX_ROLE_NAME_LENGTH})`}
                          className="min-w-[180px] flex-1 rounded-lg border border-border-primary bg-background-secondary p-2 text-sm"
                        />

                        {role.isSystem && (
                          <span className="rounded-full border border-accent-brand/30 bg-accent-brand/10 px-2 py-1 text-xs text-accent-brand">
                            Sistema
                          </span>
                        )}

                        <label className="inline-flex items-center gap-1 text-xs text-accent-paragraph">
                          <input
                            type="radio"
                            name="default-role"
                            checked={Boolean(role.isDefault)}
                            onChange={() => setDefaultRole(roleIndex)}
                            disabled={!canManageRoles}
                          />
                          Padrao
                        </label>

                        {!role.isSystem && (
                          <Button type="button" size="sm" variant="danger" onClick={() => removeRole(roleIndex)} disabled={!canManageRoles}>
                            Remover
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_PERMISSIONS.map((permissionItem) => (
                          <label key={permissionItem.key} className="inline-flex items-center gap-2 rounded-lg border border-border-primary/40 bg-background-secondary/40 p-2 text-xs">
                            <input
                              type="checkbox"
                              checked={role.permissions.includes(permissionItem.key)}
                              onChange={() => toggleRolePermission(roleIndex, permissionItem.key)}
                              disabled={!canManageRoles || (role.isSystem && role.name.toLowerCase() === "admin")}
                            />
                            {permissionItem.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "workflow" && (
              <div className={sectionClassName}>
                <Text variant="label-small" className="text-heading">Subgrupos relacionados</Text>
                <Text variant="paragraph-small" className="mt-1 text-accent-paragraph">
                  Tarefas do fluxo ficam limitadas a estes grupos, conforme permissoes.
                </Text>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {availableRelatedGroups.length === 0 && (
                    <Text variant="paragraph-small" className="text-accent-paragraph">
                      Nenhum grupo disponivel para relacionar.
                    </Text>
                  )}

                  {availableRelatedGroups.map((group) => (
                    <label key={group.id} className="inline-flex items-center gap-2 rounded-lg border border-border-primary/40 bg-background-primary/30 p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={relatedGroupIds.includes(group.id)}
                        onChange={() => toggleRelatedGroup(group.id)}
                        disabled={!canManageWorkflow}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className={sectionClassName}>
                <Text variant="label-small" className="text-heading">Historico de tarefas</Text>
                <div className="mt-3 max-h-[60vh] space-y-2 overflow-auto">
                  {!canViewHistory && (
                    <Text variant="paragraph-small" className="text-accent-paragraph">
                      Seu cargo atual nao permite visualizar o historico.
                    </Text>
                  )}
                  {historyLoading && (
                    <Text variant="paragraph-small" className="text-accent-paragraph">
                      Carregando historico...
                    </Text>
                  )}

                  {!historyLoading && canViewHistory && history.length === 0 && (
                    <Text variant="paragraph-small" className="text-accent-paragraph">
                      Nenhum evento registrado.
                    </Text>
                  )}

                  {canViewHistory && history.map((event) => (
                    <div key={event.id} className="rounded-xl border border-border-primary/60 bg-background-primary/30 p-3">
                      <Text variant="paragraph-small" className="text-heading">
                        {event.description}
                      </Text>
                      <Text variant="paragraph-small" className="mt-1 text-accent-paragraph">
                        {new Date(event.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!isEditMode && (
          <div className={sectionClassName}>
            <Text variant="label-small" className="text-heading">Escolha amigos para o grupo</Text>
            <div className="mt-2 max-h-56 space-y-2 overflow-auto">
              {friends.length === 0 && (
                <div className="rounded-xl border border-border-primary/50 bg-background-primary/30 p-3">
                  <Text variant="paragraph-small" className="text-accent-paragraph">
                    Voce ainda nao tem amigos aceitos.
                  </Text>
                  {onGoToAddFriends && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={onGoToAddFriends}
                    >
                      Adicionar amigos
                    </Button>
                  )}
                </div>
              )}

              {friends.map((friend) => (
                <label key={friend.id} className="flex items-center gap-2 rounded-lg border border-border-primary/40 bg-background-primary/30 p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedFriendIds.includes(friend.id)}
                    onChange={() => toggleFriendSelection(friend.id)}
                  />
                  <span>{friend.name} ({friend.email})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-accent-red/40 bg-accent-red/10 p-3">
            <Text variant="paragraph-small" className="text-danger">
              {error}
            </Text>
          </div>
        )}

        {isEditMode && !canManageAnyEdit && (
          <div className="rounded-xl border border-border-primary/60 bg-background-secondary/50 p-3">
            <Text variant="paragraph-small" className="text-accent-paragraph">
              Seu cargo atual nao permite editar este grupo.
            </Text>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading || (isEditMode && !canManageAnyEdit)}>
            {loading ? (mode === "edit" ? "Salvando..." : "Criando...") : (mode === "edit" ? "Salvar alteracoes" : "Criar Grupo")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
