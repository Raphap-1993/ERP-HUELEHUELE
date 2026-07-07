import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { LifecycleStatus, Prisma, VendorCodeStatus } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import {
  RoleCode,
  type AuthCredentialsInput,
  type AuthRegisterInput,
  type AuthRoleSummary,
  type AuthSessionSummary,
  type AuthUserSummary,
  type CommercialAccessAccountType,
  type CommercialAccessCreateInput,
  type CommercialAccessResetPasswordInput,
  type CommercialAccessStatus,
  type CommercialAccessStatusInput,
  type CommercialAccessSummary,
  type CommercialAccessUpdateInput
} from "@huelegood/shared";
import { isConfigured, isProductionRuntime } from "../../common/env";
import { actionResponse, wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ModuleStateService } from "../../persistence/module-state.service";
import {
  closeSessionStore,
  parseAuthorizationToken,
  resolveSession as resolveStoredSession,
  revokeSession,
  revokeSessionsForUser,
  storeSession
} from "./auth-session";

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
  wholesaleLeadId?: string;
  status?: CommercialAccessStatus;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthSnapshot {
  accounts: AuthRecord[];
  userSequence: number;
}

interface CommercialAccessMetadata {
  userId: string;
  name: string;
  email: string;
  accountType: CommercialAccessAccountType;
  phone?: string;
  vendorCode?: string;
  wholesaleLeadId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CommercialAccessesSnapshot {
  records: CommercialAccessMetadata[];
}

const roleLabels: Record<RoleCode, string> = {
  [RoleCode.SuperAdmin]: "Super Admin",
  [RoleCode.Admin]: "Admin",
  [RoleCode.OperadorPagos]: "Operador de pagos",
  [RoleCode.Ventas]: "Ventas",
  [RoleCode.Marketing]: "Marketing",
  [RoleCode.SellerManager]: "Seller Manager",
  [RoleCode.Vendedor]: "Vendedor",
  [RoleCode.Mayorista]: "Mayorista",
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

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeStatus(value?: string): CommercialAccessStatus {
  if (value === "inactive" || value === "suspended") {
    return value;
  }

  return "active";
}

function parseCommercialAccessStatus(value?: string): CommercialAccessStatus {
  if (value === "active" || value === "inactive" || value === "suspended") {
    return value;
  }

  throw new BadRequestException("Estado de acceso comercial inválido.");
}

function toLifecycleStatus(status: CommercialAccessStatus) {
  if (status === "suspended") {
    return LifecycleStatus.suspended;
  }

  if (status === "inactive") {
    return LifecycleStatus.inactive;
  }

  return LifecycleStatus.active;
}

function normalizeCommercialAccountType(value?: string): CommercialAccessAccountType {
  return value === "wholesale" ? "wholesale" : "seller";
}

function normalizeVendorCode(value?: string) {
  return normalizeOptionalText(value)?.toUpperCase();
}

function generateTemporaryPassword() {
  return `HH-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function commercialRolesFor(accountType: CommercialAccessAccountType) {
  return accountType === "wholesale" ? [RoleCode.Cliente, RoleCode.Mayorista] : [RoleCode.Cliente, RoleCode.Vendedor];
}

function isInternalBackofficeRole(code: RoleCode) {
  return (
    code === RoleCode.SuperAdmin ||
    code === RoleCode.Admin ||
    code === RoleCode.OperadorPagos ||
    code === RoleCode.Ventas ||
    code === RoleCode.Marketing ||
    code === RoleCode.SellerManager
  );
}

function isCommercialAccess(account: AuthRecord) {
  const roleCodes = account.roles.map((role) => role.code);
  return roleCodes.includes(RoleCode.Vendedor) || roleCodes.includes(RoleCode.Mayorista);
}

function toCommercialAccessSummary(account: AuthRecord): CommercialAccessSummary {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    accountType: account.accountType === "wholesale" ? "wholesale" : "seller",
    status: normalizeStatus(account.status),
    roles: account.roles,
    vendorCode: account.vendorCode,
    wholesaleLeadId: account.wholesaleLeadId,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

function envOrFallback(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
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
      vendorCode: account.vendorCode,
      wholesaleLeadId: account.wholesaleLeadId
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

  if (roleCodes.includes(RoleCode.Mayorista)) {
    return "wholesale";
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

function seedLocalAdminAccount() {
  const email = normalizeEmail(envOrFallback("BOOTSTRAP_ADMIN_EMAIL", "admin@huelegood.com"));

  accounts.set(email, {
    id: "dev-admin-local",
    name: envOrFallback("BOOTSTRAP_ADMIN_NAME", "Admin Huelegood"),
    email,
    password: envOrFallback("BOOTSTRAP_ADMIN_PASSWORD", "huelegood123"),
    accountType: "admin",
    roles: buildRoles([RoleCode.SuperAdmin, RoleCode.Admin])
  });
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

    if (accounts.size === 0) {
      seedLocalAdminAccount();
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
    if (!account || account.password !== body.password || normalizeStatus(account.status) !== "active") {
      throw new UnauthorizedException("No pudimos validar esas credenciales.");
    }

    account.lastLoginAt = new Date().toISOString();
    account.updatedAt = account.lastLoginAt;
    void this.persistState();

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

    if ((body.accountType ?? "customer") !== "customer") {
      throw new BadRequestException("Los accesos comerciales se crean desde backoffice.");
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

  async listCommercialAccesses() {
    if (databaseAuthEnabled()) {
      return this.listCommercialAccessesFromDatabase();
    }

    const accesses = Array.from(accounts.values())
      .filter((account) => isCommercialAccess(account))
      .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""))
      .map((account) => toCommercialAccessSummary(account));

    return wrapResponse(accesses, {
      total: accesses.length,
      active: accesses.filter((access) => access.status === "active").length,
      suspended: accesses.filter((access) => access.status === "suspended").length
    });
  }

  async createCommercialAccess(body: CommercialAccessCreateInput) {
    if (!body.name?.trim() || !body.email?.trim()) {
      throw new BadRequestException("Nombre y email son obligatorios.");
    }

    const accountType = normalizeCommercialAccountType(body.accountType);
    const email = normalizeEmail(body.email);
    const temporaryPassword = normalizeOptionalText(body.password) ?? generateTemporaryPassword();

    if (temporaryPassword.length < 6) {
      throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
    }

    if (accountType === "seller" && !normalizeVendorCode(body.vendorCode)) {
      throw new BadRequestException("Debes asociar un código de vendedor para crear el acceso.");
    }

    if (accountType === "wholesale" && !normalizeOptionalText(body.wholesaleLeadId)) {
      throw new BadRequestException("Debes asociar un lead mayorista para crear el acceso.");
    }

    if (databaseAuthEnabled()) {
      return this.createCommercialAccessWithDatabase({ ...body, email, accountType }, temporaryPassword);
    }

    const existingAccount = accounts.get(email);
    if (existingAccount) {
      if (isCommercialAccess(existingAccount)) {
        throw new ConflictException("Ese email ya tiene un acceso comercial. Edita el acceso existente o resetea la clave.");
      }

      const existingRoleCodes = existingAccount.roles.map((role) => role.code);
      if (existingRoleCodes.some((role) => isInternalBackofficeRole(role))) {
        throw new BadRequestException("Ese email pertenece a un usuario interno. Usa otro email para el acceso comercial.");
      }

      const now = new Date().toISOString();
      const mergedRoleCodes = Array.from(new Set([...existingRoleCodes, ...commercialRolesFor(accountType)]));
      existingAccount.name = body.name.trim();
      existingAccount.phone = normalizeOptionalText(body.phone) ?? existingAccount.phone;
      existingAccount.password = temporaryPassword;
      existingAccount.accountType = accountType;
      existingAccount.roles = buildRoles(mergedRoleCodes);
      existingAccount.vendorCode = accountType === "seller" ? normalizeVendorCode(body.vendorCode) : undefined;
      existingAccount.wholesaleLeadId = accountType === "wholesale" ? normalizeOptionalText(body.wholesaleLeadId) : undefined;
      existingAccount.status = "active";
      existingAccount.createdAt = existingAccount.createdAt ?? now;
      existingAccount.updatedAt = now;
      await revokeSessionsForUser(existingAccount.id);
      void this.persistState();
      this.auditService.recordAdminAction({
        actionType: "commercial_access.linked",
        targetType: "user",
        targetId: existingAccount.id,
        summary: `Se vinculó acceso ${accountType} para ${existingAccount.email}.`,
        actorName: "admin",
        metadata: {
          accountType,
          email,
          vendorCode: existingAccount.vendorCode,
          wholesaleLeadId: existingAccount.wholesaleLeadId
        }
      });

      return {
        ...actionResponse("ok", "El acceso comercial fue vinculado a la cuenta existente.", existingAccount.id),
        access: toCommercialAccessSummary(existingAccount),
        temporaryPassword
      };
    }

    const now = new Date().toISOString();
    const account: AuthRecord = {
      id: `usr-${String(userSequence).padStart(3, "0")}`,
      name: body.name.trim(),
      email,
      phone: normalizeOptionalText(body.phone),
      password: temporaryPassword,
      accountType,
      roles: buildRoles(commercialRolesFor(accountType)),
      vendorCode: accountType === "seller" ? normalizeVendorCode(body.vendorCode) : undefined,
      wholesaleLeadId: accountType === "wholesale" ? normalizeOptionalText(body.wholesaleLeadId) : undefined,
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    userSequence += 1;
    accounts.set(email, account);
    void this.persistState();
    this.auditService.recordAdminAction({
      actionType: "commercial_access.created",
      targetType: "user",
      targetId: account.id,
      summary: `Se creó acceso ${accountType} para ${account.email}.`,
      actorName: "admin",
      metadata: {
        accountType,
        email,
        vendorCode: account.vendorCode,
        wholesaleLeadId: account.wholesaleLeadId
      }
    });

    return {
      ...actionResponse("ok", "El acceso comercial fue creado.", account.id),
      access: toCommercialAccessSummary(account),
      temporaryPassword
    };
  }

  async updateCommercialAccess(id: string, body: CommercialAccessUpdateInput) {
    if (databaseAuthEnabled()) {
      return this.updateCommercialAccessWithDatabase(id, body);
    }

    const account = this.requireLocalCommercialAccess(id);
    const now = new Date().toISOString();

    account.name = normalizeOptionalText(body.name) ?? account.name;
    account.phone = normalizeOptionalText(body.phone);
    if (account.accountType === "seller" && body.vendorCode !== undefined) {
      const vendorCode = normalizeVendorCode(body.vendorCode);
      if (!vendorCode) {
        throw new BadRequestException("El acceso vendedor debe mantener un código asociado.");
      }
      account.vendorCode = vendorCode;
    }
    if (account.accountType === "wholesale" && body.wholesaleLeadId !== undefined) {
      const wholesaleLeadId = normalizeOptionalText(body.wholesaleLeadId);
      if (!wholesaleLeadId) {
        throw new BadRequestException("El acceso mayorista debe mantener un lead asociado.");
      }
      account.wholesaleLeadId = wholesaleLeadId;
    }
    account.updatedAt = now;
    void this.persistState();

    return {
      ...actionResponse("ok", "El acceso comercial fue actualizado.", account.id),
      access: toCommercialAccessSummary(account)
    };
  }

  async setCommercialAccessStatus(id: string, body: CommercialAccessStatusInput) {
    const status = parseCommercialAccessStatus(body.status);
    if (databaseAuthEnabled()) {
      return this.setCommercialAccessStatusWithDatabase(id, status);
    }

    const account = this.requireLocalCommercialAccess(id);
    account.status = status;
    account.updatedAt = new Date().toISOString();
    if (status !== "active") {
      await revokeSessionsForUser(account.id);
    }
    void this.persistState();

    return {
      ...actionResponse("ok", `El acceso comercial quedó ${status}.`, account.id),
      access: toCommercialAccessSummary(account)
    };
  }

  async resetCommercialAccessPassword(id: string, body: CommercialAccessResetPasswordInput = {}) {
    const temporaryPassword = normalizeOptionalText(body.password) ?? generateTemporaryPassword();
    if (temporaryPassword.length < 6) {
      throw new BadRequestException("La contraseña debe tener al menos 6 caracteres.");
    }

    if (databaseAuthEnabled()) {
      return this.resetCommercialAccessPasswordWithDatabase(id, temporaryPassword);
    }

    const account = this.requireLocalCommercialAccess(id);
    account.password = temporaryPassword;
    account.updatedAt = new Date().toISOString();
    await revokeSessionsForUser(account.id);
    void this.persistState();

    return {
      ...actionResponse("ok", "La contraseña temporal fue generada.", account.id),
      access: toCommercialAccessSummary(account),
      temporaryPassword
    };
  }

  private requireLocalCommercialAccess(id: string) {
    const account = Array.from(accounts.values()).find((entry) => entry.id === id.trim());
    if (!account || !isCommercialAccess(account)) {
      throw new NotFoundException(`No encontramos un acceso comercial con id ${id}.`);
    }

    return account;
  }

  private async listCommercialAccessesFromDatabase() {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              code: {
                in: [RoleCode.Vendedor, RoleCode.Mayorista]
              }
            }
          }
        }
      },
      include: databaseAuthUserInclude,
      orderBy: {
        updatedAt: "desc"
      }
    });
    const metadataByUser = await this.loadCommercialAccessMetadataMap();
    const accesses = users.map((user) => this.toCommercialAccessSummary(user, metadataByUser.get(user.id)));

    return wrapResponse(accesses, {
      total: accesses.length,
      active: accesses.filter((access) => access.status === "active").length,
      suspended: accesses.filter((access) => access.status === "suspended").length
    });
  }

  private async createCommercialAccessWithDatabase(
    body: CommercialAccessCreateInput & { accountType: CommercialAccessAccountType },
    temporaryPassword: string
  ) {
    const email = normalizeEmail(body.email);
    const existing = await this.prisma.user.findUnique({
      where: {
        email
      },
      include: databaseAuthUserInclude
    });

    const phone = normalizeOptionalText(body.phone);
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: {
          phone
        }
      });

      if (existingPhone && existingPhone.id !== existing?.id) {
        throw new ConflictException("Ya existe una cuenta con ese teléfono.");
      }
    }

    const roles = await this.ensureRolesExist(commercialRolesFor(body.accountType));
    const vendorCode = normalizeVendorCode(body.vendorCode);
    const wholesaleLeadId = normalizeOptionalText(body.wholesaleLeadId);
    const now = new Date().toISOString();

    if (existing) {
      const existingRoleCodes = existing.roles.flatMap((userRole) => (isRoleCode(userRole.role.code) ? [userRole.role.code] : []));
      if (existingRoleCodes.includes(RoleCode.Vendedor) || existingRoleCodes.includes(RoleCode.Mayorista)) {
        throw new ConflictException("Ese email ya tiene un acceso comercial. Edita el acceso existente o resetea la clave.");
      }

      if (existingRoleCodes.some((role) => isInternalBackofficeRole(role))) {
        throw new BadRequestException("Ese email pertenece a un usuario interno. Usa otro email para el acceso comercial.");
      }

      const missingRoles = roles.filter((role) => !existing.roles.some((userRole) => userRole.roleId === role.id));
      if (missingRoles.length) {
        await this.prisma.userRole.createMany({
          data: missingRoles.map((role) => ({
            userId: existing.id,
            roleId: role.id
          })),
          skipDuplicates: true
        });
      }

      await this.prisma.user.update({
        where: {
          id: existing.id
        },
        data: {
          phone: phone ?? existing.phone,
          passwordHash: hashPassword(temporaryPassword),
          status: LifecycleStatus.active
        }
      });

      await this.upsertCommercialAccessMetadata({
        userId: existing.id,
        name: body.name.trim(),
        email,
        phone: phone ?? existing.phone ?? undefined,
        accountType: body.accountType,
        vendorCode: body.accountType === "seller" ? vendorCode : undefined,
        wholesaleLeadId: body.accountType === "wholesale" ? wholesaleLeadId : undefined,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: now
      });

      await revokeSessionsForUser(existing.id);
      const user = await this.requireDatabaseCommercialAccess(existing.id);
      const metadata = (await this.loadCommercialAccessMetadataMap()).get(user.id);
      this.auditService.recordAdminAction({
        actionType: "commercial_access.linked",
        targetType: "user",
        targetId: user.id,
        summary: `Se vinculó acceso ${body.accountType} para ${user.email}.`,
        actorName: "admin",
        metadata: {
          accountType: body.accountType,
          email: user.email,
          vendorCode,
          wholesaleLeadId
        }
      });

      return {
        ...actionResponse("ok", "El acceso comercial fue vinculado a la cuenta existente.", user.id),
        access: this.toCommercialAccessSummary(user, metadata),
        temporaryPassword
      };
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: hashPassword(temporaryPassword),
        status: LifecycleStatus.active,
        roles: {
          create: roles.map((role) => ({
            roleId: role.id
          }))
        }
      }
    });

    await this.upsertCommercialAccessMetadata({
      userId: created.id,
      name: body.name.trim(),
      email,
      phone,
      accountType: body.accountType,
      vendorCode: body.accountType === "seller" ? vendorCode : undefined,
      wholesaleLeadId: body.accountType === "wholesale" ? wholesaleLeadId : undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: now
    });

    const user = await this.requireDatabaseCommercialAccess(created.id);
    const metadata = (await this.loadCommercialAccessMetadataMap()).get(user.id);
    this.auditService.recordAdminAction({
      actionType: "commercial_access.created",
      targetType: "user",
      targetId: user.id,
      summary: `Se creó acceso ${body.accountType} para ${user.email}.`,
      actorName: "admin",
      metadata: {
        accountType: body.accountType,
        email: user.email,
        vendorCode,
        wholesaleLeadId
      }
    });

    return {
      ...actionResponse("ok", "El acceso comercial fue creado.", user.id),
      access: this.toCommercialAccessSummary(user, metadata),
      temporaryPassword
    };
  }

  private async updateCommercialAccessWithDatabase(id: string, body: CommercialAccessUpdateInput) {
    const user = await this.requireDatabaseCommercialAccess(id);
    const metadataByUser = await this.loadCommercialAccessMetadataMap();
    const currentMetadata = metadataByUser.get(user.id);
    const accountType =
      currentMetadata?.accountType ?? normalizeCommercialAccountType(resolveAccountType(user.roles.map((userRole) => userRole.role.code as RoleCode)));
    const data: Prisma.UserUpdateInput = {};

    if (body.phone !== undefined) {
      data.phone = normalizeOptionalText(body.phone);
    }

    if (Object.keys(data).length) {
      await this.prisma.user.update({
        where: {
          id: user.id
        },
        data
      });
    }

    const vendorCode =
      accountType === "seller"
        ? body.vendorCode !== undefined
          ? normalizeVendorCode(body.vendorCode)
          : currentMetadata?.vendorCode ?? user.vendor?.codes[0]?.code
        : undefined;
    if (accountType === "seller" && !vendorCode) {
      throw new BadRequestException("El acceso vendedor debe mantener un código asociado.");
    }
    const wholesaleLeadId =
      accountType === "wholesale"
        ? body.wholesaleLeadId !== undefined
          ? normalizeOptionalText(body.wholesaleLeadId)
          : currentMetadata?.wholesaleLeadId
        : undefined;
    if (accountType === "wholesale" && !wholesaleLeadId) {
      throw new BadRequestException("El acceso mayorista debe mantener un lead asociado.");
    }

    await this.upsertCommercialAccessMetadata({
      userId: user.id,
      name: normalizeOptionalText(body.name) ?? currentMetadata?.name ?? resolveDisplayName(user),
      email: user.email,
      phone: body.phone !== undefined ? normalizeOptionalText(body.phone) : currentMetadata?.phone ?? user.phone ?? undefined,
      accountType,
      vendorCode,
      wholesaleLeadId,
      createdAt: currentMetadata?.createdAt ?? user.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    });

    const updated = await this.requireDatabaseCommercialAccess(user.id);
    const metadata = (await this.loadCommercialAccessMetadataMap()).get(updated.id);
    return {
      ...actionResponse("ok", "El acceso comercial fue actualizado.", updated.id),
      access: this.toCommercialAccessSummary(updated, metadata)
    };
  }

  private async setCommercialAccessStatusWithDatabase(id: string, status: CommercialAccessStatus) {
    const user = await this.requireDatabaseCommercialAccess(id);
    const updated = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        status: toLifecycleStatus(status)
      },
      include: databaseAuthUserInclude
    });
    if (status !== "active") {
      await revokeSessionsForUser(user.id);
    }
    const metadata = (await this.loadCommercialAccessMetadataMap()).get(updated.id);

    return {
      ...actionResponse("ok", `El acceso comercial quedó ${status}.`, updated.id),
      access: this.toCommercialAccessSummary(updated, metadata)
    };
  }

  private async resetCommercialAccessPasswordWithDatabase(id: string, temporaryPassword: string) {
    const user = await this.requireDatabaseCommercialAccess(id);
    const updated = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash: hashPassword(temporaryPassword)
      },
      include: databaseAuthUserInclude
    });
    await revokeSessionsForUser(user.id);
    const metadata = (await this.loadCommercialAccessMetadataMap()).get(updated.id);

    return {
      ...actionResponse("ok", "La contraseña temporal fue generada.", updated.id),
      access: this.toCommercialAccessSummary(updated, metadata),
      temporaryPassword
    };
  }

  private async requireDatabaseCommercialAccess(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id.trim()
      },
      include: databaseAuthUserInclude
    });

    if (!user) {
      throw new NotFoundException(`No encontramos un acceso comercial con id ${id}.`);
    }

    const roleCodes = user.roles.flatMap((userRole) => (isRoleCode(userRole.role.code) ? [userRole.role.code] : []));
    if (!roleCodes.includes(RoleCode.Vendedor) && !roleCodes.includes(RoleCode.Mayorista)) {
      throw new NotFoundException(`No encontramos un acceso comercial con id ${id}.`);
    }

    return user;
  }

  private toCommercialAccessSummary(user: DatabaseAuthUser, metadata?: CommercialAccessMetadata): CommercialAccessSummary {
    return toCommercialAccessSummary(this.toAuthRecord(user, metadata));
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

  private async loadCommercialAccessMetadata() {
    const snapshot = await this.moduleStateService.load<CommercialAccessesSnapshot>("commercial_accesses");
    return snapshot?.records ?? [];
  }

  private async loadCommercialAccessMetadataMap() {
    const records = await this.loadCommercialAccessMetadata();
    return new Map(records.map((record) => [record.userId, record]));
  }

  private async upsertCommercialAccessMetadata(record: CommercialAccessMetadata) {
    const records = await this.loadCommercialAccessMetadata();
    const nextRecords = records.filter((entry) => entry.userId !== record.userId);
    nextRecords.push(record);
    await this.moduleStateService.save<CommercialAccessesSnapshot>("commercial_accesses", {
      records: nextRecords
    });
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

    const metadata = (await this.loadCommercialAccessMetadataMap()).get(user.id);
    return this.toAuthRecord(user, metadata);
  }

  private toAuthRecord(user: DatabaseAuthUser, metadata?: CommercialAccessMetadata): AuthRecord {
    const roleCodes = user.roles.flatMap((userRole) => (isRoleCode(userRole.role.code) ? [userRole.role.code] : []));
    const accountType = resolveAccountType(roleCodes);
    const userUpdatedAt = user.updatedAt.toISOString();
    const updatedAt = metadata?.updatedAt && metadata.updatedAt > userUpdatedAt ? metadata.updatedAt : userUpdatedAt;

    return {
      id: user.id,
      name: metadata?.name ?? resolveDisplayName(user),
      email: user.email,
      phone: user.phone ?? metadata?.phone ?? undefined,
      password: user.passwordHash,
      accountType,
      roles: buildRoles(roleCodes),
      vendorCode: accountType === "seller" ? metadata?.vendorCode ?? user.vendor?.codes[0]?.code : undefined,
      wholesaleLeadId: accountType === "wholesale" ? metadata?.wholesaleLeadId : undefined,
      status: normalizeStatus(user.status),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: metadata?.createdAt ?? user.createdAt.toISOString(),
      updatedAt
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
