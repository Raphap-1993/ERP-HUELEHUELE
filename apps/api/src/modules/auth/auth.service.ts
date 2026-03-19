import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  RoleCode,
  type AuthCredentialsInput,
  type AuthRegisterInput,
  type AuthRoleSummary,
  type AuthSessionSummary,
  type AuthUserSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { parseAuthorizationToken, resolveSession as resolveStoredSession, revokeSession, storeSession } from "./auth-session";

type AccountType = AuthUserSummary["accountType"];

interface AuthRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType: AccountType;
  roles: AuthRoleSummary[];
}

const roleLabels: Record<RoleCode, string> = {
  [RoleCode.SuperAdmin]: "Super Admin",
  [RoleCode.Admin]: "Admin",
  [RoleCode.OperadorPagos]: "Operador de pagos",
  [RoleCode.Ventas]: "Ventas",
  [RoleCode.Marketing]: "Marketing",
  [RoleCode.SellerManager]: "Seller Manager",
  [RoleCode.Vendedor]: "Vendedor",
  [RoleCode.Cliente]: "Cliente"
};

const initialAccounts: AuthRecord[] = [
  {
    id: "usr-admin-001",
    name: "Admin Huelegood",
    email: "admin@huelegood.com",
    password: "huelegood123",
    accountType: "admin",
    roles: [RoleCode.SuperAdmin, RoleCode.Admin].map((code) => ({ code, label: roleLabels[code] }))
  },
  {
    id: "usr-seller-001",
    name: "Seller Demo",
    email: "seller@huelegood.com",
    password: "huelegood123",
    accountType: "seller",
    roles: [RoleCode.SellerManager, RoleCode.Vendedor].map((code) => ({ code, label: roleLabels[code] }))
  },
  {
    id: "usr-operator-001",
    name: "Operador de Pagos",
    email: "pagos@huelegood.com",
    password: "huelegood123",
    accountType: "operator",
    roles: [RoleCode.OperadorPagos].map((code) => ({ code, label: roleLabels[code] }))
  },
  {
    id: "usr-customer-001",
    name: "Cliente Demo",
    email: "cliente@huelegood.com",
    password: "huelegood123",
    accountType: "customer",
    roles: [RoleCode.Cliente].map((code) => ({ code, label: roleLabels[code] }))
  }
];

const accounts = new Map<string, AuthRecord>(initialAccounts.map((account) => [normalizeEmail(account.email), account]));

let userSequence = 5;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createSession(account: AuthRecord): AuthSessionSummary {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const session: AuthSessionSummary = {
    token,
    expiresAt,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      roles: account.roles,
      accountType: account.accountType
    }
  };

  storeSession(session);
  return session;
}

function ensureAccount(account?: AuthRecord) {
  if (!account) {
    throw new UnauthorizedException("Credenciales inválidas o sesión expirada.");
  }

  return account;
}

@Injectable()
export class AuthService {
  constructor(private readonly auditService: AuditService) {}

  resolveSession(authorization?: string | string[]) {
    return resolveStoredSession(authorization);
  }

  login(body: AuthCredentialsInput) {
    if (!body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException("Email y contraseña son obligatorios.");
    }

    const account = accounts.get(normalizeEmail(body.email));
    if (!account || account.password !== body.password) {
      throw new UnauthorizedException("No pudimos validar esas credenciales.");
    }

    const session = createSession(account);
    this.auditService.recordAudit({
      module: "auth",
      action: "login",
      entityType: "user",
      entityId: account.id,
      summary: "Inicio de sesión correcto.",
      actorUserId: account.id,
      actorName: account.name,
      payload: {
        accountType: account.accountType,
        email: account.email,
        roles: account.roles.map((role) => role.code)
      }
    });
    return wrapResponse(session, {
      accountType: account.accountType,
      roles: account.roles.map((role) => role.code)
    });
  }

  register(body: AuthRegisterInput) {
    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException("Nombre, email y contraseña son obligatorios.");
    }

    if (body.password.trim().length < 6) {
      throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
    }

    const email = normalizeEmail(body.email);
    if (accounts.has(email)) {
      throw new ConflictException("Ya existe una cuenta con ese email.");
    }

    const accountType = body.accountType ?? "customer";
    const roles =
      accountType === "seller"
        ? [RoleCode.Cliente, RoleCode.Vendedor, RoleCode.SellerManager]
        : [RoleCode.Cliente];

    const account: AuthRecord = {
      id: `usr-${String(userSequence).padStart(3, "0")}`,
      name: body.name.trim(),
      email,
      phone: body.phone?.trim() || undefined,
      password: body.password,
      accountType,
      roles: roles.map((code) => ({ code, label: roleLabels[code] }))
    };

    userSequence += 1;
    accounts.set(email, account);

    const session = createSession(account);
    this.auditService.recordAudit({
      module: "auth",
      action: "register",
      entityType: "user",
      entityId: account.id,
      summary: "Registro de cuenta completado.",
      actorUserId: account.id,
      actorName: account.name,
      payload: {
        accountType,
        email: account.email,
        roles: account.roles.map((role) => role.code)
      }
    });
    return wrapResponse(session, {
      created: true,
      roles: account.roles.map((role) => role.code)
    });
  }

  me(authorization?: string) {
    const session = this.resolveSession(authorization);
    if (!session) {
      return wrapResponse<AuthSessionSummary | null>(null, { authenticated: false });
    }

    return wrapResponse(session, {
      authenticated: true
    });
  }

  logout(authorization?: string) {
    const token = parseAuthorizationToken(authorization);
    const session = resolveStoredSession(authorization);
    if (token) {
      revokeSession(token);
    }

    if (session) {
      this.auditService.recordAudit({
        module: "auth",
        action: "logout",
        entityType: "session",
        entityId: session.token,
        summary: "Sesión cerrada correctamente.",
        actorUserId: session.user.id,
        actorName: session.user.name,
        payload: {
          email: session.user.email,
          accountType: session.user.accountType
        }
      });
    }

    return actionResponse("ok", "Sesión cerrada correctamente.");
  }

  seedDemoSession(email: string) {
    const account = ensureAccount(accounts.get(normalizeEmail(email)));
    const session = createSession(account);
    this.auditService.recordAudit({
      module: "auth",
      action: "seed_demo_session",
      entityType: "user",
      entityId: account.id,
      summary: "Sesión demo preparada para pruebas locales.",
      actorUserId: account.id,
      actorName: account.name,
      payload: {
        email: account.email,
        accountType: account.accountType
      }
    });
    return wrapResponse(session, {
      seeded: true
    });
  }
}
