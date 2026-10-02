import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export const metadata: Metadata = { title: "Join HeartBridge" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Join HeartBridge</h1>
      <p className="mb-6 text-muted">
        Create your account. You will build your profile next.
      </p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-gold underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
