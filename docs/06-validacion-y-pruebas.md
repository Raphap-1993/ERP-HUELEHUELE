# Validacion y Pruebas

## Objetivo

Dejar evidencia verificable de que el corte ERP para vendedores, trazabilidad comercial, stock, reportes e inventario multi-almacen quedo:

- compilable
- probado en dominio
- documentado con limites y riesgos reales

Fecha de validacion local:

- `2026-04-15`
- `2026-04-17`
- `2026-04-22`

## Alcance validado

Se validaron estos frentes:

- alta de vendedor despues de una postulacion rechazada
- trazabilidad de venta manual con vendedor, canal y fecha
- detalle operativo de pedido como vista canonica de trazabilidad comercial
- reserva y consolidacion de stock para pedido manual
- reserva y consolidacion de stock para orden web
- guardrail de conciliacion para no mezclar `openpay` con registro manual directo
- idempotencia de orden web para no descontar dos veces
- validacion de stock insuficiente
- reportes por vendedor
- reportes por producto
- workspace admin de reportes con filtros server-side y exportacion CSV consistente
- UX operativa admin para diferenciar comprobantes manuales, registro directo y conciliacion online
- persistencia de fecha comercial de venta
- reversa de stock ante reembolso o cancelacion operativa equivalente
- lectura de inventario por `variante + almacen`
- transferencias multi-almacen con reserva, despacho, recepcion, incidencia y reconciliacion
- persistencia documental de `package snapshot`, `GRE` y `sticker` por transferencia

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

Nota:

- el script ahora recompila `@huelegood/shared` antes de correr la suite para evitar desalineacion entre `src/` y `dist/` en tiempo de ejecucion

Archivo ejecutado:

- [`apps/api/test/erp-sales-flow.test.ts`](../apps/api/test/erp-sales-flow.test.ts)

Resultado:

- completado
- `28/28` pruebas aprobadas

Cobertura funcional de la suite:

1. Se puede registrar vendedor despues de rechazar una postulacion previa.
2. Se puede registrar vendedor con codigo comercial friendly.
3. Se rechaza alta manual con codigo comercial duplicado.
4. Se rechaza alta manual con WhatsApp sin codigo de pais.
5. Una postulacion valida queda `submitted` y bloquea duplicados activos.
6. `screening` y aprobacion generan el vendedor con el tipo final confirmado.
7. La aprobacion permite fijar un codigo comercial friendly.
8. La aprobacion exige `screening` previo y tipo comercial final.
9. Una venta manual confirmada guarda vendedor, canal y fecha.
10. Se puede asignar, cambiar y retirar vendedor desde un pedido existente.
11. Un pedido manual pendiente reserva stock y al confirmarse consolida la venta.
12. El registro manual directo persiste una traza comercial canonica.
13. Una orden `openpay` no puede entrar por la ruta de pago manual directo.
14. Una orden web valida reserva y luego confirma stock al conciliar el pago.
15. La aprobacion de comprobante manual deja una traza comercial canonica.
16. La misma orden web idempotente no descuenta stock dos veces.
17. Una venta falla correctamente cuando no hay stock suficiente.
18. Reconstruir inventario desde pedidos no duplica reservas ni comprometidos persistidos.
19. El reporte separa saldo por almacen y descuenta solo el origen asignado.
20. Una transferencia reserva, despacha y recibe stock sin mezclar almacenes.
21. Una transferencia puede recibir parcialmente, abrir incidencia y reconciliarse sin editar balances.
22. Una transferencia genera `package snapshot`, `GRE` y `sticker` persistidos sobre el mismo `transferNumber`.
23. El reporte por vendedor agrega ventas confirmadas por canal y total.
24. El reporte por producto agrega unidades e ingresos correctos.
25. La fecha de venta persiste y alimenta el detalle de reportes.
26. El reporte permite filtrar ventas por canal y vendedor.
27. El filtro por producto recorta detalle, ingresos y exportacion CSV.
28. Una cancelacion o reembolso revierte el stock comprometido.

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
- `commercialTrace` resume ruta, actor, referencia, nota, evidencia y fecha operativa
- la venta web y manual usan la misma fuente operativa de trazabilidad
- `Pedidos > Operacion` concentra la ruta activa, actor, referencia y nota como vista canonica para seguir la confirmacion comercial

