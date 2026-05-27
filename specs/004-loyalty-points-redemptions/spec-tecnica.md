# Spec Tecnica - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del programa de puntos vigente
sin abrir un motor de loyalty nuevo. El slice debe preservar la separacion
entre `orders`, `loyalty`, `marketing`, `auth` y `customers`, dejando
explicito que earn, settlement, reversal y redemption son hitos distintos del
dominio.

## Baseline Real Del Repo

### Dominio `loyalty`

- `apps/api/src/modules/loyalty/loyalty.service.ts`
  - expone `assignPoints()`
  - expone `recordOrderPoints()`
  - expone `settleOrderPoints()`
  - expone `reverseOrderPoints()`
  - expone `createRedemption()`
  - expone `updateRedemptionStatus()`
  - mantiene cuentas, movimientos, redemptions y reglas en snapshot del modulo

### Integracion con `orders`

- `apps/api/src/modules/orders/orders.service.ts`
  - calcula `loyaltyStatus`
  - dispara `recordOrderPoints()` al crear pedido
  - dispara `settleOrderPoints()` cuando el pedido se confirma/elegibiliza
  - dispara `reverseOrderPoints()` ante rechazo o invalidez posterior

### Superficie admin

- `apps/admin/components/loyalty-workspace.tsx`
  - opera asignacion manual de puntos
  - crea canjes
  - resuelve canjes `Applied` o `Cancelled`
  - expone cuentas, movimientos, canjes y reglas
- `apps/admin/app/loyalty/page.tsx`
  - publica el modulo con permisos `adminAccessRoles.loyalty`

### Cuenta autenticada

- `apps/web/components/account-workspace.tsx`
  - muestra resumen de puntos disponibles, pendientes y canjeados
  - muestra movimiento reciente y estado de canje
  - no ofrece autoservicio de canje

### Contratos compartidos

- `packages/shared/src/types/api.ts`
  - expone modelos `LoyaltyAccountSummary`, `LoyaltyMovementSummary`,
    `LoyaltyRedemptionSummary`, `LoyaltyRuleSummary`
  - expone estados `LoyaltyMovementStatus` y `RedemptionStatus`

## Frontera Tecnica Objetivo

### 1. `orders` sigue siendo el duenio del hito elegible

- decide cuando un pedido crea earn, libera puntos o revierte puntos
- no decide reglas del programa loyalty
- no aprueba ni cancela canjes

### 2. `loyalty` sigue siendo el master del ledger

- dueno de `loyalty_account`, `loyalty_movement`, `redemption` y
  `loyalty_rule`
- conserva el saldo disponible, pendiente y canjeado
- no decide pagos ni estado primario del pedido

### 3. `marketing` sigue siendo la puerta operativa del canje

- opera ajustes normales, canjes y reglas base desde admin
- no cambia estados de pago ni identidad del cliente
- comparte excepciones con `admin` y `super_admin`

### 4. `auth` y `customers` siguen siendo la frontera de identidad

- resuelven la cuenta cliente autenticada
- no deciden earn, settlement, reversal ni redemption

### 5. `/cuenta` permanece como lectura del programa

- presenta saldo y estado del programa
- no inicia canjes ni aplica descuentos de checkout

## Ajustes Minimos Recomendados

Este slice no abre un modulo nuevo. Solo cierra contratos vivos del
brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

Ajustes recomendados:

- exponer con claridad saldo disponible, pendiente y canjeado
- conservar el vocabulario `pending/available/reversed/expired`
- mantener `pending/applied/cancelled` para `redemption`

### API y modulo loyalty

Rutas candidatas:

- `apps/api/src/modules/loyalty/loyalty.service.ts`
- `apps/api/src/modules/orders/orders.service.ts`

Ajustes recomendados:

- conservar `recordOrderPoints()`, `settleOrderPoints()` y
  `reverseOrderPoints()` como puertas canonicas del flujo transaccional
- mantener `createRedemption()` con reserva inmediata
- garantizar que `updateRedemptionStatus()` resuelva correctamente `applied`
  y `cancelled`

### Admin y cuenta

Rutas candidatas:

- `apps/admin/components/loyalty-workspace.tsx`
- `apps/web/components/account-workspace.tsx`

Ajustes recomendados:

- reflejar que el canje `pending` implica saldo retenido
- conservar `/cuenta` como lectura, no como flujo de accion
- mantener `/admin/loyalty` como workbench operativo del modulo

## Reglas Tecnicas Del Slice

1. Los puntos pertenecen a una cuenta cliente autenticada.
2. Existe una sola `loyalty_rule` activa de acumulacion.
3. `orders` decide earn, settlement y reversal ligados al pedido.
4. `loyalty` conserva el ledger y el saldo.
5. `createRedemption()` reserva puntos de inmediato.
6. `updateRedemptionStatus()` debe diferenciar correctamente `applied` y
   `cancelled`.
7. La reversa por invalidez del pedido es automatica.
8. `/cuenta` consume lectura del programa, no opera canjes.
9. El slice no modela catalogo formal de recompensas.
10. El slice no expone autoservicio de canje.

## Seguridad Y Observabilidad

Eventos y auditorias ya visibles o exigibles para este slice:

- `loyalty.points.pending`
- `loyalty.points.available`
- `loyalty.points.reversed`
- `loyalty.redemption.created`
- `loyalty.redemption.applied`
- `loyalty.redemption.cancelled`

Guardas adicionales recomendadas:

- auditar actor y motivo en ajustes manuales
- auditar resolucion del canje y reward entregado
- registrar intento bloqueado por saldo insuficiente
- registrar earn/reversal ligados a pedido con `orderNumber`

## Estrategia De Implementacion

### Release 1. Contrato del ledger y estados

- alinear tipos compartidos de cuenta, movimiento, redemptions y reglas
- fijar vocabulario de saldo y estados
- endurecer lectura del slice sobre el runtime actual

### Release 2. Frontera transaccional con orders

- consolidar earn, settlement y reversal como integracion canonica
- verificar consistencia entre pedido, movimiento y cuenta
- reforzar idempotencia frente a reprocesos del pedido

### Release 3. Frontera operativa del canje

- mantener reserva inmediata
- clarificar `applied` y `cancelled`
- preservar `/cuenta` como lectura y `/admin/loyalty` como operacion

## Estrategia De Pruebas

### API

Rutas candidatas:

- `apps/api/src/modules/loyalty/loyalty.service.ts`
- pruebas del flujo de pedidos y loyalty

Cobertura esperada:

- earn `pending`
- settlement a `available`
- reversal desde pedido invalidado
- canje con reserva inmediata
- `applied` consume saldo retenido
- `cancelled` devuelve saldo a `available`
- bloqueo por saldo insuficiente

### Admin y cuenta

- validar que `/admin/loyalty` siga siendo la superficie operativa
- validar que `/cuenta` solo exponga visibilidad del programa
- validar consistencia entre saldo de cuenta y movimientos mostrados

## Riesgos Tecnicos Abiertos

- el runtime loyalty opera sobre snapshot del modulo y no sobre ledger
  relacional dedicado
- la expiracion existe en vocabulario, pero no debe sobredimensionarse como
  comportamiento canonico en este corte
- el canje usa `reward` libre/manual, por lo que el beneficio sigue siendo
  flexible y no estructurado
- la proteccion de idempotencia frente a earn repetido debe tratarse como
  guardrail tecnico del slice
