import type { ReactNode } from "react";

const styles = {
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-success/40 bg-success/10 text-success",
  info: "border-line bg-surface text-fg",
} as const;

export function Alert({
  tone = "info",
  children,
}: {
  tone?: keyof typeof styles;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium ${styles[tone]}`}
    >
      {children}
    </div>
  );
}
