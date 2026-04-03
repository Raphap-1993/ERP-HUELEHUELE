# Backoffice UX Redesign — Análisis GRASP + Propuesta de Distribución

**Fecha:** 2026-03-23
**Versión:** 2.0 (basada en auditoría técnica previa — no requiere re-análisis del código)
**Autor:** Agente /grasp + Orquestador
**Estado:** Implementación incremental en curso

---

## 1. Contexto y problema raíz

### Situación actual

El backoffice de Huelegood Admin (`apps/admin`) tiene **14 workspace components** que usan un patrón de **dos columnas inline**:

```
xl:grid-cols-[Xfr_Yfr]
├── Columna izquierda (lista)
└── Columna derecha (formulario de edición — INLINE)
```

Este patrón viola múltiples principios GRASP y genera:

| Síntoma | Causa GRASP | Patrón violado |
|---|---|---|
| Scroll horizontal en pantallas ≤1600px | Layout de 2 columnas sin contención | **A — Action proximity** (las acciones expanden la página) |
| Scroll vertical excesivo por formularios largos | Formularios de variantes + imágenes inline | **P — Progressive disclosure** (todo visible al mismo tiempo) |
| Sidebar plano con 15 ítems al mismo nivel | Sin agrupación semántica | **G — Grouping** (sin jerarquía de dominio) |
| El usuario no sabe en qué "sección" está | Sin grupos ni separadores en nav | **G — Grouping** |
| Formularios que se sienten "pegados" a la lista | No hay separación de contextos | **A — Action proximity** |

---

## 2. Diagnóstico GRASP completo

### G — Grouping (sidebar)

**Estado actual:** 15 ítems planos en el sidebar sin agrupación

```
Dashboard
Pedidos
Pagos
Vendedores
Comisiones
Productos
CMS
Mayoristas
Fidelización
Marketing
CRM
Notificaciones
Observabilidad
Auditoría
Configuración
```

**Problema:** El ojo no puede escanear el sidebar en F-pattern. No hay jerarquía cognitiva. Un operador de pedidos ve lo mismo que un admin de sistema. Demasiado ruido visual.

**Patrón violado:** Gestalt proximity — ítems relacionados no están próximos entre sí.

---

### R — Responsive information hierarchy

**Estado actual:** Las páginas mezclan en una misma vista:
- Métricas KPI
- Listado
- Formulario de edición completo
- Tabla de variantes
- Gestión de imágenes

Todo al mismo nivel de scroll vertical, sin jerarquía.

**Problema:** El F-pattern natural del ojo (escanear izquierda → derecha en el tercio superior) se rompe porque hay demasiado contenido competiendo por atención.

**Patrón violado:** Information hierarchy — no hay pirámide datos → acciones.

---

### A — Action proximity

**Estado actual:** Al hacer click en "Editar", el panel de edición aparece como segunda columna del grid en la misma página. El layout pasa de 1 columna a 2 columnas, expandiendo el ancho total.

**Problema:**
1. La página crece horizontalmente, generando scrollbar horizontal
2. El usuario pierde el contexto de la lista porque está mitad-y-mitad
3. En pantallas 1280-1520px (la mayoría de monitores de trabajo) el panel queda recortado

**Patrón violado:** Action proximity correcto = la acción de edición abre un modal que flota sobre el contenido, sin mover el layout.

---

### S — State visibility

**Estado actual:** Existen mensajes de éxito/error pero son inconsistentes entre workspaces. Algunos usan `toast`, otros usan alerts inline. No hay skeletons de carga estandarizados.

**Problema:** El usuario no siempre sabe si su acción tuvo efecto. Diferentes módulos dan feedback diferente.

**Patrón violado:** Consistent state feedback.

---

### P — Progressive disclosure

**Estado actual:** El formulario de edición de productos tiene ~15 campos + tabla de variantes + sección de imágenes, todo visible simultáneamente en el panel inline.

**Problema:** Cognitive overload. El usuario ve todo de golpe y no sabe por dónde empezar. En especial las variantes y las imágenes son secciones que deberían estar "un nivel más profundo".

**Patrón violado:** Progressive disclosure — mostrar solo lo necesario, revelar complejidad gradualmente.

---

## 3. Propuesta de distribución — Sidebar reorganizado

### Nueva estructura de navegación (5 grupos semánticos)

