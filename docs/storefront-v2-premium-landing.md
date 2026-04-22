# Storefront V2 Premium Landing

## Resumen

Este documento consolida el plan generado por agentes y el estado posterior de la consolidación del storefront premium público de Huelegood.

La solución ya no se trata como preview pública. Hoy funciona así:

- la home `/` es la experiencia pública oficial
- no cambia contratos API
- no abre rutas demo o preview en producción
- mantiene una sola fuente de verdad para la narrativa pública
- convive con mantenimiento controlado del storefront cuando se requiere intervenir producción

La narrativa comercial del storefront premium debe concentrarse exclusivamente en las referencias reales del catálogo actual:

- `Clásico Verde`
- `Premium Negro`
- `Combo Dúo Perfecto`

No deben aparecer referencias a jabones, velas, perfumes ni otras categorías fuera del alcance comercial real del MVP.

## Plan generado por agentes

### Orquestación aplicada

- `Software Architect` + skill `propose-architecture`
- `UI/UX Agent` + skill `create-ui-brief`
- `Frontend Lead`
- `QA Lead` + skill `plan-test-strategy`

### Decisiones consolidadas

1. La experiencia premium vive aislada en `apps/web/features/storefront-v2-premium/`.
2. El contenido editorial es curado en código, no en un CMS total.
3. La iteración visual actual toma como base compositiva la plantilla `Coffee Shop` de Preline, adaptada a la estética herbal, limpia y premium de Huelegood.
4. La home `/` usa `storefront-v2-premium` por defecto y deja de arbitrar entre variantes.
5. Las rutas `/storefront-v2` y `/storefront-v2-premium` quedaron retiradas como preview pública y hoy redirigen a `/`.
6. `storefront-v2` y `storefront-v2-premium` se conservan sólo como antecedentes técnicos y documentales.
7. `trabaja-con-nosotros` se mantiene y se conecta al endpoint existente `POST /store/vendor-applications`.

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

### Secciones activas en la home oficial

- `HeroSection`
- `BenefitsSection`
- `ComparisonSection`
- `PricingSection`
- `TestimonialsSection`
- `WholesaleB2BSection`
- `FaqAccordionSection`
- `InstagramSection`
- `StickyBarClient`

### Secciones conservadas como antecedentes dentro de la feature

La carpeta también conserva piezas editoriales de iteraciones previas:

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

Estas piezas no gobiernan la home actual. Permanecen como reserva compositiva o antecedente documental.

### Integración de media

La nueva feature reutiliza los helpers existentes para media remota y mantiene compatibilidad con:

- `cdn.huelegood.com`
- `images.huelegood.com`

Estado actual:

- no existe todavía un pipeline backend de media conectado al backoffice
- varias superficies siguen resolviendo assets locales como `/brand/*.svg`

Decisión homologada:

- la media pública del storefront debe migrar a `Cloudflare R2`
- `Cloudflare R2` pasa a ser el storage vigente para logo, hero, banners e imágenes de producto
- el helper de media debe evolucionar para servir URLs públicas o custom domain sobre R2 sin obligar a mantener SVG placeholder como fuente operativa

### Base visual con Preline

La siguiente iteración del storefront premium se documenta sobre una base visual apoyada en `Preline` como complemento de `shadcn/ui`:

- patrón de hero editorial inspirado en `Coffee Shop`
- secciones de productos en tendencia y banners promocionales resueltas con composición Preline + Tailwind
- theming apoyado en tokens semánticos como `--primary`, `--background` y `--border`
- adaptación cromática a la paleta Huelegood en lugar de usar los tonos por defecto de la plantilla

Preline no reemplaza la arquitectura visual del proyecto ni las primitivas de `shadcn/ui`; actúa como acelerador de layout y sistema de secciones editoriales para la web pública.

Para efectos de planeación visual, se asume Preline como una librería con más de 300 componentes y ejemplos reutilizables, además de temas y plantillas que sirven como base de composición.

