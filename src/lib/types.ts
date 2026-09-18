// ─────────────────────────────────────────────────────────────
// types.ts — Tipos y DTOs estrictos alineados al contrato real
// de los 4 microservicios desplegados en Cloudflare Workers.
// ─────────────────────────────────────────────────────────────

// ═══════════════  Roles y Estados  ═══════════════

export type Rol = 'superadmin' | 'revisor' | 'investigador' | 'auxiliar';

/**
 * Estados permitidos según el ENUM de PostgreSQL.
 * Transiciones válidas:
 *  borrador  → enviado
 *  enviado   → en_revision
 *  en_revision → observado | aprobado | rechazado
 *  observado → borrador
 *  rechazado → borrador
 */
export type EstadoInforme =
  | 'borrador'
  | 'enviado'
  | 'en_revision'
  | 'observado'
  | 'aprobado'
  | 'rechazado';

export type ResultadoRevision = 'observado' | 'aprobado' | 'rechazado';

export type StorageTipo = 'informe' | 'dataset';

// ═══════════════  Respuesta genérica de la API  ═══════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

// ═══════════════  MS1: Autenticación y Perfiles  ═══════════════

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface LoginResponse {
  access_token: string;
  user: Usuario;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
}

export interface SyncProfileResponse {
  synced: boolean;
}

// ═══════════════  MS2: Gestión Académica e Informes  ═══════════════

export interface Proyecto {
  id: string;
  titulo: string;
  descripcion: string;
  creador_id: string;
  activo: boolean;
  creado_en: string;
}

export interface CrearProyectoPayload {
  titulo: string;
  descripcion: string;
}

export interface Informe {
  id: string;
  proyecto_id: string;
  titulo: string;
  estado: EstadoInforme;
  creador_id: string;
  actualizado_en: string | null;
  creado_en: string;
}

export interface CrearInformePayload {
  proyecto_id: string;
  titulo: string;
}

export interface TransicionInformePayload {
  nuevo_estado: EstadoInforme;
  comentario?: string;
}

export interface InformeVersion {
  id: string;
  informe_id: string;
  numero_version: number;
  archivo_key_r2: string;
  archivo_nombre: string;
  archivo_tamano_bytes: number;
  tipo_mime: string;
  hash_archivo: string;
  resumen_cambios: string;
  subido_por?: string;
  creado_en: string;
}

export interface CrearVersionPayload {
  archivo_key_r2: string;
  archivo_nombre: string;
  archivo_tamano_bytes: number;
  tipo_mime: string;
  hash_archivo: string;
  resumen_cambios: string;
}

export interface HistorialTransicion {
  id: string;
  informe_id: string;
  estado_anterior: EstadoInforme;
  estado_nuevo: EstadoInforme;
  cambiado_por: string;
  comentario: string | null;
  creado_en: string;
}

// ═══════════════  MS3: Revisiones, Dictámenes y Auditoría  ═══════════════

export interface Revision {
  id: string;
  informe_id: string;
  informe_version_id: string;
  revisor_id: string;
  resultado: ResultadoRevision;
  dictamen_general: string;
  fecha_revision: string;
  observaciones: string[];
}

export interface CrearRevisionPayload {
  informe_id: string;
  informe_version_id: string;
  resultado: ResultadoRevision;
  dictamen_general: string;
  observaciones?: string[];
}

export interface MetricasDashboard {
  informes_por_estado: Partial<Record<EstadoInforme, number>>;
  total_informes: number;
  total_proyectos_activos: number;
}

export interface RegistroAuditoria {
  id: number;
  usuario_id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  metadatos: Record<string, unknown>;
  fecha: string;
}

export interface AuditoriaResponse {
  registros: RegistroAuditoria[];
  total: number;
  limit: number;
  offset: number;
}

// ═══════════════  MS4: Almacenamiento R2  ═══════════════

export interface StorageUploadResponse {
  file_key: string;
  filename: string;
  bytes: number;
}

// ═══════════════  Utilidades de UI  ═══════════════

export interface CeldaInvalida {
  fila: string | number;
  columna: string;
  mensaje?: string;
}

// ═══════════════  LanguageTool  ═══════════════

export interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: {
    id: string;
    description: string;
    category: { id: string; name: string };
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
}

export interface LanguageToolResponse {
  software: { name: string; version: string };
  language: { name: string; code: string };
  matches: LanguageToolMatch[];
}
