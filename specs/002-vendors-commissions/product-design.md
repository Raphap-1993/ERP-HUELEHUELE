# Product Design - Vendors Commissions

Fecha: 2026-05-26.

## Experiencia objetivo

- seller-first
- operacion clara
- trazabilidad antes que automatizacion vistosa
- continuidad entre postulacion, venta atribuida, comision y payout

## Decisiones

- el panel vendedor es operativo, no decorativo
- `Pedidos > Operacion` es la unica puerta de correccion post-pedido
- `/admin/comisiones` refleja consecuencia financiera, no corrige la atribucion primaria
- `/trabaja-con-nosotros` captura interes comercial; no promete onboarding automatico

## Tension principal

La UX debe dejar claro que el seller channel existe de punta a punta, pero sin
ocultar que la regularizacion post-pedido tiene limites y no es una edicion
libre cuando la comision ya cruzo lock financiero.

## Resultado esperado

El slice puede evolucionar en specs y arquitectura sin perder una lectura UX
comun entre publico, admin y vendedor.
