# Guía Maestra de UX/UI — IASA DataReport

Esta guía documenta la **arquitectura visual, diseño de interfaz (UI), experiencia de usuario (UX) y catálogo de componentes** del frontend de **IASA DataReport**. 

Está pensada para que puedas **modificar, rediseñar y personalizar la apariencia y flujos visuales libremente**, con la certeza de **no afectar la lógica técnica** (microservicios, consultas de React Query, máquina de estados y subida a R2).

---

## Índice
1. [Filosofía y Tokens de Diseño (Design System)](#1-filosofía-y-tokens-de-diseño-design-system)
2. [Estructura del Proyecto y Dónde está cada Pantalla](#2-estructura-del-proyecto-y-dónde-está-cada-pantalla)
3. [Reglas de Oro: Qué puedes cambiar vs Qué NO debes tocar](#3-reglas-de-oro-qué-puedes-cambiar-vs-qué-no-debes-tocar)
4. [Catálogo Pantalla por Pantalla y Componentes UI](#4-catálogo-pantalla-por-pantalla-y-componentes-ui)
   - [4.1 Layout Shell y Barra de Navegación](#41-layout-shell-y-barra-de-navegación)
   - [4.2 Acceso y Registro (`/login`)](#42-acceso-y-registro-login)
   - [4.3 Inicio y Perfil de Usuario (`/inicio`)](#43-inicio-y-perfil-de-usuario-inicio)
   - [4.4 Líneas de Investigación / Proyectos (`/proyectos` y `/proyectos/nuevo`)](#44-líneas-de-investigación--proyectos-proyectos-y-proyectosnuevo)
   - [4.5 Repositorio de Informes Técnicos (`/informes`)](#45-repositorio-de-informes-técnicos-informes)
   - [4.6 Consola de Revisión y Dictamen (`/informes/detalle`)](#46-consola-de-revisión-y-dictamen-informesdetalle)
   - [4.7 Módulo de Edición de Datos Científicos (Grilla QC)](#47-módulo-de-edición-de-datos-científicos-grilla-qc)
   - [4.8 Telemetría y Dashboard Estadístico (`/admin/dashboard`)](#48-telemetría-y-dashboard-estadístico-admindashboard)
   - [4.9 Trazabilidad e Inmutabilidad (`/admin/auditoria`)](#49-trazabilidad-e-inmutabilidad-adminauditoria)
5. [Recetas Rápidas de Personalización Visual](#5-recetas-rápidas-de-personalización-visual)

---

## 1. Filosofía y Tokens de Diseño (Design System)

La aplicación está concebida como un **instrumento técnico de laboratorio y auditoría de datos científicos**. La estética prioriza la velocidad de escaneo, la precisión tipográfica y la sobriedad instrumental.

### Paleta de Colores (`tailwind.config.mjs`)
Los colores se definen en `tailwind.config.mjs` y se invocan con clases Tailwind:

| Token Tailwind | Hexadecimal | Propósito Instrumental |
| :--- | :--- | :--- |
| `bg-base` | `#F5F6F4` | Fondo general (blanco frío de laboratorio, no crema comercial). |
| `text-ink` | `#1E2A2E` | Tinta principal para títulos y lecturas críticas (casi negro con matiz verdoso). |
| `text-ink-muted` | `#4A5B60` | Textos secundarios, descripciones técnicas. |
| `text-ink-subtle` | `#6B7E84` | Metadatos, etiquetas pequeñas, fechas y hashes. |
| `bg-accent` / `text-accent` | `#136F63` | Verde instrumental / teal. Color de acento primario para botones y foco. |
| `border-border` | `#A9B4B3` | Bordes instrumentales nítidos de tarjetas y tablas. |
| `bg-alarma` / `text-alarma` | `#C4432B` | **Rojo de alarma**. Reservado exclusivamente para celdas con datos físicos anómalos o rechazos. |

### Estados del Flujo Científico (`EstadoBadge.tsx` y `tailwind.config.mjs`)
| Estado | Color Hex | Clase Tailwind de Estado |
| :--- | :--- | :--- |
| **Borrador** | `#6B7E84` | `bg-estado-borrador` / gris neutro |
| **Enviado** | `#3B6EA5` | `bg-estado-enviado` / azul instrumental |
| **En Revisión** | `#136F63` | `bg-estado-revision` / teal instrumental |
| **Observado** | `#C97A2B` | `bg-estado-observado` / ámbar advertencia |
| **Aprobado** | `#3E7D53` | `bg-estado-aprobado` / verde conformidad |
| **Rechazado** | `#C4432B` | `bg-estado-rechazado` / rojo crítico |

### Tipografía (`src/styles/global.css`)
- **Prosa y Títulos**: `'IBM Plex Sans', sans-serif` (`font-sans`).
- **Datos, IDs, Fechas, Fórmulas y Grilla**: `'IBM Plex Mono', monospace` (`font-mono`).

---

## 2. Estructura del Proyecto y Dónde está cada Pantalla

```text
src/
├── layouts/
│   ├── BaseLayout.astro          <- HTML raíz, fuentes, estilos globales
│   └── DashboardLayout.astro     <- Shell con Navbar, breadcrumbs y contenedor
├── pages/                        <- Enrutamiento estático de Astro
│   ├── login.astro               <- Ruta /login
│   ├── inicio.astro              <- Ruta /inicio
│   ├── proyectos/
│   │   ├── index.astro           <- Ruta /proyectos
│   │   └── nuevo.astro           <- Ruta /proyectos/nuevo
│   ├── informes/
│   │   ├── index.astro           <- Ruta /informes
│   │   └── detalle.astro         <- Ruta /informes/detalle?id=...
│   └── admin/
│       ├── dashboard.astro       <- Ruta /admin/dashboard
│       └── auditoria.astro       <- Ruta /admin/auditoria
├── components/                   <- Componentes React de UI e Islas
│   ├── common/
│   │   ├── Navbar.tsx            <- Barra superior de navegación y usuario
│   │   ├── EstadoBadge.tsx       <- Insignia de estado con código de color
│   │   └── ErrorBoundary.tsx     <- Captura amigable de errores de interfaz
│   ├── auth/
│   │   ├── LoginForm.tsx         <- Formulario de login y registro
│   │   └── AuthGuard.tsx         <- Protección de rutas en cliente
│   ├── perfil/
│   │   └── PerfilUsuario.tsx     <- Tarjeta de perfil y accesos de inicio
│   ├── proyectos/
│   │   ├── ProyectosLista.tsx    <- Tarjetas/lista de investigaciones
│   │   └── NuevoProyecto.tsx     <- Formulario de creación de proyecto
│   ├── informes/
│   │   ├── InformesLista.tsx     <- Listado de expedientes con badges
│   │   ├── DetalleInformeView.tsx<- Contenedor principal del expediente
│   │   ├── PanelRevision.tsx     <- Visor de informe, LanguageTool y veredicto
│   │   ├── TablaDatosGrid.tsx    <- Grilla Excel con detección de anomalías
│   │   ├── SubirVersionModal.tsx <- Modal para adjuntar nuevo dataset
│   │   └── HistorialEstados.tsx  <- Bitácora cronológica de trazabilidad
│   └── admin/
│       ├── MetricasCards.tsx     <- KPIs y distribución de expedientes
│       └── AuditoriaTabla.tsx    <- Tabla densa con metadatos y paginación
└── styles/
    └── global.css                <- Configuración de fuentes y react-data-grid
```

---

## 3. Reglas de Oro: Qué puedes cambiar vs Qué NO debes tocar

Para evitar que cualquier rediseño rompa la comunicación con los 4 microservicios (`ms-auth`, `ms-academic`, `ms-reviews`, `ms-storage`) o la máquina de estados, sigue esta guía clara:

### ✅ LO QUE PUEDES CAMBIAR 100% A TU GUSTO (UI / UX)
- **Clases de Tailwind CSS**: Todo lo relativo a `p-*`, `m-*`, `gap-*`, `flex`, `grid`, `bg-*`, `text-*`, `border-*`, `rounded-*`, `shadow-*`, `opacity-*`, `transition-*`.
- **Textos y Etiquetas**: Los títulos, subtítulos, placeholders (`placeholder="..."`), textos explicativos, copys de botones y mensajes de ayuda.
- **Distribución de Paneles**: Puedes mover el panel de versiones a la izquierda, poner la grilla arriba o abajo, agrupar las métricas en 2, 3 o 4 columnas, usar tabs o acordeones.
- **Íconos de Lucide**: Cambiar cualquier ícono de `lucide-react` por otro que prefieras (ej. cambiar `Folder` por `Database`, `Activity` por `TrendingUp`, etc.).
- **Modales y Diálogos**: El diseño visual del modal `SubirVersionModal.tsx` (bordes, anchos, sombras, fondos).
- **Animaciones y Microinteracciones**: Añadir efectos hover, tooltips, estados activos visuales y transiciones suaves.

### ⚠️ LO QUE NO DEBES ELIMINAR NI CAMBIAR (LÓGICA TÉCNICA)
1. **Nombres de campos en formularios**:
   - En `LoginForm`: no cambies los nombres `{...register('email')}` y `{...register('password')}`.
   - En `NuevoProyecto`: mantén `{...register('titulo')}` y `{...register('descripcion')}`.
2. **Parámetro de URL para expedientes**:
   - La aplicación estática SPA lee `window.location.search` con el parámetro `?id=...`. Los enlaces a detalle deben mantener el formato `/informes/detalle?id=${informe.id}`.
3. **Claves de TanStack Query**:
   - No cambies los identificadores de caché como `queryKey: ['informe', informeId]`, `queryKey: ['proyectos']`, `queryKey: ['metrics-dashboard']`.
4. **Valores Enum de la Máquina de Estados**:
   - Las transiciones del backend esperan exactamente los strings en minúsculas: `'borrador'`, `'enviado'`, `'en_revision'`, `'observado'`, `'aprobado'`, `'rechazado'`. (Puedes cambiar la etiqueta visible que lee el usuario en `EstadoBadge`, pero el valor enviado a la API debe ser ese string).
5. **Nombres de atributos en la Grilla de Datos**:
   - En `TablaDatosGrid.tsx`, las reglas de validación buscan claves que incluyan `ph`, `latitud`, `longitud`, `temperatura`. Si renombras esas columnas en la validación, el cálculo de anomalías físicas cambiará.
6. **Autenticación en LocalStorage**:
   - `localStorage.getItem('access_token')` y `localStorage.getItem('user')` no deben renombrarse, ya que `AuthGuard` y `api.ts` los utilizan para enviar el `Bearer token`.

---

## 4. Catálogo Pantalla por Pantalla y Componentes UI

A continuación tienes el desglose exacto de cada pantalla, qué archivo la gobierna y cómo modificar su diseño:

---

### 4.1 Layout Shell y Barra de Navegación

- **Archivos**:
  - `src/layouts/DashboardLayout.astro` (Estructura general)
  - `src/components/common/Navbar.tsx` (Barra fija superior)
  - `src/components/common/EstadoBadge.tsx` (Insignias de estado)

#### Elementos Visuales:
- **Navbar Superior Fijo (`h-14 bg-white border-b border-border`)**:
  - Logotipo instrumental con badge cuadrado `IA` en fondo `bg-accent`.
  - Menú de navegación desktop con íconos (`Home`, `Folder`, `FileText`, `Activity`, `ShieldCheck`).
  - Menú móvil desplegable con botón hamburguesa (`Menu` / `X`).
  - Identificador del usuario autenticado con su rol en badge monoespaciado (`SUPERADMIN`, `INVESTIGADOR`, `REVISOR`).
  - Botón de cierre de sesión (`LogOut`) con estilo de texto `text-alarma` y hover sutil.
- **Breadcrumb / Encabezado de Sección (`h-10 bg-white border-b border-border`)**:
  - Muestra la sección y subsección actual (ej: `REPOSITORIO / Proyectos`).
  - Tag derecho `IASA DataReport · QC`.

#### Ideas de Personalización UX:
- Si deseas una barra lateral en lugar de una barra superior horizontal, puedes convertir el contenedor `flex-col` de `DashboardLayout.astro` en un `flex-row` con un sidebar izquierdo.
- Puedes cambiar la altura del navbar (`h-14` $\rightarrow$ `h-16`) o añadir un avatar con iniciales o foto.

---

### 4.2 Acceso y Registro (`/login`)

- **Archivo de Página**: `src/pages/login.astro`
- **Componente React**: `src/components/auth/LoginForm.tsx`

#### Elementos Visuales:
- **Fondo Centrado**: Contenedor `min-h-screen flex items-center justify-center bg-base p-4`.
- **Tarjeta de Formulario**: `bg-white border border-border rounded-[3px] p-6 sm:p-8 max-w-md w-full`.
- **Encabezado**: Logotipo `IA INSTITUTO IASA · QA DATA` y título "Acceso a la Plataforma".
- **Campos de Entrada**: Inputs estilizados con íconos en el borde izquierdo (`Mail`, `Lock`, `User`) y fuente monoespaciada para entradas de datos.
- **Botón de Acción**: `bg-accent hover:bg-accent-hover text-white font-mono` con spinner animado durante la petición.
- **Pestaña Inferior de Alternancia**: Toggle entre "¿No tienes cuenta? Regístrate" e "Iniciar Sesión".

#### Dónde cambiar el diseño:
Para cambiar el tamaño de la tarjeta, sombras o el estilo de los inputs, edita las clases en `LoginForm.tsx`:
```tsx
// Ejemplo: volver los campos más redondeados o con sombra sutil
<input 
  className="w-full bg-base/50 border border-border focus:border-accent rounded-[4px] px-3 py-2 text-xs font-mono" 
  ...
/>
```

---

### 4.3 Inicio y Perfil de Usuario (`/inicio`)

- **Archivo de Página**: `src/pages/inicio.astro`
- **Componente React**: `src/components/perfil/PerfilUsuario.tsx`

#### Elementos Visuales:
- **Tarjeta de Perfil**: Muestra el avatar genérico en círculo, el nombre del investigador, su correo y su etiqueta de rol institucional (`SUPERADMIN`, etc.).
- **Rejilla de Accesos Directos**: Tarjetas con bordes limpios para saltar rápidamente a Auditoría Global, Gestión de Roles o Repositorios.

#### Ideas de Personalización UX:
- Puedes añadir estadísticas rápidas (ej. "Tienes 3 informes pendientes de corregir").
- Puedes incluir enlaces a guías metodológicas o protocolos de laboratorio.

---

### 4.4 Líneas de Investigación / Proyectos (`/proyectos` y `/proyectos/nuevo`)

- **Listado**: `src/components/proyectos/ProyectosLista.tsx`
- **Formulario**: `src/components/proyectos/NuevoProyecto.tsx`

#### Elementos Visuales:
- **Barra de Herramientas**: Título del repositorio de proyectos, contador total y botón de acento `+ Nuevo Proyecto` que dirige a `/proyectos/nuevo`.
- **Tarjetas de Proyecto**: Cada proyecto se renderiza en un contenedor individual con borde neutro, título en negrita, descripción técnica, identificador de base de datos (`ID: prj-...`) y botón directo `Ver Informes →`.
- **Formulario de Registro**: Tarjeta con campos para el título del proyecto y descripción técnica opcional, con validación reactiva y botón de guardado.

---

### 4.5 Repositorio de Informes Técnicos (`/informes`)

- **Componente React**: `src/components/informes/InformesLista.tsx`

#### Elementos Visuales:
- **Encabezado**: Título y descripción "Listado general de expedientes técnicos".
- **Tarjetas de Informes**: Lista de filas o tarjetas individuales con:
  - Ícono de documento técnico (`FileText`).
  - Título del informe e ID del expediente.
  - Insignia de estado mediante `<EstadoBadge estado={informe.estado} />`.
  - Botón de enlace `Abrir →` que redirige a `/informes/detalle?id=${informe.id}`.

#### Ideas de Personalización UX:
- Puedes añadir una barra de búsqueda para filtrar informes por título en tiempo real.
- Puedes agregar pestañas o botones de filtro rápido por estado (ej. `[Todos] [En Revisión] [Observados] [Aprobados]`).

---

### 4.6 Consola de Revisión y Dictamen (`/informes/detalle`)

- **Componente Contenedor**: `src/components/informes/DetalleInformeView.tsx`
- **Subcomponentes**:
  - `PanelRevision.tsx` (Controles de flujo, LanguageTool y veredicto)
  - `HistorialEstados.tsx` (Línea de tiempo de cambios de estado)
  - `SubirVersionModal.tsx` (Carga de nueva versión de dataset a R2)
  - `TablaDatosGrid.tsx` (Módulo de edición de datos científicos)

#### Elementos Visuales:
1. **Cabecera del Expediente**:
   - Enlace `← Volver a Informes`.
   - Título del informe en tipografía destacada.
   - Identificador UUID del expediente.
   - Badge de estado actual en la esquina derecha.
2. **Panel de Control de Flujo**:
   - Explicación de la máquina de estados PostgreSQL.
   - Botón de acción contextual (ej. "Enviar a Revisión", "Iniciar Revisión").
3. **Visor Documental y LanguageTool**:
   - Selector de versión subida.
   - Botón para inspeccionar el texto y ejecutar la auditoría gramatical y ortográfica.
   - Listado de advertencias ortográficas con sugerencias de corrección.
4. **Formulario de Emisión de Dictamen (Para Revisores)**:
   - Selector de veredicto: `OBSERVADO (Requiere subsanación)`, `APROBADO (Conforme)` o `RECHAZADO`.
   - Área de texto para fundamentación técnica.
   - Lista dinámica de observaciones puntuales (botones para agregar o eliminar filas de observación).
   - Botón de confirmación `Emitir Dictamen Oficial` con ícono de escudo (`ShieldCheck`).
5. **Columna Lateral (Sidebar del Informe)**:
   - **Caja de Versiones**: Muestra los archivos subidos, número de versión (`v1`), nombre del archivo y tamaño en MB. Botón para subir nueva versión que abre el modal.
   - **Bitácora de Estados**: Línea de tiempo visual conectando estados cronológicamente con operador responsable y fecha exacta.

---

### 4.7 Módulo de Edición de Datos Científicos (Grilla QC)

- **Componente React**: `src/components/informes/TablaDatosGrid.tsx`
- **Librería de Grilla**: `react-data-grid`
- **Librería de Excel**: `xlsx` (SheetJS)

#### Elementos Visuales:
- **Cabecera del Módulo**: Título "Módulo de Edición de Datos Científicos", subtítulo "Procesamiento en navegador. No consume base de datos".
- **Botones de Acción**:
  - `Importar Archivo`: Abre el selector nativo de archivos (`.xlsx`, `.xls`, `.csv`).
  - `Exportar Corregido`: Descarga inmediatamente el archivo Excel con las correcciones hechas por el usuario.
- **Banner de Alarma de Anomalías**:
  - Si una celda viola una regla física, aparece un banner rojo claro (`bg-red-50 border-alarma text-alarma`) que indica: *“Se detectaron X celdas con valores fuera de parámetros físicos posibles. Doble clic para editar.”*
- **Visualización de Celdas**:
  - Celdas normales con tipografía monoespaciada limpia.
  - Celdas inválidas resaltadas en rojo (`bg-red-50 text-alarma font-bold`) con ícono de advertencia (`AlertTriangle`).

#### Reglas de Validación Configurables:
En `TablaDatosGrid.tsx`, la función `validarCelda` define las tolerancias físicas. Puedes ajustar los rangos según las normativas de tu laboratorio:
```typescript
const validarCelda = (key: string, valor: any): string | null => {
  const num = Number(valor);
  if (isNaN(num)) return null;

  const k = key.toLowerCase();
  if (k.includes('latitud') && (num < -90 || num > 90)) return 'Latitud fuera de rango físico (-90 a 90)';
  if (k.includes('longitud') && (num < -180 || num > 180)) return 'Longitud fuera de rango físico (-180 a 180)';
  if (k.includes('ph') && (num < 0 || num > 14)) return 'pH inválido (0-14)';
  if (k.includes('temperatura') && (num < -50 || num > 100)) return 'Temperatura sospechosa';
  return null;
};
```

---

### 4.8 Telemetría y Dashboard Estadístico (`/admin/dashboard`)

- **Componente React**: `src/components/admin/MetricasCards.tsx`

#### Elementos Visuales:
- **Fila de Tarjetas KPI Primarias**:
  - **Total Informes**: Cantidad numérica grande con etiqueta "Expedientes procesados en QC".
  - **Proyectos Activos**: Contador con ícono de carpetas.
  - **Tasa de Aprobación**: Porcentaje calculado automáticamente en color verde de conformidad (`#3E7D53`).
- **Grilla de Distribución por Estado**:
  - 6 tarjetas individuales correspondientes a los 6 estados del enum (`Borrador`, `Enviado`, `En Revisión`, `Observado`, `Aprobado`, `Rechazado`).
  - Muestra la cantidad absoluta y el porcentaje respecto al total.

---

### 4.9 Trazabilidad e Inmutabilidad (`/admin/auditoria`)

- **Componente React**: `src/components/admin/AuditoriaTabla.tsx`

#### Elementos Visuales:
- **Barra de Filtro y Refresco**: Dropdown select para filtrar eventos por tipo de entidad (`informes`, `usuarios`, `revisiones`, `informe_versiones`) y botón de recarga.
- **Tabla Densa de Auditoría**:
  - Cabecera en gris frío (`#F0F2F0`) con tipografía monoespaciada compacta.
  - Columnas: `ID`, `Fecha (UTC)`, `Acción` (en tag de borde fino), `Entidad / ID`, `Usuario ID`, y `Metadatos del Evento` (JSON truncado con tooltip).
- **Paginador Inferior**: Navegación `Anterior / Siguiente` con indicador de página actual y total de registros.

---

## 5. Recetas Rápidas de Personalización Visual

### Receta 1: Cambiar el color de acento principal
Si deseas un verde más brillante, azul cobalto o grafito oscuro, solo debes cambiar el token `accent` en `tailwind.config.mjs`:
```javascript
// tailwind.config.mjs
colors: {
  accent: {
    DEFAULT: '#0F766E', // Tu nuevo color primario
    hover: '#0D625C',   // Color al pasar el cursor
    subtle: '#E6F4F2',  // Fondo de selección suave
  },
  // ...
}
```

### Receta 2: Convertir las tarjetas de proyectos o informes en una tabla compacta
En `ProyectosLista.tsx` o `InformesLista.tsx`, puedes reemplazar el contenedor `space-y-3` con una tabla HTML clásica `<table className="w-full text-xs">` manteniendo intacto el `.map(item => (...))` y los atributos de datos.

### Receta 3: Añadir un buscador instantáneo en la lista de informes
En `InformesLista.tsx`, puedes agregar un estado `const [busqueda, setBusqueda] = useState('');` y un input:
```tsx
const informesFiltrados = informes.filter(inf => 
  inf.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
  inf.id.includes(busqueda)
);
```
Y renderizar `informesFiltrados.map(...)`. La comunicación con el backend seguirá intacta.

---

## 6. Verificación en Tiempo Real de tus Cambios

Para ver cualquier cambio visual que hagas:
1. Si el servidor de desarrollo está activo, solo guarda el archivo y el navegador refrescará la vista.
2. Para compilar la versión definitiva estática para producción / Cloudflare Pages:
   ```bash
   npm run build
   node serve.cjs
   ```
3. Visita `http://127.0.0.1:4321/` en tu navegador.