```
┌─────────────────────────────────────┐
│ HH  Huelegood                       │
│     Admin Panel                     │
├─────────────────────────────────────┤
│                                     │
│  OPERACIÓN DIARIA                   │
│  ├── 📊 Dashboard          [default]│
│  ├── 📦 Pedidos             [badge] │
│  ├── 💳 Pagos               [badge] │
│  └── 📈 Reportes                    │
│                                     │
│  CATÁLOGO                           │
│  ├── 🏷️  Productos                  │
│  └── 📝 CMS                         │
│                                     │
│  COMERCIAL                          │
│  ├── 👥 Vendedores                  │
│  ├── 💰 Comisiones                  │
│  └── 🏪 Mayoristas                  │
│                                     │
│  CLIENTES                           │
│  ├── 👤 CRM                         │
│  ├── ⭐ Fidelización                │
│  ├── 📣 Marketing                   │
│  └── 🎟️  Cupones                   │
│                                     │
│  SISTEMA                            │
│  ├── 🔔 Notificaciones      [badge] │
│  ├── 📡 Observabilidad              │
│  ├── 📋 Auditoría                   │
│  └── ⚙️  Configuración              │
│                                     │
├─────────────────────────────────────┤
│  [AH] Admin Huelegood     [logout]  │
└─────────────────────────────────────┘
```

### Justificación de grupos

| Grupo | Módulos | Lógica de agrupación |
|---|---|---|
| **Operación diaria** | Dashboard, Pedidos, Pagos, Reportes | El flujo diario del negocio. Lo que el operador revisa apenas entra al panel |
| **Catálogo** | Productos, CMS | Todo lo que se muestra en el storefront. Contenido + productos |
| **Comercial** | Vendedores, Comisiones, Mayoristas | La red de distribución y sus compensaciones |
| **Clientes** | CRM, Fidelización, Marketing, Cupones | Relación con el cliente final: historial, retención y activación comercial |
| **Sistema** | Notificaciones, Observabilidad, Auditoría, Config | Operación técnica del sistema. Raramente usado en el día a día |

### Comportamiento del sidebar

- **Jerarquía compacta en desktop** — headers de grupo más densos, menos cards altas y un único grupo expandido por defecto
- **Grupos con label** (`OPERACIÓN DIARIA`, `CATÁLOGO`, etc.) — no son links, son separadores visuales
- **Active state** — highlight verde del ítem actual + resaltado del grupo
- **Preview colapsado** — cada grupo cerrado muestra un resumen corto de sus módulos para escanear sin abrir todo
- **Badges** — circulito rojo con número para Pedidos pendientes, Pagos por revisar, Notificaciones
- **Collapse mode** — en ≤1280px el sidebar colapsa a solo iconos; los grupos desaparecen
- **Hover tooltips** — en modo colapsado, el nombre del módulo aparece como tooltip

---

## 4. Patrón de módulo estándar (todos los mantenedores)

Todos los 14 workspaces seguirán esta estructura sin excepción:

### Regla para selectores operativos

- selectores de alta cardinalidad como productos, vendedores o clientes no deben resolverse con grids largas de cards
- usar `combobox` o selector buscable con lupa, búsqueda por nombre, SKU, código o slug y lista scrollable dentro del modal
- en selectores con múltiples agregados, las sugerencias deben quedarse contenidas dentro de la caja y la selección acumulada debe seguir visible arriba como resumen del pedido
- si una fuente secundaria falla, el selector debe seguir funcionando con los datos principales y mostrar el error de forma visible

### Layout de página (full-width, una sola columna)

```
┌──────────────────────────────────────────────────────────┐
│ [SectionHeader]                                          │
│  Productos                                               │
│  Gestiona catálogo, variantes e imágenes desde el        │
│  backoffice con subida directa a R2.                     │
├──────────────────────────────────────────────────────────┤
│ [MetricCards — 2 a 4 KPIs]                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ TOTAL    │ │ ACTIVOS  │ │DESTACADOS│ │CATEGORÍAS│    │
│ │    3     │ │    3     │ │    3     │ │    2     │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────────────────┤
│ [Toolbar]                                                │
│ [🔍 Buscar por nombre, slug o categoría]  [+ Nuevo]     │
├──────────────────────────────────────────────────────────┤
│ [AdminDataTable — paginada 10-15 filas]                  │
│ PRODUCTO  │ CATEGORÍA │ ESTADO  │ PRECIO │ ACCIÓN       │
│ ─────────────────────────────────────────────────────── │
│ Clásico V │ Productos │ Activo  │ S/40   │ [Editar]     │
│ Premium   │ Productos │ Activo  │ S/50   │ [Editar]     │
│ ─────────────────────────────────────────────────────── │
│           [← Anterior]  1 / 3  [Siguiente →]            │
└──────────────────────────────────────────────────────────┘
```

