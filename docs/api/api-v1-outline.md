# API v1 Vigente

Base productiva: `https://api.huelegood.com/api/v1`.

La API se separa por superficie:

- `/store`: storefront publico.
- `/admin`: backoffice.
- `/seller`: panel vendedor autenticado.
- `/auth`: sesiones compartidas por web y admin.
- `/health`: salud operativa.

Las respuestas siguen el patron:

```json
{
  "data": {},
  "meta": {}
}
```

## Health

- `GET /health/liveness`
- `GET /health/readiness`
- `GET /health/operational`

## Store

### Auth Publico Y Comercial

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

Reglas:

- `POST /auth/register` solo puede crear cliente final.
- Vendedores y mayoristas reciben credenciales desde backoffice, no por auto-registro publico.

#### `GET /auth/me`

Uso canonico:

- resolver la sesion compartida para storefront publico autenticado, portal comercial y admin
- exponer el contrato efectivo de autorizacion sin duplicar logica en frontend

Contrato relevante:

```json
{
  "data": {
    "token": "session-token",
    "expiresAt": "2026-06-18T12:00:00.000Z",
    "user": {
      "id": "usr_123",
      "name": "Admin Huelegood",
      "email": "admin@huelegood.com",
      "roles": [{ "code": "admin", "label": "Admin" }],
      "primaryRoleCode": "admin",
      "accountType": "admin",
      "surfaces": ["internal_admin"],
      "effectivePermissions": [
        {
          "permissionCode": "security.roles.read",
          "scopes": ["all"],
          "sources": ["role:admin"]
        }
      ]
    }
  },
  "meta": {
    "authenticated": true
  }
}
```

Reglas:

- si no existe sesion valida, responde `data: null` con `meta.authenticated=false`
- `effectivePermissions[]` es la fuente canonica para gates de UI cuando exista; `roles[]` queda como compatibilidad transicional
- `surfaces[]` define si el usuario puede entrar a `internal_admin`, `authenticated_portal` o ambas
- `vendorCode` y `wholesaleLeadId` solo aparecen cuando aplican al canal comercial

### Catalogo Y CMS

- `GET /store/cms`
- `GET /store/catalog`
- `GET /store/site-settings`
- `GET /store/navigation`
- `GET /store/pages/:slug`
- `GET /store/faqs`
- `GET /store/banners`
- `GET /store/testimonials`
- `GET /store/categories`
- `GET /store/products`
- `GET /store/products/:slug`

Contratos que bloquean UX publico:

#### `GET /store/site-settings`

Uso canonico:

- branding runtime del shell publico
- assets globales del header, loading y favicon
- configuracion comercial minima de checkout

Campos que UX debe tratar como estables:

| Campo | Uso en UX |
| --- | --- |
| `brandName` | nombre visible de marca |
| `tagline` | claim corto si el shell lo necesita |
| `featuredProductSlugs[]` | curacion del home y railes destacados |
| `supportEmail` | soporte y contacto |
| `whatsapp` | CTA de contacto |
| `shippingFlatRate` | costo base de envio |
| `freeShippingThreshold` | progreso o mensaje de envio gratis |
| `yapeNumber` | pago manual |
| `walletType` | nombre comercial del medio manual |
| `walletOwnerName` | titular del cobro manual |
| `headerLogoUrl` | logo publico principal |
| `heroProductImageUrl` | arte principal del hero cuando aplique |
| `loadingImageUrl` | pantalla de carga publica |
| `faviconUrl` | icono del sitio |

Reglas:

- este endpoint no define precios, stock, SKU ni merchandising de producto
- `featuredProductSlugs[]` cura presencia y orden; no reemplaza `products` como fuente de verdad

#### `GET /store/cms`

Uso canonico:

- snapshot publico para contenido editorial
- evita que la web tenga que pedir `hero`, `navigation`, `banners`, `faqs` y `testimonials` por separado

