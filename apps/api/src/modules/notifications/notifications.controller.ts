import { Body, Controller, Get, Post } from "@nestjs/common";
import { type NotificationInput } from "@huelegood/shared";
import { NotificationsService } from "./notifications.service";

@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications() {
    return this.notificationsService.listNotifications();
  }

  @Post()
  createNotification(@Body() body: NotificationInput) {
    return this.notificationsService.createNotification(body);
  }
}

@Controller("admin/notifications/logs")
export class NotificationLogsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listLogs() {
    return this.notificationsService.listLogs();
  }
}
