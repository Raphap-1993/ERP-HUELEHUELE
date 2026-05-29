# UC-40 Instanciacion Y Ejecucion Del Journey Comercial

## Objetivo

Formalizar como `marketing` o el runtime comercial instancian un journey
cerrado sobre `customer_relationship_case`, respetando elegibilidad, snapshot
del template y unicidad de la instancia no terminal por `template + case`.

## Actores

- marketing
- ventas
- worker

## Precondiciones

- existe un `customer_relationship_case` comercialmente valido
- el template correspondiente esta `active`
- el caso cumple elegibilidad del template
- no existe otra instancia no terminal del mismo `template + case`

## Flujo principal

1. Ocurre un trigger canonico elegible o `marketing`/`ventas` lanza el
   journey manualmente de forma excepcional.
2. El sistema valida que el template aplica al contexto comercial del caso.
3. El sistema valida que no exista otra instancia no terminal del mismo
   `template + customer_relationship_case`.
4. Crea una `journey_instance` con snapshot del template.
5. La instancia hereda `journeyAssignee` desde el `assignee` del caso, salvo
   ajuste operativo posterior.
6. El journey ejecuta sus pasos inmediatos `inline`.
7. Si encuentra un `wait`, deja programada su continuacion en
   `worker/BullMQ`.

## Reglas canonicas

- el journey vive sobre `customer_relationship_case`
- la oportunidad activa es solo contexto ligado cuando aplique
- una sola instancia no terminal por `template + case`
- el mismo caso puede tener journeys activos de templates distintos
- una instancia `paused` sigue ocupando la unicidad del mismo
  `template + case`
- editar el template despues no reescribe una instancia ya creada

## Resultado esperado

El caso comercial del cliente queda extendido con una instancia concreta,
auditada y operable del journey, sin abrir duplicados ni romper el ownership
comercial del workbench.
