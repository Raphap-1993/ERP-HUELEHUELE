# Spec Funcional - Vendors Commissions

Fecha: 2026-05-26.

## Objetivo

Definir el slice seller-first vigente como paquete SDD canonico,
formalizando la captura publica, el onboarding, la atribucion comercial del
pedido, las comisiones, los payouts y el panel vendedor sin redisenar el
runtime brownfield.

## Alcance

Incluye:

- postulacion publica en `/trabaja-con-nosotros`
- screening, aprobacion, rechazo y alta operativa del vendedor
- `vendorCode`, `preferredCode`, `collaborationType` y estado del vendedor
- acceso comercial a `/cuenta` y habilitacion de `/panel-vendedor`
- atribucion comercial del pedido en storefront y backoffice
- correccion operativa de `vendorCode` post-pedido antes del lock financiero
- comisiones derivadas desde pedidos
- payouts por vendedor y periodo
- panel vendedor como superficie operativa real

No incluye:

- marketplace o subtiendas por vendedor
- multi-vendor por pedido
- redisenar la UX publica, admin o seller panel
- cambiar porcentajes, payout windows o reglas comerciales del negocio
- ajustes financieros post-payout como parte de este slice
- mover ownership fuera de `vendors`, `orders`, `commissions`, `payments` y `worker`

## Actores

- postulante
- vendedor
- seller_manager
- admin
- ventas
- storefront web
- API Huelegood
- worker

## Reglas Funcionales Canonicas

### RF-01. Captura publica y onboarding controlado por backoffice

- `/trabaja-con-nosotros` captura interes comercial, no crea cuenta operativa
- la postulacion crea `vendor_application` y entra a screening
- solo backoffice puede aprobar, rechazar, crear o vincular el vendedor final
- la aprobacion confirma el `collaborationType` final y deja auditoria

### RF-02. Identidad comercial del vendedor

- cada vendedor operativo tiene un `vendorCode` efectivo
- `preferredCode` es opcional y debe seguir siendo unico
- el vendedor mantiene `collaborationType` y estado operativo trazables
- el codigo maestro del vendedor no se usa para corregir historia de pedidos

### RF-03. Acceso comercial y seller panel

- `/cuenta` es la entrada de sesion comercial
- `/panel-vendedor` solo se habilita con acceso comercial valido y vendedor activo
- el acceso comercial se crea o vincula desde backoffice
- el panel vendedor no reemplaza las superficies internas de aprobacion o auditoria

### RF-04. Atribucion comercial del pedido

- un pedido solo admite un `vendorCode` efectivo
- la atribucion vive en el snapshot comercial del pedido
- el pedido puede nacer con `vendorCode` aplicado desde storefront o sin vendedor
- la regularizacion operativa del vendedor ocurre desde `Pedidos > Operacion`

### RF-05. Correccion post-pedido excepcional

- la correccion post-pedido no es una edicion libre del pedido
- `orders` es el unico dueno de la correccion primaria de `vendorCode`
- la correccion exige vendedor destino activo y resoluble
- la correccion debe dejar actor, motivo y before/after completos
- no se permite `A -> none` si la comision ya se materializo

### RF-06. Lock financiero obligatorio

- la correccion sigue siendo operativa solo antes del lock financiero
- el lock se considera cruzado si la comision esta en `payable`, `scheduled_for_payout` o `paid`
- tambien se considera lock si existe `payoutId` no cancelado o job de payout pendiente/en ejecucion
- despues del lock la incidencia deja de ser correccion de pedido y pasa a ser ajuste financiero o reversa compensatoria

### RF-07. Comisiones derivadas desde pedidos

- la comision nace desde el pedido y una regla comercial aplicable
- `commissions` deriva, madura, bloquea y liquida consecuencias financieras
- `commissions` no corrige la atribucion primaria del pedido
- ante una correccion valida antes del lock, `commissions` recompone la consecuencia financiera

### RF-08. Payouts por vendedor y periodo

- los payouts viven por `vendorCode` y periodo
- solo comisiones pagables pueden entrar a una corrida de payout
- la liquidacion consolida bonos, deducciones y referencia de pago
- una liquidacion cerrada no reabre la atribucion primaria del pedido

