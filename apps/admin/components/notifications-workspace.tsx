"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  SectionHeader,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import {
  NotificationChannel,
  NotificationStatus,
  type NotificationInput,
  type NotificationLogSummary,
  type NotificationSummary
} from "@huelegood/shared";
import { createNotification, fetchNotificationLogs, fetchNotifications } from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function notificationTone(status: NotificationStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === NotificationStatus.Sent || status === NotificationStatus.Delivered) {
    return "success";
  }

  if (status === NotificationStatus.Pending) {
    return "warning";
  }

  if (status === NotificationStatus.Failed) {
    return "danger";
  }

  return "neutral";
}

function notificationStatusLabel(status: NotificationStatus) {
  const labels: Record<NotificationStatus, string> = {
    pending: "Pendiente",
    sent: "Enviada",
    delivered: "Entregada",
    failed: "Fallida"
  };

  return labels[status];
}

function channelLabel(channel: NotificationInput["channel"]) {
  const labels: Record<NotificationInput["channel"], string> = {
    email: "Email",
    sms: "SMS",
    whatsapp: "WhatsApp",
    internal: "Interna"
  };

  return labels[channel];
}

export function NotificationsWorkspace() {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [logs, setLogs] = useState<NotificationLogSummary[]>([]);
  const [channel, setChannel] = useState<NotificationInput["channel"]>(NotificationChannel.Email);
  const [audience, setAudience] = useState("Carlos Gómez");
  const [subject, setSubject] = useState("Actualización de Huelegood");
  const [body, setBody] = useState("Este es un mensaje de seguimiento.");
  const [source, setSource] = useState("manual");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [notificationsResponse, logsResponse] = await Promise.all([fetchNotifications(), fetchNotificationLogs()]);

        if (!active) {
          return;
        }

        setNotifications(notificationsResponse.data);
        setLogs(logsResponse.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar notificaciones.");
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
  }, [refreshKey]);

  const metrics = useMemo(
    () => [
      {
        label: "Notificaciones",
        value: String(notifications.length),
        detail: "Cola y bitácora operativa."
      },
      {
        label: "Pendientes",
        value: String(notifications.filter((notification) => notification.status === NotificationStatus.Pending).length),
        detail: "A la espera de envío."
      },
      {
        label: "Enviadas",
        value: String(notifications.filter((notification) => notification.status === NotificationStatus.Sent).length),
        detail: "Ya salieron del sistema."
      },
      {
        label: "Logs",
        value: String(logs.length),
        detail: "Eventos trazables del sistema."
      }
    ],
    [logs.length, notifications]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleCreateNotification() {
    setActionLoading(true);
    setError(null);

    try {
      await createNotification({
        channel,
        audience: audience.trim(),
        subject: subject.trim(),
        body: body.trim(),
        source: source.trim() || undefined,
        scheduledAt: scheduledAt.trim() || undefined
      });
      setSubject("Actualización de Huelegood");
      setBody("Este es un mensaje de seguimiento.");
      setScheduledAt("");
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos crear la notificación.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Notificaciones"
        description="Cola operativa, bitácora de eventos y mensajes internos o al cliente."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva notificación</CardTitle>
          <CardDescription>Registra mensajes internos, emails o recordatorios operativos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-channel">
              Canal
            </label>
            <select
              id="notification-channel"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
              value={channel}
              onChange={(event) => setChannel(event.target.value as NotificationInput["channel"])}
            >
              <option value={NotificationChannel.Email}>Email</option>
              <option value={NotificationChannel.Sms}>SMS</option>
              <option value={NotificationChannel.Whatsapp}>WhatsApp</option>
              <option value={NotificationChannel.Internal}>Interna</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-audience">
              Audiencia
            </label>
            <Input id="notification-audience" value={audience} onChange={(event) => setAudience(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-subject">
              Asunto
            </label>
            <Input id="notification-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-body">
              Mensaje
            </label>
            <Textarea id="notification-body" value={body} onChange={(event) => setBody(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-source">
              Origen
            </label>
            <Input id="notification-source" value={source} onChange={(event) => setSource(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#132016]" htmlFor="notification-schedule">
              Programación
            </label>
            <Input
              id="notification-schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleCreateNotification} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Crear notificación"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Notificaciones"
        description="Mensajes creados para seguimiento o envío."
        headers={["Canal", "Audiencia", "Asunto", "Estado", "Origen", "Programada", "Enviada", "Actualizada"]}
        rows={notifications.map((notification) => [
          channelLabel(notification.channel),
          notification.audience,
          notification.subject,
          <StatusBadge
            key={`${notification.id}-status`}
            label={notificationStatusLabel(notification.status)}
            tone={notificationTone(notification.status)}
          />,
          notification.source,
          formatDate(notification.scheduledAt),
          formatDate(notification.sentAt),
          formatDate(notification.updatedAt)
        ])}
      />

      <AdminDataTable
        title="Bitácora"
        description="Eventos de pedidos, loyalty, campañas y acciones manuales."
        headers={["Evento", "Fuente", "Sujeto", "Detalle", "Fecha"]}
        rows={logs.map((log) => [log.eventName, log.source, log.subject, log.detail, formatDate(log.occurredAt)])}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando notificaciones...</p> : null}
    </div>
  );
}
