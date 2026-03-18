# Guías de `shadcn/ui` y Tailwind

## Objetivo

Estandarizar cómo se construyen y extienden componentes en Huelegood usando `shadcn/ui` y `Tailwind CSS`.

## Regla base

- `shadcn/ui` es la base de componentes reutilizables
- `Tailwind CSS` es la capa de estilado
- la personalización debe concentrarse en tokens y variantes internas

## Principios de uso

### Reutilizar antes de crear

- partir de primitivas existentes: `Button`, `Card`, `Badge`, `Dialog`, `Sheet`, `Table`, `Input`, `Textarea`, `Select`, `Accordion`, `Toast`
- crear wrappers del dominio solo cuando el caso lo justifique

### Variantes claras

- definir variantes por intención: `primary`, `secondary`, `ghost`, `danger`
- evitar clases inline extensas repetidas en cada pantalla

### Tokens semánticos

- colores, radios, sombras y spacing deben apoyarse en variables semánticas
- no atar componentes de negocio a un color de campaña puntual

### Consistencia compartida

- web y admin comparten componentes base
- si un componente requiere comportamiento diferente por contexto, se resuelve con variantes o composición, no duplicando su semántica

## Estructura recomendada de componentes

- primitivas de `shadcn/ui`
- componentes base de layout y feedback
- componentes de dominio Huelegood

Ejemplo conceptual:

```text
ui/
  button
  card
  dialog
  sheet
  table
components/
  commerce/
  cms/
  payments/
  vendors/
  loyalty/
  analytics/
```

## Guías por patrón

### Cards

- usar `Card`, `CardHeader`, `CardContent`, `CardFooter`
- limitar contenido a una intención clara
- evitar cards visualmente ruidosas

### Tables

- usar `Table` como base
- separar toolbar, filtros y acciones masivas de la tabla
- estados vacíos deben ser diseñados, no dejados implícitos

### Forms

- usar composiciones de `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`
- helper texts cortos y errores en línea
- una acción primaria dominante

### Dialogs y Sheets

- `Dialog` para confirmar, crear o editar algo pequeño
- `Sheet` o drawer para revisar entidades complejas sin perder contexto de lista

### Badges

- mapear a enums del dominio
- no usar badge solo por decoración

### Toasts

- usar para feedback de acciones rápidas
- no mostrar información crítica exclusivamente en toast

## Componentes mínimos recomendados

| Componente | Contexto | Base sugerida | Reglas de uso |
| --- | --- | --- | --- |
| `ProductCard` | storefront | `Card`, `Badge`, `Button` | destacar imagen, nombre, precio, promo y CTA sin sobrecargar |
| `ProductGrid` | storefront | layout grid + `ProductCard` | responsive, consistente y respirado |
| `PromoBanner` | storefront/CMS | `Card` o bloque custom con CTA | mensajes cortos, alto contraste y fecha/vigencia si aplica |
| `SellerCodeInput` | carrito/checkout | `Input`, `Button`, `Badge` | validar, mostrar estado y permitir remover código |
| `CheckoutSummary` | checkout | `Card`, `Separator`, `Badge` | subtotal, descuentos, envío, total y vendedor aplicado |
| `StatusBadge` | web/admin | `Badge` | traducir enums del dominio a semántica visual consistente |
| `AdminDataTable` | admin | `Table`, `DropdownMenu`, `Button` | filtros claros, acciones auditables y paginación server-side |
| `MetricCard` | admin/dashboard | `Card` | valor principal, delta opcional y etiqueta legible |
| `ReviewDrawer` | pagos/pedidos | `Sheet`, `Tabs`, `Badge` | revisar contexto completo sin abandonar listado |
| `TimelinePedido` | pedidos | lista vertical + `Badge` | mostrar cambios de estado con fecha, actor y nota |
| `CommissionTable` | seller/admin | `Table`, `StatusBadge` | separar saldo pendiente, pagable y pagado |
| `FAQAccordion` | CMS/storefront | `Accordion` | preguntas escaneables y contenido limpio |
| `HeroSection` | home/landing | layout editorial + CTA | mensaje claro, visual premium y foco en conversión |
| `WholesalePlanCard` | mayoristas | `Card`, `Badge`, `Button` | resumir beneficios y CTA de contacto |

## Reglas específicas web vs admin

### Web

- mayor aire visual
- imágenes más protagonistas
- CTA comercial dominante

### Admin

- densidad informativa más alta
- filtros y estados siempre visibles
- acciones peligrosas con confirmación

## Theming y mantenibilidad

- centralizar tokens en la raíz del sistema
- documentar cualquier excepción visual real
- evitar estilos ad hoc por campaña si pueden resolverse vía contenido

## Criterio de aceptación UI

Un componente nuevo está alineado con Huelegood si:

- reutiliza primitivas existentes
- respeta tokens
- resuelve un caso de negocio claro
- funciona en desktop y mobile cuando aplica
- mantiene la estética limpia, premium y consistente definida para el proyecto
