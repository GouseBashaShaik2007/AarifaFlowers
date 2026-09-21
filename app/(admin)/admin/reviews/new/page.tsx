import ReviewForm from "@/components/admin/ReviewForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewReviewPage() {
  await requireAdmin();
  return <ReviewForm />;
}
