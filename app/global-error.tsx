"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40, color: "#0b1433" }}>
        <h1>Something went wrong</h1>
        <p>Please try again. If it keeps happening, contact us.</p>
        <button suppressHydrationWarning onClick={reset} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 999, background: "#2347e0", color: "#fff", border: 0 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
