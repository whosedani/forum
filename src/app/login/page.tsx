import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Login" }]}
      />
      <div style={{ maxWidth: 500, margin: "24px auto" }}>
        <LoginForm />
      </div>
    </div>
  );
}
