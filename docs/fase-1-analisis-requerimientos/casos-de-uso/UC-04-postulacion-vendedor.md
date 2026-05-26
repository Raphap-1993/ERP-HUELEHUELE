# UC-04 Postulacion Vendedor

## Objetivo

Formalizar la captura publica y el onboarding controlado de un vendedor dentro
del canal seller-first de Huele Huele.

## Actores

- postulante
- web publica
- API Huelegood
- seller_manager
- admin
- notificaciones

## Precondiciones

- `/trabaja-con-nosotros` esta publicado
- existe politica minima de validacion comercial
- la creacion de credenciales sigue siendo responsabilidad de backoffice

## Flujo principal

1. El postulante completa `/trabaja-con-nosotros`.
2. La API crea `vendor_application` en estado `submitted`.
3. Se registra confirmacion de recepcion.
4. `seller_manager` revisa identidad, contacto y contexto comercial.
5. La postulacion pasa a `screening`.
6. Si se aprueba, se crea o vincula `vendor`.
7. Se define `preferredCode` o se genera `vendorCode`.
8. Si corresponde, se crea acceso comercial para `/cuenta`.
9. El vendedor queda habilitado para `/panel-vendedor`.

## Reglas canonicas

- la postulacion publica no equivale a alta comercial automatica
- no se emite `vendorCode` sin aprobacion previa
- no se crea cuenta comercial por auto-registro desde storefront
- la aprobacion debe dejar actor, fecha y razon operativa

## Resultado esperado

El seller channel gana un flujo de entrada trazable y auditable, donde el alta
del vendedor sigue controlada por operacion.
