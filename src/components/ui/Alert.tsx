import type { ReactNode } from "react";

const styles = {
  error: "border-danger/40 bg-danger/5 text-danger",
  success: "border-leaf/40 bg-leaf/5 text-leaf",
  info: "border-sand bg-white text-ink",
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
