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
  ProductVariantSummary,
  ProductVariantStatusValue,
  WarehouseSummary
} from "@huelegood/shared";
import { ProductSalesChannel } from "@huelegood/shared";
import {
  createAdminProduct,
  deleteAdminProductImage,
  fetchAdminWarehouses,
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
  flavorCode: string;
  flavorLabel: string;
  presentationCode: string;
  presentationLabel: string;
  defaultWarehouseId: string;
  price: string;
  compareAtPrice: string;
  stockOnHand: string;
  lowStockThreshold: string;
  status: ProductVariantStatusValue;
};

type BundleComponentDraft = {
  id?: string;
  productId: string;
  variantId: string;
  quantity: string;
};

type ProductFormState = {
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  status: ProductStatusValue;
  salesChannel: ProductSalesChannel;
  reportingGroup: string;
  isFeatured: boolean;
  variants: VariantDraft[];
  bundleComponents: BundleComponentDraft[];
};

const PRODUCT_STATUSES: ProductStatusValue[] = ["draft", "active", "inactive", "archived"];
const VARIANT_STATUSES: ProductVariantStatusValue[] = ["active", "inactive", "out_of_stock"];
const COMBO_CATEGORY_SLUG = "bundles";

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

function displayCategoryName(category?: { slug?: string; name?: string | null } | null) {
  if (category?.slug === COMBO_CATEGORY_SLUG) {
    return "Combos";
  }

  return category?.name ?? "Sin categoría";
}

function displayCategorySlug(categorySlug?: string) {
  return categorySlug === COMBO_CATEGORY_SLUG ? "combos" : categorySlug ?? "productos";
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
    flavorCode: seed?.flavorCode ?? "",
    flavorLabel: seed?.flavorLabel ?? "",
    presentationCode: seed?.presentationCode ?? "",
    presentationLabel: seed?.presentationLabel ?? "",
    defaultWarehouseId: seed?.defaultWarehouseId ?? "",
    price: seed?.price ?? "0",
    compareAtPrice: seed?.compareAtPrice ?? "",
    stockOnHand: seed?.stockOnHand ?? "0",
    lowStockThreshold: seed?.lowStockThreshold ?? "100",
    status: seed?.status ?? "active"
  };
}

function createBundleComponentDraft(seed?: Partial<BundleComponentDraft>): BundleComponentDraft {
  return {
    id: seed?.id,
    productId: seed?.productId ?? "",
    variantId: seed?.variantId ?? "",
    quantity: seed?.quantity ?? "1"
  };
}

function bundleVariantLabel(variant: ProductVariantSummary) {
  return `${variant.name} · ${variant.sku}`;
}

function getActiveBundleVariants(product?: ProductAdminDetail | null) {
  return product?.variants.filter((variant) => variant.status === "active") ?? [];
}

function getPreferredBundleVariantId(product?: ProductAdminDetail | null) {
  const activeVariants = getActiveBundleVariants(product);
  return activeVariants.length === 1 ? activeVariants[0]?.id ?? "" : "";
}

function createEmptyForm(): ProductFormState {
  return {
    categoryId: "",
    name: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    status: "draft",
    salesChannel: ProductSalesChannel.Public,
    reportingGroup: "",
    isFeatured: false,
    variants: [createVariantDraft()],
    bundleComponents: []
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
    salesChannel: product.salesChannel ?? ProductSalesChannel.Public,
    reportingGroup: product.reportingGroup ?? "",
    isFeatured: product.isFeatured,
    variants: (product.variants.length ? product.variants : [null]).map((variant, index) =>
      variant
        ? createVariantDraft({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            flavorCode: variant.flavorCode ?? "",
            flavorLabel: variant.flavorLabel ?? "",
            presentationCode: variant.presentationCode ?? "",
            presentationLabel: variant.presentationLabel ?? "",
            defaultWarehouseId: variant.defaultWarehouseId ?? "",
            price: String(variant.price),
            compareAtPrice: variant.compareAtPrice != null ? String(variant.compareAtPrice) : "",
            stockOnHand: String(variant.stockOnHand),
            lowStockThreshold: String(variant.lowStockThreshold ?? 100),
            status: variant.status
          })
        : createVariantDraft({
            name: index === 0 ? "Variante principal" : `Variante ${index + 1}`
          })
    ),
    bundleComponents: product.bundleComponents.length
      ? product.bundleComponents.map((component) =>
          createBundleComponentDraft({
            id: component.id,
            productId: component.productId,
            variantId: component.variantId ?? "",
            quantity: String(component.quantity)
          })
        )
      : []
  };
}

