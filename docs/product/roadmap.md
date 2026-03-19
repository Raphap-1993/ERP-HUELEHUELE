# Roadmap por Fases

## Objetivo

Ordenar la construcción de Huelegood en fases ejecutables, distinguiendo lo ya entregado, lo que falta para cerrar el MVP operativo y lo que se deja para optimización y escala.

## Estado actual

Al `19 de marzo de 2026`, la base funcional del proyecto ya existe en el repositorio. El foco deja de ser "arrancar desde cero" y pasa a ser "cerrar endurecimiento transaccional, observabilidad y estabilización productiva".

### Ya entregado

- [x] base de aplicaciones `web`, `admin`, `api` y `worker`
- [x] auth, catálogo y checkout
- [x] pedidos, pagos y flujo de revisión manual
- [x] vendedores, códigos y comisiones base
- [x] mayoristas, campañas y CRM básico
- [x] fidelización por puntos y notificaciones
- [x] CMS interno y configuración de storefront
- [x] auditoría, seguridad operativa y healthchecks
- [x] RBAC real con guards, permisos persistidos y navegación admin filtrada por rol
- [x] persistencia operativa en PostgreSQL para módulos stateful mediante `Prisma` + `module_snapshots`
- [x] BullMQ operativo para notificaciones y base reutilizable para jobs asíncronos

### Pendiente inmediato

- [ ] hardening de checkout, pagos y revisión manual
- [ ] ampliación de jobs BullMQ a conciliación y liquidación donde aporte valor operativo
- [ ] observabilidad operativa más completa
- [ ] despliegue productivo estabilizado sobre VPS, PM2 y Nginx

## Fase 1. Cierre del MVP operativo

### Meta

Convertir la base funcional actual en una operación estable, persistida y segura.

### Entregables

- persistencia operativa en PostgreSQL para órdenes, CMS, vendedores, comisiones, loyalty, marketing, notificaciones y módulos relacionados mediante `Prisma` + `module_snapshots`
- BullMQ operativo para notificaciones y base preparada para extender jobs de conciliación y liquidación
- trazabilidad de procesos críticos con reintentos e idempotencia
- reglas de negocio cerradas para checkout, Openpay y pago manual
- panel admin conectado a datos persistidos y no a estado efímero en memoria
- semillas, migraciones y limpieza de datos operativos
- healthchecks y logs estructurados para operación diaria

## Fase 2. Optimización comercial

### Meta

Mejorar eficiencia operativa, visibilidad comercial y capacidad de crecimiento sin cambiar el modelo de monolito modular.

### Entregables

- seller panel ampliado
- dashboards operativos por rol
- reglas de comisión más flexibles
- mayor automatización de campañas
- segmentación más rica
- reglas avanzadas de promociones
- mejores reportes de pedidos, pagos y conversión
- refinamiento del CMS y bloques reutilizables
- optimizaciones de UX móvil y performance

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

### De Fase 2 a Fase 3

- crecimiento sostenido de catálogo, campañas y volumen transaccional
- necesidad real de automatización y analítica adicional

## Enfoque de ejecución

- cerrar primero fundamentos de datos, API y backoffice
- construir la web con foco en conversión y claridad de marca
- tratar la documentación como fuente de verdad para tickets, QA y despliegue
- usar el roadmap como fuente para épicas y tickets
