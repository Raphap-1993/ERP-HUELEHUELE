# Roadmap por Fases

## Objetivo

Ordenar la construcción de Huelegood en fases ejecutables, priorizando operación real antes de sofisticación.

## MVP

### Meta

Poner en producción una plataforma comercial operable de punta a punta.

### Entregables

- storefront público en Next.js
- admin base en Next.js
- API NestJS con módulos core
- catálogo, CMS y promociones
- carrito, checkout y pedidos
- pago Openpay
- pago manual con revisión
- onboarding de vendedor
- códigos de vendedor y atribución
- comisiones base y payout manual
- lead mayorista y cotización inicial
- puntos base por compra
- campañas básicas y notificaciones esenciales
- auditoría mínima en operaciones sensibles

## Fase 2

### Meta

Mejorar eficiencia operativa, visibilidad comercial y capacidad de crecimiento.

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

## Fase 3

### Meta

Escalar la plataforma con más automatización y control de negocio.

### Entregables

- procesos de liquidación más robustos
- scoring y calificación más fina de leads mayoristas
- loyalty con campañas basadas en comportamiento
- automatizaciones de lifecycle marketing
- observabilidad y reporting más profundos
- capacidad de extraer módulos de alto tráfico si el volumen lo exige

## Dependencias entre fases

- Fase 2 depende de que MVP cierre correctamente el circuito transaccional.
- Fase 3 depende de señales reales de uso y de estabilidad operativa.
- Ninguna fase justifica adelantar microservicios sin evidencia clara.

## Criterios para mover de fase

### De MVP a Fase 2

- operación diaria estable
- flujos críticos sin retrabajo manual excesivo
- métricas básicas de conversión, pagos y comisiones disponibles

### De Fase 2 a Fase 3

- crecimiento sostenido de catálogo, campañas y volumen transaccional
- necesidad real de automatización y analítica adicional

## Enfoque de ejecución

- cerrar primero fundamentos de datos, API y backoffice
- construir la web con foco en conversión y claridad de marca
- usar el roadmap como fuente para épicas y tickets
