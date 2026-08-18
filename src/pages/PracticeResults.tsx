import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/AppStateContext";
import { accuracyByDifficulty, accuracyBySkill, formatDuration, summarizeSession } from "../lib/analytics";
import { ALL_DIFFICULTIES, getQuestion } from "../lib/questions";
import { ProgressBar, SectionHeading, StatCard, accuracyColor } from "../components/UI";
import { useStartPractice } from "../hooks/useStartPractice";
import { buildCustomTest, buildWeakAreasSet } from "../lib/practiceEngine";
import type { Difficulty, Skill } from "../lib/types";

export default function PracticeResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state } = useAppState();
  const navigate = useNavigate();
  const start = useStartPractice();

  const session = state.sessions.find((s) => s.sessionId === sessionId);
  const summary = session ? summarizeSession(session, state.attempts) : null;
  const sessionAttempts = summary?.attempts ?? [];

  const byDifficulty = accuracyByDifficulty(sessionAttempts);
  const skillsInSession = useMemo(() => {
    const set = new Set<Skill>();
    for (const a of sessionAttempts) {
      const q = getQuestion(a.questionId);
      if (q) set.add(q.skill);
    }
    return [...set];
  }, [sessionAttempts]);
  const byThisSessionSkill = accuracyBySkill(sessionAttempts);

  const recommendation = useMemo(() => {
    let worstSkill: Skill | null = null;
    let worstAccuracy = 101;
    for (const s of skillsInSession) {
      const stat = byThisSessionSkill[s];
      if (stat.attempted > 0 && stat.accuracy < worstAccuracy) {
        worstAccuracy = stat.accuracy;
        worstSkill = s;
      }
    }
    if (!worstSkill) return null;
    let worstDifficulty: Difficulty | null = null;
    let worstDiffAccuracy = 101;
    for (const d of ALL_DIFFICULTIES) {
      const stat = sessionAttempts
        .filter((a) => getQuestion(a.questionId)?.skill === worstSkill && getQuestion(a.questionId)?.difficulty === d);
      if (stat.length === 0) continue;
      const correct = stat.filter((a) => a.correct).length;
      const acc = (correct / stat.length) * 100;
      if (acc < worstDiffAccuracy) {
        worstDiffAccuracy = acc;
        worstDifficulty = d;
      }
    }
    return { skill: worstSkill, difficulty: worstDifficulty };
  }, [skillsInSession, byThisSessionSkill, sessionAttempts]);

  if (!session || !summary) {
    return (
      <div className="card p-10 text-center text-sm text-ink-500">
        Results not found.{" "}
        <button className="text-brand-600 font-medium hover:underline" onClick={() => navigate("/")}>
          Go to Dashboard
        </button>
        .
      </div>
    );
  }

  function practiceRecommended() {
    if (!recommendation) return;
    const ids = buildCustomTest(
      {
        skills: [recommendation.skill],
        problemTypes: [],
        difficulties: recommendation.difficulty ? [recommendation.difficulty] : [],
        questionCount: 10,
        distribution: "balanced",
        timed: false,
        feedbackMode: "immediate",
        includePreviouslyAnswered: true,
        prioritizeIncorrect: true,
        randomizeOrder: true,
      },
      state.attempts
    );
    start({ mode: "skill-drill", label: `${recommendation.skill} practice`, questionIds: ids });
  }

  function practiceWeakAreas() {
    const ids = buildWeakAreasSet(state.attempts, 10);
    start({ mode: "weak-areas", label: "Practice My Weak Areas", questionIds: ids });
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="text-center pt-4">
        <div className="text-3xl font-semibold text-ink-900">Practice Complete</div>
        <p className="text-ink-500 mt-1">{session.label}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Score" value={`${summary.stat.correct} / ${summary.stat.attempted}`} />
        <StatCard label="Accuracy" value={`${summary.stat.accuracy}%`} />
        <StatCard label="Time Spent" value={formatDuration(summary.durationMs)} />
        <StatCard label="Avg Time / Question" value={formatDuration(summary.avgTimeMs)} />
      </div>

      <section>
        <SectionHeading title="Performance by Difficulty" />
        <div className="grid sm:grid-cols-3 gap-4">
          {ALL_DIFFICULTIES.map((d) => {
            const stat = byDifficulty[d];
            return (
              <div key={d} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink-800">{d}</span>
                  <span className="text-sm font-semibold text-ink-700 tabular-nums">{stat.attempted ? `${stat.accuracy}%` : "—"}</span>
                </div>
                <ProgressBar value={stat.accuracy} colorClass={accuracyColor(stat.accuracy)} height="h-2" />
                <div className="mt-1.5 text-xs text-ink-500">{stat.attempted} attempted</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Performance by Skill" />
        <div className="card divide-y divide-ink-100">
          {skillsInSession.length === 0 && <div className="p-5 text-sm text-ink-500">No data.</div>}
          {skillsInSession.map((s) => {
            const stat = byThisSessionSkill[s];
            return (
              <div key={s} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-48 shrink-0 text-sm font-medium text-ink-800 truncate">{s}</div>
                <div className="flex-1">
                  <ProgressBar value={stat.accuracy} colorClass={accuracyColor(stat.accuracy)} height="h-2" />
                </div>
                <div className="w-36 shrink-0 text-right text-xs text-ink-500 tabular-nums">
                  {stat.correct}/{stat.attempted} &middot; <span className="font-semibold text-ink-700">{stat.accuracy}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {recommendation && (
        <section className="card p-6 bg-brand-50/60 border-brand-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">Recommended Next Step</div>
          <p className="text-sm text-ink-800 leading-relaxed">
            Your weakest area was <span className="font-semibold">{recommendation.skill}</span>
            {recommendation.difficulty ? (
              <>
                {" "}
                on <span className="font-semibold">{recommendation.difficulty}</span> questions
              </>
            ) : null}
            . We recommend a 10-question {recommendation.skill} practice set.
          </p>
          <button className="btn-primary mt-4" onClick={practiceRecommended}>
            Start Recommended Practice
          </button>
        </section>
      )}

      <div className="flex items-center justify-center gap-3 flex-wrap pb-6">
        <button className="btn-primary" onClick={practiceWeakAreas}>
          Practice Weak Areas
        </button>
        <Link to="/mistakes" className="btn-secondary">
          Review Mistakes
        </Link>
        <Link to="/" className="btn-ghost">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
