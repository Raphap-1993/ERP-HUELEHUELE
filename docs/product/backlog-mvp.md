# Backlog MVP Priorizado

## Objetivo

Traducir el alcance MVP en unidades de trabajo priorizadas y convertibles a tickets.

## Nota de estado

Este backlog conserva la prioridad original del MVP, pero varias piezas ya fueron implementadas en el repositorio. Úsalo como mapa de cobertura y como referencia para cerrar pendientes, no como una lista exclusivamente futura.

## Cobertura actual

Ya están cubiertos en el repositorio, entre otros, los siguientes bloques:

- `MVP-001` estructura base de aplicaciones
- `MVP-002` auth y RBAC
- `MVP-003` modelo de datos inicial con Prisma y persistencia operativa en PostgreSQL
- `MVP-004` CMS interno básico
- `MVP-005` catálogo y variantes
- `MVP-008` checkout con Openpay
- `MVP-009` flujo de pago manual
- `MVP-010` gestión de pedidos
- `MVP-011` captura y aplicación de código de vendedor
- `MVP-012` onboarding de vendedores
- `MVP-013` motor base de comisiones
- `MVP-014` notificaciones transaccionales mínimas
- `MVP-015` auditoría básica
- `MVP-016` módulo mayorista
- `MVP-017` loyalty base
- `MVP-018` campañas y segmentos iniciales
- `MVP-019` dashboard operacional inicial
- `MVP-020` seller panel básico
- `MVP-021` gestión de reglas de comisión
- `MVP-023` cola de jobs y reintentos
- `MVP-024` upload seguro de evidencias y assets
- `MVP-025` healthchecks y logs estructurados
- `MVP-027` observabilidad operativa en admin con métricas, requests y colas
- operación reproducible con `PM2`, smoke checks, backups y snippets `Nginx/Hestia`
- jobs BullMQ activos para notificaciones, conciliación manual y liquidación de comisiones

En este punto, la cobertura de `MVP-023` ya existe para notificaciones, conciliación manual y liquidación de comisiones sin rehacer la base.

Además, el proyecto ya avanzó más allá del backlog MVP original en estos frentes:

- seller panel ampliado con foco comercial real
- dashboards operativos por rol en admin
- reglas de comisión con prioridad, elegibilidad y ajustes de payout
- home oficial montada sobre `storefront-v2-premium` con base visual inspirada en `Preline/Coffee Shop`
- principales superficies públicas alineadas al lenguaje herbal actual
- rediseño funcional del storefront y del backoffice
- login productivo separado del shell admin y previews públicas retiradas
- normalización de resolución del API en cliente y release contra entorno productivo compartido

## Frente visual entregado de Fase 2

### F2-001 Base visual pública `Preline`

Estado actual:

- la home `/` ya funciona sobre `storefront-v2-premium`
- la composición activa toma como referencia la plantilla `Coffee Shop` de `Preline`
- el mensaje comercial se concentra en `Clásico Verde`, `Premium Negro` y `Combo Dúo Perfecto`
- las rutas preview públicas quedaron retiradas y redirigen a `/`

Pendientes derivados:

- homologar superficies públicas secundarias al mismo baseline
- cerrar un pase UX final sin reabrir una migración base

## Frente activo de Fase 2

### F2-002 Automatización comercial y reporting

Criterios de aceptación:

- automatización de campañas menos manual y más segmentada
- reportes útiles para pedidos, pagos, comisiones y conversión
- capacidad de leer desempeño comercial sin depender de inspección manual por módulo
- continuidad del lenguaje visual ya aceptado, sin reabrir la home oficial como experimento

Plan operativo detallado:

- ver [fase-2-execution-plan.md](./fase-2-execution-plan.md) para épicas, tickets, dependencias y definición de terminado

## Desvío urgente homologado antes de continuar Fase 2

### F2-URG Catálogo y media administrable

Motivo:

- hoy el catálogo y parte del storefront siguen dependiendo de `featuredProducts`
- el backoffice no tiene CRUD real de productos
- el logo del menú y otros activos visuales no están conectados de extremo a extremo al runtime público
- la media pública necesita un proveedor claro y una decisión vigente de arquitectura

Decisión vigente:

- `Cloudflare Images` reemplaza la propuesta previa basada en `R2` como destino preferido de media pública del storefront

Resultado esperado:

- productos administrables desde backoffice
- catálogo, home y checkout leyendo productos persistidos
- hero, logo, banners e imágenes de producto servidos desde una capa real de media pública

## Prioridad crítica

