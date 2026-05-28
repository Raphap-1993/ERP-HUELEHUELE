# UC-27 Cierre Y Reapertura Del Caso Manual

## Objetivo

Formalizar el cierre manual o automatico del `order_follow_up_case`, asi
como su reapertura controlada cuando el pedido siga siendo elegible.

## Actores

- ventas
- orders

## Precondiciones

- el caso manual del pedido ya existe
- el pedido sigue dentro del dominio `orders`
- el lifecycle del pedido puede afectar el estado del caso

## Flujo principal

1. El caso puede pasar a `resolved` o `cancelled`.
2. Todo cambio de estado deja una entrada `status_change`.
3. Si el pedido llega a `Delivered` o `Completed`, el caso se resuelve
   automaticamente.
4. Si el pedido cae o falla comercialmente, el caso se cancela
   automaticamente.
5. Si el pedido sigue elegible, `ventas` puede reabrirlo exigiendo otra vez
   `nextStep` y `followUpAt`.

## Reglas canonicas

- el cierre manual sigue siendo responsabilidad de `ventas`
- el cierre automatico depende del lifecycle del pedido dentro de `orders`
- la reapertura solo procede si el pedido sigue siendo elegible
- la reapertura vuelve a exigir `nextStep` y `followUpAt`
- toda transicion deja un `status_change` en el timeline

## Resultado esperado

El caso manual queda alineado al lifecycle real del pedido y mantiene
trazabilidad completa de cierres, cancelaciones y reaperturas.