Contrato de alto nivel:

```json
{
  "data": {
    "siteSetting": {},
    "heroCopy": {},
    "webNavigation": [],
    "banners": [],
    "faqs": [],
    "pages": [],
    "testimonials": [],
    "seoMeta": []
  },
  "meta": {
    "totalPages": 0,
    "totalBanners": 0,
    "totalFaqs": 0,
    "totalTestimonials": 0
  }
}
```

Notas de filtrado publico:

- `banners`, `faqs` y `testimonials` salen solo con `status=active`
- `pages` excluye `archived`; puede incluir `draft` si el runtime las consume de forma explicita
- `webNavigation` es la navegacion publica completa y evita hardcodear menus en la UI

Campos relevantes para UX:

- `heroCopy.eyebrow`, `title`, `description`, `primaryCta`, `secondaryCta`
- `webNavigation[].title` e `items[].label/href/external`
- `banners[].title/description/ctaLabel/ctaHref/note/tone`
- `faqs[].question/answer/category`
- `pages[].slug/title/description/blocks[]/seoMeta`
- `testimonials[].name/role/quote/rating/kind/coverImageUrl`

#### `GET /store/catalog`

Uso canonico:

- fuente principal de catalogo para home, catalogo y rails curados
- responde productos, categorias y filtros aplicados en una sola carga

Query params soportados:

- `search`
- `category`
- `featuredOnly=true|false`

Contrato de alto nivel:

```json
{
  "data": {
    "products": [],
    "categories": [],
    "currencyCode": "PEN",
    "filters": {
      "search": "premium",
      "category": "productos",
      "featuredOnly": false
    }
  },
  "meta": {
    "total": 0,
    "categories": 0
  }
}
```

Campos de `CatalogProduct` que UX publico ya consume:

- identidad: `id`, `name`, `slug`, `categorySlug`, `categoryName`
- merchandising: `tagline`, `description`, `badge`, `tone`, `benefits[]`, `isFeatured`
- venta: `price`, `compareAtPrice`, `currencyCode`, `sku`
- media: `imageUrl`, `imageAlt`
- compra: `defaultVariantId`, `variantCount`, `availableStock`, `stockStatus`, `stockLabel`, `isPurchasable`

Reglas:

- catalogo publico no debe depender de `shared/mock-data` en produccion
- si un producto no es comprable, la UI debe degradar CTA y stock sin inventar disponibilidad

#### `GET /store/products/:slug`

Uso canonico:

- detalle publico de un producto vendible o visible
- base del PDP y del selector de variantes

Campos que bloquean UX:

- todo lo de `CatalogProduct`
- `detailAttributes[]` para ficha publica de detalle
- `variants[]` con `id`, `sku`, `name`, `flavorLabel`, `presentationLabel`, `price`, `compareAtPrice`, `status`, `availableStock`, `stockStatus`, `stockLabel`, `isPurchasable`
- `images[]` con `url`, `altText`, `sortOrder`, `isPrimary`, `variantId`
- `bundleComponents[]` cuando el producto es bundle

Reglas:

- el checkout reserva por `variantId` cuando existe mas de una variante
- un PDP puede existir aunque el CTA quede deshabilitado por `isPurchasable=false` o `stockStatus=out_of_stock`
- `detailAttributes[]` es editorial de ficha, no taxonomia de inventario

Regla puntual de producto:

- `GET /store/products/:slug` puede devolver `detailAttributes[]` como lista opcional de pares `label/value` para la ficha pública.
- `GET /store/products/:slug` puede devolver variantes con `flavorLabel` y `presentationLabel`; el checkout reserva stock por `variantId`, no solo por `slug`.

### Checkout

- `POST /store/checkout/quote`
- `POST /store/checkout/document-lookup`
- `GET /store/checkout/ubigeo/departments`
- `GET /store/checkout/ubigeo/provinces/:departmentCode`
- `GET /store/checkout/ubigeo/districts/:provinceCode`
- `POST /store/checkout/openpay`
- `POST /store/checkout/manual`
- `POST /store/checkout/evidence`

