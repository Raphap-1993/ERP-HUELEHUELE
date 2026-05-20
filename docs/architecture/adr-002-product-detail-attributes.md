# ADR-002 Product Detail Attributes

Fecha: 2026-04-24.

## Estado

Aprobado.

## Contexto

El catálogo actual ya soporta:

- producto base con copy corto y largo;
- variantes vendibles con `sku`, precio, stock y atributos mínimos como `flavor` y `presentation`;
- imágenes por producto y variante;
- bundles por componentes.

Faltaba una forma sana y quirúrgica de enriquecer la ficha pública del producto con detalles editoriales simples como:

- `Aromas`
- `Ideal para`
- `Incluye`
- `Presentación`

Si esos datos se resolvían con columnas nuevas por caso, el modelo iba a endurecerse rápido. Si se resolvían dentro de `longDescription`, se perdía estructura, reuso en UI y trazabilidad operativa.

## Decisión

Se agrega a `products` un campo opcional `detailAttributesJson` con una lista ordenada de pares:

```json
[
  { "label": "Aromas", "value": "Mentolado intenso con nota herbal fresca" },
  { "label": "Ideal para", "value": "Viajes, altura y trayectos largos" }
]
```

Reglas:

- vive a nivel `product`, no a nivel `variant`;
- es opcional;
- se expone como `detailAttributes` en contratos `admin` y `store`;
- el backoffice permite editarlo como filas `Etiqueta / Valor`;
- el storefront lo renderiza solo en el PDP;
- no reemplaza `flavor` ni `presentation`;
- no define filtros, reglas de pricing ni semántica analítica.

## Consecuencias

Positivas:

- agrega flexibilidad real a la ficha del producto sin multiplicar columnas;
- mantiene compatibilidad hacia atrás porque el campo es opcional;
- permite empezar por casos concretos como `Aromas` para `Premium Negro`.

Límites deliberados:

- no resuelve taxonomía configurable de atributos de variante;
- no modela filtros estructurados de catálogo;
- no debe usarse para reglas transaccionales ni de inventario.

## Implementación

- `prisma/schema.prisma`: `Product.detailAttributesJson`
- `apps/api/src/modules/products/products.service.ts`: normalización, persistencia y mapping
- `apps/admin/components/products-workspace.tsx`: edición en backoffice
- `apps/web/app/producto/[slug]/page.tsx`: render del bloque en PDP
- `prisma/demo-content.ts` y `prisma/seed.ts`: datos demo iniciales
