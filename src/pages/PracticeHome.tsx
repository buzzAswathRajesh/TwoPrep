import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateContext";
import { useStartPractice } from "../hooks/useStartPractice";
import { buildDifficultyDrill, buildWeakAreasSet } from "../lib/practiceEngine";
import { computeAccuracy } from "../lib/analytics";
import { ALL_DIFFICULTIES } from "../lib/questions";
import { accuracyColor, ProgressBar } from "../components/UI";
import { accuracyByDifficulty } from "../lib/analytics";
import { IconBuild, IconChevronRight, IconTarget } from "../components/Icons";
import type { Difficulty } from "../lib/types";

export default function PracticeHome() {
  const { state } = useAppState();
  const start = useStartPractice();
  const navigate = useNavigate();

  const unfinished = state.sessions.filter((s) => !s.endTime).sort((a, b) => b.startTime - a.startTime)[0];
  const overall = computeAccuracy(state.attempts);
  const byDifficulty = accuracyByDifficulty(state.attempts);

  function startWeakAreas() {
    const ids = buildWeakAreasSet(state.attempts, 10);
    start({ mode: "weak-areas", label: "Practice My Weak Areas", questionIds: ids });
  }

  function startDifficulty(d: Difficulty) {
    const ids = buildDifficultyDrill(d, 10, state.attempts);
    start({ mode: "difficulty-drill", label: `${d} practice`, questionIds: ids });
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Practice</h1>
        <p className="text-ink-500 mt-1">Jump back in, or start something new.</p>
      </div>

      {unfinished && (
        <div className="card p-5 flex items-center justify-between gap-4 flex-wrap border-brand-200 bg-brand-50/50">
          <div>
            <div className="text-sm font-semibold text-ink-900">Resume: {unfinished.label}</div>
            <div className="text-xs text-ink-500 mt-0.5">
              {state.attempts.filter((a) => a.sessionId === unfinished.sessionId).length} of {unfinished.questionIds.length} answered
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate(`/practice/${unfinished.sessionId}`)}>
            Continue
          </button>
        </div>
      )}

      <button onClick={startWeakAreas} className="card p-6 text-left hover:border-brand-300 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
              <IconTarget />
            </span>
            <div>
              <div className="text-base font-semibold text-ink-900">Practice My Weak Areas</div>
              <div className="text-sm text-ink-500">
                {overall.attempted === 0
                  ? "Answer a few questions first so we can learn where you need the most help."
                  : "A 10-question set weighted toward your lowest-accuracy skills and past mistakes."}
              </div>
            </div>
          </div>
          <IconChevronRight className="text-ink-300 group-hover:text-brand-500 shrink-0" />
        </div>
      </button>

      <Link to="/build" className="card p-6 hover:border-brand-300 transition-colors group flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center">
            <IconBuild />
          </span>
          <div>
            <div className="text-base font-semibold text-ink-900">Build a Practice Test</div>
            <div className="text-sm text-ink-500">Pick exact skills, problem types, difficulty, and length.</div>
          </div>
        </div>
        <IconChevronRight className="text-ink-300 group-hover:text-brand-500 shrink-0" />
      </Link>

      <div className="card p-6">
        <div className="text-sm font-semibold text-ink-900 mb-4">Quick practice by difficulty</div>
        <div className="grid sm:grid-cols-3 gap-4">
          {ALL_DIFFICULTIES.map((d) => {
            const stat = byDifficulty[d];
            return (
              <button key={d} onClick={() => startDifficulty(d)} className="rounded-xl border border-ink-200 p-4 text-left hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink-800">{d}</span>
                  <span className="text-xs text-ink-500 tabular-nums">{stat.attempted ? `${stat.accuracy}%` : "—"}</span>
                </div>
                <ProgressBar value={stat.accuracy} colorClass={accuracyColor(stat.accuracy)} height="h-1.5" />
              </button>
            );
          })}
        </div>
      </div>

      <Link to="/bank" className="text-sm text-brand-600 font-medium hover:underline text-center">
        Or browse the full Question Bank →
      </Link>
    </div>
  );
}
