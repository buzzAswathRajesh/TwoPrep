import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppStateContext";
import { buildMistakeList } from "../lib/analytics";
import { getQuestion } from "../lib/questions";
import { DifficultyBadge, EmptyState } from "../components/UI";
import PassagePanel from "../components/PassagePanel";
import { useStartPractice } from "../hooks/useStartPractice";
import type { Difficulty, ProblemType, Skill } from "../lib/types";

export default function MistakeReview() {
  const { state } = useAppState();
  const start = useStartPractice();

  const mistakes = useMemo(() => buildMistakeList(state.attempts), [state.attempts]);

  const [skillFilter, setSkillFilter] = useState<Skill | "any">("any");
  const [typeFilter, setTypeFilter] = useState<ProblemType | "any">("any");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "any">("any");
  const [statusFilter, setStatusFilter] = useState<"any" | "unresolved" | "resolved">("any");

  const withQuestions = mistakes
    .map((m) => ({ m, q: getQuestion(m.questionId) }))
    .filter((x): x is { m: (typeof mistakes)[number]; q: NonNullable<ReturnType<typeof getQuestion>> } => !!x.q);

  const skills = useMemo(() => [...new Set(withQuestions.map((x) => x.q.skill))], [withQuestions]);
  const types = useMemo(() => [...new Set(withQuestions.map((x) => x.q.problemType))], [withQuestions]);

  const filtered = withQuestions.filter(({ m, q }) => {
    if (skillFilter !== "any" && q.skill !== skillFilter) return false;
    if (typeFilter !== "any" && q.problemType !== typeFilter) return false;
    if (difficultyFilter !== "any" && q.difficulty !== difficultyFilter) return false;
    if (statusFilter === "resolved" && !m.resolved) return false;
    if (statusFilter === "unresolved" && m.resolved) return false;
    return true;
  });

  function tryAgain(questionId: string) {
    start({ mode: "review-mistakes", label: "Retry mistake", questionIds: [questionId] });
  }

  function practiceAllUnresolved() {
    const ids = filtered.filter(({ m }) => !m.resolved).map(({ m }) => m.questionId);
    if (ids.length === 0) return;
    start({ mode: "review-mistakes", label: "Review mistakes", questionIds: ids });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Mistake Review</h1>
          <p className="text-ink-500 mt-1">Every question you've ever answered incorrectly, with full history preserved.</p>
        </div>
        <button className="btn-primary" onClick={practiceAllUnresolved} disabled={filtered.every(({ m }) => m.resolved)}>
          Retry All Unresolved
        </button>
      </div>

      <div className="card p-5 grid sm:grid-cols-4 gap-4">
        <FilterSelect label="Skill" value={skillFilter} onChange={setSkillFilter} options={skills} />
        <FilterSelect label="Problem Type" value={typeFilter} onChange={setTypeFilter} options={types} />
        <FilterSelect label="Difficulty" value={difficultyFilter} onChange={setDifficultyFilter} options={["Easy", "Medium", "Hard"]} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Status</div>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="any">All</option>
            <option value="unresolved">Still incorrect</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No mistakes to review" body="Once you answer a question incorrectly, it will show up here for focused review." />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(({ m, q }) => (
            <div key={m.questionId} className="card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge bg-ink-100 text-ink-700">{q.skill}</span>
                  <span className="badge bg-ink-100 text-ink-700">{q.problemType}</span>
                  <DifficultyBadge difficulty={q.difficulty} />
                  <span className={`badge ${m.resolved ? "bg-good-50 text-good-700" : "bg-bad-50 text-bad-700"}`}>
                    {m.resolved ? "Resolved" : "Still incorrect"}
                  </span>
                </div>
                <div className="text-xs text-ink-400">
                  {m.attempts.length} attempt{m.attempts.length === 1 ? "" : "s"} &middot; last on{" "}
                  {new Date(m.latestAttempt.timestamp).toLocaleDateString()}
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-brand-600 hover:underline list-none">
                  <span className="group-open:hidden">Show passage &amp; question</span>
                  <span className="hidden group-open:inline">Hide passage &amp; question</span>
                </summary>
                <div className="mt-4 grid lg:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-ink-100 p-4 max-h-72 overflow-y-auto">
                    <PassagePanel stimulus={q.stimulus} table={q.table} />
                  </div>
                  <div className="text-sm text-ink-800 leading-relaxed">{q.question}</div>
                </div>
              </details>

              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-ink-500 mb-1">Your answer</div>
                  <div className="font-semibold text-bad-700">
                    {m.latestAttempt.selectedAnswer}. {q.choices[m.latestAttempt.selectedAnswer]}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-500 mb-1">Correct answer</div>
                  <div className="font-semibold text-good-700">
                    {q.correctAnswer}. {q.choices[q.correctAnswer]}
                  </div>
                </div>
                <div className="flex sm:justify-end items-start">
                  <button className="btn-secondary" onClick={() => tryAgain(q.id)}>
                    Try Again
                  </button>
                </div>
              </div>

              <details>
                <summary className="cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-900">Explanation</summary>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">{q.rationale.whyCorrect}</p>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | "any";
  onChange: (v: T | "any") => void;
  options: T[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{label}</div>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T | "any")}>
        <option value="any">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
