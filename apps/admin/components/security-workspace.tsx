"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  SectionHeader,
  Textarea
} from "@huelegood/ui";
import {
  type AccessSurface,
  type SecurityCatalogSummary,
  type SecurityNavigationItemUpdateInput,
  type SecurityOverrideCreateInput,
  type SecurityRoleCreateInput,
  type SecurityRoleSummary,
  type SecurityRoleUpdateInput,
  type SecurityUserRoleAssignmentInput
} from "@huelegood/shared";
import {
  assignSecurityUserRoles,
  createSecurityOverride,
  createSecurityRole,
  fetchSecurityCatalog,
  fetchSecurityRoles,
  updateSecurityNavigation,
  updateSecurityRole
} from "../lib/api";
import { useAdminSession } from "./admin-session-provider";
import { getSecurityWorkspaceCapabilities, getVisibleSecurityTabs, type SecurityWorkspaceTab } from "./security-workspace-state";

type RoleFormState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  surface: AccessSurface;
  isAssignable: boolean;
  isActive: boolean;
  isSystem: boolean;
  grants: Record<string, string>;
};

type UserAssignmentsFormState = {
  userId: string;
  roleIds: string[];
  primaryRoleId: string;
};

type OverrideFormState = {
  userId: string;
  permissionCode: string;
  scopeCode: string;
  effect: "grant" | "revoke";
  reason: string;
  approvedByUserId: string;
  createdByUserId: string;
  startsAt: string;
  expiresAt: string;
};

type ActionFeedback = {
  tone: "success" | "danger";
  message: string;
};

const emptyCatalog: SecurityCatalogSummary = {
  permissions: [],
  scopes: [],
  modules: [],
  navigationGroups: [],
  navigationItems: []
};

const tabLabels: Record<SecurityWorkspaceTab, string> = {
  roles: "Roles",
  users: "Usuarios",
  overrides: "Overrides",
  navigation: "Navegación",
  catalog: "Catálogo"
};

const surfaceLabels: Record<AccessSurface, string> = {
  internal_admin: "Admin interno",
  authenticated_portal: "Portal autenticado",
  public_web: "Web pública"
};

const surfaceOptions: Array<{ value: AccessSurface; label: string }> = [
  { value: "internal_admin", label: "Admin interno" },
  { value: "authenticated_portal", label: "Portal autenticado" }
];

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function buildDefaultOverrideForm(): OverrideFormState {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    userId: "",
    permissionCode: "",
    scopeCode: "",
    effect: "grant",
    reason: "",
    approvedByUserId: "",
    createdByUserId: "",
    startsAt: toDateTimeLocalValue(now),
    expiresAt: toDateTimeLocalValue(expires)
  };
}

function buildEmptyRoleForm(): RoleFormState {
  return {
    code: "",
    name: "",
    description: "",
    surface: "internal_admin",
    isAssignable: true,
    isActive: true,
    isSystem: false,
    grants: {}
  };
}

function buildRoleForm(role: SecurityRoleSummary): RoleFormState {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? "",
    surface: role.surface,
    isAssignable: role.isAssignable,
    isActive: role.isActive,
    isSystem: role.isSystem,
    grants: Object.fromEntries(role.permissionGrants.map((grant) => [grant.permissionCode, grant.scopeCode]))
  };
}

function buildNavigationDrafts(catalog: SecurityCatalogSummary) {
  const groupsByCode = new Map(
    catalog.navigationGroups
      .filter((group) => group.surface === "internal_admin")
      .map((group) => [group.code, group])
  );
  const itemsByModule = new Map(catalog.navigationItems.map((item) => [item.moduleCode, item]));

  return Object.fromEntries(
    catalog.modules
      .filter((module) => module.surface === "internal_admin")
      .map((module, index) => {
        const item = itemsByModule.get(module.code);
        const fallbackGroupCode = groupsByCode.has(module.navGroup)
          ? module.navGroup
          : catalog.navigationGroups.find((group) => group.surface === "internal_admin")?.code ?? module.navGroup;

        return [
          module.code,
          {
            moduleCode: module.code,
            navigationGroupCode: item?.navigationGroupCode ?? fallbackGroupCode,
            labelOverride: item?.labelOverride ?? "",
            icon: item?.icon ?? "",
            sortOrder: item?.sortOrder ?? index + 1,
            isVisible: item?.isVisible ?? true
          } satisfies SecurityNavigationItemUpdateInput
        ];
      })
  ) as Record<string, SecurityNavigationItemUpdateInput>;
}

