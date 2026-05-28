# Reglas De Customers E Identity Conflicts

- `customers` es el agregado principal
- `/crm` es la superficie visible del slice
- `ventas` es owner operativo principal
- `marketing` tiene acceso operativo; `admin` y `super_admin` actuan como
  override
- la prioridad de identidad es `documento`, luego `email/telefono`, luego
  `nombre + direccion`
- los conflictos usan `open`, `resolved`, `ignored` y `merged`
- la resolucion operativa usa `assign_existing`, `merge` e `ignore`
- no se puede fusionar si ambos clientes ya tienen documentos canonicos
  distintos
- `orders` conserva snapshots historicos, `customerId`,
  `customerConflictId`, `crmStage` y `commercialTrace`
- clientes sinteticos o regularizados desde pedidos forman parte valida del
  runtime actual
- `deleteCustomer` existe como capacidad excepcional, no como flujo principal
