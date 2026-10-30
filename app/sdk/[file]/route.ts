import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const FILES: Record<string, { file: string; mime: string }> = {
  "nexora_bot.py": { file: "nexora_bot.py", mime: "text/x-python; charset=utf-8" },
  "echo_bot.py": { file: "echo_bot.py", mime: "text/x-python; charset=utf-8" },
  "pyproject.toml": { file: "pyproject.toml", mime: "text/plain; charset=utf-8" },
  "README.md": { file: "README.md", mime: "text/markdown; charset=utf-8" },
};

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const entry = FILES[file];
  if (!entry) {
    return NextResponse.json({ ok: false, error: "فایل پیدا نشد" }, { status: 404 });
  }
  try {
    const raw = await readFile(path.join(process.cwd(), "python", entry.file), "utf8");
    return new NextResponse(raw, {
      headers: {
        "content-type": entry.mime,
        "content-disposition": `inline; filename="${entry.file}"`,
        "cache-control": "public, max-age=600",
        "access-control-allow-origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "فایل در دسترس نیست" }, { status: 500 });
  }
}
