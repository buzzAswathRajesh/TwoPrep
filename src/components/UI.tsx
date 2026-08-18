import React from "react";
import type { Difficulty } from "../lib/types";
import type { SkillTier } from "../lib/analytics";
import { IconCheck, IconFlag, IconX } from "./Icons";

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</div>
        {icon && <div className="text-brand-500">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink-900 tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  colorClass = "bg-brand-500",
  trackClass = "bg-ink-100",
  height = "h-2.5",
}: {
  value: number;
  colorClass?: string;
  trackClass?: string;
  height?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full rounded-full ${trackClass} ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colorClass} transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-good-50 text-good-700",
  Medium: "bg-warn-50 text-warn-700",
  Hard: "bg-bad-50 text-bad-700",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`badge ${DIFFICULTY_STYLES[difficulty]}`}>{difficulty}</span>;
}

const TIER_STYLES: Record<SkillTier, string> = {
  "Needs Practice": "bg-bad-50 text-bad-700",
  Developing: "bg-warn-50 text-warn-700",
  Strong: "bg-good-50 text-good-700",
};

const TIER_BAR: Record<SkillTier, string> = {
  "Needs Practice": "bg-bad-500",
  Developing: "bg-warn-500",
  Strong: "bg-good-500",
};

export function TierBadge({ tier }: { tier: SkillTier }) {
  return <span className={`badge ${TIER_STYLES[tier]}`}>{tier}</span>;
}

export function tierBarColor(tier: SkillTier): string {
  return TIER_BAR[tier];
}

export function accuracyColor(accuracy: number): string {
  if (accuracy < 60) return "bg-bad-500";
  if (accuracy < 80) return "bg-warn-500";
  return "bg-good-500";
}

export function StatusIcon({ status }: { status: "correct" | "incorrect" | "unattempted" | "flagged" }) {
  if (status === "correct")
    return (
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-good-100 text-good-700">
        <IconCheck width={12} height={12} strokeWidth={3} />
      </span>
    );
  if (status === "incorrect")
    return (
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-bad-100 text-bad-700">
        <IconX width={12} height={12} strokeWidth={3} />
      </span>
    );
  if (status === "flagged")
    return (
      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-warn-100 text-warn-700">
        <IconFlag width={11} height={11} strokeWidth={2.5} />
      </span>
    );
  return <span className="inline-flex h-5 w-5 rounded-full border-2 border-dashed border-ink-300" />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center flex flex-col items-center gap-3">
      <div className="text-base font-semibold text-ink-800">{title}</div>
      <div className="text-sm text-ink-500 max-w-md">{body}</div>
      {action}
    </div>
  );
}

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {sub && <p className="text-sm text-ink-500 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
