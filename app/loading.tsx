export default function Loading() {
  return (
    <div className="auth-wrap">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div className="chat-empty-orb" style={{ animation: "float 4s ease-in-out infinite" }}>
          ✦
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>در حال باز کردن نکسورا…</div>
      </div>
    </div>
  );
}
