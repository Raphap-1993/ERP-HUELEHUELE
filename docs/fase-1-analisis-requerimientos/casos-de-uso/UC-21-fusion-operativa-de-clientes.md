# UC-21 Fusion Operativa De Clientes

## Objetivo

Formalizar la fusion manual de clientes cuando existe una identidad canonica
clara y el runtime permite consolidarla sin perder trazabilidad.

## Actores

- ventas
- customers

## Precondiciones

- existe un cliente fuente y un cliente destino activos
- ambos clientes no tienen documentos canonicos distintos
- el runtime puede regularizar referencias operativas hacia el destino

## Flujo principal

1. `ventas` selecciona cliente fuente y cliente destino.
2. El sistema valida que no tengan documentos canonicos distintos.
3. El destino permanece activo.
4. La fuente queda marcada como fusionada.
5. No se borra historia ni se reescriben snapshots historicos arbitrariamente.

## Reglas canonicas

- un merge siempre deja un destino canonico activo
- el cliente fuente no desaparece como si nunca hubiera existido
- la regularizacion operativa de referencias no equivale a reescritura
  arbitraria de la historia

## Resultado esperado

La fusion manual consolida identidad sin perder historia operativa ni romper
la frontera entre perfil vivo y pasado transaccional.
