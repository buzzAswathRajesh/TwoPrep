import { ALL_DIFFICULTIES, ALL_DOMAINS, ALL_PROBLEM_TYPES, ALL_SKILLS, getQuestion } from "./questions";
import type { Attempt, ChoiceKey, Difficulty, Domain, PracticeSession, ProblemType, Skill } from "./types";

export interface AccuracyStat {
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number; // 0-100, rounded to 1 decimal
}

export function emptyStat(): AccuracyStat {
  return { attempted: 0, correct: 0, incorrect: 0, accuracy: 0 };
}

export function computeAccuracy(attempts: Attempt[]): AccuracyStat {
  const attempted = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const incorrect = attempted - correct;
  const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10;
  return { attempted, correct, incorrect, accuracy };
}

// `allKeys` is pre-seeded with emptyStat() so every known category (even one
// with zero attempts) is always present in the result — callers can safely
// index into it without an `?? emptyStat()` fallback at every call site.
export function groupAccuracyBy<K extends string>(attempts: Attempt[], keyFn: (a: Attempt) => K | null, allKeys: readonly K[] = []): Record<K, AccuracyStat> {
  const buckets = new Map<K, Attempt[]>();
  for (const a of attempts) {
    const key = keyFn(a);
    if (key === null) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(a);
  }
  const result = {} as Record<K, AccuracyStat>;
  for (const key of allKeys) {
    result[key] = emptyStat();
  }
  for (const [key, list] of buckets) {
    result[key] = computeAccuracy(list);
  }
  return result;
}

export function accuracyByDifficulty(attempts: Attempt[]): Record<Difficulty, AccuracyStat> {
  return groupAccuracyBy(attempts, (a) => getQuestion(a.questionId)?.difficulty ?? null, ALL_DIFFICULTIES);
}

export function accuracyBySkill(attempts: Attempt[]): Record<Skill, AccuracyStat> {
  return groupAccuracyBy(attempts, (a) => getQuestion(a.questionId)?.skill ?? null, ALL_SKILLS);
}

export function accuracyByProblemType(attempts: Attempt[]): Record<ProblemType, AccuracyStat> {
  return groupAccuracyBy(attempts, (a) => getQuestion(a.questionId)?.problemType ?? null, ALL_PROBLEM_TYPES);
}

export function accuracyByDomain(attempts: Attempt[]): Record<Domain, AccuracyStat> {
  return groupAccuracyBy(attempts, (a) => getQuestion(a.questionId)?.domain ?? null, ALL_DOMAINS);
}

export function firstAttempts(attempts: Attempt[]): Attempt[] {
  const seen = new Set<string>();
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  const result: Attempt[] = [];
  for (const a of sorted) {
    if (!seen.has(a.questionId)) {
      seen.add(a.questionId);
      result.push(a);
    }
  }
  return result;
}

export function latestAttemptPerQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  const map = new Map<string, Attempt>();
  for (const a of sorted) map.set(a.questionId, a);
  return map;
}

export interface Streaks {
  current: number;
  longest: number;
}

export function computeStreaks(attempts: Attempt[]): Streaks {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  let longest = 0;
  let running = 0;
  for (const a of sorted) {
    if (a.correct) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].correct) current += 1;
    else break;
  }
  return { current, longest };
}

export type SkillTier = "Needs Practice" | "Developing" | "Strong";

export function tierForAccuracy(accuracy: number): SkillTier {
  if (accuracy < 60) return "Needs Practice";
  if (accuracy < 80) return "Developing";
  return "Strong";
}

export interface SkillRankRow {
  skill: Skill;
  stat: AccuracyStat;
  tier: SkillTier;
}

export function weakestSkillsFirst(attempts: Attempt[], allSkills: Skill[]): SkillRankRow[] {
  const bySkill = accuracyBySkill(attempts);
  return allSkills
    .map((skill) => {
      const stat = bySkill[skill] ?? emptyStat();
      return { skill, stat, tier: tierForAccuracy(stat.accuracy) };
    })
    .sort((a, b) => {
      if (a.stat.attempted === 0 && b.stat.attempted === 0) return 0;
      if (a.stat.attempted === 0) return 1;
      if (b.stat.attempted === 0) return -1;
      return a.stat.accuracy - b.stat.accuracy;
    });
}

export interface ProblemTypeRankRow {
  problemType: ProblemType;
  stat: AccuracyStat;
  tier: SkillTier;
}

export function weakestProblemTypesFirst(attempts: Attempt[], allTypes: ProblemType[]): ProblemTypeRankRow[] {
  const byType = accuracyByProblemType(attempts);
  return allTypes
    .map((problemType) => {
      const stat = byType[problemType] ?? emptyStat();
      return { problemType, stat, tier: tierForAccuracy(stat.accuracy) };
    })
    .sort((a, b) => {
      if (a.stat.attempted === 0 && b.stat.attempted === 0) return 0;
      if (a.stat.attempted === 0) return 1;
      if (b.stat.attempted === 0) return -1;
      return a.stat.accuracy - b.stat.accuracy;
    });
}

export interface SessionSummary {
  session: PracticeSession;
  attempts: Attempt[];
  stat: AccuracyStat;
  durationMs: number;
  avgTimeMs: number;
}

export function summarizeSession(session: PracticeSession, allAttempts: Attempt[]): SessionSummary {
  const attempts = allAttempts.filter((a) => a.sessionId === session.sessionId);
  const stat = computeAccuracy(attempts);
  const durationMs = (session.endTime ?? Date.now()) - session.startTime;
  const avgTimeMs = attempts.length === 0 ? 0 : attempts.reduce((sum, a) => sum + a.timeSpentMs, 0) / attempts.length;
  return { session, attempts, stat, durationMs, avgTimeMs };
}

export interface MistakeEntry {
  questionId: string;
  attempts: Attempt[];
  latestAttempt: Attempt;
  resolved: boolean;
}

export function buildMistakeList(attempts: Attempt[]): MistakeEntry[] {
  const byQuestion = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!byQuestion.has(a.questionId)) byQuestion.set(a.questionId, []);
    byQuestion.get(a.questionId)!.push(a);
  }
  const entries: MistakeEntry[] = [];
  for (const [questionId, list] of byQuestion) {
    const everIncorrect = list.some((a) => !a.correct);
    if (!everIncorrect) continue;
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    const latestAttempt = sorted[sorted.length - 1];
    entries.push({
      questionId,
      attempts: sorted,
      latestAttempt,
      resolved: latestAttempt.correct,
    });
  }
  return entries.sort((a, b) => b.latestAttempt.timestamp - a.latestAttempt.timestamp);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function choiceLabel(key: ChoiceKey): string {
  return key;
}
