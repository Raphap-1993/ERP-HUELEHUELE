# Plan De Implementacion Vigente

Fecha de corte: 2026-04-22.

## Estado

El frente ERP comercial/logistico esta implementado y validado tecnicamente. El trabajo inmediato ya no es construir desde cero, sino cerrar trazabilidad Git, validacion browser y siguientes decisiones de producto.

## Frentes Cerrados

- trazabilidad comercial en pedidos;
- alta y asignacion de vendedores;
- reportes por vendedor, producto, canal y filtros server-side;
- reserva, confirmacion, liberacion y reversa de stock;
- inventario por `variante + almacen`;
- almacenes y cobertura operativa;
- transferencias multi-almacen con incidencia y documentos;
- checkout robustecido con stock, DNI y evidencia Yape;
- despliegue productivo por releases;
- documentacion canonica rehecha.

## Fase Actual: Homologacion Git Y Cierre Operativo

1. Registrar en Git el snapshot local que ya coincide con produccion.
2. Excluir `outputs/`, `storage/`, dumps, backups y `.env`.
3. Publicar rama/PR o merge controlado para que GitHub refleje el estado real.
4. Validar manualmente en browser:
   - `/pedidos`
   - `/pagos`
   - `/reportes`
   - `/inventario`
   - `/transferencias`
5. Mantener evidencia en [06-validacion-y-pruebas.md](./06-validacion-y-pruebas.md).

## Siguiente Frente Recomendado

Elegir solo uno:

1. Automatizar E2E browser admin.
2. Completar webhook Openpay productivo.
3. Crear print-ready final de GRE/sticker.
4. Migrar snapshots heredados prioritarios a tablas Prisma.

## Validaciones Obligatorias

```bash
npm run typecheck
npm run test:erp-sales
npm run build
```

## Rollback

- Codigo: volver el symlink `current` a la release anterior y recargar PM2.
- Datos: solo con backup productivo validado.
- Nunca usar base local como rollback de produccion.
