# Product Design - Checkout Payments

## Objetivo

Documentar la intención de producto del checkout homologado sin rediseñar todo el storefront.

## Problema

El checkout ya opera en producción, pero su lógica de negocio, pagos manuales y futura frontera de gateway no estaban conectados a una narrativa de producto canónica.

## Decisión

- mantener el wizard público de tres pasos ya vigente;
- dejar `manual payment` como ruta visible hoy;
- ocultar cualquier superficie online hasta que exista proveedor real aprobado y operativo;
- separar visual y operativamente `Pagos` y `Pedidos > Operacion`.

## Señales de éxito

- el usuario entiende cómo terminar su compra manual;
- operación entiende dónde revisar comprobantes y dónde conciliar online;
- la capa canónica no contradice la experiencia viva del runtime.
