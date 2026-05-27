# Spec Funcional - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Objetivo

Definir el slice loyalty vigente como paquete SDD canonico, formalizando la
cuenta de puntos, el ledger, la acumulacion por pedido elegible, el canje con
reserva inmediata, los ajustes manuales y la reversa automatica sin redisenar
el runtime brownfield.

## Alcance

Incluye:

- `loyalty_account` por cuenta cliente autenticada
- `loyalty_movement` como ledger de earn, redeem, adjustment y bonus
- una sola `loyalty_rule` activa para acumulacion
- acumulacion sobre pedidos elegibles
- transicion `pending -> available`
- `redemption` con reserva inmediata
- resolucion operativa de canjes en `/admin/loyalty`
- ajustes manuales auditables
- reversa automatica por invalidez del pedido
- visibilidad de saldo, movimientos y estado de canjes en `/cuenta`

No incluye:

- multiples reglas activas simultaneas
- catalogo formal de recompensas
- autoservicio de canjes desde `/cuenta`
- descuento automatico inline en checkout
- expiracion fuerte como comportamiento canonico de este slice
- puntos sobre compras invitadas como caso principal

## Actores

- cliente autenticado
- marketing
- admin
- super_admin
- orders
- API Huelegood
- auth
- notifications

## Reglas Funcionales Canonicas

### RF-01. Cuenta loyalty autenticada

- los puntos pertenecen a una cuenta cliente autenticada
- la compra invitada no es el caso canonico del programa
- cualquier regularizacion de identidad queda como excepcion operativa

### RF-02. Regla de acumulacion unica

- existe una sola `loyalty_rule` activa de acumulacion a la vez
- la acumulacion depende de esa regla y de la elegibilidad del pedido
- el slice no modela stacking de reglas ni prioridad multiple

### RF-03. Earn sobre pedido elegible

- `orders` define el hito elegible del pedido
- loyalty registra earn ligado al pedido
- el movimiento puede nacer `pending` o `available`
- earn no debe asignar saldo final antes del hito correcto del dominio

### RF-04. Settlement de puntos

- un movimiento `pending` puede pasar a `available`
- el settlement actualiza saldo pendiente, disponible y movimiento reciente
- el settlement no reabre ni recalcula la regla activa

### RF-05. Canje como solicitud operativa

- el canje no se ejecuta inline en checkout
- el canje nace como `redemption`
- el `reward` del canje es libre/manual en el estado actual del runtime

### RF-06. Reserva inmediata del canje

- al crear un canje `pending`, los puntos se reservan de inmediato
- la reserva baja saldo `available`
- la reserva impide doble gasto sobre el mismo saldo

### RF-07. Resolucion del canje

- `marketing` es dueno operativo principal del canje
- `applied` consume definitivamente la reserva
- `cancelled` devuelve los puntos reservados a `available`
- toda resolucion deja trazabilidad de actor y decision

### RF-08. Ajustes manuales auditables

- `marketing`, `admin` o `super_admin` pueden registrar ajustes manuales
- el ajuste manual debe guardar motivo, actor y estado resultante
- el ajuste manual no reemplaza earn ni reversal ligados a pedidos

### RF-09. Reversa automatica

- si el pedido asociado se rechaza, cancela o revierte, loyalty debe revertir
  los puntos correspondientes
- la reversa es automatica
- la cuenta debe conservar consistencia despues de la reversa

### RF-10. `/cuenta` como visibilidad, no autoservicio

- `/cuenta` muestra saldos, movimientos y estado de canjes
- el cliente no inicia canjes desde esa superficie
- `/cuenta` no debe sugerir descuento directo ni catalogo de recompensas

## Escenarios Principales

### Escenario A. Earn y settlement por pedido

1. El pedido cruza el hito elegible del dominio.
2. `orders` dispara el earn del loyalty asociado.
3. Loyalty registra `loyalty_movement`.
4. Si corresponde, el movimiento nace `pending`.
5. El movimiento se libera luego a `available`.
6. La cuenta refleja los saldos correctos.

### Escenario B. Canje pendiente con reserva

1. Operacion crea `redemption` para un cliente con saldo suficiente.
2. Loyalty reserva puntos de inmediato.
3. El canje queda `pending`.
4. El saldo retenido ya no puede gastarse otra vez.

### Escenario C. Resolucion operativa del canje

1. `marketing` o `admin` revisan el canje pendiente.
2. Si la decision es `applied`, la reserva se consume definitivamente.
3. Si la decision es `cancelled`, la reserva vuelve a `available`.
4. La cuenta conserva trazabilidad del cambio.

### Escenario D. Reversa por invalidez del pedido

1. El pedido asociado deja de sostener el earn.
2. `orders` dispara reversa.
3. Loyalty revierte el movimiento correspondiente.
4. La cuenta conserva integridad del saldo.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | los puntos pertenecen a una cuenta cliente autenticada |
| CA-02 | existe una sola `loyalty_rule` activa de acumulacion |
| CA-03 | earn depende del hito elegible del pedido |
| CA-04 | un canje `pending` reserva puntos de inmediato |
| CA-05 | `applied` consume definitivamente la reserva |
| CA-06 | `cancelled` devuelve la reserva a `available` |
| CA-07 | los ajustes manuales son auditables |
| CA-08 | la reversa de puntos por invalidez del pedido es automatica |
| CA-09 | `/cuenta` solo muestra visibilidad del programa |
| CA-10 | el slice no entrega catalogo formal de recompensas ni canje autoservicio |

## Casos Negativos Relevantes

- pedido no elegible: no se liberan puntos
- earn repetido sobre el mismo pedido: debe quedar protegido por idempotencia
- saldo insuficiente: el canje se rechaza
- resolucion de canje inexistente: se bloquea
- reversa sobre movimiento ya revertido: no debe duplicar efecto
- intento de autoservicio de canje desde `/cuenta`: fuera de alcance

## Dependencias De Negocio

- el negocio mantiene un programa de puntos simple y auditable
- `marketing` conserva ownership operativo principal
- el order flow sigue siendo la fuente del hito elegible
- `/cuenta` se mantiene como superficie de visibilidad para el cliente
