# Spec Tecnica - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Objetivo Tecnico

Formalizar y endurecer las fronteras tecnicas del funnel mayorista vigente sin
forzar un portal B2B nuevo. El slice debe preservar la separacion entre
`wholesale`, `ventas`, `commercial-access`, `auth` y `/cuenta`, dejando
explícito que `accepted`, `won` y `order` son hitos distintos.

## Baseline Real Del Repo

### Captura publica y storefront

- `apps/web/components/wholesale-workspace.tsx`
  - publica la captura mayorista y usa `?interestType=distributor`
  - envia el lead desde storefront y no crea acceso autenticado
- `apps/web/lib/api.ts`
  - consume `POST /store/wholesale-leads`
  - consulta `GET /store/wholesale-tiers`

### Dominio `wholesale`

- `apps/api/src/modules/wholesale/wholesale.controller.ts`
  - expone `store/wholesale-leads`, `store/wholesale-tiers`,
    `admin/wholesale-leads`, `admin/wholesale-quotes` y `admin/wholesale-tiers`
- `apps/api/src/modules/wholesale/wholesale.service.ts`
  - normaliza `interestType`
  - maneja leads, estados y cotizaciones dentro del mismo modulo
  - ya contiene caminos para `wholesale` y `distributor` como variantes del
    mismo dominio

### Acceso comercial

- `apps/api/src/modules/auth/auth.service.ts`
  - gestiona `createCommercialAccess()`, `updateCommercialAccess()`,
    `setCommercialAccessStatus()` y `resetCommercialAccessPassword()`
  - soporta `accountType = wholesale`
  - vincula `wholesaleLeadId` al acceso mayorista
- `apps/admin/components/commercial-accesses-workspace.tsx`
  - opera accesos `seller` y `wholesale` desde una misma superficie
- `apps/admin/app/accesos/page.tsx`
  - publica el CRUD operativo de accesos comerciales

### Cuenta autenticada

- `apps/web/components/account-workspace.tsx`
  - usa `/cuenta` como entrada unica autenticada
  - detecta `RoleCode.Mayorista` o `accountType = wholesale`
  - distingue mayorista de vendedor y no deriva al panel seller-first

### Contratos compartidos

- `packages/shared/src/types/api.ts`
  - expone `interestType?: "wholesale" | "distributor"`
  - soporta `accountType = "wholesale"`
  - define `CommercialAccessAccountType`

### Pruebas existentes

- `apps/api/test/commercial-accesses.test.ts`
  - ya cubre creacion y login de acceso `wholesale`
- el repo aun no expresa de forma suficiente el contrato entre lead `won`,
  acceso comercial y resumen mayorista en `/cuenta`

## Frontera Tecnica Objetivo

### 1. `wholesale` sigue siendo el master del funnel comercial

- dueno de `wholesale_lead`, `wholesale_quote`, `wholesale_quote_items`,
  `interestType` y estados del funnel
- resuelve captura, calificacion, seguimiento y cierre
- no crea por si solo credenciales ni acceso autenticado

### 2. `ventas` sigue siendo el actor operativo principal

- opera la calificacion del lead, la deduplicacion y la cotizacion
- decide el cierre real `won/lost`
- no gestiona identidad tecnica ni sesion

### 3. `commercial-access` sigue siendo la puerta del entitlement

- crea o vincula el acceso mayorista solo despues de `won`
- conserva `wholesaleLeadId`, cuenta, estado y trazabilidad de acceso
- suspende o reactiva sin borrar la historia comercial

### 4. `auth` sigue siendo la frontera de identidad y sesion

- autentica la cuenta reutilizada o creada
- no decide el cierre comercial del lead
- no convierte `accepted` en acceso

### 5. `/cuenta` permanece como resumen, no como portal B2B

- presenta estado comercial y acceso mayorista basico
- no permite autogestion de cotizaciones, pedidos ni condiciones
- no sustituye el workbench interno de ventas

## Ajustes Minimos Recomendados

Este slice no requiere un modulo nuevo. Solo pide cerrar contratos vivos del
brownfield.

### Shared contracts

Rutas candidatas:

- `packages/shared/src/types/api.ts`
- `packages/shared/src/domain/models.ts`

Ajustes recomendados:

- reflejar en el resumen comercial si el entitlement esta `active`,
  `inactive` o `suspended`
- exponer con claridad `interestType`, `responsable comercial` y ultimo estado
  relevante del lead o cotizacion
- mantener `wholesale` y `distributor` como vocabulario de un mismo funnel

