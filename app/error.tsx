"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="auth-wrap">
      <div className="glass-card" style={{ maxWidth: 460, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 46, marginBottom: 10 }}>🛠️</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>یه چیزی خراب شد</h2>
        <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 2, margin: "0 0 18px" }}>
          نگران نباش، اطلاعاتت سر جایش است. یک بار دیگر امتحان کن؛ اگر درست نشد چند لحظه بعد برگرد.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={reset}>
            تلاش دوباره
          </button>
          <a className="btn btn-ghost" href="/">
            بازگشت به خانه
          </a>
        </div>
      </div>
    </div>
  );
}
