import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="glass-card" style={{ maxWidth: 440, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🧭</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>این صفحه پیدا نشد</h2>
        <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 2, margin: "0 0 18px" }}>
          ۴۰۴ — آدرسی که زدی وجود ندارد یا جابه‌جا شده است.
        </p>
        <Link href="/" className="btn btn-primary">
          بازگشت به نکسورا
        </Link>
      </div>
    </div>
  );
}
