import api from './api';

export interface ApiConversation {
  id: number;
  title: string;
  model: string;
  updated_at: string;
}

export interface ApiConversationDetail extends ApiConversation {
  created_at: string;
  messages: ApiMessage[];
}

export interface ApiMessage {
  id: number;
  role: string;
  content: string;
  reasoning_content: string | null;
  created_at: string;
}

export async function fetchConversations(): Promise<ApiConversation[]> {
  const r = await api.get<ApiConversation[]>('/conversations');
  return r.data;
}

export async function fetchConversation(id: number): Promise<ApiConversationDetail> {
  const r = await api.get<ApiConversationDetail>(`/conversations/${id}`);
  return r.data;
}

export async function createConversation(title?: string): Promise<ApiConversation> {
  const r = await api.post<ApiConversation>('/conversations', { title: title ?? undefined });
  return r.data;
}

export async function updateConversation(id: number, title: string): Promise<void> {
  await api.patch(`/conversations/${id}`, { title });
}

export async function deleteConversation(id: number): Promise<void> {
  await api.delete(`/conversations/${id}`);
}
