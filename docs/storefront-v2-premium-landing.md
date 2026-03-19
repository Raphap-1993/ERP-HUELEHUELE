# Storefront V2 Premium Landing

## Resumen

Este documento consolida el plan generado por agentes y la implementación de una nueva landing/storefront premium para ERP-HUELEHUELE.

La solución es aditiva:

- no elimina la home actual
- no cambia contratos API
- no toca checkout, admin ni worker
- deja una ruta segura en `/storefront-v2-premium`
- permite activación posterior por feature flag

## Plan generado por agentes

### Orquestación aplicada

- `Software Architect` + skill `propose-architecture`
- `UI/UX Agent` + skill `create-ui-brief`
- `Frontend Lead`
- `QA Lead` + skill `plan-test-strategy`

### Decisiones consolidadas

1. La experiencia premium vive aislada en `apps/web/features/storefront-v2-premium/`.
2. El contenido editorial es curado en código, no en un CMS total.
3. La ruta segura `/storefront-v2-premium` sirve como preview aditivo.
4. La home actual permanece intacta, pero puede activar la experiencia premium luego con `NEXT_PUBLIC_STOREFRONT_V2_PREMIUM`.
5. `trabaja-con-nosotros` se mantiene y se conecta al endpoint existente `POST /store/vendor-applications`.

## Arquitectura implementada

### Nueva feature

Ruta base:

- `apps/web/features/storefront-v2-premium/`

Capas creadas:

- `components`
- `sections`
- `layouts`
- `tokens`
- `content`
- `lib`

### Secciones premium

- `HeroEditorialSection`
- `ProductCatalogSection`
- `UseCasesSection`
- `BenefitsEditorialSection`
- `BrandStorySection`
- `WhyChooseSection`
- `WholesaleSection`
- `VendorCalloutSection`
- `FaqSection`
- `CtaBannerSection`

### Integración de media

La nueva feature reutiliza los helpers existentes para media remota y mantiene compatibilidad con:

- `cdn.huelegood.com`
- `images.huelegood.com`

No se creó pipeline backend de media.

## Routing y rollout

### Ruta segura

- `GET /storefront-v2-premium`

Expone la experiencia premium en modo preview sin reemplazar el home actual.

### Feature flag futura

Flag implementado:

- `NEXT_PUBLIC_STOREFRONT_V2_PREMIUM`

Comportamiento:

- apagado: la home sigue usando el comportamiento actual
- encendido: la home puede renderizar la experiencia premium

### Precedencia

Si `NEXT_PUBLIC_STOREFRONT_V2_PREMIUM` está activo, debe tener prioridad sobre `NEXT_PUBLIC_STOREFRONT_V2`.

## Contenido curado local

La feature premium define contenido local para:

- hero
- benefits
- use cases
- brand story
- product highlights
- faq
- wholesale callout

La fuente operativa de productos sigue siendo `featuredProducts` y la fuente operativa de planes mayoristas sigue siendo `wholesalePlans`.

## Trabaja con nosotros

La ruta existente se mantuvo:

- `/trabaja-con-nosotros`

Cambios:

- ahora reutiliza una nueva `VendorApplicationForm`
- el formulario se conecta a `POST /store/vendor-applications`
- respeta el contrato `VendorApplicationInput`
- aplica validación mínima en frontend
- muestra estados de éxito y error sin cambiar el backend

Campos enviados:

- `name`
- `email`
- `city`
- `phone`
- `message`
- `source`

## Validación esperada

### Smoke path

1. Abrir `/storefront-v2-premium`.
2. Verificar navegación y CTAs hacia `/catalogo`, `/checkout`, `/mayoristas` y `/trabaja-con-nosotros`.
3. Confirmar que `/`, `/checkout`, `/catalogo` y `/trabaja-con-nosotros` siguen vivas.
4. Probar assets locales y remotos.
5. Enviar una postulación válida en `trabaja-con-nosotros`.

### Riesgos vigilados

- duplicación editorial parcial con `storefront-v2`
- activación accidental de la home premium por env var
- fallo de media remota sin fallback local
- confusión entre wholesale y vendor si el copy cambia sin criterio

## Cómo probar

### Preview segura

```bash
npm run dev:web
```

Luego abrir:

- `/storefront-v2-premium`

### Activación por flag

Definir:

```bash
NEXT_PUBLIC_STOREFRONT_V2_PREMIUM=true
```

Y volver a levantar `apps/web`.

### Formulario de vendedores

Abrir:

- `/trabaja-con-nosotros`

Enviar una postulación válida y verificar que la API responda con estado `queued`.

## Siguientes pasos

- decidir si la premium reemplazará a `storefront-v2` o convivirá como una tercera capa temporal
- medir scroll depth y clics en CTAs antes de mover el flag a home
- preparar una fase posterior para media remota productiva y campañas editoriales
