import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "eppb_session";

export type Session = {
  userId: string;
  role: "CLIENT" | "ADMIN" | "AUTHOR";
  fullName: string;
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

export async function getOrCreateDemoUser(role: Session["role"]) {
  const user = await prisma.user.findFirst({ where: { role } });
  if (user) return user;
  return prisma.user.create({
    data: { role, fullName: role === "ADMIN" ? "Администратор портала" : role === "AUTHOR" ? "Автор услуг" : "Демо-пользователь" },
  });
}

export const SESSION_COOKIE = COOKIE_NAME;
