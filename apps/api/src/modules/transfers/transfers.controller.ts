import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import {
  adminAccessRoles,
  type WarehouseTransferCancelInput,
  type WarehouseTransferCreateInput,
  type WarehouseTransferDispatchInput,
  type WarehouseTransferGuideInput,
  type WarehouseTransferPackageSnapshotInput,
  type WarehouseTransferReconcileInput,
  type WarehouseTransferReceiveInput,
  type WarehouseTransferStickerInput
} from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { TransfersService } from "./transfers.service";

@RequireRoles(...adminAccessRoles.transfers)
@Controller("admin/transfers")
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  async listTransfers() {
    return this.transfersService.listTransfers();
  }

  @Get(":id")
  async getTransfer(@Param("id") id: string) {
    const transfer = await this.transfersService.getTransfer(id);
    if (!transfer) {
      throw new NotFoundException(`Transferencia no encontrada: ${id}`);
    }

    return transfer;
  }

  @Post()
  async createTransfer(@Body() body: WarehouseTransferCreateInput) {
    return this.transfersService.createTransfer(body);
  }

  @Post(":id/dispatch")
  async dispatchTransfer(@Param("id") id: string, @Body() body: WarehouseTransferDispatchInput) {
    return this.transfersService.dispatchTransfer(id, body);
  }

  @Post(":id/receive")
  async receiveTransfer(@Param("id") id: string, @Body() body: WarehouseTransferReceiveInput) {
    return this.transfersService.receiveTransfer(id, body);
  }

  @Post(":id/cancel")
  async cancelTransfer(@Param("id") id: string, @Body() body: WarehouseTransferCancelInput) {
    return this.transfersService.cancelTransfer(id, body);
  }

  @Post(":id/reconcile")
  async reconcileTransfer(@Param("id") id: string, @Body() body: WarehouseTransferReconcileInput) {
    return this.transfersService.reconcileTransfer(id, body);
  }

  @Post(":id/package-snapshot")
  async createPackageSnapshot(@Param("id") id: string, @Body() body: WarehouseTransferPackageSnapshotInput) {
    return this.transfersService.createPackageSnapshot(id, body);
  }

  @Post(":id/gre")
  async createGre(@Param("id") id: string, @Body() body: WarehouseTransferGuideInput) {
    return this.transfersService.createGre(id, body);
  }

  @Post(":id/sticker")
  async createSticker(@Param("id") id: string, @Body() body: WarehouseTransferStickerInput) {
    return this.transfersService.createSticker(id, body);
  }
}
