import { BadRequestException, ConflictException, Injectable, OnModuleDestroy, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { LifecycleStatus, Prisma, VendorCodeStatus, VendorStatus } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import {
  RoleCode,
  type AuthCredentialsInput,
  type AuthRegisterInput,
  type AuthRoleSummary,
  type AuthSessionSummary,
  type AuthUserSummary
} from "@huelegood/shared";
import { isConfigured, isProductionRuntime } from "../../common/env";
import { actionResponse, wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ModuleStateService } from "../../persistence/module-state.service";
import { closeSessionStore, parseAuthorizationToken, resolveSession as resolveStoredSession, revokeSession, storeSession } from "./auth-session";

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

const accounts = new Map<string, AuthRecord>();

let userSequence = 5;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function createSession(account: AuthRecord): Promise<AuthSessionSummary> {
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

  await storeSession(session);
  return session;
}

const databaseAuthUserInclude = {
  roles: {
    include: {
      role: true
    }
  },
  admin: true,
  customer: true,
  vendor: {
    include: {
      profile: true,
      codes: {
        where: {
          status: VendorCodeStatus.active
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 1
      }
    }
  }
} satisfies Prisma.UserInclude;

type DatabaseAuthUser = Prisma.UserGetPayload<{
  include: typeof databaseAuthUserInclude;
}>;

function databaseAuthEnabled() {
  return isConfigured(process.env.DATABASE_URL);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("scrypt:")) {
    const [, salt, storedHash] = passwordHash.split(":");
    if (!salt || !storedHash) {
      return false;
    }

    const computedHash = scryptSync(password, salt, 64).toString("hex");
    if (computedHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(storedHash, "hex"));
  }

  if (passwordHash.startsWith("plain:")) {
    if (isProductionRuntime()) {
      return false;
    }

    return passwordHash.slice("plain:".length) === password;
  }

  if (isProductionRuntime()) {
    return false;
  }

  return passwordHash === password;
}

function isRoleCode(value: string): value is RoleCode {
  return (Object.values(RoleCode) as string[]).includes(value);
}

function resolveAccountType(roleCodes: readonly RoleCode[]): AccountType {
  if (roleCodes.includes(RoleCode.SuperAdmin) || roleCodes.includes(RoleCode.Admin)) {
    return "admin";
  }

  if (roleCodes.includes(RoleCode.OperadorPagos)) {
    return "operator";
  }

  if (roleCodes.includes(RoleCode.SellerManager) || roleCodes.includes(RoleCode.Vendedor)) {
    return "seller";
  }

  return "customer";
}

function splitDisplayName(value: string) {
  const normalized = value.trim();
  const [firstName, ...rest] = normalized.split(/\s+/).filter(Boolean);

  return {
    firstName: firstName || "Cliente",
    lastName: rest.join(" ") || "Huelegood"
  };
}

function resolveDisplayName(user: DatabaseAuthUser) {
  const adminName = user.admin?.displayName?.trim();
  if (adminName) {
    return adminName;
  }

  const vendorName = user.vendor?.profile?.displayName?.trim();
  if (vendorName) {
    return vendorName;
  }

  const customerName = [user.customer?.firstName, user.customer?.lastName].filter(Boolean).join(" ").trim();
  if (customerName) {
    return customerName;
  }

  return user.email;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    if (databaseAuthEnabled()) {
      return;
    }

    if (isProductionRuntime()) {
      throw new Error("DATABASE_URL must be configured in production for auth.");
    }

    const snapshot = await this.moduleStateService.load<AuthSnapshot>("auth");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
      return;
    }

    await this.persistState();
  }

  async onModuleDestroy() {
    await closeSessionStore();
  }

  async resolveSession(authorization?: string | string[]) {
    return resolveStoredSession(authorization);
  }

  async login(body: AuthCredentialsInput) {
    if (!body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException("Email y contraseña son obligatorios.");
    }

    if (databaseAuthEnabled()) {
      return this.loginWithDatabase(body);
    }

    const account = accounts.get(normalizeEmail(body.email));
    if (!account || account.password !== body.password) {
      throw new UnauthorizedException("No pudimos validar esas credenciales.");
    }

    const session = await createSession(account);
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

  async register(body: AuthRegisterInput) {
    if (!body.name?.trim() || !body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException("Nombre, email y contraseña son obligatorios.");
    }

    if (body.password.trim().length < 6) {
      throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
    }

    if (databaseAuthEnabled()) {
      return this.registerWithDatabase(body);
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

    const session = await createSession(account);
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

  async me(authorization?: string) {
    const session = await this.resolveSession(authorization);
    if (!session) {
      return wrapResponse<AuthSessionSummary | null>(null, { authenticated: false });
    }

    return wrapResponse(session, {
      authenticated: true
    });
  }

  async logout(authorization?: string) {
    const token = parseAuthorizationToken(authorization);
    const session = await resolveStoredSession(authorization);
    if (token) {
      await revokeSession(token);
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

  private async loginWithDatabase(body: AuthCredentialsInput) {
    const account = await this.findDatabaseAccount(body.email);
    if (!account || !verifyPassword(body.password, account.password)) {
      throw new UnauthorizedException("No pudimos validar esas credenciales.");
    }

    await this.touchLastLogin(account.id);

    const session = await createSession(account);
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

  private async registerWithDatabase(body: AuthRegisterInput) {
    const email = normalizeEmail(body.email);
    const existing = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw new ConflictException("Ya existe una cuenta con ese email.");
    }

    const accountType = body.accountType ?? "customer";
    const roleCodes =
      accountType === "seller"
        ? [RoleCode.Cliente, RoleCode.Vendedor, RoleCode.SellerManager]
        : [RoleCode.Cliente];
    const roles = await this.ensureRolesExist(roleCodes);
    const displayName = body.name.trim();
    const phone = body.phone?.trim() || undefined;
    const customerName = splitDisplayName(displayName);

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: hashPassword(body.password),
        status: LifecycleStatus.active,
        roles: {
          create: roles.map((role) => ({
            roleId: role.id
          }))
        },
        customer:
          accountType === "customer"
            ? {
                create: {
                  firstName: customerName.firstName,
                  lastName: customerName.lastName,
                  status: LifecycleStatus.active
                }
              }
            : undefined,
        vendor:
          accountType === "seller"
            ? {
                create: {
                  codePrefix: "VEND",
                  profile: {
                    create: {
                      displayName
                    }
                  },
                  codes: {
                    create: {
                      code: `VEND-${randomBytes(3).toString("hex").toUpperCase()}`,
                      status: VendorCodeStatus.active
                    }
                  }
                }
              }
            : undefined
      },
      include: databaseAuthUserInclude
    });

    const account = this.toAuthRecord(createdUser);
    let session: AuthSessionSummary;
    try {
      session = await createSession(account);
    } catch (error) {
      await this.rollbackRegisteredUser(createdUser.id, createdUser.vendor?.id);
      throw error;
    }

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

  private async ensureRolesExist(codes: readonly RoleCode[]) {
    return Promise.all(
      codes.map((code) =>
        this.prisma.role.upsert({
          where: { code },
          update: {
            name: roleLabels[code],
            isSystem: true
          },
          create: {
            code,
            name: roleLabels[code],
            isSystem: true
          }
        })
      )
    );
  }

  private async touchLastLogin(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date()
        }
      });
    } catch {
      // keep login non-blocking even if the audit field cannot be updated
    }
  }

  private async rollbackRegisteredUser(userId: string, vendorId?: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        if (vendorId) {
          await tx.vendor.deleteMany({
            where: {
              id: vendorId
            }
          });
        }

        await tx.user.deleteMany({
          where: {
            id: userId
          }
        });
      });
    } catch (error) {
      console.warn("[auth] no pudimos revertir el alta tras fallar la sesión", error);
    }
  }

  private async findDatabaseAccount(email: string): Promise<AuthRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizeEmail(email)
      },
      include: databaseAuthUserInclude
    });

    if (!user || user.status !== LifecycleStatus.active) {
      return null;
    }

    return this.toAuthRecord(user);
  }

  private toAuthRecord(user: DatabaseAuthUser): AuthRecord {
    const roleCodes = user.roles.flatMap((userRole) => (isRoleCode(userRole.role.code) ? [userRole.role.code] : []));

    return {
      id: user.id,
      name: resolveDisplayName(user),
      email: user.email,
      phone: user.phone ?? undefined,
      password: user.passwordHash,
      accountType: resolveAccountType(roleCodes),
      roles: buildRoles(roleCodes),
      vendorCode: user.vendor?.codes[0]?.code
    };
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
}
