import assert from "node:assert/strict";
import { test } from "node:test";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { RoleCode } from "@huelegood/shared";
import { AuthService } from "../src/modules/auth/auth.service";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class MemoryModuleStateService {
  private readonly snapshots = new Map<string, unknown>();

  async load<T>(moduleName: string): Promise<T | null> {
    const snapshot = this.snapshots.get(moduleName);
    return snapshot ? (deepClone(snapshot) as T) : null;
  }

  async save<T>(moduleName: string, snapshot: T) {
    this.snapshots.set(moduleName, deepClone(snapshot));
  }
}

class AuditStub {
  readonly auditEvents: unknown[] = [];
  readonly adminActions: unknown[] = [];

  recordAudit(event: unknown) {
    this.auditEvents.push(event);
  }

  recordAdminAction(action: unknown) {
    this.adminActions.push(action);
  }
}

function createAuthService() {
  return new AuthService(new AuditStub() as never, new MemoryModuleStateService() as never, {} as never);
}

test("administra accesos comerciales locales para vendedores", async (t) => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const auth = createAuthService();
  t.after(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    return auth.onModuleDestroy();
  });

  const email = `seller-${Date.now()}@test.local`;

  const created = await auth.createCommercialAccess({
    name: "Vendedor Local",
    email,
    accountType: "seller",
    vendorCode: "vend-local-001",
    password: "seller123"
  });

  assert.equal(created.status, "ok");
  assert.equal(created.access?.accountType, "seller");
  assert.equal(created.access?.vendorCode, "VEND-LOCAL-001");
  assert.ok(created.access?.roles.some((role) => role.code === RoleCode.Cliente));
  assert.ok(created.access?.roles.some((role) => role.code === RoleCode.Vendedor));

  const login = await auth.login({ email, password: "seller123" });
  assert.equal(login.data.user.accountType, "seller");
  assert.equal(login.data.user.vendorCode, "VEND-LOCAL-001");

  const listed = await auth.listCommercialAccesses();
  assert.ok(listed.data.some((access) => access.id === created.access?.id));

  await auth.setCommercialAccessStatus(created.access!.id, { status: "suspended" });
  await assert.rejects(() => auth.login({ email, password: "seller123" }), UnauthorizedException);

  await auth.setCommercialAccessStatus(created.access!.id, { status: "active" });
  await auth.login({ email, password: "seller123" });

  await auth.resetCommercialAccessPassword(created.access!.id, { password: "seller456" });
  await assert.rejects(() => auth.login({ email, password: "seller123" }), UnauthorizedException);
  const relogin = await auth.login({ email, password: "seller456" });
  assert.equal(relogin.data.user.vendorCode, "VEND-LOCAL-001");
});

test("crea accesos mayoristas sin auto-registro comercial", async (t) => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const auth = createAuthService();
  t.after(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    return auth.onModuleDestroy();
  });

  const email = `wholesale-${Date.now()}@test.local`;

  await assert.rejects(
    () =>
      auth.register({
        name: "Registro Vendedor",
        email: `register-${Date.now()}@test.local`,
        password: "seller123",
        accountType: "seller"
      }),
    BadRequestException
  );

  const created = await auth.createCommercialAccess({
    name: "Mayorista Local",
    email,
    accountType: "wholesale",
    wholesaleLeadId: "wl-local-001"
  });

  assert.equal(created.access?.accountType, "wholesale");
  assert.equal(created.access?.wholesaleLeadId, "wl-local-001");
  assert.ok(created.temporaryPassword);
  assert.ok(created.access?.roles.some((role) => role.code === RoleCode.Cliente));
  assert.ok(created.access?.roles.some((role) => role.code === RoleCode.Mayorista));

  const login = await auth.login({ email, password: created.temporaryPassword! });
  assert.equal(login.data.user.accountType, "wholesale");
  assert.equal(login.data.user.wholesaleLeadId, "wl-local-001");
});

test("vincula acceso comercial cuando el email ya existe como cliente", async (t) => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const auth = createAuthService();
  t.after(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    return auth.onModuleDestroy();
  });

  const email = `customer-to-seller-${Date.now()}@test.local`;
  await auth.register({
    name: "Cliente Existente",
    email,
    password: "customer123"
  });

  const linked = await auth.createCommercialAccess({
    name: "Cliente Vendedor",
    email,
    accountType: "seller",
    vendorCode: "vend-linked-001",
    password: "seller123"
  });

  assert.equal(linked.status, "ok");
  assert.equal(linked.message, "El acceso comercial fue vinculado a la cuenta existente.");
  assert.equal(linked.access?.accountType, "seller");
  assert.equal(linked.access?.vendorCode, "VEND-LINKED-001");
  assert.ok(linked.access?.roles.some((role) => role.code === RoleCode.Cliente));
  assert.ok(linked.access?.roles.some((role) => role.code === RoleCode.Vendedor));

  await assert.rejects(() => auth.login({ email, password: "customer123" }), UnauthorizedException);
  const login = await auth.login({ email, password: "seller123" });
  assert.equal(login.data.user.accountType, "seller");
  assert.equal(login.data.user.vendorCode, "VEND-LINKED-001");
});
