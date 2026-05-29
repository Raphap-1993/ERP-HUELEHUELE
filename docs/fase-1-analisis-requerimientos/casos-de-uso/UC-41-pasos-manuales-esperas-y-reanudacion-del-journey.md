# UC-41 Pasos Manuales Esperas Y Reanudacion Del Journey

## Objetivo

Formalizar como una `journey_instance` maneja waits, condiciones simples y
pasos `manual_review`, preservando bloqueo humano, reanudacion automatica y
continuidad del flujo dentro de `/crm`.

## Actores

- ventas
- marketing
- worker

## Precondiciones

- existe una `journey_instance` en estado `active`
- la instancia alcanzo un `wait`, una `condition` o un `manual_review`
- `/crm` sigue siendo la superficie de resolucion humana

## Flujo principal

1. La instancia ejecuta pasos inmediatos hasta alcanzar un `wait`, una
   condicion o un `manual_review`.
2. Si alcanza un `manual_review`, el journey crea el paso humano pendiente y
   bloquea su continuacion.
3. `ventas` revisa y resuelve el paso dentro de `/crm` como owner operativo
   principal.
4. `marketing` puede resolverlo de forma secundaria cuando el template o el
   flujo lo requieran.
5. Al resolverse el paso manual, la instancia reanuda automaticamente si no
   queda otra condicion pendiente.
6. Si el paso era un `wait`, la reanudacion la ejecuta `worker/BullMQ`.
7. La instancia sigue por un solo camino activo cuando una `condition`
   decide una rama.

## Reglas canonicas

- `manual_review` bloquea la continuacion
- `ventas` es el resolvedor operativo principal del paso manual
- `marketing` puede resolver de forma secundaria cuando aplique
- el journey no necesita consola aparte para resolverse
- la condicion no abre paralelismo interno dentro de la misma instancia
- waits y timers viven en `worker/BullMQ`
- toda resolucion manual deja traza

## Resultado esperado

El journey puede alternar trabajo automatico, espera temporal y accion
humana sin perder continuidad, trazabilidad ni control operativo dentro del
mismo `/crm`.
