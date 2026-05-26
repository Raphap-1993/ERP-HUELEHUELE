# Spec Tareas - Vendors Commissions

Fecha: 2026-05-26.

## Objetivo

Convertir la arquitectura canonica del slice seller-first en un backlog tecnico
ejecutable, cerrando las guardas de atribucion, lock financiero, recomposicion
de comisiones y consistencia del seller panel sin redisenar el runtime.

## Reglas De Ejecucion

- no mover el onboarding fuera de `vendors` y `auth`
- no crear una nueva frontera de atribucion fuera de `orders`
- no abrir una ruta de correccion en `payments`
- no convertir `worker` en duenio de decisiones de negocio
- no permitir correccion normal despues del lock financiero
- no introducir multi-vendor, marketplace ni post-payout adjustment dentro de este slice

## Backlog Canonico

### T1. Contratos compartidos de atribucion y lock

**Resultado esperado**

El repo tiene vocabulario compartido para correccion de vendedor, lock
financiero y motivo de la accion.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`
- `packages/shared/src/domain/enums.ts`
- `packages/shared/src/domain/order-lifecycle.ts`

**Checklist**

- [ ] extender `AdminOrderVendorAssignmentInput` con `reason`
- [ ] exponer en el pedido si la atribucion esta bloqueada y por que
- [ ] mantener el vocabulario canonico de estados de comision y payout como fuente del lock

### T2. Invariantes de onboarding y acceso comercial

**Resultado esperado**

La entrada seller-first sigue controlada por backoffice y el acceso comercial
solo existe cuando hay relacion valida con vendedor.

**Rutas candidatas**

- `apps/api/src/modules/vendors/vendors.service.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/test/commercial-accesses.test.ts`

**Checklist**

- [ ] verificar que la postulacion publica no cree credenciales comerciales
- [ ] exigir `resolvedCollaborationType` y `preferredCode` consistente en la aprobacion
- [ ] reforzar que el acceso seller requiera `vendorCode` valido y vendedor activo
- [ ] cubrir suspension/reactivacion de acceso sin perder trazabilidad

### T3. Ownership de atribucion en `orders`

**Resultado esperado**

`orders` conserva la unica puerta canonica de correccion y la UI de operacion
deja claro que se trata de una regularizacion excepcional.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/admin/components/orders-workspace.tsx`

**Checklist**

- [ ] mantener `POST /admin/orders/:orderNumber/vendor` como endpoint canonico
- [ ] exigir actor y motivo auditables para la correccion
- [ ] bloquear vendedor inexistente o inactivo
- [ ] retirar la sensacion de edicion libre cuando la orden ya tenga consecuencia financiera

### T4. Evaluador de lock financiero

**Resultado esperado**

La API y la UI pueden determinar de forma consistente cuando una correccion
ya no es una operacion normal de pedido.

**Rutas candidatas**

- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/commissions/commissions.service.ts`
- `packages/shared/src/types/api.ts`
- `apps/admin/components/orders-workspace.tsx`

**Checklist**

- [ ] bloquear correccion si la comision esta en `payable`, `scheduled_for_payout` o `paid`
- [ ] bloquear correccion si existe `payoutId` no cancelado o job de payout pendiente/en ejecucion
- [ ] bloquear correccion si el pedido ya entro en reversa o cancelacion con impacto financiero cerrado
- [ ] mostrar en UI la razon del lock

### T5. Recomposicion de comisiones tras correccion valida

**Resultado esperado**

Una correccion `A -> B` antes del lock recompone la consecuencia financiera
sin dejar residuos entre pedido, comision, payout y snapshot de vendedor.

**Rutas candidatas**

- `apps/api/src/modules/commissions/commissions.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/test/erp-sales-flow.test.ts`

**Checklist**

- [ ] disparar recomposicion explicita al corregir vendedor antes del lock
- [ ] mover la comision al vendedor correcto sin dejar referencias obsoletas
- [ ] impedir `A -> none` si ya hubo comision materializada
- [ ] proteger payouts draft o aprobados del mismo periodo frente a inconsistencias

### T6. Frontera de `payments`

**Resultado esperado**

`payments` sigue centrado en cobros y revisiones manuales, sin ganar ownership
de atribucion comercial.

**Rutas candidatas**

- `apps/api/src/modules/payments/payments.service.ts`
- `apps/admin/components/payments-workspace.tsx`
- `apps/api/test/erp-sales-flow.test.ts`

**Checklist**

- [ ] asegurar que `payments` no exponga cambios de `vendorCode`
- [ ] conservar solo syncs derivados despues de eventos de cobro
- [ ] reflejar en UI que la regularizacion de vendedor vive en `Pedidos > Operacion`

### T7. Worker y jobs de payout

**Resultado esperado**

La capa async sigue preparando y conciliando payouts sin convertirse en duenio
de la regla comercial.

**Rutas candidatas**

- `apps/api/src/modules/commissions/commissions.service.ts`
- `apps/api/src/persistence/bullmq.service.ts`
- `apps/worker/src/main.ts`

**Checklist**

- [ ] mantener jobs de create/settle payout por `vendorCode` y periodo
- [ ] asegurar `jobId` estable o llave equivalente para evitar duplicados operativos
- [ ] impedir que un job async mutile atribucion primaria del pedido

### T8. Seller panel como read model derivado

**Resultado esperado**

El seller panel sigue mostrando la verdad derivada del slice y nunca se
convierte en una superficie de correccion.

**Rutas candidatas**

- `apps/api/src/modules/core/core.service.ts`
- `apps/api/src/modules/core/seller-panel.controller.ts`
- `apps/web/components/seller-panel-workspace.tsx`

**Checklist**

- [ ] reflejar pedidos, comisiones y payouts del vendedor correcto
- [ ] no agregar acciones de correccion de atribucion ni comision
- [ ] verificar consistencia entre seller panel y `/admin/comisiones`

### T9. Regression suite del slice

**Resultado esperado**

La regla critica de correccion post-pedido queda defendida por pruebas y por
smokes de ownership entre modulos.

**Rutas candidatas**

- `apps/api/test/erp-sales-flow.test.ts`
- `apps/api/test/commercial-accesses.test.ts`

**Checklist**

- [ ] probar onboarding seller-first con aprobacion y `preferredCode`
- [ ] probar acceso seller con `vendorCode` obligatorio
- [ ] probar correccion permitida antes del lock
- [ ] probar bloqueo despues del lock financiero
- [ ] probar bloqueo de `A -> none` con comision materializada
- [ ] probar que seller panel refleja la verdad recomputada

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`
9. `T9`

## Definition Of Done Del Slice

- la captura publica, el onboarding y el acceso comercial conservan ownership claro
- `orders` sigue siendo la unica puerta de correccion de `vendorCode`
- la correccion solo se permite antes del lock financiero
- `commissions` recompone la consecuencia financiera sin corregir la atribucion primaria
- `payments` no gana ownership sobre atribucion
- `worker` participa solo como executor async
- `/panel-vendedor` y `/admin/comisiones` leen la misma verdad derivada
