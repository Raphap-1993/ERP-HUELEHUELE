import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleCode, type AuthSessionSummary } from "@huelegood/shared";
import { AUTH_ROLES_KEY } from "./auth-rbac";
import { resolveSession } from "./auth-session";

interface AuthenticatedRequest {
  headers?: {
    authorization?: string | string[];
  };
  authSession?: AuthSessionSummary;
  authUser?: AuthSessionSummary["user"];
}

function normalizeAuthorizationHeader(value?: string | string[]) {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getRoleCodes(session: AuthSessionSummary) {
  return session.user.roles.map((role) => role.code);
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(AUTH_ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = normalizeAuthorizationHeader(request.headers?.authorization);
    const session =
      request.authSession ??
      (await resolveSession(authorization, {
        required: false
      }));

    if (!session) {
      throw new UnauthorizedException("Debes iniciar sesión para acceder a este recurso.");
    }

    const roleCodes = getRoleCodes(session);
    const isSuperAdmin = roleCodes.includes(RoleCode.SuperAdmin);
    const isAllowed = isSuperAdmin || requiredRoles.some((role) => roleCodes.includes(role));

    if (!isAllowed) {
      throw new ForbiddenException("Tu rol no tiene permisos para acceder a este recurso.");
    }

    request.authSession = session;
    request.authUser = session.user;
    return true;
  }
}
