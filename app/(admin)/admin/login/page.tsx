import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/auth";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto mt-10 max-w-sm rounded-3xl border border-line bg-white p-7 shadow-sm">
      <h1 className="text-xl font-semibold text-ink">Admin login</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Only the shop owner can manage garlands.</p>
      <LoginForm />
    </div>
  );
}
