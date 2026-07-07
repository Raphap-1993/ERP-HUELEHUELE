import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminAccessRoles, type NotificationInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { NotificationsService } from "./notifications.service";

@RequireRoles(...adminAccessRoles.notifications)
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

@RequireRoles(...adminAccessRoles.notifications)
@Controller("admin/notifications/logs")
export class NotificationLogsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listLogs() {
    return this.notificationsService.listLogs();
  }
}
