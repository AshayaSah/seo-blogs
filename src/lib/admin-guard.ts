import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "./admin-auth";

/**
 * Page-level guard (defense in depth alongside `proxy.ts`). The Next docs
 * explicitly warn against relying on the proxy alone, so admin server
 * components call this to redirect unauthenticated visitors to the login page.
 */
export async function requireAdminPage(): Promise<void> {
  const store = await cookies();
  if (!verifySessionToken(store.get(COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }
}
