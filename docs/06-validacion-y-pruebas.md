# Validacion y Pruebas

## Objetivo

Dejar evidencia verificable de que el corte ERP para vendedores, trazabilidad comercial, stock y reportes quedo:

- compilable
- probado en dominio
- documentado con limites y riesgos reales

## Alcance validado

Se validaron estos frentes:

- alta de vendedor despues de una postulacion rechazada
- trazabilidad de venta manual con vendedor, canal y fecha
- reserva y consolidacion de stock para pedido manual
- reserva y consolidacion de stock para orden web
- idempotencia de orden web para no descontar dos veces
- validacion de stock insuficiente
- reportes por vendedor
- reportes por producto
- persistencia de fecha comercial de venta
- reversa de stock ante reembolso o cancelacion operativa equivalente

## Comandos ejecutados

### 1. Verificacion de tipos

```bash
npm run typecheck
```

Resultado:

- completado
- monorepo sin errores de tipos en `shared`, `web`, `admin`, `api` y `worker`

### 2. Suite automatizada de dominio

```bash
npm run test:erp-sales
```

Archivo ejecutado:

- [`apps/api/test/erp-sales-flow.test.ts`](../apps/api/test/erp-sales-flow.test.ts)

Resultado:

- completado
- `10/10` pruebas aprobadas

Cobertura funcional de la suite:

1. Se puede registrar vendedor despues de rechazar una postulacion previa.
2. Una venta manual confirmada guarda vendedor, canal y fecha.
3. Un pedido manual pendiente reserva stock y al confirmarse consolida la venta.
4. Una orden web valida reserva y luego confirma stock al conciliar el pago.
5. La misma orden web idempotente no descuenta stock dos veces.
6. Una venta falla correctamente cuando no hay stock suficiente.
7. El reporte por vendedor agrega ventas confirmadas por canal y total.
8. El reporte por producto agrega unidades e ingresos correctos.
9. La fecha de venta persiste y alimenta el detalle de reportes.
10. Una cancelacion o reembolso revierte el stock comprometido.

### 3. Build del monorepo

```bash
npm run build
```

Resultado:

- completado
- `shared`, `web`, `admin`, `api` y `worker` compilaron correctamente

## Evidencia funcional por area

### Vendedores

Validado:

- `VendorsService.submitApplication()`
- `VendorsService.rejectApplication()`
- `VendorsService.createManualVendor()`

Resultado:

- el sistema ya no bloquea el alta manual por una postulacion previa rechazada
- el vendedor queda activo y con codigo operativo

### Trazabilidad comercial

Validado:

- `OrdersService.createBackofficeOrder()`
- `OrdersService.createCheckoutOrder()`
- `OrdersService.confirmOnlinePayment()`
- `OrdersService.getOrder()`

Resultado:

- el pedido conserva `vendorCode`, `vendorName`, `salesChannel`, `createdAt` y `confirmedAt`
- la venta web y manual usan la misma fuente operativa de trazabilidad

### Inventario

Validado:

- `InventoryService.syncOrder()`
- `OrdersService.registerAdminManualPayment()`
- `OrdersService.transitionOrderStatus()`

Politica verificada:

- `pending_payment` reserva stock
- `paid` y `confirmed` consolidan stock
- `refunded` revierte stock comprometido

Resultado:

- el descuento ya no depende de rutas separadas por canal
- la idempotencia evita duplicidad en orden web repetida

### Reportes

Validado:

- `CoreService.getReportByPeriod()`

Resultado:

- reportes por vendedor y producto salen de ventas confirmadas
- el detalle de ventas usa fecha de confirmacion comercial
- el canal y el vendedor quedan disponibles para agregacion y auditoria

## Limitaciones conocidas

- La suite agregada es de dominio y servicios. No cubre UI browser end-to-end.
- El flujo online sigue dependiendo de conciliacion controlada mientras no exista webhook Openpay productivo de punta a punta.
- El runtime comercial sigue siendo hibrido: parte del dominio vive en Prisma y parte en snapshots `module_snapshots`.
- No se agrego una medicion formal de cobertura porcentual porque el repositorio no trae infraestructura previa para eso.

## Riesgos residuales

- Si se migra despues el dominio comercial completo a Prisma, habra que volver a validar compatibilidad de snapshots heredados.
- La vista administrativa de inventario expone disponibilidad operativa y unidades confirmadas; cualquier redefinicion a neto contable por devoluciones debe homologarse aparte.
- La confirmacion online administrativa resuelve el requerimiento actual, pero no reemplaza un webhook productivo para conciliacion automatica externa.

## Conclusion

El corte queda validado tecnicamente para:

- registrar vendedor
- trazar quien vendio y cuando vendio
- centralizar politica de stock entre web y manual
- exponer reportes por vendedor y por producto

Con build y pruebas en verde, el cambio queda listo para revision de PR, con limitaciones y deuda tecnica explicitadas.
