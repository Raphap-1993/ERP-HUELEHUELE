# Normalización y Dedupe de Clientes

## Objetivo

Definir una estrategia consistente para materializar, normalizar, deduplicar y fusionar clientes en Huelegood sin romper el snapshot histórico del pedido ni la operación actual del monorepo.

## Estado implementado en abril 2026

La fase operativa mínima ya quedó implementada en el repo:

- `orders` resuelve `customerId` al crear o rehidratar pedidos y lo persiste dentro del snapshot operativo.
- `customers` dejó de materializar perfiles desde el read-path de CRM.
- existe una tabla `customer_identity_conflicts` para ambigüedades fuertes entre documento, email o teléfono.
- CRM ya puede listar conflictos abiertos, resolverlos y ejecutar fusiones manuales.
- la fusión mueve referencias operativas al cliente destino y marca el cliente fuente como `merged`.
- el checkout público consulta primero coincidencias canónicas por `documentType + documentNumber` antes de crear el pedido para precargar contacto y dirección y evitar duplicidad.
- cuando el documento es `DNI`, la capa pública del checkout solo depende de `ApiPeru` si no existe una coincidencia local previa.

Limitaciones vigentes:

- el sistema aún no implementa una tabla de alias como `customer_identities`.
- cuando dos clientes fusionados tienen emails o teléfonos reales distintos, solo uno puede quedar como valor canónico directo por las restricciones actuales del modelo.
- el snapshot histórico del pedido conserva sus datos originales; la asociación canónica vive aparte.

## Contexto actual del repo

La documentación vigente define que:

- `customers` es el perfil persistido del cliente y el dedupe principal debe priorizar identidad documental cuando exista.
- `orders` debe conservar snapshot histórico de cliente, dirección y líneas.
- cuando existe documento, la resolución del cliente debe priorizar `documentType + documentNumber`; si no existe, se usan `email` y luego `phone` como señales secundarias.

Hoy el repositorio implementa una variante híbrida:

- `customers` y `users` sí viven en PostgreSQL.
- `orders` operativos se leen desde `module_snapshots.orders`, no desde `orders.customer_id`.
- el materializado de clientes ocurre a posteriori desde snapshots de pedidos en `CustomersService`.
- el matching actual usa claves fuertes y también heurísticas débiles generadas en aplicación:
  - `doc:{documentType}:{documentNumber}`
  - `email:{normalizedEmail}`
  - `phone-name:{phone}:{normalizedName}`
  - `name-address:{normalizedName}:{line1}:{city}:{region}:{countryCode}`
  - fallback por `phone`
  - fallback extremo por `order:{orderNumber}`
- cuando no hay email real, se crea un email sintético `guest+hash@customers.huelegood.local`.

Conclusión:

- la deduplicación actual depende demasiado de identidad derivada en la capa de aplicación
- la base de datos no guarda una noción explícita de alias o identidad canónica
- el merge real de clientes no existe como operación de dominio
- la relación `orders.customer_id` modelada en Prisma todavía no es la fuente operativa real

Implicación operativa vigente:

- el checkout ya puede reutilizar la identidad documental como primera señal visible para el cliente, aun cuando la materialización canónica profunda siga ocurriendo al sincronizar `orders` hacia `customers`

## Hallazgos principales

### 1. La identidad canónica no está persistida como tal

El schema actual tiene:

- `users.email @unique`
- `users.phone @unique`
- `customers @@unique([documentType, documentNumber])`

Eso ayuda, pero no resuelve:

- unicidad case-insensitive real del email a nivel DB
- normalización fuerte del teléfono
- dimensión país para documentos
- alias históricos o claves secundarias
- trazabilidad de merge

### 2. El matching actual mezcla señales fuertes y débiles

Las señales fuertes son correctas para auto-link:

- documento normalizado
- email real normalizado
- teléfono normalizado

Las señales débiles no deberían auto-mergear sin revisión:

- `phone + normalized name`
- `normalized name + address`
- nombre completo solo

Estas señales pueden servir para sugerir coincidencias, pero no para consolidar identidad canónica sin intervención.

### 3. El uso de emails sintéticos resuelve materialización, no identidad

El email sintético actual es útil para cumplir el modelo `users <-> customers`, pero no debe tratarse como clave canónica. Sirve como placeholder técnico mientras no exista email real o login del cliente.

### 4. El repo todavía no puede hacer merge relacional completo

Como los pedidos operativos se leen desde `module_snapshots.orders`, no existe hoy una FK operativa dominante `orders.customer_id` sobre la cual hacer un merge transaccional completo. Por eso el diseño mínimo viable debe asumir:

