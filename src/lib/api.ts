// ─────────────────────────────────────────────────────────────
// api.ts — Cliente HTTP desacoplado que enruta cada petición
// al subdominio correcto según la variable de entorno de cada
// microservicio. Sin Supabase, sin PUBLIC_API_BASE_URL.
// ─────────────────────────────────────────────────────────────

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
  Revision,
  CrearRevisionPayload,
  MetricasDashboard,
  AuditoriaResponse,
  StorageUploadResponse,
} from './types';

// ═══════════════  URLs de los 4 Microservicios  ═══════════════

const MS_AUTH     = import.meta.env.PUBLIC_MS_AUTH_URL     ?? 'http://localhost:8787';
const MS_ACADEMIC = import.meta.env.PUBLIC_MS_ACADEMIC_URL ?? 'http://localhost:8788';
const MS_REVIEWS  = import.meta.env.PUBLIC_MS_REVIEWS_URL  ?? 'http://localhost:8789';
const MS_STORAGE  = import.meta.env.PUBLIC_MS_STORAGE_URL  ?? 'http://localhost:8790';

// ═══════════════  Token Management  ═══════════════

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('iasa_access_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('iasa_access_token', token);
  } else {
    localStorage.removeItem('access_token');
    localStorage.removeItem('iasa_access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('iasa_user');
  }
}

export function getStoredUser(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user') || localStorage.getItem('iasa_user');
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
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('iasa_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('iasa_user');
  }
}

// ═══════════════  Fetch genérico con Auth  ═══════════════

