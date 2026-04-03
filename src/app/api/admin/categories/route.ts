import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import type { Category } from "@/lib/types";

export async function GET() {
  const categoryIds = await redis.zrange(keys.categoriesList(), 0, -1);
  if (!categoryIds.length) return NextResponse.json([]);

  const pipeline = redis.pipeline();
  for (const id of categoryIds) {
    pipeline.get(keys.category(id as string));
  }
  const results = await pipeline.exec();
  const categories = results.filter(Boolean) as Category[];

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, ...data } = await request.json();

    if (action === "create") {
      const id = String(Date.now());
      const category: Category = {
        id,
        name: data.name || "New Category",
        description: data.description || "",
        sort_order: data.sort_order ?? 0,
        thread_count: 0,
        post_count: 0,
        last_post: null,
      };

      await redis.set(keys.category(id), JSON.stringify(category));
      await redis.zadd(keys.categoriesList(), {
        score: category.sort_order,
        member: id,
      });

      return NextResponse.json(category);
    }

    if (action === "update" && data.id) {
      const existing = await redis.get<Category>(keys.category(data.id));
      if (!existing) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      const updated: Category = {
        ...existing,
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        sort_order: data.sort_order ?? existing.sort_order,
      };

      await redis.set(keys.category(data.id), JSON.stringify(updated));

      if (data.sort_order !== undefined) {
        await redis.zadd(keys.categoriesList(), {
          score: updated.sort_order,
          member: data.id,
        });
      }

      return NextResponse.json(updated);
    }

    if (action === "delete" && data.id) {
      await redis.del(keys.category(data.id));
      await redis.zrem(keys.categoriesList(), data.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
