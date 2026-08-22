import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";
import { getAutoPublishEnabled, setAutoPublishEnabled } from "@/src/lib/settings";

export async function GET(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auto_publish_enabled = await getAutoPublishEnabled();
  return NextResponse.json({ auto_publish_enabled });
}

export async function PATCH(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    body === null ||
    typeof body !== "object" ||
    !("auto_publish_enabled" in body) ||
    typeof (body as Record<string, unknown>).auto_publish_enabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "auto_publish_enabled must be a boolean" },
      { status: 400 },
    );
  }

  const enabled = (body as { auto_publish_enabled: boolean }).auto_publish_enabled;
  await setAutoPublishEnabled(enabled);

  return NextResponse.json({ ok: true, auto_publish_enabled: enabled });
}
