# Spec Tareas - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Objetivo

Convertir la arquitectura canonica del funnel mayorista en un backlog tecnico
ejecutable, cerrando contratos entre captura publica, cotizacion, cierre
comercial, acceso mayorista y resumen autenticado sin abrir un portal B2B
autoservicio.

## Reglas De Ejecucion

- no separar `wholesale` y `distributor` en modulos distintos
- no abrir auto-registro comercial desde storefront
- no convertir `accepted` en pedido ni acceso
- no habilitar portal mayorista operativo dentro de `/cuenta`
- no entregar `vendorCode` ni comisiones seller-first en este slice
- no fusionar leads o cuentas duplicadas automaticamente

## Backlog Canonico

### T1. Contratos compartidos del funnel mayorista

**Resultado esperado**

El repo tiene vocabulario compartido y consistente para `interestType`,
estados del lead, estados de la cotizacion y estados del acceso mayorista.

**Rutas candidatas**

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

**Checklist**

- [ ] mantener `interestType = wholesale | distributor` como contrato de un solo funnel
- [ ] exponer en el resumen comercial el estado del entitlement
- [ ] reflejar responsable comercial y ultimo hito visible del proceso

### T2. Captura publica y deduplicacion operativa

**Resultado esperado**

La captura publica sigue siendo una puerta comercial asistida, no un
onboarding B2B autonomo.

**Rutas candidatas**

- `apps/web/components/wholesale-workspace.tsx`
- `apps/web/lib/api.ts`
- `apps/api/src/modules/wholesale/wholesale.controller.ts`
- `apps/api/src/modules/wholesale/wholesale.service.ts`

**Checklist**

- [ ] mantener una sola captura para mayorista y distribuidor
- [ ] conservar `source` e `interestType` para trazabilidad comercial
- [ ] marcar duplicados para revision sin fusion automatica
- [ ] asegurar que la captura no cree cuenta ni credenciales

### T3. Lifecycle de lead y ownership de ventas

**Resultado esperado**

`Ventas` conserva el ownership del funnel y el repositorio expresa con claridad
las transiciones `new -> qualified -> quoted -> negotiating -> won/lost`.

**Rutas candidatas**

- `apps/api/src/modules/wholesale/wholesale.service.ts`
- `apps/admin/lib/api.ts`

**Checklist**

- [ ] preservar a `Ventas` como actor operativo principal
- [ ] mantener `lost` reabrible con historial intacto
- [ ] registrar actor y responsable comercial por transicion
- [ ] evitar que otros modulos decidan el cierre `won/lost`

### T4. Cotizacion basada en catalogo real

**Resultado esperado**

La cotizacion mayorista sigue partiendo del catalogo vivo, con `tier`
referencial pero editable.

**Rutas candidatas**

- `apps/api/src/modules/wholesale/wholesale.service.ts`
- `apps/admin/lib/api.ts`
- `docs/flows/wholesale-flow.md`

**Checklist**

- [ ] crear cotizacion desde referencias reales del catalogo
- [ ] tratar `tier` como referencia editable y no como tarifa rigida
- [ ] mantener `accepted` como estado de quote sin convertirlo en `won`
- [ ] impedir cotizaciones vacias o sin items validos

### T5. Entitlement mayorista sobre cuenta existente

**Resultado esperado**

El acceso mayorista se crea o vincula solo despues de `won` y sin duplicar
identidades cuando ya existe cuenta con el mismo email.

**Rutas candidatas**

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/admin/components/commercial-accesses-workspace.tsx`
- `apps/api/test/commercial-accesses.test.ts`

**Checklist**

- [ ] bloquear acceso mayorista sobre lead no `won`
- [ ] reutilizar cuenta existente por email cuando corresponda
- [ ] conservar `wholesaleLeadId` como vinculo trazable del acceso
- [ ] auditar creacion, vinculacion, suspension y reactivacion

### T6. `/cuenta` como resumen mayorista basico

**Resultado esperado**

La cuenta autenticada refleja la relacion comercial sin parecer portal B2B
operativo ni panel seller-first.

**Rutas candidatas**

- `apps/web/components/account-workspace.tsx`
- futuro `GET /store/me/commercial-access`

**Checklist**

- [ ] mostrar estado comercial, tier y responsable comercial cuando aplique
- [ ] no mostrar acciones de aceptacion de cotizaciones ni pedidos
- [ ] no derivar al mayorista a `/panel-vendedor`
- [ ] reflejar estado `active`, `inactive` o `suspended`

### T7. Guardrails de acceso comercial

**Resultado esperado**

La capa `auth` sigue bloqueando auto-registro comercial y mantiene separadas
las identidades de cliente, seller y wholesale por ownership.

**Rutas candidatas**

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/test/commercial-accesses.test.ts`

**Checklist**

- [ ] impedir `accountType=wholesale` en registro publico
- [ ] impedir mezcla accidental de wholesale con seller-first
- [ ] validar que el acceso mayorista conserve sus roles correctos
- [ ] asegurar que la suspension del acceso no borre la cuenta

### T8. Regression suite del slice

**Resultado esperado**

La diferencia entre `accepted`, `won`, acceso mayorista y resumen en cuenta
queda defendida por pruebas y smokes de ownership.

**Rutas candidatas**

- `apps/api/test/commercial-accesses.test.ts`
- posibles pruebas del modulo `wholesale`

**Checklist**

- [ ] probar lead `wholesale`
- [ ] probar lead `distributor`
- [ ] probar quote `accepted` sin acceso creado
- [ ] probar lead `won` con acceso creado o vinculado
- [ ] probar bloqueo de acceso sobre lead no `won`
- [ ] probar que `/cuenta` solo refleja resumen comercial basico

## Orden Recomendado

1. `T1`
2. `T2`
3. `T3`
4. `T4`
5. `T5`
6. `T6`
7. `T7`
8. `T8`

## Definition Of Done Del Slice

- `wholesale` y `distributor` siguen siendo un solo funnel canonico
- `Ventas` conserva el ownership del lifecycle comercial
- `accepted` no crea pedido ni acceso
- `won` es la unica puerta normal para habilitar acceso mayorista
- el acceso se crea o vincula sobre cuenta existente sin duplicar identidad
- `/cuenta` permanece como resumen comercial basico
- el slice no invade seller-first ni abre portal B2B completo
