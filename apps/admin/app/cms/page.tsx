import { CmsWorkspace } from "../../components/cms-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function CmsPage() {
  return (
    <AdminAuthGate
      title="CMS"
      description="Gestión de páginas, bloques, banners y contenido editorial."
      allowedRoles={adminAccessRoles.cms}
    >
      <CmsWorkspace />
    </AdminAuthGate>
  );
}
