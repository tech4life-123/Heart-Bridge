"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0f0b0a", color: "#f7f1ea", margin: 0 }}>
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 20px", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={() => retry()} style={{ minHeight: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#d4a24c", color: "#1a1208", fontWeight: 700, fontSize: 16 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
