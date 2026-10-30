import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نکسورا | Nexora — پیام‌رسان نسل بعد",
  description:
    "نکسورا: پیام‌رسان فوق‌سریع با چت خصوصی، گروه، کانال، مدیا، ری‌اکشن و پلتفرم کامل ربات‌سازی (Nexora Bot API).",
  applicationName: "Nexora",
  keywords: ["نکسورا", "Nexora", "پیام‌رسان", "messenger", "chat", "bot api", "ربات‌ساز"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='26' fill='%233390ec'/%3E%3Cpath d='M28 72V28l44 44V28' stroke='white' stroke-width='9' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1017",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var t=localStorage.getItem('nexora-theme')||'dark';document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="aurora" aria-hidden="true">
          <span />
        </div>
        {children}
      </body>
    </html>
  );
}
