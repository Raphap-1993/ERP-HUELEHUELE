import { NotificationsWorkspace } from "../../components/notifications-workspace";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { adminAccessRoles } from "@huelegood/shared";

export default function NotificationsPage() {
  return (
    <AdminAuthGate
      title="Notificaciones"
      description="Mensajes internos y logs de envío."
      allowedRoles={adminAccessRoles.notifications}
    >
      <NotificationsWorkspace />
    </AdminAuthGate>
  );
}
