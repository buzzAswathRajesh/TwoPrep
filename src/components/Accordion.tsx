import React, { useState } from "react";

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "good" | "bad";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toneClasses =
    tone === "good" ? "border-good-200 bg-good-50/50" : tone === "bad" ? "border-bad-200 bg-bad-50/40" : "border-ink-200 bg-ink-50/50";

  return (
    <div className={`rounded-lg border ${toneClasses} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink-800 text-left"
      >
        {title}
        <span className={`transition-transform text-ink-400 ${open ? "rotate-180" : ""}`}>&#9662;</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm leading-relaxed text-ink-700">{children}</div>}
    </div>
  );
}
