# GLOSSARY

> Glosario operativo del proyecto. Evita mezclar el dominio comercial de
> Huelegood con el lenguaje metodologico del brownfield.

## Terminos del framework
| Termino | Definicion |
|---|---|
| Brownfield | Formalizacion de un sistema ya vivo sin fingir que empieza desde cero. |
| Backfill | Crear despues del hecho un artefacto canonico que el proyecto ya necesitaba para gobernarse. |
| Fase 0-8 | Secuencia metodologica desde iniciacion hasta operacion. |
| Gate | Punto de control que impide cerrar una fase si no existe evidencia confiable. |
| Trazabilidad | Cadena minima entre objetivo de negocio, documento, codigo y evidencia operativa. |
| Fuente de verdad | Documento o codigo que prevalece si aparecen versiones contradictorias. |

## Terminos del dominio
| Termino | Definicion |
|---|---|
| Huelegood | Marca y experiencia comercial operada por la plataforma. |
| `ERP-HUELEHUELE` | Monorepo y nombre operativo del sistema que sostiene el negocio. |
| Storefront | Superficie publica donde viven home, catalogo, checkout, cuenta y panel vendedor. |
| Backoffice | Superficie administrativa para pedidos, pagos, catalogo, inventario, CMS, CRM y observabilidad. |
| Seller-first | Enfoque donde el canal de vendedores es central para captacion y atribucion, sin convertirlo en marketplace. |
| Pago manual | Pago con comprobante que requiere revision operativa antes de aprobarse o rechazarse. |
| Openpay | Pasarela online actual documentada para cobro transaccional. |
| Mayorista | Lead o cuenta comercial con necesidades de compra por volumen y tratamiento diferenciado. |
| Loyalty / puntos | Capa basica de fidelizacion con acumulacion, movimientos y canjes controlados. |
| `module_snapshots` | Persistencia heredada usada por algunos modulos que aun no terminan migracion completa a tablas normalizadas. |

## Formas recomendadas
| Evitar | Usar |
|---|---|
| "proyecto nuevo" | brownfield o producto vivo |
| "home" a secas | storefront o portada publica |
| "panel" a secas | panel vendedor o backoffice |
| "web" para todo | storefront, admin, API o worker segun corresponda |