### Motion de la home oficial

La home pública en `/` debe usar motion editorial breve y utilitario, no animación ornamental sostenida.

Reglas homologadas:

- `HeroSection` entra con reveal escalonado entre copy y bloque visual para marcar jerarquía sin retrasar la lectura
- `BenefitsSection`, `PricingSection`, `TestimonialsSection`, `WholesaleB2BSection`, `FaqAccordionSection` e `InstagramSection` usan reveals por bloque o por grilla cuando entran al viewport
- `ComparisonSection` mantiene un reveal de tabla y filas al entrar en vista
- `StickyBarClient` conserva su aparición por scroll como único patrón fijo persistente
- si el usuario declara `prefers-reduced-motion: reduce`, los reveals se desactivan, el scroll vuelve a comportamiento normal y los elementos flotantes del hero dejan de animarse

El criterio de calidad es que el motion ayude a escanear, comparar y decidir, no a distraer ni a hacer más lenta la compra.

## Routing y rollout

### Ruta segura

- No existe una ruta segura pública para preview en producción.
- `GET /storefront-v2-premium` hoy redirige a `/`.
- `GET /storefront-v2` hoy redirige a `/`.
- El criterio actual es no exponer superficies de QA o demo al usuario final.

### Home oficial

- `GET /`

La home productiva ahora renderiza `StorefrontV2PremiumExperience` de forma directa.

### Operación segura en producción

- existe `WEB_MAINTENANCE_MODE` para cerrar temporalmente el storefront público sin afectar `admin`, `api`, `/health` ni assets
- el bypass controlado puede habilitarse con `WEB_MAINTENANCE_BYPASS_TOKEN`
- este mecanismo sustituyó la necesidad de dejar previews públicas vivas

## Contenido curado local

La feature premium define contenido local para:

- hero principal
- beneficios
- comparativa contra alternativas
- pricing de los tres productos reales
- testimonios
- bloque mayorista B2B
- FAQ
- bloque social/Instagram

La fuente operativa de productos sigue siendo `featuredProducts` y la fuente operativa de planes mayoristas sigue siendo `wholesalePlans`.

En storefront y home pública, el catálogo curado debe limitarse a:

| Referencia | Rol comercial | Mensaje recomendado |
| --- | --- | --- |
| `Clásico Verde` | entrada principal | frescura herbal directa para uso diario |
| `Premium Negro` | acabado premium | formato sobrio y discreto para rutina, trayecto y oficina |
| `Combo Dúo Perfecto` | ticket medio | dos unidades para viaje, carro, bolso o escritorio |

No deben documentarse ni mostrarse referencias ficticias o categorías no vendidas por la marca.

## Guía de copy por sección activa

### `HeroSection`

La home oficial debe usar el mensaje ya aceptado en producción:

- badge: `Inspirado en inhaladores tailandeses "Ya Dom" · 100% Natural`
- heading: `¿Cansado de llegar al destino sintiéndote al piso?`
- supporting line: soroche, mareos, tráfico y fatiga mental como problemas de entrada
- CTA primario: `Quiero el mío`
- CTA secundario: `Ver cómo funciona`

Las señales de confianza actuales deben mantenerse concretas:

- `Envíos a todo el Perú`
- `Acción en segundos`
- `Sin contraindicaciones`

### Personalización de `productChips`

`HeroEditorialSection` todavía soporta la propiedad `productChips` dentro de `PremiumHeroContent`, pero esa variante no es la que hoy renderiza `/`.

Uso documentado:

```ts
productChips: ["Clásico Verde", "Premium Negro", "Combo Dúo Perfecto"]
```

Reglas:

- usar únicamente nombres reales del catálogo activo
- mantener máximo tres chips para no recargar la lectura
- no introducir labels genéricos como `new`, `trending` o `best seller` si no aportan claridad comercial

