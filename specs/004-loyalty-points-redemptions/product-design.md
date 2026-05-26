# Product Design - Loyalty Points Redemptions

Fecha: 2026-05-26.

## Experiencia objetivo

- programa de puntos claro y auditable
- visibilidad simple para cliente
- control operativo real para marketing

## Decisiones

- `marketing` es dueno operativo principal
- `/cuenta` muestra estado del programa, no autoservicio
- el canje se resuelve en admin
- el reward del canje es libre/manual en este estado del runtime

## Tension principal

La experiencia debe dejar claro que existen saldo, retenciones y decisiones
operativas reales, pero sin prometer autoservicio, descuentos inline ni un
motor promocional mas complejo del que el runtime soporta hoy.

## Resultado esperado

El slice puede evolucionar a specs y arquitectura sin perder una lectura comun
entre cuenta cliente, operacion de marketing y dominio transaccional.