async function apiFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: unknown;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Error inesperado en la respuesta del servidor' };
  }

  if (!res.ok) {
    const errorMsg =
      (data as Record<string, string>)?.error ??
      (data as Record<string, string>)?.message ??
      `Error HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ═══════════════  API pública  ═══════════════

export const api = {
  // ───── MS1: Autenticación y Perfiles ─────
  auth: {
    login: async (payload: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
      const res = await apiFetch<ApiResponse<LoginResponse>>(MS_AUTH, '/api/v1/auth/login', {
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
      apiFetch(MS_AUTH, '/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    syncProfile: (): Promise<ApiResponse<SyncProfileResponse>> =>
      apiFetch(MS_AUTH, '/api/v1/auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({}),
      }),

    me: async (): Promise<ApiResponse<Usuario>> => {
      const res = await apiFetch<ApiResponse<Usuario>>(MS_AUTH, '/api/v1/auth/me');
      if (res.data) {
        setStoredUser(res.data);
      }
      return res;
    },

    updateRole: (userId: string, rol: string): Promise<ApiResponse<Usuario>> =>
      apiFetch(MS_AUTH, `/api/v1/auth/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ rol }),
      }),

    logout: () => {
      setAuthToken(null);
    },
  },

  // ───── MS2: Gestión Académica e Informes ─────
  proyectos: {
    listar: (): Promise<ApiResponse<Proyecto[]>> =>
      apiFetch(MS_ACADEMIC, '/api/v1/proyectos'),

    crear: (payload: CrearProyectoPayload): Promise<ApiResponse<Proyecto>> =>
      apiFetch(MS_ACADEMIC, '/api/v1/proyectos', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  informes: {
    listar: (params?: { proyecto_id?: string; estado?: string }): Promise<ApiResponse<Informe[]>> => {
      const query = new URLSearchParams();
      if (params?.proyecto_id) query.set('proyecto_id', params.proyecto_id);
      if (params?.estado && params.estado !== 'todos') query.set('estado', params.estado);
      const qs = query.toString();
      return apiFetch(MS_ACADEMIC, `/api/v1/informes${qs ? `?${qs}` : ''}`);
    },

    obtener: (id: string): Promise<ApiResponse<Informe>> =>
      apiFetch(MS_ACADEMIC, `/api/v1/informes/${id}`),

    crear: (payload: CrearInformePayload): Promise<ApiResponse<Informe>> =>
      apiFetch(MS_ACADEMIC, '/api/v1/informes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    transicion: (id: string, payload: TransicionInformePayload): Promise<ApiResponse<Informe>> =>
      apiFetch(MS_ACADEMIC, `/api/v1/informes/${id}/transicion`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    crearVersion: (id: string, payload: CrearVersionPayload): Promise<ApiResponse<InformeVersion>> =>
      apiFetch(MS_ACADEMIC, `/api/v1/informes/${id}/versiones`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    versiones: (id: string): Promise<ApiResponse<InformeVersion[]>> =>
      apiFetch(MS_ACADEMIC, `/api/v1/informes/${id}/versiones`),

    historial: (id: string): Promise<ApiResponse<HistorialTransicion[]>> =>
      apiFetch(MS_ACADEMIC, `/api/v1/informes/${id}/historial`),
  },

  // ───── MS3: Revisiones, Dictámenes y Auditoría ─────
  revisiones: {
    crear: (payload: CrearRevisionPayload): Promise<ApiResponse<Revision>> =>
      apiFetch(MS_REVIEWS, '/api/v1/revisiones', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  metrics: {
    dashboard: (): Promise<ApiResponse<MetricasDashboard>> =>
      apiFetch(MS_REVIEWS, '/api/v1/metrics/dashboard'),

    auditoria: (params: { limit?: number; offset?: number; entidad?: string } = {}): Promise<ApiResponse<AuditoriaResponse>> => {
      const query = new URLSearchParams();
      if (params.limit !== undefined) query.set('limit', params.limit.toString());
      if (params.offset !== undefined) query.set('offset', params.offset.toString());
      if (params.entidad) query.set('entidad', params.entidad);
      const qs = query.toString();
      return apiFetch(MS_REVIEWS, `/api/v1/metrics/auditoria${qs ? `?${qs}` : ''}`);
    },
  },

  // ───── MS4: Almacenamiento R2 (subida directa por stream binario) ─────
  storage: {
    /**
     * Subida directa de archivo binario a R2.
     * PUT /api/v1/storage/upload con headers especiales.
     */
    upload: async (params: {
      file: File | Blob;
      fileType: 'informe' | 'dataset';
      targetId: string;
      filename: string;
      mimeType: string;
    }): Promise<ApiResponse<StorageUploadResponse>> => {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': params.mimeType,
        'X-File-Type': params.fileType,
        'X-Target-Id': params.targetId,
        'X-Filename': params.filename,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${MS_STORAGE}/api/v1/storage/upload`, {
        method: 'PUT',
        headers,
        body: params.file,
      });

      let data: unknown;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Error inesperado al subir archivo' };
      }

      if (!res.ok) {
        const errorMsg =
          (data as Record<string, string>)?.error ??
          `Error al subir archivo a R2: ${res.status} ${res.statusText}`;
        throw new Error(errorMsg);
      }

      return data as ApiResponse<StorageUploadResponse>;
    },

    /**
     * URL de descarga / previsualización de archivos almacenados en R2.
     */
    getFileUrl: (fileKey: string): string =>
      `${MS_STORAGE}/api/v1/storage/file/${fileKey}`,
  },

  // ───── Health Checks (uno por microservicio) ─────
  health: {
    auth: (): Promise<{ status: string }> =>
      apiFetch(MS_AUTH, '/health'),
    academic: (): Promise<{ status: string }> =>
      apiFetch(MS_ACADEMIC, '/health'),
    reviews: (): Promise<{ status: string }> =>
      apiFetch(MS_REVIEWS, '/health'),
    storage: (): Promise<{ status: string }> =>
      apiFetch(MS_STORAGE, '/health'),
    /**
     * Comprueba la salud de los 4 microservicios en paralelo.
     * Retorna true si todos responden OK.
     */
    checkAll: async (): Promise<boolean> => {
      try {
        const results = await Promise.allSettled([
          fetch(`${MS_AUTH}/health`),
          fetch(`${MS_ACADEMIC}/health`),
          fetch(`${MS_REVIEWS}/health`),
          fetch(`${MS_STORAGE}/health`),
        ]);
        return results.every((r) => r.status === 'fulfilled' && r.value.ok);
      } catch {
        return false;
      }
    },
  },
};