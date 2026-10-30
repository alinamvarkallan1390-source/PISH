"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0b1017",
          color: "#e9eef5",
          fontFamily: "Vazirmatn, system-ui, Tahoma, sans-serif",
          padding: 20,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>⚠️</div>
          <h1 style={{ fontSize: 20, margin: "0 0 10px" }}>نکسورا موقتاً در دسترس نیست</h1>
          <p style={{ fontSize: 13.5, color: "#7f8fa1", lineHeight: 2 }}>
            {error?.message || "خطای نامشخص"}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 14,
              padding: "11px 20px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#3390ec,#7c6bf5)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
