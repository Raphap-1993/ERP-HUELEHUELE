import { Module } from "@nestjs/common";
import { AdminCmsController } from "./admin-cms.controller";
import { CmsController } from "./cms.controller";
import { CmsService } from "./cms.service";

@Module({
  controllers: [CmsController, AdminCmsController],
  providers: [CmsService],
  exports: [CmsService]
})
export class CmsModule {}
