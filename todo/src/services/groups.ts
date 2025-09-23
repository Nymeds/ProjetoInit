import api from "./api";

export interface GroupPayload {
  name: string;
  description?: string;
  userEmails: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: { id: string; email: string; name: string }[];
}

export const createGroup = async (payload: GroupPayload): Promise<Group> => {
  try {
    const response = await api.post<Group>("/groups", payload);
    return response.data;
  } catch (err: any) {
    
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Erro ao criar grupo";

    throw new Error(msg);
  }
};

export const getGroups = async (): Promise<Group[]> => {
  try {
    const response = await api.get("/groups");
    const data = response.data;

    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.groups)) return data.groups;

    return [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Erro ao carregar grupos";
    throw new Error(msg);
  }
};
export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await api.delete(`/groups/${id}`);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data ||
      err?.message ||
      "Erro ao apagar grupo";
    throw new Error(msg);
  }
};
