import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  adminAccessRoles,
  type AuthCredentialsInput,
  type AuthRegisterInput,
  type CommercialAccessCreateInput,
  type CommercialAccessResetPasswordInput,
  type CommercialAccessStatusInput,
  type CommercialAccessUpdateInput
} from "@huelegood/shared";
import { RequireRoles } from "./auth-rbac";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: AuthCredentialsInput) {
    return this.authService.login(body);
  }

  @Post("register")
  register(@Body() body: AuthRegisterInput) {
    return this.authService.register(body);
  }

  @Get("me")
  me(@Headers("authorization") authorization?: string) {
    return this.authService.me(authorization);
  }

  @Post("logout")
  logout(@Headers("authorization") authorization?: string) {
    return this.authService.logout(authorization);
  }
}

@RequireRoles(...adminAccessRoles.commercialAccesses)
@Controller("admin/commercial-accesses")
export class AdminCommercialAccessesController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  list() {
    return this.authService.listCommercialAccesses();
  }

  @Post()
  create(@Body() body: CommercialAccessCreateInput) {
    return this.authService.createCommercialAccess(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: CommercialAccessUpdateInput) {
    return this.authService.updateCommercialAccess(id, body);
  }

  @Post(":id/status")
  setStatus(@Param("id") id: string, @Body() body: CommercialAccessStatusInput) {
    return this.authService.setCommercialAccessStatus(id, body);
  }

  @Post(":id/suspend")
  suspend(@Param("id") id: string) {
    return this.authService.setCommercialAccessStatus(id, { status: "suspended" });
  }

  @Post(":id/reactivate")
  reactivate(@Param("id") id: string) {
    return this.authService.setCommercialAccessStatus(id, { status: "active" });
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string, @Body() body: CommercialAccessResetPasswordInput = {}) {
    return this.authService.resetCommercialAccessPassword(id, body);
  }
}
