import type { Attempt, Difficulty, ProblemType, Question, Skill } from "./types";
import { latestAttemptPerQuestion } from "./analytics";

export type AnsweredFilter = "any" | "answered" | "unanswered" | "correct" | "incorrect" | "never";

export interface QuestionBankFilters {
  difficulties: Difficulty[];
  domains: string[];
  skills: Skill[];
  problemTypes: ProblemType[];
  answered: AnsweredFilter;
  idSearch: string;
  flaggedOnly: boolean;
}

export function defaultFilters(): QuestionBankFilters {
  return {
    difficulties: [],
    domains: [],
    skills: [],
    problemTypes: [],
    answered: "any",
    idSearch: "",
    flaggedOnly: false,
  };
}

export function applyFilters(
  questions: Question[],
  filters: QuestionBankFilters,
  attempts: Attempt[],
  flags: Record<string, number>
): Question[] {
  const latest = latestAttemptPerQuestion(attempts);
  const attemptedIds = new Set(attempts.map((a) => a.questionId));

  return questions.filter((q) => {
    if (filters.difficulties.length > 0 && !filters.difficulties.includes(q.difficulty)) return false;
    if (filters.domains.length > 0 && !filters.domains.includes(q.domain)) return false;
    if (filters.skills.length > 0 && !filters.skills.includes(q.skill)) return false;
    if (filters.problemTypes.length > 0 && !filters.problemTypes.includes(q.problemType)) return false;
    if (filters.idSearch.trim() && !q.id.toLowerCase().includes(filters.idSearch.trim().toLowerCase())) return false;
    if (filters.flaggedOnly && !flags[q.id]) return false;

    switch (filters.answered) {
      case "answered":
        if (!attemptedIds.has(q.id)) return false;
        break;
      case "unanswered":
        if (attemptedIds.has(q.id)) return false;
        break;
      case "never":
        if (attemptedIds.has(q.id)) return false;
        break;
      case "correct": {
        const la = latest.get(q.id);
        if (!la || !la.correct) return false;
        break;
      }
      case "incorrect": {
        const la = latest.get(q.id);
        if (!la || la.correct) return false;
        break;
      }
    }
    return true;
  });
}

export type QuestionStatus = "unattempted" | "correct" | "incorrect" | "flagged";

export function statusOf(questionId: string, attempts: Attempt[], flags: Record<string, number>): QuestionStatus[] {
  const statuses: QuestionStatus[] = [];
  const relevant = attempts.filter((a) => a.questionId === questionId).sort((a, b) => a.timestamp - b.timestamp);
  if (relevant.length === 0) statuses.push("unattempted");
  else statuses.push(relevant[relevant.length - 1].correct ? "correct" : "incorrect");
  if (flags[questionId]) statuses.push("flagged");
  return statuses;
}
