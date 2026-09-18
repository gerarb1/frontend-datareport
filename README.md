# DataReport IASA — Frontend

Frontend del sistema de control de calidad, revisión y validación de datos científicos del **Instituto IASA**. Construido con **Astro SSR**, **React 19**, **TypeScript**, **TanStack Query** y **Tailwind CSS**. Desplegable en **Cloudflare Workers** vía `@astrojs/cloudflare`.

---

## Arquitectura de Microservicios

El frontend es **100% agnóstico de la base de datos**. No interactúa directamente con Supabase ni contiene credenciales de base de datos. Toda la comunicación se realiza exclusivamente a través de 4 microservicios independientes desplegados en Cloudflare Workers:

| Microservicio | Variable de Entorno | Responsabilidad |
|---|---|---|
| **MS1 — Auth** | `PUBLIC_MS_AUTH_URL` | Autenticación, registro, perfiles, roles |
| **MS2 — Academic** | `PUBLIC_MS_ACADEMIC_URL` | Proyectos, informes, versiones, transiciones |
| **MS3 — Reviews** | `PUBLIC_MS_REVIEWS_URL` | Revisiones, dictámenes, métricas, auditoría |
| **MS4 — Storage** | `PUBLIC_MS_STORAGE_URL` | Almacenamiento R2 (subida/descarga de archivos) |

Adicionalmente se integra la API de **LanguageTool** (`PUBLIC_LANGUAGETOOL_URL`) para verificación ortográfica y gramatical.

---

## Variables de Entorno

```env
PUBLIC_MS_AUTH_URL=https://ms-auth.<subdominio>.workers.dev
PUBLIC_MS_ACADEMIC_URL=https://ms-academic.<subdominio>.workers.dev
PUBLIC_MS_REVIEWS_URL=https://ms-reviews.<subdominio>.workers.dev
PUBLIC_MS_STORAGE_URL=https://ms-storage.<subdominio>.workers.dev
PUBLIC_LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
```

---

## Máquina de Estados (Informes)

Los estados y transiciones siguen estrictamente el ENUM de PostgreSQL validado por triggers en el backend:

```
         ┌──────────┐
         │ borrador  │◄──────────────────────────┐
         └────┬─────┘                            │
              │                                  │
              ▼                                  │
         ┌──────────┐                            │
         │ enviado   │                            │
         └────┬─────┘                            │
              │                                  │
              ▼                                  │
      ┌───────────────┐                          │
      │  en_revision   │                          │
      └──┬──────┬──────┘                          │
         │      │      │                          │
         ▼      ▼      ▼                          │
   observado  aprobado  rechazado ─────────────────┘
       │                                          
       └──────────────────────────────────────────┘
```

**Estados válidos:** `borrador` | `enviado` | `en_revision` | `observado` | `aprobado` | `rechazado`

**Transiciones válidas:**
1. `borrador` → `enviado` — Investigador envía informe
2. `enviado` → `en_revision` — Revisor asume la revisión
3. `en_revision` → `observado` | `aprobado` | `rechazado` — Dictamen del revisor (vía MS3)
4. `observado` → `borrador` — Reapertura tras observación
5. `rechazado` → `borrador` — Reapertura por rechazo

---

## Mapa de Endpoints por Microservicio

### MS1: Autenticación (`PUBLIC_MS_AUTH_URL`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/v1/auth/register` | No | Registro `{ email, password, nombre }` |
| `POST` | `/api/v1/auth/login` | No | Login → `{ access_token, user }` |
| `POST` | `/api/v1/auth/sync-profile` | Sí | Sincronización de perfil |
| `GET` | `/api/v1/auth/me` | Sí | Datos del usuario autenticado |
| `PATCH` | `/api/v1/auth/users/:id/role` | superadmin | Cambiar rol `{ rol }` |

### MS2: Gestión Académica (`PUBLIC_MS_ACADEMIC_URL`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/api/v1/proyectos` | Sí | Listar proyectos |
| `POST` | `/api/v1/proyectos` | investigador/superadmin | Crear proyecto `{ titulo, descripcion }` |
| `POST` | `/api/v1/informes` | investigador/auxiliar/superadmin | Crear informe `{ proyecto_id, titulo }` |
| `POST` | `/api/v1/informes/:id/transicion` | Sí | Transición de estado `{ nuevo_estado, comentario }` |
| `POST` | `/api/v1/informes/:id/versiones` | Sí | Registrar versión `{ archivo_key_r2, ... }` |
| `GET` | `/api/v1/informes/:id/historial` | Sí | Historial de transiciones |

### MS3: Revisiones y Auditoría (`PUBLIC_MS_REVIEWS_URL`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/v1/revisiones` | revisor/superadmin | Emitir dictamen `{ informe_id, informe_version_id, resultado, dictamen_general, observaciones[] }` |
| `GET` | `/api/v1/metrics/dashboard` | revisor/superadmin | Dashboard de métricas |
| `GET` | `/api/v1/metrics/auditoria` | superadmin | Registros de auditoría `?limit=20&offset=0&entidad=informes` |

### MS4: Almacenamiento R2 (`PUBLIC_MS_STORAGE_URL`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |
| `PUT` | `/api/v1/storage/upload` | Sí | Subida directa de binario. Headers: `Content-Type`, `X-File-Type`, `X-Target-Id`, `X-Filename`. Body: archivo binario |
| `GET` | `/api/v1/storage/file/*` | Sí | Descarga/previsualización por `file_key` |

> **Nota:** MS4 **NO** usa URLs prefirmadas ni SDK de AWS. La subida es directa por stream binario.

