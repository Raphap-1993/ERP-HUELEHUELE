import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminNotificationsController, NotificationLogsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AuditModule],
  controllers: [AdminNotificationsController, NotificationLogsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