function buildProductPayload(
  form: ProductFormState,
  products: ProductAdminSummary[],
  categories: ProductCategorySummary[]
): ProductUpsertInput {
  const name = form.name.trim();
  const slug = slugify(form.slug || form.name);
  const selectedCategory = categories.find((category) => category.id === form.categoryId) ?? null;
  const isCombo = selectedCategory?.slug === COMBO_CATEGORY_SLUG || form.bundleComponents.length > 0;

  if (!name) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!slug) {
    throw new Error("El slug es obligatorio.");
  }

  if (isCombo && form.bundleComponents.length === 0) {
    throw new Error("Un combo necesita al menos un componente para calcular su stock.");
  }

  const variantSkus = new Set<string>();
  const variants: ProductVariantInput[] = form.variants.map((variant, index) => {
    const sku = variant.sku.trim() || `${slug.toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
    const variantName = variant.name.trim() || (index === 0 ? "Variante principal" : `Variante ${index + 1}`);
    const flavorLabel = variant.flavorLabel.trim() || undefined;
    const flavorCode = (variant.flavorCode.trim() || slugify(variant.flavorLabel)).trim() || undefined;
    const presentationLabel = variant.presentationLabel.trim() || undefined;
    const presentationCode = (variant.presentationCode.trim() || slugify(variant.presentationLabel)).trim() || undefined;
    const price = Number(variant.price);
    const stockOnHand = isCombo ? 0 : Number(variant.stockOnHand);
    const lowStockThreshold = isCombo ? 0 : Number(variant.lowStockThreshold);
    const compareAtPrice = variant.compareAtPrice.trim() ? Number(variant.compareAtPrice) : undefined;

    if (variantSkus.has(sku)) {
      throw new Error(`La SKU ${sku} está repetida en este producto.`);
    }
    variantSkus.add(sku);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`La variante ${sku} tiene un precio inválido.`);
    }

    if (!isCombo && (!Number.isFinite(stockOnHand) || stockOnHand < 0)) {
      throw new Error(`La variante ${sku} tiene un stock inválido.`);
    }

    if (!isCombo && (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0)) {
      throw new Error(`La variante ${sku} tiene un umbral de stock inválido.`);
    }

    if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
      throw new Error(`El precio comparativo de ${sku} es inválido.`);
    }

    return {
      id: variant.id,
      sku,
      name: variantName,
      flavorCode,
      flavorLabel,
      presentationCode,
      presentationLabel,
      defaultWarehouseId: isCombo ? undefined : variant.defaultWarehouseId.trim() || undefined,
      price,
      compareAtPrice,
      stockOnHand: Math.trunc(stockOnHand),
      lowStockThreshold: Math.trunc(lowStockThreshold),
      status: variant.status
    };
  });

  const productById = new Map(products.map((product) => [product.id, product]));
  const bundleComponentKeys = new Set<string>();
  const bundleComponents = form.bundleComponents.map((component, index) => {
    const productId = component.productId.trim();
    if (!productId) {
      throw new Error(`El componente ${index + 1} necesita un producto.`);
    }

    const quantity = Number(component.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`El componente ${index + 1} tiene una cantidad inválida.`);
    }

    const product = productById.get(productId);
    if (!product) {
      throw new Error(`El producto componente ${productId} no existe en el catálogo cargado.`);
    }

    const variantId = component.variantId.trim() || product.defaultVariantId || "";
    const dedupeKey = `${productId}:${variantId}`;
    if (bundleComponentKeys.has(dedupeKey)) {
      throw new Error(`El componente ${product.name} está repetido en el bundle.`);
    }
    bundleComponentKeys.add(dedupeKey);

    return {
      productId,
      variantId: variantId || undefined,
      quantity: Math.trunc(quantity)
    };
  });

  return {
    categoryId: form.categoryId.trim() || undefined,
    productKind: isCombo ? "bundle" : "single",
    name,
    slug,
    shortDescription: form.shortDescription.trim() || undefined,
    longDescription: form.longDescription.trim() || undefined,
    status: form.status,
    salesChannel: form.salesChannel,
    reportingGroup: form.reportingGroup.trim() || undefined,
    isFeatured: form.isFeatured,
    variants,
    bundleComponents
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
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [bundleComponentProducts, setBundleComponentProducts] = useState<Record<string, ProductAdminDetail>>({});
  const [bundleComponentProductLoading, setBundleComponentProductLoading] = useState<Record<string, boolean>>({});
  const [bundleComponentProductErrors, setBundleComponentProductErrors] = useState<Record<string, string>>({});
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
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ficha" | "imagenes">("ficha");

  useEffect(() => {
    let active = true;

    async function loadList() {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse, warehousesResponse] = await Promise.all([
          fetchAdminProducts(),
          fetchAdminProductCategories(),
          fetchAdminWarehouses()
        ]);

        if (!active) {
          return;
        }

        setProducts(productsResponse.data);
        setCategories(categoriesResponse.data);
        setWarehouses(warehousesResponse.data);
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
  const isComboProduct = selectedCategory?.slug === COMBO_CATEGORY_SLUG || form.bundleComponents.length > 0;
  const hasMultipleVariants = form.variants.length > 1;
  const primaryVariant = form.variants[0] ?? createVariantDraft();

  const componentProductOptions = useMemo(
    () => products.filter((product) => product.id !== selectedProductId),
    [products, selectedProductId]
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const metrics = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active").length;
    const featuredProducts = products.filter((product) => product.isFeatured).length;
    const internalProducts = products.filter((product) => product.salesChannel === "internal").length;
    const comboProducts = products.filter((product) => product.categorySlug === COMBO_CATEGORY_SLUG).length;

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
        label: "Internos / combos",
        value: `${internalProducts} / ${comboProducts}`,
        detail: "Canal interno y bundles del catálogo."
      }
    ];
  }, [products]);

  const imageVariants = selectedProduct?.variants ?? form.variants.map((variant, index) => ({
    id: variant.id ?? `draft-${index}`,
    sku: variant.sku,
    name: variant.name,
    price: Number(variant.price || 0),
    compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : undefined,
    stockOnHand: Number(variant.stockOnHand || 0),
    status: variant.status
  }));

  useEffect(() => {
    const productIds = Array.from(
      new Set(
        form.bundleComponents
          .map((component) => component.productId.trim())
          .filter(Boolean)
      )
    );
    const missingProductIds = productIds.filter(
      (productId) =>
        !bundleComponentProducts[productId] &&
        !bundleComponentProductLoading[productId] &&
        !bundleComponentProductErrors[productId]
    );

    if (!missingProductIds.length) {
      return;
    }

    let active = true;

    missingProductIds.forEach((productId) => {
      setBundleComponentProductLoading((current) =>
        current[productId] ? current : { ...current, [productId]: true }
      );

      void fetchAdminProduct(productId)
        .then((response) => {
          if (!active) {
            return;
          }

          setBundleComponentProductErrors((current) => {
            if (!current[productId]) {
              return current;
            }

            const next = { ...current };
            delete next[productId];
            return next;
          });
          setBundleComponentProducts((current) => ({ ...current, [productId]: response.data }));
        })
        .catch((fetchError) => {
          if (!active) {
            return;
          }

          setBundleComponentProductErrors((current) => ({
            ...current,
            [productId]: fetchError instanceof Error ? fetchError.message : "No pudimos cargar las variantes."
          }));
        })
        .finally(() => {
          if (!active) {
            return;
          }

          setBundleComponentProductLoading((current) => {
            if (!current[productId]) {
              return current;
            }

            const next = { ...current };
            delete next[productId];
            return next;
          });
        });
    });

    return () => {
      active = false;
    };
  }, [bundleComponentProductLoading, bundleComponentProducts, form.bundleComponents]);

  useEffect(() => {
    setForm((current) => {
      let changed = false;

      const nextBundleComponents = current.bundleComponents.map((component) => {
        const productId = component.productId.trim();
        if (!productId) {
          return component;
        }

        const product = bundleComponentProducts[productId];
        if (!product) {
          return component;
        }

        const preferredVariantId = getPreferredBundleVariantId(product);
        if (preferredVariantId && component.variantId !== preferredVariantId) {
          changed = true;
          return {
            ...component,
            variantId: preferredVariantId
          };
        }

        return component;
      });

      return changed ? { ...current, bundleComponents: nextBundleComponents } : current;
    });
  }, [bundleComponentProducts]);

  function resetToCreate() {
    setIsCreating(true);
    setSelectedProductId(null);
    setSelectedProduct(null);
    setForm(createEmptyForm());
    setImageForm(createInitialImageForm());
    setError(null);
    setFeedback(null);
    setActiveTab("ficha");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function refreshCatalog() {
    const [productsResponse, categoriesResponse, warehousesResponse] = await Promise.all([
      fetchAdminProducts(),
      fetchAdminProductCategories(),
      fetchAdminWarehouses()
    ]);

    setProducts(productsResponse.data);
    setCategories(categoriesResponse.data);
    setWarehouses(warehousesResponse.data);
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
    setActiveTab("ficha");
    setModalOpen(true);
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

  function handleAddBundleComponent() {
    const defaultProductId = componentProductOptions[0]?.id ?? "";
    const defaultProduct = defaultProductId ? bundleComponentProducts[defaultProductId] ?? null : null;

    setForm((current) => ({
      ...current,
      bundleComponents: [
        ...current.bundleComponents,
        createBundleComponentDraft({
          productId: defaultProductId,
          variantId: getPreferredBundleVariantId(defaultProduct)
        })
      ]
    }));
  }

  function handleRemoveBundleComponent(index: number) {
    setForm((current) => {
      const nextBundleComponents = current.bundleComponents.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...current,
        bundleComponents: nextBundleComponents
      };
    });
  }

  function updateBundleComponent(index: number, field: keyof BundleComponentDraft, value: string) {
    setForm((current) => ({
      ...current,
      bundleComponents: current.bundleComponents.map((component, currentIndex) =>
        currentIndex === index
          ? {
              ...component,
              [field]: value
            }
          : component
      )
    }));
  }

  function handleBundleComponentProductChange(index: number, productId: string) {
    const product = bundleComponentProducts[productId] ?? null;
    setBundleComponentProductErrors((current) => {
      if (!current[productId]) {
        return current;
      }

      const next = { ...current };
      delete next[productId];
      return next;
    });
    setForm((current) => ({
      ...current,
      bundleComponents: current.bundleComponents.map((component, currentIndex) =>
        currentIndex === index
          ? {
              ...component,
              productId,
              variantId: getPreferredBundleVariantId(product)
            }
          : component
      )
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = buildProductPayload(form, products, categories);
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
          <div className="font-medium text-[#132016]">
            {displayCategoryName({ slug: product.categorySlug, name: product.categoryName })}
          </div>
          <div className="text-xs text-black/45">{displayCategorySlug(product.categorySlug)}</div>
        </div>,
        <div key={`${product.id}-channel`} className="text-sm text-black/70">
          <div className="font-medium text-[#132016]">{product.salesChannel === "internal" ? "Interno" : "Público"}</div>
          <div className="text-xs text-black/45">{product.reportingGroup ?? "Sin grupo"}</div>
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
    ? [[<span key="loading" className="text-black/50">Cargando productos...</span>, null, null, null, null, null, null]]
    : productRows.length
      ? productRows
      : [[<span key="empty" className="text-black/50">No hay productos registrados todavía.</span>, null, null, null, null, null, null]];

  const selectedTitle = isCreating
    ? "Nuevo producto"
    : selectedProduct?.name ?? "Selecciona un producto";

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Productos"
        description="Gestiona catálogo, combos, precios e imágenes. El conteo operativo por almacén vive en Inventario."
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
            headers={["Producto", "Categoría", "Canal", "Estado", "Precio", "Actualizado", "Acción"]}
            rows={tableRows}
          />

          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#132016]">{displayCategoryName(category)}</div>
                    <div className="text-xs text-black/45">{displayCategorySlug(category.slug)}</div>
                  </div>
                  <Badge tone={category.isActive ? "success" : "neutral"}>{category.productCount}</Badge>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-[#d9e7dd] bg-[#f7fbf8]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1a3a2e]">Inventario operativo separado del catálogo</p>
                <p className="text-sm leading-6 text-black/60">
                  `Productos` define la ficha comercial y el almacén preferido. El stock físico, reservas y disponible
                  para vender se mantienen en `Inventario`.
                </p>
              </div>
              <Button href="/inventario" variant="secondary">
                Abrir inventario
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={closeModal} size="xl">
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>{selectedTitle}</DialogTitle>
                <DialogDescription>
                  {isCreating
                    ? "Define la ficha base y guarda para habilitar la carga de imágenes."
                    : selectedProduct
                      ? "Edita la ficha comercial, los combos y la media del producto."
                      : "Cargando producto..."}
                </DialogDescription>
              </div>
              {detailLoading ? <Badge tone="info">Cargando...</Badge> : null}
            </div>
            <div className="mt-4 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("ficha")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "ficha" ? "bg-[#132016] text-white" : "text-black/55 hover:text-[#132016]"}`}
              >
                Ficha del producto
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("imagenes")}
                disabled={isCreating || !selectedProduct}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-35 ${activeTab === "imagenes" ? "bg-[#132016] text-white" : "text-black/55 hover:text-[#132016]"}`}
              >
                Imágenes {selectedProduct ? `(${selectedProduct.images.length})` : ""}
              </button>
            </div>
          </DialogHeader>

          <DialogBody>
            {activeTab === "ficha" && (
              <form id="product-form" className="space-y-6" onSubmit={(event) => void handleSave(event)}>
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
                          {displayCategoryName(category)}
                        </option>
                      ))}
                    </select>
                    {selectedCategory ? (
                      <p className="text-xs text-black/45">
                        Categoría activa: {displayCategoryName(selectedCategory)}
                      </p>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Canal de venta</span>
                    <select
                      value={form.salesChannel}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, salesChannel: event.target.value as ProductSalesChannel }))
                      }
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                    >
                      <option value={ProductSalesChannel.Public}>Público</option>
                      <option value={ProductSalesChannel.Internal}>Interno</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-[#132016]">Grupo de reporte</span>
                    <Input
                      value={form.reportingGroup}
                      onChange={(event) => setForm((current) => ({ ...current, reportingGroup: event.target.value }))}
                      placeholder="Retail, Canal interno, Wholesale..."
                    />
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
                      <div className="font-semibold text-[#132016]">
                        {hasMultipleVariants ? "Opciones de venta" : "Presentación comercial"}
                      </div>
                      <div className="text-sm text-black/55">
                        {isComboProduct
                          ? "Define SKU, precio y estado del combo. El stock disponible se calcula desde sus componentes."
                          : hasMultipleVariants
                            ? "Cada opción define su SKU, precio, stock y estado."
                            : "Aquí defines el SKU, precio, stock y estado del producto sin exponer variantes técnicas."}
                      </div>
                    </div>
                    {hasMultipleVariants ? (
                      <Button type="button" variant="secondary" size="sm" onClick={handleAddVariant}>
                        Añadir opción
                      </Button>
                    ) : null}
                  </div>

                  {hasMultipleVariants ? (
                    <div className="space-y-4">
                      {form.variants.map((variant, index) => (
                        <div key={variant.id ?? `${variant.sku || "draft"}-${index}`} className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] p-4">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <Badge tone="info">Opción {index + 1}</Badge>
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
                              <span className="text-sm font-medium text-[#132016]">Nombre visible</span>
                              <Input
                                value={variant.name}
                                onChange={(event) => updateVariant(index, "name", event.target.value)}
                                placeholder="Presentación principal"
                              />
                            </label>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Sabor</span>
                              <Input
                                value={variant.flavorLabel}
                                onChange={(event) => updateVariant(index, "flavorLabel", event.target.value)}
                                placeholder="Verde Herbal"
                              />
                            </label>
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Código sabor</span>
                              <Input
                                value={variant.flavorCode}
                                onChange={(event) => updateVariant(index, "flavorCode", event.target.value)}
                                placeholder="verde-herbal"
                              />
                            </label>
                            {!isComboProduct ? (
                              <label className="space-y-1.5">
                                <span className="text-sm font-medium text-[#132016]">Almacén preferido</span>
                                <select
                                  value={variant.defaultWarehouseId}
                                  onChange={(event) => updateVariant(index, "defaultWarehouseId", event.target.value)}
                                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                                >
                                  <option value="">Sin asignar</option>
                                  {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                      {warehouse.name} · {warehouse.code}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-xs text-black/45">Se usa como sugerencia inicial del despacho.</span>
                              </label>
                            ) : null}
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Presentación</span>
                              <Input
                                value={variant.presentationLabel}
                                onChange={(event) => updateVariant(index, "presentationLabel", event.target.value)}
                                placeholder="Unitario"
                              />
                            </label>
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Código presentación</span>
                              <Input
                                value={variant.presentationCode}
                                onChange={(event) => updateVariant(index, "presentationCode", event.target.value)}
                                placeholder="unitario"
                              />
                            </label>
                          </div>

                          <div className="mt-4 rounded-[1rem] border border-black/8 bg-white px-3 py-2 text-xs text-black/55">
                            {isComboProduct
                              ? "El combo no registra stock inicial ni almacén base propio. Inventario calcula su disponibilidad desde el stock de los componentes."
                              : "El stock operativo por variante y almacén se mantiene en `Inventario`. Aquí solo configuras el valor inicial/base de la ficha."}
                          </div>

                          <div className={`mt-4 grid gap-4 ${isComboProduct ? "md:grid-cols-3" : "md:grid-cols-5"}`}>
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
                            {!isComboProduct ? (
                              <>
                                <label className="space-y-1.5">
                                  <span className="text-sm font-medium text-[#132016]">Stock inicial/base</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={variant.stockOnHand}
                                    onChange={(event) => updateVariant(index, "stockOnHand", event.target.value)}
                                  />
                                </label>
                                <label className="space-y-1.5">
                                  <span className="text-sm font-medium text-[#132016]">Umbral alerta</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={variant.lowStockThreshold}
                                    onChange={(event) => updateVariant(index, "lowStockThreshold", event.target.value)}
                                  />
                                </label>
                              </>
                            ) : null}
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
                  ) : (
                    <div className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <Badge tone="info">Única presentación</Badge>
                        <StatusBadge
                          label={variantStatusLabel(primaryVariant.status)}
                          tone={variantStatusTone(primaryVariant.status)}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">SKU</span>
                          <Input
                            value={primaryVariant.sku}
                            onChange={(event) => updateVariant(0, "sku", event.target.value)}
                            placeholder="HUELE-NEGRO-01"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Nombre interno</span>
                          <Input
                            value={primaryVariant.name}
                            onChange={(event) => updateVariant(0, "name", event.target.value)}
                            placeholder="Presentación principal"
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Sabor</span>
                          <Input
                            value={primaryVariant.flavorLabel}
                            onChange={(event) => updateVariant(0, "flavorLabel", event.target.value)}
                            placeholder="Verde Herbal"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Código sabor</span>
                          <Input
                            value={primaryVariant.flavorCode}
                            onChange={(event) => updateVariant(0, "flavorCode", event.target.value)}
                            placeholder="verde-herbal"
                          />
                        </label>
                        {!isComboProduct ? (
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium text-[#132016]">Origen preferido</span>
                            <select
                              value={primaryVariant.defaultWarehouseId}
                              onChange={(event) => updateVariant(0, "defaultWarehouseId", event.target.value)}
                              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                            >
                              <option value="">Sin asignar</option>
                              {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                  {warehouse.name} · {warehouse.code}
                                </option>
                              ))}
                            </select>
                            <span className="text-xs text-black/45">Se usa como sugerencia inicial del despacho.</span>
                          </label>
                        ) : null}
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Presentación</span>
                          <Input
                            value={primaryVariant.presentationLabel}
                            onChange={(event) => updateVariant(0, "presentationLabel", event.target.value)}
                            placeholder="Unitario"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Código presentación</span>
                          <Input
                            value={primaryVariant.presentationCode}
                            onChange={(event) => updateVariant(0, "presentationCode", event.target.value)}
                            placeholder="unitario"
                          />
                        </label>
                      </div>

                      <div className="mt-4 rounded-[1rem] border border-black/8 bg-white px-3 py-2 text-xs text-black/55">
                        {isComboProduct
                          ? "El combo no registra stock inicial ni almacén base propio. Inventario calcula su disponibilidad desde el stock de los componentes."
                          : "El stock operativo por variante y almacén se mantiene en `Inventario`. Aquí solo configuras el valor inicial/base de la ficha."}
                      </div>

                      <div className={`mt-4 grid gap-4 ${isComboProduct ? "md:grid-cols-3" : "md:grid-cols-5"}`}>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Precio</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={primaryVariant.price}
                            onChange={(event) => updateVariant(0, "price", event.target.value)}
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Precio comparativo</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={primaryVariant.compareAtPrice}
                            onChange={(event) => updateVariant(0, "compareAtPrice", event.target.value)}
                            placeholder="Opcional"
                          />
                        </label>
                        {!isComboProduct ? (
                          <>
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Stock inicial/base</span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={primaryVariant.stockOnHand}
                                onChange={(event) => updateVariant(0, "stockOnHand", event.target.value)}
                              />
                            </label>
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Umbral alerta</span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={primaryVariant.lowStockThreshold}
                                onChange={(event) => updateVariant(0, "lowStockThreshold", event.target.value)}
                              />
                            </label>
                          </>
                        ) : null}
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-[#132016]">Estado</span>
                          <select
                            value={primaryVariant.status}
                            onChange={(event) =>
                              updateVariant(0, "status", event.target.value as ProductVariantStatusValue)
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
                  )}
                </div>

                {isComboProduct ? (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-[#132016]">Componentes del combo</div>
                          <div className="text-sm text-black/55">
                            Define qué productos base se descuentan cuando vendes este combo. El stock se calcula con
                            la disponibilidad de estas presentaciones.
                          </div>
                        </div>
                        <Button type="button" variant="secondary" size="sm" onClick={handleAddBundleComponent}>
                          Añadir componente
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {form.bundleComponents.map((component, index) => {
                      const selectedComponentProduct = productById.get(component.productId) ?? null;
                      const selectedComponentProductDetail = component.productId
                        ? bundleComponentProducts[component.productId] ?? null
                        : null;
                      const activeComponentVariants = getActiveBundleVariants(selectedComponentProductDetail);
                      const selectedComponentVariant = selectedComponentProductDetail?.variants.find(
                        (variant) => variant.id === component.variantId
                      );

                      return (
                        <div
                          key={component.id ?? `${component.productId || "draft"}-${index}`}
                          className="rounded-[1.25rem] border border-black/8 bg-[#fafaf7] p-4"
                        >
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <Badge tone="info">Componente {index + 1}</Badge>
                              {selectedComponentProduct ? (
                                <StatusBadge label={selectedComponentProduct.name} tone="neutral" />
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRemoveBundleComponent(index)}
                            >
                              Quitar
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Producto</span>
                              <select
                                value={component.productId}
                                onChange={(event) => handleBundleComponentProductChange(index, event.target.value)}
                                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                              >
                                <option value="">Selecciona un producto</option>
                                {componentProductOptions.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Presentación del producto</span>
                              {selectedComponentProduct ? (
                                bundleComponentProductErrors[component.productId] ? (
                                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/55">
                                    No pudimos cargar las presentaciones de este producto.
                                  </div>
                                ) : selectedComponentProductDetail ? (
                                  activeComponentVariants.length === 1 ? (
                                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Badge tone="success">Presentación activa</Badge>
                                        <span className="text-sm font-medium text-[#132016]">
                                          {selectedComponentVariant
                                            ? bundleVariantLabel(selectedComponentVariant)
                                            : bundleVariantLabel(activeComponentVariants[0])}
                                        </span>
                                      </div>
                                    </div>
                                  ) : activeComponentVariants.length > 1 ? (
                                    <select
                                      value={component.variantId}
                                      onChange={(event) =>
                                        updateBundleComponent(index, "variantId", event.target.value)
                                      }
                                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                                    >
                                      <option value="">Selecciona una presentación</option>
                                      {activeComponentVariants.map((variant) => (
                                        <option key={variant.id} value={variant.id}>
                                          {bundleVariantLabel(variant)}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/55">
                                      Este producto no tiene presentaciones activas.
                                    </div>
                                  )
                                ) : (
                                  <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/55">
                                    Cargando presentaciones del producto seleccionado.
                                  </div>
                                )
                              ) : (
                                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/55">
                                  Selecciona un producto para elegir su presentación.
                                </div>
                              )}
                              <p className="text-xs text-black/45">
                                Aquí eliges la presentación por nombre y SKU. Si solo existe una activa, se toma sola.
                              </p>
                            </label>

                            <label className="space-y-1.5">
                              <span className="text-sm font-medium text-[#132016]">Cantidad</span>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={component.quantity}
                                onChange={(event) => updateBundleComponent(index, "quantity", event.target.value)}
                              />
                            </label>
                          </div>

                          <div className="mt-3 text-xs text-black/50">
                            {selectedComponentProduct ? (
                              <span>
                                Seleccionado: {selectedComponentProduct.name}
                                {selectedComponentProductDetail ? (
                                  activeComponentVariants.length === 1 ? (
                                    ` · ${bundleVariantLabel(activeComponentVariants[0])}`
                                  ) : activeComponentVariants.length > 1 ? (
                                    ` · ${activeComponentVariants.length} presentaciones activas`
                                  ) : (
                                    " · Sin presentaciones activas"
                                  )
                                ) : (
                                  " · Cargando presentaciones"
                                )}
                              </span>
                            ) : (
                              <span>Selecciona un producto para resolver automáticamente la presentación.</span>
                            )}
                          </div>
                        </div>
                      );
                        })}
                        {!form.bundleComponents.length ? (
                          <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-[#fafaf7] p-4 text-sm text-black/55">
                            Agrega al menos un componente para que el combo pueda calcular su stock disponible.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

              </form>
            )}

            {activeTab === "imagenes" && (
              <div className="space-y-5">
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
                    <span className="text-sm font-medium text-[#132016]">Presentación</span>
                    {imageVariants.length > 1 ? (
                      <select
                        value={imageForm.variantId}
                        onChange={(event) => setImageForm((current) => ({ ...current, variantId: event.target.value }))}
                        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/25"
                      >
                        <option value="">Sin presentación específica</option>
                        {imageVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.name} ({variant.sku})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/55">
                        La imagen se aplicará a la presentación principal.
                      </div>
                    )}
                  </label>
                  <label className="flex items-center gap-3 rounded-[1.25rem] border border-black/8 bg-[#fafaf7] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={imageForm.isPrimary}
                      onChange={(event) => setImageForm((current) => ({ ...current, isPrimary: event.target.checked }))}
                      className="h-4 w-4 rounded border-black/20 text-[#2d6a4f]"
                    />
                    <div>
                      <div className="font-medium text-[#132016]">Principal</div>
                      <div className="text-xs text-black/50">Reemplaza la imagen principal del producto.</div>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-black/55">
                    Las imágenes se publican sobre el bucket R2 ya configurado en producción.
                  </div>
                  <Button type="button" onClick={() => void handleUploadImage()} disabled={!imageForm.file || uploading}>
                    {uploading ? "Subiendo..." : "Subir imagen"}
                  </Button>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedProduct?.images.map((image) => (
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
                            {image.variantId ? " · Presentación vinculada" : ""}
                          </div>
                          <Button type="button" size="sm" variant="danger" onClick={() => void handleDeleteImage(image)} disabled={uploading}>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!selectedProduct?.images.length ? (
                    <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-[#fafaf7] p-6 text-sm text-black/55">
                      Este producto todavía no tiene imágenes.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </DialogBody>

          {activeTab === "ficha" && (
            <DialogFooter>
              <div className="flex-1 text-sm text-black/55">
                {isCreating ? "Guardar creará el producto y habilitará la carga de imágenes." : "Los cambios se aplican al producto seleccionado."}
              </div>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" form="product-form" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
