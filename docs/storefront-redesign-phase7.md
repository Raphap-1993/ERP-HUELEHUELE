# Storefront Redesign Phase 7

## Estado actual

`storefront-v2` quedó deprecado como camino principal. Ya no se expone como preview pública: en producción, `/storefront-v2` redirige a `/`.

La experiencia oficial del storefront público ahora es `storefront-v2-premium`, con home productiva en `/` y documentación fuente en [storefront-v2-premium-landing.md](./storefront-v2-premium-landing.md).

## Qué se implementó

Se agregó una nueva capa visual premium/editorial del storefront dentro de `apps/web` como fase previa a la consolidación posterior en la home oficial.

La implementación incluyó:

- nueva estructura modular en `apps/web/features/storefront-v2`
- tokens visuales premium para paleta, radios, sombras, spacing y gradientes
- secciones nuevas y reutilizables para hero, beneficios, historia sensorial, uso, prueba social, catálogo destacado, marca, FAQ y CTA final
- una ruta temporal de preview en `/storefront-v2`, ya retirada de producción
- un feature flag `NEXT_PUBLIC_STOREFRONT_V2`, ya retirado del circuito operativo
- preparación de `next/image` para media remota en `cdn.huelegood.com` y `images.huelegood.com`
- helper de media para resolver assets locales o remotos sin cambiar los componentes consumidores

## Estructura

La capa nueva vive en:

- `apps/web/features/storefront-v2/components`
- `apps/web/features/storefront-v2/sections`
- `apps/web/features/storefront-v2/layouts`
- `apps/web/features/storefront-v2/lib`
- `apps/web/features/storefront-v2/tokens`

Piezas principales:

- `layouts/storefront-v2-page.tsx`
  orquesta la experiencia completa del storefront v2
- `lib/content.ts`
  carga CMS con fallback a `@huelegood/shared` y compone el view model del storefront
- `lib/media.ts`
  resuelve URLs de assets y deja lista la transición a Cloudflare media
- `lib/flags.ts`
  centraliza el flag `NEXT_PUBLIC_STOREFRONT_V2`
- `sections/*`
  encapsulan cada bloque del nuevo storefront

## Estado del feature flag

Este flag perteneció a la fase anterior del rollout:

```bash
NEXT_PUBLIC_STOREFRONT_V2=true
```

Ya no debe usarse para decidir la home oficial. La home actual vive sobre `storefront-v2-premium` y las variantes antiguas no deben reaparecer como preview pública.

## Cómo preparar imágenes remotas con Cloudflare

`apps/web/next.config.mjs` ya permite imágenes remotas para:

- `https://cdn.huelegood.com`
- `https://images.huelegood.com`

Además, existe el helper:

- `apps/web/features/storefront-v2/lib/media.ts`

Ese helper soporta un base URL opcional:

```bash
NEXT_PUBLIC_STOREFRONT_MEDIA_BASE_URL=https://cdn.huelegood.com
```

Comportamiento:

- si no existe `NEXT_PUBLIC_STOREFRONT_MEDIA_BASE_URL`, los assets siguen sirviéndose desde `public/brand/*`
- si existe y apunta a uno de los hosts permitidos, los mismos paths se resuelven contra Cloudflare
- el helper también expone un loader reutilizable para `next/image`, pensado para una migración progresiva

Ejemplo:

- local: `/brand/hero-huele-huele.svg`
- remoto resuelto: `https://cdn.huelegood.com/brand/hero-huele-huele.svg`

## Compatibilidad mantenida

La nueva capa:

- reutiliza `featuredProducts`, `heroCopy`, `faqItems`, `promoBanners` y testimonios actuales desde `@huelegood/shared`
- mantiene el fetch a CMS con fallback seguro
- no cambia contratos de API
- no toca checkout ni admin
- no elimina componentes previos
- no modificó rutas productivas existentes de forma destructiva durante la migración original

## Cierre de fase

Esta fase queda cerrada como antecedente útil de exploración visual, media remota y composición editorial. El trabajo nuevo del storefront debe continuar sobre `storefront-v2-premium` y sobre la home oficial `/`, no sobre una variante paralela visible al público.

## Siguientes pasos históricos

1. Reemplazar gradualmente assets SVG locales por variantes fotográficas remotas en Cloudflare usando el helper ya creado.
2. Reusar aprendizajes y helpers técnicos de `storefront-v2` dentro de la capa premium oficial cuando haga sentido.
3. Mantener `storefront-v2` sólo como referencia histórica de código y documentación, no como superficie pública.
