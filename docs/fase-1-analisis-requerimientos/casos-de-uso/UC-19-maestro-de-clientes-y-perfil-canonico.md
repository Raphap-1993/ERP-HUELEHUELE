# UC-19 Maestro De Clientes Y Perfil Canonico

## Objetivo

Formalizar `/crm` como la superficie canonica para operar el perfil vivo del
cliente dentro del backoffice.

## Actores

- ventas
- marketing
- admin
- customers

## Precondiciones

- existe acceso habilitado al modulo `/crm`
- el runtime puede persistir clientes, usuarios y direcciones
- `orders` ya conserva pedidos historicos para lectura contextual

## Flujo principal

1. `ventas` abre `/crm`.
2. Crea o edita un cliente.
3. El sistema persiste perfil, estado y direcciones.
4. El detalle muestra pedidos recientes como contexto.
5. El perfil canonico queda en `customers`, no en `orders`.

## Reglas canonicas

- el perfil vivo del cliente se corrige en `customers`
- pedidos recientes solo aportan contexto operativo
- crear o editar un cliente no debe reescribir snapshots historicos de
  `orders`

## Resultado esperado

El modulo `/crm` opera el cliente canonico con informacion suficiente para
backoffice, sin absorber el dominio transaccional del pedido.
