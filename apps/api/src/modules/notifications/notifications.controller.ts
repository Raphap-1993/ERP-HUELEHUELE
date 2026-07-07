import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminModulePermissions, type NotificationInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { NotificationsService } from "./notifications.service";

@RequirePermissions(...adminModulePermissions.notifications.read)
@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications() {
    return this.notificationsService.listNotifications();
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.notifications.manage!)
  createNotification(@Body() body: NotificationInput) {
    return this.notificationsService.createNotification(body);
  }
}

@RequirePermissions(...adminModulePermissions.notifications.read)
@Controller("admin/notifications/logs")
export class NotificationLogsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listLogs() {
    return this.notificationsService.listLogs();
  }
}