#### `POST /store/checkout/quote`

Uso canonico:

- recalcular subtotal, descuento, flete y total sin crear pedido
- validar variante seleccionada antes del submit final

Input minimo:

```json
{
  "items": [
    {
      "slug": "premium-negro",
      "variantId": "var-premium-negro-30",
      "quantity": 1
    }
  ],
  "paymentMethod": "manual",
  "vendorCode": "SELLER001",
  "couponCode": "BIENVENIDA",
  "shipping": {
    "deliveryMode": "standard",
    "carrier": "olva_courier"
  }
}
```

Respuesta de negocio:

```json
{
  "data": {
    "items": [],
    "subtotal": 40,
    "discount": 0,
    "shipping": 49,
    "grandTotal": 89,
    "currencyCode": "PEN",
    "vendorCode": "SELLER001",
    "couponCode": "BIENVENIDA",
    "paymentMethod": "manual",
    "estimatedPoints": 1
  },
  "meta": {
    "calculatedAt": "2026-06-08T00:00:00.000Z"
  }
}
```

Campos que UX debe usar:

- por linea: `slug`, `name`, `sku`, `variantId`, `quantity`, `unitPrice`, `lineTotal`, `imageUrl`, `inventoryAllocations[]`
- por total: `subtotal`, `discount`, `shipping`, `grandTotal`, `currencyCode`
- contexto comercial: `vendorCode`, `couponCode`, `paymentMethod`, `estimatedPoints`

Reglas:

- `province_shalom_pickup` deja `shipping=0` en el total online
- si cambia `variantId`, la UI debe volver a cotizar
- quote no crea pedido ni reserva definitiva

#### `POST /store/checkout/document-lookup`

Uso canonico:

- precarga identidad y datos previos del cliente durante el paso documental

Contrato util:

- input: `documentType`, `documentNumber`
- output: `officialIdentity?` y `customer?`

Reglas:

- `dni` consulta primero cliente canonico y luego `ApiPeru` si no existe match
- `ce`, `passport`, `ruc` y `other_sunat` no prometen identidad oficial equivalente a `dni`

#### Ubigeo publico

- `GET /store/checkout/ubigeo/departments`
- `GET /store/checkout/ubigeo/provinces/:departmentCode`
- `GET /store/checkout/ubigeo/districts/:provinceCode`

Uso canonico:

- selector dependiente de departamento, provincia y distrito
- `standard` se restringe a Lima/Callao desde la UI
- `province_shalom_pickup` habilita cobertura nacional

Reglas:

- toda compra exige documento valido.
- DNI consulta primero cliente canonico y luego ApiPeru si aplica.
- `province_shalom_pickup` exige carrier/sucursal y deja flete fuera del total online.
- checkout usa idempotencia para no duplicar pedido ni stock.

### Formularios Comerciales

- `POST /store/vendor-applications`
- `POST /store/wholesale-leads`
- `GET /store/wholesale-tiers`

### Cuenta, Fidelizacion Y Panel Comercial

- `GET /store/me/loyalty`
- `GET /seller/panel/overview`

## Admin