### Pedidos como vista canonica

Validado:

- `OrdersWorkspace`
- `OrdersService.getOrder()`

Resultado:

- el detalle operativo del pedido separa `registro manual directo`, `conciliacion Openpay` y `solicitud con comprobante`
- la trazabilidad comercial deja de depender de leer `Pagos` para reconstruir la confirmacion del pedido
- la fecha de confirmacion, la referencia y el historial comercial quedan expuestos en un mismo punto de consulta

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
- la lectura admin de inventario ya opera por `variante + almacen`, no solo por variante agregada

### Transferencias multi-almacen

Validado:

- `TransfersService.createTransfer()`
- `TransfersService.dispatchTransfer()`
- `TransfersService.receiveTransfer()`
- `TransfersService.reconcileTransfer()`
- `TransfersService.createPackageSnapshot()`
- `TransfersService.createGre()`
- `TransfersService.createSticker()`

Resultado:

- la transferencia reserva stock en origen, lo descuenta al despachar y lo ingresa en destino al recibir
- una recepcion parcial deja incidencia persistida y luego puede reconciliarse sin editar balances manualmente
- `package snapshot`, `GRE` y `sticker` quedan trazados bajo el mismo `transferNumber`

### Reportes

Validado:

- `CoreService.getReportByPeriod()`

Resultado:

- reportes por vendedor y producto salen de ventas confirmadas
- el detalle de ventas usa fecha de confirmacion comercial
- el canal y el vendedor quedan disponibles para agregacion y auditoria
- el workspace admin consume `salesChannel`, `vendorCode`, `productSlug` y `sku` como scope server-side compartido con metricas y CSV

### UX operativa de conciliacion

Validado:

- `OrdersWorkspace`
- `PaymentsWorkspace`
- `OrdersService.registerAdminManualPayment()`

Resultado:

- `pagos` deja explicito que atiende comprobantes manuales y no la conciliacion `openpay`
- `pedidos > operacion` separa `registro manual directo` de `conciliacion Openpay`
- la conciliacion online ya no reutiliza campos invisibles del bloque manual
- la ruta incorrecta `openpay -> registro manual directo` queda bloqueada tambien a nivel de servicio

## Limitaciones conocidas

- La suite agregada es de dominio y servicios. No cubre UI browser end-to-end.
- El flujo online del corte actual depende de conciliacion manual controlada desde backoffice. Ese comportamiento es la operacion oficial vigente y no un fallo del corte.
- El runtime comercial sigue siendo hibrido: parte del dominio vive en Prisma y parte en snapshots `module_snapshots`.
- El frente de transferencias requiere aplicar `npm run prisma:push` en cada entorno pendiente; en local ya quedo aplicado antes de esta validacion.
- No se agrego una medicion formal de cobertura porcentual porque el repositorio no trae infraestructura previa para eso.
- La validacion del 2026-04-22 confirma tambien `npm run build` y `npm run typecheck` en verde sobre el snapshot que produccion ya ejecuta.

## Riesgos residuales

- Si se migra despues el dominio comercial completo a Prisma, habra que volver a validar compatibilidad de snapshots heredados.
- La vista administrativa de inventario expone disponibilidad operativa y unidades confirmadas; cualquier redefinicion a neto contable por devoluciones debe homologarse aparte.
- Si mas adelante se habilita pasarela Openpay productiva, habra que abrir un corte nuevo para webhook, firma, idempotencia del proveedor y observabilidad extremo a extremo.

## Conclusion

El corte queda validado tecnicamente para:

- registrar vendedor
- trazar quien vendio y cuando vendio
- centralizar politica de stock entre web y manual
- exponer reportes por vendedor y por producto
- leer inventario por almacen con una vista operativa coherente
- operar transferencias multi-almacen con trazabilidad y documentos logisticos

Con build y pruebas en verde, el cambio queda listo para revision de PR, con limitaciones y deuda tecnica explicitadas.
