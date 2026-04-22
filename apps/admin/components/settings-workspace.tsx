"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  type MediaAssetKindValue,
  type MediaAssetSummary,
  type SiteSetting,
  type WebNavigationGroup
} from "@huelegood/shared";
import {
  fetchAdminMediaAssets,
  fetchCmsOverview,
  updateCmsHeroCopy,
  updateCmsNavigation,
  updateCmsSiteSettings,
  uploadCmsAdminSidebarLogo,
  uploadCmsFavicon,
  uploadCmsHeaderLogo,
  uploadCmsHeroProductImage,
  uploadCmsLoadingImage
} from "../lib/api";

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
    adminSidebarLogoUrl: value.adminSidebarLogoUrl,
    heroProductImageUrl: value.heroProductImageUrl,
    loadingImageUrl: value.loadingImageUrl,
    faviconUrl: value.faviconUrl
  };
}

type SiteAssetField = "headerLogoUrl" | "adminSidebarLogoUrl" | "heroProductImageUrl" | "loadingImageUrl" | "faviconUrl";

const siteAssetPickerConfig: Record<
  SiteAssetField,
  {
    label: string;
    libraryLabel: string;
    kind: MediaAssetKindValue;
  }
> = {
  headerLogoUrl: {
    label: "Logo del header público",
    libraryLabel: "logos principales",
    kind: "logo"
  },
  adminSidebarLogoUrl: {
    label: "Logo del side menu",
    libraryLabel: "logos e íconos",
    kind: "logo"
  },
  heroProductImageUrl: {
    label: "Imagen del hero",
    libraryLabel: "imágenes hero",
    kind: "hero"
  },
  loadingImageUrl: {
    label: "Imagen de loading",
    libraryLabel: "logos y assets compactos",
    kind: "logo"
  },
  faviconUrl: {
    label: "Ícono del sitio",
    libraryLabel: "íconos y logos livianos",
    kind: "logo"
  }
};

