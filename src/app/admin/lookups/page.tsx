import { prisma } from "@/lib/prisma";
import LookupManager from "@/components/admin/LookupManager";
import CreateLookupButton from "@/components/admin/CreateLookupButton";

export default async function AdminLookupsPage() {
  const lookups = await prisma.lookup.findMany({ include: { items: { orderBy: { order: "asc" } } }, orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Справочники</h1>
          <p className="mt-1 text-slate-500">Единые справочные данные для полей типа «Справочник» в конструкторе услуг.</p>
        </div>
        <CreateLookupButton />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {lookups.map((l) => (
          <LookupManager key={l.id} lookup={{ id: l.id, code: l.code, name: l.name, items: l.items }} />
        ))}
      </div>
    </div>
  );
}
