import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateContext";
import type { PracticeMode, PracticeSessionConfig } from "../lib/types";

export function useStartPractice() {
  const { startSession } = useAppState();
  const navigate = useNavigate();

  return function start(params: { mode: PracticeMode; label: string; questionIds: string[]; config?: Partial<PracticeSessionConfig> }) {
    if (params.questionIds.length === 0) return;
    const session = startSession(params);
    navigate(`/practice/${session.sessionId}`);
  };
}