function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes) {
    return "Sin tamaño";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsWorkspace() {
  const router = useRouter();
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
  const [adminSidebarLogoFile, setAdminSidebarLogoFile] = useState<File | null>(null);
  const [adminSidebarLogoUploading, setAdminSidebarLogoUploading] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [loadingImageFile, setLoadingImageFile] = useState<File | null>(null);
  const [loadingImageUploading, setLoadingImageUploading] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerField, setMediaPickerField] = useState<SiteAssetField | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetSummary[]>([]);
  const [mediaAssetsLoading, setMediaAssetsLoading] = useState(false);
  const [mediaAssetsError, setMediaAssetsError] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState("");

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
        label: "Side Menu",
        value: snapshot.siteSetting.adminSidebarLogoUrl ? "Propio" : snapshot.siteSetting.headerLogoUrl ? "Hereda" : "Texto",
        detail: snapshot.siteSetting.adminSidebarLogoUrl
          ? "El backoffice usa un logo dedicado."
          : snapshot.siteSetting.headerLogoUrl
            ? "El backoffice hereda el logo público."
            : "El backoffice sigue con fallback textual."
      }
    ],
    [snapshot]
  );

  const mediaPickerConfig = mediaPickerField ? siteAssetPickerConfig[mediaPickerField] : null;

  const filteredMediaAssets = useMemo(() => {
    const query = mediaSearch.trim().toLowerCase();

    if (!query) {
      return mediaAssets;
    }

    return mediaAssets.filter((asset) => {
      const haystack = [asset.filename, asset.objectKey, asset.url, asset.kind].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [mediaAssets, mediaSearch]);

  const hasPendingSiteChanges =
    JSON.stringify(normalizeSiteSetting(siteForm)) !== JSON.stringify(normalizeSiteSetting(snapshot.siteSetting));
  const sidebarLogoPreviewUrl = siteForm.adminSidebarLogoUrl?.trim() || siteForm.headerLogoUrl?.trim() || undefined;

  function syncSiteSetting(nextSiteSetting: SiteSetting) {
    setSiteForm(nextSiteSetting);
    setSnapshot((current) => ({
      ...current,
      siteSetting: nextSiteSetting
    }));
    startTransition(() => {
      router.refresh();
    });
  }

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function openMediaPicker(field: SiteAssetField) {
    setMediaPickerField(field);
    setMediaPickerOpen(true);
    setMediaSearch("");
    setMediaAssets([]);
    setMediaAssetsError(null);
    setMediaAssetsLoading(true);

    try {
      const response = await fetchAdminMediaAssets(siteAssetPickerConfig[field].kind, 120);
      setMediaAssets(response.data);
    } catch (fetchError) {
      setMediaAssetsError(fetchError instanceof Error ? fetchError.message : "No pudimos leer tu biblioteca en R2.");
    } finally {
      setMediaAssetsLoading(false);
    }
  }

  function closeMediaPicker() {
    setMediaPickerOpen(false);
    setMediaPickerField(null);
    setMediaAssets([]);
    setMediaAssetsError(null);
    setMediaAssetsLoading(false);
    setMediaSearch("");
  }

  function handleSelectMediaAsset(asset: MediaAssetSummary) {
    if (!mediaPickerField) {
      return;
    }

    const field = mediaPickerField;
    setSiteForm((current) => ({
      ...current,
      [field]: asset.url
    }));
    closeMediaPicker();
  }

  async function handleSaveSiteSettings() {
    setSavingSection("site");
    setError(null);

    try {
      const response = await updateCmsSiteSettings(normalizeSiteSetting(siteForm));
      if (response.siteSetting) {
        syncSiteSetting(response.siteSetting);
      }
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
        syncSiteSetting(response.siteSetting);
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
        syncSiteSetting(response.siteSetting);
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
        syncSiteSetting(response.siteSetting);
      }
      setLogoFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir el logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleUploadAdminSidebarLogo() {
    if (!adminSidebarLogoFile) {
      return;
    }

    setAdminSidebarLogoUploading(true);
    setError(null);

    try {
      const response = await uploadCmsAdminSidebarLogo(adminSidebarLogoFile);
      if (response.siteSetting) {
        syncSiteSetting(response.siteSetting);
      }
      setAdminSidebarLogoFile(null);
      refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir el logo del backoffice.");
    } finally {
      setAdminSidebarLogoUploading(false);
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <SectionHeader
        title="Configuración"
        description="Ordena branding del admin y storefront, parámetros operativos y navegación pública sin mezclar conceptos."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-[1.5rem] border-black/8 bg-[#f7faf6] shadow-[0_12px_34px_rgba(18,34,20,0.04)]">
          <CardContent className="space-y-3">
            <Badge tone="info">1. Branding</Badge>
            <div>
              <p className="text-base font-semibold text-[#132016]">Admin y storefront separados</p>
              <p className="text-sm leading-6 text-black/58">
                Aquí defines qué se ve en el side menu del backoffice, qué se ve en el header público y qué asset usa el sistema al cargar.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-black/8 bg-[#fbf8f2] shadow-[0_12px_34px_rgba(18,34,20,0.04)]">
          <CardContent className="space-y-3">
            <Badge tone="warning">2. Operación</Badge>
            <div>
              <p className="text-base font-semibold text-[#132016]">Contacto, billetera y envíos</p>
              <p className="text-sm leading-6 text-black/58">
                Estos valores afectan soporte visible, pagos manuales y reglas de costo de envío del checkout.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-black/8 bg-white shadow-[0_12px_34px_rgba(18,34,20,0.04)]">
          <CardContent className="space-y-3">
            <Badge tone="success">3. Storefront</Badge>
            <div>
              <p className="text-base font-semibold text-[#132016]">Hero y navegación pública</p>
              <p className="text-sm leading-6 text-black/58">
                La home y los enlaces visibles viven abajo. Ahí editas el mensaje comercial y el menú del storefront.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>Configuración base</CardTitle>
              <Badge tone={hasPendingSiteChanges ? "warning" : "success"}>
                {hasPendingSiteChanges ? "Cambios sin guardar" : "Todo al día"}
              </Badge>
            </div>
            <CardDescription>
              Branding del admin y storefront, canales de soporte y parámetros operativos. Los campos están ordenados por impacto real para que se entienda qué cambia al guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-4 md:col-span-2 xl:grid-cols-3">
              <div className="rounded-[1.25rem] border border-black/8 bg-[#f7faf6] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Backoffice</p>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  El logo del side menu es exclusivo del panel admin. Si lo dejas vacío, el admin hereda el logo público o cae al texto.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-black/8 bg-[#fbf8f2] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Storefront</p>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  El header público, la home y el favicon se editan aquí, pero ya no se mezclan con el branding visual del backoffice.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-black/8 bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Operación</p>
                <p className="mt-2 text-sm leading-6 text-black/58">
                  WhatsApp, correo, billetera y envíos afectan checkout, soporte y reglas operativas visibles para el equipo y el cliente.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-brand">
                Marca
              </label>
              <Input id="site-brand" value={siteForm.brandName} onChange={(event) => setSiteForm({ ...siteForm, brandName: event.target.value })} />
              <p className="text-xs leading-5 text-black/55">Nombre base para web, admin, metadata y fallback textual.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-support">
                Correo de soporte
              </label>
              <Input id="site-support" value={siteForm.supportEmail} onChange={(event) => setSiteForm({ ...siteForm, supportEmail: event.target.value })} />
              <p className="text-xs leading-5 text-black/55">Canal visible para atención y contacto operativo.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-tagline">
                Tagline
              </label>
              <Textarea id="site-tagline" value={siteForm.tagline} onChange={(event) => setSiteForm({ ...siteForm, tagline: event.target.value })} />
              <p className="text-xs leading-5 text-black/55">Texto corto de marca que acompaña bloques del storefront y piezas de apoyo.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-admin-sidebar-logo">
                Logo del side menu
              </label>
              <Input
                id="site-admin-sidebar-logo"
                placeholder="https://... o /brand/admin-logo.svg"
                value={siteForm.adminSidebarLogoUrl ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, adminSidebarLogoUrl: event.target.value || undefined })}
              />
              <div className="rounded-[1rem] border border-black/8 bg-[#17352a] p-3">
                <div className="flex items-center gap-3">
                  {sidebarLogoPreviewUrl ? (
                    <img src={sidebarLogoPreviewUrl} alt={siteForm.brandName} className="h-9 w-auto max-w-[72px] flex-shrink-0 object-contain" />
                  ) : (
                    <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff0e6]">
                      {siteForm.brandName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white max-2xl:hidden">{siteForm.brandName}</div>
                    <div className="text-[11px] text-[#a8c2b4]">Rail compacto</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(event) => setAdminSidebarLogoFile(event.target.files?.[0] ?? null)}
                  disabled={adminSidebarLogoUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUploadAdminSidebarLogo}
                    disabled={adminSidebarLogoUploading || !adminSidebarLogoFile}
                  >
                    {adminSidebarLogoUploading ? "Subiendo..." : "Subir logo admin"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void openMediaPicker("adminSidebarLogoUrl")}
                    disabled={adminSidebarLogoUploading}
                  >
                    Elegir desde biblioteca
                  </Button>
                </div>
              </div>
              <p className="text-xs leading-5 text-black/55">
                Solo afecta el menú lateral del backoffice. Si lo dejas vacío, el admin usará primero el logo público y luego el fallback textual.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-logo">
                Logo del header público
              </label>
              <Input
                id="site-logo"
                placeholder="https://... o /brand/logo.svg"
                value={siteForm.headerLogoUrl ?? ""}
                onChange={(event) => setSiteForm({ ...siteForm, headerLogoUrl: event.target.value || undefined })}
              />
              {siteForm.headerLogoUrl ? (
                <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/40">Logo actual</p>
                  <img src={siteForm.headerLogoUrl} alt="Logo actual del sitio" className="h-14 w-auto max-w-[220px] object-contain" />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  id="site-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  disabled={logoUploading}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={handleUploadLogo} disabled={logoUploading || !logoFile}>
                    {logoUploading ? "Subiendo..." : "Subir logo público"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void openMediaPicker("headerLogoUrl")} disabled={logoUploading}>
                    Elegir desde biblioteca
                  </Button>
                </div>
              </div>
              <p className="text-xs leading-5 text-black/55">
                Reemplaza el nombre textual en la cabecera pública. No cambia el side menu del admin salvo que el logo admin siga vacío.
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
                <Button type="button" variant="ghost" onClick={() => void openMediaPicker("loadingImageUrl")} disabled={loadingImageUploading}>
                  Elegir desde biblioteca
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                WebP, PNG o JPG. Se usa en la carga inicial del admin y la web pública. También puedes reutilizar un asset ya disponible en R2.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42">
                Ícono del sitio
              </label>
              {siteForm.faviconUrl ? (
                <div className="rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/40">Ícono actual</p>
                  <img
                    src={siteForm.faviconUrl}
                    alt="Ícono actual del sitio"
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
                  {faviconUploading ? "Subiendo..." : "Subir ícono"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void openMediaPicker("faviconUrl")} disabled={faviconUploading}>
                  Elegir desde biblioteca
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                SVG, PNG, ICO o WebP. Se aplica a la pestaña del navegador tanto en la web pública como en el panel admin. Máx. 2 MB.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-whatsapp">
                WhatsApp
              </label>
              <Input id="site-whatsapp" value={siteForm.whatsapp} onChange={(event) => setSiteForm({ ...siteForm, whatsapp: event.target.value })} />
              <p className="text-xs leading-5 text-black/55">Canal corto de soporte y contacto visible para el cliente.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-yape-number">
                Número de billetera
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
              <p className="text-xs leading-5 text-black/55">Ejemplo: Yape, Plin o la billetera real que verá el cliente al pagar manualmente.</p>
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
                Envío fijo (S/)
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
                Monto fijo de envío cuando el pedido no califica a envío gratis.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="site-free-shipping">
                Envío gratis desde (S/)
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
                Subtotal mínimo, menos descuentos, para que el envío pase a S/ 0.00.
              </p>
            </div>
            <div className="space-y-3 rounded-[1.5rem] border border-black/8 bg-[#f7f8f4] p-4 md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Lectura rápida del impacto</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-black/58">
                  `Logo del side menu` solo toca el sidebar del backoffice.
                </div>
                <div className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-black/58">
                  `Logo del header público` solo toca la cabecera visible del storefront.
                </div>
                <div className="rounded-[1rem] border border-black/8 bg-white px-4 py-3 text-sm text-black/58">
                  WhatsApp, billetera y envíos afectan checkout, soporte y operación.
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveSiteSettings} disabled={savingSection === "site"}>
                {savingSection === "site" ? "Guardando..." : "Guardar configuración base"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
          <CardHeader>
            <CardTitle>Hero del storefront</CardTitle>
            <CardDescription>Mensaje principal, CTAs e imagen del bloque hero de la home pública.</CardDescription>
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
                <Button type="button" variant="ghost" onClick={() => void openMediaPicker("heroProductImageUrl")} disabled={heroImageUploading}>
                  Elegir desde biblioteca
                </Button>
              </div>
              <p className="text-xs leading-5 text-black/55">
                PNG, JPG o WebP. Reemplaza la imagen del producto en la sección hero del inicio o reutiliza una imagen ya guardada en R2.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-black/8 shadow-[0_14px_42px_rgba(18,34,20,0.05)]">
        <CardHeader>
          <CardTitle>Navegación pública</CardTitle>
          <CardDescription>Editor avanzado del menú visible en el storefront. El resumen te muestra qué está publicado y el JSON de la derecha es la fuente editable.</CardDescription>
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
            <div className="rounded-[1.25rem] border border-black/8 bg-[#fbfbf8] px-4 py-3 text-sm leading-6 text-black/58">
              Edita grupos y enlaces con cuidado: si el JSON queda inválido no se guardará. Usa el resumen de la izquierda para entender la estructura actual antes de tocarla.
            </div>
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

      <Dialog open={mediaPickerOpen} onClose={closeMediaPicker} size="xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biblioteca de medios</DialogTitle>
            <DialogDescription>
              {mediaPickerConfig
                ? `Selecciona un asset ya guardado en R2 para ${mediaPickerConfig.label.toLowerCase()}.`
                : "Selecciona un asset ya guardado en R2."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/42" htmlFor="media-picker-search">
                  Buscar en R2
                </label>
                <Input
                  id="media-picker-search"
                  placeholder="Busca por nombre, carpeta o URL"
                  value={mediaSearch}
                  onChange={(event) => setMediaSearch(event.target.value)}
                />
              </div>
              <div className="rounded-[1.25rem] border border-black/8 bg-[#f7f8f4] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/40">Mostrando</p>
                <p className="mt-1 text-sm text-[#132016]">
                  {mediaPickerConfig ? mediaPickerConfig.libraryLabel : "assets existentes"} en tu bucket público
                </p>
              </div>
            </div>

            {mediaAssetsError ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {mediaAssetsError}
              </div>
            ) : null}

            {mediaAssetsLoading ? <p className="text-sm text-black/55">Cargando assets desde R2...</p> : null}

            {!mediaAssetsLoading && !mediaAssetsError && filteredMediaAssets.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-[#fbfbf8] px-5 py-8 text-sm text-black/58">
                No encontramos assets para este filtro. Prueba otra búsqueda o sube una imagen nueva.
              </div>
            ) : null}

            {filteredMediaAssets.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredMediaAssets.map((asset) => {
                  const selectedUrl = mediaPickerField ? siteForm[mediaPickerField] ?? "" : "";
                  const isSelected = selectedUrl === asset.url;

                  return (
                    <div
                      key={asset.objectKey}
                      className={`space-y-4 rounded-[1.5rem] border p-4 ${
                        isSelected ? "border-[#2f6f4f] bg-[#f4fbf6]" : "border-black/8 bg-white"
                      }`}
                    >
                      <div className="flex h-40 items-center justify-center overflow-hidden rounded-[1.2rem] border border-black/8 bg-[#f7f8f4] p-3">
                        <img
                          src={asset.url}
                          alt={asset.filename ?? asset.objectKey}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="truncate text-sm font-semibold text-[#132016]">
                          {asset.filename ?? asset.objectKey.split("/").pop() ?? asset.objectKey}
                        </p>
                        <p className="line-clamp-2 text-xs leading-5 text-black/52">{asset.objectKey}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-black/38">
                          <span>{asset.kind ?? "asset"}</span>
                          <span>{formatFileSize(asset.sizeBytes)}</span>
                          <span>{formatDate(asset.uploadedAt)}</span>
                        </div>
                      </div>
                      <Button type="button" variant={isSelected ? "primary" : "secondary"} onClick={() => handleSelectMediaAsset(asset)}>
                        {isSelected ? "Ya está seleccionada" : "Usar esta imagen"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <p className="max-w-2xl text-xs leading-5 text-black/45">
              Al elegir una imagen, solo cambiamos la URL del campo actual. No se sube un archivo nuevo ni se duplica el asset en R2.
            </p>
            <Button type="button" variant="secondary" onClick={closeMediaPicker}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando configuración...</p> : null}
    </div>
  );
}
