# UC-17 Seleccion De Segmentos Y Plantillas Read-Only

## Objetivo

Formalizar la seleccion operativa de segmentos y plantillas desde `marketing`
sin abrir authoring completo de catalogos dentro de este slice.

## Actores

- marketing
- segments
- templates

## Precondiciones

- `marketing` puede consultar catalogos de segmentos y plantillas
- existe un canal de campana definido o en definicion
- los catalogos reflejan el estado brownfield vigente del modulo

## Flujo principal

1. `marketing` consulta segmentos disponibles.
2. `marketing` consulta plantillas disponibles.
3. El sistema exige `segmentId` existente.
4. El sistema exige `templateId` existente.
5. El sistema exige que `template.channel` coincida con `campaign.channel`.
6. `marketing` selecciona la audiencia y la plantilla a reutilizar en la
   campana.
7. El slice conserva ambos catalogos como dependencias read-only `as-is`.

## Reglas canonicas

- `segments` y `templates` no abren authoring completo en este corte
- el runtime actual solo valida existencia de `segmentId`, existencia de
  `templateId` y compatibilidad entre `template.channel` y `campaign.channel`
- el runtime actual no promueve estados de catalogo a bloqueo funcional fuerte
- la campana congela nombre de segmento y nombre de plantilla al momento de
  crearla

## Resultado esperado

`marketing` puede elegir referencias existentes de segmento y plantilla con
compatibilidad de canal para la campana, sin convertir este slice en un dominio
de edicion completa de catalogos.
