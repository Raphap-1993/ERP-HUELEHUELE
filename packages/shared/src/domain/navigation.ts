import { hasAdminAccess } from "./admin-access";
import type { NavigationItem } from "./models";
import type { RoleCode } from "./enums";

export interface NavigationGroupWithVisibility {
  title: string;
  items: NavigationItem[];
}

export function filterNavigationGroupsByRoles<T extends NavigationGroupWithVisibility>(
  groups: readonly T[],
  userRoles?: readonly RoleCode[]
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminAccess(userRoles, item.requiredRoles))
    }))
    .filter((group) => group.items.length > 0);
}
