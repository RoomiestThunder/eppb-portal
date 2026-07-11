import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LookupManager from "@/components/admin/LookupManager";
import CreateLookupButton from "@/components/admin/CreateLookupButton";

export default async function AdminLookupsPage() {
  const session = await getSession();
  const readOnly = session?.role === "ANALYST";
  const lookups = await prisma.lookup.findMany({ include: { items: { orderBy: { order: "asc" } } }, orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Справочники</h1>
          <p className="mt-1 text-slate-500">Единые справочные данные для полей типа «Справочник» в конструкторе услуг.</p>
        </div>
        {!readOnly && <CreateLookupButton />}
      </div>
      {readOnly && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Режим «только чтение» — изменения недоступны для роли «Аналитик».
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {lookups.map((l) => (
          <LookupManager key={l.id} lookup={{ id: l.id, code: l.code, name: l.name, items: l.items }} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}
