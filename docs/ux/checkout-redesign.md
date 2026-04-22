# Rediseño de Checkout

## Objetivo

Documentar la consolidación visual y operativa del checkout público en `/checkout` sin romper reglas sensibles del flujo.

## Alcance del rediseño

La superficie pública de checkout ahora se presenta como un wizard de tres pasos:

1. pedido
2. datos y envío
3. pago y confirmación

El cambio consolida frontend y capa pública de API para mejorar identidad, dirección y trazabilidad sin redefinir el agregado `order`.

## Qué se mantiene intacto

- la cotización sigue viniendo de `fetchCheckoutQuote`
- la creación del pedido sigue usando `createManualCheckout` o `createOpenpayCheckout`
- el checkout sigue operado por Huelegood, no por un seller externo
- la validación de envío a provincia por `Shalom` se conserva
- el costo del flete en provincia sigue pagándose al recoger
- la evidencia del pago manual sigue subiendo desde el modal y se asocia al mismo request operativo
- el `clientRequestId` y la protección de idempotencia no cambian
- la resolución canónica final de clientes sigue viviendo en backend

## Decisiones UX implementadas

### Shell de checkout

- se reemplaza la vista larga de bloques apilados por un contenedor editorial con jerarquía clara
- se incorpora una barra de progreso visible
- cada paso expone una única intención principal para reducir fricción cognitiva
- el shell crece de ancho en desktop para evitar comprimir formularios en una columna demasiado angosta
- el header público acompaña ese ancho en desktop para que el marco superior y el shell del checkout se lean como una sola composición
- cada paso abre con una cabecera tipo guía que resume qué hacer y qué ya está listo
- la navegación de pasos se compacta y sube al costado del título para liberar altura útil en desktop
- se retira el bloque editorial de apertura para que el checkout aterrice directo al flujo
- el wizard usa la tipografía sans compartida del storefront para evitar quiebres visuales dentro del formulario
- en desktop el checkout pasa a priorizar una sola pantalla operativa:
  - se oculta el footer global en la ruta
  - se compactan paddings, headers y cards
  - el contenido principal usa scroll interno solo como fallback, no scroll de página
- el fondo del checkout se simplifica a un color continuo para evitar cortes visuales en la parte superior

### Resumen lateral

- el resumen del pedido queda persistente en desktop
- se muestran subtotal, envío, total y progreso de envío gratis cuando aplica
- el rail lateral ahora también ubica al usuario dentro del wizard y resume el modo de entrega activo
- el rail lateral comunica que la lógica sensible sigue anclada al flujo actual
- el rail se compacta:
  - deja de repetir tarjetas grandes de producto con imagen
  - elimina chips redundantes de paso y delivery en la cabecera del resumen
  - prioriza nombres, cantidades y total del pedido
  - cuando el pedido crece, muestra una vista previa corta y agrupa el resto de referencias en una sola fila resumida

### Entrega

- el selector de envío deja de ser un checkbox aislado y pasa a dos cards de decisión:
  - delivery en Lima y Callao
  - recojo en provincia por `Shalom`
- el copy del selector enfatiza que `Delivery` aplica para Lima y Callao, mientras `Shalom` queda para provincias
- el selector usa copy corto y una marca visual más evidente de selección obligatoria

Esto hace explícitas las diferencias operativas sin cambiar las reglas funcionales.

### Pedido

- el bloque `Agregar producto` mantiene un slider guiado de una referencia visible por vez
- la card activa se hace más angosta para no empujar el resto del paso 1 hacia abajo
- en desktop el selector de referencias comparte fila con el pedido actual para evitar apilar cards grandes una sobre otra
- el producto activo deja de truncarse agresivamente y prioriza nombre completo, foto y cantidad sobre labels secundarios
- el header del paso 1 elimina chips redundantes y deja la atención en el pedido activo y la navegación
- cada referencia del slider se muestra con imagen, nombre, precio e interacción mínima para sumar
- el slider conserva flechas y puntos de navegación, pero se vuelve más liviano:
  - sin card blanca contenedora
  - con título levemente más pequeño
  - con copy corto para reducir altura
  - con botón `+` compacto fuera de la columna principal del texto para proteger el ancho del nombre
