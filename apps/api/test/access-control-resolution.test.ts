import assert from "node:assert/strict";
import test from "node:test";
import type { AccessOverrideEffect, AccessScopeCode } from "@huelegood/shared";
import { AccessControlService } from "../src/modules/auth/access-control.service";
import type {
  AccessControlGrantRecord,
  AccessControlOverrideRecord
} from "../src/modules/auth/access-control.types";

class MemoryAccessControlService extends AccessControlService {
  private readonly roleGrants: AccessControlGrantRecord[];
  private readonly overrides: AccessControlOverrideRecord[];
  private readonly now: Date;

  constructor(input: {
    roleGrants?: AccessControlGrantRecord[];
    overrides?: AccessControlOverrideRecord[];
    now: Date;
  }) {
    super({} as never);
    this.roleGrants = input.roleGrants ?? [];
    this.overrides = input.overrides ?? [];
    this.now = input.now;
  }

  protected override getNow() {
    return this.now;
  }

  protected override async loadRoleGrantRecords(_userId: string) {
    return this.roleGrants;
  }

  protected override async loadOverrideRecords(_userId: string, _now: Date) {
    return this.overrides;
  }
}

function createGrant(permissionCode: string, scopeCode: AccessScopeCode, source: string): AccessControlGrantRecord {
  return {
    permissionCode,
    scopeCode,
    source
  };
}

function createOverride(input: {
  permissionCode: string;
  scopeCode: AccessScopeCode;
  effect: AccessOverrideEffect;
  startsAt: string;
  expiresAt: string;
}): AccessControlOverrideRecord {
  return {
    permissionCode: input.permissionCode,
    scopeCode: input.scopeCode,
    effect: input.effect,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    source: `override:${input.effect}`
  };
}

test("override revoke bloquea el scope heredado sin borrar scopes mayores restantes", async () => {
  const service = new MemoryAccessControlService({
    now: new Date("2026-06-09T15:00:00.000Z"),
    roleGrants: [createGrant("orders.manage", "team", "role:ventas")],
    overrides: [
      createOverride({
        permissionCode: "orders.manage",
        scopeCode: "own",
        effect: "revoke",
        startsAt: "2026-06-09T14:00:00.000Z",
        expiresAt: "2026-06-09T16:00:00.000Z"
      })
    ]
  });

  assert.equal(await service.can("usr-ventas", "orders.manage", "own"), false);
  assert.equal(await service.can("usr-ventas", "orders.manage", "team"), true);
});

test("override grant expira y deja de conceder acceso", async () => {
  const activeGrant = createOverride({
    permissionCode: "cms.publish",
    scopeCode: "all",
    effect: "grant",
    startsAt: "2026-06-09T14:00:00.000Z",
    expiresAt: "2026-06-09T16:00:00.000Z"
  });

  const serviceWhileActive = new MemoryAccessControlService({
    now: new Date("2026-06-09T15:00:00.000Z"),
    overrides: [activeGrant]
  });
  const serviceAfterExpiry = new MemoryAccessControlService({
    now: new Date("2026-06-09T16:30:00.000Z"),
    overrides: [activeGrant]
  });

  assert.equal(await serviceWhileActive.can("usr-marketing", "cms.publish", "all"), true);
  assert.equal(await serviceAfterExpiry.can("usr-marketing", "cms.publish", "all"), false);
});
