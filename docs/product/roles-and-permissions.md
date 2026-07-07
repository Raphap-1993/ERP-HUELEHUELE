# Roles y Permisos

## Objetivo

Definir el modelo mínimo de acceso para Huelegood a nivel funcional.

## Roles mínimos

- `super_admin`
- `admin`
- `operador_pagos`
- `ventas`
- `marketing`
- `seller_manager`
- `vendedor`
- `cliente`

## Principios

- Todo acceso interno debe pasar por permisos explícitos.
- `super_admin` no debe usarse para operación cotidiana.
- El rol `vendedor` pertenece al canal comercial, no al staff interno.
- `cliente` solo actúa sobre sus propios recursos.

## Matriz funcional

| Capacidad | super_admin | admin | operador_pagos | ventas | marketing | seller_manager | vendedor | cliente |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gestionar usuarios internos y roles | Sí | Limitado | No | No | No | No | No | No |
| Configurar CMS | Sí | Sí | No | No | Sí | No | No | No |
| Gestionar catálogo | Sí | Sí | No | Sí | No | No | No | No |
| Gestionar promociones y cupones | Sí | Sí | No | Sí | Sí | No | No | No |
| Ver pedidos | Sí | Sí | Sí | Sí | Limitado | Limitado | Solo propios atribuidos | Solo propios |
| Resolver pagos manuales | Sí | Sí | Sí | No | No | No | No | No |
| Gestionar vendedores | Sí | Sí | No | Limitado | No | Sí | No | No |
| Configurar reglas de comisión | Sí | Sí | No | Limitado | No | Sí | No | No |
| Ejecutar liquidaciones | Sí | Sí | No | No | No | Sí | No | No |
| Gestionar leads mayoristas | Sí | Sí | No | Sí | Limitado | No | No | No |
| Gestionar campañas y segmentos | Sí | Sí | No | Limitado | Sí | No | No | No |
| Ver auditoría | Sí | Sí | Limitado | No | No | No | No | No |
| Consultar panel de vendedor | Sí | Sí | No | No | No | Sí | Sí | No |
| Gestionar cuenta y pedidos propios | No | No | No | No | No | No | No | Sí |
| Gestionar direcciones propias | No | No | No | No | No | No | No | Sí |
| Ver puntos y canjes propios | No | No | No | No | No | No | No | Sí |

## Detalle por rol

### super_admin

- control total del sistema
- administración de roles, permisos, settings críticos y auditoría
- uso restringido para configuración, emergencias y soporte avanzado

### admin

- operación transversal del negocio
- acceso a pedidos, catálogo, CMS, vendedores, comisiones y campañas según permiso asignado

### operador_pagos

- foco exclusivo en pagos
- revisión de comprobantes
- consulta de pedidos para contexto
- no modifica catálogo ni campañas

### ventas

- opera catálogo comercial, promociones, leads mayoristas y seguimiento de pedidos
- no resuelve pagos ni administra permisos

### marketing

- opera CMS, promociones, segmentos, campañas y contenidos
- acceso limitado a pedidos solo para contexto comercial

### seller_manager

- revisa postulaciones de vendedores
- aprueba perfiles, códigos, cuentas bancarias
- configura reglas de comisión y liquidaciones

### vendedor

- consulta su perfil comercial
- ve su código o códigos asignados
- revisa pedidos atribuidos, comisiones y payout histórico
- no accede a datos de otros vendedores ni a operación interna

### cliente

- administra su cuenta, direcciones, pedidos y puntos
- consume contenido, compra, aplica promociones y usa canjes

## Permisos recomendados por dominio

Ejemplos de permisos atómicos:

- `cms.read`, `cms.write`, `cms.publish`
- `catalog.read`, `catalog.write`
- `promotions.read`, `promotions.write`
- `orders.read`, `orders.manage`
- `payments.read`, `payments.review`
- `vendors.read`, `vendors.manage`
- `commissions.read`, `commissions.manage`, `commissions.payout`
- `wholesale.read`, `wholesale.manage`
- `marketing.read`, `marketing.write`, `marketing.execute`
- `audit.read`

## Regla operativa recomendada

Los roles deben mapearse a permisos y no incrustar lógica condicional rígida en frontend. La API es la autoridad final de autorización.
