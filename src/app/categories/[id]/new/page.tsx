import { redirect, notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import NewThreadForm from "@/components/NewThreadForm";
import type { Category } from "@/lib/types";

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/register");

  const category = await redis.get<Category>(keys.category(id));
  if (!category) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: category.name, href: `/categories/${id}` },
          { label: "New Thread" },
        ]}
      />

      <div style={{ marginTop: 8 }}>
        <NewThreadForm categoryId={id} categoryName={category.name} />
      </div>
    </div>
  );
}
