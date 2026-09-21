import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewProductPage() {
  await requireAdmin();
  return <ProductForm />;
}
