# Alcance del Proyecto

## Alcance general

Huelegood cubre las capacidades necesarias para operar comercialmente la marca desde un stack propio y un único dominio de negocio.

## En alcance

### Comercio

- catálogo público
- detalle de producto
- carrito
- checkout
- promociones automáticas y cupones
- pedidos y seguimiento básico

### Pagos

- Openpay como pasarela online
- pagos manuales con comprobante y revisión operativa
- conciliación básica y trazabilidad de transacciones

### Vendedores

- formulario `trabaja con nosotros`
- onboarding de vendedor
- código de vendedor
- atribución de pedidos
- panel operativo básico para comisiones y estado

### Mayoristas

- lead capture
- calificación interna
- tiers mayoristas
- emisión y gestión de cotizaciones

### Fidelización

- reglas de acumulación
- cuenta de puntos
- movimientos
- canjes controlados

### Marketing y CRM básico

- segmentos
- campañas
- plantillas
- tracking básico de eventos de marketing

### CMS interno

- páginas
- bloques
- banners
- FAQs
- testimoniales
- navegación
- SEO básico por página

### Operación interna

- admin con RBAC
- revisión de pagos manuales
- gestión de pedidos
- gestión de vendedores y comisiones
- auditoría y acciones administrativas

## Fuera de alcance en MVP

- microservicios por dominio
- multi-tenant o white-label
- marketplace de terceros
- ERP externo o sincronización compleja de inventario
- portal B2B autoservicio completo para mayoristas
- automatización avanzada de CRM enterprise
- app móvil nativa
- CMS headless externo como núcleo

## Decisiones funcionales explícitas

### Seller-first sin marketplace

Huelegood favorece adquisición por vendedores, pero:

- el catálogo sigue siendo centralizado
- el inventario no pertenece al vendedor
- el checkout lo opera Huelegood
- la comisión nace de la atribución, no de una subtienda individual

### Pagos mixtos

Se soportan dos caminos de cobro:

- online vía Openpay
- manual con evidencia y revisión

Ambos convergen al mismo agregado `order`, con estados y trazabilidad consistentes.

### Mayoristas como funnel comercial

El módulo mayorista inicia como proceso gestionado por operación:

- lead
- calificación
- cotización
- cierre comercial

No se asume autoservicio B2B completo en esta etapa.

### Fidelización gradual

Los puntos existen desde MVP, pero bajo reglas simples y auditables. No se persigue un motor de loyalty complejo en la primera versión.

## Restricciones técnicas del alcance

- monolito modular
- PostgreSQL existente en VPS
- Redis + BullMQ para async
- Prisma como ORM
- PM2 para ejecución
- Hestia + Nginx para publicación
- `shadcn/ui` + `Tailwind CSS` para la capa visual

## Criterio de cierre de alcance MVP

El MVP se considera completo cuando:

- un cliente puede comprar y pagar por Openpay
- un cliente puede enviar pago manual y recibir resolución
- un pedido puede atribuirse a un vendedor con código
- una comisión puede generarse y liquidarse
- un lead mayorista puede capturarse y cotizarse
- un cliente puede acumular y consumir puntos bajo reglas básicas
- operación puede administrar contenido, promociones y pedidos desde admin
