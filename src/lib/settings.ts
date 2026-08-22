import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/src/db";
import { systemSettings } from "@/src/db/schema";

/**
 * Read a value from the system_settings table.
 * Returns `fallback` when the key is missing — callers never need to handle
 * the "row doesn't exist" case.
 */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  return (row?.value as T) ?? fallback;
}

/**
 * Upsert a value into system_settings and bust the "db" cache tag so the next
 * read is fresh immediately (same pattern as publish-hooks.ts).
 */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value } });

  revalidateTag("db", { expire: 0 });
}

// ---------------------------------------------------------------------------
// Typed convenience wrappers for frequently used keys
// ---------------------------------------------------------------------------

export function getAutoPublishEnabled(): Promise<boolean> {
  return getSetting<boolean>("auto_publish_enabled", true);
}

export function setAutoPublishEnabled(v: boolean): Promise<void> {
  return setSetting("auto_publish_enabled", v);
}