### RF-09. Seller panel como verdad derivada

- el panel vendedor muestra pedidos atribuidos, comisiones y payouts ya derivados
- el panel no recalcula negocio ni corrige atribucion
- el vendedor no accede a trazas internas de screening o payout admin

### RF-10. Frontera de pagos

- `payments` revisa comprobantes, registra pagos manuales y dispara syncs derivados
- `payments` no corrige `vendorCode`
- `payments` no es dueno del payout del seller channel

### RF-11. Worker solo asincrono

- `worker` ejecuta corridas de payout, settlement y notificaciones asincronas
- `worker` no decide atribucion primaria
- `worker` no reemplaza la decision de lock financiero

## Escenarios Principales

### Escenario A. Postulacion y alta comercial

1. El postulante completa `/trabaja-con-nosotros`.
2. La API registra `vendor_application` en `submitted`.
3. `seller_manager` mueve la postulacion a `screening`.
4. Operacion aprueba o rechaza; si aprueba, resuelve `collaborationType`.
5. Se crea o vincula `vendor` con `preferredCode` o `vendorCode` generado.
6. Backoffice crea o vincula acceso comercial y habilita `/panel-vendedor`.

### Escenario B. Pedido atribuido y correccion antes del lock

1. El pedido nace con `vendorCode` efectivo o sin vendedor.
2. `orders` persiste el snapshot comercial.
3. Operacion detecta una regularizacion legitima.
4. `Pedidos > Operacion` corrige el `vendorCode` antes del lock financiero.
5. El pedido conserva auditoria before/after.
6. `commissions` recompone comision, payout y lectura derivada para el vendedor correcto.

### Escenario C. Comision, payout y lectura en seller panel

1. El pedido queda comercialmente confirmado.
2. `commissions` aplica la regla y crea la comision.
3. La comision madura hasta `payable`.
4. `seller_manager` prepara la corrida de payout.
5. `worker` genera y luego liquida la corrida de forma asincrona.
6. El vendedor ve el resultado en `/panel-vendedor`.

### Escenario D. Correccion tardia despues del lock

1. Operacion intenta cambiar el `vendorCode` de un pedido ya comprometido financieramente.
2. El sistema detecta lock financiero.
3. La UI y la API bloquean la correccion como edicion normal.
4. La incidencia queda derivada a un flujo financiero posterior, fuera de este slice.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | la postulacion publica nunca crea acceso comercial por si sola |
| CA-02 | la aprobacion de vendedor confirma `collaborationType` y define `preferredCode` o `vendorCode` |
| CA-03 | un pedido solo conserva un `vendorCode` efectivo |
| CA-04 | `Pedidos > Operacion` es la unica puerta de correccion post-pedido |
| CA-05 | la correccion antes del lock deja auditoria completa y recompone consecuencia financiera |
| CA-06 | la correccion se bloquea cuando la comision ya esta en `payable`, `scheduled_for_payout` o `paid` |
| CA-07 | `payments` no expone ni ejecuta correccion de atribucion |
| CA-08 | los payouts se consolidan por vendedor y periodo |
| CA-09 | el seller panel consume verdad derivada y no recalcula negocio |
| CA-10 | `worker` participa solo en procesos asincronos del slice |

## Casos Negativos Relevantes

- postulacion incompleta: la API rechaza el alta publica
- vendedor inexistente o suspendido: no puede atribuirse al pedido
- `preferredCode` duplicado: la aprobacion o alta manual falla
- `A -> none` con comision materializada: se bloquea
- intento de correccion despues del lock: se rechaza como operacion normal
- intento de corregir desde `payments` o `/panel-vendedor`: se bloquea por ownership

## Dependencias De Negocio

- el negocio mantiene el modelo seller-first actual
- seller managers y admins siguen siendo los roles habilitados para onboarding, reglas y liquidaciones
- el negocio no exige multi-vendor ni flujo post-payout dentro de este corte
- `/cuenta` y `/panel-vendedor` se mantienen como entrada y superficie operativa del vendedor
