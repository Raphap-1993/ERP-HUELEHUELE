import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { MediaModule } from "../media/media.module";
import { AdminCmsController } from "./admin-cms.controller";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";

@Module({
  imports: [AuditModule, MediaModule],
  controllers: [CmsController, AdminCmsController],
  providers: [CmsService],
  exports: [CmsService]
})
export class CmsModule {}
