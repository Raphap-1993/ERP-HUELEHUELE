# UC-18 Frontera De Dispatch Marketing Notifications Worker

## Objetivo

Formalizar la frontera entre la orquestacion comercial de `marketing` y la
entrega tecnica real que pertenece a `notifications` y `worker`.

## Actores

- marketing
- notifications
- worker

## Precondiciones

- existe una campana registrada o una intencion valida de entrega asociada
- `notifications` puede registrar cola y estado tecnico de dispatch
- `worker` puede consumir la cola soportada por el runtime vigente

## Flujo principal

1. `marketing` registra la campana y sus eventos operativos.
2. La intencion de entrega cruza la frontera funcional hacia `notifications`.
3. `notifications` encola la notificacion y persiste su estado tecnico.
4. `worker` procesa el dispatch real por el canal soportado.
5. `notifications` actualiza resultado tecnico de envio o falla.
6. `marketing` consulta el estado operativo sin ejecutar entrega directa por
   su cuenta.

## Reglas canonicas

- `marketing` orquesta la campana, pero no despacha el mensaje
- `notifications` es duenio de la cola, logs y estado tecnico de entrega
- `worker` es duenio del procesamiento asincrono y del envio real por proveedor
- el resultado tecnico de `sent`, `failed` o `skipped` vive fuera del agregado
  `campaigns`

## Resultado esperado

La frontera entre campana comercial y entrega tecnica queda explicita,
trazable y coherente con el runtime real del monorepo.