function groupPermissionsByModule(catalog: SecurityCatalogSummary) {
  const modulesByCode = new Map(catalog.modules.map((module) => [module.code, module]));

  return catalog.permissions.reduce<Array<{ moduleCode: string; label: string; permissions: SecurityCatalogSummary["permissions"] }>>(
    (groups, permission) => {
      const existing = groups.find((entry) => entry.moduleCode === permission.moduleId);
      if (existing) {
        existing.permissions.push(permission);
        return groups;
      }

      groups.push({
        moduleCode: permission.moduleId,
        label: modulesByCode.get(permission.moduleId)?.label ?? permission.moduleId,
        permissions: [permission]
      });
      return groups;
    },
    []
  );
}

function SectionHint({ children }: { children: string }) {
  return <p className="text-sm leading-6 text-black/60">{children}</p>;
}

function InputRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">{label}</span>
      {children}
    </label>
  );
}

export function SecurityWorkspace() {
  const { session, refreshSession } = useAdminSession();
  const capabilities = useMemo(() => getSecurityWorkspaceCapabilities(session?.user), [session]);
  const visibleTabs = useMemo(() => getVisibleSecurityTabs(capabilities), [capabilities]);
  const [activeTab, setActiveTab] = useState<SecurityWorkspaceTab>(visibleTabs[0] ?? "roles");
  const [catalog, setCatalog] = useState<SecurityCatalogSummary>(emptyCatalog);
  const [roles, setRoles] = useState<SecurityRoleSummary[]>([]);
  const [roleForm, setRoleForm] = useState<RoleFormState>(buildEmptyRoleForm);
  const [userAssignmentsForm, setUserAssignmentsForm] = useState<UserAssignmentsFormState>({
    userId: "",
    roleIds: [],
    primaryRoleId: ""
  });
  const [overrideForm, setOverrideForm] = useState<OverrideFormState>(buildDefaultOverrideForm);
  const [navigationDrafts, setNavigationDrafts] = useState<Record<string, SecurityNavigationItemUpdateInput>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  useEffect(() => {
    if (!visibleTabs.length) {
      return;
    }

    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (!capabilities.canReadRoles) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [catalogResponse, rolesResponse] = await Promise.all([fetchSecurityCatalog(), fetchSecurityRoles()]);
        if (!active) {
          return;
        }

        setCatalog(catalogResponse.data);
        setRoles(rolesResponse.data);
        setNavigationDrafts(buildNavigationDrafts(catalogResponse.data));
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar la consola de seguridad.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [capabilities.canReadRoles, refreshKey]);

  const permissionGroups = useMemo(() => groupPermissionsByModule(catalog), [catalog]);
  const assignableRoles = useMemo(
    () => roles.filter((role) => role.isAssignable && role.isActive).sort((left, right) => left.name.localeCompare(right.name)),
    [roles]
  );
  const availableScopes = useMemo(() => {
    const permission = catalog.permissions.find((entry) => entry.code === overrideForm.permissionCode);
    return permission?.supportedScopes ?? [];
  }, [catalog.permissions, overrideForm.permissionCode]);
  const internalNavigationGroups = useMemo(
    () => catalog.navigationGroups.filter((group) => group.surface === "internal_admin"),
    [catalog.navigationGroups]
  );
  const internalModules = useMemo(
    () => catalog.modules.filter((module) => module.surface === "internal_admin"),
    [catalog.modules]
  );

  function triggerRefresh(message: string) {
    setFeedback({ tone: "success", message });
    setRefreshKey((current) => current + 1);
    void refreshSession().catch(() => undefined);
  }

  function resetRoleForm() {
    setRoleForm(buildEmptyRoleForm());
  }

  function toggleRoleSelection(roleId: string) {
    setUserAssignmentsForm((current) => {
      const hasRole = current.roleIds.includes(roleId);
      const nextRoleIds = hasRole ? current.roleIds.filter((id) => id !== roleId) : [...current.roleIds, roleId];
      const nextPrimaryRoleId = nextRoleIds.includes(current.primaryRoleId) ? current.primaryRoleId : nextRoleIds[0] ?? "";

      return {
        ...current,
        roleIds: nextRoleIds,
        primaryRoleId: nextPrimaryRoleId
      };
    });
  }

  function toggleRoleGrant(permissionCode: string, enabled: boolean, defaultScope: string) {
    setRoleForm((current) => {
      const grants = { ...current.grants };

      if (!enabled) {
        delete grants[permissionCode];
      } else if (!grants[permissionCode]) {
        grants[permissionCode] = defaultScope;
      }

      return {
        ...current,
        grants
      };
    });
  }

  function updateRoleGrantScope(permissionCode: string, scopeCode: string) {
    setRoleForm((current) => ({
      ...current,
      grants: {
        ...current.grants,
        [permissionCode]: scopeCode
      }
    }));
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capabilities.canManageRoles) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const permissionGrants = Object.entries(roleForm.grants).map(([permissionCode, scopeCode]) => ({
        permissionCode,
        scopeCode
      }));

      if (roleForm.id) {
        const payload: SecurityRoleUpdateInput = roleForm.isSystem
          ? {
              description: roleForm.description,
              isAssignable: roleForm.isAssignable,
              isActive: roleForm.isActive
            }
          : {
              name: roleForm.name,
              description: roleForm.description,
              surface: roleForm.surface,
              isAssignable: roleForm.isAssignable,
              isActive: roleForm.isActive,
              permissionGrants
            };

        await updateSecurityRole(roleForm.id, payload);
        triggerRefresh(`Rol ${roleForm.code} actualizado.`);
      } else {
        const payload: SecurityRoleCreateInput = {
          code: roleForm.code,
          name: roleForm.name,
          description: roleForm.description || undefined,
          surface: roleForm.surface,
          isAssignable: roleForm.isAssignable,
          isActive: roleForm.isActive,
          permissionGrants
        };

        await createSecurityRole(payload);
        triggerRefresh(`Rol ${roleForm.code} creado.`);
      }

      resetRoleForm();
    } catch (submitError) {
      setFeedback({
        tone: "danger",
        message: submitError instanceof Error ? submitError.message : "No pudimos guardar el rol."
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUserAssignmentsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capabilities.canManageUsers) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload: SecurityUserRoleAssignmentInput = {
        roleIds: userAssignmentsForm.roleIds,
        primaryRoleId: userAssignmentsForm.primaryRoleId || undefined
      };

      await assignSecurityUserRoles(userAssignmentsForm.userId, payload);
      triggerRefresh(`Roles actualizados para ${userAssignmentsForm.userId}.`);
      setUserAssignmentsForm({
        userId: "",
        roleIds: [],
        primaryRoleId: ""
      });
    } catch (submitError) {
      setFeedback({
        tone: "danger",
        message: submitError instanceof Error ? submitError.message : "No pudimos actualizar roles de usuario."
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOverrideSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capabilities.canManageOverrides) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload: SecurityOverrideCreateInput = {
        permissionCode: overrideForm.permissionCode,
        scopeCode: overrideForm.scopeCode,
        effect: overrideForm.effect,
        reason: overrideForm.reason,
        approvedByUserId: overrideForm.approvedByUserId,
        createdByUserId: overrideForm.createdByUserId,
        startsAt: new Date(overrideForm.startsAt).toISOString(),
        expiresAt: new Date(overrideForm.expiresAt).toISOString()
      };

      await createSecurityOverride(overrideForm.userId, payload);
      triggerRefresh(`Override ${overrideForm.effect} creado para ${overrideForm.userId}.`);
      setOverrideForm(buildDefaultOverrideForm());
    } catch (submitError) {
      setFeedback({
        tone: "danger",
        message: submitError instanceof Error ? submitError.message : "No pudimos crear el override."
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNavigationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capabilities.canManageRoles) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await updateSecurityNavigation({
        items: Object.values(navigationDrafts).map((item) => ({
          ...item,
          labelOverride: item.labelOverride?.trim() || undefined,
          icon: item.icon?.trim() || undefined
        }))
      });
      triggerRefresh("Navegación de seguridad actualizada.");
    } catch (submitError) {
      setFeedback({
        tone: "danger",
        message: submitError instanceof Error ? submitError.message : "No pudimos actualizar la navegación."
      });
    } finally {
      setSubmitting(false);
    }
  }

  const metrics = [
    { label: "Roles", value: String(roles.length), detail: "Roles activos e inactivos del catálogo." },
    { label: "Permisos", value: String(catalog.permissions.length), detail: "Permisos canónicos registrados por código." },
    { label: "Módulos", value: String(catalog.modules.length), detail: "Superficies registradas para admin y portal." },
    {
      label: "Nav items",
      value: String(catalog.navigationItems.filter((item) => item.isVisible).length),
      detail: "Entradas visibles configuradas en navegación."
    }
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Seguridad y acceso"
        description="Roles, permisos efectivos, overrides temporales y visibilidad de navegación bajo el modelo RBAC + scope aprobado."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-[1.6rem] border-black/8">
            <CardContent className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{metric.label}</p>
              <p className="text-3xl font-semibold text-[#132016]">{metric.value}</p>
              <p className="text-sm leading-6 text-black/60">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.6rem] border-black/8">
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge tone={capabilities.canReadRoles ? "success" : "danger"}>
            {capabilities.canReadRoles ? "Lectura habilitada" : "Lectura bloqueada"}
          </Badge>
          <Badge tone={capabilities.canManageRoles ? "info" : "neutral"}>
            {capabilities.canManageRoles ? "Gestión de roles" : "Roles solo lectura"}
          </Badge>
          <Badge tone={capabilities.canManageUsers ? "info" : "neutral"}>
            {capabilities.canManageUsers ? "Puede asignar usuarios" : "Sin asignación de usuarios"}
          </Badge>
          <Badge tone={capabilities.canManageOverrides ? "warning" : "neutral"}>
            {capabilities.canManageOverrides ? "Puede crear overrides" : "Overrides ocultos"}
          </Badge>
        </CardContent>
      </Card>

      {feedback ? (
        <div
          className={`rounded-[1.25rem] px-4 py-3 text-sm ${
            feedback.tone === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {error ? <div className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab ? "bg-[#132016] text-white" : "bg-white text-[#132016] border border-black/10 hover:bg-black/5"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="rounded-[1.6rem] border-black/8">
          <CardContent>
            <p className="text-sm text-black/60">Cargando catálogo y roles de seguridad...</p>
          </CardContent>
        </Card>
      ) : null}

      {!loading && activeTab === "roles" ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.6rem] border-black/8">
            <CardHeader>
              <CardTitle>Roles registrados</CardTitle>
              <CardDescription>Todos los roles viven sobre catálogo canónico de permisos y scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="rounded-[1.25rem] border border-black/8 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#132016]">{role.name}</h3>
                        <Badge tone={role.isSystem ? "info" : "neutral"}>{role.code}</Badge>
                        <Badge tone={role.isActive ? "success" : "danger"}>{role.isActive ? "Activo" : "Inactivo"}</Badge>
                        {!role.isAssignable ? <Badge tone="warning">No asignable</Badge> : null}
                      </div>
                      <p className="text-sm text-black/60">{role.description ?? "Sin descripción operativa."}</p>
                    </div>
                    {capabilities.canManageRoles ? (
                      <Button variant="secondary" size="sm" onClick={() => setRoleForm(buildRoleForm(role))}>
                        {role.isSystem ? "Inspeccionar" : "Editar"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="neutral">{surfaceLabels[role.surface]}</Badge>
                    <Badge tone="info">{role.permissionGrants.length} grants</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.6rem] border-black/8">
            <CardHeader>
              <CardTitle>{roleForm.id ? "Editor de rol" : "Nuevo rol"}</CardTitle>
              <CardDescription>
                {capabilities.canManageRoles
                  ? "Crea roles derivados o ajusta metadata operativa. Los system roles no cambian grants ni surface desde UI."
                  : "Sesión solo lectura. Aquí se expone el contrato, pero no las acciones."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-5" onSubmit={handleRoleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputRow label="Código">
                    <Input
                      value={roleForm.code}
                      disabled={!capabilities.canManageRoles || Boolean(roleForm.id)}
                      onChange={(event) => setRoleForm((current) => ({ ...current, code: event.target.value }))}
                      placeholder="partner_ops"
                    />
                  </InputRow>
                  <InputRow label="Nombre">
                    <Input
                      value={roleForm.name}
                      disabled={!capabilities.canManageRoles || roleForm.isSystem}
                      onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Partner Ops"
                    />
                  </InputRow>
                </div>

                <InputRow label="Descripción">
                  <Textarea
                    value={roleForm.description}
                    disabled={!capabilities.canManageRoles}
                    onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe alcance, uso esperado y restricciones."
                  />
                </InputRow>

                <div className="grid gap-4 md:grid-cols-3">
                  <InputRow label="Surface">
                    <select
                      value={roleForm.surface}
                      disabled={!capabilities.canManageRoles || roleForm.isSystem}
                      onChange={(event) =>
                        setRoleForm((current) => ({ ...current, surface: event.target.value as AccessSurface }))
                      }
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                    >
                      {surfaceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </InputRow>
                  <label className="flex items-center gap-3 rounded-[1.1rem] border border-black/8 px-4 py-3 text-sm text-[#132016]">
                    <input
                      type="checkbox"
                      checked={roleForm.isAssignable}
                      disabled={!capabilities.canManageRoles}
                      onChange={(event) => setRoleForm((current) => ({ ...current, isAssignable: event.target.checked }))}
                    />
                    Rol asignable
                  </label>
                  <label className="flex items-center gap-3 rounded-[1.1rem] border border-black/8 px-4 py-3 text-sm text-[#132016]">
                    <input
                      type="checkbox"
                      checked={roleForm.isActive}
                      disabled={!capabilities.canManageRoles}
                      onChange={(event) => setRoleForm((current) => ({ ...current, isActive: event.target.checked }))}
                    />
                    Rol activo
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#132016]">Permission grants</h4>
                    <SectionHint>
                      Selecciona permisos del catálogo y el scope máximo permitido por este rol. Los system roles se muestran bloqueados.
                    </SectionHint>
                  </div>
                  <div className="space-y-4">
                    {permissionGroups.map((group) => (
                      <div key={group.moduleCode} className="rounded-[1.25rem] border border-black/8 px-4 py-4">
                        <h5 className="text-sm font-semibold text-[#132016]">{group.label}</h5>
                        <div className="mt-3 space-y-3">
                          {group.permissions.map((permission) => {
                            const selectedScope = roleForm.grants[permission.code];
                            const checked = Boolean(selectedScope);
                            return (
                              <div key={permission.code} className="grid gap-3 md:grid-cols-[1.6fr_0.8fr]">
                                <label className="flex items-start gap-3 text-sm text-[#132016]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!capabilities.canManageRoles || roleForm.isSystem}
                                    onChange={(event) =>
                                      toggleRoleGrant(permission.code, event.target.checked, permission.supportedScopes[0] ?? "all")
                                    }
                                  />
                                  <span>
                                    <span className="block font-medium">{permission.label}</span>
                                    <span className="block text-xs text-black/50">{permission.code}</span>
                                  </span>
                                </label>
                                <select
                                  value={selectedScope ?? permission.supportedScopes[0] ?? "all"}
                                  disabled={!checked || !capabilities.canManageRoles || roleForm.isSystem}
                                  onChange={(event) => updateRoleGrantScope(permission.code, event.target.value)}
                                  className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                                >
                                  {permission.supportedScopes.map((scope) => (
                                    <option key={scope} value={scope}>
                                      {scope}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={!capabilities.canManageRoles || submitting}>
                    {submitting ? "Guardando..." : roleForm.id ? "Guardar rol" : "Crear rol"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={submitting} onClick={resetRoleForm}>
                    Limpiar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!loading && activeTab === "users" ? (
        <Card className="rounded-[1.6rem] border-black/8">
          <CardHeader>
            <CardTitle>Asignación de roles por usuario</CardTitle>
            <CardDescription>Usa el `userId` real y asigna roles heredados. Overrides quedan como excepción separada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionHint>
              Esta primera versión es deliberadamente estricta: roles múltiples sí, permisos directos no. La API revoca sesiones cuando cambian asignaciones.
            </SectionHint>
            <form className="space-y-5" onSubmit={handleUserAssignmentsSubmit}>
              <InputRow label="User ID">
                <Input
                  value={userAssignmentsForm.userId}
                  disabled={!capabilities.canManageUsers}
                  onChange={(event) => setUserAssignmentsForm((current) => ({ ...current, userId: event.target.value }))}
                  placeholder="usr-001 o UUID real"
                />
              </InputRow>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#132016]">Roles asignables</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {assignableRoles.map((role) => (
                    <label key={role.id} className="flex items-start gap-3 rounded-[1.1rem] border border-black/8 px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={userAssignmentsForm.roleIds.includes(role.id)}
                        disabled={!capabilities.canManageUsers}
                        onChange={() => toggleRoleSelection(role.id)}
                      />
                      <span>
                        <span className="block font-medium text-[#132016]">{role.name}</span>
                        <span className="block text-xs text-black/50">
                          {role.code} · {surfaceLabels[role.surface]}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <InputRow label="Rol principal">
                <select
                  value={userAssignmentsForm.primaryRoleId}
                  disabled={!capabilities.canManageUsers || userAssignmentsForm.roleIds.length === 0}
                  onChange={(event) =>
                    setUserAssignmentsForm((current) => ({ ...current, primaryRoleId: event.target.value }))
                  }
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                >
                  <option value="">Selecciona un rol principal</option>
                  {assignableRoles
                    .filter((role) => userAssignmentsForm.roleIds.includes(role.id))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
              </InputRow>

              <Button type="submit" disabled={!capabilities.canManageUsers || submitting}>
                {submitting ? "Guardando..." : "Asignar roles"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!loading && activeTab === "overrides" ? (
        <Card className="rounded-[1.6rem] border-black/8">
          <CardHeader>
            <CardTitle>Overrides temporales</CardTitle>
            <CardDescription>Grant o revoke por usuario con expiración obligatoria, motivo y doble actor de trazabilidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={handleOverrideSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputRow label="Usuario objetivo">
                  <Input
                    value={overrideForm.userId}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, userId: event.target.value }))}
                    placeholder="usr-target"
                  />
                </InputRow>
                <InputRow label="Efecto">
                  <select
                    value={overrideForm.effect}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) =>
                      setOverrideForm((current) => ({ ...current, effect: event.target.value as "grant" | "revoke" }))
                    }
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                  >
                    <option value="grant">Grant</option>
                    <option value="revoke">Revoke</option>
                  </select>
                </InputRow>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputRow label="Permiso">
                  <select
                    value={overrideForm.permissionCode}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => {
                      const nextPermissionCode = event.target.value;
                      const nextPermission = catalog.permissions.find((permission) => permission.code === nextPermissionCode);
                      setOverrideForm((current) => ({
                        ...current,
                        permissionCode: nextPermissionCode,
                        scopeCode: nextPermission?.supportedScopes[0] ?? ""
                      }));
                    }}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                  >
                    <option value="">Selecciona permiso</option>
                    {catalog.permissions.map((permission) => (
                      <option key={permission.code} value={permission.code}>
                        {permission.code}
                      </option>
                    ))}
                  </select>
                </InputRow>
                <InputRow label="Scope">
                  <select
                    value={overrideForm.scopeCode}
                    disabled={!capabilities.canManageOverrides || availableScopes.length === 0}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, scopeCode: event.target.value }))}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
                  >
                    <option value="">Selecciona scope</option>
                    {availableScopes.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                </InputRow>
              </div>

              <InputRow label="Motivo">
                <Textarea
                  value={overrideForm.reason}
                  disabled={!capabilities.canManageOverrides}
                  onChange={(event) => setOverrideForm((current) => ({ ...current, reason: event.target.value }))}
                  placeholder="Cobertura temporal durante vacaciones, contingencia o soporte."
                />
              </InputRow>

              <div className="grid gap-4 md:grid-cols-2">
                <InputRow label="Aprobado por userId">
                  <Input
                    value={overrideForm.approvedByUserId}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, approvedByUserId: event.target.value }))}
                    placeholder="usr-approver"
                  />
                </InputRow>
                <InputRow label="Creado por userId">
                  <Input
                    value={overrideForm.createdByUserId}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, createdByUserId: event.target.value }))}
                    placeholder="usr-actor"
                  />
                </InputRow>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputRow label="Desde">
                  <Input
                    type="datetime-local"
                    value={overrideForm.startsAt}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, startsAt: event.target.value }))}
                  />
                </InputRow>
                <InputRow label="Expira">
                  <Input
                    type="datetime-local"
                    value={overrideForm.expiresAt}
                    disabled={!capabilities.canManageOverrides}
                    onChange={(event) => setOverrideForm((current) => ({ ...current, expiresAt: event.target.value }))}
                  />
                </InputRow>
              </div>

              <Button type="submit" disabled={!capabilities.canManageOverrides || submitting}>
                {submitting ? "Guardando..." : "Crear override"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!loading && activeTab === "navigation" ? (
        <Card className="rounded-[1.6rem] border-black/8">
          <CardHeader>
            <CardTitle>Navegación administrable</CardTitle>
            <CardDescription>Los módulos y rutas nacen por código; aquí solo gestionas grupo, orden, label override e icono.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={handleNavigationSubmit}>
              {internalModules.map((module) => {
                const draft = navigationDrafts[module.code];

                if (!draft) {
                  return null;
                }

                return (
                  <div key={module.code} className="grid gap-4 rounded-[1.25rem] border border-black/8 px-4 py-4 md:grid-cols-[1.1fr_0.8fr_0.6fr_0.7fr_auto]">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#132016]">{module.label}</p>
                      <p className="text-xs text-black/50">
                        {module.code} · {module.route}
                      </p>
                    </div>
                    <Input
                      value={draft.labelOverride ?? ""}
                      disabled={!capabilities.canManageRoles}
                      onChange={(event) =>
                        setNavigationDrafts((current) => ({
                          ...current,
                          [module.code]: { ...current[module.code], labelOverride: event.target.value }
                        }))
                      }
                      placeholder="Label override"
                    />
                    <select
                      value={draft.navigationGroupCode}
                      disabled={!capabilities.canManageRoles}
                      onChange={(event) =>
                        setNavigationDrafts((current) => ({
                          ...current,
                          [module.code]: { ...current[module.code], navigationGroupCode: event.target.value }
                        }))
                      }
                      className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
                    >
                      {internalNavigationGroups.map((group) => (
                        <option key={group.code} value={group.code}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={String(draft.sortOrder)}
                      disabled={!capabilities.canManageRoles}
                      onChange={(event) =>
                        setNavigationDrafts((current) => ({
                          ...current,
                          [module.code]: {
                            ...current[module.code],
                            sortOrder: Number(event.target.value || current[module.code].sortOrder)
                          }
                        }))
                      }
                      placeholder="Orden"
                    />
                    <label className="flex items-center gap-3 text-sm text-[#132016]">
                      <input
                        type="checkbox"
                        checked={draft.isVisible ?? true}
                        disabled={!capabilities.canManageRoles}
                        onChange={(event) =>
                          setNavigationDrafts((current) => ({
                            ...current,
                            [module.code]: { ...current[module.code], isVisible: event.target.checked }
                          }))
                        }
                      />
                      Visible
                    </label>
                  </div>
                );
              })}

              <Button type="submit" disabled={!capabilities.canManageRoles || submitting}>
                {submitting ? "Guardando..." : "Guardar navegación"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!loading && activeTab === "catalog" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[1.6rem] border-black/8">
            <CardHeader>
              <CardTitle>Permisos</CardTitle>
              <CardDescription>Catálogo canónico del sistema. No se inventan desde UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {catalog.permissions.map((permission) => (
                <div key={permission.code} className="rounded-[1.15rem] border border-black/8 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#132016]">{permission.label}</p>
                    <Badge tone={permission.isSystem ? "info" : "neutral"}>{permission.code}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-black/60">{permission.description ?? "Sin descripción."}</p>
                  <p className="mt-2 text-xs text-black/45">Scopes: {permission.supportedScopes.join(", ")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.6rem] border-black/8">
            <CardHeader>
              <CardTitle>Módulos y navegación</CardTitle>
              <CardDescription>Registro técnico que luego se vuelve menú configurable desde UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {catalog.modules.map((module) => (
                <div key={module.code} className="rounded-[1.15rem] border border-black/8 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#132016]">{module.label}</p>
                    <Badge tone="neutral">{module.code}</Badge>
                    <Badge tone="info">{surfaceLabels[module.surface]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-black/60">{module.description ?? "Sin descripción."}</p>
                  <p className="mt-2 text-xs text-black/45">
                    Route: {module.route} · Nav group: {module.navGroup}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
