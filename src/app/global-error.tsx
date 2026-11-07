"use client";

// Last resort when the root layout itself fails: no translations or styles
// are available here, so it says the same thing in both languages.
export default function GlobalError({ retry }: { error: Error; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Something went wrong</h1>
        <p dir="rtl" lang="he">משהו השתבש</p>
        <button type="button" onClick={() => retry()} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Try again · נסו שוב
        </button>
      </body>
    </html>
  );
}
