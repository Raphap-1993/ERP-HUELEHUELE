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
  heroCopy as defaultHeroCopy,
  siteSetting as defaultSiteSetting,
  webNavigation as defaultWebNavigation,
  type CmsHeroCopyInput,
  type CmsSnapshotResponse,
  type CmsSiteSettingsInput,
  type HeroCopy,
  type SiteSetting,
  type WebNavigationGroup
} from "@huelegood/shared";
import { fetchCmsOverview, updateCmsHeroCopy, updateCmsNavigation, updateCmsSiteSettings } from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function pageStatusLabel(status: CmsSnapshotResponse["pages"][number]["status"]) {
  const labels: Record<CmsSnapshotResponse["pages"][number]["status"], string> = {
    draft: "Borrador",
    published: "Publicado",
    archived: "Archivado"
  };

  return labels[status];
}

function pageStatusTone(status: CmsSnapshotResponse["pages"][number]["status"]) {
  if (status === "published") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  return "neutral";
}

function navigationPreviewCount(groups: WebNavigationGroup[]) {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}

function cloneHeroForm(copy: HeroCopy): CmsHeroCopyInput {
  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    description: copy.description,
    primaryCta: { ...copy.primaryCta },
    secondaryCta: { ...copy.secondaryCta }
  };
}

function normalizeSiteSetting(value: SiteSetting): CmsSiteSettingsInput {
  return {
    brandName: value.brandName,
    tagline: value.tagline,
    supportEmail: value.supportEmail,
    whatsapp: value.whatsapp
  };
}

