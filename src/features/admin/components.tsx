import type { ReactNode } from "react";
import { moderateUserAction } from "./actions";
import type { StaffRole } from "./guard";

export function Notice({ done, error }: { done?: string; error?: string }) {
  if (done) return <p role="status" className="rounded-xl border-2 border-success/40 bg-success/10 px-4 py-3 font-medium text-success">Done. The action was recorded in the audit log.</p>;
  if (error) return <p role="alert" className="rounded-xl border-2 border-danger/40 bg-danger/10 px-4 py-3 font-medium text-danger">That didn&apos;t work. You may not have permission, or the reason was too short (5+ characters).</p>;
  return null;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-line bg-surface p-5">
      {title && <h2 className="text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}

const btn = "min-h-11 rounded-full border-2 px-5 font-semibold";

/** Warn / suspend / restore / ban. The database enforces roles; ban is Super Admin only. */
export function ModerationForms({ userId, back, role, status }: { userId: string; back: string; role: StaffRole; status: string }) {
  const intents: { intent: string; label: string; cls: string; show: boolean }[] = [
    { intent: "warn", label: "Send warning", cls: "border-warning text-warning", show: true },
    { intent: "suspend", label: "Suspend", cls: "border-danger text-danger", show: status === "active" },
    { intent: "restore", label: "Restore", cls: "border-success text-success", show: status !== "active" },
    { intent: "ban", label: "Ban", cls: "border-danger bg-danger text-white", show: role === "admin" && status !== "banned" },
  ];
  return (
    <Card title="Actions">
      <form action={moderateUserAction} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="back" value={back} />
        <label htmlFor="reason" className="block text-sm font-semibold">
          Reason (required, recorded in the audit log; a warning&apos;s text is shown to the person)
        </label>
        <textarea id="reason" name="reason" required minLength={5} maxLength={1000} rows={3} className="w-full rounded-xl border-2 bg-surface-2 px-3 py-2 text-base" />
        <div className="flex flex-wrap gap-2">
          {intents.filter((i) => i.show).map((i) => (
            <button key={i.intent} type="submit" name="intent" value={i.intent} className={`${btn} ${i.cls}`}>
              {i.label}
            </button>
          ))}
        </div>
      </form>
    </Card>
  );
}
