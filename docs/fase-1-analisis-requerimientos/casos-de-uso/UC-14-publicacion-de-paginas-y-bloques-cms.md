# UC-14 Publicacion De Paginas Y Bloques CMS

## Objetivo

Formalizar la publicacion editorial de paginas conocidas y de sus bloques
tipados dentro del CMS real de Huele Huele.

## Actores

- marketing
- cms

## Precondiciones

- la pagina pertenece a una ruta conocida del slice
- `marketing` tiene permisos para editar y publicar CMS
- la ruta solo acepta bloques tipados compatibles con su contrato editorial

## Flujo principal

1. `marketing` edita una ruta conocida del CMS.
2. Define titulo, descripcion y estado editorial de la pagina.
3. Asigna, ordena o marca `active/inactive` bloques tipados compatibles con esa
   ruta.
4. Registra `seoMeta` con `title`, `description`, `keywords`,
   `canonicalPath` y `robots`.
5. La pagina queda `draft`, `published` o `archived`.
6. `cms` persiste la estructura editorial y el SEO por ruta.

## Reglas canonicas

- solo existen las rutas conocidas `home`, `catalogo`, `mayoristas`,
  `trabaja-con-nosotros`, `cuenta` y `checkout`
- los bloques permitidos dependen de la ruta conocida y no son arbitrarios
- los bloques de pagina usan `active/inactive` solo como bandera de render
  dentro de la pagina; no reemplazan `draft/published/archived`
- `promo-banner` y `faq` consumen colecciones compartidas activas; no crean una
  segunda fuente de verdad
- `published` habilita consumo publico; `archived` sale de la vista publica
- `checkout` y `cuenta` pueden operar con `noindex,nofollow`

## Resultado esperado

Cada pagina conocida del CMS queda gobernada por un ciclo editorial claro, con
bloques compatibles, SEO por ruta y sin abrir composicion libre de paginas.
