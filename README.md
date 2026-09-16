# DataReport IASA — Frontend de Control de Calidad Científico

Frontend desarrollado en **Astro + Islas de React + Tailwind CSS + TanStack Query**, construido con una dirección visual instrumental y diseñado para acoplarse de manera estricta al contrato de API v1 (`Hono` en Cloudflare Workers, autenticación con Supabase y almacenamiento de archivos en Cloudflare R2).

---

## 📑 Tabla de Contenidos

1. [Visión General y Filosofía de Diseño](#1-visión-general-y-filosofía-de-diseño)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Integración con el Contrato de API (Backend Hono)](#3-integración-con-el-contrato-de-api-backend-hono)
4. [Flujos Clave del Sistema](#4-flujos-clave-del-sistema)
   - [4.1 Autenticación y Sesión](#41-autenticación-y-sesión)
   - [4.2 Carga Directa a Cloudflare R2 (Presigned URLs)](#42-carga-directa-a-cloudflare-r2-presigned-urls)
   - [4.3 Máquina de Estados de Informes](#43-máquina-de-estados-de-informes)
   - [4.4 Grid de Datos Científicos y Reglas de Calidad](#44-grid-de-datos-científicos-y-reglas-de-calidad)
   - [4.5 Emisión de Revisiones y Auditoría](#45-emisión-de-revisiones-y-auditoría)
5. [Estructura del Código](#5-estructura-del-código)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Instrucciones de Instalación y Ejecución](#7-instrucciones-de-instalación-y-ejecución)

---

## 1. Visión General y Filosofía de Diseño

Este frontend no es una página de marketing ni un SaaS comercial genérico; es una **herramienta interna de laboratorio e instrumentación técnica** para investigadores, revisores de control de calidad (QC) y administradores del Instituto IASA.

### Principios visuales aplicados:
- **Paleta instrumental sobria:**
  - Fondo base: `#F5F6F4` (blanco frío de laboratorio, no crema cálido).
  - Tinta/Texto principal: `#1E2A2E` (casi negro con matiz verde-azulado).
  - Acento primario: `#136F63` (teal instrumental).
  - Bordes neutros: `#A9B4B3`.
- **Uso estricto del color de estado:**
  - `recibido`: `#8A9694` (gris)
  - `enviado` / `en_revision`: `#136F63` (teal)
  - `observado`: `#C97A2B` (ámbar)
  - `corregido`: `#3B6EA5` (azul)
  - `aprobado`: `#3E7D53` (verde)
  - `rechazado`: `#C4432B` (rojo)
- **Alarma `#C4432B`:** Este tono rojo está **reservado exclusivamente** para destacar celdas con valores numéricos fuera de rango paramétrico en tablas de datos o badges de rechazo. No se usa para botones, banners decorativos ni bordes ornamentales.
- **Tipografía técnica:**
  - `IBM Plex Sans`: UI general, títulos, modales y navegación.
  - `IBM Plex Mono`: Valores medidos (pH, coordenadas, temperaturas, turbidez), identificadores UUID, hashes SHA-256 y marcas de tiempo UTC.
- **Jerarquía y densidad:** Líneas finas, espaciado compacto sin "sopa de tarjetas" con sombras difusas ni gradientes.

---

## 2. Stack Tecnológico

| Módulo | Elección | Justificación técnica |
|---|---|---|
| **Framework Base** | Astro v7 (SSR) | Enrutamiento veloz, compilación optimizada y despliegue nativo en Cloudflare Pages |
| **Islas de UI** | React 19 | El mejor ecosistema para grids interactivos tipo Excel y componentes de formulario |
| **Grid Científico** | `react-data-grid` (MIT) | Edición celda a celda, navegación con flechas de teclado, copy/paste, sin problemas de licencias |
| **Estilos** | Tailwind CSS v3 | Tokens configurados en `tailwind.config.mjs` |
| **Estado y Caché API** | TanStack Query v5 | Peticiones tipadas, invalidación reactiva de queries tras mutaciones y reintentos automáticos |
| **Formularios** | `react-hook-form` + `zod` | Validación estricta en cliente compatible con esquemas de backend |
| **Auth y Realtime** | `@supabase/supabase-js` | Conexión con Supabase Auth y sincronización con el Worker |
| **Tipografía** | `@fontsource/ibm-plex-*` | Fuentes embebidas estables para despliegues sin dependencia de CDNs externos |
| **Gestor de paquetes** | `pnpm` | Estricto, determinista y rápido |

---

## 3. Integración con el Contrato de API (Backend Hono)

Toda la comunicación con el backend se centraliza en `src/lib/api.ts` y está 100% tipada en `src/lib/types.ts`. El frontend **no inventa rutas ni muta estructuras de datos**.

Todas las peticiones protegidas inyectan automáticamente el encabezado:
```http
Authorization: Bearer <access_token>
```

### Tabla de Rutas Consumidas

| Método | Endpoint Backend | Rol Frontend | Función en `src/lib/api.ts` |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | `api.auth.login(payload)` |
| `POST` | `/api/v1/auth/register` | Público | `api.auth.register(payload)` |
| `POST` | `/api/v1/auth/sync-profile` | Todos (con token) | `api.auth.syncProfile()` |
| `GET` | `/api/v1/auth/me` | Todos | `api.auth.me()` |
| `GET` | `/api/v1/proyectos` | Todos | `api.proyectos.listar()` |
| `POST` | `/api/v1/proyectos` | `investigador`, `superadmin` | `api.proyectos.crear(payload)` |
| `POST` | `/api/v1/informes` | `investigador`, `auxiliar`, `superadmin` | `api.informes.crear(payload)` |
| `POST` | `/api/v1/informes/:id/transicion`| Cualquiera autorizado | `api.informes.transicion(id, payload)` |
| `POST` | `/api/v1/informes/:id/versiones` | Cualquiera autorizado | `api.informes.crearVersion(id, payload)` |
| `GET` | `/api/v1/informes/:id/historial` | Cualquiera autorizado | `api.informes.historial(id)` |
| `POST` | `/api/v1/storage/presigned-url` | Cualquiera autorizado | `api.storage.presignedUrl(payload)` |
| `POST` | `/api/v1/revisiones` | `revisor`, `superadmin` | `api.revisiones.crear(payload)` |
| `GET` | `/api/v1/metrics/dashboard` | `superadmin`, `revisor` | `api.metrics.dashboard()` |
| `GET` | `/api/v1/metrics/auditoria` | `superadmin` | `api.metrics.auditoria(params)` |
| `GET` | `/api/v1/health` | Público | `api.health.check()` |

---

## 4. Flujos Clave del Sistema

### 4.1 Autenticación y Sesión
1. El usuario se autentica en `/login` (`POST /api/v1/auth/login`).
2. El frontend guarda el `access_token` en `localStorage` y en la cookie `sb-access-token` (para compatibilidad con SSR en `src/middleware.ts`).
3. Se invoca automáticamente `POST /api/v1/auth/sync-profile` para asegurar que el perfil exista en Supabase con rol asignado.
4. El sidebar consulta `GET /api/v1/auth/me` para adaptar la interfaz según el rol:
   - `investigador`: Gestión de proyectos, creación de informes y carga de versiones.
   - `revisor`: Trabajos asignados, emisión de revisiones/dictámenes y dashboard de métricas.
   - `auxiliar`: Creación de expedientes en borrador.
   - `superadmin`: Acceso irrestricto, métricas globales y visor de logs de auditoría.

### 4.2 Carga Directa a Cloudflare R2 (Presigned URLs)
El frontend implementa el flujo de 3 pasos documentado en el contrato para evitar sobrecargar la memoria del Worker con archivos pesados (hasta 15MB para informes o 50MB para datasets):

```
┌──────────┐               ┌─────────────────┐               ┌───────────────┐
│ Frontend │               │ Cloudflare R2   │               │ Hono Backend  │
└────┬─────┘               └────────┬────────┘               └───────┬───────┘
     │ 1. POST /storage/presigned-url (tipo, filename, size, mime)   │
     │──────────────────────────────────────────────────────────────>│
     │ 2. Retorna upload_url + file_key                              │
     │<──────────────────────────────────────────────────────────────│
     │                                                               │
     │ 3. PUT <upload_url> (directo con cuerpo binario del archivo)  │
     │─────────────────────────────>│                                │
     │                              │                                │
     │ 4. Calcula SHA-256 en cliente                                 │
     │ 5. POST /informes/:id/versiones (file_key, hash, metadata)    │
     │──────────────────────────────────────────────────────────────>│
     │ 6. Retorna versión registrada                                 │
     │<──────────────────────────────────────────────────────────────│
```

### 4.3 Máquina de Estados de Informes
El panel de revisión respeta rigurosamente las transiciones permitidas por los triggers de la base de datos:
- `borrador → enviado`: El investigador envía el informe a revisión.
- `enviado → en_revision`: El revisor asume el trabajo de auditoría.
- `en_revision → observado | aprobado | rechazado`: Emisión de dictamen oficial.
- `observado → enviado`: Reenvío tras subsanación de observaciones.
- `rechazado → borrador`: Reapertura de expediente para modificaciones de fondo.

Cualquier error `422` del backend es capturado y desplegado con el mensaje descriptivo exacto devuelto por PostgreSQL.

### 4.4 Grid de Datos Científicos y Reglas de Calidad
- Implementado con **`react-data-grid`** en `src/components/informes/TablaDatosGrid.tsx`.
- Permite la visualización y edición en vivo de mediciones fisicoquímicas (pH, conductividad, oxígeno disuelto, turbidez, etc.).
- Las celdas marcadas como inválidas por el control de calidad se resaltan inmediatamente con estilo de alarma:
  - Color de texto: `#C4432B`.
  - Fondo tenue: `rgba(196, 67, 43, 0.08)`.
  - Tooltip explicativo con el motivo del desvío paramétrico.
- Incluye exportador a formato CSV estandarizado.

### 4.5 Emisión de Revisiones y Auditoría
- **Revisiones (`POST /api/v1/revisiones`):** Permite al revisor seleccionar la versión evaluada, definir el resultado (`observado`, `aprobado` o `rechazado`), emitir el dictamen general y redactar observaciones puntuales en bloque.
- **Auditoría (`GET /api/v1/metrics/auditoria`):** Tabla paginada (`limit`/`offset`) con filtros por entidad (`informes`, `proyectos`, `revisiones`) e inspección directa de los metadatos JSON del evento.
- **Telemetría (`GET /api/v1/metrics/dashboard`):** Indicadores de expedientes por estado y tasas porcentuales de aprobación.

---

## 5. Estructura del Código

```text
frontiasa/
├── apicontrato.md                       # Contrato de API v1 de referencia
├── astro.config.mjs                     # Astro SSR + @astrojs/cloudflare + React + Tailwind
├── tailwind.config.mjs                  # Paleta instrumental y tokens de estado
├── tsconfig.json                        # Configuración TypeScript estricta con alias @/*
├── package.json                         # Dependencias manejadas con pnpm
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro             # Layout HTML raíz con IBM Plex Sans/Mono
│   │   └── DashboardLayout.astro        # Layout de aplicación con topbar y sidebar
│   ├── pages/
│   │   ├── index.astro                  # Redirección inteligente según sesión
│   │   ├── login.astro                  # Pantalla de acceso / registro
│   │   ├── proyectos/
│   │   │   └── index.astro              # Lista y creación de proyectos
│   │   ├── informes/
│   │   │   ├── index.astro              # Lista de informes con badges y filtros
│   │   │   └── [id].astro               # Detalle de expediente QC
│   │   └── admin/
│   │       ├── dashboard.astro          # Telemetría y estadísticas
│   │       └── auditoria.astro          # Registros inmutables de auditoría
│   ├── components/
│   │   ├── common/
│   │   │   ├── EstadoBadge.tsx          # Badges con colores de estado normados
│   │   │   └── Sidebar.tsx              # Navegación densa adaptativa por rol + health check
│   │   ├── auth/
│   │   │   └── LoginForm.tsx            # Formulario de autenticación con Zod
│   │   ├── proyectos/
│   │   │   └── ProyectosLista.tsx       # Tabla de proyectos e integración con API
│   │   ├── informes/
│   │   │   ├── InformesLista.tsx        # Tabla de informes con filtros
│   │   │   ├── DetalleInformeView.tsx   # Contenedor con navegación por pestañas
│   │   │   ├── TablaDatosGrid.tsx       # Grid editable con alerta de datos fuera de rango
│   │   │   ├── SubirVersionModal.tsx    # Subida presigned a Cloudflare R2 + SHA-256
│   │   │   ├── PanelRevision.tsx        # Dictamen técnico y transiciones de estado
│   │   │   └── HistorialEstados.tsx     # Bitácora cronológica de transiciones
│   │   ├── admin/
│   │   │   ├── MetricasCards.tsx        # KPI cards y distribución por estado
│   │   │   └── AuditoriaTabla.tsx       # Tabla paginada de eventos de auditoría
│   │   └── providers/
│   │       └── AppProviders.tsx         # QueryClientProvider para islas de React
│   ├── lib/
│   │   ├── api.ts                       # Cliente HTTP fuertemente tipado para /api/v1
│   │   ├── types.ts                     # Definiciones de TypeScript del contrato
│   │   ├── supabase.ts                  # Cliente Supabase
│   │   └── queryClient.ts               # Configuración de caché y reintentos
│   ├── styles/
│   │   └── global.css                   # Import de fuentes IBM Plex y reset instrumental
│   └── middleware.ts                    # Guard de autenticación SSR
```

---

## 6. Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```env
# URL base de la API del Worker (Hono)
PUBLIC_API_BASE_URL=https://<worker-domain>/api/v1

# Supabase Auth
PUBLIC_SUPABASE_URL=https://<your-supabase-id>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 7. Instrucciones de Instalación y Ejecución

### Requisitos previos
- Node.js `>= 22.12.0`
- `pnpm` (`npm install -g pnpm`)

### Instalación de dependencias
```bash
pnpm install
```

### Ejecución en Desarrollo
Según las directrices del proyecto, se puede iniciar el servidor en modo background o interactivo:

```bash
# Servidor de desarrollo estándar:
pnpm dev

# O en modo background:
pnpm astro dev --background
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
```

### Verificación de Tipos y Compilación
```bash
# Verificación estricta de TypeScript y Astro:
pnpm exec astro check

# Compilación para producción (Cloudflare Pages):
pnpm build
```
El build genera el directorio `dist/` listo para ser desplegado en Cloudflare Pages con el adaptador `@astrojs/cloudflare`.
