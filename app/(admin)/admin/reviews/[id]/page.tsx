import { notFound } from "next/navigation";
import ReviewForm from "@/components/admin/ReviewForm";
import { requireAdmin } from "@/lib/auth";
import { getReview } from "@/lib/siteContent";

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();
  return <ReviewForm review={review} />;
}
