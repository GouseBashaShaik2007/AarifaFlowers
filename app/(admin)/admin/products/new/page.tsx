import ProductForm from "@/components/admin/ProductForm";
import { aiConfigured } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";

export default async function NewProductPage() {
  await requireAdmin();
  return <ProductForm aiEnabled={aiConfigured()} />;
}
