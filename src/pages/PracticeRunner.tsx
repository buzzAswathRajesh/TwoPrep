import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/AppStateContext";
import { getQuestion } from "../lib/questions";
import { DifficultyBadge } from "../components/UI";
import PassagePanel from "../components/PassagePanel";
import Accordion from "../components/Accordion";
import { IconChevronLeft, IconChevronRight, IconClock, IconFlag } from "../components/Icons";
import type { Attempt, ChoiceKey } from "../lib/types";

const CHOICE_KEYS: ChoiceKey[] = ["A", "B", "C", "D"];

export default function PracticeRunner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { state, recordAttempt, endSession, toggleFlag, isFlagged } = useAppState();
  const navigate = useNavigate();

  const session = state.sessions.find((s) => s.sessionId === sessionId);
  const sessionAttempts = useMemo(
    () => state.attempts.filter((a) => a.sessionId === sessionId),
    [state.attempts, sessionId]
  );
  const attemptByQuestion = useMemo(() => {
    const map = new Map<string, Attempt>();
    for (const a of sessionAttempts) map.set(a.questionId, a);
    return map;
  }, [sessionAttempts]);

  const questions = useMemo(
    () => (session ? session.questionIds.map((id) => getQuestion(id)).filter((q): q is NonNullable<typeof q> => !!q) : []),
    [session]
  );
  const total = questions.length;

  const [index, setIndex] = useState(() => {
    if (!session) return 0;
    const firstUnanswered = session.questionIds.findIndex((id) => !attemptByQuestion.has(id));
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [selected, setSelected] = useState<ChoiceKey | null>(null);
  const startTimeRef = useRef(Date.now());
  const sessionStartRef = useRef(session?.startTime ?? Date.now());
  const [now, setNow] = useState(Date.now());

  const timed = !!session?.config.timed;

  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [timed]);

  useEffect(() => {
    if (session?.endTime) {
      navigate(`/practice/${session.sessionId}/results`, { replace: true });
    }
  }, [session, navigate]);

  const currentQuestion = questions[index];
  const currentAttempt = currentQuestion ? attemptByQuestion.get(currentQuestion.id) : undefined;
  const feedbackMode = session?.config.feedbackMode ?? "immediate";
  const showFeedback = !!currentAttempt && feedbackMode === "immediate";

  useEffect(() => {
    setSelected(null);
    startTimeRef.current = Date.now();
  }, [index]);

  if (!session || !currentQuestion) {
    return (
      <div className="card p-10 text-center text-sm text-ink-500">
        This practice session could not be found.{" "}
        <button className="text-brand-600 font-medium hover:underline" onClick={() => navigate("/build")}>
          Start a new one
        </button>
        .
      </div>
    );
  }

  const activeSession = session;

  function commitAttempt(answer: ChoiceKey) {
    if (!currentQuestion || currentAttempt) return;
    const correct = answer === currentQuestion.correctAnswer;
    const timeSpentMs = Date.now() - startTimeRef.current;
    recordAttempt({ questionId: currentQuestion.id, selectedAnswer: answer, correct, timeSpentMs, sessionId: activeSession.sessionId });
    return correct;
  }

  function handleSubmit() {
    if (!selected) return;
    commitAttempt(selected);
    if (feedbackMode === "end") {
      goNext();
    }
  }

  function goNext() {
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      endSession(activeSession.sessionId);
      navigate(`/practice/${activeSession.sessionId}/results`);
    }
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  const flagged = isFlagged(currentQuestion.id);
  const elapsedMs = now - sessionStartRef.current;
  const isLast = index === total - 1;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <TopBar
        index={index}
        total={total}
        question={currentQuestion}
        timed={timed}
        elapsedMs={elapsedMs}
        flagged={flagged}
        onFlag={() => toggleFlag(currentQuestion.id)}
      />

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="card p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto">
          <PassagePanel stimulus={currentQuestion.stimulus} table={currentQuestion.table} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="card p-6">
            <p className="text-[15px] font-medium text-ink-900 leading-relaxed mb-5">{currentQuestion.question}</p>

            <div className="flex flex-col gap-3">
              {CHOICE_KEYS.map((key) => {
                const text = currentQuestion.choices[key];
                const isSelected = selected === key;
                const isCorrectChoice = key === currentQuestion.correctAnswer;
                const isUserChoice = currentAttempt?.selectedAnswer === key;

                let stateClass = "border-ink-200 hover:border-brand-300 hover:bg-brand-50/40";
                if (currentAttempt) {
                  if (isCorrectChoice) stateClass = "border-good-400 bg-good-50";
                  else if (isUserChoice) stateClass = "border-bad-400 bg-bad-50";
                  else stateClass = "border-ink-150 opacity-60";
                } else if (isSelected) {
                  stateClass = "border-brand-500 bg-brand-50 ring-1 ring-brand-500";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`choice-${key}`}
                    disabled={!!currentAttempt}
                    onClick={() => setSelected(key)}
                    className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors ${stateClass} disabled:cursor-default`}
                  >
                    <span
                      className={`shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                        currentAttempt
                          ? isCorrectChoice
                            ? "border-good-500 bg-good-500 text-white"
                            : isUserChoice
                            ? "border-bad-500 bg-bad-500 text-white"
                            : "border-ink-200 text-ink-400"
                          : isSelected
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-ink-300 text-ink-500"
                      }`}
                    >
                      {key}
                    </span>
                    <span className="text-sm text-ink-800 leading-relaxed pt-0.5">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showFeedback && currentAttempt && (
            <div className="card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {currentAttempt.correct ? (
                  <span className="text-good-700 font-semibold text-base flex items-center gap-1.5">Correct &#10003;</span>
                ) : (
                  <span className="text-bad-700 font-semibold text-base">Incorrect</span>
                )}
                <span className="text-sm text-ink-500">
                  Correct Answer: <span className="font-semibold text-ink-800">{currentQuestion.correctAnswer}</span>
                </span>
              </div>
              <Accordion title="Why this answer is correct" defaultOpen tone="good">
                {currentQuestion.rationale.whyCorrect}
              </Accordion>
              {currentQuestion.rationale.whyIncorrect && (
                <Accordion title="Why the other choices are incorrect" tone="bad">
                  {currentQuestion.rationale.whyIncorrect}
                </Accordion>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button className="btn-secondary" onClick={goPrev} disabled={index === 0}>
              <IconChevronLeft width={16} height={16} />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {!currentAttempt ? (
                <button className="btn-primary" onClick={handleSubmit} disabled={!selected}>
                  Submit Answer
                </button>
              ) : (feedbackMode === "immediate" ? (
                <button className="btn-primary" onClick={goNext}>
                  {isLast ? "Finish & See Results" : "Next Question"}
                  {!isLast && <IconChevronRight width={16} height={16} />}
                </button>
              ) : null)}
              {!currentAttempt && feedbackMode === "end" && (
                <button className="btn-ghost" onClick={goNext} disabled={isLast && !currentAttempt}>
                  Skip
                  <IconChevronRight width={16} height={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  index,
  total,
  question,
  timed,
  elapsedMs,
  flagged,
  onFlag,
}: {
  index: number;
  total: number;
  question: NonNullable<ReturnType<typeof getQuestion>>;
  timed: boolean;
  elapsedMs: number;
  flagged: boolean;
  onFlag: () => void;
}) {
  const pct = ((index + 1) / total) * 100;
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <div className="card px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm font-semibold text-ink-900">
          Question {index + 1} of {total}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-ink-100 text-ink-700">{question.skill}</span>
          <span className="badge bg-ink-100 text-ink-700">{question.problemType}</span>
          <DifficultyBadge difficulty={question.difficulty} />
          {timed && (
            <span className="badge bg-ink-100 text-ink-700 tabular-nums">
              <IconClock width={13} height={13} />
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          )}
          <button
            type="button"
            onClick={onFlag}
            className={`badge border transition-colors ${
              flagged ? "bg-warn-500 border-warn-500 text-white" : "bg-white border-ink-200 text-ink-500 hover:border-warn-300"
            }`}
          >
            <IconFlag width={12} height={12} />
            {flagged ? "Flagged" : "Flag for Review"}
          </button>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
