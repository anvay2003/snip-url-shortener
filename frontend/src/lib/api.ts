const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      apiFetch<{ token: string; user: { id: string; email: string } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      apiFetch<{ token: string; user: { id: string; email: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  links: {
    list: () => apiFetch<Link[]>('/api/links'),
    create: (body: { url: string; slug?: string; title?: string }) =>
      apiFetch<Link>('/api/links', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => apiFetch(`/api/links/${id}`, { method: 'DELETE' }),
    analytics: (id: string) => apiFetch<Analytics>(`/api/links/${id}/analytics`),
  },
};

export interface Link {
  id: string;
  slug: string;
  original_url: string;
  title: string | null;
  shortUrl: string;
  click_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface Analytics {
  totalClicks: number;
  devices: { device: string; count: string }[];
  browsers: { browser: string; count: string }[];
  referers: { referer: string; count: string }[];
  timeline: { date: string; clicks: string }[];
}
