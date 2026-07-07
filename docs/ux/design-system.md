# Sistema de Diseño

## Objetivo

Definir la capa visual de Huelegood para que web y admin compartan un lenguaje consistente, moderno y escalable, sin perder sus diferencias funcionales.

## Base tecnológica

- `shadcn/ui` como base de componentes reutilizables
- `Preline` como complemento para secciones editoriales del storefront
- `Tailwind CSS` como capa de estilado
- tokens de diseño expuestos mediante variables CSS semánticas

`Preline` no sustituye `shadcn/ui`. Se incorpora para acelerar hero, bloques de productos en tendencia y banners promocionales en la web pública, aprovechando una librería con más de 300 componentes y ejemplos reutilizables, sus temas y su enfoque por tokens semánticos.

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
- el copy público no debe mencionar CMS, API, stack, preview, flags, persistencia, contratos ni detalles internos de implementación

### Premium sin recargar

- superficies limpias
- contraste medido
- uso contenido del color de acento
- bordes, sombras y radios consistentes

### Consistencia transversal

- mismos tokens, spacing y semántica visual entre web y admin
- diferencias de layout por contexto, no por improvisación de estilos
- cuando una sección use patrones de `Preline`, debe seguir leyendo como Huelegood y no como una plantilla externa

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

### Tokens base de Huelegood

La integración con `Preline Themes` debe mapear sus variables semánticas a la paleta de Huelegood:

| Token | Rol | Valor de referencia Huelegood |
| --- | --- | --- |
| `--primary` | CTA y acento principal | verde del logo Huelegood |
| `--primary-hover` | hover de CTA | sombra verde del logo |
| `--background` | fondo general | marfil cálido con lectura limpia |
| `--foreground` | texto principal | verde negro casi carbón |
| `--muted` | fondos suaves | salvia muy clara |
| `--border` | líneas y divisores | oliva desaturado de baja intensidad |
| `--card` | superficies editoriales | blanco cálido con leve tinte crema |
| `--ring` | foco accesible | verde fresco de alto contraste |

Ejemplo conceptual:

```css
:root {
  --primary: #61a740;
  --primary-hover: #577e2f;
  --background: #f6f1e8;
  --foreground: #18231b;
  --muted: #eef6e8;
  --border: rgba(17, 32, 23, 0.12);
  --card: rgba(255, 255, 255, 0.92);
  --ring: #61a740;
}
```

Este mapeo permite que `Preline`, `shadcn/ui` y `Tailwind` trabajen sobre el mismo lenguaje visual.

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
- el shell público debe usar un fondo continuo basado en `--background` detrás del header para que la navegación flotante no parezca apoyada sobre una franja distinta
- secciones tipo `hero`, `trending products` y `promo banners` pueden apoyarse en patrones de `Preline`, siempre aterrizados a tokens Huelegood

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

## Uso esperado de `Preline`

Dentro de la web pública, `Preline` se usará principalmente para:

- `HeroSection` con composición editorial basada en la plantilla `Coffee Shop`
- secciones de productos en tendencia o selección curada
- banners promocionales y bloques de CTA

No debe convertirse en una segunda fuente de diseño aislada. La coherencia se conserva a través de:

- tokens semánticos compartidos
- tipografía única del proyecto
- radios, sombras y spacing alineados con Huelegood
- copy centrado en inhaladores herbales y no en categorías ajenas al catálogo real

## Regla de diseño operativo

Antes de crear un componente nuevo, se debe verificar si el caso puede resolverse con una composición de primitivas existentes de `shadcn/ui` y tokens propios.