- en desktop el paso 1 se compacta para entrar en una sola pantalla operativa sin scroll vertical

### Identidad y dirección

- el paso 2 ahora abre con identidad documental como primera tarea
- el paso 2 se reorganiza como una secuencia visual de cuatro tareas:
  - documento
  - entrega
  - ubicación
  - contacto
- el paso 2 evita repetir un resumen secundario debajo del header global para no consumir altura innecesaria
- el paso 2 deja de mostrar las cuatro tareas abiertas a la vez y pasa a una navegación guiada:
  - se ve una sección principal por vez
  - el usuario valida el documento y revisa el nombre en la misma sección antes de avanzar manualmente
  - el avance entre secciones usa el CTA naranja principal del checkout
  - puede volver o saltar a pasos ya habilitados desde la cabecera
- el documento es obligatorio en todo checkout, no solo en `Shalom`
- si el documento es `DNI`, el checkout valida contra `ApiPeru` desde backend y autocompleta el nombre
- si el documento es `CE`, pasaporte o similar, el nombre permanece editable manualmente
- el checkout intenta recuperar clientes previos por documento para precargar teléfono, email y dirección
- la dirección usa selects dependientes de ubigeo Perú: departamento, provincia y distrito
- cuando el modo es `Delivery`, el selector de ubigeo se limita a la provincia de Lima y Callao; no incluye otras provincias del departamento Lima
- si el modo es `Shalom`, se habilita el alcance nacional
- el campo libre de ubicación desaparece como origen de verdad y queda solo la dirección detallada como texto libre

### Pago manual

- el paso final evita repetir un resumen secundario debajo del header global para no gastar altura con información ya visible arriba
- el paso final refuerza que la UI vigente sigue cerrando con pago manual por `billetera virtual`
- el paso final vuelve a mostrar de forma visible el número y el titular de la billetera antes de abrir el modal
- el bloque de pago manual prioriza un CTA explícito de `Pagar ahora`; subir el comprobante queda como segundo paso
- el paso final añade acción de copiado rápido del número para reducir fricción al momento de pagar
- la pantalla final empuja de forma sutil a confirmar el pedido por WhatsApp con el número de orden ya visible
- las tarjetas de cierre usan copy comercial para cliente final y no exponen estados internos ni instrucciones operativas
- el CTA de WhatsApp queda por encima de acciones secundarias como seguir comprando
- el paso final elimina el bloque de notas opcionales para no consumir altura innecesaria
- el modal de comprobante se alinea al nuevo lenguaje visual
- no se expone una nueva variante de cobro solo por el rediseño

### Color

- el checkout deja de usar el verde bosque más oscuro como acento principal
- se alinea al verde real del logo de Huelegood para CTA, badges y bloques de pago
- el CTA principal para avanzar desde el paso 1 usa el naranja del pico del logo como énfasis puntual, mientras el verde queda reservado para progreso, estados y controles

## Motion

Se usa `gsap` de forma contenida para:

- entrada inicial del shell
- transición entre pasos
- animación de la barra de progreso
- entrada de la pantalla de éxito
- reveal sutil del bloque de identidad, nombre autocompletado y ubicación normalizada

La intención es reforzar jerarquía y feedback, no introducir animación ornamental.

## Restricciones de integración

- no crear rutas nuevas de preview
- no duplicar reglas de validación en capas separadas
- no mover lógica de pagos al frontend
- no introducir referencias de catálogo fuera de `Clásico Verde`, `Premium Negro` y `Combo Dúo Perfecto`

## Archivos principales

- `apps/web/components/checkout-workspace.tsx`
- `apps/web/components/yape-payment-modal.tsx`
- `apps/web/app/checkout/page.tsx`