### Modal de edición (Dialog flotante)

```
┌──────────────────────────────────────────────────────────┐
│ [Overlay semitransparente detrás]                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Editar: Clásico Verde                          [✕] │  │
│  │ ─────────────────────────────────────────────────  │  │
│  │ [Formulario con scroll interno — max-h-[90vh]]     │  │
│  │                                                    │  │
│  │  Nombre            Slug                            │  │
│  │  [Clásico Verde ]  [clasico-verde         ]        │  │
│  │                                                    │  │
│  │  Categoría         Estado                          │  │
│  │  [Productos ▾]     [Activo ▾]                      │  │
│  │                                                    │  │
│  │  ☑ Producto destacado                              │  │
│  │                                                    │  │
│  │  Descripción corta                                 │  │
│  │  [                                          ]      │  │
│  │                                                    │  │
│  │  ── Variantes ──────────────────────────────────   │  │
│  │  [SKU] [Nombre] [Precio] [Stock] [Estado] [✕]      │  │
│  │  [+ Agregar variante]                              │  │
│  │                                                    │  │
│  │ ─────────────────────────────────────────────────  │  │
│  │              [Cancelar]  [Guardar cambios]         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Modal de imágenes (tab separada o segundo modal)

Para módulos complejos como Productos que tienen imágenes, la gestión de imágenes va en una **tab dentro del modal** o en un **segundo modal** accesible desde el primero, NO en el inline del workspace.

---

## 5. Especificación por módulo

### OPERACIONES

#### Dashboard
- **Layout:** Full-width, multi-grid de métricas y charts
- **Modal:** No aplica (solo lectura)
- **Scroll:** No

#### Pedidos
- **Layout:** Métricas (total, pendientes, completados, cancelados) + tabla paginada
- **Modal de detalle:** Timeline del pedido + datos del cliente + items
- **Modal de acción:** "Cambiar estado" — select + nota interna
- **Scroll:** No

#### Pagos
- **Layout:** Métricas (monto total, pendientes, aprobados, rechazados) + tabla paginada
- **Modal de revisión:** Detalle del pago + comprobante + botones Aprobar/Rechazar
- **Scroll:** No

---

### CATÁLOGO

#### Productos
- **Layout:** 4 métricas + tabla paginada con búsqueda + filtro por categoría
- **Modal de edición:** Nombre, slug, categoría, estado, destacado, descripciones, variantes
- **Modal de imágenes:** Subida, orden, alt text (accesible desde el modal de edición con un tab o botón "Gestionar imágenes")
- **Scroll:** Modal con scroll interno

#### CMS
- **Layout:** Lista de bloques de contenido paginada
- **Modal de edición:** Campos del bloque (hero, logos, texto, imagen)
- **Scroll:** Modal con scroll interno

---

### COMERCIAL

#### Vendedores
- **Layout:** Métricas + tabla de vendedores con columna de acciones + bandeja de postulaciones en una sola superficie con toolbar compacto de filtros por estado
- **Tabla principal:** Identidad comercial, código, tipo, estado, ciudad y acciones; ventas y comisiones viven en sus módulos/detalles, no en el listado base
- **Modal de alta:** Creación manual de seller o afiliado desde backoffice
- **Modal de detalle:** Resumen operativo del vendedor y su código comercial
- **Acciones de tabla:** Iconos con tooltip para ver, editar, copiar código y eliminar
- **Modal de edición:** Datos base, WhatsApp, tipo comercial, estado, origen y edición condicionada del código comercial
- **Confirmación de eliminación:** Solo habilitada cuando el vendedor no tiene actividad ni postulaciones ligadas
- **Modal de revisión:** Screening, decisión final y tipo comercial resueltos por caso, sin formulario inline global
- **Scroll:** Solo dentro de modales cuando el contenido crece

#### Comisiones
- **Layout:** Tabla paginada con filtros por período y vendedor
- **Modal de detalle:** Desglose de comisión por pedido
- **Scroll:** No

#### Mayoristas
- **Layout:** Lista de mayoristas + planes asignados
- **Modal de edición:** Datos + plan mayorista
- **Scroll:** No

---

### CLIENTES

#### CRM
- **Layout:** Métricas (clientes totales, activos, VIP) + tabla paginada
- **Modal de detalle:** Historial de pedidos + datos de contacto
- **Scroll:** Modal con scroll interno

#### Fidelización
- **Layout:** Métricas de puntos + tabla de clientes con puntos
- **Modal de ajuste:** Agregar/restar puntos manualmente con nota
- **Scroll:** No

#### Marketing
- **Layout:** Lista de campañas paginada
- **Modal de edición:** Config de campaña (audiencia, mensaje, fecha)
- **Scroll:** Modal con scroll interno

---

### SISTEMA

#### Notificaciones
- **Layout:** Lista paginada de notificaciones enviadas/pendientes
- **Modal de nueva:** Composición de notificación (tipo, destinatarios, mensaje)
- **Scroll:** No

#### Observabilidad
- **Layout:** Métricas de sistema + tabla de eventos paginada
- **Modal de detalle:** Stack trace o detalle del evento
- **Scroll:** Modal con scroll interno

#### Auditoría
- **Layout:** Tabla paginada con filtros (usuario, fecha, acción, entidad)
- **Modal de detalle:** Detalle del log (antes/después del cambio)
- **Scroll:** No

#### Configuración
- **Layout:** Tabs por sección (General, Branding, Integraciones, Seguridad)
- **Patrón:** Cada tab tiene su propio formulario con botón Guardar — NO modal
- **Branding:** Logo del menú, loading e ícono del sitio deben poder cargarse desde configuración y reflejarse en web/admin
- **Biblioteca de medios:** Cuando branding ya existe en `Cloudflare R2`, el panel debe abrir un modal de selección para reutilizar assets existentes sin re-subir archivos
- **Scroll:** Vertical en la sección, permitido

---

## 6. Criterios de éxito

| Métrica | Actual | Objetivo |
|---|---|---|
| Scroll horizontal en cualquier módulo | Presente en 14 workspaces | 0 instancias |
| Scroll vertical en layout principal | Presente | Solo en modales (contenido interno) |
| Items del sidebar sin agrupar | 15 items planos | 5 grupos con 2-4 items cada uno |
| Formularios inline que expanden la página | 14 workspaces | 0 (todos en modales) |
| Datatables sin paginación | Variable | 100% paginadas (10-15 filas) |
| Flujo CRUD inconsistente entre módulos | Sí | Un único patrón en todos |
| Empty states en listas vacías | Inconsistente | 100% de listas tienen empty state |

---

## 7. Componentes nuevos requeridos

| Componente | Ubicación | Prioridad |
|---|---|---|
| `Dialog` / `DialogContent` / `DialogHeader` / `DialogFooter` | `packages/ui/primitives.tsx` | CRÍTICA (blocker) |
| `AdminSidebarGroup` (label + items colapsables) | `packages/ui/domain.tsx` o `admin-sidebar.tsx` | Alta |
| `AdminDataTable` con prop `pagination` | `packages/ui/domain.tsx` | Alta |
| `EmptyState` (icono + mensaje + CTA opcional) | `packages/ui/domain.tsx` | Media |
| `ConfirmDialog` (wrapper de Dialog para confirmar eliminación) | `packages/ui/domain.tsx` | Media |

---

## 8. Relación con el plan de implementación anterior

Este documento **extiende** el plan de implementación técnica (ADR-1) con la capa de UX. Los archivos a modificar son los mismos:

```
packages/ui/src/components/primitives.tsx    ← Dialog primitive
packages/ui/src/components/domain.tsx        ← AdminSidebarGroup, paginación, EmptyState
apps/admin/components/admin-sidebar.tsx      ← Grupos semánticos
apps/admin/components/*-workspace.tsx (×14) ← Panels inline → modales
```

**Secuencia recomendada:**
1. `primitives.tsx` → Dialog
2. `admin-sidebar.tsx` → Grupos semánticos
3. `products-workspace.tsx` → Piloto (valida el patrón modal)
4. Batch de los 13 workspaces restantes

---

## 9. Referencias de patrones

- Nielsen Norman Group — [Admin UI Patterns](https://www.nngroup.com)
- GRASP patterns aplicados a UX (Gestalt + Responsive + Action + State + Progressive)
- F-Pattern Scanning — Jakob Nielsen, 2006 (vigente para listas tabulares)
- Google Material Design — Data tables & Dialogs
- Shopify Polaris — Resource list pattern
