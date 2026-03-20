# Roadmap por Fases

## Objetivo

Ordenar la construcción de Huelegood en fases ejecutables, distinguiendo lo ya entregado, lo que falta para cerrar el MVP operativo y lo que se deja para optimización y escala.

## Estado actual

Al `20 de marzo de 2026`, la base funcional del proyecto ya existe en el repositorio. El foco dejó de ser "arrancar desde cero" y pasó a ser "abrir y ejecutar Fase 2 sobre una Fase 1 ya cerrada operativamente".

### Ya entregado

- [x] base de aplicaciones `web`, `admin`, `api` y `worker`
- [x] auth, catálogo y checkout
- [x] pedidos, pagos y flujo de revisión manual
- [x] hardening de checkout, pagos y revisión manual con idempotencia y guards de estado
- [x] vendedores, códigos y comisiones base
- [x] mayoristas, campañas y CRM básico
- [x] fidelización por puntos y notificaciones
- [x] CMS interno y configuración de storefront
- [x] auditoría, seguridad operativa y healthchecks
- [x] RBAC real con guards, permisos persistidos y navegación admin filtrada por rol
- [x] persistencia operativa en PostgreSQL para módulos stateful mediante `Prisma` + `module_snapshots`
- [x] BullMQ operativo para notificaciones, conciliación manual y liquidación de comisiones
- [x] observabilidad operativa con logs estructurados, métricas HTTP, colas y eventos de dominio
- [x] despliegue reproducible sobre VPS con `PM2`, health endpoints, smoke checks, backups y snippets `Nginx/Hestia`
- [x] seller panel ampliado con métricas, comisiones, payouts y acceso dedicado en web
- [x] dashboards operativos por rol para foco ejecutivo, pagos, ventas y marketing
- [x] reglas de comisión más flexibles con prioridad, elegibilidad, bonos, deducciones y payout neto
- [x] home oficial `/` migrada a una composición basada en `storefront-v2-premium`, con lenguaje visual inspirado en `Preline/Coffee Shop`
- [x] principales superficies públicas alineadas al lenguaje herbal actual de Huele Huele
- [x] rediseño funcional del backoffice para separar experiencia pública y shell operativo
- [x] login productivo del admin separado del shell y bootstrap de accesos por variables de entorno
- [x] rutas preview públicas retiradas; `/storefront-v2` y `/storefront-v2-premium` redirigen a `/`
- [x] modo mantenimiento del storefront para cambios sensibles en producción
- [x] normalización operativa del release y de la resolución del API en cliente para `web` y `admin`

### Pendiente inmediato

- [ ] homologación visual fina de superficies secundarias al baseline actual (`catalogo`, `checkout`, `cuenta`, `panel-vendedor`, `configuracion`)
- [ ] automatización de campañas más rica y menos manual
- [ ] segmentación comercial más profunda
- [ ] mejores reportes de pedidos, pagos, comisiones y conversión
- [ ] reglas avanzadas de promociones y compatibilidades
- [ ] segundo pase UX de nivel final para storefront, checkout, cuenta y backoffice

## Fase 1. Cierre del MVP operativo

### Meta

Convertir la base funcional actual en una operación estable, persistida y segura.

### Entregables

- persistencia operativa en PostgreSQL para órdenes, CMS, vendedores, comisiones, loyalty, marketing, notificaciones y módulos relacionados mediante `Prisma` + `module_snapshots`
- BullMQ operativo para notificaciones, conciliación manual y liquidación de comisiones
- trazabilidad de procesos críticos con reintentos e idempotencia
- reglas de negocio cerradas para checkout, Openpay y pago manual con idempotencia e integridad de estados
- observabilidad operativa con logs JSON, métricas HTTP, eventos de dominio y estado de colas desde admin
- panel admin conectado a datos persistidos y no a estado efímero en memoria
- semillas, migraciones y limpieza de datos operativos
- healthchecks, smoke checks, backups y logs estructurados para operación diaria

