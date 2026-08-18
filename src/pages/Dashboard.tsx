import React from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../state/AppStateContext";
import {
  accuracyByDifficulty,
  computeAccuracy,
  computeStreaks,
  formatDuration,
  summarizeSession,
  weakestSkillsFirst,
} from "../lib/analytics";
import { ALL_DIFFICULTIES, ALL_SKILLS } from "../lib/questions";
import { ProgressBar, SectionHeading, StatCard, accuracyColor } from "../components/UI";
import { IconDashboard, IconPerformance, IconStreak, IconTarget } from "../components/Icons";
import type { Difficulty } from "../lib/types";

export default function Dashboard() {
  const { state } = useAppState();
  const { attempts, sessions } = state;

  const overall = computeAccuracy(attempts);
  const streaks = computeStreaks(attempts);
  const byDifficulty = accuracyByDifficulty(attempts);
  const skillRanking = weakestSkillsFirst(attempts, ALL_SKILLS);
  const completedSessions = sessions.filter((s) => s.endTime).sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink-900 tracking-tight">SAT Practice</h1>
        <p className="text-ink-500 mt-1">Target your weak areas. Practice smarter. Track your progress.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Questions Answered" value={String(overall.attempted)} icon={<IconDashboard />} />
        <StatCard label="Overall Accuracy" value={`${overall.accuracy}%`} sub={`${overall.correct} correct`} icon={<IconTarget />} />
        <StatCard label="Current Streak" value={String(streaks.current)} sub={`Longest: ${streaks.longest}`} icon={<IconStreak />} />
        <StatCard label="Practice Tests Completed" value={String(completedSessions.length)} icon={<IconPerformance />} />
      </div>

      <section>
        <SectionHeading title="Accuracy by Difficulty" sub="How you're performing at each difficulty level." />
        <div className="grid sm:grid-cols-3 gap-4">
          {ALL_DIFFICULTIES.map((d) => (
            <DifficultyRow key={d} difficulty={d} stat={byDifficulty[d]} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Accuracy by Skill"
          sub="Every SAT Reading & Writing skill in the question bank."
          action={
            <Link to="/performance" className="btn-secondary text-xs">
              View full breakdown
            </Link>
          }
        />
        <div className="card divide-y divide-ink-100">
          {skillRanking.map((row) => (
            <div key={row.skill} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-48 shrink-0 text-sm font-medium text-ink-800 truncate">{row.skill}</div>
              <div className="flex-1">
                <ProgressBar value={row.stat.accuracy} colorClass={accuracyColor(row.stat.accuracy)} height="h-2" />
              </div>
              <div className="w-40 shrink-0 text-right text-xs text-ink-500 tabular-nums">
                {row.stat.attempted === 0 ? (
                  "Not started"
                ) : (
                  <>
                    {row.stat.correct}/{row.stat.attempted} correct &middot;{" "}
                    <span className="font-semibold text-ink-700">{row.stat.accuracy}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Recent Activity" sub="Your most recent practice sessions." />
        {completedSessions.length === 0 ? (
          <div className="card p-8 text-center text-sm text-ink-500">
            No practice sessions yet.{" "}
            <Link to="/build" className="text-brand-600 font-medium hover:underline">
              Build your first practice test
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Practice Type</th>
                  <th className="px-5 py-3 font-medium">Questions</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.slice(0, 8).map((s) => {
                  const summary = summarizeSession(s, attempts);
                  return (
                    <tr key={s.sessionId} className="border-b border-ink-50 last:border-0">
                      <td className="px-5 py-3 text-ink-600 whitespace-nowrap">
                        {new Date(s.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 text-ink-800 font-medium">{s.label}</td>
                      <td className="px-5 py-3 text-ink-600">{summary.stat.attempted}</td>
                      <td className="px-5 py-3 text-ink-600">
                        {summary.stat.correct}/{summary.stat.attempted}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${summary.stat.accuracy >= 80 ? "text-good-700" : summary.stat.accuracy >= 60 ? "text-warn-700" : "text-bad-700"}`}>
                          {summary.stat.accuracy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-ink-400 pt-4 pb-2">
        Independent SAT practice tool. Not affiliated with or endorsed by College Board.
      </footer>
    </div>
  );
}

function DifficultyRow({ difficulty, stat }: { difficulty: Difficulty; stat: ReturnType<typeof accuracyByDifficulty>[Difficulty] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink-800">{difficulty}</span>
        <span className="text-sm font-semibold tabular-nums text-ink-700">{stat.accuracy}%</span>
      </div>
      <ProgressBar value={stat.accuracy} colorClass={accuracyColor(stat.accuracy)} />
      <div className="mt-2 text-xs text-ink-500">{stat.attempted} attempted</div>
    </div>
  );
}
