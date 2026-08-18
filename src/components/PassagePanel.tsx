import React from "react";
import type { QuestionTable } from "../lib/types";

function renderParagraph(text: string, key: number) {
  const headingMatch = text.match(/^(Text \d)\s(.*)$/s);
  if (headingMatch) {
    return (
      <p key={key} className="mb-4 last:mb-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-brand-600 mb-1.5">{headingMatch[1]}</span>
        {headingMatch[2]}
      </p>
    );
  }
  return (
    <p key={key} className="mb-4 last:mb-0">
      {text}
    </p>
  );
}

function TableBlock({ table }: { table: QuestionTable }) {
  return (
    <div className="mb-5 rounded-lg border border-ink-200 overflow-hidden">
      {table.title && <div className="bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-800 border-b border-ink-200">{table.title}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50/60">
              {table.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-ink-700 border-b border-ink-200 align-bottom">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? "bg-ink-50/40" : ""}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-ink-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PassagePanel({ stimulus, table }: { stimulus: string; table: QuestionTable | null }) {
  const parts = stimulus.split("[[TABLE]]");
  return (
    <div className="font-serif text-[15px] leading-7 text-ink-800">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && table && <TableBlock table={table} />}
          {part
            .split("\n\n")
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, j) => renderParagraph(p, j))}
        </React.Fragment>
      ))}
    </div>
  );
}
