export async function GET() {
  return Response.json({
    name: "نکسورا | Nexora",
    short_name: "نکسورا",
    description: "پیام‌رسان نسل بعد با پلتفرم ربات‌سازی",
    start_url: "/",
    display: "standalone",
    background_color: "#06070f",
    theme_color: "#6d5efc",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='26' fill='%236d5efc'/%3E%3Cpath d='M28 72V28l44 44V28' stroke='white' stroke-width='9' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  });
}