- merge principalmente sobre `customers`, `users`, direcciones y futuras cuentas asociadas
- preservación del snapshot histórico del pedido
- resolución por alias para asociar pedidos históricos al cliente canónico

## Claves canónicas de identidad

## Orden de precedencia recomendado

### 1. Documento

Clave canónica fuerte:

- `doc:{countryCode}:{documentType}:{documentNumberNormalized}`

Reglas:

- es la mejor señal de identidad para auto-link
- si existe conflicto documental, no se debe fusionar automáticamente
- en Perú, `countryCode` puede default a `PE`, pero el modelo debe guardarlo explícitamente

### 2. Email real

Clave canónica fuerte condicionada:

- `email:{emailNormalized}`

Reglas:

- solo aplica para email real
- no aplica para emails sintéticos `@customers.huelegood.local`
- debe ser case-insensitive y trim-safe a nivel DB

### 3. Teléfono

Clave canónica fuerte condicionada:

- `phone:{phoneNormalized}`

Reglas:

- debe almacenarse en formato normalizado estable, idealmente `E.164`
- si el checkout local aún no garantiza `E.164`, al menos debe existir `phoneNormalized` consistente y único
- colisiones de teléfono con documento distinto deben ir a revisión

### 4. Alias heurísticos

Claves secundarias solo para sugerencia:

- `phone-name:{phoneNormalized}:{normalizedName}`
- `name-address:{normalizedName}:{normalizedAddressFingerprint}`

Reglas:

- no deben ser únicas a nivel del cliente final
- no deben auto-mergear
- sí pueden alimentar un módulo de revisión de duplicados

## Restricciones e índices recomendados

## Recomendación general

Para este dominio conviene mover la unicidad desde valores crudos hacia columnas normalizadas persistidas. Así Prisma puede expresar la mayor parte de la integridad sin depender de índices funcionales opacos.

## Columnas recomendadas

### `users`

- `emailNormalized String`
- `phoneNormalized String?`

Mantener:

- `email` como valor de presentación / login
- `phone` como valor capturado original o presentado

### `customers`

- `documentCountryCode String?`
- `documentType String?`
- `documentNumber String?`
- `documentNumberNormalized String?`
- `fullNameNormalized String?`
- `mergedIntoCustomerId String?`
- `mergeStatus CustomerMergeStatus`

### Nueva tabla `customer_identities`

Campos recomendados:

- `id UUID`
- `customerId UUID`
- `keyType CustomerIdentityKeyType`
- `normalizedValue String`
- `displayValue String?`
- `isPrimary Boolean`
- `isVerified Boolean`
- `source CustomerIdentitySource`
- `confidence Int?`
- `firstSeenAt DateTime`
- `lastSeenAt DateTime`
- `supersededAt DateTime?`

Enums recomendados:

- `CustomerIdentityKeyType = document | email | phone | phone_name | name_address`
- `CustomerIdentitySource = admin | checkout | sync_from_order | import | merge`
- `CustomerMergeStatus = active | merged`

## Restricciones Prisma recomendadas

### MVP compatible con Prisma

```prisma
model User {
  id              String   @id @default(uuid()) @db.Uuid
  email           String
  emailNormalized String   @unique
  phone           String?
  phoneNormalized String?  @unique
  // ...
}

model Customer {
  id                       String   @id @default(uuid()) @db.Uuid
  userId                   String   @unique @db.Uuid
  documentCountryCode      String?
  documentType             String?
  documentNumber           String?
  documentNumberNormalized String?
  fullNameNormalized       String?
  mergedIntoCustomerId     String?  @db.Uuid
  mergeStatus              CustomerMergeStatus @default(active)
  // ...

  @@unique([documentCountryCode, documentType, documentNumberNormalized])
  @@index([fullNameNormalized])
  @@index([mergedIntoCustomerId])
}

model CustomerIdentity {
  id              String   @id @default(uuid()) @db.Uuid
  customerId      String   @db.Uuid
  keyType         CustomerIdentityKeyType
  normalizedValue String
  displayValue    String?
  isPrimary       Boolean  @default(false)
  isVerified      Boolean  @default(false)
  source          CustomerIdentitySource
  confidence      Int?
  firstSeenAt     DateTime @default(now())
  lastSeenAt      DateTime @default(now())
  supersededAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([keyType, normalizedValue])
  @@index([customerId, isPrimary])
  @@index([customerId, keyType])
}
```

## Índices PostgreSQL recomendados

Si se quiere máxima dureza en PostgreSQL, además del schema Prisma conviene:

- índice único case-insensitive para email si no se usa columna `emailNormalized`
- índice parcial único para teléfono normalizado no nulo
- índice parcial único para documento cuando todos los componentes estén presentes
- índice por `mergedIntoCustomerId`
- índice por `customer_identities(customer_id, key_type)`
- índice único por `(key_type, normalized_value)` sobre identidades activas

