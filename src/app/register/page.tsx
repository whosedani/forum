import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Register" }]}
      />
      <div style={{ maxWidth: 600, margin: "24px auto" }}>
        <RegisterForm />
      </div>
    </div>
  );
}