---

## Procesamiento Documental en Cliente

El frontend integra las siguientes librerías para examinar documentos directamente en el navegador:

| Librería | Uso | Formatos |
|----------|-----|----------|
| `mammoth` | Extraer texto/HTML de documentos Word | `.docx` |
| `papaparse` | Parseo de CSV por streaming | `.csv` |
| `xlsx` (SheetJS) | Lectura de hojas de cálculo | `.xlsx`, `.xls` |
| `pdfjs-dist` | Previsualización y extracción de texto de PDFs | `.pdf` |

### LanguageTool

El servicio `src/lib/languagetool.ts` consume `PUBLIC_LANGUAGETOOL_URL` para analizar el texto extraído y detectar errores ortográficos y gramaticales. Los errores se muestran al revisor con sugerencias de corrección antes de emitir su dictamen.

---

## Estructura del Proyecto

```
src/
├── components/
│   ├── admin/
│   │   ├── AuditoriaTabla.tsx      # Tabla paginada de auditoría (MS3)
│   │   └── MetricasCards.tsx        # Dashboard de métricas KPI (MS3)
│   ├── auth/
│   │   └── LoginForm.tsx            # Formulario login/registro (MS1)
│   ├── common/
│   │   ├── EstadoBadge.tsx          # Badge de estado (6 estados válidos)
│   │   └── Sidebar.tsx              # Navegación lateral con health checks
│   ├── informes/
│   │   ├── DetalleInformeView.tsx   # Vista detalle de informe
│   │   ├── HistorialEstados.tsx     # Bitácora de transiciones (MS2)
│   │   ├── InformesLista.tsx        # Listado con filtros (MS2)
│   │   ├── PanelRevision.tsx        # Panel de revisión + LanguageTool (MS2/MS3/MS4)
│   │   ├── SubirVersionModal.tsx    # Modal de subida directa a R2 (MS4 + MS2)
│   │   └── TablaDatosGrid.tsx       # Grid react-data-grid para datos QC
│   ├── proyectos/
│   │   └── ProyectosLista.tsx       # CRUD de proyectos (MS2)
│   └── providers/
│       └── AppProviders.tsx         # QueryClientProvider
├── layouts/
│   ├── BaseLayout.astro             # HTML base con SEO
│   └── DashboardLayout.astro        # Layout con sidebar y topbar
├── lib/
│   ├── api.ts                       # Cliente HTTP multi-microservicio
│   ├── documentParser.ts            # Parseo de DOCX/CSV/XLSX/PDF en cliente
│   ├── languagetool.ts              # Integración con LanguageTool API
│   ├── queryClient.ts               # Configuración de TanStack Query
│   └── types.ts                     # Tipos y DTOs alineados al contrato
├── middleware.ts                     # Guard de autenticación por cookie
├── pages/
│   ├── admin/
│   │   ├── auditoria.astro
│   │   └── dashboard.astro
│   ├── informes/
│   │   ├── [id].astro
│   │   └── index.astro
│   ├── proyectos/
│   │   └── index.astro
│   ├── index.astro                  # Redirect a /informes o /login
│   └── login.astro
└── styles/
    └── global.css                   # Estilos base + react-data-grid overrides
```

---

## Flujo E2E del Sistema

1. **Registro/Login** — El usuario se registra (`POST /auth/register` → MS1) e inicia sesión (`POST /auth/login` → MS1). El frontend almacena el `access_token` y datos del usuario en `localStorage`.

2. **Crear Proyecto** — El investigador crea un proyecto (`POST /proyectos` → MS2).

3. **Crear Informe** — Se crea un informe asociado al proyecto en estado `borrador` (`POST /informes` → MS2).

4. **Subir Versión** — Se sube el archivo binario directo a R2 (`PUT /storage/upload` → MS4 con headers `X-File-Type`, `X-Target-Id`, `X-Filename`). Tras recibir `file_key`, se calcula SHA-256 en el cliente y se registra la versión (`POST /informes/:id/versiones` → MS2).

5. **Enviar a Revisión** — El investigador ejecuta la transición `borrador → enviado` (`POST /informes/:id/transicion` → MS2).

6. **Iniciar Revisión** — El revisor asume con la transición `enviado → en_revision`.

7. **Examinar Documento** — El revisor carga y parsea el documento (DOCX/PDF/CSV/XLSX) directamente en el navegador, verifica la ortografía con LanguageTool.

8. **Emitir Dictamen** — El revisor emite su dictamen (`POST /revisiones` → MS3) con resultado `observado`, `aprobado` o `rechazado`.

9. **Ciclo de Correcciones** — Si fue `observado` o `rechazado`, el informe puede volver a `borrador` para subir nueva versión.

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview local de build
pnpm preview
```

---

## Stack Tecnológico

- **Astro 7** con SSR (`output: 'server'`)
- **React 19** (islas interactivas vía `client:load`)
- **TypeScript 5** (strict mode)
- **TanStack Query 5** (cache, retry, invalidación)
- **Tailwind CSS 3** con paleta de colores personalizada
- **IBM Plex Sans / Mono** (tipografía institucional)
- **Lucide React** (iconografía)
- **react-data-grid** (grilla de datos tipo Excel)
- **mammoth** / **papaparse** / **xlsx** / **pdfjs-dist** (parseo documental)
- **LanguageTool API** (verificación ortográfica/gramatical)
- **Zod 4** + **React Hook Form** (validación de formularios)
- **Cloudflare Workers** (adapter `@astrojs/cloudflare`)