### `BenefitsSection`

La sección debe sostener la narrativa de seis razones de uso inmediato:

- alivio del soroche
- mareos y náuseas
- malos olores en ciudad o tráfico
- energía instantánea
- descongestión nasal
- producto natural y seguro

Cada tarjeta debe reforzar SEO y uso real sin salir del producto inhalador.

### `ComparisonSection`

La comparativa activa debe seguir enfrentando a Huele Huele contra:

- pomadas o `Vicks`
- vapes

Mensajes clave:

- no mancha ropa ni piel
- no usa humo ni vapor
- cabe en bolsillo
- mantiene una propuesta natural y discreta
- la tabla debe vivir sobre superficie clara con contraste alto; no debe resolverse como bloque verde sobre verde
- el color de marca funciona como acento en badges, checks y headers, no como fondo dominante de toda la comparativa

### `PricingSection`

La sección de pricing debe listar únicamente:

- `Clásico Verde`
- `Combo Dúo Perfecto`
- `Premium Negro`

Las descripciones deben sostener:

- entrada principal de uso diario
- mejor valor por ticket medio en el combo
- opción más intensa y sobria para `Premium Negro`

### `TestimonialsSection`

Los testimonios activos deben mantenerse en escenas peruanas concretas:

- soroche en Cusco / Machu Picchu
- tráfico diario en Lima
- estudio intenso y fatiga mental en escritorio

### `WholesaleB2BSection`

El bloque mayorista activo ya no es un callout corto. Funciona como una sección B2B con:

- propuesta de distribución
- perks cuantificados
- tiers comerciales
- CTA a catálogo mayorista o canal comercial

### `FaqAccordionSection`

Debe resolver dudas concretas de:

- duración del inhalador
- envíos a todo el Perú
- ingredientes reales
- contraindicaciones y límites de uso

### `InstagramSection`

Debe reforzar comunidad, uso cotidiano y continuidad de marca sin introducir categorías ajenas al catálogo.

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

### Smoke path actual

1. Abrir `/`.
2. Verificar hero, benefits, comparison, pricing, testimonials, wholesale, FAQ, Instagram y sticky bar.
3. Verificar navegación y CTAs hacia `/catalogo`, `/checkout`, `/mayoristas`, `/trabaja-con-nosotros`, `/cuenta` y `/panel-vendedor`.
4. Confirmar que `/storefront-v2` y `/storefront-v2-premium` redirigen a `/`.
5. Probar assets locales y remotos.
6. Confirmar que home y catálogo sólo muestran `Clásico Verde`, `Premium Negro` y `Combo Dúo Perfecto`.
7. Enviar una postulación válida en `trabaja-con-nosotros`.
8. Validar que con `prefers-reduced-motion` los reveals no corran y el hero no mantenga animaciones flotantes.

### Riesgos vigilados

- deriva visual entre la home actual y páginas públicas secundarias
- mantener copy interno, técnico o de demo en superficies públicas
- fallo de media remota sin fallback local
- confusión entre wholesale y vendor si el copy cambia sin criterio
- sobrecargar producción con experimentos visuales sin maintenance mode

## Cómo probar

### Desarrollo local

```bash
npm run dev:web
```

Luego abrir:

- `/`
- si se necesita revisar comportamiento histórico, abrir el código de `apps/web/features/storefront-v2-premium/`

### Formulario de vendedores

Abrir:

- `/trabaja-con-nosotros`

Enviar una postulación válida y verificar que la API responda con estado `queued`.

## Siguientes pasos

- migrar la home actual a la composición basada en Preline manteniendo navegación y contratos existentes
- hacer un segundo pase UX de nivel final para que home, catálogo, cuenta y checkout queden alineados visualmente
- sustituir placeholders editoriales por fotografía real optimizada del producto
- medir scroll depth y clics en CTAs ahora que la home oficial ya no expone variantes públicas
