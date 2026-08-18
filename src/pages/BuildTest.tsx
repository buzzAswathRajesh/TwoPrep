import React, { useMemo, useState } from "react";
import { ALL_DIFFICULTIES, ALL_PROBLEM_TYPES, ALL_SKILLS, QUESTIONS } from "../lib/questions";
import { buildCustomTest, buildWeakAreasSet } from "../lib/practiceEngine";
import { useStartPractice } from "../hooks/useStartPractice";
import { useAppState } from "../state/AppStateContext";
import { SectionHeading } from "../components/UI";
import type { Difficulty, PracticeSessionConfig, ProblemType, Skill } from "../lib/types";

const PRESET_COUNTS = [5, 10, 15, 20, 27];

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="h-7 w-7 rounded-full bg-brand-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {step}
        </span>
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange, sub }: { label: string; checked: boolean; onChange: () => void; sub?: string }) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
      />
      <span>
        <span className="text-sm text-ink-800 group-hover:text-ink-950">{label}</span>
        {sub && <span className="block text-xs text-ink-400">{sub}</span>}
      </span>
    </label>
  );
}

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <div>
        <div className="text-sm font-medium text-ink-800">{label}</div>
        {sub && <div className="text-xs text-ink-500">{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-ink-200"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function BuildTest() {
  const { state } = useAppState();
  const start = useStartPractice();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [countMode, setCountMode] = useState<number | "custom">(10);
  const [customCount, setCustomCount] = useState(25);
  const [distribution, setDistribution] = useState<"balanced" | "custom">("balanced");
  const [customDist, setCustomDist] = useState<Record<string, number>>({});
  const [timed, setTimed] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<"immediate" | "end">("immediate");
  const [includePrevious, setIncludePrevious] = useState(true);
  const [prioritizeIncorrect, setPrioritizeIncorrect] = useState(false);
  const [randomize, setRandomize] = useState(true);

  const questionCount = countMode === "custom" ? customCount : countMode;

  const categoryKeys = skills.length > 0 ? skills : problemTypes.length > 0 ? problemTypes : [];

  const matchingCount = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (skills.length > 0 && !skills.includes(q.skill)) return false;
      if (problemTypes.length > 0 && !problemTypes.includes(q.problemType)) return false;
      if (difficulties.length > 0 && !difficulties.includes(q.difficulty)) return false;
      return true;
    }).length;
  }, [skills, problemTypes, difficulties]);

  function toggleInArray<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function startTest() {
    const config: PracticeSessionConfig = {
      skills,
      problemTypes,
      difficulties,
      questionCount,
      distribution,
      customDistribution: distribution === "custom" ? customDist : undefined,
      timed,
      feedbackMode,
      includePreviouslyAnswered: includePrevious,
      prioritizeIncorrect,
      randomizeOrder: randomize,
    };
    const ids = buildCustomTest(config, state.attempts);
    start({ mode: "custom-test", label: "Custom Practice Test", questionIds: ids, config });
  }

  function startWeakAreas() {
    const ids = buildWeakAreasSet(state.attempts, 10);
    start({ mode: "weak-areas", label: "Practice My Weak Areas", questionIds: ids });
  }

  const customDistTotal = Object.values(customDist).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">Build a Practice Test</h1>
        <p className="text-ink-500 mt-1">Choose exactly what you want to practice.</p>
      </div>

      <div className="card p-5 bg-brand-50/60 border-brand-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold text-ink-900">Not sure where to start?</div>
          <div className="text-sm text-ink-600">Let us build a set weighted toward your weakest areas.</div>
        </div>
        <button className="btn-primary shrink-0" onClick={startWeakAreas}>
          Practice My Weak Areas
        </button>
      </div>

      <StepCard step={1} title="Select Skills">
        <button className="text-xs font-medium text-brand-600 hover:underline mb-2" onClick={() => setSkills(skills.length === ALL_SKILLS.length ? [] : [...ALL_SKILLS])}>
          {skills.length === ALL_SKILLS.length ? "Deselect All" : "Select All"}
        </button>
        <div className="grid sm:grid-cols-2 gap-x-6">
          {ALL_SKILLS.map((s) => (
            <Checkbox key={s} label={s} checked={skills.includes(s)} onChange={() => toggleInArray(skills, setSkills, s)} />
          ))}
        </div>
      </StepCard>

      <StepCard step={2} title="Select Problem Types">
        <button
          className="text-xs font-medium text-brand-600 hover:underline mb-2"
          onClick={() => setProblemTypes(problemTypes.length === ALL_PROBLEM_TYPES.length ? [] : [...ALL_PROBLEM_TYPES])}
        >
          {problemTypes.length === ALL_PROBLEM_TYPES.length ? "Deselect All" : "Select All"}
        </button>
        <div className="grid sm:grid-cols-2 gap-x-6">
          {ALL_PROBLEM_TYPES.map((p) => (
            <Checkbox key={p} label={p} checked={problemTypes.includes(p)} onChange={() => toggleInArray(problemTypes, setProblemTypes, p)} />
          ))}
        </div>
      </StepCard>

      <StepCard step={3} title="Select Difficulty">
        <div className="flex gap-6">
          {ALL_DIFFICULTIES.map((d) => (
            <Checkbox key={d} label={d} checked={difficulties.includes(d)} onChange={() => toggleInArray(difficulties, setDifficulties, d)} />
          ))}
        </div>
      </StepCard>

      <StepCard step={4} title="Number of Questions">
        <div className="flex flex-wrap gap-2">
          {PRESET_COUNTS.map((c) => (
            <button key={c} className={countMode === c ? "chip-on" : "chip-off"} onClick={() => setCountMode(c)}>
              {c}
            </button>
          ))}
          <button className={countMode === "custom" ? "chip-on" : "chip-off"} onClick={() => setCountMode("custom")}>
            Custom
          </button>
          {countMode === "custom" && (
            <input
              type="number"
              min={1}
              max={150}
              value={customCount}
              onChange={(e) => setCustomCount(Math.max(1, Math.min(150, Number(e.target.value) || 1)))}
              className="input w-24"
            />
          )}
        </div>
        <p className="text-xs text-ink-500 mt-3">{matchingCount} questions match your current skill/type/difficulty selection.</p>
      </StepCard>

      <StepCard step={5} title="Question Distribution">
        <div className="flex gap-2 mb-4">
          <button className={distribution === "balanced" ? "chip-on" : "chip-off"} onClick={() => setDistribution("balanced")}>
            Balanced
          </button>
          <button className={distribution === "custom" ? "chip-on" : "chip-off"} onClick={() => setDistribution("custom")} disabled={categoryKeys.length === 0}>
            Custom
          </button>
        </div>
        {distribution === "balanced" ? (
          <p className="text-sm text-ink-500">Questions will be spread as evenly as possible across your selected skills or problem types.</p>
        ) : categoryKeys.length === 0 ? (
          <p className="text-sm text-ink-500">Select at least one skill or problem type above to customize the distribution.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {categoryKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-ink-700">{key}</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={customDist[key] ?? 0}
                  onChange={(e) => setCustomDist((prev) => ({ ...prev, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                  className="input w-20"
                />
              </div>
            ))}
            <div className="text-xs text-ink-500 pt-1 border-t border-ink-100">Total: {customDistTotal} questions</div>
          </div>
        )}
      </StepCard>

      <StepCard step={6} title="Test Settings">
        <div className="divide-y divide-ink-100">
          <Toggle label="Timed" sub="Show an elapsed timer during practice" checked={timed} onChange={() => setTimed((v) => !v)} />
          <Toggle
            label="Show feedback after each question"
            sub="Turn off to reveal answers only at the end"
            checked={feedbackMode === "immediate"}
            onChange={() => setFeedbackMode((v) => (v === "immediate" ? "end" : "immediate"))}
          />
          <Toggle
            label="Include previously answered questions"
            sub="Turn off to only see questions you haven't tried yet"
            checked={includePrevious}
            onChange={() => setIncludePrevious((v) => !v)}
          />
          <Toggle
            label="Prioritize questions answered incorrectly"
            sub="Surface past mistakes first within your selection"
            checked={prioritizeIncorrect}
            onChange={() => setPrioritizeIncorrect((v) => !v)}
          />
          <Toggle label="Randomize question order" checked={randomize} onChange={() => setRandomize((v) => !v)} />
        </div>
      </StepCard>

      <div className="flex justify-center pb-4">
        <button className="btn-primary !px-10 !py-3.5 !text-base shadow-pop" onClick={startTest}>
          Start Practice Test
        </button>
      </div>
    </div>
  );
}
