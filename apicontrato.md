# API DataReport IASA — Contrato para Frontend

> **Base URL**: `https://<worker-domain>/api/v1`
>
> **Autenticación**: Todas las rutas protegidas requieren el header:
> ```
> Authorization: Bearer <access_token>
> ```

---

## Formato de Respuesta Estándar

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional descriptivo"
}
```

### Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "details": "Detalle técnico opcional"
}
```

### Códigos HTTP Utilizados

| Código | Significado |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Solicitud inválida (validación, JSON malformado) |
| `401` | No autenticado (token faltante o inválido) |
| `403` | Prohibido (perfil inexistente, inactivo o sin permisos) |
| `404` | Recurso no encontrado |
| `422` | Entidad no procesable (transición de estado ilegal) |
| `500` | Error interno del servidor |

---

## 1. Auth — `/api/v1/auth`

### `POST /api/v1/auth/register`

Registro de usuario. **No requiere autenticación.**

**Request Body:**
```json
{
  "email": "investigador@iasa.edu",
  "password": "MiPassword123!",
  "nombre": "Carlos Mendoza"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "email": "investigador@iasa.edu"
  },
  "message": "Registro exitoso. Verifica tu correo electrónico."
}
```

---

### `POST /api/v1/auth/login`

Inicio de sesión. **No requiere autenticación.**

**Request Body:**
```json
{
  "email": "investigador@iasa.edu",
  "password": "MiPassword123!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "email": "investigador@iasa.edu",
      "nombre": "Carlos Mendoza",
      "rol": "investigador"
    }
  }
}
```

---

### `POST /api/v1/auth/sync-profile`

Sincroniza el perfil del usuario si existe en `auth.users` pero no en `perfiles`. Crea un perfil con rol `auxiliar`. **Requiere token válido.**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response `201` (perfil creado):**
```json
{
  "success": true,
  "data": { "synced": true },
  "message": "Perfil sincronizado correctamente"
}
```

---

### `GET /api/v1/auth/me`

Retorna la información del usuario autenticado. **Requiere autenticación completa.**

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "email": "investigador@iasa.edu",
    "rol": "investigador",
    "nombre": "Carlos Mendoza"
  }
}
```

---

## 2. Proyectos — `/api/v1/proyectos`

### `GET /api/v1/proyectos`
Lista proyectos. `superadmin` y `revisor` ven todos (incluidos inactivos). Otros roles ven solo activos.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "titulo": "Estudio de biodiversidad amazónica",
      "descripcion": "Análisis de especies endémicas en la cuenca del Amazonas",
      "creador_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "activo": true,
      "creado_en": "2026-09-01T14:30:00.000Z"
    }
  ]
}
```

### `POST /api/v1/proyectos`
Crea un proyecto. **Requiere rol `investigador` o `superadmin`.**

**Request Body:**
```json
{
  "titulo": "Estudio de biodiversidad amazónica",
  "descripcion": "Análisis de especies endémicas en la cuenca del Amazonas"
}
```

---

## 3. Informes — `/api/v1/informes`

### `POST /api/v1/informes`
Crea un informe en estado `borrador`. **Requiere rol `investigador`, `auxiliar` o `superadmin`.**

**Request Body:**
```json
{
  "proyecto_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "titulo": "Informe trimestral Q3 2026"
}
```

### `POST /api/v1/informes/:id/transicion`
Cambia el estado de un informe.
Transiciones válidas:
- `borrador → enviado`
- `enviado → en_revision`
- `en_revision → observado | aprobado | rechazado`
- `observado → enviado`
- `rechazado → borrador`

**Request Body:**
```json
{
  "nuevo_estado": "enviado",
  "comentario": "Informe listo para revisión"
}
```

### `POST /api/v1/informes/:id/versiones`
Crea una nueva versión del informe.

**Request Body:**
```json
{
  "archivo_key_r2": "informes/b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9e/1725534000000_informe_q3.pdf",
  "archivo_nombre": "informe_q3.pdf",
  "archivo_tamano_bytes": 2048576,
  "tipo_mime": "application/pdf",
  "hash_archivo": "sha256:abc123def456...",
  "resumen_cambios": "Corrección de tablas y actualización de gráficos"
}
```

### `GET /api/v1/informes/:id/historial`
Retorna historial de cambios de estado del informe.

---

## 4. Storage — `/api/v1/storage`

### `POST /api/v1/storage/presigned-url`
Genera una URL prefirmada para subir archivo a Cloudflare R2 vía `PUT`.
Tipos: `informe` (max 15MB, PDF/DOCX) y `dataset` (max 50MB, CSV/XLSX/ZIP).

**Request Body:**
```json
{
  "tipo": "informe",
  "filename": "informe_q3_2026.pdf",
  "size_bytes": 2048576,
  "mime_type": "application/pdf",
  "target_id": "b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9e"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://...",
    "file_key": "informes/b5c6d7e8.../1725534000000_informe_q3_2026.pdf"
  }
}
```

---

## 5. Revisiones — `/api/v1/revisiones`

### `POST /api/v1/revisiones`
Crea una revisión completa con observaciones opcionales. **Requiere rol `revisor` o `superadmin`.**

**Request Body:**
```json
{
  "informe_version_id": "c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f",
  "resultado": "observado",
  "dictamen_general": "El informe requiere correcciones...",
  "observaciones": [
    "La sección 3.2 no incluye el análisis estadístico requerido"
  ]
}
```

---

## 6. Métricas — `/api/v1/metrics`

### `GET /api/v1/metrics/dashboard`
Dashboard de métricas. **Requiere rol `superadmin` o `revisor`.**

### `GET /api/v1/metrics/auditoria`
Registros de auditoría paginados. **Requiere rol `superadmin`.**
Params: `limit`, `offset`, `entidad`.

---

## 7. Health Check

### `GET /api/v1/health`
Verificación de salud del servicio.
