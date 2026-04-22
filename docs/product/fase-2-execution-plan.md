# Plan Operativo de Fase 2

## Objetivo

Traducir la Fase 2 actual de Huelegood a un frente ejecutable, secuenciado y transferible a `Linear` sin perder alineación con el roadmap homologado.

## Estado actualizado

Al `30 de marzo de 2026`, el aterrizaje quirúrgico de requerimientos quedó documentado en [requirements-impact-plan-2026-03.md](./requirements-impact-plan-2026-03.md). Ese documento es la fuente vigente para operaciones manuales, sellers/affiliates, testimonios multimedia, productos internos y la extensión de `wholesale` con `interestType=distributor`.

## Decisión de priorización

Al `20 de marzo de 2026`, la Fase 2 ya no necesita abrir una nueva migración visual de la home. Esa base ya existe en producción. Antes de seguir con automatización y reporting, se abre un desvío urgente para cerrar la brecha entre promesa y runtime en catálogo y media.

La prioridad inmediata pasa a ser:

1. `catálogo y media administrable`
2. `automatización comercial`
3. `reporting operativo y comercial`
4. `homologación visual fina de superficies secundarias` como frente complementario, no como bloqueo del frente activo

## Desvío urgente homologado

### F2-URG Catálogo y media administrable

Resultado esperado:

- productos administrables desde backoffice con fuente persistida real
- catálogo, home y checkout leyendo productos persistidos, no `featuredProducts`
- logo, hero, banners e imágenes de producto administrables
- media pública del storefront resuelta sobre `Cloudflare R2`

## Alcance del desvío urgente

### Dentro de alcance

- módulo real de productos en API
- CRUD admin de productos
- refactor de catálogo público y checkout para usar productos persistidos
- integración runtime del layout público con branding persistido
- capa de media pública administrable
- adopción de `Cloudflare R2` como storage vigente para imágenes públicas del storefront

### Fuera de alcance

- rehacer el circuito de pedidos o pagos más allá del consumo de producto persistido
- abrir DAM complejo o media library enterprise
- sustituir la arquitectura actual de monolito modular
- mover evidencias privadas operativas a un proveedor externo en esta iteración

## Frente activo posterior

### F2-002 Automatización comercial y reporting

Resultado esperado:

- campañas menos manuales y más accionables
- segmentos más útiles para operación comercial real
- lectura clara de pedidos, pagos, comisiones y conversión sin inspección manual por módulo
- entregables suficientemente cerrados para convertirse en vistas, exports y rutinas operativas dentro del admin

## Épicas sugeridas para Linear

### Epic A. F2-URG Catálogo y media administrable

Dueño sugerido:

- `product-manager` para alcance y priorización
- `software-architect` para diseño del frente
- `backend-lead` + `data-agent` para persistencia y contratos
- `frontend-lead` para admin/web
- `ui-ux-agent` para media/branding runtime
- `qa-lead` para cierre

### Epic B. F2-002 Automatización comercial y reporting

Dueño sugerido:

- `product-manager` para alcance y priorización
- `tech-lead` para secuencia
- `backend-lead` y `data-agent` para contratos y persistencia
- `frontend-lead` para superficies admin
- `qa-lead` para cierre

### Epic C. F2-VIS Homologación visual fina

Dueño sugerido:

- `ui-ux-agent` para brief y consistencia
- `frontend-lead` para implementación
- `qa-lead` para revisión cross-device

Nota:

- `Epic A` sí bloquea parte del valor de `Epic B`, porque campañas y reporting no deben seguir naciendo sobre productos y branding no administrables.
- `Epic C` no bloquea `Epic A` ni `Epic B`, pero debe coordinarse para no pisar superficies en reescritura.

## Alcance

### Dentro de alcance

- modelo más rico de segmentos comerciales
- automatización básica de campañas sobre triggers y condiciones operativas
- reportes de pedidos, pagos, comisiones, campañas y conversión
- exports CSV operativos
- criterios de QA y trazabilidad para los nuevos flujos
- documentación y handoff operativo para que el equipo no dependa de memoria implícita

