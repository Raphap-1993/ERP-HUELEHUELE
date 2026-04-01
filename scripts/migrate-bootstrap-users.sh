#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

resolve_app_root_dir() {
  local root_dir="$1"
  local parent_dir
  parent_dir="$(dirname "$root_dir")"

  if [[ "$(basename "$parent_dir")" == "releases" ]]; then
    dirname "$parent_dir"
  else
    printf '%s\n' "$parent_dir"
  fi
}

APP_ROOT_DIR="${APP_ROOT_DIR:-$(resolve_app_root_dir "$ROOT_DIR")}"
APP_SHARED_DIR_DEFAULT="${APP_SHARED_DIR:-$APP_ROOT_DIR/shared}"

env_candidates=(
  ".env.production"
  "../shared/.env.production"
  "$APP_SHARED_DIR_DEFAULT/.env.production"
)

for env_file in "${env_candidates[@]}"; do
  if [[ -f "$env_file" ]]; then
    echo "[bootstrap-migration] loading environment from $env_file"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    break
  fi
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[bootstrap-migration] missing required command: $1" >&2
    exit 1
  fi
}

require_env() {
  local missing=()

  for name in "$@"; do
    if [[ -z "${!name:-}" ]]; then
      missing+=("$name")
    fi
  done

  if [[ "${#missing[@]}" -gt 0 ]]; then
    echo "[bootstrap-migration] missing required env vars: ${missing[*]}" >&2
    echo "[bootstrap-migration] define them in .env.production or the shared production env before running this migration." >&2
    exit 1
  fi
}

require_cmd node
require_env \
  DATABASE_URL \
  BOOTSTRAP_ADMIN_NAME \
  BOOTSTRAP_ADMIN_EMAIL \
  BOOTSTRAP_ADMIN_PASSWORD \
  BOOTSTRAP_PAYMENTS_NAME \
  BOOTSTRAP_PAYMENTS_EMAIL \
  BOOTSTRAP_PAYMENTS_PASSWORD \
  BOOTSTRAP_SELLER_NAME \
  BOOTSTRAP_SELLER_EMAIL \
  BOOTSTRAP_SELLER_PASSWORD \
  BOOTSTRAP_SELLER_VENDOR_CODE \
  BOOTSTRAP_CUSTOMER_NAME \
  BOOTSTRAP_CUSTOMER_EMAIL \
  BOOTSTRAP_CUSTOMER_PASSWORD

