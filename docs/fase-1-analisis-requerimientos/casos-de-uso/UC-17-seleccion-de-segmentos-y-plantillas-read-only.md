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
- el runtime actual valida IDs y compatibilidad de canal como hard gates
  minimos
- el runtime actual no promueve estados de catalogo a bloqueo funcional fuerte
- la campana congela nombre de segmento y nombre de plantilla al momento de
  crearla

## Resultado esperado

`marketing` puede elegir un segmento y una plantilla validos para la campana
sin convertir este slice en un dominio de edicion completa de catalogos.
