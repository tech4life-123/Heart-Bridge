import { Card, Notice } from "@/features/admin/components";
import { saveLocationAction } from "@/features/admin/actions";
import { SUPER, requireStaff } from "@/features/admin/guard";

const KINDS = ["region", "city", "community"] as const;
const field = "min-h-11 w-full rounded-xl border-2 bg-surface-2 px-3";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireStaff("/admin/locations", SUPER);
  const { data } = await supabase.rpc("admin_list_locations");
  const all = data ?? [];
  const byId = new Map(all.map((l) => [l.id, l]));
  const parents = all.filter((l) => l.kind !== "community");
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Add a place">
        <form action={saveLocationAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="parent" className="block text-sm font-semibold">
              Inside
            </label>
            <select id="parent" name="parent" required className={field}>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.kind})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="kind" className="block text-sm font-semibold">
              Type (must fit the place above it)
            </label>
            <select id="kind" name="kind" className={field}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              className={field}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="slug" className="block text-sm font-semibold">
              Short code (lowercase, dashes)
            </label>
            <input
              id="slug"
              name="slug"
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className={field}
            />
          </div>
          <input type="hidden" name="sort" value="0" />
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="size-5 accent-[var(--hb-gold)]"
            />{" "}
            Visible to members
          </label>
          <div>
            <button className="min-h-11 rounded-full bg-gold px-6 font-semibold text-on-gold">
              Add place
            </button>
          </div>
        </form>
      </Card>
      <Card title="Places">
        <p className="text-sm text-muted">
          Places cannot be removed, only switched off, so existing profiles keep
          a valid location. Every change is audited.
        </p>
        <ul className="divide-y divide-line">
          {all
            .filter((l) => l.kind !== "country")
            .map((l) => (
              <li key={l.id} className="py-3">
                <form
                  action={saveLocationAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="kind" value={l.kind} />
                  <input
                    type="hidden"
                    name="parent"
                    value={l.parent_id ?? ""}
                  />
                  <div className="min-w-40 flex-1 space-y-1">
                    <label
                      htmlFor={`nm-${l.id}`}
                      className="block text-xs text-muted"
                    >
                      {l.kind} in {byId.get(l.parent_id ?? "")?.name ?? "?"}
                    </label>
                    <input
                      id={`nm-${l.id}`}
                      name="name"
                      defaultValue={l.name}
                      required
                      maxLength={80}
                      className={field}
                    />
                  </div>
                  <div className="w-40 space-y-1">
                    <label
                      htmlFor={`sl-${l.id}`}
                      className="block text-xs text-muted"
                    >
                      code
                    </label>
                    <input
                      id={`sl-${l.id}`}
                      name="slug"
                      defaultValue={l.slug}
                      required
                      className={field}
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <label
                      htmlFor={`so-${l.id}`}
                      className="block text-xs text-muted"
                    >
                      order
                    </label>
                    <input
                      id={`so-${l.id}`}
                      name="sort"
                      type="number"
                      min={0}
                      defaultValue={l.sort_order}
                      className={field}
                    />
                  </div>
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={l.is_active}
                      className="size-5 accent-[var(--hb-gold)]"
                    />{" "}
                    On
                  </label>
                  <button className="min-h-11 rounded-full border-2 border-line px-5 font-semibold hover:border-gold">
                    Save
                  </button>
                </form>
              </li>
            ))}
        </ul>
      </Card>
    </>
  );
}
