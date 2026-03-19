import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BullMqService } from "./bullmq.service";
import { ModuleStateService } from "./module-state.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ModuleStateService, BullMqService],
  exports: [ModuleStateService, BullMqService]
})
export class PersistenceModule {}
