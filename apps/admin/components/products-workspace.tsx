"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  SectionHeader,
  Separator,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import type {
  ProductAdminDetail,
  ProductAdminSummary,
  ProductCategorySummary,
  ProductImageSummary,
  ProductImageUploadInput,
  ProductStatusValue,
  ProductUpsertInput,
  ProductVariantInput,
  ProductVariantStatusValue
} from "@huelegood/shared";
import {
  createAdminProduct,
  deleteAdminProductImage,
  fetchAdminProduct,
  fetchAdminProductCategories,
  fetchAdminProducts,
  uploadAdminProductImage,
  updateAdminProduct
} from "../lib/api";

type VariantDraft = {
  id?: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string;
  stockOnHand: string;
  status: ProductVariantStatusValue;
};

type ProductFormState = {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  status: ProductStatusValue;
  isFeatured: boolean;
  variants: VariantDraft[];
};

const PRODUCT_STATUSES: ProductStatusValue[] = ["draft", "active", "inactive", "archived"];
const VARIANT_STATUSES: ProductVariantStatusValue[] = ["active", "inactive", "out_of_stock"];

function formatCurrency(value: number, currencyCode = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusTone(status: ProductStatusValue): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  if (status === "archived") {
    return "danger";
  }

  return "neutral";
}

function statusLabel(status: ProductStatusValue) {
  const labels: Record<ProductStatusValue, string> = {
    draft: "Borrador",
    active: "Activo",
    inactive: "Inactivo",
    archived: "Archivado"
  };

  return labels[status];
}

function variantStatusLabel(status: ProductVariantStatusValue) {
  const labels: Record<ProductVariantStatusValue, string> = {
    active: "Activa",
    inactive: "Inactiva",
    out_of_stock: "Sin stock"
  };

  return labels[status];
}

function variantStatusTone(status: ProductVariantStatusValue): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success";
  }

  if (status === "out_of_stock") {
    return "warning";
  }

  return "neutral";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createVariantDraft(seed?: Partial<VariantDraft>): VariantDraft {
  return {
    id: seed?.id,
    sku: seed?.sku ?? "",
    name: seed?.name ?? "Variante principal",
    price: seed?.price ?? "0",
    compareAtPrice: seed?.compareAtPrice ?? "",
    stockOnHand: seed?.stockOnHand ?? "0",
    status: seed?.status ?? "active"
  };
}

function createEmptyForm(): ProductFormState {
  return {
    categoryId: "",
    name: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    status: "draft",
    isFeatured: false,
    variants: [createVariantDraft()]
  };
}

function fromProductDetail(product: ProductAdminDetail): ProductFormState {
  return {
    categoryId: product.categoryId ?? "",
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    longDescription: product.longDescription ?? "",
    status: product.status,
    isFeatured: product.isFeatured,
    variants: (product.variants.length ? product.variants : [null]).map((variant, index) =>
      variant
        ? createVariantDraft({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            price: String(variant.price),
            compareAtPrice: variant.compareAtPrice != null ? String(variant.compareAtPrice) : "",
            stockOnHand: String(variant.stockOnHand),
            status: variant.status
          })
        : createVariantDraft({
            name: index === 0 ? "Variante principal" : `Variante ${index + 1}`
          })
    )
  };
}