### Fuera de alcance

- reabrir la home oficial `/` como experimento visual
- rehacer checkout, auth o contratos base del circuito transaccional
- introducir microservicios o pipelines analíticos externos
- reemplazar la base actual de `module_snapshots`, `Prisma`, `BullMQ` o `PM2`

## Tickets ejecutables

### Bloque 0. Catálogo y media administrable

| ID | Título | Agente líder sugerido | Módulos tocados | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-URG-01` | Diseñar fuente única de producto y branding runtime | `software-architect` + `system-analyst` | `catalog`, `cms`, `commerce`, docs | Contrato claro de qué sale de producto persistido, qué sale de CMS y qué sale de media |
| `F2-URG-02` | Implementar módulo real de productos | `backend-lead` + `data-agent` | `products`, `catalog`, `commerce`, Prisma | CRUD y lecturas consistentes de producto en PostgreSQL |
| `F2-URG-03` | Crear backoffice de productos | `frontend-lead` | `apps/admin`, navegación, permisos | Pantalla admin para alta, edición, publicación e imagen principal de producto |
| `F2-URG-04` | Conectar catálogo, home y checkout a productos persistidos | `backend-lead` + `frontend-lead` | `catalog`, `commerce`, `web`, `storefront-v2-premium` | La web deja de depender de `featuredProducts` como fuente operativa |
| `F2-URG-05` | Incorporar media pública con Cloudflare R2 | `software-architect` + `backend-lead` | `media`, `cms`, `catalog`, `web`, infra | Upload y delivery de logo, hero, banners e imágenes de producto vía `Cloudflare R2` |
| `F2-URG-06` | Conectar branding persistido al layout público | `frontend-lead` | `apps/web/app/layout.tsx`, `cms`, `settings` | El logo del menú y branding público reflejan el estado guardado en backoffice |
| `F2-URG-07` | QA y cierre del frente catálogo/media | `qa-lead` + `documentation-agent` | web, admin, api, docs | Catálogo/media funcionando de extremo a extremo y documentación alineada |

### Bloque 1. Fundaciones de automatización comercial

| ID | Título | Agente líder sugerido | Módulos tocados | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-002-01` | Definir taxonomía de eventos comerciales | `system-analyst` + `product-manager` | `orders`, `payments`, `commissions`, `marketing`, `notifications`, docs | Lista única de eventos que alimentan campañas y reporting, con nombre, trigger, payload mínimo y reglas de uso |
| `F2-002-02` | Expandir el modelo de segmentos comerciales | `data-agent` + `backend-lead` | `marketing`, `customers`, `orders`, `loyalty` | Segmentos basados en compra reciente, recompra, valor, canal, vendedor, mayorista y estado de fidelización |
| `F2-002-03` | Definir contratos de reporting y vistas agregadas | `software-architect` + `backend-lead` | `core`, `marketing`, `orders`, `payments`, `commissions` | Endpoints y agregados consistentes para reporting operativo y comercial |

### Bloque 2. Automatización de campañas

