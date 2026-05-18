const TOKEN_KEY = 'siri_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export type User = { id: string; email: string; name: string };
export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done';
  list: string;
  starred: number;
  created_at: number;
  updated_at: number;
};
export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string;
  pinned: number;
  created_at: number;
  updated_at: number;
};
export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  color: string;
};
export type Email = {
  id: string;
  sender: string;
  sender_email: string;
  subject: string;
  preview: string;
  body: string;
  received_at: number;
  is_read: number;
  is_starred: number;
  label: string | null;
};
export type Chat = { id: string; title: string; created_at: number; updated_at: number };
export type Message = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
};
