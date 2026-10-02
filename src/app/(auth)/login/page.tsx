import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const notice =
    error === "link_expired"
      ? "That link is invalid or has expired. Please sign in or request a new one."
      : undefined;

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
      <p className="mb-6 text-muted">Sign in to continue to HeartBridge.</p>
      <SignInForm next={safeNextPath(next)} notice={notice} />
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-rose underline">
          Join HeartBridge
        </Link>
      </p>
    </>
  );
}
