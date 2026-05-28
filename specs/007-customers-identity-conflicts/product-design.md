# Product Design - Customers Identity Conflicts

Fecha: 2026-05-28.

## Experiencia objetivo

- workbench de clientes claro y operativo en `/crm` sobre el dominio admin
- higiene de identidad y deduplicacion con contexto suficiente
- lectura de pedidos recientes como soporte, no como cambio de ownership

## Decisiones

- `customers` es el agregado principal y concentra la lectura operativa del
  perfil canonico
- la tabla de clientes prioriza identidad, contacto, estado, pedidos y
  direccion antes que cualquier senal comercial avanzada
- los conflictos de identidad viven en una tabla separada para no mezclar
  perfiles sanos con casos que requieren decision operativa
- el detalle del cliente profundiza en perfil, direcciones y pedidos
  recientes, pero no expone `crmStage`
- el formulario de cliente mantiene create/edit en una sola superficie y deja
  fuera notas, lifecycle comercial o campaign hooks
- merge y resolucion se tratan como acciones operativas auditables, no como
  limpieza destructiva del historial

## Tension principal

La experiencia debe dejar claro que `/crm` sirve para corregir la identidad
viva del cliente y operar su perfil canonico, pero sin vender la promesa de
un CRM comercial amplio. El runtime vigente resuelve bien create/edit,
conflictos, merge y detalle, pero el seguimiento comercial y `crmStage`
permanecen fuera de esta superficie y la documentacion UX debe respetar esa
frontera.

## Resultado esperado

El slice puede evolucionar a arquitectura y SDD con una lectura comun entre
perfil canonico, conflictos de identidad, merge operativo y frontera con
`orders`.
