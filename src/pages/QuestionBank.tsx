import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import { ALL_DIFFICULTIES, ALL_DOMAINS, ALL_PROBLEM_TYPES, ALL_SKILLS, QUESTIONS } from "../lib/questions";
import { applyFilters, defaultFilters, statusOf, type AnsweredFilter, type QuestionBankFilters } from "../lib/filters";
import { ChipGroup } from "../components/ChipGroup";
import { DifficultyBadge, SectionHeading, StatusIcon } from "../components/UI";
import { useStartPractice } from "../hooks/useStartPractice";
import { IconSearch } from "../components/Icons";

const ANSWERED_OPTIONS: { value: AnsweredFilter; label: string }[] = [
  { value: "any", label: "Any status" },
  { value: "answered", label: "Answered" },
  { value: "unanswered", label: "Unanswered" },
  { value: "never", label: "Never attempted" },
  { value: "correct", label: "Previously correct" },
  { value: "incorrect", label: "Previously incorrect" },
];

const PAGE_SIZE = 25;

export default function QuestionBank() {
  const { state } = useAppState();
  const [filters, setFilters] = useState<QuestionBankFilters>(defaultFilters());
  const [page, setPage] = useState(0);
  const start = useStartPractice();

  const filtered = useMemo(
    () => applyFilters(QUESTIONS, filters, state.attempts, state.flags),
    [filters, state.attempts, state.flags]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function updateFilters(updater: (f: QuestionBankFilters) => QuestionBankFilters) {
    setFilters(updater);
    setPage(0);
  }

  function toggleIn<K extends keyof QuestionBankFilters>(key: K, value: string) {
    updateFilters((prev) => {
      const list = prev[key] as unknown as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  }

  function practiceFiltered(startId?: string) {
    let ids = filtered.map((q) => q.id);
    if (startId) ids = [startId, ...ids.filter((id) => id !== startId)];
    start({
      mode: "bank",
      label: "Question Bank practice",
      questionIds: ids.slice(0, 100),
    });
  }

  const hasActiveFilters =
    filters.difficulties.length > 0 ||
    filters.domains.length > 0 ||
    filters.skills.length > 0 ||
    filters.problemTypes.length > 0 ||
    filters.answered !== "any" ||
    filters.idSearch.trim() !== "" ||
    filters.flaggedOnly;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Question Bank</h1>
        <p className="text-ink-500 mt-1">Browse, filter, and practice from the full {QUESTIONS.length}-question set.</p>
      </div>

      <div className="card p-5 flex flex-col gap-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Difficulty</div>
          <ChipGroup
            options={ALL_DIFFICULTIES}
            selected={filters.difficulties}
            onToggle={(v) => toggleIn("difficulties", v)}
            onClear={() => updateFilters((f) => ({ ...f, difficulties: [] }))}
          />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Domain</div>
          <ChipGroup
            options={ALL_DOMAINS}
            selected={filters.domains}
            onToggle={(v) => toggleIn("domains", v)}
            onClear={() => updateFilters((f) => ({ ...f, domains: [] }))}
          />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Skill</div>
          <ChipGroup
            options={ALL_SKILLS}
            selected={filters.skills}
            onToggle={(v) => toggleIn("skills", v)}
            onClear={() => updateFilters((f) => ({ ...f, skills: [] }))}
          />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Problem Type</div>
          <ChipGroup
            options={ALL_PROBLEM_TYPES}
            selected={filters.problemTypes}
            onToggle={(v) => toggleIn("problemTypes", v)}
            onClear={() => updateFilters((f) => ({ ...f, problemTypes: [] }))}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-ink-100">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Status</div>
            <select
              className="input"
              value={filters.answered}
              onChange={(e) => updateFilters((f) => ({ ...f, answered: e.target.value as AnsweredFilter }))}
            >
              {ANSWERED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Question ID</div>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" width={16} height={16} />
              <input
                className="input pl-9"
                placeholder="Search by ID"
                value={filters.idSearch}
                onChange={(e) => updateFilters((f) => ({ ...f, idSearch: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => updateFilters((f) => ({ ...f, flaggedOnly: !f.flaggedOnly }))}
              className={filters.flaggedOnly ? "chip-on !py-2" : "chip-off !py-2"}
            >
              Flagged only
            </button>
            <button type="button" className="btn-ghost" disabled={!hasActiveFilters} onClick={() => updateFilters(() => defaultFilters())}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{filtered.length}</span> question{filtered.length === 1 ? "" : "s"} found
        </div>
        <button className="btn-primary" disabled={filtered.length === 0} onClick={() => practiceFiltered()}>
          Practice {Math.min(filtered.length, 100)} Question{filtered.length === 1 ? "" : "s"}
        </button>
      </div>

      <div className="card divide-y divide-ink-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-500">No questions match the current filters.</div>
        ) : (
          paginated.map((q) => {
            const statuses = statusOf(q.id, state.attempts, state.flags);
            return (
              <button
                key={q.id}
                onClick={() => practiceFiltered(q.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-ink-50 transition-colors"
              >
                <div className="flex gap-1 shrink-0">
                  {statuses.map((s) => (
                    <StatusIcon key={s} status={s} />
                  ))}
                </div>
                <div className="w-28 shrink-0 font-mono text-xs text-ink-400">{q.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-800 truncate">{q.skill}</div>
                  <div className="text-xs text-ink-500 truncate">{q.problemType} &middot; {q.domain}</div>
                </div>
                <DifficultyBadge difficulty={q.difficulty} />
              </button>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-ink-500">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, safePage * PAGE_SIZE + PAGE_SIZE)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </button>
            <span className="text-xs text-ink-500 tabular-nums px-1">
              Page {safePage + 1} of {pageCount}
            </span>
            <button className="btn-secondary" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
