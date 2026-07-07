// Role constants shared between server and client code. Kept separate from session.ts
// because session.ts imports next/headers (server-only) — client components importing
// that transitively would break the build.

export type Role = "CLIENT" | "SUPERADMIN" | "ORG_ADMIN" | "AUTHOR" | "ANALYST";

// Roles allowed into /admin at all. ANALYST is read-only once inside (enforced at the API layer).
export const ADMIN_ROLES: Role[] = ["SUPERADMIN", "ORG_ADMIN", "AUTHOR", "ANALYST"];
// Roles allowed to mutate anything via /api/admin/mutate.
export const WRITE_ROLES: Role[] = ["SUPERADMIN", "ORG_ADMIN", "AUTHOR"];
// Roles scoped to a single organization — every mutation/query they make must be filtered by their organizationId.
export const ORG_SCOPED_ROLES: Role[] = ["ORG_ADMIN", "AUTHOR"];
