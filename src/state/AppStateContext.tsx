import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import { makeId } from "../lib/id";
import type { AppState, Attempt, ChoiceKey, PracticeMode, PracticeSession, PracticeSessionConfig } from "../lib/types";

interface AppStateContextValue {
  state: AppState;
  recordAttempt: (params: {
    questionId: string;
    selectedAnswer: ChoiceKey;
    correct: boolean;
    timeSpentMs: number;
    sessionId: string;
  }) => Attempt;
  toggleFlag: (questionId: string) => void;
  isFlagged: (questionId: string) => boolean;
  startSession: (params: { mode: PracticeMode; label: string; questionIds: string[]; config?: Partial<PracticeSessionConfig> }) => PracticeSession;
  endSession: (sessionId: string) => void;
  getSession: (sessionId: string) => PracticeSession | undefined;
  resetAllProgress: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const recordAttempt: AppStateContextValue["recordAttempt"] = useCallback((params) => {
    const attempt: Attempt = {
      attemptId: makeId("att"),
      questionId: params.questionId,
      selectedAnswer: params.selectedAnswer,
      correct: params.correct,
      timestamp: Date.now(),
      timeSpentMs: params.timeSpentMs,
      sessionId: params.sessionId,
    };
    setState((prev) => ({ ...prev, attempts: [...prev.attempts, attempt] }));
    return attempt;
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setState((prev) => {
      const flags = { ...prev.flags };
      if (flags[questionId]) delete flags[questionId];
      else flags[questionId] = Date.now();
      return { ...prev, flags };
    });
  }, []);

  const isFlagged = useCallback((questionId: string) => !!state.flags[questionId], [state.flags]);

  const startSession: AppStateContextValue["startSession"] = useCallback((params) => {
    const session: PracticeSession = {
      sessionId: makeId("sess"),
      mode: params.mode,
      label: params.label,
      startTime: Date.now(),
      endTime: null,
      questionIds: params.questionIds,
      config: params.config ?? {},
    };
    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
    return session;
  }, []);

  const endSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.sessionId === sessionId ? { ...s, endTime: Date.now() } : s)),
    }));
  }, []);

  const getSession = useCallback((sessionId: string) => state.sessions.find((s) => s.sessionId === sessionId), [state.sessions]);

  const resetAllProgress = useCallback(() => {
    setState({ attempts: [], sessions: [], flags: {} });
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({ state, recordAttempt, toggleFlag, isFlagged, startSession, endSession, getSession, resetAllProgress }),
    [state, recordAttempt, toggleFlag, isFlagged, startSession, endSession, getSession, resetAllProgress]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