function buildProductPayload(form: ProductFormState): ProductUpsertInput {
  const name = form.name.trim();
  const slug = slugify(form.slug || form.name);

  if (!name) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!slug) {
    throw new Error("El slug es obligatorio.");
  }

  const variantSkus = new Set<string>();
  const variants: ProductVariantInput[] = form.variants.map((variant, index) => {
    const sku = variant.sku.trim() || `${slug.toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
    const variantName = variant.name.trim() || (index === 0 ? "Variante principal" : `Variante ${index + 1}`);
    const price = Number(variant.price);
    const stockOnHand = Number(variant.stockOnHand);
    const compareAtPrice = variant.compareAtPrice.trim() ? Number(variant.compareAtPrice) : undefined;

    if (variantSkus.has(sku)) {
      throw new Error(`La SKU ${sku} está repetida en este producto.`);
    }
    variantSkus.add(sku);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`La variante ${sku} tiene un precio inválido.`);
    }

    if (!Number.isFinite(stockOnHand) || stockOnHand < 0) {
      throw new Error(`La variante ${sku} tiene un stock inválido.`);
    }

    if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
      throw new Error(`El precio comparativo de ${sku} es inválido.`);
    }

    return {
      id: variant.id,
      sku,
      name: variantName,
      price,
      compareAtPrice,
      stockOnHand: Math.trunc(stockOnHand),
      status: variant.status
    };
  });

  return {
    categoryId: form.categoryId.trim() || undefined,
    name,
    slug,
    shortDescription: form.shortDescription.trim() || undefined,
    longDescription: form.longDescription.trim() || undefined,
    status: form.status,
    isFeatured: form.isFeatured,
    variants
  };
}

function createInitialImageForm(): {
  file: File | null;
  altText: string;
  sortOrder: string;
  variantId: string;
  isPrimary: boolean;
} {
  return {
    file: null,
    altText: "",
    sortOrder: "0",
    variantId: "",
    isPrimary: false
  };
}

export function ProductsWorkspace() {
  const [products, setProducts] = useState<ProductAdminSummary[]>([]);
  const [categories, setCategories] = useState<ProductCategorySummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductAdminDetail | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ProductFormState>(() => createEmptyForm());
  const [imageForm, setImageForm] = useState(createInitialImageForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadList() {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetchAdminProducts(),
          fetchAdminProductCategories()
        ]);

        if (!active) {
          return;
        }

        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setError(null);

        if (!isCreating) {
          setSelectedProductId((current) => {
            if (!productsResponse.data.length) {
              return null;
            }

            if (!current) {
              return productsResponse.data[0]?.id ?? null;
            }

            const exists = productsResponse.data.some((product) => product.id === current);
            return exists ? current : productsResponse.data[0]?.id ?? null;
          });
        }

        if (!productsResponse.data.length && !isCreating) {
          setIsCreating(true);
          setSelectedProduct(null);
          setForm(createEmptyForm());
          setImageForm(createInitialImageForm());
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los productos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadList();

    return () => {
      active = false;
    };
  }, [isCreating, refreshKey]);

  useEffect(() => {
    if (!selectedProductId || isCreating) {
      setSelectedProduct(null);
      if (isCreating) {
        setForm((current) => (current.name || current.slug ? current : createEmptyForm()));
        setImageForm(createInitialImageForm());
      }
      return;
    }

    let active = true;
    const productId = selectedProductId;
    if (!productId) {
      return;
    }

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const response = await fetchAdminProduct(productId);
        if (!active) {
          return;
        }

        setSelectedProduct(response.data);
        setForm(fromProductDetail(response.data));
        setImageForm((current) => ({
          ...createInitialImageForm(),
          altText: current.altText || response.data.images[0]?.altText || `${response.data.name} - imagen principal`
        }));
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el producto.");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [isCreating, selectedProductId]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.slug,
        product.shortDescription,
        product.categoryName,
        product.categorySlug,
        product.sku
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [products, search]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId) ?? null,
    [categories, form.categoryId]
  );

  const metrics = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active").length;
    const featuredProducts = products.filter((product) => product.isFeatured).length;
    const activeCategories = categories.filter((category) => category.isActive).length;

    return [
      {
        label: "Productos",
        value: String(products.length),
        detail: "Referencias administrables en el catálogo."
      },
      {
        label: "Activos",
        value: String(activeProducts),
        detail: "Listos para storefront y checkout."
      },
      {
        label: "Destacados",
        value: String(featuredProducts),
        detail: "Visibles en home y secciones clave."
      },
      {
        label: "Categorías",
        value: String(activeCategories),
        detail: "Agrupaciones para navegación comercial."
      }
    ];
  }, [categories, products, selectedProduct]);

  const imageVariants = selectedProduct?.variants ?? form.variants.map((variant, index) => ({
    id: variant.id ?? `draft-${index}`,
    sku: variant.sku,
    name: variant.name,
    price: Number(variant.price || 0),
    compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : undefined,
    stockOnHand: Number(variant.stockOnHand || 0),
    status: variant.status
  }));

  function resetToCreate() {
    setIsCreating(true);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setForm(createEmptyForm());
    setImageForm(createInitialImageForm());
    setError(null);
    setFeedback(null);
  }

  async function refreshCatalog() {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetchAdminProducts(),
      fetchAdminProductCategories()
    ]);

    setProducts(productsResponse.data);
    setCategories(categoriesResponse.data);
  }

  async function reloadSelectedProduct(productId: string) {
    const response = await fetchAdminProduct(productId);
    setSelectedProduct(response.data);
    setForm(fromProductDetail(response.data));
    setImageForm((current) => ({
      ...createInitialImageForm(),
      altText: current.altText || response.data.images[0]?.altText || `${response.data.name} - imagen principal`
    }));
  }

  async function handleSelectProduct(productId: string) {
    setIsCreating(false);
    setSelectedProductId(productId);
  }

  function handleAddVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, createVariantDraft({ name: `Variante ${current.variants.length + 1}` })]
    }));
  }

  function handleRemoveVariant(index: number) {
    setForm((current) => {
      const nextVariants = current.variants.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...current,
        variants: nextVariants.length ? nextVariants : [createVariantDraft()]
      };
    });
  }

  function updateVariant(index: number, field: keyof VariantDraft, value: string | boolean) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, currentIndex) =>
        currentIndex === index
          ? {
              ...variant,
              [field]: value
            }
          : variant
      )
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = buildProductPayload(form);
      const response = isCreating || !selectedProductId
        ? await createAdminProduct(payload)
        : await updateAdminProduct(selectedProductId, payload);

      const savedProduct = response.product;
      if (savedProduct) {
        setSelectedProductId(savedProduct.id);
        setSelectedProduct(savedProduct);
        setForm(fromProductDetail(savedProduct));
        setImageForm((current) => ({
          ...createInitialImageForm(),
          altText: current.altText || savedProduct.images[0]?.altText || `${savedProduct.name} - imagen principal`
        }));
        setIsCreating(false);
        setFeedback(response.message);
      } else {
        setFeedback(response.message);
      }

      if (savedProduct?.id) {
        await reloadSelectedProduct(savedProduct.id);
      }
      void refreshCatalog().catch(() => undefined);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage() {
    if (!selectedProductId || !selectedProduct || !imageForm.file) {
      return;
    }

    setUploading(true);
    setError(null);
    setFeedback(null);

    try {
      const payload: ProductImageUploadInput & { file: File } = {
        file: imageForm.file,
        altText: imageForm.altText.trim() || undefined,
        sortOrder: Number(imageForm.sortOrder),
        isPrimary: imageForm.isPrimary,
        variantId: imageForm.variantId.trim() || undefined
      };

      if (!Number.isFinite(payload.sortOrder)) {
        throw new Error("El orden de imagen debe ser numérico.");
      }

      const response = await uploadAdminProductImage(selectedProductId, payload);
      setFeedback("Imagen subida correctamente.");
      setImageForm(createInitialImageForm());
      await reloadSelectedProduct(selectedProductId);
      void refreshCatalog().catch(() => undefined);
      return response;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(image: ProductImageSummary) {
    if (!selectedProductId || !selectedProduct) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la imagen "${image.altText ?? image.id}"?`);
    if (!confirmed) {
      return;
    }

    setUploading(true);
    setError(null);
    setFeedback(null);

    try {
      await deleteAdminProductImage(selectedProductId, image.id);
      setFeedback("Imagen eliminada correctamente.");
      await reloadSelectedProduct(selectedProductId);
      void refreshCatalog().catch(() => undefined);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No pudimos eliminar la imagen.");
    } finally {
      setUploading(false);
    }
  }

  const productRows = useMemo(
    () =>
      visibleProducts.map((product) => [
        <div key={`${product.id}-summary`} className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-2xl bg-[#f4f4f0]">
            {product.primaryImageUrl ? (
              <img src={product.primaryImageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                HH
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-[#132016]">{product.name}</div>
            <p className="text-xs text-black/50">{product.slug}</p>
          </div>
        </div>,
        <div key={`${product.id}-category`} className="text-sm text-black/70">
          <div className="font-medium text-[#132016]">{product.categoryName ?? "Sin categoría"}</div>
          <div className="text-xs text-black/45">{product.categorySlug ?? "productos"}</div>
        </div>,
        <StatusBadge key={`${product.id}-status`} label={statusLabel(product.status)} tone={statusTone(product.status)} />,
        <div key={`${product.id}-price`} className="text-sm font-semibold text-[#132016]">
          {formatCurrency(product.price, product.currencyCode)}
        </div>,
        <div key={`${product.id}-updated`} className="text-sm text-black/60">{formatDate(product.updatedAt)}</div>,
        <Button key={`${product.id}-action`} size="sm" variant="secondary" onClick={() => void handleSelectProduct(product.id)}>
          Editar
        </Button>
      ]),
    [visibleProducts]
  );

  const tableRows = loading
    ? [[<span key="loading" className="text-black/50">Cargando productos...</span>, null, null, null, null, null]]
    : productRows.length
      ? productRows
      : [[<span key="empty" className="text-black/50">No hay productos registrados todavía.</span>, null, null, null, null, null]];

  const selectedTitle = isCreating
    ? "Nuevo producto"
    : selectedProduct?.name ?? "Selecciona un producto";

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Productos"
        description="Gestiona catálogo, variantes e imágenes desde el backoffice con subida directa a R2."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Listado</CardTitle>
                <CardDescription>Selecciona una referencia para editarla o crea una nueva.</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={resetToCreate}>
                Nuevo producto
              </Button>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, slug o categoría"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-black/45">
              <Badge tone="info">{visibleProducts.length} resultados</Badge>
              <span>Se muestra el catálogo administrable actual.</span>
            </div>

            <AdminDataTable
              title="Productos"
              description={loading ? "Cargando catálogo..." : "Lista administrable de productos."}
              headers={["Producto", "Categoría", "Estado", "Precio", "Actualizado", "Acción"]}
              rows={tableRows}
            />

            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-[#132016]">{category.name}</div>
                      <div className="text-xs text-black/45">{category.slug}</div>
                    </div>
                    <Badge tone={category.isActive ? "success" : "neutral"}>{category.productCount}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{selectedTitle}</CardTitle>
                  <CardDescription>
                    {isCreating
                      ? "Define la ficha base y guarda para habilitar la carga de imágenes."
                      : selectedProduct
                        ? "Edita la ficha, variantes y media del producto."
                        : "Selecciona un producto del listado."}
                  </CardDescription>
                </div>
                {detailLoading ? <Badge tone="info">Cargando detalle...</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(event) => void handleSave(event)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Nombre</span>
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                          slug: current.slug || slugify(event.target.value)
                        }))
                      }
                      placeholder="Inhalador Premium Negro"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Slug</span>
                    <Input
                      value={form.slug}
                      onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                      placeholder="premium-negro"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Categoría</span>
                    <select
                      value={form.categoryId}
                      onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {selectedCategory ? (
                      <p className="text-xs text-black/45">Categoría activa: {selectedCategory.name}</p>
                    ) : null}
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Estado</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, status: event.target.value as ProductStatusValue }))
                      }
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                    >
                      {PRODUCT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-[1.25rem] border border-black/8 bg-[#fafaf7] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-[#2d6a4f]"
                  />
                  <div>
                    <div className="font-medium text-[#132016]">Producto destacado</div>
                    <div className="text-xs text-black/50">Se mostrará con prioridad en home y bloques curados.</div>
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Descripción corta</span>
                  <Textarea
                    value={form.shortDescription}
                    onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
                    placeholder="Frescura herbal de bolsillo para viajes y trayectos."
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Descripción larga</span>
                  <Textarea
                    value={form.longDescription}
                    onChange={(event) => setForm((current) => ({ ...current, longDescription: event.target.value }))}
                    placeholder="Texto ampliado para ficha, SEO y catálogo."
                    className="min-h-36"
                  />
                </label>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[#132016]">Variantes</div>
                      <div className="text-sm text-black/55">Necesitamos al menos una variante para poder guardar.</div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddVariant}>
                      Añadir variante
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {form.variants.map((variant, index) => (
                      <div key={variant.id ?? `${variant.sku || "draft"}-${index}`} className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] p-4">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Badge tone="info">Variante {index + 1}</Badge>
                            <StatusBadge label={variantStatusLabel(variant.status)} tone={variantStatusTone(variant.status)} />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRemoveVariant(index)}
                            disabled={form.variants.length === 1}
                          >
                            Quitar
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">SKU</span>
                            <Input
                              value={variant.sku}
                              onChange={(event) => updateVariant(index, "sku", event.target.value)}
                              placeholder="HUELE-NEGRO-01"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Nombre</span>
                            <Input
                              value={variant.name}
                              onChange={(event) => updateVariant(index, "name", event.target.value)}
                              placeholder="Principal"
                            />
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Precio</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.price}
                              onChange={(event) => updateVariant(index, "price", event.target.value)}
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Precio comparativo</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.compareAtPrice}
                              onChange={(event) => updateVariant(index, "compareAtPrice", event.target.value)}
                              placeholder="Opcional"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Stock</span>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stockOnHand}
                              onChange={(event) => updateVariant(index, "stockOnHand", event.target.value)}
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Estado</span>
                            <select
                              value={variant.status}
                              onChange={(event) =>
                                updateVariant(index, "status", event.target.value as ProductVariantStatusValue)
                              }
                              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                            >
                              {VARIANT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {variantStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-black/55">
                    {isCreating ? "Guardar creará el producto y habilitará la subida de imágenes." : "Los cambios se aplican al producto seleccionado."}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {isCreating ? (
                      <Button type="button" variant="secondary" onClick={() => setIsCreating(false)} disabled={!products.length}>
                        Volver al listado
                      </Button>
                    ) : null}
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Imágenes</CardTitle>
                  <CardDescription>
                    {selectedProduct
                      ? "Carga imágenes a R2 y asígnalas al producto actual."
                      : "Selecciona o crea un producto para gestionar media."}
                  </CardDescription>
                </div>
                {selectedProduct ? <Badge tone="info">{selectedProduct.images.length} adjuntos</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Archivo</span>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setImageForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] ?? null
                      }))
                    }
                  />
                  <p className="text-xs text-black/45">Sube JPG, PNG o WebP optimizado para storefront.</p>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Texto alternativo</span>
                  <Input
                    value={imageForm.altText}
                    onChange={(event) => setImageForm((current) => ({ ...current, altText: event.target.value }))}
                    placeholder="Imagen del producto"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Orden</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={imageForm.sortOrder}
                    onChange={(event) => setImageForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-[#132016]">Variante</span>
                  <select
                    value={imageForm.variantId}
                    onChange={(event) => setImageForm((current) => ({ ...current, variantId: event.target.value }))}
                    className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                    disabled={!selectedProduct}
                  >
                    <option value="">Sin variante</option>
                    {imageVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} ({variant.sku})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-[1.25rem] border border-black/8 bg-[#fafaf7] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={imageForm.isPrimary}
                    onChange={(event) => setImageForm((current) => ({ ...current, isPrimary: event.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-[#2d6a4f]"
                    disabled={!selectedProduct}
                  />
                  <div>
                    <div className="font-medium text-[#132016]">Principal</div>
                    <div className="text-xs text-black/50">Reemplaza la imagen principal del producto.</div>
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-black/55">
                  {selectedProduct
                    ? "Las imágenes se publican sobre el bucket R2 ya configurado en producción."
                    : "Primero guarda el producto para habilitar la carga."}
                </div>
                <Button type="button" onClick={() => void handleUploadImage()} disabled={!selectedProduct || !imageForm.file || uploading}>
                  {uploading ? "Subiendo..." : "Subir imagen"}
                </Button>
              </div>

              <Separator />

              {selectedProduct ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedProduct.images.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-[1.25rem] border border-black/8 bg-[#fafaf7]">
                      <div className="aspect-[4/3] bg-black/5">
                        <img src={image.url} alt={image.altText ?? selectedProduct.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-[#132016]">{image.altText ?? "Sin alt"}</div>
                            <div className="text-xs text-black/45">{image.url}</div>
                          </div>
                          {image.isPrimary ? <Badge tone="success">Principal</Badge> : null}
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-black/50">
                            Orden {image.sortOrder}
                            {image.variantId ? ` · Variante ${image.variantId}` : ""}
                          </div>
                          <Button type="button" size="sm" variant="danger" onClick={() => void handleDeleteImage(image)} disabled={uploading}>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!selectedProduct.images.length ? (
                    <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-[#fafaf7] p-6 text-sm text-black/55">
                      Este producto todavía no tiene imágenes.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-[#fafaf7] p-6 text-sm text-black/55">
                  Guarda un producto para empezar a subir imágenes.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