### Auth Y Dashboard

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /admin/dashboard/overview`

Reglas:

- el admin ya no debe derivar autorizacion operativa solo desde `roles[]`; consume `effectivePermissions[]` cuando existen
- una sesion sin `surfaces` que incluya `internal_admin` no debe acceder a rutas del backoffice aunque conserve compatibilidad legacy

### Seguridad Y Gobernanza De Acceso

- `GET /admin/security`
- `GET /admin/security/catalog`
- `GET /admin/security/roles`
- `POST /admin/security/roles`
- `PATCH /admin/security/roles/:id`
- `POST /admin/security/users/:id/roles`
- `POST /admin/security/users/:id/overrides`
- `PATCH /admin/security/navigation`

Uso canonico:

- `GET /admin/security` expone postura operativa del API para auditoria, rate limits y telemetria de seguridad
- `GET /admin/security/catalog` devuelve catalogos de permisos, scopes, modulos y navegacion gobernada
- `roles` administra catalogo asignable y grants por scope
- `users/:id/roles` y `users/:id/overrides` gobiernan permisos efectivos por usuario
- `PATCH /admin/security/navigation` ajusta visibilidad y orden de los modulos registrados

Reglas:

- lectura del modulo exige `security.roles.read`
- creacion y edicion de roles o navegacion exige `security.roles.manage`
- asignacion de roles a usuario exige `security.users.manage`
- creacion de overrides exige `security.overrides.manage`
- los roles sistema no deben eliminarse ni renombrarse desde este surface

### Productos, CMS Y Media

- `GET /admin/media/assets`
- `GET /admin/cms`
- `GET /admin/cms/site-settings`
- `PATCH /admin/cms/site-settings`
- `POST /admin/cms/site-settings/logo`
- `POST /admin/cms/site-settings/admin-sidebar-logo`
- `POST /admin/cms/site-settings/hero-image`
- `POST /admin/cms/site-settings/loading-image`
- `POST /admin/cms/site-settings/favicon`
- `GET /admin/cms/hero-copy`
- `PATCH /admin/cms/hero-copy`
- `GET /admin/cms/navigation`
- `PATCH /admin/cms/navigation`
- `GET /admin/cms/pages`
- `GET /admin/cms/pages/:slug`
- `PATCH /admin/cms/pages/:slug`
- `PATCH /admin/cms/pages/:slug/blocks`
- `GET /admin/cms/banners`
- `POST /admin/cms/banners`
- `PATCH /admin/cms/banners/:id`
- `GET /admin/cms/faqs`
- `POST /admin/cms/faqs`
- `PATCH /admin/cms/faqs/:id`
- `GET /admin/cms/testimonials`
- `POST /admin/cms/testimonials`
- `PATCH /admin/cms/testimonials/:id`
- `GET /admin/products/categories`
- `GET /admin/products`
- `GET /admin/products/:id`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/archive`
- `POST /admin/products/:id/images`
- `DELETE /admin/products/:id/images/:imageId`

Reglas:

- el backoffice formaliza `archive-only` para productos con historial comercial; no existe borrado destructivo expuesto por API.
- `badge`, `tone` y `benefits` viven en `products`; la home solo cura orden y presencia via `siteSetting.featuredProductSlugs[]`.

Regla puntual de producto:

- `GET /admin/products/:id`, `POST /admin/products` y `PATCH /admin/products/:id` aceptan y devuelven `detailAttributes[]` como lista opcional de detalles visibles en la ficha pública del producto.

### Clientes

- `GET /admin/customers`
- `GET /admin/customers/conflicts`
- `GET /admin/customers/:id`
- `POST /admin/customers`
- `PATCH /admin/customers/:id`
- `POST /admin/customers/merge`
- `POST /admin/customers/conflicts/:id/resolve`
- `DELETE /admin/customers/:id`

### Pedidos

- `GET /admin/orders`
- `GET /admin/orders/vendor-options`
- `POST /admin/orders`
- `GET /admin/orders/:orderNumber`
- `POST /admin/orders/:orderNumber/status`
- `POST /admin/orders/:orderNumber/vendor`
- `POST /admin/orders/:orderNumber/manual-payment`
- `POST /admin/orders/:orderNumber/confirm-online-payment`
- `POST /admin/orders/:orderNumber/resend-approval-email`
- `DELETE /admin/orders/:orderNumber`

### Fulfillment Y Despacho

