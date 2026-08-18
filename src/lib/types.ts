export type Difficulty = "Easy" | "Medium" | "Hard";

export type Domain =
  | "Information and Ideas"
  | "Craft and Structure"
  | "Expression of Ideas"
  | "Standard English Conventions";

export type Skill =
  | "Central Ideas and Details"
  | "Command of Evidence"
  | "Inferences"
  | "Cross-Text Connections"
  | "Text Structure and Purpose"
  | "Words in Context"
  | "Rhetorical Synthesis"
  | "Transitions"
  | "Boundaries"
  | "Form, Structure, and Sense";

export type ProblemType =
  | "Evidence"
  | "Data Interpretation"
  | "Inference"
  | "Main Idea"
  | "Vocabulary in Context"
  | "Rhetorical Analysis"
  | "Notes/Synthesis"
  | "Transitions"
  | "Grammar/Conventions";

export type ChoiceKey = "A" | "B" | "C" | "D";

export interface QuestionTable {
  title: string | null;
  headers: string[];
  rows: string[][];
}

export interface Question {
  id: string;
  assessment: string;
  test: string;
  domain: Domain;
  skill: Skill;
  problemType: ProblemType;
  difficulty: Difficulty;
  stimulus: string;
  table: QuestionTable | null;
  question: string;
  choices: Record<ChoiceKey, string>;
  correctAnswer: ChoiceKey;
  rationale: {
    whyCorrect: string;
    whyIncorrect: string;
  };
}

export type PracticeMode = "bank" | "custom-test" | "weak-areas" | "skill-drill" | "difficulty-drill" | "review-mistakes";

export interface Attempt {
  attemptId: string;
  questionId: string;
  selectedAnswer: ChoiceKey;
  correct: boolean;
  timestamp: number;
  timeSpentMs: number;
  sessionId: string;
}

export interface PracticeSessionConfig {
  skills: Skill[];
  problemTypes: ProblemType[];
  difficulties: Difficulty[];
  questionCount: number;
  distribution: "balanced" | "custom";
  customDistribution?: Record<string, number>;
  timed: boolean;
  feedbackMode: "immediate" | "end";
  includePreviouslyAnswered: boolean;
  prioritizeIncorrect: boolean;
  randomizeOrder: boolean;
}

export interface PracticeSession {
  sessionId: string;
  mode: PracticeMode;
  label: string;
  startTime: number;
  endTime: number | null;
  questionIds: string[];
  config: Partial<PracticeSessionConfig>;
}

export interface FlaggedQuestion {
  questionId: string;
  flaggedAt: number;
}

export interface AppState {
  attempts: Attempt[];
  sessions: PracticeSession[];
  flags: Record<string, number>;
}
