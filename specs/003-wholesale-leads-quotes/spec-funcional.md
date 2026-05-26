# Spec Funcional - Wholesale Leads Quotes

Fecha: 2026-05-26.

## Objetivo

Formalizar el funnel mayorista vigente como paquete SDD canonico, cubriendo la
captura publica, la calificacion operativa, la cotizacion basada en catalogo,
el cierre comercial y el acceso autenticado basico sin abrir un portal B2B
autoservicio.

## Alcance

Incluye:

- captura publica unificada para `wholesale` y `distributor`
- `interestType` como diferenciador comercial dentro del mismo modulo
- calificacion y seguimiento de leads por `Ventas`
- deduplicacion operativa, sin fusion automatica
- cotizaciones mayoristas basadas en referencias reales del catalogo
- `tier` como referencia editable de precio o condiciones
- cierre comercial `won/lost`
- creacion o vinculacion de acceso comercial mayorista sobre cuenta existente o
  reutilizada
- resumen mayorista basico dentro de `/cuenta`
- suspension y reactivacion del entitlement comercial preservando historial

No incluye:

- pedido automatico desde `accepted` o `won`
- portal B2B de autoservicio
- aceptacion o rechazo de cotizaciones desde `/cuenta`
- pricing rigido por tier
- fusion automatica de leads o cuentas duplicadas
- codigo de vendedor o comisiones seller-first derivados de este slice

## Actores

- prospecto mayorista
- prospecto distribuidor
- ventas
- admin
- backoffice
- usuario autenticado con acceso mayorista
- storefront web
- API Huelegood
- auth
- notificaciones

## Reglas Funcionales Canonicas

### RF-01. Captura publica unificada

- la web publica debe aceptar leads `wholesale` y `distributor`
- ambos usan el mismo modulo y comparten funnel
- `interestType` diferencia el contexto comercial sin abrir dominios separados
- la captura no crea cuenta ni credenciales

### RF-02. Calificacion y deduplicacion operativa

- `Ventas` es el dueno operativo de la calificacion
- el lead entra con estado `new`
- los duplicados se marcan para revision manual
- el sistema no fusiona leads ni cuentas automaticamente

### RF-03. Cotizacion basada en catalogo real

- toda cotizacion parte de referencias reales del catalogo
- `tier` sirve como referencia comercial editable
- ventas puede ajustar cantidades, condiciones y contexto comercial
- una cotizacion `accepted` no crea pedido

### RF-04. Cierre comercial explicito

- el cierre del funnel solo se considera resuelto en `won` o `lost`
- `accepted` expresa aceptacion de la propuesta, no cierre comercial definitivo
- `won` no equivale a `order`
- `lost` conserva trazabilidad y puede reabrirse sin perder historial

### RF-05. Entitlement mayorista sobre cuenta reutilizada

- el acceso mayorista solo puede habilitarse cuando la oportunidad queda `won`
- backoffice crea o vincula el acceso sobre una cuenta existente o reutilizada
  por email
- el acceso no crea una identidad separada si ya existe cuenta cliente valida
- `/cuenta` muestra resumen comercial basico, no un panel mayorista operativo

### RF-06. Suspension y continuidad operativa

- el entitlement puede suspenderse por decision comercial explicita o
  inactividad marcada
- la suspension no borra historial del lead, cotizacion ni cuenta
- reactivar el acceso no exige recrear la oportunidad cerrada
- el replay del funnel historico no revoca por si solo un acceso ya decidido

### RF-07. Separacion frente a seller-first

- un mayorista no recibe `vendorCode`
- un mayorista no gana comisiones seller-first por este slice
- el acceso mayorista no habilita `/panel-vendedor`
- el resumen mayorista en `/cuenta` no reemplaza los flujos internos de ventas

## Escenarios Principales

### Escenario A. Captura y calificacion mayorista

1. El prospecto llega a `/mayoristas` o a la variante distribuidor.
2. Completa el formulario publico con `interestType` y contexto comercial.
3. La API crea `wholesale_lead` en `new`.
4. `Ventas` revisa datos, marca posibles duplicados y asigna seguimiento.
5. El lead avanza a `qualified` o queda descartado operativamente.

### Escenario B. Cotizacion y cierre comercial

1. `Ventas` crea `wholesale_quote` para un lead ya calificado.
2. La cotizacion se arma desde referencias reales del catalogo.
3. `tier` orienta precio y condiciones, pero sigue siendo editable.
4. La cotizacion pasa por `draft`, `sent` y luego `accepted`, `rejected` o
   `expired`.
5. El cierre comercial real del lead ocurre en `won` o `lost`.

### Escenario C. Entitlement mayorista y resumen en cuenta

1. Un lead cerrado como `won` queda elegible para acceso comercial.
2. Backoffice crea o vincula el acceso mayorista usando el email existente si
   corresponde.
3. El usuario entra por `/cuenta`.
4. La cuenta muestra un resumen mayorista basico con su estado comercial.

### Escenario D. Suspension del acceso mayorista

1. Operacion detecta relacion inactiva o decide suspender el acceso.
2. Backoffice marca el entitlement como `suspended` o `inactive`.
3. La cuenta conserva historial y relacion comercial.
4. El usuario pierde acceso al resumen mayorista activo hasta una reactivacion.

## Criterios De Aceptacion

| ID | Criterio |
| --- | --- |
| CA-01 | la captura publica nunca crea cuenta ni credenciales comerciales |
| CA-02 | `wholesale` y `distributor` comparten modulo y funnel, diferenciados por `interestType` |
| CA-03 | los duplicados se marcan para revision y no se fusionan automaticamente |
| CA-04 | toda cotizacion parte de referencias reales del catalogo |
| CA-05 | `accepted` no crea pedido ni acceso |
| CA-06 | `won` es la unica puerta normal para habilitar acceso mayorista |
| CA-07 | el acceso mayorista se crea o vincula sobre cuenta existente o reutilizada por email |
| CA-08 | `/cuenta` solo muestra resumen comercial basico |
| CA-09 | el slice no entrega `vendorCode`, comisiones ni acceso a `/panel-vendedor` |
| CA-10 | suspender el entitlement conserva el historial comercial y la cuenta |

## Casos Negativos Relevantes

- intento de auto-registro mayorista desde storefront: se rechaza
- intento de crear acceso con lead no `won`: se bloquea
- lead duplicado: queda marcado para revision
- cotizacion sin referencias validas del catalogo: no puede enviarse
- intento de usar `/cuenta` como portal de aceptacion de cotizaciones: fuera de
  alcance
- intento de dar rol seller a un mayorista por este slice: se bloquea por
  ownership

## Dependencias De Negocio

- el negocio mantiene un funnel mayorista asistido por `Ventas`
- el catalogo sigue siendo la base para construir cotizaciones
- backoffice conserva el ownership del acceso comercial
- `/cuenta` se mantiene como unica entrada autenticada para relaciones
  comerciales