| ID | Título | Agente líder sugerido | Módulos tocados | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-002-04` | Motor de reglas de campañas automáticas | `backend-lead` | `marketing`, `notifications`, `worker`, `BullMQ` | Reglas tipo trigger + condición + acción para campañas simples, sin depender de ejecución manual |
| `F2-002-05` | Corridas programadas y reintentos de campañas | `backend-lead` + `devops-agent` | `marketing`, `worker`, `observability` | Jobs trazables para campañas programadas, con estado, retry e instrumentación |
| `F2-002-06` | Workspace admin para automatizaciones | `frontend-lead` + `ui-ux-agent` | `apps/admin/app/marketing`, `crm`, componentes admin | Vista clara para crear, activar, pausar y revisar automatizaciones sin ambigüedad operativa |

### Bloque 3. Reporting y lectura comercial

| ID | Título | Agente líder sugerido | Módulos tocados | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-002-07` | Reporte de pedidos, pagos y conversión | `backend-lead` + `data-agent` | `core`, `orders`, `payments` | Resumen por periodo con embudo básico: visita comercial útil, pedido, pago aprobado y conversión |
| `F2-002-08` | Reporte de comisiones y rendimiento vendedor | `backend-lead` + `frontend-lead` | `commissions`, `vendors`, `seller panel`, admin | Lectura de comisiones pendientes, pagables, pagadas y desempeño por vendedor |
| `F2-002-09` | Exports CSV operativos | `backend-lead` + `qa-lead` | `orders`, `payments`, `commissions`, `marketing` | Descarga de CSV útiles para operación y conciliación sin depender de copiar tablas |
| `F2-002-10` | Dashboard comercial consolidado por rol | `frontend-lead` | `dashboard`, `crm`, `marketing`, `comisiones` | Dashboards por rol con foco comercial, no sólo operacional |

Avance puntual al `15 de abril de 2026`:

- el workspace admin de reportes ya aplica `salesChannel`, `vendorCode`, `productSlug` y `sku` sobre el mismo scope server-side para métricas, tablas y exportación CSV
- la conciliación manual admin ya separa `comprobantes` en `Pagos` y `openpay` pendiente o `registro directo` en `Pedidos`, con una ruta operativa explícita
- `Pedidos > Operacion` ya funciona como vista canonica de trazabilidad comercial, con ruta activa, referencia, nota y fechas concentradas en el detalle operativo

### Bloque 4. Cierre de calidad y handoff

