# UC-20 Resolucion De Conflictos De Identidad

## Objetivo

Formalizar la resolucion operativa de conflictos de identidad abiertos a
partir de pedidos o regularizaciones del runtime.

## Actores

- ventas
- customers
- orders

## Precondiciones

- existe un conflicto de identidad abierto
- el sistema ya calculo clientes candidatos
- `ventas` o un rol habilitado puede resolver el conflicto

## Flujo principal

1. El sistema detecta conflicto por identidad desde pedidos.
2. `ventas` revisa senales y candidatos.
3. Resuelve con `assign_existing`, `merge` o `ignore`.
4. La resolucion actualiza el perfil vivo o la referencia operativa
   necesaria sin reescribir arbitrariamente snapshots historicos.
5. El conflicto queda trazado con estado y notas.

## Reglas canonicas

- los conflictos usan `open`, `resolved`, `ignored` y `merged`
- la resolucion deja actor, notas y efecto operativo trazable
- ignorar un conflicto no borra historia ni lo confunde con resolucion por
  asignacion o fusion

## Resultado esperado

Los conflictos de identidad se resuelven de forma operativa, trazable y
coherente con la frontera entre `customers` y `orders`.
