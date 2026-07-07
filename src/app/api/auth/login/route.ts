import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDemoUser, SESSION_COOKIE, Session, Role } from "@/lib/session";
import { mockEgovIdpLookup } from "@/lib/integrations";

const VALID_ROLES: Role[] = ["CLIENT", "SUPERADMIN", "ORG_ADMIN", "AUTHOR", "ANALYST"];

export async function POST(req: NextRequest) {
  const { role } = (await req.json()) as { role: Role };
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  if (role === "CLIENT") {
    // demonstrate eGov IDP auth mock on entry to the client journey
    await mockEgovIdpLookup("900101300123");
  }

  const user = await getOrCreateDemoUser(role);
  const session: Session = { userId: user.id, role, fullName: user.fullName, organizationId: user.organizationId };

  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
