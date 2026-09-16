export type Rol = 'superadmin' | 'revisor' | 'investigador' | 'auxiliar';

export type EstadoInforme =
  | 'borrador'
  | 'recibido'
  | 'enviado'
  | 'en_revision'
  | 'observado'
  | 'corregido'
  | 'aprobado'
  | 'rechazado';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

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

export type StorageTipo = 'informe' | 'dataset';

export interface PresignedUrlRequest {
  tipo: StorageTipo;
  filename: string;
  size_bytes: number;
  mime_type: string;
  target_id: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_key: string;
}

export type ResultadoRevision = 'observado' | 'aprobado' | 'rechazado';

export interface Observacion {
  id: string;
  detalle: string;
  subsanada: boolean;
  creado_en: string;
}

export interface Revision {
  id: string;
  informe_version_id: string;
  revisor_id: string;
  resultado: ResultadoRevision;
  dictamen_general: string;
  fecha_revision: string;
  observaciones: Observacion[];
}

export interface CrearRevisionPayload {
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
  metadatos: Record<string, any>;
  fecha: string;
}

export interface AuditoriaResponse {
  registros: RegistroAuditoria[];
  total: number;
  limit: number;
  offset: number;
}

export interface CeldaInvalida {
  fila: string | number;
  columna: string;
  mensaje?: string;
}
