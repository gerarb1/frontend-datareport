import { supabase } from './supabase';
import type {
  ApiResponse,
  Usuario,
  LoginResponse,
  RegisterResponse,
  SyncProfileResponse,
  Proyecto,
  CrearProyectoPayload,
  Informe,
  CrearInformePayload,
  TransicionInformePayload,
  InformeVersion,
  CrearVersionPayload,
  HistorialTransicion,
  PresignedUrlRequest,
  PresignedUrlResponse,
  Revision,
  CrearRevisionPayload,
  MetricasDashboard,
  AuditoriaResponse,
} from './types';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787/api/v1';

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('iasa_access_token');
  if (stored) return stored;

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch (err) {
    console.warn('Error fetching Supabase session:', err);
  }
  return null;
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('iasa_access_token', token);
    document.cookie = `sb-access-token=${token}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    localStorage.removeItem('iasa_access_token');
    localStorage.removeItem('iasa_user');
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function getStoredUser(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('iasa_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: Usuario | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('iasa_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('iasa_user');
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Error inesperado en la respuesta del servidor' };
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Error HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (payload: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
      const res = await apiFetch<ApiResponse<LoginResponse>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.data?.access_token) {
        setAuthToken(res.data.access_token);
        if (res.data.user) {
          setStoredUser(res.data.user);
        }
      }
      return res;
    },
    register: (payload: { email: string; password: string; nombre: string }): Promise<ApiResponse<RegisterResponse>> =>
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    syncProfile: (): Promise<ApiResponse<SyncProfileResponse>> =>
      apiFetch('/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    me: async (): Promise<ApiResponse<Usuario>> => {
      const res = await apiFetch<ApiResponse<Usuario>>('/auth/me');
      if (res.data) {
        setStoredUser(res.data);
      }
      return res;
    },
    logout: async () => {
      setAuthToken(null);
      try {
        await supabase.auth.signOut();
      } catch {}
    },
  },

  proyectos: {
    listar: (): Promise<ApiResponse<Proyecto[]>> => apiFetch('/proyectos'),
    crear: (payload: CrearProyectoPayload): Promise<ApiResponse<Proyecto>> =>
      apiFetch('/proyectos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  informes: {
    crear: (payload: CrearInformePayload): Promise<ApiResponse<Informe>> =>
      apiFetch('/informes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    transicion: (id: string, payload: TransicionInformePayload): Promise<ApiResponse<Informe>> =>
      apiFetch(`/informes/${id}/transicion`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    crearVersion: (id: string, payload: CrearVersionPayload): Promise<ApiResponse<InformeVersion>> =>
      apiFetch(`/informes/${id}/versiones`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    historial: (id: string): Promise<ApiResponse<HistorialTransicion[]>> =>
      apiFetch(`/informes/${id}/historial`),
  },

  storage: {
    presignedUrl: (payload: PresignedUrlRequest): Promise<ApiResponse<PresignedUrlResponse>> =>
      apiFetch('/storage/presigned-url', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    uploadToR2: async (uploadUrl: string, file: File | Blob, mimeType?: string): Promise<void> => {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': mimeType || file.type || 'application/octet-stream',
        },
      });
      if (!res.ok) {
        throw new Error(`Error al subir archivo a R2: ${res.status} ${res.statusText}`);
      }
    },
  },

  revisiones: {
    crear: (payload: CrearRevisionPayload): Promise<ApiResponse<Revision>> =>
      apiFetch('/revisiones', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  metrics: {
    dashboard: (): Promise<ApiResponse<MetricasDashboard>> => apiFetch('/metrics/dashboard'),
    auditoria: (params: { limit?: number; offset?: number; entidad?: string } = {}): Promise<ApiResponse<AuditoriaResponse>> => {
      const query = new URLSearchParams();
      if (params.limit !== undefined) query.set('limit', params.limit.toString());
      if (params.offset !== undefined) query.set('offset', params.offset.toString());
      if (params.entidad) query.set('entidad', params.entidad);
      const qs = query.toString();
      return apiFetch(`/metrics/auditoria${qs ? `?${qs}` : ''}`);
    },
  },

  health: {
    check: (): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> =>
      apiFetch('/health'),
  },
};
