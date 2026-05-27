# UC-16 Creacion Y Programacion De Campanas

## Objetivo

Formalizar la creacion de campanas en `marketing`, incluyendo su programacion
basica por `scheduledAt` y el congelamiento del snapshot operativo al momento
de nacer.

## Actores

- marketing
- campaigns

## Precondiciones

- `marketing` tiene acceso al workbench de campanas
- existen `segmentId` y `templateId` seleccionables
- el canal elegido es compatible con la plantilla seleccionada
- `name` y `goal` de campana vienen informados

## Flujo principal

1. `marketing` define nombre, objetivo, segmento, plantilla y canal.
2. Opcionalmente informa `scheduledAt`.
3. `campaigns` valida existencia de segmento y plantilla.
4. `campaigns` valida que `template.channel` coincida con el canal elegido.
5. Si no hay `scheduledAt`, la campana nace `running/running`.
6. Si hay `scheduledAt`, la campana nace `scheduled/queued`.
7. El sistema congela `segmentName`, `templateName`, `bodyPreview` y
   `recipients`.
8. `marketing` registra auditoria y evento operativo de creacion.

## Reglas canonicas

- `campaigns` es el agregado principal del slice
- `scheduledAt` es la unica programacion canonica de este corte
- el snapshot de negocio queda congelado al crear la campana
- la creacion de campana no despacha directamente el mensaje

## Resultado esperado

La campana queda creada con su estado inicial correcto, con snapshot operativo
congelado y lista para ser orquestada sin mezclar el flujo con la entrega
tecnica del mensaje.
