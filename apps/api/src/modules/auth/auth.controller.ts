import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AuthCredentialsInput, AuthRegisterInput } from "@huelegood/shared";

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
