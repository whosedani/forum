import { getCurrentUser } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminPanel from "@/components/AdminPanel";
import AdminLoginGate from "@/components/AdminLoginGate";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin Panel" }]} />
        <div style={{ maxWidth: 500, margin: "24px auto" }}>
          <div className="info-panel" style={{ textAlign: "center" }}>
            You must be logged in to access the admin panel.
            <br />
            <a href="/login">Login</a> or <a href="/register">Register</a> first.
          </div>
        </div>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin Panel" }]} />
        <div style={{ maxWidth: 500, margin: "24px auto" }}>
          <AdminLoginGate />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin Panel" }]} />
      <div style={{ margin: "12px 0" }}>
        <AdminPanel />
      </div>
    </div>
  );
}
