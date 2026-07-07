# Home TikTok CMS Curated Design

## Objetivo

Agregar al home publico de Huele Huele una seccion de videos de TikTok curados desde el backoffice, manteniendo el nuevo lenguaje visual verde, usando contenido real administrable y evitando cargar integraciones pesadas en el primer render.

## Decision aprobada

La integracion sera **curada desde CMS/backoffice**. El equipo de Huele Huele elige manualmente los videos mas virales o mas utiles para venta, carga la URL de TikTok, una portada real, texto corto y orden de aparicion.

No se implementa en esta fase una sincronizacion automatica con TikTok API ni scraping de TikTok.

## Alcance

- Mostrar una nueva seccion en el home publico, despues del bloque de productos y antes del bloque mayorista.
- Leer los videos desde el snapshot CMS ya disponible en `StorefrontGameHome`.
- Usar solo testimonios activos con `kind = social` y `socialPlatform = tiktok`.
- Usar `coverImageUrl` como imagen principal del card, siempre que sea media administrada por Huele Huele o una ruta local compatible con el loader actual.
- Usar `socialUrl` como destino del CTA.
- Ordenar por `position`.
- Renderizar hasta 5 items totales; en desktop la grilla prioriza 3 cards visibles y deja el resto como continuidad responsive/overflow segun layout.
- Ocultar la seccion por completo si no existen videos TikTok activos con URL y portada.
- Mantener copy breve y directo, sin explicar de mas.

## Fuera de alcance

- TikTok Display API, OAuth, jobs de sincronizacion o tokens.
- Ranking automatico por vistas, likes o engagement.
- Reproduccion inline obligatoria dentro del home.
- Nuevo modelo Prisma para videos sociales.
- Redisenar el modulo CMS completo.

## Arquitectura

### Fuente de datos

El API CMS ya soporta testimonios sociales con:

- `kind`
- `socialPlatform`
- `socialUrl`
- `coverImageUrl`
- `quote`
- `name`
- `role`
- `position`
- `status`

`apps/web/components/storefront-game-home.tsx` ya llama `fetchCmsSnapshot()`. La implementacion debe derivar de `cms.testimonials` una lista de videos TikTok aptos para home.

Esta fase es frontend-only: no agrega Prisma, no cambia API, no rediseña admin y no crea un modulo nuevo de videos. `StorefrontGameHome` debe pasar los items TikTok ya derivados hacia `HueleHomeExperience`.

### Mapeo de item publico

Cada card de video debe exponer:

- `id`: id del testimonial.
- `title`: preferir `name`; fallback corto desde `quote`.
- `caption`: preferir `quote` recortado; fallback vacio.
- `platformLabel`: siempre `TikTok`.
- `subcopy`: preferir `role`; fallback vacio.
- `href`: `socialUrl`.
- `imageUrl`: `coverImageUrl`.
- `position`: `position`.

Los items incompletos se descartan si falta `href` o `imageUrl`.

## UX

### Ubicacion

La seccion se coloca despues de `hh-products-section` y antes de `hh-seller-band`, para funcionar como prueba social antes de pedir al usuario comprar o vender.

### Contenido

Copy sugerido:

- Kicker: `TikTok real`
- Titulo: `Lo que mas se esta viendo.`
- Texto breve: `Momentos reales de frescura, directo desde la comunidad Huele Huele.`

El texto no debe sonar tecnico ni administrativo.

### Layout desktop

- Fondo verde oscuro de la pagina, con un panel o banda integrada al ritmo actual del home.
- Header compacto a la izquierda y cards verticales a la derecha o debajo segun espacio.
- 3 cards principales visibles en desktop, con hasta 5 items renderizados si el espacio y el responsive lo permiten.
- Cards con proporcion vertical tipo video corto.
- Portada real ocupando casi todo el card.
- Overlay inferior con titulo corto, etiqueta TikTok y boton `Ver video`.
- Motion suave: hover con leve elevacion, brillo tenue y play icon.

### Layout mobile

- Header arriba.
- Cards en carrusel horizontal con scroll-snap; puede mostrar hasta 5 items.
- Cada card mantiene proporcion vertical.
- CTA tactil grande y legible.
- Sin texto superpuesto que tape el producto/persona de la portada.

## Comportamiento

- Click en card o CTA abre `socialUrl` en nueva pestana con `target="_blank"` y `rel="noreferrer"`.
- No se carga script de TikTok en el primer render.
- Si en el futuro se agrega embed bajo demanda, debe activarse solo despues de click/modal, no al cargar la pagina.
- Si el CMS falla o no hay videos aptos, no se muestra fallback falso.

## Accesibilidad

- La seccion debe tener `aria-labelledby`.
- Cada card debe tener texto alternativo derivado del titulo.
- Los links deben tener nombre accesible claro: `Ver video de TikTok: {title}`.
- El carrusel mobile debe poder desplazarse sin depender de botones invisibles.

## Performance

- Usar `next/image` con el loader existente para media remota cuando aplique.
- Descartar portadas externas no compatibles con el loader/configuracion actual en lugar de romper el render.
- Definir `sizes` y dimensiones estables para evitar layout shift.
- Limitar a maximo 5 imagenes.
- Evitar cargar embeds o scripts externos de TikTok en el home inicial.

## Pruebas

- Unit test de mapeo/filtrado: un item valido requiere `status = active`, `kind = social`, `socialPlatform = tiktok`, `socialUrl` y `coverImageUrl`; listas vacias o incompletas ocultan la seccion.
- Visual contract test: el home debe contener la nueva seccion cuando hay videos validos.
- Smoke manual local en `/`: verificar que el home no muestra la seccion con lista vacia y que la muestra con datos CMS validos.
- Verificar responsive desktop/mobile con screenshot o Playwright si se toca layout significativo.

## Riesgos

- Si el backoffice no carga portadas, la seccion no aparece. Esto es intencional para evitar placeholders falsos.
- Si TikTok cambia el formato de URL, el home sigue estable porque solo abre el link externo.
- Si se quiere "mas viral" automatico real, se debe abrir una fase 2 con TikTok API, app review, OAuth y job de sincronizacion.

## Criterios de aceptacion

- El home renderiza una seccion TikTok solo con contenido real del CMS.
- No hay vectores ni placeholders para videos.
- No hay textos largos ni duplicados.
- La seccion respeta el estilo verde/off-white del home actual.
- Desktop y mobile se ven balanceados.
- TypeScript y pruebas relevantes pasan.
