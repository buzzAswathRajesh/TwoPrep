import type { AppState } from "./types";

const STORAGE_KEY = "sat-rw-practice:v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: [], sessions: [], flags: {} };
    const parsed = JSON.parse(raw) as AppState;
    return {
      attempts: parsed.attempts ?? [],
      sessions: parsed.sessions ?? [],
      flags: parsed.flags ?? {},
    };
  } catch {
    return { attempts: [], sessions: [], flags: {} };
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private browsing quota, etc.) — fail silently
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
