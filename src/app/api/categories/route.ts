import { NextResponse } from "next/server";
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
