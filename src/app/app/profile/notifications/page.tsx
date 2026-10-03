import Link from "next/link";
import type { Metadata } from "next";
import { NotificationForm } from "@/features/notifications/NotificationForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_notification_settings");
  const s = data?.[0] ?? { email_matches: true, email_messages: true };
  return (
    <div className="space-y-5">
      <Link
        href="/app/profile"
        className="inline-flex min-h-11 items-center text-gold"
      >
        ‹ My profile
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
      <p className="text-muted">
        Choose which emails HeartBridge sends you. Emails about your account,
        payments and appeals are always sent. Push notifications are not
        available yet.
      </p>
      <NotificationForm matches={s.email_matches} messages={s.email_messages} />
    </div>
  );
}
