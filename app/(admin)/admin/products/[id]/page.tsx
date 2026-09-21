import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { aiConfigured } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { getProduct } from "@/lib/store";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <ProductForm product={product} aiEnabled={aiConfigured()} />;
}
