import { ProductGrid, SectionHeader } from "@huelegood/ui";
import { featuredProducts } from "@huelegood/shared";

export default function CatalogPage() {
  return (
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader
        title="Catálogo"
        description="Productos visibles, bundles y ofertas activas para una compra clara."
      />
      <ProductGrid products={featuredProducts} />
    </div>
  );
}

