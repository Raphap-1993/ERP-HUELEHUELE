import type { EffectivePermissionSummary } from "./access-control";
import { hasAdminAccess } from "./admin-access";
import type { NavigationItem } from "./models";

export interface NavigationGroupWithVisibility {
  title: string;
  items: NavigationItem[];
}

export function filterNavigationGroupsByRoles<T extends NavigationGroupWithVisibility>(
  groups: readonly T[],
  userRoles?: readonly string[]
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminAccess(userRoles, item.requiredRoles))
    }))
    .filter((group) => group.items.length > 0);
}

export function filterNavigationGroupsByPermissions<T extends NavigationGroupWithVisibility>(
  groups: readonly T[],
  effectivePermissions?: readonly EffectivePermissionSummary[],
  userRoles?: readonly string[]
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasAdminAccess(userRoles, item.requiredRoles, effectivePermissions, item.requiredPermissions)
      )
    }))
    .filter((group) => group.items.length > 0);
}