## Estrategia de merge y conflictos

## Política recomendada

### Auto-link permitido

Permitir consolidación automática solo cuando ocurre alguna de estas condiciones:

- mismo documento normalizado
- mismo email real normalizado
- mismo teléfono normalizado y no existe documento conflictivo
- misma cuenta `userId` ya vinculada

### Solo sugerencia, no auto-merge

No consolidar automáticamente por:

- nombre completo solo
- nombre + dirección
- teléfono + nombre
- email sintético

Estas señales deben generar candidatos de revisión.

## Selección de registro sobreviviente

Cuando sí se fusiona, el `survivor` debe elegirse con esta prioridad:

1. cliente con documento
2. cliente con email real
3. cliente con teléfono normalizado
4. cliente con más relaciones operativas materializadas
5. cliente más antiguo

## Datos que deben migrarse al survivor

- alias de identidad
- direcciones no duplicadas
- `marketingOptIn` por OR conservador
- `userId` si el survivor no tiene uno mejor
- referencias relacionales futuras: loyalty, redemptions, carts, campaign recipients, etc.

## Datos que NO deben mutarse

- snapshots históricos de pedidos
- logs/auditoría históricos
- payloads de notificaciones históricas

## Registro de conflictos

Toda fusión debe persistir:

- `survivorCustomerId`
- `mergedCustomerId`
- `mergedByUserId`
- `reason`
- `conflictSnapshotJson`
- `createdAt`

Conflictos típicos que deben ir a revisión manual:

- mismo email, distinto documento
- mismo teléfono, distinto documento
- documento ya tomado por cliente con email real distinto
- upgrade de email real contra otro `user` ya existente

## Diseño óptimo target

## Objetivo

Hacer de `customers` la identidad comercial canónica, y de `users` la identidad autenticable opcional.

## Diseño recomendado

- `customers` como entidad raíz comercial
- `users` como entidad de autenticación, ligada de forma opcional o 1:1 controlada
- `customer_identities` como tabla de alias/verificaciones
- `orders.customerId` resuelto al crear pedido
- snapshot histórico del pedido intacto
- `customer_merge_events` para trazabilidad
- proceso de resolución síncrono en checkout y admin
- módulo de revisión de duplicados con candidatos heurísticos

## Beneficios

- integridad de identidad explícita en BD
- menos dependencia de heurísticas en memoria
- merge auditable
- reporting y CRM consistentes
- posibilidad real de historiales por cliente sin recomputar desde snapshots

## Diseño mínimo viable para este repo

## Principios

- no romper el flujo actual basado en `module_snapshots.orders`
- no exigir una migración inmediata de todos los pedidos a tablas relacionales
- mejorar dedupe antes de re-arquitecturar por completo `orders`

## MVP recomendado

1. agregar columnas normalizadas en `users` y `customers`
2. agregar tabla `customer_identities`
3. cambiar `CustomersService` para auto-link solo por:
   - documento
   - email real
   - teléfono normalizado
4. mover `phone-name` y `name-address` a modo `candidate`, no `auto-match`
5. registrar merge en tabla `customer_merge_events` o, como mínimo, `admin_actions` + `audit_logs`
6. conservar snapshots de pedidos sin reescritura masiva
7. resolver asociación histórica de pedidos por:
   - alias fuertes en `customer_identities`
   - y solo secundariamente por heurísticas revisables

## Qué no intentaría en el MVP

- reescribir todos los pedidos del snapshot a tablas `orders` reales
- desacoplar completamente `customers` de `users` en el mismo cambio
- auto-mergear por nombre/dirección
- usar email sintético como clave de negocio

## Cambios concretos mínimos

- `User.emailNormalized`
- `User.phoneNormalized`
- `Customer.documentCountryCode`
- `Customer.documentNumberNormalized`
- `Customer.fullNameNormalized`
- nueva tabla `CustomerIdentity`
- revisión de `syncCustomersFromOrders` para bajar agresividad de merge

## Riesgos si no se corrige

- perfiles distintos fusionados por heurística débil
- mismo cliente duplicado por diferencias de formato
- CRM e historial comercial inconsistentes
- dificultad creciente para loyalty, marketing y recontacto
- migración futura a `orders.customerId` mucho más costosa

## Decisión recomendada

Para Huelegood, la identidad canónica debe ser:

1. documento normalizado si existe
2. email real normalizado si no existe documento
3. teléfono normalizado si no existe documento ni email real

Todo lo demás debe operar como alias heurístico o candidato de revisión, no como clave final de merge.
