import raw from "../data/questions.json";
import type { Difficulty, Domain, ProblemType, Question, Skill } from "./types";

export const QUESTIONS: Question[] = raw as Question[];

export const QUESTIONS_BY_ID: Map<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));

function orderedUnique<T>(items: T[], order: T[]): T[] {
  const set = new Set(items);
  return order.filter((o) => set.has(o));
}

const DOMAIN_ORDER: Domain[] = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
];

const SKILL_ORDER: Skill[] = [
  "Central Ideas and Details",
  "Command of Evidence",
  "Inferences",
  "Cross-Text Connections",
  "Text Structure and Purpose",
  "Words in Context",
  "Rhetorical Synthesis",
  "Transitions",
  "Boundaries",
  "Form, Structure, and Sense",
];

const PROBLEM_TYPE_ORDER: ProblemType[] = [
  "Evidence",
  "Data Interpretation",
  "Inference",
  "Main Idea",
  "Vocabulary in Context",
  "Rhetorical Analysis",
  "Notes/Synthesis",
  "Transitions",
  "Grammar/Conventions",
];

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export const ALL_DOMAINS: Domain[] = orderedUnique(QUESTIONS.map((q) => q.domain), DOMAIN_ORDER);
export const ALL_SKILLS: Skill[] = orderedUnique(QUESTIONS.map((q) => q.skill), SKILL_ORDER);
export const ALL_PROBLEM_TYPES: ProblemType[] = orderedUnique(QUESTIONS.map((q) => q.problemType), PROBLEM_TYPE_ORDER);
export const ALL_DIFFICULTIES: Difficulty[] = DIFFICULTY_ORDER;

export const SKILLS_BY_DOMAIN: Record<string, Skill[]> = {};
for (const d of ALL_DOMAINS) {
  SKILLS_BY_DOMAIN[d] = orderedUnique(
    QUESTIONS.filter((q) => q.domain === d).map((q) => q.skill),
    SKILL_ORDER
  );
}

export function getQuestion(id: string): Question | undefined {
  return QUESTIONS_BY_ID.get(id);
}