export function SettingsWorkspace() {
  const [snapshot, setSnapshot] = useState<CmsSnapshotResponse>({
    siteSetting: defaultSiteSetting,
    heroCopy: defaultHeroCopy,
    webNavigation: defaultWebNavigation,
    banners: [],
    faqs: [],
    pages: [],
    testimonials: [],
    seoMeta: []
  });
  const [siteForm, setSiteForm] = useState<SiteSetting>(defaultSiteSetting);
  const [heroForm, setHeroForm] = useState<CmsHeroCopyInput>(cloneHeroForm(defaultHeroCopy));
  const [navigationJson, setNavigationJson] = useState(JSON.stringify(defaultWebNavigation, null, 2));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const response = await fetchCmsOverview();
        if (!active) {
          return;
        }

        setSnapshot(response.data);
        setSiteForm(response.data.siteSetting);
        setHeroForm(cloneHeroForm(response.data.heroCopy));
        setNavigationJson(JSON.stringify(response.data.webNavigation, null, 2));
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar la configuración.");
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
        label: "Grupos",
        value: String(snapshot.webNavigation.length),
        detail: "Secciones visibles en la barra pública."
      },
      {
        label: "Enlaces",
        value: String(navigationPreviewCount(snapshot.webNavigation)),
        detail: "Navegación directa al storefront."
      },
      {
        label: "Páginas",
        value: String(snapshot.pages.length),
        detail: "Blueprints publicables."
      },
      {
        label: "Publicado",
        value: String(snapshot.pages.filter((page) => page.status === "published").length),
        detail: "Páginas visibles al usuario."
      }
    ],
    [snapshot]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleSaveSiteSettings() {
    setActionLoading(true);
    setError(null);

    try {
      await updateCmsSiteSettings(normalizeSiteSetting(siteForm));
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la configuración base.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveHeroCopy() {
    setActionLoading(true);
    setError(null);

    try {
      await updateCmsHeroCopy(heroForm);
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el hero.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveNavigation() {
    setActionLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(navigationJson) as WebNavigationGroup[];
      await updateCmsNavigation(parsed);
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la navegación.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Configuración" description="Branding, hero, navegación y parámetros base del storefront." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuración base</CardTitle>
            <CardDescription>Valores base que alimentan storefront, admin y API.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="site-brand">
                Marca
              </label>
              <Input id="site-brand" value={siteForm.brandName} onChange={(event) => setSiteForm({ ...siteForm, brandName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="site-support">
                Soporte
              </label>
              <Input
                id="site-support"
                value={siteForm.supportEmail}
                onChange={(event) => setSiteForm({ ...siteForm, supportEmail: event.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="site-tagline">
                Tagline
              </label>
              <Textarea id="site-tagline" value={siteForm.tagline} onChange={(event) => setSiteForm({ ...siteForm, tagline: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="site-whatsapp">
                WhatsApp
              </label>
              <Input id="site-whatsapp" value={siteForm.whatsapp} onChange={(event) => setSiteForm({ ...siteForm, whatsapp: event.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveSiteSettings} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Guardar configuración base"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hero del storefront</CardTitle>
            <CardDescription>Mensaje principal de la home y sus llamadas a la acción.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-eyebrow">
                Eyebrow
              </label>
              <Input id="hero-eyebrow" value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-title">
                Título
              </label>
              <Input id="hero-title" value={heroForm.title} onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-description">
                Descripción
              </label>
              <Textarea
                id="hero-description"
                value={heroForm.description}
                onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-primary-label">
                CTA principal
              </label>
              <Input
                id="hero-primary-label"
                value={heroForm.primaryCta.label}
                onChange={(event) =>
                  setHeroForm({
                    ...heroForm,
                    primaryCta: { ...heroForm.primaryCta, label: event.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-primary-href">
                Ruta principal
              </label>
              <Input
                id="hero-primary-href"
                value={heroForm.primaryCta.href}
                onChange={(event) =>
                  setHeroForm({
                    ...heroForm,
                    primaryCta: { ...heroForm.primaryCta, href: event.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-secondary-label">
                CTA secundaria
              </label>
              <Input
                id="hero-secondary-label"
                value={heroForm.secondaryCta.label}
                onChange={(event) =>
                  setHeroForm({
                    ...heroForm,
                    secondaryCta: { ...heroForm.secondaryCta, label: event.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#132016]" htmlFor="hero-secondary-href">
                Ruta secundaria
              </label>
              <Input
                id="hero-secondary-href"
                value={heroForm.secondaryCta.href}
                onChange={(event) =>
                  setHeroForm({
                    ...heroForm,
                    secondaryCta: { ...heroForm.secondaryCta, href: event.target.value }
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveHeroCopy} disabled={actionLoading}>
                {actionLoading ? "Guardando..." : "Guardar hero"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navegación</CardTitle>
          <CardDescription>Editar grupos y enlaces visibles en el storefront mediante JSON estructurado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={navigationJson} onChange={(event) => setNavigationJson(event.target.value)} className="min-h-52 font-mono text-xs" />
          <Button onClick={handleSaveNavigation} disabled={actionLoading}>
            {actionLoading ? "Guardando..." : "Guardar navegación"}
          </Button>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Páginas"
        description="Blueprints publicables y su estado."
        headers={["Slug", "Título", "Estado", "Bloques", "SEO", "Actualizado"]}
        rows={snapshot.pages.map((page) => [
          page.slug,
          page.title,
          <StatusBadge key={`${page.slug}-status`} label={pageStatusLabel(page.status)} tone={pageStatusTone(page.status)} />,
          String(page.blocks.length),
          page.seoMeta.title,
          formatDate(page.updatedAt)
        ])}
      />

      <AdminDataTable
        title="SEO"
        description="Metadatos por página."
        headers={["Página", "Canonical", "Robots", "Actualizado"]}
        rows={snapshot.seoMeta.map((meta) => [meta.pageSlug, meta.canonicalPath ?? "-", meta.robots, formatDate(meta.updatedAt)])}
      />

      <AdminDataTable
        title="Navegación visible"
        description="Rutas editadas desde el CMS."
        headers={["Grupo", "Etiqueta", "Ruta", "Externa"]}
        rows={snapshot.webNavigation.flatMap((group) =>
          group.items.map((item) => [group.title, item.label, item.href, item.external ? "Sí" : "No"])
        )}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando configuración...</p> : null}
    </div>
  );
}
