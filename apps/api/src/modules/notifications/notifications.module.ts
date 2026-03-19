import { Module } from "@nestjs/common";
import { AdminNotificationsController, NotificationLogsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [AdminNotificationsController, NotificationLogsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