| ID | Ítem | Resultado esperado |
| --- | --- | --- |
| MVP-001 | Estructura base de aplicaciones `web`, `admin`, `api`, `worker` | Repositorio listo para arrancar implementación y despliegue |
| MVP-002 | Modelo de auth y RBAC | Roles y permisos funcionales en admin, vendedor y cliente. Implementado en el repo y conectado a guards y navegación filtrada. |
| MVP-003 | Modelo de datos inicial con Prisma | Entidades núcleo y persistencia operativa en PostgreSQL definidas. Implementado en el repo con `schema.prisma`, `module_snapshots` y Prisma Client generado. |
| MVP-004 | CMS interno básico | Home, páginas, banners, FAQs, navegación y SEO editables |
| MVP-005 | Catálogo y variantes | Productos publicados y administrables con stock lógico |
| MVP-006 | Promociones y cupones | Descuentos aplicables y auditables |
| MVP-007 | Carrito y snapshot de compra | Persistencia de items, precios preliminares y código de vendedor |
| MVP-008 | Checkout con Openpay | Orden y pago online funcionando con conciliación básica |
| MVP-009 | Flujo de pago manual | Carga de evidencia, revisión y resolución operativa |
| MVP-010 | Gestión de pedidos | Estados, timeline y acciones base de operación |
| MVP-011 | Captura y aplicación de código de vendedor | Atribución comercial desde web y pedido |
| MVP-012 | Onboarding de vendedores | Formulario, revisión, aprobación y generación de código |
| MVP-013 | Motor base de comisiones | Atribución, cálculo y preparación para payout |
| MVP-014 | Notificaciones transaccionales mínimas | Confirmación de pedido, pago y resolución operativa |
| MVP-015 | Auditoría básica | Registro de cambios críticos y acciones admin |

## Prioridad alta

| ID | Ítem | Resultado esperado |
| --- | --- | --- |
| MVP-016 | Módulo mayorista | Lead, calificación inicial y cotización |
| MVP-017 | Loyalty base | Cuenta de puntos, asignación por compra y canje simple |
| MVP-018 | Campañas y segmentos iniciales | CRM básico para comunicación de promociones y recurrencia |
| MVP-019 | Dashboard operacional inicial | Visibilidad básica de pedidos, pagos y ventas atribuidas. Implementado y luego ampliado con dashboards por rol. |
| MVP-020 | Seller panel básico | Vendedor consulta código, pedidos atribuidos y comisiones. Implementado y luego ampliado en Fase 2. |
| MVP-021 | Gestión de reglas de comisión | Configuración administrable por vigencia y alcance. Implementado y luego ampliado con prioridad, elegibilidad y ajustes. |
| MVP-022 | Reglas de compatibilidad entre cupones y vendedor | Política clara en checkout y atribución |
| MVP-023 | Cola de jobs y reintentos | Procesos asíncronos trazables. Implementado en el repo para notificaciones, conciliación manual y liquidación de comisiones. |
| MVP-024 | Upload seguro de evidencias y assets | Activos públicos y privados gestionados de forma segura |
| MVP-025 | Healthchecks y logs estructurados | Operación mínima observable en producción |

## Prioridad media

| ID | Ítem | Resultado esperado |
| --- | --- | --- |
| MVP-026 | Refinamiento UI premium | Consistencia final entre web y admin. Iniciado en el repo, sin cierre visual final todavía. |
| MVP-027 | Dashboards de marketing y campañas | Medición táctica inicial |
| MVP-028 | Reglas avanzadas de loyalty | Bonos especiales, expiraciones y campañas puntuales |
| MVP-029 | Automatización de follow-up mayorista | Recordatorios y tareas operativas |
| MVP-030 | Mejoras de búsqueda y filtrado de catálogo | Descubrimiento más eficiente |
| MVP-031 | Exportaciones operativas | Reportes CSV básicos de pedidos, pagos y comisiones |
| MVP-032 | Optimización de performance y caching | Mejoras después de uso real |

## Dependencias críticas

- `MVP-003` desbloquea la mayoría del backend.
- `MVP-008`, `MVP-009` y `MVP-010` deben coordinarse con estados de pedido y pago.
- `MVP-011`, `MVP-012` y `MVP-013` forman un bloque funcional único.
- `MVP-017` depende del ciclo de vida de pedido definido.

## Recomendación de secuencia

1. Fundaciones técnicas y modelo de datos.
2. Catálogo, CMS y promociones.
3. Carrito, pedidos y pagos.
4. Vendedores, comisiones y seller panel base.
5. Mayoristas, loyalty, campañas y refinamiento operativo.
