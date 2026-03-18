# Sistema de Diseño

## Objetivo

Definir la capa visual de Huelegood para que web y admin compartan un lenguaje consistente, moderno y escalable, sin perder sus diferencias funcionales.

## Base tecnológica

- `shadcn/ui` como base de componentes reutilizables
- `Tailwind CSS` como capa de estilado
- tokens de diseño expuestos mediante variables CSS semánticas

## Dirección visual

Huelegood debe comunicar una marca:

- moderna
- limpia
- premium
- clara
- administrable

La estética no debe caer en un ecommerce genérico. La interfaz debe transmitir control, confianza y una identidad fresca, alineada con la propuesta de valor del producto.

## Principios visuales

### Claridad primero

- jerarquía tipográfica evidente
- llamadas a la acción claras
- formularios simples
- estados visibles

### Premium sin recargar

- superficies limpias
- contraste medido
- uso contenido del color de acento
- bordes, sombras y radios consistentes

### Consistencia transversal

- mismos tokens, spacing y semántica visual entre web y admin
- diferencias de layout por contexto, no por improvisación de estilos

### Escalabilidad

- nuevos módulos deben construir sobre patrones existentes
- evitar componentes aislados con estilos únicos difíciles de mantener

## Relación entre web y admin

- comparten lenguaje visual, tipografía, escala, color semántico y componentes base
- no comparten necesariamente layout, navegación ni densidad informativa
- la web prioriza conversión y storytelling
- el admin prioriza legibilidad operativa y eficiencia

## Theming

La aplicación debe quedar preparada para tematización limpia:

- colores definidos por tokens semánticos: `background`, `foreground`, `primary`, `muted`, `border`, `success`, `warning`, `danger`
- no hardcodear colores en componentes de negocio
- componentes críticos deben consumir tokens y no clases arbitrarias repetidas

## Tipografía

### Reglas

- usar una familia principal sans moderna y consistente en todo el sistema
- reservar pesos más altos para títulos y métricas
- limitar variaciones tipográficas para no romper coherencia

### Escala sugerida

| Uso | Tamaño sugerido |
| --- | --- |
| Hero principal | `text-4xl` a `text-6xl` |
| Título de sección | `text-2xl` a `text-3xl` |
| Título de card | `text-lg` a `text-xl` |
| Texto base | `text-sm` a `text-base` |
| Texto auxiliar | `text-xs` a `text-sm` |

## Spacing

### Regla base

Usar escala basada en múltiplos de 4 con énfasis en ritmos de 8 para layout.

### Referencias

- padding interno de card: `16-24px`
- gaps entre módulos de página: `24-48px`
- separación entre controles de formulario: `12-16px`
- separación entre grupos mayores en admin: `24px`

## Grid y layout

### Web

- diseño mobile-first
- hero y bloques editoriales con composición amplia
- grillas de producto claras y respiradas

### Admin

- layout más denso, pero no comprimido
- headers persistentes, filtros visibles, tablas legibles
- drawers y dialogs para revisión contextual

## Superficies y patrones

### Cards

- bordes suaves
- sombra mínima o superficie tonal leve
- header claro y acciones secundarias alineadas

### Dialogs y Sheets

- usar `Dialog` para decisiones cortas y confirmaciones
- usar `Sheet` o `Drawer` para revisión contextual de entidades como pagos y pedidos

### Tables

- densidad media
- headers fijos cuando el contexto lo requiera
- acciones masivas solo donde exista valor operativo real

### Forms

- labels siempre visibles
- helper text corto
- errores debajo del campo
- CTA primario único por formulario cuando sea posible

### Badges

- colores semánticos por estado
- evitar múltiples badges con el mismo peso visual compitiendo entre sí

### Toasts

- para feedback inmediato no bloqueante
- no reemplazan validación ni auditoría

## Motion

- transiciones cortas y sobrias
- usar motion para reforzar jerarquía y feedback, no para decorar
- evitar animaciones largas en admin

## Estados semánticos

| Estado | Uso visual |
| --- | --- |
| success | pago aprobado, pedido completado, campaña enviada |
| warning | pago en revisión, lead pendiente, comisión bloqueada |
| danger | rechazo, error, reversa, cancelación |
| info | proceso en curso, contexto neutro |
| muted | metadata y soporte visual secundario |

## Accesibilidad mínima

- contraste suficiente para texto y controles
- foco visible
- navegación por teclado en admin y checkout
- mensajes de error comprensibles

## Componentes base obligatorios

La capa visual debe contemplar al menos:

- `ProductCard`
- `ProductGrid`
- `PromoBanner`
- `SellerCodeInput`
- `CheckoutSummary`
- `StatusBadge`
- `AdminDataTable`
- `MetricCard`
- `ReviewDrawer`
- `TimelinePedido`
- `CommissionTable`
- `FAQAccordion`
- `HeroSection`
- `WholesalePlanCard`

## Regla de diseño operativo

Antes de crear un componente nuevo, se debe verificar si el caso puede resolverse con una composición de primitivas existentes de `shadcn/ui` y tokens propios.
