"use client";

import { useState } from "react";

export function CopyButton({ text, label = "کپی" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }

  return (
    <button className="btn btn-ghost" onClick={copy} style={{ padding: "9px 14px", fontSize: 12.5 }}>
      {done ? "✓ کپی شد" : `⧉ ${label}`}
    </button>
  );
}

export function CodeBlock({ code, lang = "" }: { code: string; lang?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div className="code-head">
        <span>{lang}</span>
        <button className="copy-btn" onClick={copy}>
          {done ? "copied ✓" : "copy"}
        </button>
      </div>
      <div className="code-block">{code}</div>
    </div>
  );
}