node <<'NODE'
const { LifecycleStatus, PrismaClient, VendorCodeStatus, VendorStatus } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  operador_pagos: "Operador de pagos",
  ventas: "Ventas",
  marketing: "Marketing",
  seller_manager: "Seller Manager",
  vendedor: "Vendedor",
  cliente: "Cliente"
};

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function splitDisplayName(value) {
  const normalized = value.trim();
  const [firstName, ...rest] = normalized.split(/\s+/).filter(Boolean);

  return {
    firstName: firstName || "Cliente",
    lastName: rest.join(" ") || "Huelegood"
  };
}

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const prisma = new PrismaClient();

  const accounts = [
    {
      id: "usr-admin-001",
      name: env("BOOTSTRAP_ADMIN_NAME"),
      email: env("BOOTSTRAP_ADMIN_EMAIL"),
      password: env("BOOTSTRAP_ADMIN_PASSWORD"),
      accountType: "admin",
      roles: ["super_admin", "admin"],
      adminJobTitle: "Super Admin"
    },
    {
      id: "usr-seller-014",
      name: env("BOOTSTRAP_SELLER_NAME"),
      email: env("BOOTSTRAP_SELLER_EMAIL"),
      password: env("BOOTSTRAP_SELLER_PASSWORD"),
      accountType: "seller",
      roles: ["seller_manager", "vendedor"],
      vendorCode: env("BOOTSTRAP_SELLER_VENDOR_CODE")
    },
    {
      id: "usr-operator-001",
      name: env("BOOTSTRAP_PAYMENTS_NAME"),
      email: env("BOOTSTRAP_PAYMENTS_EMAIL"),
      password: env("BOOTSTRAP_PAYMENTS_PASSWORD"),
      accountType: "operator",
      roles: ["operador_pagos"],
      adminJobTitle: "Operador de Pagos"
    },
    {
      id: "usr-customer-001",
      name: env("BOOTSTRAP_CUSTOMER_NAME"),
      email: env("BOOTSTRAP_CUSTOMER_EMAIL"),
      password: env("BOOTSTRAP_CUSTOMER_PASSWORD"),
      accountType: "customer",
      roles: ["cliente"]
    }
  ];

  const roleCodes = Array.from(new Set(accounts.flatMap((account) => account.roles)));

  try {
    console.log("[bootstrap-migration] syncing bootstrap users into Postgres");

    await prisma.$transaction(async (tx) => {
      const roles = new Map();

      for (const code of roleCodes) {
        const role = await tx.role.upsert({
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
        });

        roles.set(code, role.id);
      }

      for (const account of accounts) {
        const email = normalizeEmail(account.email);
        const user = await tx.user.upsert({
          where: { email },
          update: {
            phone: null,
            passwordHash: hashPassword(account.password),
            status: LifecycleStatus.active
          },
          create: {
            email,
            phone: null,
            passwordHash: hashPassword(account.password),
            status: LifecycleStatus.active
          }
        });

        await tx.userRole.deleteMany({
          where: {
            userId: user.id
          }
        });

        await tx.userRole.createMany({
          data: account.roles
            .map((code) => roles.get(code))
            .filter((roleId) => Boolean(roleId))
            .map((roleId) => ({
              userId: user.id,
              roleId
            }))
        });

        if (account.accountType === "admin" || account.accountType === "operator") {
          await tx.admin.upsert({
            where: { userId: user.id },
            update: {
              displayName: account.name,
              jobTitle: account.adminJobTitle,
              status: LifecycleStatus.active,
              isActive: true
            },
            create: {
              userId: user.id,
              displayName: account.name,
              jobTitle: account.adminJobTitle,
              status: LifecycleStatus.active,
              isActive: true
            }
          });
        }

        if (account.accountType === "customer") {
          const { firstName, lastName } = splitDisplayName(account.name);
          await tx.customer.upsert({
            where: { userId: user.id },
            update: {
              firstName,
              lastName,
              status: LifecycleStatus.active
            },
            create: {
              userId: user.id,
              firstName,
              lastName,
              status: LifecycleStatus.active
            }
          });
        }

        if (account.accountType === "seller") {
          const vendor = await tx.vendor.upsert({
            where: { userId: user.id },
            update: {
              codePrefix: "VEND",
              status: VendorStatus.active
            },
            create: {
              userId: user.id,
              codePrefix: "VEND",
              status: VendorStatus.active
            }
          });

          await tx.vendorProfile.upsert({
            where: { vendorId: vendor.id },
            update: {
              displayName: account.name
            },
            create: {
              vendorId: vendor.id,
              displayName: account.name
            }
          });

          await tx.vendorCode.upsert({
            where: { code: account.vendorCode },
            update: {
              vendorId: vendor.id,
              status: VendorCodeStatus.active
            },
            create: {
              vendorId: vendor.id,
              code: account.vendorCode,
              status: VendorCodeStatus.active
            }
          });
        }
      }
    });

    const migrated = await prisma.user.findMany({
      where: {
        email: {
          in: accounts.map((account) => normalizeEmail(account.email))
        }
      },
      select: {
        email: true,
        id: true
      },
      orderBy: {
        email: "asc"
      }
    });

    console.log("[bootstrap-migration] migrated accounts:", migrated.map((account) => account.email).join(", "));
    console.log(`[bootstrap-migration] total accounts upserted: ${migrated.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[bootstrap-migration] failed", error);
  process.exit(1);
});
NODE
