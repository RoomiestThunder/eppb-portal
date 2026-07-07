import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ORG_SCOPED_ROLES, type Role } from "@/lib/roles";

export type { Role } from "@/lib/roles";
export { ADMIN_ROLES, WRITE_ROLES, ORG_SCOPED_ROLES } from "@/lib/roles";

const COOKIE_NAME = "eppb_session";

export type Session = {
  userId: string;
  role: Role;
  fullName: string;
  organizationId: string | null;
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

const DEMO_USER_LABELS: Record<Role, string> = {
  CLIENT: "Демо-пользователь",
  SUPERADMIN: "Суперадминистратор платформы",
  ORG_ADMIN: "Администратор услуг (БРК)",
  AUTHOR: "Автор услуг (БРК)",
  ANALYST: "Аналитик (только чтение)",
};

export async function getOrCreateDemoUser(role: Role) {
  const user = await prisma.user.findFirst({ where: { role } });
  if (user) return user;

  let organizationId: string | null = null;
  if (ORG_SCOPED_ROLES.includes(role)) {
    // Demo org-scoped users are pinned to KDB (БРК) so the scoping behavior is visible in the demo.
    const org = await prisma.organization.findFirst({ where: { code: "KDB" } });
    organizationId = org?.id ?? null;
  }

  return prisma.user.create({
    data: { role, fullName: DEMO_USER_LABELS[role], organizationId },
  });
}

export const SESSION_COOKIE = COOKIE_NAME;
