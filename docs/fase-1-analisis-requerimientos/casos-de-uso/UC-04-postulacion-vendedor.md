# UC-04 Postulacion Vendedor

## Actores
- postulante
- seller_manager
- admin

## Flujo principal
1. el postulante completa `/trabaja-con-nosotros`
2. la API crea `vendor_application`
3. seller_manager revisa identidad, contacto y contexto comercial
4. si aprueba, se crea o vincula `vendor`
5. se define `preferredCode` o se genera `vendorCode`
6. si corresponde, se crea acceso comercial y se habilita `/panel-vendedor`