### API y admin comercial

Rutas candidatas:

- `apps/api/src/modules/wholesale/wholesale.controller.ts`
- `apps/api/src/modules/wholesale/wholesale.service.ts`
- `apps/admin/lib/api.ts`
- `apps/admin/components/commercial-accesses-workspace.tsx`

Ajustes recomendados:

- mantener `POST /store/wholesale-leads` como entrada publica unica
- endurecer que solo leads `won` puedan crear o vincular acceso comercial
- conservar `POST /admin/commercial-accesses` como ruta transversal y
  `POST /admin/wholesale-leads/:id/access` como atajo futuro opcional

### Cuenta autenticada

Rutas candidatas:

- `apps/web/components/account-workspace.tsx`
- futuro `GET /store/me/commercial-access`

Ajustes recomendados:

- exponer un resumen mayorista basico y no un panel operativo
- impedir que la cuenta sugiera aceptacion de cotizaciones o pedidos B2B
- mantener la separacion frente a `/panel-vendedor`

## Reglas Tecnicas Del Slice

1. `wholesale` es el dueno del lead y la cotizacion.
2. `wholesale` y `distributor` comparten modulo; cambia solo `interestType`.
3. la captura publica no crea cuenta ni credenciales.
4. `accepted` no crea pedido ni acceso.
5. solo `won` habilita el derecho a crear o vincular acceso mayorista.
6. el acceso mayorista se monta sobre cuenta existente o reutilizada por
   email cuando corresponda.
7. `commercial-access` conserva la trazabilidad del entitlement y su estado.
8. `/cuenta` consume un resumen comercial basico; no recalcula ni opera el
   funnel.
9. el slice no entrega `vendorCode` ni comisiones.
10. la suspension del acceso no borra la historia del lead ni la cuenta.

## Seguridad Y Observabilidad

Eventos y auditorias ya visibles o recomendables para este slice:

- `wholesale.lead.created`
- `wholesale.lead.qualified`
- `wholesale.quote.created`
- `wholesale.quote.sent`
- `wholesale.quote.accepted`
- `wholesale.lead.won`
- `wholesale.lead.lost`
- `commercial_access.created`
- `commercial_access.linked`
- `commercial_access.suspended`
- `commercial_access.reactivated`

Guardas adicionales recomendadas:

- auditar actor y razon cuando se crea o reactiva un acceso mayorista
- auditar intento bloqueado de acceso comercial sobre lead no `won`
- impedir `accountType=wholesale` desde registro publico
- registrar cuando un email existente es reutilizado para acceso mayorista

## Estrategia De Implementacion

### Release 1. Contrato de funnel y entitlement

- alinear tipos compartidos entre lead, quote y acceso comercial
- cerrar la regla de `won` como unica puerta de acceso
- consolidar el resumen mayorista basico en `/cuenta`

### Release 2. Guardrails de acceso

- reforzar `POST /admin/commercial-accesses` para mayoristas
- bloquear cualquier auto-registro comercial desde storefront
- dejar preparada la traza para atajos desde el lead aprobado

### Release 3. QA de fronteras

- verificar que `accepted` siga sin crear pedido ni acceso
- verificar que `/cuenta` no derive al usuario a un portal operativo
- verificar que el email existente se reutilice sin duplicar identidad

## Estrategia De Pruebas

### API

Rutas candidatas:

- `apps/api/test/commercial-accesses.test.ts`

Cobertura esperada:

- captura de lead `wholesale` y `distributor`
- transicion `accepted` sin acceso creado
- creacion o vinculacion de acceso solo sobre lead `won`
- bloqueo de acceso comercial para lead no `won`
- reuse de email para cuenta preexistente
- suspension y reactivacion de acceso sin perder trazabilidad

### Web y cuenta

- validar que `/mayoristas` y la variante distribuidor sigan usando el mismo
  funnel
- validar que `/cuenta` solo muestre resumen comercial basico
- validar que un mayorista no derive a `/panel-vendedor`

## Riesgos Tecnicos Abiertos

- el resumen mayorista en `/cuenta` aun depende de consolidar el endpoint
  `GET /store/me/commercial-access`
- el admin de accesos comerciales hoy menciona "panel B2B" como direccion
  futura y conviene evitar que esa expectativa contamine el canon actual
- falta cubrir con mas fuerza la diferencia entre quote `accepted`, lead `won`
  y acceso `active`
- el atajo `POST /admin/wholesale-leads/:id/access` sigue como contrato
  objetivo y no como superficie cerrada del runtime
