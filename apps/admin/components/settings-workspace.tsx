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
import { fetchCmsOverview, updateCmsHeroCopy, updateCmsNavigation, updateCmsSiteSettings, uploadCmsHeaderLogo, uploadCmsHeroProductImage, uploadCmsLoadingImage, uploadCmsFavicon } from "../lib/api";

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
    whatsapp: value.whatsapp,
    shippingFlatRate: value.shippingFlatRate,
    freeShippingThreshold: value.freeShippingThreshold,
    yapeNumber: value.yapeNumber,
    walletType: value.walletType,
    walletOwnerName: value.walletOwnerName,
    headerLogoUrl: value.headerLogoUrl,
    heroProductImageUrl: value.heroProductImageUrl,
    loadingImageUrl: value.loadingImageUrl,
    faviconUrl: value.faviconUrl
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
  const [savingSection, setSavingSection] = useState<"site" | "hero" | "navigation" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [loadingImageFile, setLoadingImageFile] = useState<File | null>(null);
  const [loadingImageUploading, setLoadingImageUploading] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUploading, setFaviconUploading] = useState(false);

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
        detail: "Bloques visibles de navegación pública."
      },
      {
        label: "Enlaces",
        value: String(navigationPreviewCount(snapshot.webNavigation)),
        detail: "Rutas activas del storefront."
      },
      {
        label: "Páginas",
        value: String(snapshot.pages.length),
        detail: "Páginas editables registradas."
      },
      {
        label: "Logo",
        value: snapshot.siteSetting.headerLogoUrl ? "Activo" : "Texto",
        detail: snapshot.siteSetting.headerLogoUrl ? "La cabecera usa imagen." : "La cabecera usa nombre en texto."
      }
    ],
    [snapshot]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleSaveSiteSettings() {
    setSavingSection("site");
    setError(null);

    try {
      await updateCmsSiteSettings(normalizeSiteSetting(siteForm));
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la configuración base.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveHeroCopy() {
    setSavingSection("hero");
    setError(null);

    try {
      await updateCmsHeroCopy(heroForm);
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar el hero.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleSaveNavigation() {
    setSavingSection("navigation");
    setError(null);

    try {
      const parsed = JSON.parse(navigationJson) as WebNavigationGroup[];
      await updateCmsNavigation(parsed);
      refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la navegación.");
    } finally {
      setSavingSection(null);
    }
  }

  async function handleUploadHeroImage() {
    if (!heroImageFile) return;
    setHeroImageUploading(true);
    setError(null);
    try {
      const response = await uploadCmsHeroProductImage(heroImageFile);
      if (response.siteSetting) {
        setSiteForm(response.siteSetting);
      }
      setHeroImageFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen hero.");
    } finally {
      setHeroImageUploading(false);
    }
  }

  async function handleUploadLoadingImage() {
    if (!loadingImageFile) return;
    setLoadingImageUploading(true);
    setError(null);
    try {
      const response = await uploadCmsLoadingImage(loadingImageFile);
      if (response.siteSetting) {
        setSiteForm(response.siteSetting);
      }
      setLoadingImageFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen de loading.");
    } finally {
      setLoadingImageUploading(false);
    }
  }

  async function handleUploadFavicon() {
    if (!faviconFile) return;
    setFaviconUploading(true);
    setError(null);
    try {
      const response = await uploadCmsFavicon(faviconFile);
      if (response.siteSetting) {
        setSiteForm(response.siteSetting);
      }
      setFaviconFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir el favicon.");
    } finally {
      setFaviconUploading(false);
    }
  }

  async function handleUploadLogo() {
    if (!logoFile) {
      return;
    }

    setLogoUploading(true);
    setError(null);

    try {
      const response = await uploadCmsHeaderLogo(logoFile);
      if (response.siteSetting) {
        setSiteForm(response.siteSetting);
      }
      setLogoFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir el logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <SectionHeader
        title="Configuración"
        description="Branding, navegación y mensajes públicos del storefront desde un panel más ordenado."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="space-y-6">
        <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
          <CardHeader>
            <CardTitle>Identidad y contacto</CardTitle>
            <CardDescription>Valores base que alimentan la navegación, el footer y el branding público.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-brand">
                Marca
              </label>
              <Input id="site-brand" value={siteForm.brandName} onChange={(event) => setSiteForm({ ...siteForm, brandName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-support">
                Soporte
              </label>
              <Input id="site-support" value={siteForm.supportEmail} onChange={(event) => setSiteForm({ ...siteForm, supportEmail: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-tagline">
                Tagline
              </label>
              <Textarea id="site-tagline" value={siteForm.tagline} onChange={(event) => setSiteForm({ ...siteForm, tagline: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-logo">
                Logo del menú
              </label>
              <Input
                id="site-logo"
                placeholder="https://... o /brand/logo.svg"
                value={siteForm.headerLogoUrl ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, headerLogoUrl: event.target.value || undefined })}
              />
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  id="site-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  disabled={logoUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <Button type="button" variant="secondary" onClick={handleUploadLogo} disabled={logoUploading || !logoFile}>
                  {logoUploading ? "Subiendo..." : "Subir logo"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                Si defines una imagen, la cabecera pública reemplaza el texto de marca. Si lo dejas vacío, vuelve al nombre en texto.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-hero-image">
                Imagen del hero
              </label>
              <Input
                id="site-hero-image"
                placeholder="https://... o /brand/hero.jpg"
                value={siteForm.heroProductImageUrl ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, heroProductImageUrl: event.target.value || undefined })}
              />
              <p className="text-xs leading-5 text-black/55">
                Define aquí la imagen principal del home. También puedes subir una nueva desde el bloque de hero y luego guardar.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">
                Imagen de loading
              </label>
              {siteForm.loadingImageUrl ? (
                <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/40">Imagen actual</p>
                  <img
                    src={siteForm.loadingImageUrl}
                    alt="Loading screen actual"
                    className="h-[60px] w-[60px] rounded-xl object-contain"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/webp,image/png,image/jpeg"
                  onChange={(event) => setLoadingImageFile(event.target.files?.[0] ?? null)}
                  disabled={loadingImageUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUploadLoadingImage}
                  disabled={loadingImageUploading || !loadingImageFile}
                >
                  {loadingImageUploading ? "Subiendo..." : "Subir loading"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                WebP, PNG o JPG. Se muestra centrado a 150 × 150 px al cargar la web pública.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">
                Favicon del navegador
              </label>
              {siteForm.faviconUrl ? (
                <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/40">Favicon actual</p>
                  <img
                    src={siteForm.faviconUrl}
                    alt="Favicon actual"
                    className="h-8 w-8 rounded object-contain"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/svg+xml,image/png,image/x-icon,image/webp"
                  onChange={(event) => setFaviconFile(event.target.files?.[0] ?? null)}
                  disabled={faviconUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <Button type="button" variant="secondary" onClick={handleUploadFavicon} disabled={faviconUploading || !faviconFile}>
                  {faviconUploading ? "Subiendo..." : "Subir favicon"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                SVG (recomendado), PNG o ICO. Se usa como ícono en la pestaña del navegador. Máx. 2 MB.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-whatsapp">
                WhatsApp
              </label>
              <Input id="site-whatsapp" value={siteForm.whatsapp} onChange={(event) => setSiteForm({ ...siteForm, whatsapp: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-yape-number">
                Número Yape
              </label>
              <Input
                id="site-yape-number"
                placeholder="+51 999 000 000"
                value={siteForm.yapeNumber ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, yapeNumber: event.target.value })}
              />
              <p className="text-xs leading-5 text-black/55">
                Número de la billetera virtual que verá el cliente al pagar.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-wallet-type">
                Tipo de billetera
              </label>
              <Input
                id="site-wallet-type"
                placeholder="Ej: Yape, Plin, Tunki..."
                value={siteForm.walletType ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, walletType: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-wallet-owner">
                Titular de la billetera
              </label>
              <Input
                id="site-wallet-owner"
                placeholder="Nombre del titular"
                value={siteForm.walletOwnerName ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, walletOwnerName: event.target.value })}
              />
              <p className="text-xs leading-5 text-black/55">
                Nombre que aparecerá debajo del número al momento de pagar.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-shipping-flat">
                Envio fijo (S/)
              </label>
              <Input
                id="site-shipping-flat"
                inputMode="decimal"
                value={String(siteForm.shippingFlatRate)}
                onChange={(event) =>
                  setSiteForm({
                    ...siteForm,
                    shippingFlatRate: event.target.value ? Number(event.target.value) : 0
                  })
                }
              />
              <p className="text-xs leading-5 text-black/55">
                Monto fijo de envio cuando el pedido no califica a envio gratis.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-free-shipping">
                Envio gratis desde (S/)
              </label>
              <Input
                id="site-free-shipping"
                inputMode="decimal"
                value={String(siteForm.freeShippingThreshold)}
                onChange={(event) =>
                  setSiteForm({
                    ...siteForm,
                    freeShippingThreshold: event.target.value ? Number(event.target.value) : 0
                  })
                }
              />
              <p className="text-xs leading-5 text-black/55">
                Subtotal (menos descuentos) minimo para que el envio sea S/ 0.00.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/8 bg-[#f7f8f4] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Vista previa cabecera</p>
              <div className="mt-3 flex min-h-14 items-center rounded-[1rem] border border-black/8 bg-white px-4">
                {siteForm.headerLogoUrl ? (
                  <img src={siteForm.headerLogoUrl} alt={siteForm.brandName} className="h-10 w-auto max-w-[180px] object-contain" />
                ) : (
                  <span className="text-xs uppercase tracking-[0.38em] text-black/42">{siteForm.brandName}</span>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveSiteSettings} disabled={savingSection === "site"}>
                {savingSection === "site" ? "Guardando..." : "Guardar identidad"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
          <CardHeader>
            <CardTitle>Hero del storefront</CardTitle>
            <CardDescription>Mensaje principal de la home y sus llamadas a la acción.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-eyebrow">
                Eyebrow
              </label>
              <Input id="hero-eyebrow" value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-title">
                Título
              </label>
              <Input id="hero-title" value={heroForm.title} onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-description">
                Descripción
              </label>
              <Textarea id="hero-description" value={heroForm.description} onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-primary-label">
                CTA principal
              </label>
              <Input
                id="hero-primary-label"
                value={heroForm.primaryCta.label}
                onChange={(event) => setHeroForm({ ...heroForm, primaryCta: { ...heroForm.primaryCta, label: event.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-primary-href">
                Ruta principal
              </label>
              <Input
                id="hero-primary-href"
                value={heroForm.primaryCta.href}
                onChange={(event) => setHeroForm({ ...heroForm, primaryCta: { ...heroForm.primaryCta, href: event.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-secondary-label">
                CTA secundaria
              </label>
              <Input
                id="hero-secondary-label"
                value={heroForm.secondaryCta.label}
                onChange={(event) => setHeroForm({ ...heroForm, secondaryCta: { ...heroForm.secondaryCta, label: event.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="hero-secondary-href">
                Ruta secundaria
              </label>
              <Input
                id="hero-secondary-href"
                value={heroForm.secondaryCta.href}
                onChange={(event) => setHeroForm({ ...heroForm, secondaryCta: { ...heroForm.secondaryCta, href: event.target.value } })}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveHeroCopy} disabled={savingSection === "hero"}>
                {savingSection === "hero" ? "Guardando..." : "Guardar hero"}
              </Button>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">
                Imagen del producto hero
              </label>
              {siteForm.heroProductImageUrl ? (
                <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/40">Imagen actual</p>
                  <img
                    src={siteForm.heroProductImageUrl}
                    alt="Imagen hero actual"
                    className="max-h-32 rounded-xl object-contain"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setHeroImageFile(event.target.files?.[0] ?? null)}
                  disabled={heroImageUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUploadHeroImage}
                  disabled={heroImageUploading || !heroImageFile}
                >
                  {heroImageUploading ? "Subiendo..." : "Subir imagen hero"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                PNG, JPG o WebP. Reemplaza la imagen del producto en la sección hero del inicio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
        <CardHeader>
          <CardTitle>Navegación pública</CardTitle>
          <CardDescription>Editor avanzado de grupos y enlaces visibles en el storefront.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-4 rounded-[1.5rem] border border-black/8 bg-[#f7f8f4] p-5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Resumen actual</p>
              <p className="text-sm leading-6 text-black/58">
                {snapshot.webNavigation.length} grupos y {navigationPreviewCount(snapshot.webNavigation)} enlaces visibles.
              </p>
            </div>
            <div className="grid gap-3">
              {snapshot.webNavigation.map((group) => (
                <div key={group.title} className="rounded-[1.2rem] border border-black/8 bg-white px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">{group.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <StatusBadge key={`${group.title}-${item.href}`} label={item.label} tone="neutral" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Textarea value={navigationJson} onChange={(event) => setNavigationJson(event.target.value)} className="min-h-64 font-mono text-xs" />
            <Button onClick={handleSaveNavigation} disabled={savingSection === "navigation"}>
              {savingSection === "navigation" ? "Guardando..." : "Guardar navegación"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <SectionHeader title="Lectura operativa" description="Inventario actual de páginas, SEO y navegación publicada." />
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminDataTable
            title="Páginas"
            description="Páginas publicables y su estado."
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
        </div>
      </section>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando configuración...</p> : null}
    </div>
  );
}
