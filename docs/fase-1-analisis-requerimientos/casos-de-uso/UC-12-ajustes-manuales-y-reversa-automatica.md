# UC-12 Ajustes Manuales Y Reversa Automatica

## Objetivo

Formalizar las correcciones operativas del programa de puntos y la reversa
automatica cuando un pedido deja de sostener el earn asociado.

## Actores

- marketing
- admin
- orders
- loyalty

## Precondiciones

- existe una cuenta loyalty asociada al cliente
- el sistema puede identificar el movimiento o pedido relacionado
- la operacion tiene actor autorizado para ajustes manuales

## Flujo principal

1. Marketing o admin registra un ajuste manual auditable cuando aplica.
2. Si el pedido asociado se rechaza, cancela o revierte, `orders` dispara la
   reversa automatica.
3. Loyalty revierte el saldo correspondiente.
4. La cuenta conserva trazabilidad completa del cambio.

## Reglas canonicas

- el ajuste manual es excepcional y debe quedar auditado
- la reversa por invalidez del pedido es automatica
- la reversa no depende de una accion manual previa
- la cuenta debe quedar consistente despues de la reversa

## Resultado esperado

El programa de puntos conserva integridad operativa tanto frente a correcciones
humanas como frente a invalidez transaccional del pedido.
