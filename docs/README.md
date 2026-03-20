# Huelegood Docs

## Visión general

Huelegood se documenta en este repositorio como una plataforma comercial modular propia, orientada a operar una marca de consumo con venta directa, canal seller-first, gestión administrativa interna y crecimiento comercial controlado desde una única base tecnológica.

No se plantea como una landing page ni como un ecommerce básico. El objetivo es construir una base implementable para:

- storefront e-commerce en Next.js
- backoffice administrable en Next.js
- API transaccional en NestJS
- pagos Openpay
- pagos manuales con revisión operativa
- módulo de vendedores con código y comisiones
- formulario y flujo de "trabaja con nosotros"
- módulo mayorista y distribuidores
- campañas y CRM básico
- fidelización por puntos
- CMS interno propio
- colas y workers para procesos asíncronos

## Estado actual del proyecto

El repositorio ya contiene una base de implementación real y esta carpeta `docs/` funciona como fuente de verdad para arquitectura, producto, flujos, datos, UX e infraestructura.

Como base funcional, el proyecto ya cubre:

- storefront público, admin, API y worker
- auth, catálogo y checkout
- pedidos, pagos y revisión manual
- checkout, pagos y revisión manual endurecidos con idempotencia y guards de estado
- vendedores, comisiones y seller-first
- mayoristas, campañas y CRM básico
- fidelización por puntos y notificaciones
- CMS interno, auditoría, seguridad y healthchecks
- RBAC real con guards, permisos persistidos y navegación admin filtrada por rol
- persistencia operativa en PostgreSQL para módulos stateful
- BullMQ operativo para notificaciones, conciliación manual y liquidación de comisiones
- observabilidad operativa con logs estructurados y vista admin dedicada
- seller panel ampliado y dashboards operativos por rol
- reglas de comisión más flexibles con elegibilidad, prioridad y ajustes de payout
- despliegue productivo estable sobre VPS con `PM2`, `Hestia` y `Nginx`
- modo mantenimiento del storefront para cambios sensibles en producción
- baseline visual pública activa sobre `storefront-v2-premium`, inspirada en `Preline/Coffee Shop`, ya publicada en `/`
- principales superficies públicas alineadas al lenguaje herbal actual de Huele Huele
- login admin separado del shell operativo y acceso real por `AdminAuthGate`
- resolución del API normalizada en `web` y `admin` para producción, sin depender de `localhost`
- release script alineado con `.env.production` local o `shared/.env.production` en el VPS

Como insumo funcional, se asume que la v1 de Huelegood ya comunica:

- operación seller-first
- catálogo visible con productos como `Clásico Verde`, `Premium Negro` y `Combo Dúo Perfecto`
- ofertas activas y códigos promocionales
- bloque mayorista y distribuidores
- narrativa de CRM, campañas, dashboard y seller panel
- propuesta de valor centrada en frescura, reset, portabilidad, tráfico, viajes y altura
- diferenciación frente a vape y pomadas

## Restricciones rectoras

- No usar WordPress, Medusa, Strapi ni un CMS externo como núcleo.
- No modelar multi-tenant interno para Huelegood.
- Reutilizar la base de datos PostgreSQL ya disponible en el VPS del proyecto.
- Adoptar arquitectura de monolito modular, no microservicios puros.
- Mantener una capa visual compartida basada en `Tailwind CSS`, usando `shadcn/ui` donde aporta valor y `Preline` como acelerador de layout en la web pública.

## Stack objetivo

- `Next.js` para web pública
- `Next.js` para admin
- `NestJS` para API
- `PostgreSQL`
- `Redis` + `BullMQ`
- `Prisma ORM`
- `Preline` como librería de layout en storefront público
- `PM2`
- `Hestia + Nginx`

## Estructura de documentos

### Arquitectura

- [overview.md](./architecture/overview.md)
- [solution-architecture.md](./architecture/solution-architecture.md)
- [modules.md](./architecture/modules.md)
- [non-functional-requirements.md](./architecture/non-functional-requirements.md)
- [risks-and-mitigations.md](./architecture/risks-and-mitigations.md)
- [adr-001-monolith-modular.md](./architecture/adr-001-monolith-modular.md)

### Producto

- [product-vision.md](./product/product-vision.md)
- [scope.md](./product/scope.md)
- [roadmap.md](./product/roadmap.md)
- [backlog-mvp.md](./product/backlog-mvp.md)
- [fase-2-execution-plan.md](./product/fase-2-execution-plan.md)
- [roles-and-permissions.md](./product/roles-and-permissions.md)

### Flujos

- [checkout-openpay.md](./flows/checkout-openpay.md)
- [manual-payments.md](./flows/manual-payments.md)
- [vendor-application.md](./flows/vendor-application.md)
- [vendors-and-commissions.md](./flows/vendors-and-commissions.md)
- [wholesale-flow.md](./flows/wholesale-flow.md)
- [loyalty-flow.md](./flows/loyalty-flow.md)
- [campaigns-and-notifications.md](./flows/campaigns-and-notifications.md)

### Datos

- [domain-model.md](./data/domain-model.md)
- [entities.md](./data/entities.md)
- [order-states.md](./data/order-states.md)
- [commission-states.md](./data/commission-states.md)

### API

- [api-v1-outline.md](./api/api-v1-outline.md)

### UX

- [design-system.md](./ux/design-system.md)
- [shadcn-ui-guidelines.md](./ux/shadcn-ui-guidelines.md)

### Storefront

- [storefront-v2-premium-landing.md](./storefront-v2-premium-landing.md) `vigente como registro de consolidación`
- [storefront-redesign-phase7.md](./storefront-redesign-phase7.md) `histórico`

Nota:

- las rutas `/storefront-v2` y `/storefront-v2-premium` ya no operan como previews públicas; en producción redirigen a `/`
- la experiencia oficial pública vive en `/`, `/catalogo`, `/checkout`, `/cuenta`, `/mayoristas`, `/trabaja-con-nosotros` y `/panel-vendedor`

### Infraestructura

- [deployment-strategy.md](./infra/deployment-strategy.md)
- [environments.md](./infra/environments.md)
- [pm2-services.md](./infra/pm2-services.md)

## Orden recomendado de lectura

1. [Visión de producto](./product/product-vision.md)
2. [Alcance](./product/scope.md)
3. [Resumen de arquitectura](./architecture/overview.md)
4. [Arquitectura de solución](./architecture/solution-architecture.md)
5. [Módulos](./architecture/modules.md)
6. [Modelo de dominio](./data/domain-model.md)
7. [Entidades](./data/entities.md)
8. [Flujos clave](./flows/checkout-openpay.md)
9. [API v1](./api/api-v1-outline.md)
10. [Sistema visual](./ux/design-system.md)
11. [Despliegue e infraestructura](./infra/deployment-strategy.md)

## Cómo usar esta documentación

- Como base de implementación inmediata para definir estructura de aplicaciones, módulos y tablas.
- Como fuente de verdad para convertir alcance y backlog en tickets.
- Como guía para alinear decisiones de arquitectura, UX, operaciones y datos antes de escribir código.

## Convenciones generales

- Todos los documentos están escritos en español y orientados a ejecución real.
- Los nombres de módulos y tablas se mantienen en inglés técnico cuando eso favorece consistencia con código y base de datos.
- Cuando una regla aparece en producto, flujos y datos, prevalece la formulación más restrictiva para evitar ambigüedad.