| ID | Título | Agente líder sugerido | Módulos tocados | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-002-11` | QA funcional y regresión del frente comercial | `qa-lead` | web, admin, api, worker | Matriz de pruebas con escenarios felices, edge cases y regresión sobre campañas, reportes y exports |
| `F2-002-12` | Documentación operativa y cierre de frente | `documentation-agent` + `tech-lead` | `docs/product`, `docs/flows`, `docs/api`, `docs/infra` | Documentación alineada a lo implementado, sin dejar comportamiento crítico implícito |

## Frente complementario

### F2-VIS Homologación visual fina

Este frente existe porque el roadmap ya lo marca como pendiente inmediato, pero no debe desordenar el bloque activo.

Tickets sugeridos:

| ID | Título | Agente líder sugerido | Superficies | Resultado esperado |
| --- | --- | --- | --- | --- |
| `F2-VIS-01` | Brief UX final para superficies secundarias | `ui-ux-agent` + `product-manager` | `catalogo`, `checkout`, `cuenta`, `panel-vendedor`, `configuracion` | Brief aprobado con reglas de espaciado, jerarquía y patrones por superficie |
| `F2-VIS-02` | Homologación de rutas públicas secundarias | `frontend-lead` | `catalogo`, `checkout`, `cuenta`, `panel-vendedor` | Consistencia visual real con la home actual sin romper flujos |
| `F2-VIS-03` | Homologación fina del backoffice secundario | `frontend-lead` | `configuracion`, `crm`, `marketing`, módulos administrativos secundarios | Backoffice consistente con el dashboard ya aceptado, sin superficies rotas o desalineadas |
| `F2-VIS-04` | QA visual cross-device | `qa-lead` | web y admin | Revisión desktop/mobile y cierre de desbordes, contraste y spacing |

## Secuencia recomendada

### Ola 1

- `F2-URG-01`
- `F2-URG-02`
- `F2-URG-03`
- `F2-URG-04`
- `F2-URG-05`
- `F2-URG-06`
- `F2-URG-07`

Objetivo:

- cerrar productos administrables y media pública antes de seguir sofisticando automatización y reporting sobre una base incompleta

### Ola 2

- `F2-002-01`
- `F2-002-02`
- `F2-002-03`

Objetivo:

- cerrar taxonomía, segmentos y contratos antes de abrir UI nueva o automatizaciones que luego cambien dos veces

### Ola 3

- `F2-002-04`
- `F2-002-05`
- `F2-002-06`

Objetivo:

- llevar campañas desde una lógica semi-manual a una base automatizable y observable

### Ola 4

- `F2-002-07`
- `F2-002-08`
- `F2-002-09`
- `F2-002-10`

Objetivo:

- convertir datos dispersos en lectura comercial real para operación y toma de decisión

### Ola 5

- `F2-002-11`
- `F2-002-12`
- `F2-VIS-01`
- `F2-VIS-02`
- `F2-VIS-03`
- `F2-VIS-04`

Objetivo:

- cerrar calidad, documentación y consistencia visual sin mezclar ese trabajo con los cambios estructurales de backend

## Dependencias críticas

- `F2-002-*` no debe asumir productos mockeados como fuente final de catálogo
- `F2-URG-04` depende de `F2-URG-02`
- `F2-URG-05` depende de `F2-URG-01`
- `F2-URG-06` depende de `F2-URG-05`
- `F2-URG-07` depende del cierre funcional de `F2-URG-02` a `F2-URG-06`
- `F2-002-04` depende de `F2-002-01` y `F2-002-02`
- `F2-002-05` depende de `F2-002-04`
- `F2-002-06` depende de que `F2-002-04` tenga contrato estable
- `F2-002-07` y `F2-002-08` dependen de `F2-002-03`
- `F2-002-09` depende de `F2-002-07` y `F2-002-08`
- `F2-002-10` depende de `F2-002-07` y `F2-002-08`
- `F2-VIS-*` debe evitar pisar componentes que estén siendo reescritos por `F2-002-06` o `F2-002-10`

## Definición de terminado

La Fase 2 no debe considerarse cerrada si solo existen vistas nuevas. Se considera cerrada cuando:

- productos, branding y media pública se administran de extremo a extremo desde backoffice
- campañas pueden dispararse por condiciones reales sin intervención manual constante
- segmentos nuevos tienen definición explícita y trazable
- existe lectura útil de pedidos, pagos, comisiones y conversión por periodo
- exports operativos resuelven conciliación y seguimiento sin trabajo manual repetitivo
- QA cubre happy path y regresión del nuevo frente
- la documentación queda sincronizada con implementación real
- superficies secundarias se ven como parte del mismo producto y no como piezas aisladas

## Riesgos y controles

### Riesgo

- convertir campañas en una capa demasiado compleja para el estado actual del monolito

Control:

- comenzar con reglas simples y triggers explícitos

### Riesgo

- seguir ampliando UX y reporting sobre catálogo y branding no persistidos

Control:

- cerrar primero el desvío urgente `F2-URG`

### Riesgo

- abrir reporting ambiguo sin contrato de métricas único

Control:

- cerrar primero taxonomía y definiciones de métricas

### Riesgo

- mezclar rediseño visual con cambios estructurales y frenar la entrega

Control:

- separar `F2-002` y `F2-VIS` como frentes coordinados, no como una sola bolsa de trabajo

## Uso recomendado en Linear

Estructura sugerida:

1. Crear la épica `F2-URG Catálogo y media administrable`
2. Crear la épica `F2-002 Automatización comercial y reporting`
3. Crear la épica `F2-VIS Homologación visual fina`
4. Cargar cada ticket con su mismo ID
5. Etiquetar por disciplina: `product`, `backend`, `frontend`, `data`, `qa`, `docs`, `ux`, `infra`
6. Relacionar dependencias entre tickets antes de asignar responsables

## Siguiente decisión recomendada

Abrir primero `F2-URG-01`, `F2-URG-02` y `F2-URG-05`.

Ese bloque fija producto, branding, media y contratos de runtime. Sin eso, cualquier automatización o dashboard nuevo sigue naciendo sobre una base a medias.
