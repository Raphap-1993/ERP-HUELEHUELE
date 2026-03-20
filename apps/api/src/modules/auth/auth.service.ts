import { BadRequestException, ConflictException, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
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
import { ModuleStateService } from "../../persistence/module-state.service";
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
  vendorCode?: string;
}

interface AuthSnapshot {
  accounts: AuthRecord[];
  userSequence: number;
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

function buildRoles(codes: RoleCode[]) {
  return codes.map((code) => ({ code, label: roleLabels[code] }));
}

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function bootstrapEnv(name: string, fallback: string) {
  const value = envValue(name);
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production.`);
  }

  return fallback;
}

function createBootstrapAccounts(): AuthRecord[] {
  return [
    {
      id: "usr-admin-001",
      name: bootstrapEnv("BOOTSTRAP_ADMIN_NAME", "Admin Huelegood"),
      email: bootstrapEnv("BOOTSTRAP_ADMIN_EMAIL", "admin@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_ADMIN_PASSWORD", "huelegood123"),
      accountType: "admin",
      roles: buildRoles([RoleCode.SuperAdmin, RoleCode.Admin])
    },
    {
      id: "usr-seller-014",
      name: bootstrapEnv("BOOTSTRAP_SELLER_NAME", "Mónica Herrera"),
      email: bootstrapEnv("BOOTSTRAP_SELLER_EMAIL", "monica@seller.com"),
      password: bootstrapEnv("BOOTSTRAP_SELLER_PASSWORD", "huelegood123"),
      accountType: "seller",
      roles: buildRoles([RoleCode.SellerManager, RoleCode.Vendedor]),
      vendorCode: bootstrapEnv("BOOTSTRAP_SELLER_VENDOR_CODE", "VEND-014")
    },
    {
      id: "usr-operator-001",
      name: bootstrapEnv("BOOTSTRAP_PAYMENTS_NAME", "Operador de Pagos"),
      email: bootstrapEnv("BOOTSTRAP_PAYMENTS_EMAIL", "pagos@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_PAYMENTS_PASSWORD", "huelegood123"),
      accountType: "operator",
      roles: buildRoles([RoleCode.OperadorPagos])
    },
    {
      id: "usr-customer-001",
      name: bootstrapEnv("BOOTSTRAP_CUSTOMER_NAME", "Cliente Huelegood"),
      email: bootstrapEnv("BOOTSTRAP_CUSTOMER_EMAIL", "cliente@huelegood.com"),
      password: bootstrapEnv("BOOTSTRAP_CUSTOMER_PASSWORD", "huelegood123"),
      accountType: "customer",
      roles: buildRoles([RoleCode.Cliente])
    }
  ];
}

const initialAccounts: AuthRecord[] = createBootstrapAccounts();

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
      accountType: account.accountType,
      vendorCode: account.vendorCode
    }
  };

  storeSession(session);
  return session;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService
  ) {}

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<AuthSnapshot>("auth");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    }

    const changed = this.ensureOperationalAccounts();
    if (snapshot && !changed) {
      return;
    }

    await this.persistState();
  }

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
      roles: roles.map((code) => ({ code, label: roleLabels[code] })),
      vendorCode: undefined
    };

    userSequence += 1;
    accounts.set(email, account);
    void this.persistState();

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

  private restoreSnapshot(snapshot: AuthSnapshot) {
    accounts.clear();
    for (const account of snapshot.accounts ?? []) {
      accounts.set(normalizeEmail(account.email), account);
    }

    userSequence = Math.max(snapshot.userSequence ?? userSequence, 1);
  }

  private async persistState() {
    await this.moduleStateService.save<AuthSnapshot>("auth", this.buildSnapshot());
  }

  private buildSnapshot(): AuthSnapshot {
    return {
      accounts: Array.from(accounts.values()).map((account) => ({
        ...account,
        roles: account.roles.map((role) => ({ ...role }))
      })),
      userSequence
    };
  }

  private ensureOperationalAccounts() {
    let changed = false;

    for (const seed of initialAccounts) {
      const key = normalizeEmail(seed.email);
      const current =
        Array.from(accounts.values()).find((account) => account.id === seed.id) ??
        accounts.get(key);

      if (!current) {
        accounts.set(key, {
          ...seed,
          roles: seed.roles.map((role) => ({ ...role }))
        });
        changed = true;
        continue;
      }

      const next: AuthRecord = {
        ...seed,
        phone: current.phone,
        roles: seed.roles.map((role) => ({ ...role })),
        vendorCode: seed.vendorCode
      };

      const currentKey = normalizeEmail(current.email);

      if (
        current.email !== next.email ||
        current.name !== next.name ||
        current.password !== next.password ||
        current.accountType !== next.accountType ||
        current.vendorCode !== next.vendorCode ||
        JSON.stringify(current.roles) !== JSON.stringify(next.roles)
      ) {
        if (currentKey !== key) {
          accounts.delete(currentKey);
        }

        accounts.set(key, next);
        changed = true;
      } else if (currentKey !== key) {
        accounts.delete(currentKey);
        accounts.set(key, next);
        changed = true;
      }
    }

    return changed;
  }
}