- `GET /admin/orders/:orderNumber/fulfillment`
- `POST /admin/orders/:orderNumber/fulfillment/suggest`
- `POST /admin/orders/:orderNumber/fulfillment`
- `GET /admin/orders/:orderNumber/dispatch-label`
- `POST /admin/orders/:orderNumber/dispatch-label/print`

Reglas:

- sugerencia no reserva ni muta por si sola.
- asignacion valida cobertura y stock.
- si cambia el origen, inventario recompone reservas.

### Inventario Y Almacenes

- `GET /admin/inventory/report`
- `POST /admin/inventory/stock-adjustments`
- `GET /admin/warehouses`
- `GET /admin/warehouses/:id`
- `POST /admin/warehouses`
- `PATCH /admin/warehouses/:id`
- `DELETE /admin/warehouses/:id`

Reglas:

- reporte lee por `variante + almacen`.
- ajustes manuales deben quedar auditables.
- no usar ajustes como sustituto de transferencias fisicas.

### Transferencias

- `GET /admin/transfers`
- `GET /admin/transfers/:id`
- `POST /admin/transfers`
- `POST /admin/transfers/:id/dispatch`
- `POST /admin/transfers/:id/receive`
- `POST /admin/transfers/:id/cancel`
- `POST /admin/transfers/:id/reconcile`
- `POST /admin/transfers/:id/package-snapshot`
- `POST /admin/transfers/:id/gre`
- `POST /admin/transfers/:id/sticker`

Reglas:

- `create` reserva stock en origen.
- `dispatch` descuenta origen.
- `receive` ingresa destino.
- recepcion parcial abre incidencia.
- `reconcile` cierra incidencia sin corregir balances manualmente.

### Pagos

- `GET /admin/payments`
- `GET /admin/payments/manual-requests`
- `POST /admin/payments/manual-requests/:id/approve`
- `POST /admin/payments/manual-requests/:id/reject`

### Reportes

- `GET /admin/reports`
- `GET /admin/reports/export`

Filtros:

- `from`
- `to`
- `salesChannel`
- `vendorCode`
- `productSlug`
- `sku`

Reglas:

- estados validos de venta viven en `packages/shared/src/domain/order-lifecycle.ts`.
- ventas, detalle y CSV usan el mismo scope server-side.

### Vendedores Y Comisiones

- `GET /admin/vendors`
- `POST /admin/vendors`
- `PATCH /admin/vendors/:id`
- `GET /admin/vendor-applications`
- `POST /admin/vendor-applications/:id/screen`
- `POST /admin/vendor-applications/:id/approve`
- `POST /admin/vendor-applications/:id/reject`
- `GET /admin/commercial-accesses`
- `POST /admin/commercial-accesses`
- `PATCH /admin/commercial-accesses/:id`
- `POST /admin/commercial-accesses/:id/status`
- `POST /admin/commercial-accesses/:id/reset-password`
- `GET /admin/commissions`
- `GET /admin/commission-payouts`
- `POST /admin/commission-payouts`

### Panel Vendedor

- `GET /seller/panel/overview`

Reglas:

- requiere sesion con rol `vendedor` o `seller_manager`.
- la cuenta debe tener `vendorCode` resoluble para mostrar ventas, comisiones y liquidaciones.

### Mayoristas, Marketing, Loyalty Y Notificaciones

- `GET /admin/wholesale-leads`
- `POST /admin/wholesale-leads/:id/status`
- `GET /admin/wholesale-quotes`
- `POST /admin/wholesale-quotes`
- `GET /admin/wholesale-tiers`
- `GET /admin/marketing`
- `POST /admin/marketing/campaigns`
- `GET /admin/loyalty`
- `GET /admin/notifications`

## Reglas De Contrato

- Admin requiere roles desde `adminAccessRoles`.
- Store no debe exponer endpoints administrativos.
- Todas las mutaciones sensibles deben registrar auditoria o trazabilidad equivalente.
- Endpoints nuevos deben actualizar este documento en el mismo PR/commit.
