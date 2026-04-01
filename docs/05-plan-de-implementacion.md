# Plan de Implementacion

## Backlog priorizado

### Prioridad 1

- homologar trazabilidad de pedido o venta
- reforzar registro de vendedor
- centralizar y explicitar politica de stock
- habilitar reportes por vendedor y producto

### Prioridad 2

- exponer detalle de fechas por venta y por producto
- cerrar mejor conciliacion de pagos online
- endurecer persistencia relacional de vendedores e inventario

## Fases

### Fase A Documentacion y homologacion

- cerrar auditoria
- fijar glosario y reglas de lenguaje
- fijar casos de uso y diseno tecnico

### Fase B Dominio y backend

- extender `orders` con vendedor, canal y fechas
- reforzar alta de vendedor
- agregar lectura de reportes por vendedor y producto
- consolidar confirmacion de venta y stock en un punto comun

### Fase C Admin y UX operativa

- permitir asociar vendedor en pedidos manuales
- mostrar trazabilidad comercial en detalle de pedido
- exponer reportes por vendedor y producto

### Fase D Calidad y cierre

- agregar pruebas o scripts de validacion
- documentar resultados, riesgos y rollback

## Tareas por modulo

### Analista

- validar requerimientos contra codigo actual
- homologar estados que cuentan como venta valida
- dejar criterios de aceptacion verificables

### Arquitecto

- definir politica unica de stock
- decidir que campos de trazabilidad viven en pedido
- evitar duplicidad entre reportes, inventario y comisiones

### Backend

- `vendors`: alta, persistencia util y relacion operativa
- `orders`: vendedor, canal, fechas, confirmacion comercial
- `payments`: confirmacion manual y online controlada
- `inventory`: reserva, confirmacion y reversa central
- `reports/core`: agregaciones por vendedor, producto y detalle

### Frontend admin

- formulario y feedback de alta de vendedor
- selector o visibilidad de vendedor en pedido manual
- trazabilidad comercial en detalle del pedido
- tablas de reportes por vendedor y producto

### QA

- matriz minima de validacion funcional
- casos borde de stock insuficiente, doble procesamiento y cancelacion

### Documentacion

- mantener `docs/00` a `docs/06` alineados
- actualizar `docs/README.md`

## Dependencias

- los reportes dependen de la trazabilidad del pedido
- la trazabilidad del pedido depende de resolver vendedor y fecha de confirmacion
- la consistencia de stock depende de la politica homologada de estados

## Riesgos

- cambios sobre un worktree ya modificado
- divergencia entre runtime snapshot y schema Prisma
- falta de webhook online productivo
- ausencia de framework de testing formal en el repo

## Validaciones

- `npm run typecheck`
- pruebas o scripts de validacion del flujo
- validacion manual de rutas admin afectadas

## Rollback

- conservar cambios incrementales y aislados por modulo
- no eliminar estructuras previas mientras no exista reemplazo validado
- si una mutacion de reportes o stock falla, revertir solo la capa afectada y mantener snapshots anteriores