## Fase 2. Optimización comercial

### Meta

Mejorar eficiencia operativa, visibilidad comercial y capacidad de crecimiento sin cambiar el modelo de monolito modular.

### Entregables

- [x] seller panel ampliado
- [x] dashboards operativos por rol
- [x] reglas de comisión más flexibles
- [x] migración base de home/storefront a lenguaje visual `Preline` con la home oficial publicada en `/`
- [ ] homologación visual completa de rutas públicas y administrativas secundarias sobre ese baseline
- [ ] mayor automatización de campañas
- [ ] segmentación más rica
- [ ] reglas avanzadas de promociones
- [ ] mejores reportes de pedidos, pagos y conversión
- [ ] refinamiento del CMS y bloques reutilizables
- [ ] optimizaciones de UX móvil y performance

### Lectura PM del estado de Fase 2

- Fase 2 ya fue abierta y tiene entregables funcionales reales en producción.
- Lo ya construido cubre seller panel, dashboards por rol, reglas flexibles de comisión y una base visual pública activa para la home oficial.
- El frente pendiente ya no es "migrar la home", sino homologar superficies secundarias, automatización comercial, reporting y una capa UX final consistente de nivel productivo.
- El plan operativo aterrizado para ejecutar este frente vive en [fase-2-execution-plan.md](./fase-2-execution-plan.md).

### Criterios de aceptación para la homologación visual sobre la base `Preline`

- navegación pública intacta hacia `/`, `/catalogo`, `/checkout`, `/mayoristas`, `/trabaja-con-nosotros`, `/cuenta` y `/panel-vendedor`
- la home oficial mantiene la composición actual basada en `storefront-v2-premium`
- hero, carrusel de productos en tendencia y banners promocionales adaptados sólo a `Clásico Verde`, `Premium Negro` y `Combo Dúo Perfecto`
- las páginas públicas secundarias y el acceso admin respetan el mismo sistema de color, espaciado y jerarquía visual
- rendimiento equivalente o mejor que la home previa, sin degradar el `Core Web Vitals` base
- copy SEO alineado a palabras clave como `inhaladores herbales`, `frescura herbal`, `portabilidad`, `viajes` y `altura`
- brief UI/UX actualizado y anexado al frente activo antes de cerrar implementación

## Fase 3. Escala controlada

### Meta

Escalar la plataforma con más automatización, control de negocio y lectura analítica.

### Entregables

- procesos de liquidación más robustos
- scoring y calificación más fina de leads mayoristas
- loyalty con campañas basadas en comportamiento
- automatizaciones de lifecycle marketing
- observabilidad y reporting más profundos
- capacidad de extraer módulos de alto tráfico si el volumen lo exige

## Dependencias entre fases

- Fase 1 se apoya en la base ya entregada de persistencia real y autorización por rol.
- Fase 2 depende de que el circuito transaccional y los jobs asíncronos queden estables.
- Fase 3 depende de señales reales de uso, volumen y estabilidad operativa.
- Ninguna fase justifica adelantar microservicios sin evidencia clara.

## Criterios para mover de fase

### De Fase 1 a Fase 2

- operación diaria estable
- flujos críticos con trazabilidad y reintentos resueltos
- métricas básicas de conversión, pagos, comisiones y notificaciones disponibles
- admin operativo sin dependencia de estado efímero en memoria

Estado actual:

Los criterios ya están cubiertos en la base implementada del repositorio.

### De Fase 2 a Fase 3

- crecimiento sostenido de catálogo, campañas y volumen transaccional
- necesidad real de automatización y analítica adicional

## Enfoque de ejecución

- cerrar primero fundamentos de datos, API y backoffice
- construir la web con foco en conversión y claridad de marca
- tratar la documentación como fuente de verdad para tickets, QA y despliegue
- usar el roadmap como fuente para épicas y tickets
