import React from "react";
import { useAppState } from "../state/AppStateContext";
import { accuracyByDifficulty, accuracyByProblemType, weakestProblemTypesFirst, weakestSkillsFirst } from "../lib/analytics";
import { ALL_DIFFICULTIES, ALL_PROBLEM_TYPES, ALL_SKILLS } from "../lib/questions";
import { ProgressBar, SectionHeading, TierBadge, accuracyColor } from "../components/UI";
import { useStartPractice } from "../hooks/useStartPractice";
import { buildDifficultyDrill, buildSkillDrill } from "../lib/practiceEngine";
import type { Difficulty } from "../lib/types";

export default function Performance() {
  const { state } = useAppState();
  const start = useStartPractice();

  const skillRanking = weakestSkillsFirst(state.attempts, ALL_SKILLS);
  const typeRanking = weakestProblemTypesFirst(state.attempts, ALL_PROBLEM_TYPES);
  const byDifficulty = accuracyByDifficulty(state.attempts);

  function practiceSkill(skill: (typeof ALL_SKILLS)[number]) {
    const ids = buildSkillDrill(skill, 10, state.attempts);
    start({ mode: "skill-drill", label: `${skill} practice`, questionIds: ids });
  }

  function practiceDifficulty(d: Difficulty) {
    const ids = buildDifficultyDrill(d, 10, state.attempts);
    start({ mode: "difficulty-drill", label: `${d} practice`, questionIds: ids });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Performance</h1>
        <p className="text-ink-500 mt-1">Ranked weakest to strongest, so you know exactly where to focus.</p>
      </div>

      <section>
        <SectionHeading title="Accuracy by Difficulty" />
        <div className="grid sm:grid-cols-3 gap-4">
          {ALL_DIFFICULTIES.map((d) => {
            const stat = byDifficulty[d];
            return (
              <div key={d} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink-800">{d}</span>
                  <span className="text-lg font-semibold tabular-nums text-ink-900">{stat.attempted ? `${stat.accuracy}%` : "—"}</span>
                </div>
                <ProgressBar value={stat.accuracy} colorClass={accuracyColor(stat.accuracy)} />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-500">{stat.attempted} attempted</span>
                  <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => practiceDifficulty(d)}>
                    Practice this difficulty
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Accuracy by Skill" sub="Ranked weakest to strongest." />
        <div className="card divide-y divide-ink-100">
          {skillRanking.map((row) => (
            <div key={row.skill} className="flex items-center gap-4 px-5 py-4 flex-wrap">
              <div className="w-full sm:w-48 shrink-0">
                <div className="text-sm font-semibold text-ink-800">{row.skill}</div>
                {row.stat.attempted > 0 && <TierBadge tier={row.tier} />}
              </div>
              <div className="flex-1 min-w-[120px]">
                <ProgressBar value={row.stat.accuracy} colorClass={accuracyColor(row.stat.accuracy)} />
              </div>
              <div className="w-40 text-right text-xs text-ink-500 tabular-nums">
                {row.stat.attempted === 0 ? (
                  "Not started"
                ) : (
                  <>
                    {row.stat.correct} correct / {row.stat.incorrect} incorrect
                    <div className="font-semibold text-ink-800 text-sm">{row.stat.accuracy}%</div>
                  </>
                )}
              </div>
              <button className="btn-secondary text-xs shrink-0" onClick={() => practiceSkill(row.skill)}>
                Practice This Skill
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Accuracy by Problem Type" />
        <div className="card divide-y divide-ink-100">
          {typeRanking.map((row) => (
            <div key={row.problemType} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-44 shrink-0 text-sm font-medium text-ink-800 truncate">{row.problemType}</div>
              <div className="flex-1">
                <ProgressBar value={row.stat.accuracy} colorClass={accuracyColor(row.stat.accuracy)} height="h-2" />
              </div>
              <div className="w-36 shrink-0 text-right text-xs text-ink-500 tabular-nums">
                {row.stat.attempted === 0 ? "Not started" : `${row.stat.correct}/${row.stat.attempted} · ${row.stat.accuracy}%`}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
