import { QUESTIONS } from "./questions";
import { accuracyByProblemType, accuracyBySkill, latestAttemptPerQuestion } from "./analytics";
import type { Attempt, Difficulty, PracticeSessionConfig, ProblemType, Question, Skill } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function poolFor(config: Pick<PracticeSessionConfig, "skills" | "problemTypes" | "difficulties">): Question[] {
  return QUESTIONS.filter((q) => {
    if (config.skills.length > 0 && !config.skills.includes(q.skill)) return false;
    if (config.problemTypes.length > 0 && !config.problemTypes.includes(q.problemType)) return false;
    if (config.difficulties.length > 0 && !config.difficulties.includes(q.difficulty)) return false;
    return true;
  });
}

function filterPreviouslyAnswered(pool: Question[], attempts: Attempt[], include: boolean): Question[] {
  if (include) return pool;
  const attemptedIds = new Set(attempts.map((a) => a.questionId));
  return pool.filter((q) => !attemptedIds.has(q.id));
}

/**
 * Distributes `count` questions across the categories a student selected.
 * "balanced" spreads as evenly as possible; "custom" honors explicit
 * per-category counts. Categories are keyed by skill (falls back to
 * problem type when no skills were selected) since that's the axis the
 * Build-a-Test UI exposes distribution controls for.
 */
function categoryKeysFor(config: PracticeSessionConfig): string[] {
  if (config.skills.length > 0) return config.skills;
  if (config.problemTypes.length > 0) return config.problemTypes;
  return ["All"];
}

function matchesCategory(q: Question, key: string): boolean {
  return q.skill === key || q.problemType === key || key === "All";
}

export function buildCustomTest(config: PracticeSessionConfig, attempts: Attempt[]): string[] {
  let pool = poolFor(config);
  pool = filterPreviouslyAnswered(pool, attempts, config.includePreviouslyAnswered);

  if (config.prioritizeIncorrect) {
    const latest = latestAttemptPerQuestion(attempts);
    const incorrectIds = new Set([...latest.entries()].filter(([, a]) => !a.correct).map(([qid]) => qid));
    const prioritized = pool.filter((q) => incorrectIds.has(q.id));
    const rest = pool.filter((q) => !incorrectIds.has(q.id));
    pool = [...shuffle(prioritized), ...shuffle(rest)];
  } else {
    pool = shuffle(pool);
  }

  const keys = categoryKeysFor(config);
  let selected: Question[] = [];

  if (config.distribution === "custom" && config.customDistribution) {
    for (const key of keys) {
      const want = config.customDistribution[key] ?? 0;
      const fromCategory = pool.filter((q) => matchesCategory(q, key) && !selected.includes(q)).slice(0, want);
      selected.push(...fromCategory);
    }
  } else {
    const perCategory = Math.ceil(config.questionCount / keys.length);
    for (const key of keys) {
      const fromCategory = pool.filter((q) => matchesCategory(q, key) && !selected.includes(q)).slice(0, perCategory);
      selected.push(...fromCategory);
    }
  }

  // Top off / trim to exact requested count using whatever's left in the pool.
  if (selected.length < config.questionCount) {
    const remaining = pool.filter((q) => !selected.includes(q));
    selected.push(...remaining.slice(0, config.questionCount - selected.length));
  }
  selected = selected.slice(0, config.questionCount);

  if (config.randomizeOrder) selected = shuffle(selected);

  return selected.map((q) => q.id);
}

/**
 * Builds a weighted practice set favoring: lowest-accuracy skills, lowest-
 * accuracy problem types, previously-incorrect questions, and medium/hard
 * questions within those weak categories — while avoiding immediate repeats
 * of questions already seen this session's pool unless nothing else is left.
 */
export function buildWeakAreasSet(attempts: Attempt[], count: number): string[] {
  const skillRank = accuracyBySkill(attempts);
  const typeRank = accuracyByProblemType(attempts);
  const latest = latestAttemptPerQuestion(attempts);

  function weightFor(q: Question): number {
    let weight = 10;
    const skillStat = skillRank[q.skill];
    if (skillStat && skillStat.attempted > 0) {
      weight += Math.max(0, 80 - skillStat.accuracy) * 0.6;
    } else {
      weight += 20; // unattempted skills get modest priority so coverage broadens
    }
    const typeStat = typeRank[q.problemType];
    if (typeStat && typeStat.attempted > 0) {
      weight += Math.max(0, 80 - typeStat.accuracy) * 0.3;
    }
    const prior = latest.get(q.id);
    if (prior && !prior.correct) weight += 40;
    if (q.difficulty === "Medium") weight += 8;
    if (q.difficulty === "Hard") weight += 14;
    return weight;
  }

  const weighted = QUESTIONS.map((q) => ({ q, weight: weightFor(q) }));
  weighted.sort((a, b) => b.weight - a.weight + (Math.random() - 0.5) * 6);

  const selected: Question[] = [];
  const seenIds = new Set<string>();
  for (const { q } of weighted) {
    if (selected.length >= count) break;
    if (seenIds.has(q.id)) continue;
    seenIds.add(q.id);
    selected.push(q);
  }
  return shuffle(selected).map((q) => q.id);
}

export function buildSkillDrill(skill: Skill, count: number, attempts: Attempt[]): string[] {
  return buildCustomTest(
    {
      skills: [skill],
      problemTypes: [],
      difficulties: [],
      questionCount: count,
      distribution: "balanced",
      timed: false,
      feedbackMode: "immediate",
      includePreviouslyAnswered: true,
      prioritizeIncorrect: true,
      randomizeOrder: true,
    },
    attempts
  );
}

export function buildDifficultyDrill(difficulty: Difficulty, count: number, attempts: Attempt[]): string[] {
  return buildCustomTest(
    {
      skills: [],
      problemTypes: [],
      difficulties: [difficulty],
      questionCount: count,
      distribution: "balanced",
      timed: false,
      feedbackMode: "immediate",
      includePreviouslyAnswered: true,
      prioritizeIncorrect: true,
      randomizeOrder: true,
    },
    attempts
  );
}
