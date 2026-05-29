# Product Design - CRM Transversal Por Cliente

Fecha: 2026-05-28.

## Promesa de superficie

`Ventas` necesita una lectura corta y seria de la relacion comercial con el
cliente: quien la lidera, que sigue, cuando toca retomarla y que contexto
relevante traen sus pedidos o seguimientos previos, sin salir del detalle de
`/crm`.

## Componentes principales

- resumen comercial corto dentro del detalle del cliente
- timeline transversal del cliente
- `commercialOwner`
- `assignee`
- `classification`
- `origin`
- `nextStep`
- `followUpAt`
- tareas opcionales
- bandeja secundaria filtrada de clientes con seguimiento activo

## Decisiones

- la vista extiende `/crm` y no abre un CRM separado
- el caso transversal se apoya sobre el cliente canonico de `007`
- las referencias a `orders` y `009` son contexto read-only, no timeline
  duplicado
- `classification`, `origin`, `nextStep` y `followUpAt` funcionan como
  guardrails de disciplina minima, no como decoracion
- la bandeja secundaria vive dentro del modulo `/crm`, no en dashboard ni
  en una app aparte

## Tension principal

La superficie debe verse como una extension natural del detalle de cliente:
suficiente para gestionar relacion comercial activa real, pero sin prometer
pipeline amplio, campaigns, scoring automatico ni mensajeria comercial.

## Resultado esperado

El slice puede pasar a arquitectura y SDD con una lectura comun entre
cliente canonico, caso transversal, owner comercial, proximo paso,
referencias read-only y merge operativo.
